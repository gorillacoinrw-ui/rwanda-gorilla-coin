import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const query = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: Record<string, unknown> = {};
      data?.forEach((r) => {
        map[r.key] = r.value;
      });
      return map;
    },
    staleTime: 60_000,
  });

  // Get total user count
  const userCountQuery = useQuery({
    queryKey: ["total_user_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const settings = query.data ?? {};
  const baseValue = Number(settings.coin_base_value ?? settings.base_coin_value ?? 50);
  const growthPer100 = Number(settings.coin_growth_per_100_users ?? settings.growth_rate_per_100_users ?? settings.coin_increment_per_100_users ?? 5);
  const taxPoolBalance = Number(settings.tax_pool_balance ?? 0);
  const minUsersForTrading = Number(settings.min_users_for_trading ?? 100);
  const totalUsers = userCountQuery.data ?? 0;

  // Trading is active only when user count reaches the minimum threshold
  const tradingActive = totalUsers >= minUsersForTrading;
  const usersNeeded = Math.max(0, minUsersForTrading - totalUsers);

  return {
    settings,
    baseValue,
    growthPer100,
    taxPoolBalance,
    tradingActive,
    totalUsers,
    minUsersForTrading,
    usersNeeded,
    isLoading: query.isLoading,
  };
}
