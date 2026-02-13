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

  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
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

  const { action, trade_id } = await req.json();

  try {
    if (action === "accept") {
      // Buyer accepts a sell order (or seller accepts a buy order)
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

      // Can't accept own trade
      if (trade.seller_id === user.id) {
        return new Response(JSON.stringify({ error: "Cannot accept your own trade" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

      // If it's a sell order, the acceptor is the buyer
      // If it's a buy order, the acceptor is the seller
      const updateData: Record<string, unknown> = {
        status: "escrow",
        escrow_started_at: new Date().toISOString(),
        expires_at: expiresAt,
      };

      if (trade.trade_type === "sell") {
        updateData.buyer_id = user.id;
      } else {
        updateData.buyer_id = user.id;
      }

      const { error: updateErr } = await supabase
        .from("trades")
        .update(updateData)
        .eq("id", trade_id);

      if (updateErr) throw updateErr;

      // For sell orders: deduct coins from seller's balance (escrow hold)
      if (trade.trade_type === "sell") {
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("coin_balance")
          .eq("user_id", trade.seller_id)
          .single();

        if (!sellerProfile || sellerProfile.coin_balance < trade.amount) {
          // Revert trade
          await supabase.from("trades").update({ status: "open", buyer_id: null, escrow_started_at: null, expires_at: null }).eq("id", trade_id);
          return new Response(JSON.stringify({ error: "Seller has insufficient balance" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await supabase
          .from("profiles")
          .update({ coin_balance: sellerProfile.coin_balance - trade.amount })
          .eq("user_id", trade.seller_id);
      }

      return new Response(JSON.stringify({ success: true, expires_at: expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm") {
      // Seller confirms payment received → release coins to buyer
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

      // Only seller can confirm for sell orders
      if (trade.trade_type === "sell" && trade.seller_id !== user.id) {
        return new Response(JSON.stringify({ error: "Only the seller can confirm" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate 25% tax
      const taxAmount = Math.floor(trade.amount * 0.25);
      const buyerReceives = trade.amount - taxAmount;

      // Credit buyer
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

      // Update trade
      await supabase
        .from("trades")
        .update({ status: "completed", tax_amount: taxAmount })
        .eq("id", trade_id);

      // Record tax
      await supabase
        .from("tax_records")
        .insert({ trade_id: trade.id, amount: taxAmount });

      return new Response(JSON.stringify({ success: true, tax: taxAmount, received: buyerReceives }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

      if (trade.status === "escrow") {
        // Refund seller
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

      await supabase
        .from("trades")
        .update({ status: "cancelled" })
        .eq("id", trade_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_expired") {
      // Auto-cancel expired escrow trades
      const now = new Date().toISOString();
      const { data: expired } = await supabase
        .from("trades")
        .select("*")
        .eq("status", "escrow")
        .lt("expires_at", now);

      if (expired && expired.length > 0) {
        for (const trade of expired) {
          // Refund seller
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
