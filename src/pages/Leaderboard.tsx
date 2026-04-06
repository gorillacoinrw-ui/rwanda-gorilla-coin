import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Crown, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const RANK_ICONS = [Crown, Trophy, Medal];
const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

const Leaderboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: leaders, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, coin_balance, total_mined")
        .order("coin_balance", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const myRank = leaders?.findIndex((l) => l.user_id === user?.id);

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold tracking-wider text-center">
          {t("leaderboard.title")}
        </h1>

        {myRank !== undefined && myRank >= 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Your rank: <span className="text-primary font-bold">#{myRank + 1}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-border bg-card/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display text-primary flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Top 50
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {leaders?.map((leader, index) => {
                  const isMe = leader.user_id === user?.id;
                  const RankIcon = index < 3 ? RANK_ICONS[index] : null;
                  const rankColor = index < 3 ? RANK_COLORS[index] : "";

                  return (
                    <div
                      key={leader.user_id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isMe ? "bg-primary/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="w-8 text-center shrink-0">
                        {RankIcon ? (
                          <RankIcon className={`w-5 h-5 mx-auto ${rankColor}`} />
                        ) : (
                          <span className="text-sm font-mono text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={leader.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {(leader.display_name ?? "G")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                          {leader.display_name ?? "Gorilla Miner"}
                          {isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {leader.total_mined?.toLocaleString() ?? 0} mined
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-display font-bold text-primary">
                          {leader.coin_balance?.toLocaleString() ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">GOR</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
