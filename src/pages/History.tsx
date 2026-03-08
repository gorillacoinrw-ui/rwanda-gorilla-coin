import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Pickaxe, ArrowLeftRight, Clock, CheckCircle, XCircle, Timer, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type MiningSession = {
  id: string;
  started_at: string;
  completed_at: string | null;
  coins_earned: number | null;
};

type TradeRecord = {
  id: string;
  trade_type: string;
  amount: number;
  price_rwf: number;
  status: string;
  payment_method: string;
  created_at: string;
  seller_id: string;
  buyer_id: string | null;
};

const statusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-accent" />;
    case "cancelled":
    case "expired":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "escrow":
      return <Timer className="w-4 h-4 text-primary" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const History = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [miningSessions, setMiningSessions] = useState<MiningSession[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mining");

  const clearMiningHistory = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("mining_sessions")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMiningSessions([]);
      toast({ title: "Mining history cleared" });
    }
  };

  const clearTradeHistory = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("trades")
      .delete()
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTrades([]);
      toast({ title: "Trade history cleared" });
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [miningRes, tradeRes] = await Promise.all([
        supabase
          .from("mining_sessions")
          .select("id, started_at, completed_at, coins_earned")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(50),
        supabase
          .from("trades")
          .select("id, trade_type, amount, price_rwf, status, payment_method, created_at, seller_id, buyer_id")
          .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      setMiningSessions((miningRes.data ?? []) as MiningSession[]);
      setTrades((tradeRes.data ?? []) as TradeRecord[]);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy, HH:mm");
    } catch {
      return d;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{t("history.title")}</h1>
          {activeTab === "mining" && miningSessions.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={clearMiningHistory}>
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
          {activeTab === "trades" && trades.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={clearTradeHistory}>
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        <Tabs defaultValue="mining" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mining" className="gap-1.5 text-xs sm:text-sm">
              <Pickaxe className="w-4 h-4" />
              {t("history.mining")}
            </TabsTrigger>
            <TabsTrigger value="trades" className="gap-1.5 text-xs sm:text-sm">
              <ArrowLeftRight className="w-4 h-4" />
              {t("history.trades")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mining" className="mt-4 space-y-2">
            {loading ? (
              <p className="text-muted-foreground text-sm text-center py-8">{t("history.loading")}</p>
            ) : miningSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">{t("history.noMining")}</p>
            ) : (
              <div className="md:grid md:grid-cols-2 md:gap-3 space-y-2 md:space-y-0">
                {miningSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Pickaxe className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {s.completed_at ? `+${s.coins_earned ?? 24} GOR` : t("history.inProgress")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{formatDate(s.started_at)}</p>
                      </div>
                    </div>
                    {s.completed_at ? (
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <Timer className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trades" className="mt-4 space-y-2">
            {loading ? (
              <p className="text-muted-foreground text-sm text-center py-8">{t("history.loading")}</p>
            ) : trades.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">{t("history.noTrades")}</p>
            ) : (
              <div className="md:grid md:grid-cols-2 md:gap-3 space-y-2 md:space-y-0">
                {trades.map((tr) => {
                  const isSeller = tr.seller_id === user?.id;
                  return (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isSeller ? "bg-destructive/10" : "bg-accent/10"
                          }`}
                        >
                          <ArrowLeftRight
                            className={`w-4 h-4 ${isSeller ? "text-destructive" : "text-accent"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {isSeller ? t("trade.sell") : t("trade.buy")} {tr.amount} GOR
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tr.price_rwf} RWF · {tr.payment_method.toUpperCase()} · {formatDate(tr.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground capitalize hidden sm:inline">{tr.status}</span>
                        {statusIcon(tr.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default History;
