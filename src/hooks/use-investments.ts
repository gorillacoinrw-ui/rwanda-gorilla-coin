import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useInvestments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const investmentsQuery = useQuery({
    queryKey: ["investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const invest = useMutation({
    mutationFn: async (amount: number) => {
      // Deduct coins from balance
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("user_id", user!.id)
        .single();
      if (profileErr) throw profileErr;
      if ((profile?.coin_balance ?? 0) < amount) throw new Error("Insufficient balance");

      const coinsEarned = Math.floor(amount * 0.12);

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ coin_balance: profile.coin_balance - amount })
        .eq("user_id", user!.id);
      if (updateErr) throw updateErr;

      const { error } = await supabase.from("investments").insert({
        user_id: user!.id,
        amount,
        interest_rate: 0.12,
        coins_earned: coinsEarned,
      });
      if (error) throw error;

      // Send notification
      await supabase.functions.invoke("send-notification", {
        body: {
          user_id: user!.id,
          title: "Investment Started! 📈",
          message: `You invested ${amount} GOR. You'll earn ${coinsEarned} GOR interest in 7 days.`,
          type: "investment",
          send_email: true,
        },
      });
    },
    onSuccess: () => {
      toast.success("Investment started! Your coins are locked for 7 days.");
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to invest");
    },
  });

  const claim = useMutation({
    mutationFn: async ({ investmentId, earlyStop = false }: { investmentId: string; earlyStop?: boolean }) => {
      const investment = investmentsQuery.data?.find((i) => i.id === investmentId);
      if (!investment) throw new Error("Investment not found");
      if (investment.status !== "active") throw new Error("Already claimed");

      let totalReturn: number;
      let earnedInterest: number;

      if (earlyStop) {
        // Calculate proportional profit based on elapsed time
        const start = new Date(investment.started_at).getTime();
        const end = new Date(investment.matures_at).getTime();
        const now = Date.now();
        const elapsed = Math.min(now - start, end - start);
        const ratio = elapsed / (end - start);
        earnedInterest = Math.floor(investment.coins_earned * ratio);
        totalReturn = investment.amount + earnedInterest;
      } else {
        if (new Date(investment.matures_at) > new Date()) throw new Error("Not matured yet");
        earnedInterest = investment.coins_earned;
        totalReturn = investment.amount + earnedInterest;
      }

      // Credit coins back
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("user_id", user!.id)
        .single();
      if (profileErr) throw profileErr;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ coin_balance: profile!.coin_balance + totalReturn })
        .eq("user_id", user!.id);
      if (updateErr) throw updateErr;

      const { error } = await supabase
        .from("investments")
        .update({
          status: earlyStop ? "stopped" : "claimed",
          claimed_at: new Date().toISOString(),
          coins_earned: earnedInterest,
        })
        .eq("id", investmentId);
      if (error) throw error;

      await supabase.functions.invoke("send-notification", {
        body: {
          user_id: user!.id,
          title: earlyStop ? "Investment Stopped ⏹️" : "Investment Matured! 🎉",
          message: earlyStop
            ? `You stopped your investment early. ${investment.amount} GOR capital + ${earnedInterest} GOR profit returned.`
            : `Your investment of ${investment.amount} GOR has matured! You earned ${earnedInterest} GOR interest.`,
          type: "investment",
          send_email: true,
        },
      });
    },
    onSuccess: () => {
      toast.success("Coins returned to your balance!");
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to process");
    },
  });

  const activeInvestments = investmentsQuery.data?.filter((i) => i.status === "active") ?? [];
  const completedInvestments = investmentsQuery.data?.filter((i) => i.status === "claimed" || i.status === "stopped") ?? [];
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  const totalEarnings = completedInvestments.reduce((sum, i) => sum + i.coins_earned, 0);

  return {
    investments: investmentsQuery.data ?? [],
    activeInvestments,
    claimedInvestments,
    totalInvested,
    totalEarnings,
    isLoading: investmentsQuery.isLoading,
    invest,
    claim,
  };
}
