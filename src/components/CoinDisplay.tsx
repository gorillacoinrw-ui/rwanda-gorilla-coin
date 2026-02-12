import gorillaLogo from "@/assets/gorilla-coin-logo.png";

interface CoinDisplayProps {
  balance: number;
  coinValue: number;
}

const CoinDisplay = ({ balance, coinValue }: CoinDisplayProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full glow-gold animate-pulse-slow" />
        <img
          src={gorillaLogo}
          alt="Gorilla Coin"
          className="w-28 h-28 rounded-full relative z-10 animate-spin-slow"
        />
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground font-medium tracking-wider uppercase">Your Balance</p>
        <h2 className="text-4xl font-display font-bold text-gradient-gold mt-1">
          {balance.toLocaleString()}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ≈ {(balance * coinValue).toLocaleString()} RWF
        </p>
      </div>
    </div>
  );
};

export default CoinDisplay;
