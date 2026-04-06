import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Terms = () => (
  <AppLayout>
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="text-center">
        <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold">Terms & Conditions</h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: April 6, 2026</p>
      </div>

      <Card className="border-border bg-card/90">
        <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6 space-y-4 text-sm text-foreground/90">
          <h2 className="text-base font-display text-primary">1. Acceptance of Terms</h2>
          <p>By accessing and using Gorilla Coin, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.</p>

          <h2 className="text-base font-display text-primary">2. Account Rules</h2>
          <p>Each person may only create one account. Multiple accounts per person are strictly prohibited and will result in account suspension. You must provide accurate information during registration including a valid email and phone number.</p>

          <h2 className="text-base font-display text-primary">3. Gorilla Coin (GOR)</h2>
          <p>GOR is a digital reward token used within the Gorilla Coin platform. It is NOT a cryptocurrency or financial security. GOR has no guaranteed value outside the platform. The value of GOR is determined by the platform's pricing formula and may change.</p>

          <h2 className="text-base font-display text-primary">4. Mining</h2>
          <p>Users can earn GOR through the mining feature. Mining sessions have a fixed duration and reward amount set by administrators. The platform reserves the right to adjust mining rates at any time.</p>

          <h2 className="text-base font-display text-primary">5. Trading</h2>
          <p>P2P trading is available to eligible users. All trades are subject to a platform tax. The escrow system protects both buyers and sellers. Fraudulent trades will result in account suspension.</p>

          <h2 className="text-base font-display text-primary">6. Payments</h2>
          <p>Deposits and withdrawals are processed through Flutterwave (Mobile Money) and PayPal (international). All transactions are verified before balance updates. The platform is not responsible for delays caused by payment providers.</p>

          <h2 className="text-base font-display text-primary">7. Referral Program</h2>
          <p>Users earn GOR for successful referrals. Both referrer and referred user receive bonus coins. Abuse of the referral system (fake accounts, self-referrals) will result in forfeiture of rewards and possible suspension.</p>

          <h2 className="text-base font-display text-primary">8. Prohibited Activities</h2>
          <p>The following are prohibited: creating multiple accounts, using bots or automation tools, attempting to manipulate the platform, engaging in fraudulent transactions, and any activity that violates applicable laws.</p>

          <h2 className="text-base font-display text-primary">9. Limitation of Liability</h2>
          <p>Gorilla Coin is provided "as is" without warranties. The platform is not responsible for losses from technical issues, market fluctuations, or user errors. Maximum liability is limited to the value of GOR in the user's account.</p>

          <h2 className="text-base font-display text-primary">10. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use after changes constitutes acceptance. Users will be notified of significant changes via the platform's notification system.</p>

          <h2 className="text-base font-display text-primary">11. Contact</h2>
          <p>For questions about these terms, contact: <a href="mailto:gorillacoinrw@gmail.com" className="text-primary hover:underline">gorillacoinrw@gmail.com</a></p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default Terms;
