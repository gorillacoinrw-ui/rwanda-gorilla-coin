import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Gorilla Coin <gorillacoinrw@gmail.com>";
const APP_URL = "https://gorillacoinrw.lovable.app";
const INACTIVITY_DAYS = 7;
const REPEAT_DAYS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const now = Date.now();
    const inactivityCutoff = new Date(now - INACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const repeatCutoff = new Date(now - REPEAT_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // 1. Get all users with their last mining session
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    if (profErr) throw profErr;

    let sent = 0, skipped = 0, failed = 0;
    const results: any[] = [];

    for (const profile of profiles || []) {
      // Last mining session
      const { data: lastSession } = await supabase
        .from("mining_sessions")
        .select("started_at")
        .eq("user_id", profile.user_id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastMined = lastSession?.started_at;

      // Skip if user has mined within INACTIVITY_DAYS (or recently — stop condition)
      if (lastMined && new Date(lastMined).toISOString() > inactivityCutoff) {
        skipped++;
        continue;
      }

      // Check if we already sent a reminder recently (within REPEAT_DAYS)
      const { data: lastReminder } = await supabase
        .from("inactivity_reminders")
        .select("sent_at, reminder_count")
        .eq("user_id", profile.user_id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If a reminder was sent AFTER the user's last mining session, and it was recent — skip
      if (lastReminder) {
        const reminderTime = new Date(lastReminder.sent_at).toISOString();
        // If user mined after reminder, the count resets (handled by it being old vs lastMined)
        if (lastMined && new Date(lastMined) > new Date(lastReminder.sent_at)) {
          // They mined after last reminder — they're a fresh case, fall through
        } else if (reminderTime > repeatCutoff) {
          // Recent reminder, don't spam
          skipped++;
          continue;
        }
      }

      // Get email
      const { data: userData, error: uErr } = await supabase.auth.admin.getUserById(profile.user_id);
      if (uErr || !userData?.user?.email) {
        failed++;
        continue;
      }
      const email = userData.user.email;

      // Determine reminder count
      let reminderCount = 1;
      if (lastReminder && (!lastMined || new Date(lastMined) <= new Date(lastReminder.sent_at))) {
        reminderCount = (lastReminder.reminder_count || 0) + 1;
      }

      const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1d23,#12151a);padding:28px 32px;text-align:center;">
          <h1 style="color:#f0c040;font-size:22px;margin:0;letter-spacing:2px;">🦍 GORILLA COIN</h1>
          <p style="color:#8b8d93;font-size:12px;margin:6px 0 0;letter-spacing:1px;">RWANDA'S CRYPTO COMMUNITY</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:32px;margin:0 0 8px;">⚠️</p>
          <h2 style="color:#1a1d23;font-size:20px;margin:0 0 16px;">Your Gorilla Coin Mining is Paused</h2>
          <p style="color:#55575d;font-size:15px;line-height:1.7;margin:0 0 12px;">Hello${profile.display_name ? ` ${profile.display_name}` : ""},</p>
          <p style="color:#55575d;font-size:15px;line-height:1.7;margin:0 0 12px;">We noticed you haven't mined for the past 7 days.</p>
          <p style="color:#55575d;font-size:15px;line-height:1.7;margin:0 0 12px;">💰 You are missing out on daily Gorilla Coin rewards!</p>
          <p style="color:#55575d;font-size:15px;line-height:1.7;margin:0 0 12px;">🎁 Come back now and continue earning instantly.</p>
          <p style="color:#55575d;font-size:15px;line-height:1.7;margin:0 0 24px;">🚀 Don't fall behind — resume your mining today.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${APP_URL}/mine" style="display:inline-block;background:#f0c040;color:#1a1d23;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">⛏️ Resume Mining</a>
          </div>
        </td></tr>
        <tr><td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;margin:0;">You're receiving this because you have an account on Gorilla Coin.</p>
          <p style="color:#bbb;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} Gorilla Coin</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject: "⚠️ Your Gorilla Coin Mining is Paused",
            html,
          }),
        });
        const status = res.ok ? "sent" : "failed";
        if (res.ok) sent++; else failed++;

        // Log
        await supabase.from("inactivity_reminders").insert({
          user_id: profile.user_id,
          reminder_count: reminderCount,
          last_mining_date: lastMined || null,
          email_status: status,
        });

        // In-app notification
        if (res.ok) {
          await supabase.from("notifications").insert({
            user_id: profile.user_id,
            title: "Mining Paused ⚠️",
            message: "You haven't mined in 7 days. Come back and earn GOR coins!",
            type: "mining",
            action_url: "/mine",
          });
        }

        results.push({ user_id: profile.user_id, status, reminderCount });
      } catch (err) {
        failed++;
        console.error(`Failed for ${email}:`, err);
      }
    }

    console.log(`Inactivity reminders: sent=${sent} skipped=${skipped} failed=${failed}`);
    return new Response(
      JSON.stringify({ success: true, sent, skipped, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-inactivity-reminders error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
