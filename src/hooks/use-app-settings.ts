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

  const settings = query.data ?? {};
  const baseValue = (settings.coin_base_value as number) ?? 35;
  const growthPer100 = (settings.coin_growth_per_100_users as number) ?? 5;
  const taxPoolBalance = Number(settings.tax_pool_balance ?? 0);
  const tradingStartDate = settings.trading_start_date ? String(settings.trading_start_date) : null;

  // Check if trading is active (3-month window)
  let tradingActive = true;
  let tradingDaysLeft = 0;
  if (tradingStartDate) {
    const start = new Date(tradingStartDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);
    tradingActive = new Date() < end;
    tradingDaysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return { settings, baseValue, growthPer100, taxPoolBalance, tradingStartDate, tradingActive, tradingDaysLeft, isLoading: query.isLoading };
}
