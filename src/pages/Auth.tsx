import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import gorillaLogo from "@/assets/gorilla-coin-logo.png";
import Footer from "@/components/Footer";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-fill referral code from invite link
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false); // Switch to signup mode
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || "Gorilla Miner", referral_code_used: referralCode },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Check your email", description: "We sent you a password reset link." });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-rwanda-blue" />
          <div className="flex-1 bg-rwanda-yellow" />
          <div className="flex-1 bg-rwanda-green" />
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-3">
              <img src={gorillaLogo} alt="Gorilla Coin" className="w-20 h-20 mx-auto rounded-full" />
              <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider">Reset Password</h1>
              <p className="text-xs text-muted-foreground">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="bg-muted border-border text-foreground"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-gold text-primary-foreground font-display font-semibold tracking-wider hover:opacity-90 h-12"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <button onClick={() => setShowForgotPassword(false)} className="text-primary hover:underline font-semibold">
                Back to Sign In
              </button>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background floating coins */}
      {[
        { size: 'w-5 h-5', left: '5%', top: '10%', delay: '0s', duration: '3s' },
        { size: 'w-4 h-4', left: '20%', top: '25%', delay: '1.5s', duration: '4s' },
        { size: 'w-6 h-6', left: '45%', top: '8%', delay: '0.5s', duration: '3.5s' },
        { size: 'w-3 h-3', left: '65%', top: '35%', delay: '2s', duration: '5s' },
        { size: 'w-5 h-5', left: '85%', top: '15%', delay: '3s', duration: '4.5s' },
        { size: 'w-4 h-4', left: '15%', top: '60%', delay: '1s', duration: '3.8s' },
        { size: 'w-3 h-3', left: '75%', top: '70%', delay: '2.5s', duration: '4.2s' },
        { size: 'w-5 h-5', left: '55%', top: '80%', delay: '0.8s', duration: '3.2s' },
        { size: 'w-4 h-4', left: '35%', top: '50%', delay: '3.5s', duration: '5s' },
        { size: 'w-3 h-3', left: '92%', top: '55%', delay: '1.2s', duration: '4s' },
      ].map((coin, i) => (
        <img
          key={i}
          src={gorillaLogo}
          alt=""
          className={`fixed ${coin.size} rounded-full pointer-events-none z-0`}
          style={{
            left: coin.left,
            top: coin.top,
            animation: `twinkle-coin ${coin.duration} ease-in-out ${coin.delay} infinite`,
          }}
        />
      ))}

      <div className="h-1 w-full flex relative z-10">
        <div className="flex-1 bg-rwanda-blue" />
        <div className="flex-1 bg-rwanda-yellow" />
        <div className="flex-1 bg-rwanda-green" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-40 h-24 flex items-end justify-center">
              {/* Left coin */}
              <div className="absolute left-2 bottom-0" style={{ animation: 'fall-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both' }}>
                <div className="absolute inset-0 rounded-full glow-gold animate-pulse-slow" />
                <img src={gorillaLogo} alt="" className="w-14 h-14 rounded-full relative z-10 animate-spin-slow opacity-70" />
              </div>
              {/* Center coin (main) */}
              <div className="relative z-20" style={{ animation: 'fall-in 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
                <div className="absolute inset-0 rounded-full glow-gold animate-pulse-slow" />
                <img src={gorillaLogo} alt="Gorilla Coin" className="w-20 h-20 rounded-full relative z-10 animate-spin-slow" />
              </div>
              {/* Right coin */}
              <div className="absolute right-2 bottom-0" style={{ animation: 'fall-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}>
                <div className="absolute inset-0 rounded-full glow-gold animate-pulse-slow" />
                <img src={gorillaLogo} alt="" className="w-14 h-14 rounded-full relative z-10 animate-spin-slow opacity-70" />
              </div>
            </div>
            <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider">
              GORILLA COIN
            </h1>
            <p className="text-xs text-muted-foreground">Rwanda's Digital Reward</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted border-border text-foreground"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-muted border-border text-foreground"
            />
            {isLogin && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {!isLogin && (
              <Input
                placeholder="Referral Code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-primary-foreground font-display font-semibold tracking-wider hover:opacity-90 h-12"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 gap-2"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) throw error;
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 gap-2"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) throw error;
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-semibold"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
