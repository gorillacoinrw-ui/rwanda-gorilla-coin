import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Smartphone, Globe, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = "mtn" | "airtel" | "paypal";

const PAYMENT_METHODS = {
  africa: [
    { id: "mtn" as PaymentMethod, label: "MTN Mobile Money", icon: Smartphone, color: "text-yellow-500" },
    { id: "airtel" as PaymentMethod, label: "Airtel Money", icon: Smartphone, color: "text-red-500" },
  ],
  international: [
    { id: "paypal" as PaymentMethod, label: "PayPal (USD/EUR)", icon: Globe, color: "text-blue-500" },
  ],
};

const Wallet = () => {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const { totalUsers } = useAppSettings();
  const coinValue = 35 + Math.floor(totalUsers / 100) * 5;

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState("");

  const balance = profile?.coin_balance ?? 0;
  const balanceRWF = balance * coinValue;

  const handleDeposit = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    toast.info("Payment integration coming soon! You'll need Flutterwave/PayPal API keys to enable deposits.");
    setDepositOpen(false);
    setAmount("");
    setSelectedMethod(null);
  };

  const handleWithdraw = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (Number(amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }
    toast.info("Payment integration coming soon! You'll need Flutterwave/PayPal API keys to enable withdrawals.");
    setWithdrawOpen(false);
    setAmount("");
    setSelectedMethod(null);
  };

  const PaymentMethodSelector = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mobile Money (Africa)</p>
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.africa.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
              selectedMethod === method.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted/50 text-foreground"
            }`}
          >
            <method.icon className={`w-4 h-4 ${method.color}`} />
            <span className="text-xs font-medium">{method.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-4">International</p>
      <div className="grid grid-cols-1 gap-2">
        {PAYMENT_METHODS.international.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
              selectedMethod === method.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted/50 text-foreground"
            }`}
          >
            <method.icon className={`w-4 h-4 ${method.color}`} />
            <span className="text-xs font-medium">{method.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold tracking-wider text-center">
          {t("wallet.title")}
        </h1>

        {/* Balance Card */}
        <Card className="border-border bg-gradient-card">
          <CardContent className="pt-6 text-center space-y-2">
            <WalletIcon className="w-10 h-10 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("wallet.balance")}</p>
            <h2 className="text-4xl font-display font-bold text-gradient-gold">{balance.toLocaleString()}</h2>
            <p className="text-sm text-muted-foreground">≈ {balanceRWF.toLocaleString()} RWF</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setDepositOpen(true)}
            className="h-14 bg-gradient-to-r from-primary to-accent text-primary-foreground font-display text-base gap-2"
          >
            <ArrowDownToLine className="w-5 h-5" />
            {t("wallet.deposit")}
          </Button>
          <Button
            onClick={() => setWithdrawOpen(true)}
            variant="outline"
            className="h-14 border-primary text-primary font-display text-base gap-2 hover:bg-primary/10"
          >
            <ArrowUpFromLine className="w-5 h-5" />
            {t("wallet.withdraw")}
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Payment Setup Required</p>
              <p>Deposits and withdrawals require Flutterwave and PayPal API keys. Once configured, you'll be able to:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Deposit via MTN/Airtel Mobile Money (Rwanda)</li>
                <li>Deposit via PayPal (International)</li>
                <li>Withdraw to Mobile Money or PayPal</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="border-border bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t("wallet.transactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("wallet.noTransactions")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">{t("wallet.deposit")}</DialogTitle>
            <DialogDescription>Choose a payment method and amount to deposit</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <PaymentMethodSelector />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (RWF)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in RWF"
                min="100"
              />
              {amount && Number(amount) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {Math.floor(Number(amount) / coinValue)} GOR coins
                </p>
              )}
            </div>
            <Button onClick={handleDeposit} className="w-full bg-gradient-gold text-primary-foreground font-display">
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              {t("wallet.deposit")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">{t("wallet.withdraw")}</DialogTitle>
            <DialogDescription>Withdraw your GOR coins to money</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <PaymentMethodSelector />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (GOR)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter GOR amount"
                max={balance}
                min="1"
              />
              {amount && Number(amount) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {(Number(amount) * coinValue).toLocaleString()} RWF
                </p>
              )}
            </div>
            <Button onClick={handleWithdraw} className="w-full bg-gradient-gold text-primary-foreground font-display">
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              {t("wallet.withdraw")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Wallet;
