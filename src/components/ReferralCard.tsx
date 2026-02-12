import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ReferralCardProps {
  referralCode: string;
  referralCount: number;
}

const ReferralCard = ({ referralCode, referralCount }: ReferralCardProps) => {
  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard" });
  };

  const shareApp = () => {
    const text = `Join Gorilla Coin! Use my referral code: ${referralCode} to get 10 free coins! 🦍💰`;
    if (navigator.share) {
      navigator.share({ title: "Gorilla Coin", text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Share text copied to clipboard" });
    }
  };

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-5">
      <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-foreground mb-3">
        Invite & Earn
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Earn <span className="text-primary font-semibold">15 coins</span> for each friend who joins!
      </p>

      <div className="flex items-center gap-2 bg-muted rounded-lg p-3 mb-3">
        <code className="flex-1 text-primary font-display font-bold text-sm tracking-widest">
          {referralCode}
        </code>
        <button onClick={copyCode} className="text-muted-foreground hover:text-primary transition-colors">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{referralCount} friends joined</span>
        <span className="text-xs text-accent font-semibold">+{referralCount * 15} coins earned</span>
      </div>

      <Button
        onClick={shareApp}
        variant="outline"
        className="w-full border-primary/30 text-primary hover:bg-primary/10"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Invite Link
      </Button>
    </div>
  );
};

export default ReferralCard;
