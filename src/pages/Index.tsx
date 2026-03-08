import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import CoinDisplay from "@/components/CoinDisplay";
import MiningCard from "@/components/MiningCard";
import StatsGrid from "@/components/StatsGrid";
import ReferralCard from "@/components/ReferralCard";
import { useMiningTimer } from "@/hooks/use-mining-timer";
import { useProfile } from "@/hooks/use-profile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTrades } from "@/hooks/use-trades";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/use-admin";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Crown, ChevronDown, ChevronUp } from "lucide-react";

const Index = () => {
  const [showDescription, setShowDescription] = useState(false);
  const { isMining, formattedTime, progress, miningComplete, startMining } = useMiningTimer();
  const { profile, referralCount } = useProfile();
  const { t } = useLanguage();
  const { baseValue, growthPer100 } = useAppSettings();
  const { user } = useAuth();
  const { myTrades } = useTrades();
  const { data: isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  const balance = profile?.coin_balance ?? 0;
  const coinValue = baseValue + Math.floor((profile?.total_mined ?? 0) / 100) * growthPer100;

  // Calculate locked coins (coins in open/escrow sell orders by this user)
  const lockedBalance = myTrades
    .filter((t) => t.seller_id === user?.id && (t.status === "open" || t.status === "escrow"))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout>
      <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider">
            GORILLA COIN
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{t("app.subtitle")}</p>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="mt-2 text-xs text-primary flex items-center gap-1 mx-auto hover:underline"
          >
            {showDescription ? t("app.hide") : t("app.about")}
            {showDescription ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDescription && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
              {t("app.description")}
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate("/admin")}
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => navigate("/founder")}
            >
              <Crown className="w-4 h-4" />
              Founder Dashboard
            </Button>
          </div>
        )}

        <CoinDisplay balance={balance} coinValue={coinValue} lockedBalance={lockedBalance} />

        <StatsGrid
          totalUsers={0}
          coinValue={coinValue}
          totalMined={profile?.total_mined ?? 0}
        />

        <MiningCard
          isMining={isMining}
          formattedTime={formattedTime}
          progress={progress}
          miningComplete={miningComplete}
          onStartMining={startMining}
        />

        <ReferralCard
          referralCode={profile?.referral_code ?? "---"}
          referralCount={referralCount}
        />
      </div>
    </AppLayout>
  );
};

export default Index;
