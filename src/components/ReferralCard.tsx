import { Copy, Share2, MessageCircle, Facebook, Instagram, Youtube, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReferralCardProps {
  referralCode: string;
  referralCount: number;
}

const ReferralCard = ({ referralCode, referralCount }: ReferralCardProps) => {
  const { t } = useLanguage();
  const inviteLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const shareText = `Join Gorilla Coin 🦍💰! Use my referral code: ${referralCode} to get 10 free coins! Sign up here: ${inviteLink}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Copied!", description: "Invite link copied to clipboard" });
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/dialog/share?app_id=966242223397117&href=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(shareText)}&display=popup`;
    window.open(url, "_blank");
  };

  const shareInstagram = () => {
    navigator.clipboard.writeText(shareText);
    toast({ title: "Text copied!", description: "Paste it in your Instagram story or DM" });
    window.open("https://www.instagram.com/", "_blank");
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: "Gorilla Coin", text: shareText, url: inviteLink });
    } else {
      copyLink();
    }
  };

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-5">
      <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-foreground mb-3">
        {t("referral.title")}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {t("referral.desc", { coins: 15 })}
      </p>

      <div className="flex items-center gap-2 bg-muted rounded-lg p-3 mb-2">
        <code className="flex-1 text-primary font-display font-bold text-sm tracking-widest">
          {referralCode}
        </code>
        <button onClick={copyLink} className="text-muted-foreground hover:text-primary transition-colors">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5 mb-3">
        <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground truncate">{inviteLink}</span>
        <button onClick={copyLink} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{referralCount} {t("referral.joined")}</span>
        <span className="text-xs text-accent font-semibold">+{referralCount * 15} {t("referral.earned")}</span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <button
          onClick={shareWhatsApp}
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <span className="text-[9px] text-muted-foreground">{t("social.whatsapp")}</span>
        </button>
        <button
          onClick={shareFacebook}
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors"
        >
          <Facebook className="w-5 h-5 text-[#1877F2]" />
          <span className="text-[9px] text-muted-foreground">{t("social.facebook")}</span>
        </button>
        <button
          onClick={shareInstagram}
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-[#E4405F]/10 hover:bg-[#E4405F]/20 transition-colors"
        >
          <Instagram className="w-5 h-5 text-[#E4405F]" />
          <span className="text-[9px] text-muted-foreground">{t("social.instagram")}</span>
        </button>
        <button
          onClick={shareNative}
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Share2 className="w-5 h-5 text-primary" />
          <span className="text-[9px] text-muted-foreground">{t("social.more")}</span>
        </button>
      </div>

      <Button
        onClick={copyLink}
        variant="outline"
        className="w-full border-primary/30 text-primary hover:bg-primary/10"
      >
        <Copy className="w-4 h-4 mr-2" />
        {t("referral.copy")}
      </Button>
    </div>
  );
};

export default ReferralCard;
