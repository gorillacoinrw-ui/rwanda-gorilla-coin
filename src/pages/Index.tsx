import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import CoinDisplay from "@/components/CoinDisplay";
import MiningCard from "@/components/MiningCard";
import StatsGrid from "@/components/StatsGrid";
import ReferralCard from "@/components/ReferralCard";
import { NewsFeed } from "@/components/NewsFeed";
import { useMiningTimer } from "@/hooks/use-mining-timer";
import { useProfile } from "@/hooks/use-profile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTrades } from "@/hooks/use-trades";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const Index = () => {
  const [showDescription, setShowDescription] = useState(false);
  const { isMining, formattedTime, progress, miningComplete, startMining } = useMiningTimer();
  const { profile, referralCount } = useProfile();
  const { t } = useLanguage();
  const { baseValue, growthPer100 } = useAppSettings();
  const { user } = useAuth();
  const { myTrades } = useTrades();

  const balance = profile?.coin_balance ?? 0;
  const coinValue = baseValue + Math.floor((profile?.total_mined ?? 0) / 100) * growthPer100;

  const lockedBalance = myTrades
    .filter((t) => t.seller_id === user?.id && (t.status === "open" || t.status === "escrow"))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold tracking-wider">
            GORILLA COIN
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("app.subtitle")}</p>
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

        <CoinDisplay balance={balance} coinValue={coinValue} lockedBalance={lockedBalance} />

        <StatsGrid
          totalUsers={0}
          coinValue={coinValue}
          totalMined={profile?.total_mined ?? 0}
        />

        {/* Desktop: side by side mining + referral */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
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
      </div>
    </AppLayout>
  );
};

export default Index;
