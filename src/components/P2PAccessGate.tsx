import { useP2PAccess } from "@/hooks/use-p2p-access";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Coins, Users, ShoppingCart, ShieldAlert } from "lucide-react";

interface P2PAccessGateProps {
  children: (accessLevel: "buy_only" | "full") => React.ReactNode;
}

const P2PAccessGate = ({ children }: P2PAccessGateProps) => {
  const {
    accessLevel,
    balance,
    referrals,
    p2pPurchased,
    hasBalance,
    hasReferrals,
    hasPurchased,
    isLoading,
  } = useP2PAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Checking access...
      </div>
    );
  }

  if (accessLevel === "full" || accessLevel === "buy_only") {
    return <>{children(accessLevel)}</>;
  }

  const requirements = [
    {
      label: "Kugira nibura coin 10,000",
      met: hasBalance,
      current: balance,
      target: 10000,
      icon: Coins,
      progressLabel: `${balance.toLocaleString()} / 10,000`,
    },
    {
      label: "Gutumira abantu 10",
      met: hasReferrals,
      current: referrals,
      target: 10,
      icon: Users,
      progressLabel: `${referrals} / 10`,
    },
    {
      label: "Kugura coin 100 ukoresheje P2P",
      met: hasPurchased,
      current: p2pPurchased,
      target: 100,
      icon: ShoppingCart,
      progressLabel: `${p2pPurchased.toLocaleString()} / 100`,
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="text-center space-y-2">
          <XCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Ubu nturuzuza ibisabwa kugira ngo winjire mu isoko rya P2P.
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Usabwa:</p>
        </div>

        <div className="space-y-4">
          {requirements.map((req, i) => {
            const pct = Math.min(100, (req.current / req.target) * 100);
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                  ) : (
                    <req.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      req.met ? "text-accent line-through" : "text-foreground"
                    }`}
                  >
                    {req.label}
                  </span>
                </div>
                <div className="ml-6 space-y-1">
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{req.progressLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default P2PAccessGate;
