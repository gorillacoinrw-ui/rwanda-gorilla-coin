import AppLayout from "@/components/AppLayout";
import { useAds } from "@/hooks/use-ads";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tv, Play, ExternalLink, CheckCircle, Coins, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Ad } from "@/hooks/use-ads";

const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const AdCard = ({
  ad,
  viewed,
  canWatch,
  onWatch,
  isWatching,
}: {
  ad: Ad;
  viewed: boolean;
  canWatch: boolean;
  onWatch: (ad: Ad) => void;
  isWatching: boolean;
}) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg">
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} className="w-full h-36 sm:h-44 md:h-48 lg:h-52 object-cover" />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-foreground">{ad.title}</h3>
            {ad.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ad.description}</p>
            )}
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0 text-xs">
            +{ad.coin_reward} GOR
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize">
            {ad.ad_type === "text_image" ? "Text + Image" : ad.ad_type}
          </Badge>
          {ad.ad_type === "video" && <Play className="w-3 h-3 text-muted-foreground" />}
        </div>

        {viewed ? (
          <Button variant="outline" className="w-full gap-2 text-green-500 border-green-500/30" disabled>
            <CheckCircle className="w-4 h-4" />
            Watched — Coins earned
          </Button>
        ) : (
          <Button
            className="w-full gap-2"
            disabled={!canWatch || isWatching}
            onClick={() => onWatch(ad)}
          >
            <Eye className="w-4 h-4" />
            {canWatch ? "Watch & Earn" : "Daily limit reached"}
          </Button>
        )}
      </div>
    </div>
  );
};

const Ads = () => {
  const { ads, isLoading, viewedAdIds, canViewMore, remainingToday, watchAd, dailyLimit, todayViewCount } = useAds();
  const [viewingAd, setViewingAd] = useState<Ad | null>(null);
  const [watchTimer, setWatchTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const handleWatch = (ad: Ad) => {
    setViewingAd(ad);
    setWatchTimer(ad.ad_type === "video" ? 15 : 5);
    setTimerActive(true);

    const interval = setInterval(() => {
      setWatchTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const claimReward = () => {
    if (!viewingAd) return;
    watchAd.mutate(
      { adId: viewingAd.id, reward: viewingAd.coin_reward },
      { onSuccess: () => setViewingAd(null) }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tv className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Watch & Earn</h1>
              <p className="text-xs text-muted-foreground">Watch ads to earn Gorilla Coins</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-bold">{todayViewCount}/{dailyLimit}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{remainingToday} left today</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading ads...</p>
        ) : ads.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Tv className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No ads available right now</p>
            <p className="text-xs text-muted-foreground">Check back later for new earning opportunities!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                viewed={viewedAdIds.has(ad.id)}
                canWatch={canViewMore}
                onWatch={handleWatch}
                isWatching={watchAd.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ad Viewing Dialog */}
      <Dialog open={!!viewingAd} onOpenChange={(v) => { if (!v) setViewingAd(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{viewingAd?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewingAd?.ad_type === "video" && viewingAd.video_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                {getYouTubeEmbedUrl(viewingAd.video_url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(viewingAd.video_url)!}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={viewingAd.video_url} controls className="w-full h-full" />
                )}
              </div>
            )}

            {viewingAd?.image_url && viewingAd.ad_type !== "video" && (
              <img src={viewingAd.image_url} alt={viewingAd.title} className="w-full rounded-lg" />
            )}

            {viewingAd?.description && (
              <p className="text-sm text-muted-foreground">{viewingAd.description}</p>
            )}

            {viewingAd?.link_url && (
              <a
                href={viewingAd.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Link
              </a>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">+{viewingAd?.coin_reward} GOR</span>
              </div>
              <Button
                onClick={claimReward}
                disabled={timerActive || watchAd.isPending}
                className="gap-2"
              >
                {timerActive ? (
                  `Wait ${watchTimer}s...`
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    Claim Reward
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Ads;
