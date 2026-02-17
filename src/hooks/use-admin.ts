import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminCheck() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
}

export type AdminStats = {
  totalUsers: number;
  totalMined: number;
  totalTrades: number;
  totalTax: number;
  activeTrades: number;
};

export type AdminUser = {
  user_id: string;
  display_name: string | null;
  coin_balance: number;
  total_mined: number;
  referral_code: string;
  created_at: string;
  phone: string | null;
};

export type AdminTrade = {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  amount: number;
  price_rwf: number;
  status: string;
  trade_type: string;
  payment_method: string;
  tax_amount: number | null;
  created_at: string;
};

export type AdminMiningSession = {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  coins_earned: number | null;
};

export function useAdminData() {
  const { user } = useAuth();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, coin_balance, total_mined, referral_code, created_at, phone")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
    enabled: !!user,
  });

  const tradesQuery = useQuery({
    queryKey: ["admin", "trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("id, seller_id, buyer_id, amount, price_rwf, status, trade_type, payment_method, tax_amount, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminTrade[];
    },
    enabled: !!user,
  });

  const miningQuery = useQuery({
    queryKey: ["admin", "mining"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mining_sessions")
        .select("id, user_id, started_at, completed_at, coins_earned")
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AdminMiningSession[];
    },
    enabled: !!user,
  });

  const taxQuery = useQuery({
    queryKey: ["admin", "tax"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_records")
        .select("id, amount, collected_at, trade_id")
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const referralsQuery = useQuery({
    queryKey: ["admin", "referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_id, bonus_credited, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const users = usersQuery.data ?? [];
  const trades = tradesQuery.data ?? [];
  const taxRecords = taxQuery.data ?? [];
  const mining = miningQuery.data ?? [];
  const referrals = referralsQuery.data ?? [];

  const stats: AdminStats = {
    totalUsers: users.length,
    totalMined: users.reduce((s, u) => s + u.total_mined, 0),
    totalTrades: trades.length,
    totalTax: taxRecords.reduce((s, t) => s + t.amount, 0),
    activeTrades: trades.filter((t) => t.status === "open" || t.status === "escrow").length,
  };

  return {
    users,
    trades,
    taxRecords,
    mining,
    referrals,
    stats,
    isLoading: usersQuery.isLoading || tradesQuery.isLoading,
  };
}
