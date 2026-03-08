import AppLayout from "@/components/AppLayout";
import { useTasks, SocialTask, TaskCompletion } from "@/hooks/use-tasks";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Youtube, Facebook, Instagram, MessageCircle, Music2, Twitter,
  ExternalLink, CheckCircle2, Clock, XCircle, Gift, Share2
} from "lucide-react";

const platformColors: Record<string, string> = {
  youtube: "bg-[#FF0000]/10 border-[#FF0000]/20",
  facebook: "bg-[#1877F2]/10 border-[#1877F2]/20",
  instagram: "bg-[#E4405F]/10 border-[#E4405F]/20",
  whatsapp: "bg-[#25D366]/10 border-[#25D366]/20",
  tiktok: "bg-[#000000]/10 border-[#000000]/20",
  twitter: "bg-[#1DA1F2]/10 border-[#1DA1F2]/20",
};

const platformIconColors: Record<string, string> = {
  youtube: "text-[#FF0000]",
  facebook: "text-[#1877F2]",
  instagram: "text-[#E4405F]",
  whatsapp: "text-[#25D366]",
  tiktok: "text-foreground",
  twitter: "text-[#1DA1F2]",
};

const getIcon = (icon: string | null, platform: string) => {
  const cls = `w-6 h-6 ${platformIconColors[platform] ?? "text-primary"}`;
  switch (icon) {
    case "Youtube": return <Youtube className={cls} />;
    case "Facebook": return <Facebook className={cls} />;
    case "Instagram": return <Instagram className={cls} />;
    case "MessageCircle": return <MessageCircle className={cls} />;
    case "Music2": return <Music2 className={cls} />;
    case "Twitter": return <Twitter className={cls} />;
    default: return <Gift className={cls} />;
  }
};

const getCompletionStatus = (task: SocialTask, completions: TaskCompletion[]) => {
  return completions.find((c) => c.task_id === task.id);
};

const Tasks = () => {
  const { tasks, completions, isLoading, submitTask } = useTasks();
  const { t } = useLanguage();

  const followTasks = tasks.filter((t) => t.task_type !== "share");
  const shareTasks = tasks.filter((t) => t.task_type === "share");

  const handleSubmit = (task: SocialTask) => {
    if (task.url) {
      window.open(task.url, "_blank");
    }
    if (task.task_type === "share") {
      const shareText = "Join Gorilla Coin 🦍💰! Mine free coins and earn rewards! Download now: " + window.location.origin;
      if (task.platform === "whatsapp") {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
      } else if (task.platform === "facebook") {
        window.open(`https://www.facebook.com/dialog/share?app_id=966242223397117&href=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}&display=popup`, "_blank");
      } else if (task.platform === "instagram") {
        navigator.clipboard.writeText(shareText);
        window.open("https://www.instagram.com/", "_blank");
      }
    }
    submitTask.mutate(task.id);
  };

  const renderTaskCard = (task: SocialTask) => {
    const completion = getCompletionStatus(task, completions);
    const isCompleted = completion?.status === "approved";
    const isPending = completion?.status === "pending";
    const isRejected = completion?.status === "rejected";

    return (
      <div
        key={task.id}
        className={`rounded-xl border p-4 transition-all ${platformColors[task.platform] ?? "bg-card border-border"} ${isCompleted ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {getIcon(task.icon, task.platform)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">{task.title}</h3>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                +{task.coin_reward} GOR
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>

            <div className="mt-3">
              {isCompleted ? (
                <div className="flex items-center gap-1.5 text-xs text-green-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed! +{task.coin_reward} GOR earned</span>
                </div>
              ) : isPending ? (
                <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending admin approval...</span>
                </div>
              ) : isRejected ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                  onClick={() => handleRetry(task)}
                  disabled={submitTask.isPending}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />Try Again
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => handleSubmit(task)}
                  disabled={submitTask.isPending}
                >
                  {task.task_type === "share" ? (
                    <><Share2 className="w-3.5 h-3.5 mr-1" />Share & Earn</>
                  ) : (
                    <><ExternalLink className="w-3.5 h-3.5 mr-1" />{task.task_type === "subscribe" ? "Subscribe" : "Follow"} & Earn</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalEarned = completions
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => {
      const task = tasks.find((t) => t.id === c.task_id);
      return sum + (task?.coin_reward ?? 0);
    }, 0);

  const completedCount = completions.filter((c) => c.status === "approved").length;

  return (
    <AppLayout>
      <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider">
            {t("tasks.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{t("tasks.subtitle")}</p>
        </div>

        {/* Progress */}
        <div className="bg-gradient-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("tasks.progress")}</p>
              <p className="text-lg font-bold text-foreground">{completedCount}/{tasks.length} tasks</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("tasks.earned")}</p>
              <p className="text-lg font-bold text-gradient-gold">+{totalEarned} GOR</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading tasks...</div>
        ) : (
          <>
            {/* Follow/Subscribe Tasks */}
            {followTasks.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-display font-semibold tracking-wider uppercase text-foreground flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  {t("tasks.followTitle")}
                </h2>
                <div className="space-y-2">
                  {followTasks.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* Share Tasks */}
            {shareTasks.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-display font-semibold tracking-wider uppercase text-foreground flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  {t("tasks.shareTitle")}
                </h2>
                <div className="space-y-2">
                  {shareTasks.map(renderTaskCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Tasks;
