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

  // Authenticate user
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

  // Verify admin role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action, ...params } = await req.json();

  try {
    // ===== ADJUST USER BALANCE =====
    if (action === "adjust_balance") {
      const { user_id, amount, reason } = params;
      if (!user_id || amount === undefined) {
        return new Response(JSON.stringify({ error: "user_id and amount required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("coin_balance, display_name")
        .eq("user_id", user_id)
        .single();

      if (pErr || !profile) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newBalance = profile.coin_balance + Number(amount);
      if (newBalance < 0) {
        return new Response(JSON.stringify({ error: `Cannot reduce below 0. Current: ${profile.coin_balance}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ coin_balance: newBalance })
        .eq("user_id", user_id);

      if (updateErr) throw updateErr;

      console.log(`Admin ${user.id} adjusted ${user_id} balance by ${amount}. New: ${newBalance}. Reason: ${reason || "N/A"}`);

      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== ADMIN CANCEL TRADE =====
    if (action === "admin_cancel_trade") {
      const { trade_id } = params;

      const { data: trade, error: fetchErr } = await supabase
        .from("trades")
        .select("*")
        .eq("id", trade_id)
        .single();

      if (fetchErr || !trade) {
        return new Response(JSON.stringify({ error: "Trade not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (["completed", "cancelled", "expired"].includes(trade.status)) {
        return new Response(JSON.stringify({ error: "Trade already finalized" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Refund coins for sell orders
      if (trade.trade_type === "sell") {
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
          console.log(`Admin refunded ${trade.amount} GOR to seller ${trade.seller_id}`);
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

    // ===== UPDATE SETTINGS =====
    if (action === "update_setting") {
      const { key, value } = params;
      if (!key) {
        return new Response(JSON.stringify({ error: "key required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert setting
      const { data: existing } = await supabase
        .from("app_settings")
        .select("key")
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key, value });
        if (error) throw error;
      }

      console.log(`Admin ${user.id} updated setting ${key} = ${JSON.stringify(value)}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== MANAGE USER ROLE =====
    if (action === "set_user_role") {
      const { user_id: targetUserId, role } = params;
      if (!targetUserId || !role) {
        return new Response(JSON.stringify({ error: "user_id and role required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["admin", "moderator", "user"].includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove existing roles, set new one
      await supabase.from("user_roles").delete().eq("user_id", targetUserId);
      const { error } = await supabase.from("user_roles").insert({ user_id: targetUserId, role });
      if (error) throw error;

      console.log(`Admin ${user.id} set role of ${targetUserId} to ${role}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-actions error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
