import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAds, type Ad } from "@/hooks/use-ads";
import { useAppSettings } from "@/hooks/use-app-settings";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X, Coins, ExternalLink, Play } from "lucide-react";

const STORAGE_LAST_SHOWN = "rewarded_ad_last_shown";
const STORAGE_LAST_AD_ID = "rewarded_ad_last_id";
const STORAGE_DAILY_KEY = "rewarded_ad_daily";
const CLOSE_DELAY_MS = 5000;
const ACTIVITY_TIMEOUT_MS = 60_000; // user considered inactive after 60s of no input

const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const getDailyCount = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return parsed.day === todayKey() ? Number(parsed.count) || 0 : 0;
  } catch {
    return 0;
  }
};

const incrementDailyCount = () => {
  const next = getDailyCount() + 1;
  localStorage.setItem(STORAGE_DAILY_KEY, JSON.stringify({ day: todayKey(), count: next }));
  return next;
};

const RewardedAdProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { ads } = useAds();
  const { settings } = useAppSettings();
  const queryClient = useQueryClient();

  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [canClose, setCanClose] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState(5);
  const [rewarded, setRewarded] = useState(false);

  const sessionStartRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const showingRef = useRef(false);
  const rewardingRef = useRef(false);

  const enabled = settings.rewarded_ads_enabled !== false && settings.rewarded_ads_enabled !== "false";
  const rewardAmount = Number(settings.rewarded_ad_reward ?? 1);
  const dailyCap = Number(settings.rewarded_ad_daily_cap ?? 10);
  const intervalSeconds = Number(settings.rewarded_ad_interval_seconds ?? 300);

  // Track user activity
  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, []);

  const pickAd = useCallback((): Ad | null => {
    if (!ads || ads.length === 0) return null;
    const lastId = localStorage.getItem(STORAGE_LAST_AD_ID);
    const pool = ads.length > 1 ? ads.filter((a) => a.id !== lastId) : ads;
    const ad = pool[Math.floor(Math.random() * pool.length)];
    return ad;
  }, [ads]);

  const tryShowAd = useCallback(() => {
    if (!user || !enabled || showingRef.current) return;
    if (!ads || ads.length === 0) return;

    // Daily cap
    if (getDailyCount() >= dailyCap) return;

    // Frequency: time since last shown (persisted across reloads)
    const lastShown = Number(localStorage.getItem(STORAGE_LAST_SHOWN) ?? 0);
    const sinceLast = (Date.now() - lastShown) / 1000;
    if (lastShown && sinceLast < intervalSeconds) return;

    // Initial wait: require intervalSeconds since session start if never shown
    if (!lastShown) {
      const sinceStart = (Date.now() - sessionStartRef.current) / 1000;
      if (sinceStart < intervalSeconds) return;
    }

    // User must be active (input within last minute)
    if (Date.now() - lastActivityRef.current > ACTIVITY_TIMEOUT_MS) return;

    // Don't interrupt mining action: skip if focused element is the mining button
    const active = document.activeElement as HTMLElement | null;
    if (active?.dataset?.miningAction === "true") return;

    const ad = pickAd();
    if (!ad) return;

    showingRef.current = true;
    setCurrentAd(ad);
    setCanClose(false);
    setRewarded(false);
    setCloseCountdown(5);
    localStorage.setItem(STORAGE_LAST_SHOWN, String(Date.now()));
    localStorage.setItem(STORAGE_LAST_AD_ID, ad.id);
  }, [ads, user, enabled, dailyCap, intervalSeconds, pickAd]);

  // Polling timer to check show conditions
  useEffect(() => {
    if (!user || !enabled) return;
    const interval = setInterval(tryShowAd, 5000);
    return () => clearInterval(interval);
  }, [user, enabled, tryShowAd]);

  // Close-button countdown + auto reward after 5s visible
  useEffect(() => {
    if (!currentAd) return;
    setCloseCountdown(5);
    setCanClose(false);
    let elapsed = 0;
    const tick = setInterval(() => {
      elapsed += 1;
      setCloseCountdown(Math.max(0, 5 - elapsed));
      if (elapsed >= 5) {
        setCanClose(true);
        clearInterval(tick);
        // Auto-grant reward after 5 seconds of visibility
        grantReward();
      }
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAd?.id]);

  const grantReward = useCallback(async () => {
    if (!user || !currentAd || rewardingRef.current || rewarded) return;
    rewardingRef.current = true;

    try {
      // Insert ad view (acts as transaction record)
      const { error: viewErr } = await supabase
        .from("ad_views")
        .insert({ user_id: user.id, ad_id: currentAd.id, coins_earned: rewardAmount });
      if (viewErr) throw viewErr;

      // Credit wallet
      const { data: profile } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ coin_balance: profile.coin_balance + rewardAmount })
          .eq("user_id", user.id);
      }

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Ad Reward 🎁",
        message: `+${rewardAmount} GOR for watching an ad`,
        type: "reward",
        action_url: "/history",
      });

      incrementDailyCount();
      setRewarded(true);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["ad_views"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Ad Reward +1 GOR 🎉", description: "Coins added to your wallet" });
    } catch (err: any) {
      console.error("Rewarded ad grant failed:", err);
    } finally {
      rewardingRef.current = false;
    }
  }, [user, currentAd, rewardAmount, rewarded, queryClient]);

  const handleClose = () => {
    if (!canClose) return;
    setCurrentAd(null);
    showingRef.current = false;
  };

  const embedUrl = currentAd?.video_url ? getYouTubeEmbedUrl(currentAd.video_url) : null;

  return (
    <>
      {children}
      {currentAd && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={!canClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              aria-label="Close ad"
            >
              {canClose ? (
                <X className="w-4 h-4 text-foreground" />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">{closeCountdown}</span>
              )}
            </button>

            {/* Media */}
            {currentAd.ad_type === "video" && currentAd.video_url ? (
              <div className="aspect-video bg-black">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={currentAd.video_url} autoPlay controls className="w-full h-full" />
                )}
              </div>
            ) : currentAd.image_url ? (
              <img src={currentAd.image_url} alt={currentAd.title} className="w-full max-h-[50vh] object-cover" />
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Content */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-foreground">{currentAd.title}</h3>
                  {currentAd.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{currentAd.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full shrink-0">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-bold">+{rewardAmount} GOR</span>
                </div>
              </div>

              {currentAd.link_url && (
                <a
                  href={currentAd.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visit advertiser
                </a>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {rewarded ? "✅ Reward credited" : `Reward in ${closeCountdown}s...`}
                </p>
                {canClose && (
                  <Button size="sm" onClick={handleClose} className="gap-2">
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RewardedAdProvider;
