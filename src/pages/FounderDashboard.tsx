import { useState } from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import AccessKeyGate from "@/components/AccessKeyGate";
import { useAdminCheck, useAdminData } from "@/hooks/use-admin";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTrades } from "@/hooks/use-trades";
import { useOnlinePresence } from "@/hooks/use-online-presence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  TrendingUp,
  Coins,
  Landmark,
  ArrowLeftRight,
  DollarSign,
  Calendar,
  Shield,
  Phone,
  ShoppingCart,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const PAYMENT_METHODS = [
  { id: "mtn", label: "MTN MoMo", icon: Phone },
  { id: "airtel", label: "Airtel Money", icon: Phone },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
];

const FounderDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { users, trades, taxRecords, stats } = useAdminData();
  const { settings } = useAppSettings();
  const { isOnline } = useOnlinePresence();

  const [sellOpen, setSellOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellPayment, setSellPayment] = useState("mtn");
  const [sellDetails, setSellDetails] = useState("");
  const { founderSellTax } = useTrades();

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const taxPool = Number(settings.tax_pool_balance ?? 0);
  const tradingStart = settings.trading_start_date ? new Date(String(settings.trading_start_date)) : new Date();
  const tradingEnd = new Date(tradingStart);
  tradingEnd.setMonth(tradingEnd.getMonth() + 3);
  const daysLeft = Math.max(0, differenceInDays(tradingEnd, new Date()));
  const tradingActive = new Date() < tradingEnd;

  // Metrics
  const totalCoinCirculation = users.reduce((s, u) => s + u.coin_balance, 0);
  const totalTaxCollected = taxRecords.reduce((s, t) => s + t.amount, 0);
  const completedTrades = trades.filter((t) => t.status === "completed");
  const totalRevenue = completedTrades.reduce((s, t) => s + (Number(t.price_rwf) * t.amount), 0);
  const taxCashConversions = trades.filter(
    (t) => t.status === "completed" && t.seller_id === user.id
  );
  const totalCashedOut = taxCashConversions.reduce(
    (s, t) => s + (Number(t.price_rwf) * t.amount),
    0
  );

  // User growth: count by month
  const monthlyGrowth = users.reduce((acc, u) => {
    const month = format(new Date(u.created_at), "MMM yyyy");
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSellTax = () => {
    const amt = parseInt(sellAmount);
    const price = parseFloat(sellPrice);
    if (!amt || amt <= 0 || !price || price <= 0) return;
    if (amt > taxPool) return;

    founderSellTax.mutate(
      { amount: amt, price_rwf: price, payment_method: sellPayment, payment_details: sellDetails },
      {
        onSuccess: () => {
          setSellOpen(false);
          setSellAmount("");
          setSellPrice("");
          setSellDetails("");
        },
      }
    );
  };

  const metricCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Coin Circulation", value: `${totalCoinCirculation.toLocaleString()} GOR`, icon: Coins, color: "text-accent" },
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} RWF`, icon: TrendingUp, color: "text-accent" },
    { label: "Tax Pool", value: `${taxPool.toLocaleString()} GOR`, icon: Landmark, color: "text-primary" },
    { label: "Total Tax Collected", value: `${totalTaxCollected.toLocaleString()} GOR`, icon: DollarSign, color: "text-accent" },
    { label: "Tax Cashed Out", value: `${totalCashedOut.toLocaleString()} RWF`, icon: ArrowLeftRight, color: "text-primary" },
    { label: "Completed Trades", value: completedTrades.length, icon: ArrowLeftRight, color: "text-accent" },
    { label: "Trading Days Left", value: tradingActive ? daysLeft : "Ended", icon: Calendar, color: tradingActive ? "text-primary" : "text-destructive" },
  ];

  return (
    <AppLayout>
      <AccessKeyGate settingsKey="founder_access_key" title="Founder Dashboard Access">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">Founder Dashboard</h1>
          </div>
          <Button onClick={() => setSellOpen(true)} className="gap-2">
            <DollarSign className="w-4 h-4" /> Sell Tax as Cash
          </Button>
        </div>

        {/* Trading status */}
        <div className={`p-4 rounded-xl border ${tradingActive ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {tradingActive ? "Trading is Active" : "Trading Period Ended"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(tradingStart, "dd MMM yyyy")} → {format(tradingEnd, "dd MMM yyyy")}
              </p>
            </div>
            <Badge variant={tradingActive ? "default" : "destructive"}>
              {tradingActive ? `${daysLeft} days left` : "Closed"}
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCards.map((m) => (
            <div key={m.label} className="p-4 rounded-xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-xs font-medium">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {/* User Growth */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">User Growth by Month</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Object.entries(monthlyGrowth).map(([month, count]) => (
              <div key={month} className="text-center min-w-[80px]">
                <div className="h-20 flex items-end justify-center">
                  <div
                    className="w-8 bg-primary/80 rounded-t"
                    style={{ height: `${Math.max(8, (count / Math.max(...Object.values(monthlyGrowth))) * 80)}px` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{month}</p>
                <p className="text-xs font-semibold text-foreground">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tax-to-Cash Conversions */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tax-to-Cash Conversions</h3>
          {taxCashConversions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No conversions yet</p>
          ) : (
            <div className="space-y-2">
              {taxCashConversions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium text-foreground">{t.amount} GOR</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-semibold text-accent">{(Number(t.price_rwf) * t.amount).toLocaleString()} RWF</span>
                  </div>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sell Tax Dialog */}
        <Dialog open={sellOpen} onOpenChange={setSellOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-gradient-gold">Sell Tax Pool as Cash</DialogTitle>
              <DialogDescription>Create a sell order from collected tax ({taxPool} GOR available)</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (GOR)</label>
                <Input
                  type="number"
                  placeholder={`Max ${taxPool}`}
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                />
                {parseInt(sellAmount) > taxPool && (
                  <p className="text-xs text-destructive mt-1">Exceeds tax pool balance</p>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Price per GOR (RWF)</label>
                <Input
                  type="number"
                  placeholder="e.g. 35"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setSellPayment(pm.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${
                        sellPayment === pm.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <pm.icon className="w-4 h-4" />
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Payment Details</label>
                <Input
                  placeholder="Phone number or bank account"
                  value={sellDetails}
                  onChange={(e) => setSellDetails(e.target.value)}
                />
              </div>

              {sellAmount && sellPrice && (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cash</span>
                    <span className="font-bold text-foreground">
                      {(parseInt(sellAmount) * parseFloat(sellPrice)).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSellTax}
                disabled={
                  founderSellTax.isPending ||
                  !sellAmount ||
                  !sellPrice ||
                  parseInt(sellAmount) > taxPool
                }
              >
                {founderSellTax.isPending ? "Creating..." : "Create Tax Sell Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </AccessKeyGate>
    </AppLayout>
  );
};

export default FounderDashboard;
