import { Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import AccessKeyGate from "@/components/AccessKeyGate";
import { useAdminCheck, useAdminData } from "@/hooks/use-admin";
import AdminTaskManager from "@/components/AdminTaskManager";
import AdminAdManager from "@/components/AdminAdManager";
import AdminAnalytics from "@/components/AdminAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ArrowLeftRight, Pickaxe, Landmark, UserCheck, Shield, Gift, Tv } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fmt = (d: string) => {
  try { return format(new Date(d), "dd MMM yyyy, HH:mm"); } catch { return d; }
};

const statusColor = (s: string) => {
  switch (s) {
    case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "open": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "escrow": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "cancelled":
    case "expired": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { users, trades, taxRecords, mining, referrals, stats, isLoading } = useAdminData();
  

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Build user map for name lookups
  const userMap = new Map(users.map((u) => [u.user_id, u.display_name || "Unknown"]));

  return (
    <AppLayout>
      <AccessKeyGate settingsKey="admin_access_key" title="Admin Panel Access">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users },
            { label: "Total Mined", value: `${stats.totalMined} GOR`, icon: Pickaxe },
            { label: "Total Trades", value: stats.totalTrades, icon: ArrowLeftRight },
            { label: "Active Trades", value: stats.activeTrades, icon: ArrowLeftRight },
            { label: "Tax Collected", value: `${stats.totalTax} GOR`, icon: Landmark },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <s.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs gap-1"><Gift className="w-3.5 h-3.5" />Tasks</TabsTrigger>
            <TabsTrigger value="ads" className="text-xs gap-1"><Tv className="w-3.5 h-3.5" />Ads</TabsTrigger>
            <TabsTrigger value="trades" className="text-xs gap-1"><ArrowLeftRight className="w-3.5 h-3.5" />Trades</TabsTrigger>
            <TabsTrigger value="mining" className="text-xs gap-1"><Pickaxe className="w-3.5 h-3.5" />Mining</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs gap-1"><Landmark className="w-3.5 h-3.5" />Tax</TabsTrigger>
            <TabsTrigger value="referrals" className="text-xs gap-1"><UserCheck className="w-3.5 h-3.5" />Referrals</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            {isLoading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Mined</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{u.phone || "—"}</TableCell>
                        <TableCell className="text-right font-mono">{u.coin_balance}</TableCell>
                        <TableCell className="text-right font-mono">{u.total_mined}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{u.referral_code}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmt(u.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <AdminTaskManager userMap={userMap} />
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="mt-4">
            <AdminAdManager />
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="mt-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((tr) => (
                    <TableRow key={tr.id}>
                      <TableCell className="capitalize">{tr.trade_type}</TableCell>
                      <TableCell className="text-xs">{userMap.get(tr.seller_id) || tr.seller_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{tr.buyer_id ? (userMap.get(tr.buyer_id) || tr.buyer_id.slice(0, 8)) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{tr.amount}</TableCell>
                      <TableCell className="text-right font-mono">{tr.price_rwf} RWF</TableCell>
                      <TableCell className="uppercase text-xs">{tr.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColor(tr.status)}`}>
                          {tr.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{tr.tax_amount ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(tr.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Mining Tab */}
          <TabsContent value="mining" className="mt-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mining.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{userMap.get(m.user_id) || m.user_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(m.started_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.completed_at ? fmt(m.completed_at) : "In progress"}</TableCell>
                      <TableCell className="text-right font-mono">{m.coins_earned ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tax Tab */}
          <TabsContent value="tax" className="mt-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade ID</TableHead>
                    <TableHead className="text-right">Amount (GOR)</TableHead>
                    <TableHead>Collected At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxRecords.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{t.trade_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-right font-mono font-bold">{t.amount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(t.collected_at)}</TableCell>
                    </TableRow>
                  ))}
                  {taxRecords.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No tax records yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="mt-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{userMap.get(r.referrer_id) || r.referrer_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{userMap.get(r.referred_id) || r.referred_id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.bonus_credited ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground"}>
                          {r.bonus_credited ? "Credited" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {referrals.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No referrals yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </AccessKeyGate>
    </AppLayout>
  );
};

export default Admin;
