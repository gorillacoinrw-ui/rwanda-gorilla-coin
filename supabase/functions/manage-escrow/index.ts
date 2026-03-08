import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get user from auth header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Helper: send notification
  async function notify(userId: string, title: string, message: string, type: string, actionUrl?: string) {
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl || null,
      });
      // Also try to send email
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${anonKey}` },
          body: JSON.stringify({ user_id: userId, title, message, type, action_url: actionUrl, send_email: true }),
        });
      } catch { /* email is best-effort */ }
    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  const { action, trade_id, trade_data } = await req.json();

  // Helper: check if trading is still active (3-month window)
  async function isTradingActive(): Promise<{ active: boolean; message?: string }> {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "trading_start_date")
      .single();
    if (!data) return { active: true };
    const startDate = new Date(String(data.value));
    const threeMonthsLater = new Date(startDate);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    if (new Date() > threeMonthsLater) {
      return { active: false, message: `Trading ended on ${threeMonthsLater.toLocaleDateString()}. The 3-month trading window has closed.` };
    }
    return { active: true };
  }

  try {
    // ===== CREATE ORDER (with coin locking for sell orders) =====
    if (action === "create") {
      const trading = await isTradingActive();
      if (!trading.active) {
        return new Response(JSON.stringify({ error: trading.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { trade_type, amount, price_rwf, payment_method, payment_details, min_amount, max_amount } = trade_data;

      if (trade_type === "sell") {
        // Lock coins from seller's balance at creation time
        const { data: sellerProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("coin_balance")
          .eq("user_id", user.id)
          .single();

        if (profileErr || !sellerProfile) {
          return new Response(JSON.stringify({ error: "Could not fetch your profile" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (sellerProfile.coin_balance < amount) {
          return new Response(JSON.stringify({ error: `Insufficient balance. You have ${sellerProfile.coin_balance} GOR but need ${amount} GOR.` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Deduct coins (lock them)
        const { error: deductErr } = await supabase
          .from("profiles")
          .update({ coin_balance: sellerProfile.coin_balance - amount })
          .eq("user_id", user.id);

        if (deductErr) {
          return new Response(JSON.stringify({ error: "Failed to lock coins" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create the trade
      const { data: newTrade, error: insertErr } = await supabase
        .from("trades")
        .insert([{
          seller_id: user.id,
          trade_type,
          amount,
          price_rwf,
          payment_method,
          payment_details,
          min_amount: min_amount || 1,
          max_amount: max_amount || amount,
        }])
        .select()
        .single();

      if (insertErr) {
        // If insert failed and we already deducted coins, refund
        if (trade_type === "sell") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("coin_balance")
            .eq("user_id", user.id)
            .single();
          if (profile) {
            await supabase.from("profiles")
              .update({ coin_balance: profile.coin_balance + amount })
              .eq("user_id", user.id);
          }
        }
        throw insertErr;
      }

      console.log(`Trade created: ${newTrade.id}, type: ${trade_type}, amount: ${amount}. Coins ${trade_type === "sell" ? "locked" : "not locked"}.`);

      return new Response(JSON.stringify({ success: true, trade: newTrade }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== ACCEPT =====
    if (action === "accept") {
      const trading = await isTradingActive();
      if (!trading.active) {
        return new Response(JSON.stringify({ error: trading.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: trade, error: fetchErr } = await supabase
        .from("trades")
        .select("*")
        .eq("id", trade_id)
        .eq("status", "open")
        .single();

      if (fetchErr || !trade) {
        return new Response(JSON.stringify({ error: "Trade not found or already taken" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (trade.seller_id === user.id) {
        return new Response(JSON.stringify({ error: "Cannot accept your own trade" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

      const updateData: Record<string, unknown> = {
        status: "escrow",
        buyer_id: user.id,
        escrow_started_at: new Date().toISOString(),
        expires_at: expiresAt,
      };

      const { error: updateErr } = await supabase
        .from("trades")
        .update(updateData)
        .eq("id", trade_id);

      if (updateErr) throw updateErr;

      // Notify seller that their trade was accepted
      await notify(
        trade.seller_id,
        "Trade Accepted! ⏱️",
        `A buyer has accepted your ${trade.trade_type} order for ${trade.amount} GOR. Escrow started (20 min).`,
        "trade",
        "/trade"
      );

      return new Response(JSON.stringify({ success: true, expires_at: expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== CONFIRM =====
    if (action === "confirm") {
      const { data: trade, error: fetchErr } = await supabase
        .from("trades")
        .select("*")
        .eq("id", trade_id)
        .eq("status", "escrow")
        .single();

      if (fetchErr || !trade) {
        return new Response(JSON.stringify({ error: "Trade not in escrow" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (trade.trade_type === "sell" && trade.seller_id !== user.id) {
        return new Response(JSON.stringify({ error: "Only the seller can confirm" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate 25% tax
      const taxAmount = Math.floor(trade.amount * 0.25);
      const buyerReceives = trade.amount - taxAmount;

      // Credit buyer with coins (minus tax)
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("user_id", trade.buyer_id)
        .single();

      if (buyerProfile) {
        await supabase
          .from("profiles")
          .update({ coin_balance: buyerProfile.coin_balance + buyerReceives })
          .eq("user_id", trade.buyer_id);
      }

      // Add tax to tax pool
      const { data: poolSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "tax_pool_balance")
        .single();
      
      const currentPool = Number(poolSetting?.value ?? 0);
      await supabase
        .from("app_settings")
        .update({ value: currentPool + taxAmount })
        .eq("key", "tax_pool_balance");

      // Update trade
      await supabase
        .from("trades")
        .update({ status: "completed", tax_amount: taxAmount })
        .eq("id", trade_id);

      // Record tax
      await supabase
        .from("tax_records")
        .insert({ trade_id: trade.id, amount: taxAmount });

      console.log(`Trade ${trade.id} completed. Tax: ${taxAmount} GOR added to pool. Buyer receives: ${buyerReceives} GOR.`);

      return new Response(JSON.stringify({ success: true, tax: taxAmount, received: buyerReceives }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== CANCEL =====
    if (action === "cancel") {
      const { data: trade, error: fetchErr } = await supabase
        .from("trades")
        .select("*")
        .eq("id", trade_id)
        .single();

      if (fetchErr || !trade) {
        return new Response(JSON.stringify({ error: "Trade not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (["completed", "cancelled", "expired"].includes(trade.status)) {
        return new Response(JSON.stringify({ error: "Trade already finalized, cannot cancel" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isSeller = trade.seller_id === user.id;
      const isBuyer = trade.buyer_id === user.id;
      if (!isSeller && !isBuyer) {
        return new Response(JSON.stringify({ error: "Only trade participants can cancel" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For open orders, only seller can cancel
      if (trade.status === "open" && !isSeller) {
        return new Response(JSON.stringify({ error: "Only the order creator can cancel an open order" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Refund coins for sell orders (locked at creation)
      if (trade.trade_type === "sell") {
        // Check if this was a founder tax sell order by seeing if the seller is admin
        // and if the coins came from the tax pool (seller balance wasn't deducted)
        const { data: sellerRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", trade.seller_id)
          .eq("role", "admin")
          .maybeSingle();

        // Check if the trade amount was deducted from tax pool (founder sell)
        // by looking if the trade was created via founder_sell_tax
        // Founder tax sells: refund to tax pool, not to personal balance
        const { data: poolSetting } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "tax_pool_balance")
          .single();

        // If the seller is an admin and the trade has no buyer yet (open) or is in escrow,
        // check if coins should go back to pool. We identify founder tax trades by checking 
        // if the seller's balance was NOT reduced (i.e., coins came from tax pool).
        // Simple heuristic: if seller is admin, refund to tax pool.
        if (sellerRole) {
          // Founder tax order — refund to tax pool
          const currentPool = Number(poolSetting?.value ?? 0);
          await supabase
            .from("app_settings")
            .update({ value: currentPool + trade.amount })
            .eq("key", "tax_pool_balance");
          console.log(`Refunded ${trade.amount} GOR to tax pool. New pool: ${currentPool + trade.amount}`);
        } else {
          // Regular sell order — refund to seller's personal balance
          const { data: sellerProfile, error: profileErr } = await supabase
            .from("profiles")
            .select("coin_balance")
            .eq("user_id", trade.seller_id)
            .single();

          if (profileErr) {
            console.error("Failed to fetch seller profile for refund:", profileErr);
            return new Response(JSON.stringify({ error: "Failed to process refund" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if (sellerProfile) {
            const newBalance = sellerProfile.coin_balance + trade.amount;
            const { error: refundErr } = await supabase
              .from("profiles")
              .update({ coin_balance: newBalance })
              .eq("user_id", trade.seller_id);

            if (refundErr) {
              console.error("Failed to refund seller:", refundErr);
              return new Response(JSON.stringify({ error: "Failed to refund coins" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            console.log(`Refunded ${trade.amount} GOR to seller ${trade.seller_id}. New balance: ${newBalance}`);
          }
        }
      }

      await supabase
        .from("trades")
        .update({ status: "cancelled" })
        .eq("id", trade_id)
        .eq("status", trade.status);

      return new Response(JSON.stringify({ success: true, cancelled_by: isSeller ? "seller" : "buyer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== FOUNDER SELL TAX =====
    if (action === "founder_sell_tax") {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Only admins can sell tax pool" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { amount, price_rwf, payment_method, payment_details } = trade_data;

      // Check tax pool
      const { data: poolSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "tax_pool_balance")
        .single();

      const poolBalance = Number(poolSetting?.value ?? 0);
      if (poolBalance < amount) {
        return new Response(JSON.stringify({ error: `Tax pool only has ${poolBalance} GOR. Cannot sell ${amount} GOR.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deduct from tax pool
      await supabase
        .from("app_settings")
        .update({ value: poolBalance - amount })
        .eq("key", "tax_pool_balance");

      // Create sell order (coins come from tax pool, not founder's balance)
      const { data: newTrade, error: insertErr } = await supabase
        .from("trades")
        .insert([{
          seller_id: user.id,
          trade_type: "sell",
          amount,
          price_rwf,
          payment_method: payment_method || "mtn",
          payment_details: payment_details || "",
          min_amount: 1,
          max_amount: amount,
        }])
        .select()
        .single();

      if (insertErr) {
        // Refund tax pool
        await supabase.from("app_settings")
          .update({ value: poolBalance })
          .eq("key", "tax_pool_balance");
        throw insertErr;
      }

      console.log(`Founder tax sell order created: ${newTrade.id}, amount: ${amount} GOR from tax pool.`);

      return new Response(JSON.stringify({ success: true, trade: newTrade }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== CHECK EXPIRED =====
    if (action === "check_expired") {
      const now = new Date().toISOString();
      const { data: expired } = await supabase
        .from("trades")
        .select("*")
        .eq("status", "escrow")
        .lt("expires_at", now);

      if (expired && expired.length > 0) {
        for (const trade of expired) {
          // Refund seller for sell orders
          if (trade.trade_type === "sell") {
            const { data: sellerRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", trade.seller_id)
              .eq("role", "admin")
              .maybeSingle();

            if (sellerRole) {
              // Founder tax order — refund to tax pool
              const { data: poolSetting } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "tax_pool_balance")
                .single();
              const currentPool = Number(poolSetting?.value ?? 0);
              await supabase
                .from("app_settings")
                .update({ value: currentPool + trade.amount })
                .eq("key", "tax_pool_balance");
            } else {
              // Regular sell order — refund to seller
              const { data: sellerProfile } = await supabase
                .from("profiles")
                .select("coin_balance")
                .eq("user_id", trade.seller_id)
                .single();

              if (sellerProfile) {
                await supabase
                  .from("profiles")
                  .update({ coin_balance: sellerProfile.coin_balance + trade.amount })
                  .eq("user_id", trade.seller_id);
              }
            }
          }

          await supabase
            .from("trades")
            .update({ status: "expired" })
            .eq("id", trade.id);
        }
      }

      return new Response(JSON.stringify({ success: true, expired_count: expired?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-escrow error:", err);
    const message = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err) ? (err as { message: string }).message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
