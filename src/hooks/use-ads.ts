import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  ad_type: string;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  coin_reward: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface AdView {
  id: string;
  user_id: string;
  ad_id: string;
  coins_earned: number;
  viewed_at: string;
}

const DAILY_AD_LIMIT = 5;

export const useAds = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const activeAds = useQuery({
    queryKey: ["ads", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
    enabled: !!user,
  });

  const myViews = useQuery({
    queryKey: ["ad_views", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_views")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as AdView[];
    },
    enabled: !!user,
  });

  const todayViewCount = (myViews.data ?? []).filter((v) => {
    const viewDate = new Date(v.viewed_at);
    const today = new Date();
    return (
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getDate() === today.getDate()
    );
  }).length;

  const canViewMore = todayViewCount < DAILY_AD_LIMIT;
  const remainingToday = DAILY_AD_LIMIT - todayViewCount;

  const viewedAdIds = new Set((myViews.data ?? []).map((v) => v.ad_id));

  const watchAd = useMutation({
    mutationFn: async ({ adId, reward }: { adId: string; reward: number }) => {
      if (!user) throw new Error("Not authenticated");

      // Insert view record
      const { error: viewError } = await supabase
        .from("ad_views")
        .insert({ user_id: user.id, ad_id: adId, coins_earned: reward });
      if (viewError) throw viewError;

      // Credit coins
      const { data: profile } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ coin_balance: profile.coin_balance + reward })
          .eq("user_id", user.id);
        if (updateError) throw updateError;
      }

      return reward;
    },
    onSuccess: (reward) => {
      toast({ title: "Reward earned! 🎉", description: `You earned ${reward} GOR coins` });
      queryClient.invalidateQueries({ queryKey: ["ad_views"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => {
      if (err.message?.includes("duplicate")) {
        toast({ title: "Already watched", description: "You already earned coins from this ad", variant: "destructive" });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  return {
    ads: activeAds.data ?? [],
    isLoading: activeAds.isLoading,
    viewedAdIds,
    todayViewCount,
    canViewMore,
    remainingToday,
    watchAd,
    dailyLimit: DAILY_AD_LIMIT,
  };
};

// Admin hooks
export const useAdminAds = () => {
  const queryClient = useQueryClient();

  const allAds = useQuery({
    queryKey: ["ads", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
  });

  const createAd = useMutation({
    mutationFn: async (ad: Omit<Ad, "id" | "created_at">) => {
      const { error } = await supabase.from("ads").insert(ad);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ad created" });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateAd = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ad> & { id: string }) => {
      const { error } = await supabase.from("ads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ad updated" });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ad deleted" });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return {
    ads: allAds.data ?? [],
    isLoading: allAds.isLoading,
    createAd,
    updateAd,
    deleteAd,
  };
};
