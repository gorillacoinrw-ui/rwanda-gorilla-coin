import { useState, useEffect, useMemo, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { useTrades, Trade } from "@/hooks/use-trades";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useOnlinePresence } from "@/hooks/use-online-presence";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  Plus,
  Clock,
  Shield,
  Phone,
  Landmark,
  CheckCircle,
  XCircle,
  Search,
  ChevronDown,
  User,
  AlertTriangle,
  Copy,
  Filter,
  Upload,
  Image,
  Eye,
} from "lucide-react";
import TradeChat from "@/components/TradeChat";
import P2PAccessGate from "@/components/P2PAccessGate";

const PAYMENT_METHODS = [
  { id: "all", label: "All Payments", icon: Filter },
  { id: "mtn", label: "MTN MoMo", icon: Phone },
  { id: "airtel", label: "Airtel Money", icon: Phone },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
];

function formatTime(ms: number) {
  if (ms <= 0) return "00:00";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function EscrowTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => setRemaining(new Date(expiresAt).getTime() - Date.now());
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = remaining < 5 * 60 * 1000;

  return (
    <span className={`font-mono text-sm font-bold ${isUrgent ? "text-destructive animate-pulse" : "text-primary"}`}>
      {formatTime(remaining)}
    </span>
  );
}

function EscrowProgress({ expiresAt }: { expiresAt: string }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const total = 20 * 60 * 1000;
    const calc = () => {
      const rem = new Date(expiresAt).getTime() - Date.now();
      setProgress(Math.max(0, (rem / total) * 100));
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${progress < 25 ? "bg-destructive" : "bg-primary"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

const TradePage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tradingActive, totalUsers, minUsersForTrading, usersNeeded } = useAppSettings();
  const { isOnline } = useOnlinePresence();
  const {
    openTrades,
    myTrades,
    isLoading,
    createTrade,
    acceptTrade,
    confirmTrade,
    cancelTrade,
  } = useTrades();

  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [subTab, setSubTab] = useState<"p2p" | "orders">("p2p");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Create form
  const [tradeType, setTradeType] = useState<"sell" | "buy">("sell");
  const [amount, setAmount] = useState("");
  const [priceRwf, setPriceRwf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [accountName, setAccountName] = useState("");

  const handleCreate = () => {
    const amt = parseInt(amount);
    const price = parseFloat(priceRwf);
    const minAmt = parseInt(minAmount) || 1;
    const maxAmt = parseInt(maxAmount) || amt;

    if (!amt || amt <= 0) return;
    if (!price || price <= 0) return;
    if (minAmt > maxAmt) return;

    if (tradeType === "sell") {
      const lockedCoins = myTrades
        .filter((t) => t.seller_id === user?.id && (t.status === "open" || t.status === "escrow"))
        .reduce((sum, t) => sum + t.amount, 0);
      const availableBalance = (profile?.coin_balance ?? 0) - lockedCoins;
      if (availableBalance < amt) {
        toast({ title: "Insufficient balance", description: `Please enter the available coin. You have ${availableBalance.toLocaleString()} GOR available.`, variant: "destructive" });
        return;
      }
    }

    if (!paymentDetails.trim()) {
      toast({ title: "Payment details required", description: "Enter your phone number or account info so the buyer can pay you.", variant: "destructive" });
      return;
    }

    const fullDetails = accountName.trim()
      ? `${accountName.trim()} | ${paymentDetails.trim()}`
      : paymentDetails.trim();

    createTrade.mutate(
      {
        trade_type: tradeType,
        amount: amt,
        price_rwf: price,
        payment_method: paymentMethod,
        payment_details: fullDetails,
        min_amount: minAmt,
        max_amount: maxAmt,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setAmount("");
          setPriceRwf("");
          setMinAmount("");
          setMaxAmount("");
          setPaymentDetails("");
          setAccountName("");
        },
      }
    );
  };

  const filteredOrders = useMemo(() => {
    const orders = openTrades.filter((t) => {
      if (tab === "buy") return t.trade_type === "sell" && t.seller_id !== user?.id;
      return t.trade_type === "buy" && t.seller_id !== user?.id;
    });

    const filtered = orders.filter((t) => {
      if (paymentFilter !== "all" && t.payment_method !== paymentFilter) return false;
      if (amountFilter) {
        const filterAmt = parseFloat(amountFilter);
        if (filterAmt && (filterAmt < t.min_amount || filterAmt > t.max_amount)) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "price_asc") return Number(a.price_rwf) - Number(b.price_rwf);
      return Number(b.price_rwf) - Number(a.price_rwf);
    });

    return filtered;
  }, [openTrades, tab, paymentFilter, amountFilter, sortBy, user?.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <AppLayout>
      <P2PAccessGate>
      <div className="max-w-md md:max-w-5xl lg:max-w-7xl mx-auto px-4 py-4 space-y-0">

        {/* Trading gate banner */}
        {!tradingActive && (
          <div className="mb-4 p-5 rounded-xl border border-primary/30 bg-primary/5 text-center space-y-3">
            <p className="text-base font-semibold text-foreground">🚀 P2P Trading opens at {minUsersForTrading} users</p>
            <p className="text-xs text-muted-foreground">
              {totalUsers} / {minUsersForTrading} users registered — <span className="font-bold text-primary">{usersNeeded} more needed</span>
            </p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (totalUsers / minUsersForTrading) * 100)}%` }} />
            </div>
            <div className="pt-2 border-t border-border mt-3 space-y-2">
              <p className="text-sm font-medium text-foreground">📢 Share & Earn to Open Trading!</p>
              <p className="text-xs text-muted-foreground">
                Invite your friends using your referral code and earn <span className="font-bold text-primary">15 GOR</span> per referral. 
                The more users join, the sooner P2P trading opens for everyone!
              </p>
              <a href="/profile" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                Get Your Referral Code →
              </a>
            </div>
          </div>
        )}
        {/* ===== Top Header ===== */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg md:text-xl font-display font-bold text-gradient-gold tracking-wider">
            P2P Trading
          </h1>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Escrow Protected</span>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5" disabled={!tradingActive}>
              <Plus className="w-4 h-4" /> Post Ad
            </Button>
          </div>
        </div>

        {/* ===== Sub Tabs: P2P / My Orders ===== */}
        <div className="flex items-center gap-6 border-b border-border mb-4">
          <button
            onClick={() => setSubTab("p2p")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              subTab === "p2p"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            P2P
          </button>
          <button
            onClick={() => setSubTab("orders")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors relative ${
              subTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            My Orders
            {myTrades.length > 0 && (
              <span className="absolute -top-1 -right-4 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                {myTrades.length}
              </span>
            )}
          </button>
        </div>

        {subTab === "p2p" && (
          <>
            {/* ===== Buy/Sell Toggle (Binance pill style) ===== */}
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex rounded-full bg-muted p-1">
                <button
                  onClick={() => setTab("buy")}
                  className={`px-6 py-2 text-sm font-semibold rounded-full transition-all ${
                    tab === "buy"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTab("sell")}
                  className={`px-6 py-2 text-sm font-semibold rounded-full transition-all ${
                    tab === "sell"
                      ? "bg-destructive text-destructive-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Asset badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
                <span className="font-semibold text-foreground">GOR</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Sort by */}
              <div className="ml-auto">
                <button
                  onClick={() => setSortBy(sortBy === "price_asc" ? "price_desc" : "price_asc")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sort By <span className="text-foreground font-semibold">Price</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${sortBy === "price_desc" ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            {/* ===== Filters Row ===== */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
              {/* Amount filter */}
              <div className="relative flex-shrink-0 w-full md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter amount"
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Payment method chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentFilter(pm.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                      paymentFilter === pm.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    }`}
                  >
                    <pm.icon className="w-3 h-3" />
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ===== Table Header (desktop) ===== */}
            <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border">
              <span>Advertiser</span>
              <span>Price</span>
              <span>Available / Limit</span>
              <span>Payment</span>
              <span className="text-right">Trade</span>
            </div>

            {/* ===== Order Rows ===== */}
            <div className="divide-y divide-border">
              {isLoading && (
                <div className="py-12 text-center text-muted-foreground text-sm">Loading orders...</div>
              )}
              {!isLoading && filteredOrders.length === 0 && (
                <div className="py-12 text-center space-y-3">
                  <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No ads found</p>
                </div>
              )}
              {filteredOrders.map((trade) => (
                <AdvertiserRow
                  key={trade.id}
                  trade={trade}
                  tab={tab}
                  onAccept={() => acceptTrade.mutate(trade.id)}
                  accepting={acceptTrade.isPending}
                  isOnline={isOnline(trade.seller_id)}
                />
              ))}
            </div>
          </>
        )}

        {/* ===== My Orders Tab ===== */}
        {subTab === "orders" && (
          <div className="space-y-3">
            {/* Balance card */}
            <div className="bg-gradient-card rounded-xl border border-border p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="font-display font-bold text-primary text-lg">
                {profile?.coin_balance?.toLocaleString() ?? 0} GOR
              </span>
            </div>

            {myTrades.length === 0 && !isLoading && (
              <div className="py-12 text-center space-y-3">
                <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No active orders</p>
                <p className="text-xs text-muted-foreground">Your open and in-progress trades will appear here</p>
              </div>
            )}

            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
              {myTrades.map((trade) => (
                <MyOrderCard
                  key={trade.id}
                  trade={trade}
                  userId={user?.id ?? ""}
                  onConfirm={() => confirmTrade.mutate(trade.id)}
                  onCancel={() => cancelTrade.mutate(trade.id)}
                  confirming={confirmTrade.isPending}
                  cancelling={cancelTrade.isPending}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== Create Order Dialog ===== */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-gradient-gold">Post Trading Ad</DialogTitle>
              <DialogDescription>Set your price and payment terms</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Buy/Sell toggle */}
              <div className="flex gap-0">
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-l-lg transition-all ${
                    tradeType === "sell"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  I want to Sell
                </button>
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-r-lg transition-all ${
                    tradeType === "buy"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  I want to Buy
                </button>
              </div>

              {/* Asset + Fiat row */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground">Asset</span>
                <span className="font-semibold text-foreground">GOR</span>
                <span className="mx-2 text-border">|</span>
                <span className="text-muted-foreground">Fiat</span>
                <span className="font-semibold text-foreground">RWF</span>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Total Amount (GOR)</label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {tradeType === "sell" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Balance: {profile?.coin_balance?.toLocaleString() ?? 0} GOR
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Price per GOR (RWF)</label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={priceRwf}
                  onChange={(e) => setPriceRwf(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Order Limit Min</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Order Limit Max</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Payment Method</label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.filter((pm) => pm.id !== "all").map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <span className={`w-2 h-5 rounded-full shrink-0 ${
                          pm.id === "mtn" ? "bg-[hsl(48,95%,55%)]" :
                          pm.id === "airtel" ? "bg-destructive" : "bg-secondary"
                        }`} />
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {pm.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {pm.id === "mtn" ? "Mobile Money — MTN Rwanda" :
                             pm.id === "airtel" ? "Mobile Money — Airtel Rwanda" :
                             "Direct bank transfer"}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">
                    {paymentMethod === "bank" ? "Bank Account Details" : "Mobile Money Number"}
                  </label>
                </div>
                <Input
                  type="text"
                  placeholder={paymentMethod === "bank" ? "e.g. 0012345678" : "e.g. 0781234567"}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="bg-background"
                />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Account Holder Name
                  </label>
                  <Input
                    type="text"
                    placeholder={paymentMethod === "bank" ? "e.g. Jean Mugabo" : "e.g. Jean Mugabo"}
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="bg-background"
                    maxLength={100}
                  />
                </div>
                {paymentMethod !== "bank" && (
                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                    <span>Enter the {paymentMethod === "mtn" ? "MTN" : "Airtel"} number registered for Mobile Money. Buyers will send payment here.</span>
                  </div>
                )}
                {paymentMethod === "bank" && (
                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                    <span>Enter your full bank account number. Buyers will transfer funds to this account.</span>
                  </div>
                )}
              </div>

              {amount && priceRwf && (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-semibold text-foreground">
                      {(parseInt(amount) * parseFloat(priceRwf)).toLocaleString()} RWF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trading Fee (25%)</span>
                    <span className="text-destructive text-xs">
                      -{Math.floor(parseInt(amount) * 0.25).toLocaleString()} GOR
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-muted-foreground">Buyer Receives</span>
                    <span className="font-semibold text-accent">
                      {(parseInt(amount) - Math.floor(parseInt(amount) * 0.25)).toLocaleString()} GOR
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createTrade.isPending || !amount || !priceRwf}
              >
                {createTrade.isPending ? "Creating..." : `Post ${tradeType === "sell" ? "Sell" : "Buy"} Ad`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

/* ===== Advertiser Row (Binance-style) ===== */
function AdvertiserRow({
  trade,
  tab,
  onAccept,
  accepting,
  isOnline,
}: {
  trade: Trade;
  tab: "buy" | "sell";
  onAccept: () => void;
  accepting: boolean;
  isOnline: boolean;
}) {
  const pm = PAYMENT_METHODS.find((p) => p.id === trade.payment_method);
  const totalRwf = trade.amount * Number(trade.price_rwf);

  return (
    <div className="py-4 px-2 md:px-4 md:grid md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr] md:items-center gap-4">
      {/* Advertiser */}
      <div className="flex items-center gap-3 mb-3 md:mb-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {(trade.seller_profile?.display_name ?? "T")[0].toUpperCase()}
          </div>
          {/* Online indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
              isOnline ? "bg-accent animate-pulse" : "bg-muted-foreground/40"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-foreground">
              {trade.seller_profile?.display_name ?? "Trader"}
            </p>
            {/* Verified merchant badge for 10+ orders and 80%+ completion */}
            {(trade.seller_stats?.total_orders ?? 0) >= 10 && (trade.seller_stats?.completion_rate ?? 0) >= 80 && (
              <span className="w-4 h-4 rounded-full bg-[hsl(48,95%,55%)] flex items-center justify-center" title="Verified Merchant">
                <CheckCircle className="w-3 h-3 text-background" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span>{trade.seller_stats?.total_orders ?? 0} orders</span>
            <span className="text-border">|</span>
            <span>{trade.seller_stats?.completion_rate ?? 0}% completion</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
            {isOnline && (
              <span className="text-accent font-medium">Online</span>
            )}
            {isOnline && <span className="text-border">|</span>}
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> 20 min
            </span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="flex justify-between md:block mb-2 md:mb-0">
        <span className="text-xs text-muted-foreground md:hidden">Price</span>
        <p className="text-base font-bold text-foreground">
          <span className="text-xs font-normal text-muted-foreground mr-0.5">RWF</span>
          {Number(trade.price_rwf).toLocaleString()}
        </p>
      </div>

      {/* Available / Limit */}
      <div className="flex justify-between md:block mb-2 md:mb-0">
        <span className="text-xs text-muted-foreground md:hidden">Available</span>
        <div>
          <p className="text-sm text-foreground">
            <span className="font-medium">{trade.amount.toLocaleString()}</span>{" "}
            <span className="text-xs text-muted-foreground">GOR</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {(trade.min_amount * Number(trade.price_rwf)).toLocaleString()} RWF - {(trade.max_amount * Number(trade.price_rwf)).toLocaleString()} RWF
          </p>
        </div>
      </div>

      {/* Payment */}
      <div className="flex justify-between items-center md:block mb-3 md:mb-0">
        <span className="text-xs text-muted-foreground md:hidden">Payment</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-1 h-4 rounded-full ${
            trade.payment_method === "mtn" ? "bg-[hsl(48,95%,55%)]" :
            trade.payment_method === "airtel" ? "bg-destructive" : "bg-secondary"
          }`} />
          <span className="text-xs text-foreground">{pm?.label ?? trade.payment_method}</span>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={accepting}
          className={`min-w-[80px] ${
            tab === "buy"
              ? "bg-accent hover:bg-accent/90 text-accent-foreground"
              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          }`}
        >
          {accepting ? "..." : tab === "buy" ? `Buy GOR` : `Sell GOR`}
        </Button>
      </div>
    </div>
  );
}

/* ===== Proof Upload Component ===== */
function ProofUpload({ trade, userId }: { trade: Trade; userId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>((trade as any).proof_url ?? null);
  const [viewOpen, setViewOpen] = useState(false);
  const isBuyer = trade.buyer_id === userId;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Only images allowed", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large (max 5MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${trade.id}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("trade-proofs")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("trade-proofs")
        .getPublicUrl(path);

      const url = urlData.publicUrl;

      await supabase
        .from("trades")
        .update({ proof_url: url } as any)
        .eq("id", trade.id);

      setProofUrl(url);
      toast({ title: "Proof uploaded! 📸" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (!proofUrl && !isBuyer) return null;

  return (
    <div className="px-4 pb-3 space-y-2">
      {isBuyer && !proofUrl && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Payment Proof"}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            Upload screenshot or forwarded message as proof
          </p>
        </div>
      )}

      {proofUrl && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-accent flex items-center gap-1">
              <Image className="w-3 h-3" /> Payment Proof
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs gap-1 text-primary"
              onClick={() => setViewOpen(true)}
            >
              <Eye className="w-3 h-3" /> View
            </Button>
          </div>
          <img
            src={proofUrl}
            alt="Payment proof"
            className="w-full max-h-32 object-cover rounded-md cursor-pointer"
            onClick={() => setViewOpen(true)}
          />
          {isBuyer && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-3 h-3" />
                {uploading ? "Uploading..." : "Replace Proof"}
              </Button>
            </>
          )}
        </div>
      )}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {proofUrl && (
            <img src={proofUrl} alt="Payment proof full" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ===== My Order Card ===== */
function MyOrderCard({
  trade,
  userId,
  onConfirm,
  onCancel,
  confirming,
  cancelling,
  onCopy,
}: {
  trade: Trade;
  userId: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  cancelling: boolean;
  onCopy: (text: string) => void;
}) {
  const isEscrow = trade.status === "escrow";
  const isSeller = trade.seller_id === userId;
  // Determine real roles: for sell orders, seller_id = coin seller; for buy orders, seller_id = coin buyer
  const isCoinSeller = trade.trade_type === "sell"
    ? trade.seller_id === userId
    : trade.buyer_id === userId;
  const pm = PAYMENT_METHODS.find((p) => p.id === trade.payment_method);
  const totalRwf = trade.amount * Number(trade.price_rwf);

  // Escrow steps
  const steps = isEscrow
    ? [
        { label: "Order Created", done: true },
        { label: "Payment Pending", done: false, active: true },
        { label: "Coins Released", done: false },
      ]
    : [
        { label: "Order Open", done: true, active: true },
        { label: "Awaiting Match", done: false },
        { label: "Complete", done: false },
      ];

  return (
    <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Badge
            variant={isEscrow ? "default" : "secondary"}
            className={isEscrow ? "bg-primary/20 text-primary border-primary/30" : ""}
          >
            {trade.status.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {trade.trade_type === "sell" ? "Sell" : "Buy"} Order
          </span>
        </div>
        {isEscrow && trade.expires_at && <EscrowTimer expiresAt={trade.expires_at} />}
      </div>

      {/* Progress bar */}
      {isEscrow && trade.expires_at && (
        <div className="px-4 pt-2">
          <EscrowProgress expiresAt={trade.expires_at} />
        </div>
      )}

      {/* Step indicators */}
      <div className="px-4 py-3 flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              step.done ? "bg-accent text-accent-foreground" :
              step.active ? "bg-primary/20 text-primary border border-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {step.done ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] leading-tight ${step.active || step.done ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${step.done ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Trade details */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-semibold text-foreground text-sm">{trade.amount.toLocaleString()} GOR</p>
        </div>
        <div>
          <span className="text-muted-foreground">Price</span>
          <p className="font-semibold text-foreground text-sm">{Number(trade.price_rwf).toLocaleString()} RWF</p>
        </div>
        <div>
          <span className="text-muted-foreground">Total</span>
          <p className="font-semibold text-foreground text-sm">{totalRwf.toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Escrow info */}
      {isEscrow && (
        <div className="px-4 pb-3 space-y-2">
          <div className="bg-muted/50 rounded-lg p-3 text-xs flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              {isCoinSeller
                ? "Waiting for buyer's payment. Confirm once received."
                : "Send payment to the seller within the time limit."}
            </span>
          </div>
          {!isCoinSeller && trade.payment_details && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary flex items-center gap-1">
                  <Landmark className="w-3 h-3" /> Payment Details
                </span>
                <button onClick={() => onCopy(trade.payment_details ?? "")} className="text-primary hover:text-primary/80">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-foreground font-mono text-sm">{trade.payment_details}</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                {pm && <pm.icon className="w-3 h-3" />}
                <span>Send <span className="font-semibold text-foreground">{totalRwf.toLocaleString()} RWF</span> via {pm?.label ?? trade.payment_method}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proof upload */}
      {isEscrow && <ProofUpload trade={trade} userId={userId} />}

      {/* Trade chat */}
      {isEscrow && (
        <div className="px-4 pb-3">
          <TradeChat tradeId={trade.id} />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {isEscrow && isCoinSeller && (
          <Button
            size="sm"
            className="flex-1 gap-1 bg-accent hover:bg-accent/90"
            onClick={onConfirm}
            disabled={confirming}
          >
            <CheckCircle className="w-4 h-4" />
            {confirming ? "Confirming..." : "Payment Received"}
          </Button>
        )}
        {(trade.status === "open" || isEscrow) && (
          <Button
            size="sm"
            variant="outline"
            className={`gap-1 border-destructive/50 text-destructive hover:bg-destructive/10 ${isEscrow && isCoinSeller ? "" : "flex-1"}`}
            onClick={onCancel}
            disabled={cancelling}
          >
            <XCircle className="w-4 h-4" />
            {cancelling ? "..." : "Cancel"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default TradePage;
