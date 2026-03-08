import { useMemo } from "react";
import { useAdminData } from "@/hooks/use-admin";
import { useAdminAds } from "@/hooks/use-ads";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Pickaxe, ArrowLeftRight, Tv, TrendingUp, Coins, Calendar, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(48,95%,55%)", "hsl(142,71%,45%)", "hsl(217,91%,60%)", "hsl(0,84%,60%)", "hsl(280,65%,60%)"];

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <div className="p-4 rounded-xl bg-card border border-border space-y-1">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
  </div>
);

const AdminAnalytics = () => {
  const { users, trades, mining, referrals, stats } = useAdminData();

  const adViews = useQuery({
    queryKey: ["admin_ad_views_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_views").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { ads } = useAdminAds();

  // User growth over last 30 days
  const userGrowth = useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "yyyy-MM-dd");
      const count = users.filter(
        (u) => format(new Date(u.created_at), "yyyy-MM-dd") === dayStr
      ).length;
      data.push({ date: format(day, "MMM dd"), users: count });
    }
    return data;
  }, [users]);

  // Mining activity over last 14 days
  const miningActivity = useMemo(() => {
    const days = 14;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "yyyy-MM-dd");
      const sessions = mining.filter(
        (m) => format(new Date(m.started_at), "yyyy-MM-dd") === dayStr
      );
      const earned = sessions.reduce((sum, m) => sum + (m.coins_earned ?? 0), 0);
      data.push({ date: format(day, "dd"), sessions: sessions.length, earned });
    }
    return data;
  }, [mining]);

  // Trade stats over last 14 days
  const tradeActivity = useMemo(() => {
    const days = 14;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "yyyy-MM-dd");
      const dayTrades = trades.filter(
        (t) => format(new Date(t.created_at), "yyyy-MM-dd") === dayStr
      );
      const volume = dayTrades.reduce((sum, t) => sum + t.amount, 0);
      data.push({ date: format(day, "dd"), trades: dayTrades.length, volume });
    }
    return data;
  }, [trades]);

  // Trade status breakdown
  const tradeStatusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [trades]);

  // Ad performance
  const adPerformance = useMemo(() => {
    const views = adViews.data ?? [];
    const totalViews = views.length;
    const totalEarned = views.reduce((sum, v) => sum + v.coins_earned, 0);
    const topAds = ads.map((ad) => ({
      title: ad.title,
      views: views.filter((v) => v.ad_id === ad.id).length,
    })).sort((a, b) => b.views - a.views).slice(0, 5);
    return { totalViews, totalEarned, topAds };
  }, [adViews.data, ads]);

  // Active users (mined in last 7 days)
  const activeMiners = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    const unique = new Set(
      mining.filter((m) => new Date(m.started_at) >= weekAgo).map((m) => m.user_id)
    );
    return unique.size;
  }, [mining]);

  const totalCoinsInCirculation = users.reduce((sum, u) => sum + u.coin_balance, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${activeMiners} active this week`} />
        <StatCard icon={Coins} label="Coins in Circulation" value={totalCoinsInCirculation.toLocaleString()} sub="GOR" />
        <StatCard icon={Pickaxe} label="Total Mined" value={`${stats.totalMined} GOR`} sub={`${mining.length} sessions`} />
        <StatCard icon={ArrowLeftRight} label="Total Trades" value={stats.totalTrades} sub={`${stats.activeTrades} active`} />
        <StatCard icon={TrendingUp} label="Referrals" value={referrals.length} />
        <StatCard icon={BarChart3} label="Tax Collected" value={`${stats.totalTax} GOR`} />
        <StatCard icon={Tv} label="Ad Views" value={adPerformance.totalViews} sub={`${adPerformance.totalEarned} GOR earned`} />
        <StatCard icon={Calendar} label="Active Ads" value={ads.filter((a) => a.is_active).length} sub={`of ${ads.length} total`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Growth */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> User Growth (30 days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="hsl(48,95%,55%)" fill="hsl(48,95%,55%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mining Activity */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pickaxe className="w-4 h-4 text-primary" /> Mining Activity (14 days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miningActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="sessions" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade Activity */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" /> Trade Activity (14 days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="trades" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade Status Pie */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Trade Status Breakdown
          </h3>
          <div className="h-48 flex items-center justify-center">
            {tradeStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tradeStatusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {tradeStatusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">No trades yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Ads */}
      {adPerformance.topAds.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Tv className="w-4 h-4 text-primary" /> Top Ads by Views
          </h3>
          <div className="space-y-2">
            {adPerformance.topAds.map((ad, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate flex-1">{ad.title}</span>
                <span className="text-muted-foreground font-mono ml-2">{ad.views} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
