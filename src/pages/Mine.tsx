import AppLayout from "@/components/AppLayout";
import MiningCard from "@/components/MiningCard";
import { useMiningTimer } from "@/hooks/use-mining-timer";
import gorillaLogo from "@/assets/gorilla-coin-logo.png";

const Mine = () => {
  const { isMining, formattedTime, progress, miningComplete, startMining } = useMiningTimer();

  return (
    <AppLayout>
      <div className="max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold tracking-wider text-center">
          Mining Station
        </h1>

        <div className="flex justify-center">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${isMining ? "glow-gold animate-pulse-slow" : ""}`} />
            <img
              src={gorillaLogo}
              alt="Gorilla Coin"
              className={`w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full relative z-10 ${isMining ? "animate-spin-slow" : ""}`}
            />
          </div>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          <MiningCard
            isMining={isMining}
            formattedTime={formattedTime}
            progress={progress}
            miningComplete={miningComplete}
            onStartMining={startMining}
          />

          <div className="bg-gradient-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-foreground">
              How Mining Works
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Start a 24-hour mining cycle
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Earn 24 Gorilla Coins per cycle
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Coin value grows as more users join
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Coins start at 35 RWF, +5 per 100 users
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Mine;
