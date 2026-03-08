import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import gorillaLogo from "@/assets/gorilla-coin-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background floating coins */}
      {[
        { size: 'w-10 h-10', left: '8%', delay: '0s', duration: '14s' },
        { size: 'w-8 h-8', left: '25%', delay: '3s', duration: '18s' },
        { size: 'w-12 h-12', left: '50%', delay: '1s', duration: '16s' },
        { size: 'w-7 h-7', left: '70%', delay: '5s', duration: '20s' },
        { size: 'w-9 h-9', left: '90%', delay: '7s', duration: '15s' },
        { size: 'w-6 h-6', left: '35%', delay: '9s', duration: '22s' },
      ].map((coin, i) => (
        <img
          key={i}
          src={gorillaLogo}
          alt=""
          className={`fixed top-0 ${coin.size} rounded-full pointer-events-none z-0`}
          style={{
            left: coin.left,
            animation: `float-coin ${coin.duration} linear ${coin.delay} infinite`,
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
    </div>
  );
};

export default Auth;
