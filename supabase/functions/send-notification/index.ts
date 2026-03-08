import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "Gorilla Coin <gorillacoinrw@gmail.com>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
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
    if (send_email && resendApiKey) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);

      if (!userError && userData?.user?.email) {
        const recipientEmail = userData.user.email;

        const typeEmoji: Record<string, string> = {
          trade: "💱",
          task: "✅",
          mining: "⛏️",
          referral: "🦍",
          info: "ℹ️",
        };
        const emoji = typeEmoji[type] || "🔔";

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Inter', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width: 560px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, #1a1d23, #12151a); padding: 28px 32px; text-align: center;">
          <h1 style="color: #f0c040; font-size: 22px; margin: 0; font-family: 'Orbitron', Arial, sans-serif; letter-spacing: 2px;">🦍 GORILLA COIN</h1>
          <p style="color: #8b8d93; font-size: 12px; margin: 6px 0 0; letter-spacing: 1px;">RWANDA'S CRYPTO COMMUNITY</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding: 32px;">
          <p style="font-size: 28px; margin: 0 0 8px;">${emoji}</p>
          <h2 style="color: #1a1d23; font-size: 20px; margin: 0 0 12px; font-weight: 700;">${title}</h2>
          <p style="color: #55575d; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">${message}</p>
          ${action_url ? `
          <a href="https://gorillacoin.rw${action_url}" style="display: inline-block; background: #f0c040; color: #1a1d23; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">View Details →</a>
          ` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">You're receiving this because you have an account on Gorilla Coin.</p>
          <p style="color: #bbb; font-size: 11px; margin: 8px 0 0;">© ${new Date().getFullYear()} Gorilla Coin</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: [recipientEmail],
              subject: `${emoji} ${title}`,
              html: emailHtml,
            }),
          });

          const resData = await res.json();
          if (!res.ok) {
            console.error("Resend API error:", resData);
          } else {
            console.log(`Email sent to ${recipientEmail}: ${title}`);
          }
        } catch (emailErr) {
          console.error("Email sending failed:", emailErr);
        }
      }
    } else if (send_email && !resendApiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-notification error:", err);
    const errMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
