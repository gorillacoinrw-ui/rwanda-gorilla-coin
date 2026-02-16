import { Button } from "@/components/ui/button";
import { Pickaxe, Loader2 } from "lucide-react";

interface MiningCardProps {
  isMining: boolean;
  formattedTime: string;
  progress: number;
  miningComplete: boolean;
  onStartMining: () => void;
}

const MiningCard = ({ isMining, formattedTime, progress, miningComplete, onStartMining }: MiningCardProps) => {
  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-gold">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-foreground">
          Mining Station
        </h3>
        <div className={`w-2.5 h-2.5 rounded-full ${isMining ? "bg-accent animate-pulse" : miningComplete ? "bg-primary" : "bg-muted-foreground"}`} />
      </div>

      {isMining ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-gradient-gold animate-countdown">
              {formattedTime}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Time remaining</p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-gold rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mining in progress...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          {miningComplete ? (
            <>
              <p className="text-accent font-semibold">Mining complete! +24 Gorilla Coins earned 🎉</p>
              <Button
                onClick={onStartMining}
                className="w-full bg-gradient-gold text-primary-foreground font-display font-semibold tracking-wider hover:opacity-90 transition-opacity"
              >
                <Pickaxe className="w-4 h-4 mr-2" />
                Mine Again
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">Start your 24-hour mining cycle to earn Gorilla Coins</p>
              <Button
                onClick={onStartMining}
                className="w-full bg-gradient-gold text-primary-foreground font-display font-semibold tracking-wider hover:opacity-90 transition-opacity h-12 text-base"
              >
                <Pickaxe className="w-5 h-5 mr-2" />
                Start Mining
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MiningCard;
