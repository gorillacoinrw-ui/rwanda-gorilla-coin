import AppLayout from "@/components/AppLayout";
import CoinDisplay from "@/components/CoinDisplay";
import MiningCard from "@/components/MiningCard";
import StatsGrid from "@/components/StatsGrid";
import ReferralCard from "@/components/ReferralCard";
import { useMiningTimer } from "@/hooks/use-mining-timer";

const DEMO_TOTAL_USERS = 1247;
const COIN_VALUE = 35 + Math.floor(DEMO_TOTAL_USERS / 100) * 5; // 35 + 60 = 95

const Index = () => {
  const { isMining, formattedTime, progress, miningComplete, startMining } = useMiningTimer();

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider">
            GORILLA COIN
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Rwanda's Digital Reward</p>
        </div>

        {/* Coin Balance */}
        <CoinDisplay balance={142} coinValue={COIN_VALUE} />

        {/* Stats */}
        <StatsGrid
          totalUsers={DEMO_TOTAL_USERS}
          coinValue={COIN_VALUE}
          totalMined={28450}
        />

        {/* Mining */}
        <MiningCard
          isMining={isMining}
          formattedTime={formattedTime}
          progress={progress}
          miningComplete={miningComplete}
          onStartMining={startMining}
        />

        {/* Referral */}
        <ReferralCard referralCode="GOR-RW2K5X" referralCount={3} />
      </div>
    </AppLayout>
  );
};

export default Index;
