import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

async function adminAction(action: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-actions", {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message || "Admin action failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useAdminActions() {
  const queryClient = useQueryClient();

  const adjustBalance = useMutation({
    mutationFn: (params: { user_id: string; amount: number; reason?: string }) =>
      adminAction("adjust_balance", params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Balance adjusted", description: `New balance: ${data.new_balance} GOR` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const cancelTrade = useMutation({
    mutationFn: (trade_id: string) => adminAction("admin_cancel_trade", { trade_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Trade cancelled", description: "Coins refunded if applicable" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateSetting = useMutation({
    mutationFn: (params: { key: string; value: unknown }) =>
      adminAction("update_setting", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      toast({ title: "Setting saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const setUserRole = useMutation({
    mutationFn: (params: { user_id: string; role: string }) =>
      adminAction("set_user_role", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return { adjustBalance, cancelTrade, updateSetting, setUserRole };
}
