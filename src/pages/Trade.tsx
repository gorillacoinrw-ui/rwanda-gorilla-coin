import AppLayout from "@/components/AppLayout";
import { ArrowLeftRight } from "lucide-react";

const Trade = () => {
  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider text-center">
          Marketplace
        </h1>

        <div className="bg-gradient-card rounded-xl border border-border p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">Coming Soon</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            P2P trading, MTN Mobile Money & Airtel Money withdrawals are on the way. Stay tuned! 🦍
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Trade;
