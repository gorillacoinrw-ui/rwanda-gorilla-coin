import AppLayout from "@/components/AppLayout";
import CoinDisplay from "@/components/CoinDisplay";
import MiningCard from "@/components/MiningCard";
import StatsGrid from "@/components/StatsGrid";
import ReferralCard from "@/components/ReferralCard";
import { useMiningTimer } from "@/hooks/use-mining-timer";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTrades } from "@/hooks/use-trades";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isMining, formattedTime, progress, miningComplete, startMining } = useMiningTimer();
  const { profile, referralCount } = useProfile();
  const { baseValue, growthPer100 } = useAppSettings();
  const { user } = useAuth();
  const { myTrades } = useTrades();

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
          <p className="text-xs text-muted-foreground mt-1">Rwanda's Digital Reward</p>
        </div>

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
