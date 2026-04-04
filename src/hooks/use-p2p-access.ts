import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";

export type P2PAccessLevel = "blocked" | "buy_only" | "full";

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
    refetchInterval: 10_000,
  });

  const balance = profile?.coin_balance ?? 0;
  const referrals = referralCount;
  const p2pPurchased = p2pPurchasedQuery.data ?? 0;

  const hasBalance = balance >= 10000;
  const hasReferrals = referrals >= 10;
  const hasPurchased = p2pPurchased >= 100;

  let accessLevel: P2PAccessLevel = "blocked";
  if (hasBalance && hasReferrals && hasPurchased) {
    accessLevel = "full";
  } else if (hasBalance && hasReferrals) {
    accessLevel = "buy_only";
  }

  return {
    accessLevel,
    p2pAccess: accessLevel === "full",
    balance,
    referrals,
    p2pPurchased,
    hasBalance,
    hasReferrals,
    hasPurchased,
    isLoading: p2pPurchasedQuery.isLoading,
  };
}
