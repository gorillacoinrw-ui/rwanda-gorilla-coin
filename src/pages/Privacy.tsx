import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Privacy = () => (
  <AppLayout>
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="text-center">
        <Shield className="w-10 h-10 text-primary mx-auto mb-2" />
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient-gold">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: April 6, 2026</p>
      </div>

      <Card className="border-border bg-card/90">
        <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6 space-y-4 text-sm text-foreground/90">
          <h2 className="text-base font-display text-primary">1. Information We Collect</h2>
          <p>We collect information you provide directly when creating an account: your name, email address, phone number, and device information for security purposes. We also collect usage data such as mining activity, transaction history, and referral activity.</p>

          <h2 className="text-base font-display text-primary">2. How We Use Your Information</h2>
          <p>Your information is used to: provide and maintain the Gorilla Coin platform, process transactions and rewards, prevent fraud and enforce our one-account policy, send notifications about your account, and improve our services.</p>

          <h2 className="text-base font-display text-primary">3. Data Security</h2>
          <p>We implement industry-standard security measures including encrypted data storage, secure authentication with email verification, device fingerprinting for fraud prevention, and Row Level Security (RLS) policies on all data.</p>

          <h2 className="text-base font-display text-primary">4. Payment Information</h2>
          <p>Payment processing is handled by third-party providers (Flutterwave for Mobile Money, PayPal for international payments). We do not store your payment credentials directly. All payment data is processed securely through our payment partners.</p>

          <h2 className="text-base font-display text-primary">5. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with payment processors to complete transactions, law enforcement when required by law, and service providers who help us operate the platform.</p>

          <h2 className="text-base font-display text-primary">6. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. You can update your profile information at any time through the app settings. To request data deletion, contact us at gorillacoinrw@gmail.com.</p>

          <h2 className="text-base font-display text-primary">7. Cookies & Device Data</h2>
          <p>We use browser fingerprinting (Canvas/WebGL) to enforce our one-account-per-person policy. This data is stored securely and used solely for fraud prevention.</p>

          <h2 className="text-base font-display text-primary">8. Contact Us</h2>
          <p>For privacy-related inquiries, contact us at: <a href="mailto:gorillacoinrw@gmail.com" className="text-primary hover:underline">gorillacoinrw@gmail.com</a></p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default Privacy;
