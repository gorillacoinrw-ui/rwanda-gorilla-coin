import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useTrades, Trade } from "@/hooks/use-trades";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

const PAYMENT_METHODS = [
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
    <span className={`font-mono text-sm font-semibold ${isUrgent ? "text-destructive" : "text-primary"}`}>
      ⏱ {formatTime(remaining)}
    </span>
  );
}

const TradePage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const {
    openTrades,
    myTrades,
    isLoading,
    createTrade,
    acceptTrade,
    confirmTrade,
    cancelTrade,
  } = useTrades();

  const [tab, setTab] = useState<"buy" | "sell" | "my">("buy");
  const [createOpen, setCreateOpen] = useState(false);

  // Create form
  const [tradeType, setTradeType] = useState<"sell" | "buy">("sell");
  const [amount, setAmount] = useState("");
  const [priceRwf, setPriceRwf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  const handleCreate = () => {
    const amt = parseInt(amount);
    const price = parseFloat(priceRwf);
    const minAmt = parseInt(minAmount) || 1;
    const maxAmt = parseInt(maxAmount) || amt;

    if (!amt || amt <= 0) return;
    if (!price || price <= 0) return;
    if (minAmt > maxAmt) return;

    if (tradeType === "sell" && (profile?.coin_balance ?? 0) < amt) {
      toast({ title: "Insufficient balance", description: `You need ${amt} GOR but only have ${profile?.coin_balance ?? 0} GOR.`, variant: "destructive" });
      return;
    }

    if (!paymentDetails.trim()) {
      toast({ title: "Payment details required", description: "Enter your phone number or account info so the buyer can pay you.", variant: "destructive" });
      return;
    }

    createTrade.mutate(
      {
        trade_type: tradeType,
        amount: amt,
        price_rwf: price,
        payment_method: paymentMethod,
        payment_details: paymentDetails.trim(),
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
        },
      }
    );
  };

  const sellOrders = openTrades.filter((t) => t.trade_type === "sell" && t.seller_id !== user?.id);
  const buyOrders = openTrades.filter((t) => t.trade_type === "buy" && t.seller_id !== user?.id);

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider">
            P2P Market
          </h1>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Create Order
          </Button>
        </div>

        {/* Balance */}
        <div className="bg-gradient-card rounded-xl border border-border p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Balance</span>
          <span className="font-display font-bold text-primary text-lg">
            {profile?.coin_balance?.toLocaleString() ?? 0} GOR
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["buy", "sell", "my"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "my" ? "My Trades" : t === "buy" ? "Buy GOR" : "Sell GOR"}
            </button>
          ))}
        </div>

        {/* Order list */}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
          )}

          {tab === "buy" && !isLoading && sellOrders.length === 0 && (
            <EmptyState text="No sell orders available yet" />
          )}
          {tab === "sell" && !isLoading && buyOrders.length === 0 && (
            <EmptyState text="No buy orders available yet" />
          )}
          {tab === "my" && !isLoading && myTrades.length === 0 && (
            <EmptyState text="You have no active trades" />
          )}

          {tab === "buy" &&
            sellOrders.map((trade) => (
              <OrderCard
                key={trade.id}
                trade={trade}
                userId={user?.id ?? ""}
                onAccept={() => acceptTrade.mutate(trade.id)}
                accepting={acceptTrade.isPending}
              />
            ))}

          {tab === "sell" &&
            buyOrders.map((trade) => (
              <OrderCard
                key={trade.id}
                trade={trade}
                userId={user?.id ?? ""}
                onAccept={() => acceptTrade.mutate(trade.id)}
                accepting={acceptTrade.isPending}
              />
            ))}

          {tab === "my" &&
            myTrades.map((trade) => (
              <MyTradeCard
                key={trade.id}
                trade={trade}
                userId={user?.id ?? ""}
                onConfirm={() => confirmTrade.mutate(trade.id)}
                onCancel={() => cancelTrade.mutate(trade.id)}
                confirming={confirmTrade.isPending}
                cancelling={cancelTrade.isPending}
              />
            ))}
        </div>

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-gradient-gold">Create Order</DialogTitle>
              <DialogDescription>Set your trade terms</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Buy/Sell toggle */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    tradeType === "sell"
                      ? "bg-destructive/20 text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  I want to Sell
                </button>
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    tradeType === "buy"
                      ? "bg-accent/20 text-accent"
                      : "text-muted-foreground"
                  }`}
                >
                  I want to Buy
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (GOR)</label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
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
                  <label className="text-xs text-muted-foreground mb-1 block">Min Amount</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Amount</label>
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
                <label className="text-xs text-muted-foreground mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${
                        paymentMethod === pm.id
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

              {/* Payment Details */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {paymentMethod === "bank" ? "Bank Account Number" : "Phone Number"}
                </label>
                <Input
                  type="text"
                  placeholder={paymentMethod === "bank" ? "e.g. 0012345678" : "e.g. 0781234567"}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Buyers will see this to send you payment
                </p>
              </div>

              {amount && priceRwf && (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">
                      {(parseInt(amount) * parseFloat(priceRwf)).toLocaleString()} RWF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (25%)</span>
                    <span className="text-destructive">
                      {Math.floor(parseInt(amount) * 0.25).toLocaleString()} GOR
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createTrade.isPending || !amount || !priceRwf}
              >
                {createTrade.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-gradient-card rounded-xl border border-border p-8 text-center space-y-3">
      <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function OrderCard({
  trade,
  userId,
  onAccept,
  accepting,
}: {
  trade: Trade;
  userId: string;
  onAccept: () => void;
  accepting: boolean;
}) {
  const pm = PAYMENT_METHODS.find((p) => p.id === trade.payment_method);
  const isSell = trade.trade_type === "sell";

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSell ? "bg-destructive" : "bg-accent"}`} />
          <span className="text-sm font-semibold text-foreground">
            {trade.seller_profile?.display_name ?? "Trader"}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isSell ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"
        }`}>
          {isSell ? "SELL" : "BUY"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Price</span>
          <p className="font-semibold text-foreground">{trade.price_rwf} RWF/GOR</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Amount</span>
          <p className="font-semibold text-foreground">{trade.amount.toLocaleString()} GOR</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Limit</span>
          <p className="text-foreground">{trade.min_amount} - {trade.max_amount} GOR</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Payment</span>
          <div className="flex items-center gap-1">
            {pm && <pm.icon className="w-3 h-3 text-muted-foreground" />}
            <span className="text-foreground">{pm?.label ?? trade.payment_method}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" /> Escrow Protected
        </div>
        <Button
          size="sm"
          onClick={onAccept}
          disabled={accepting}
          className={isSell ? "" : "bg-accent hover:bg-accent/90"}
        >
          {isSell ? "Buy" : "Sell"} Now
        </Button>
      </div>
    </div>
  );
}

function MyTradeCard({
  trade,
  userId,
  onConfirm,
  onCancel,
  confirming,
  cancelling,
}: {
  trade: Trade;
  userId: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  cancelling: boolean;
}) {
  const isEscrow = trade.status === "escrow";
  const isSeller = trade.seller_id === userId;
  const pm = PAYMENT_METHODS.find((p) => p.id === trade.payment_method);

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isEscrow ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {trade.status.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">
            {trade.trade_type === "sell" ? "Sell" : "Buy"} Order
          </span>
        </div>
        {isEscrow && trade.expires_at && <EscrowTimer expiresAt={trade.expires_at} />}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Amount</span>
          <p className="font-semibold text-foreground">{trade.amount.toLocaleString()} GOR</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Price</span>
          <p className="font-semibold text-foreground">{trade.price_rwf} RWF</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Payment</span>
          <p className="text-foreground">{pm?.label ?? trade.payment_method}</p>
        </div>
      </div>

      {isEscrow && (
        <div className="space-y-2">
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              {isSeller
                ? "Waiting for buyer's payment. Confirm once received."
                : "Send payment to the seller, then wait for confirmation."}
            </span>
          </div>
          {!isSeller && trade.payment_details && (
            <div className="bg-primary/10 rounded-lg p-3 text-xs space-y-1">
              <span className="font-semibold text-primary">Payment Details:</span>
              <p className="text-foreground font-mono">{trade.payment_details}</p>
              <p className="text-muted-foreground">
                Send {(trade.amount * Number(trade.price_rwf)).toLocaleString()} RWF via {pm?.label ?? trade.payment_method}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {isEscrow && isSeller && (
          <Button
            size="sm"
            className="flex-1 gap-1"
            onClick={onConfirm}
            disabled={confirming}
          >
            <CheckCircle className="w-4 h-4" />
            {confirming ? "..." : "Confirm Payment"}
          </Button>
        )}
        {(trade.status === "open" || isEscrow) && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
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
