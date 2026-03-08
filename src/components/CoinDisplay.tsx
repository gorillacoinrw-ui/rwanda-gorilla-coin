import { Lock } from "lucide-react";
import gorillaLogo from "@/assets/gorilla-coin-logo.png";

interface CoinDisplayProps {
  balance: number;
  coinValue: number;
  lockedBalance?: number;
}

const CoinDisplay = ({ balance, coinValue, lockedBalance = 0 }: CoinDisplayProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full glow-gold animate-pulse-slow" />
        <img
          src={gorillaLogo}
          alt="Gorilla Coin"
          className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full relative z-10 animate-spin-slow"
        />
      </div>
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wider uppercase">Your Balance</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gradient-gold mt-1">
          {balance.toLocaleString()}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          ≈ {(balance * coinValue).toLocaleString()} RWF
        </p>
        {lockedBalance > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] sm:text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
            <Lock className="w-3 h-3 text-primary" />
            <span>{lockedBalance.toLocaleString()} GOR locked in trades</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinDisplay;
