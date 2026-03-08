import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useInvestments } from "@/hooks/use-investments";
import { useProfile } from "@/hooks/use-profile";
import { TrendingUp, Clock, Coins, CheckCircle, Lock, AlertCircle } from "lucide-react";

const Invest = () => {
  const [amount, setAmount] = useState("");
  const { profile } = useProfile();
  const {
    activeInvestments,
    completedInvestments,
    totalInvested,
    totalEarnings,
    isLoading,
    invest,
    claim,
  } = useInvestments();

  const balance = profile?.coin_balance ?? 0;
  const numAmount = parseInt(amount) || 0;
  const estimatedEarnings = Math.floor(numAmount * 0.12);

  const handleInvest = () => {
    if (numAmount < 50) return;
    invest.mutate(numAmount, { onSuccess: () => setAmount("") });
  };

  const getMaturityProgress = (startedAt: string, maturesAt: string) => {
    const start = new Date(startedAt).getTime();
    const end = new Date(maturesAt).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const getTimeLeft = (maturesAt: string) => {
    const diff = new Date(maturesAt).getTime() - Date.now();
    if (diff <= 0) return "Ready to claim!";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h left`;
  };

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold tracking-wider">
            INVEST & EARN
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Lock your coins for 7 days and earn 12% interest
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card/80 border-border">
            <CardContent className="p-3 text-center">
              <Lock className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{totalInvested}</p>
              <p className="text-[10px] text-muted-foreground">Invested</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-4 h-4 mx-auto text-accent mb-1" />
              <p className="text-lg font-bold text-accent">{totalEarnings}</p>
              <p className="text-[10px] text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="p-3 text-center">
              <Coins className="w-4 h-4 mx-auto text-secondary mb-1" />
              <p className="text-lg font-bold text-foreground">{balance}</p>
              <p className="text-[10px] text-muted-foreground">Available</p>
            </CardContent>
          </Card>
        </div>

        {/* New Investment */}
        <Card className="border-primary/30 bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              New Investment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Amount (min 50 GOR)</label>
              <Input
                type="number"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={50}
                max={balance}
                className="bg-muted/50 border-border"
              />
              {numAmount > 0 && numAmount < 50 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Minimum investment is 50 GOR
                </p>
              )}
            </div>

            {numAmount >= 50 && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="text-foreground font-medium">{numAmount} GOR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest (12%)</span>
                  <span className="text-accent font-medium">+{estimatedEarnings} GOR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground font-medium">7 days</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total Return</span>
                  <span className="text-primary">{numAmount + estimatedEarnings} GOR</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleInvest}
              disabled={numAmount < 50 || numAmount > balance || invest.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
            >
              {invest.isPending ? "Investing..." : `Invest ${numAmount || 0} GOR`}
            </Button>
          </CardContent>
        </Card>

        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Active Investments ({activeInvestments.length})
            </h2>
            {activeInvestments.map((inv) => {
              const progress = getMaturityProgress(inv.started_at, inv.matures_at);
              const matured = new Date(inv.matures_at) <= new Date();
              return (
                <Card key={inv.id} className="bg-card/80 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-bold text-foreground">{inv.amount} GOR</p>
                        <p className="text-xs text-muted-foreground">
                          +{inv.coins_earned} GOR interest
                        </p>
                      </div>
                      <Badge variant={matured ? "default" : "secondary"} className="text-xs">
                        {matured ? "Ready!" : getTimeLeft(inv.matures_at)}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex gap-2">
                      {!matured && (
                        <Button
                          onClick={() => claim.mutate({ investmentId: inv.id, earlyStop: true })}
                          disabled={claim.isPending}
                          variant="outline"
                          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 font-display"
                          size="sm"
                        >
                          {claim.isPending ? "Stopping..." : "Stop & Collect"}
                        </Button>
                      )}
                      {matured && (
                        <Button
                          onClick={() => claim.mutate({ investmentId: inv.id })}
                          disabled={claim.isPending}
                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-display"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {claim.isPending ? "Claiming..." : `Claim ${inv.amount + inv.coins_earned} GOR`}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Past Investments */}
        {claimedInvestments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              Completed ({claimedInvestments.length})
            </h2>
            {claimedInvestments.map((inv) => (
              <Card key={inv.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.amount} GOR</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.claimed_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-accent border-accent/30">
                    +{inv.coins_earned} GOR
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && activeInvestments.length === 0 && claimedInvestments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No investments yet. Start investing to earn 12% interest!
          </p>
        )}
      </div>
    </AppLayout>
  );
};

export default Invest;
