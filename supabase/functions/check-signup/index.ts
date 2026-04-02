const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { z } from "https://esm.sh/zod@3.25.76";

const BodySchema = z.object({
  email: z.string().email().max(255),
  phone: z.string().max(20).optional().default(""),
  fingerprint: z.string().max(128).optional().default(""),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, phone, fingerprint } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check uniqueness via the DB function
    const { data, error } = await supabase.rpc("check_signup_uniqueness", {
      _email: email,
      _phone: phone,
      _fingerprint: fingerprint,
    });

    if (error) throw error;

    // Log the signup attempt
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const blocked = !data.allowed;
    let blockReason = null;
    if (data.phone_exists) blockReason = "Phone number already registered";
    else if (data.device_exists) blockReason = "Device already has an account";

    await supabase.from("signup_attempts").insert({
      email,
      phone: phone || null,
      ip_address: ip,
      fingerprint: fingerprint || null,
      blocked,
      block_reason: blockReason,
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
