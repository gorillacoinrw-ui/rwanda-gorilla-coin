import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Smartphone, Globe, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const balance = profile?.coin_balance ?? 0;
  const balanceRWF = balance * coinValue;

  const handleDeposit = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (selectedMethod === "paypal") {
      toast.info("PayPal integration requires API keys. Coming soon!");
      return;
    }

    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          action: "deposit",
          amount: Number(amount),
          phone_number: phone,
          currency: "RWF",
          network: selectedMethod === "mtn" ? "MTN" : "AIRTEL",
        },
      });

      if (error) throw error;

      if (data?.data?.data?.link) {
        window.open(data.data.data.link, "_blank");
        toast.success("Payment page opened! Complete the payment on the new tab.");
      } else if (data?.success) {
        toast.success("Payment initiated! Check your phone for the USSD prompt.");
      } else {
        toast.error(data?.error || "Payment failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
      setDepositOpen(false);
      setAmount("");
      setPhone("");
      setSelectedMethod(null);
    }
  };

  const handleWithdraw = async () => {
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

    if (selectedMethod === "paypal") {
      toast.info("PayPal integration requires API keys. Coming soon!");
      return;
    }

    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const rwfAmount = Number(amount) * coinValue;
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          action: "withdraw",
          amount: rwfAmount,
          phone_number: phone,
          currency: "RWF",
          network: selectedMethod === "mtn" ? "MTN" : "AIRTEL",
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Withdrawal initiated! Funds will be sent to your phone shortly.");
      } else {
        toast.error(data?.error || "Withdrawal failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
      setWithdrawOpen(false);
      setAmount("");
      setPhone("");
      setSelectedMethod(null);
    }
  };

  const isMobileMoney = selectedMethod === "mtn" || selectedMethod === "airtel";

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
            {isMobileMoney && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0781234567"
                />
              </div>
            )}
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
            <Button onClick={handleDeposit} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-display">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownToLine className="w-4 h-4 mr-2" />}
              {loading ? "Processing..." : t("wallet.deposit")}
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
            {isMobileMoney && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0781234567"
                />
              </div>
            )}
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
            <Button onClick={handleWithdraw} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-display">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4 mr-2" />}
              {loading ? "Processing..." : t("wallet.withdraw")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Wallet;
