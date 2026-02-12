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

  return { settings, baseValue, growthPer100, isLoading: query.isLoading };
}
