import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type Trade = {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  amount: number;
  price_rwf: number;
  status: string;
  trade_type: string;
  payment_method: string;
  payment_details: string | null;
  min_amount: number;
  max_amount: number;
  tax_amount: number | null;
  expires_at: string | null;
  escrow_started_at: string | null;
  created_at: string;
  updated_at: string;
  seller_profile?: { display_name: string | null; coin_balance: number } | null;
  seller_stats?: { total_orders: number; completed_orders: number; completion_rate: number } | null;
};

export function useTrades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("trades-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["trades"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Check expired trades periodically
  useEffect(() => {
    const checkExpired = async () => {
      try {
        await supabase.functions.invoke("manage-escrow", {
          body: { action: "check_expired" },
        });
      } catch {
        // silent
      }
    };
    checkExpired();
    const interval = setInterval(checkExpired, 60_000);
    return () => clearInterval(interval);
  }, []);

  const openTradesQuery = useQuery({
    queryKey: ["trades", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const sellerIds = [...new Set((data ?? []).map((t) => t.seller_id))];
      const [{ data: profiles }, { data: allTrades }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, coin_balance")
          .in("user_id", sellerIds),
        supabase
          .from("trades")
          .select("seller_id, status")
          .in("seller_id", sellerIds),
      ]);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      // Calculate seller stats
      const statsMap = new Map<string, { total_orders: number; completed_orders: number; completion_rate: number }>();
      sellerIds.forEach((sid) => {
        const sellerTrades = (allTrades ?? []).filter((t) => t.seller_id === sid);
        const total = sellerTrades.length;
        const completed = sellerTrades.filter((t) => t.status === "completed").length;
        statsMap.set(sid, {
          total_orders: total,
          completed_orders: completed,
          completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      });

      return (data ?? []).map((t) => ({
        ...t,
        seller_profile: profileMap.get(t.seller_id) ?? null,
        seller_stats: statsMap.get(t.seller_id) ?? null,
      })) as Trade[];
    },
    enabled: !!user,
  });

  const myTradesQuery = useQuery({
    queryKey: ["trades", "mine", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .in("status", ["escrow", "open"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    enabled: !!user,
  });

  const extractError = async (error: any, fallback: string) => {
    let customMessage: string | null = null;
    try {
      const context = (error as any).context;
      if (context && typeof context.json === "function") {
        const body = await context.json();
        customMessage = body?.error ?? null;
      }
    } catch { /* body already consumed */ }
    return customMessage || error?.message || fallback;
  };

  const createTrade = useMutation({
    mutationFn: async (trade: {
      trade_type: string;
      amount: number;
      price_rwf: number;
      payment_method: string;
      payment_details: string;
      min_amount: number;
      max_amount: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("manage-escrow", {
        body: { action: "create", trade_data: trade },
      });
      if (error) throw new Error(await extractError(error, "Failed to create trade"));
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Order created! 🦍" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const acceptTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-escrow", {
        body: { action: "accept", trade_id: tradeId },
      });
      if (error) {
        // Extract custom error message from FunctionsHttpError
        let customMessage: string | null = null;
        try {
          const context = (error as any).context;
          if (context && typeof context.json === "function") {
            const body = await context.json();
            customMessage = body?.error ?? null;
          }
        } catch {
          // response body already consumed or not available
        }
        throw new Error(customMessage || error.message || "Failed to accept trade");
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Trade accepted! Escrow started (20 min) ⏱️" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const confirmTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-escrow", {
        body: { action: "confirm", trade_id: tradeId },
      });
      if (error) throw new Error(await extractError(error, "Failed to confirm trade"));
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Trade completed! Coins released 🎉" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const cancelTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-escrow", {
        body: { action: "cancel", trade_id: tradeId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Trade cancelled. Coins refunded." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Founder tax sell
  const founderSellTax = useMutation({
    mutationFn: async (trade: {
      amount: number;
      price_rwf: number;
      payment_method: string;
      payment_details: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("manage-escrow", {
        body: { action: "founder_sell_tax", trade_data: trade },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      toast({ title: "Tax sell order created! 💰" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return {
    openTrades: openTradesQuery.data ?? [],
    myTrades: myTradesQuery.data ?? [],
    isLoading: openTradesQuery.isLoading,
    createTrade,
    acceptTrade,
    confirmTrade,
    cancelTrade,
    founderSellTax,
  };
}
