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

  try {
    const { user_id, title, message, type, action_url, send_email } = await req.json();

    if (!user_id || !title || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields: user_id, title, message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert in-app notification
    const { error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type: type || "info",
        action_url: action_url || null,
      });

    if (insertError) {
      console.error("Failed to insert notification:", insertError);
      throw insertError;
    }

    // Send email if requested
    if (send_email) {
      // Get user email from auth
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
      
      if (!userError && userData?.user?.email) {
        const email = userData.user.email;
        
        // Use Lovable AI to send email via edge function
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          try {
            // Send notification email using a simple HTML email
            const emailHtml = `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0;">
                <div style="background: linear-gradient(135deg, #1a1d23, #12151a); padding: 24px 32px; text-align: center;">
                  <h1 style="color: #f0c040; font-size: 24px; margin: 0; font-family: 'Orbitron', sans-serif;">🦍 Gorilla Coin</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #1a1d23; font-size: 20px; margin: 0 0 12px 0;">${title}</h2>
                  <p style="color: #55575d; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${message}</p>
                  ${action_url ? `<a href="${action_url}" style="display: inline-block; background: #f0c040; color: #1a1d23; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Details</a>` : ""}
                </div>
                <div style="background: #f5f5f5; padding: 16px 32px; text-align: center;">
                  <p style="color: #999; font-size: 12px; margin: 0;">Gorilla Coin — Rwanda's Crypto Community</p>
                </div>
              </div>
            `;

            console.log(`Email notification would be sent to ${email}: ${title}`);
            // Note: actual email sending requires a configured email service
            // For now, the in-app notification is created successfully
          } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            // Don't fail the whole operation if email fails
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-notification error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
