import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";

export function useP2PAccess() {
  const { user } = useAuth();
  const { profile, referralCount } = useProfile();

  const p2pPurchasedQuery = useQuery({
    queryKey: ["p2p-purchased", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("trades")
        .select("amount")
        .eq("buyer_id", user.id)
        .eq("status", "completed");
      if (error) throw error;
      return (data ?? []).reduce((sum, t) => sum + t.amount, 0);
    },
    enabled: !!user,
    refetchInterval: 10_000, // check every 10s for real-time feel
  });

  const balance = profile?.coin_balance ?? 0;
  const referrals = referralCount;
  const p2pPurchased = p2pPurchasedQuery.data ?? 0;

  const hasBalance = balance >= 10000;
  const hasReferrals = referrals >= 10;
  const hasPurchased = p2pPurchased >= 100;
  const p2pAccess = hasBalance && hasReferrals && hasPurchased;

  return {
    p2pAccess,
    balance,
    referrals,
    p2pPurchased,
    hasBalance,
    hasReferrals,
    hasPurchased,
    isLoading: p2pPurchasedQuery.isLoading,
  };
}
