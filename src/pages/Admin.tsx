import { useState } from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAdminCheck, useAdminData } from "@/hooks/use-admin";
import { useAdminActions } from "@/hooks/use-admin-actions";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeftRight, Pickaxe, Landmark, UserCheck, Shield, Settings, Coins, XCircle, Edit, Crown, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const fmt = (d: string) => {
  try { return format(new Date(d), "dd MMM yyyy, HH:mm"); } catch { return d; }
};

const statusColor = (s: string) => {
  switch (s) {
    case "completed": return "bg-accent/10 text-accent border-accent/20";
    case "open": return "bg-secondary/10 text-secondary border-secondary/20";
    case "escrow": return "bg-primary/10 text-primary border-primary/20";
    case "cancelled":
    case "expired": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { users, trades, taxRecords, mining, referrals, stats, isLoading } = useAdminData();
  const { adjustBalance, cancelTrade, updateSetting, setUserRole, deleteUser } = useAdminActions();
  const { settings, baseValue, growthPer100, tradingStartDate } = useAppSettings();

  // Dialogs
  const [balanceDialog, setBalanceDialog] = useState<{ open: boolean; userId: string; name: string; current: number }>({ open: false, userId: "", name: "", current: 0 });
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: "", name: "" });
  const [selectedRole, setSelectedRole] = useState("user");

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: "", name: "" });

  // Settings state
  const [editCoinBase, setEditCoinBase] = useState<string>("");
  const [editGrowth, setEditGrowth] = useState<string>("");
  const [editTradingStart, setEditTradingStart] = useState<string>("");

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const userMap = new Map(users.map((u) => [u.user_id, u.display_name || "Unknown"]));

  const handleAdjustBalance = () => {
    const amt = parseInt(balanceAmount);
    if (isNaN(amt) || amt === 0) return;
    adjustBalance.mutate(
      { user_id: balanceDialog.userId, amount: amt, reason: balanceReason },
      { onSuccess: () => { setBalanceDialog({ open: false, userId: "", name: "", current: 0 }); setBalanceAmount(""); setBalanceReason(""); } }
    );
  };

  const handleSetRole = () => {
    setUserRole.mutate(
      { user_id: roleDialog.userId, role: selectedRole },
      { onSuccess: () => { setRoleDialog({ open: false, userId: "", name: "" }); } }
    );
  };

  const handleSaveSetting = (key: string, value: unknown) => {
    updateSetting.mutate({ key, value });
  };

  return (
    <AppLayout>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
            <TabsTrigger value="trades" className="text-xs gap-1"><ArrowLeftRight className="w-3.5 h-3.5" />Orders</TabsTrigger>
            <TabsTrigger value="mining" className="text-xs gap-1"><Pickaxe className="w-3.5 h-3.5" />Mining</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs gap-1"><Landmark className="w-3.5 h-3.5" />Tax</TabsTrigger>
            <TabsTrigger value="referrals" className="text-xs gap-1"><UserCheck className="w-3.5 h-3.5" />Referrals</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Settings className="w-3.5 h-3.5" />Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            {isLoading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Mined</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-primary hover:text-primary"
                              onClick={() => setBalanceDialog({ open: true, userId: u.user_id, name: u.display_name || "User", current: u.coin_balance })}
                            >
                              <Coins className="w-3.5 h-3.5 mr-1" />Balance
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-secondary hover:text-secondary"
                              onClick={() => { setRoleDialog({ open: true, userId: u.user_id, name: u.display_name || "User" }); setSelectedRole("user"); }}
                            >
                              <Crown className="w-3.5 h-3.5 mr-1" />Role
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, userId: u.user_id, name: u.display_name || "User" })}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="mt-4">
            <div className="rounded-lg border border-border overflow-x-auto">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((tr) => {
                    const canCancel = !["completed", "cancelled", "expired"].includes(tr.status);
                    return (
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
                        <TableCell className="text-right">
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              disabled={cancelTrade.isPending}
                              onClick={() => cancelTrade.mutate(tr.id)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Mining Tab */}
          <TabsContent value="mining" className="mt-4">
            <div className="rounded-lg border border-border overflow-x-auto">
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
            <div className="rounded-lg border border-border overflow-x-auto">
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
            <div className="rounded-lg border border-border overflow-x-auto">
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
                        <Badge variant="outline" className={r.bonus_credited ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground"}>
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div className="rounded-xl bg-card border border-border p-6 space-y-5">
                <h3 className="text-sm font-display font-semibold text-foreground tracking-wider uppercase flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />Coin Settings
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Base Coin Value (RWF)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={String(baseValue)}
                        value={editCoinBase}
                        onChange={(e) => setEditCoinBase(e.target.value)}
                        className="bg-muted border-border"
                      />
                      <Button
                        size="sm"
                        disabled={!editCoinBase || updateSetting.isPending}
                        onClick={() => { handleSaveSetting("coin_base_value", Number(editCoinBase)); setEditCoinBase(""); }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Current: {baseValue} RWF</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Growth Per 100 Users (RWF)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={String(growthPer100)}
                        value={editGrowth}
                        onChange={(e) => setEditGrowth(e.target.value)}
                        className="bg-muted border-border"
                      />
                      <Button
                        size="sm"
                        disabled={!editGrowth || updateSetting.isPending}
                        onClick={() => { handleSaveSetting("coin_growth_per_100_users", Number(editGrowth)); setEditGrowth(""); }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Current: {growthPer100} RWF</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border p-6 space-y-5">
                <h3 className="text-sm font-display font-semibold text-foreground tracking-wider uppercase flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />Trading Window
                </h3>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Trading Start Date</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={editTradingStart}
                      onChange={(e) => setEditTradingStart(e.target.value)}
                      className="bg-muted border-border"
                    />
                    <Button
                      size="sm"
                      disabled={!editTradingStart || updateSetting.isPending}
                      onClick={() => { handleSaveSetting("trading_start_date", editTradingStart); setEditTradingStart(""); }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Current: {tradingStartDate || "Not set (trading open indefinitely)"}. Trading auto-stops 3 months after start date.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialog.open} onOpenChange={(open) => { if (!open) setBalanceDialog({ open: false, userId: "", name: "", current: 0 }); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adjust Balance: {balanceDialog.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Current balance: <span className="font-mono font-bold text-foreground">{balanceDialog.current} GOR</span></p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amount (positive to add, negative to deduct)</label>
              <Input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Reason (optional)</label>
              <Input
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                placeholder="Bonus, correction, etc."
                className="bg-muted border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog({ open: false, userId: "", name: "", current: 0 })}>Cancel</Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={adjustBalance.isPending || !balanceAmount}
              className="bg-primary text-primary-foreground"
            >
              {adjustBalance.isPending ? "Saving..." : "Adjust"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => { if (!open) setRoleDialog({ open: false, userId: "", name: "" }); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Set Role: {roleDialog.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, userId: "", name: "" })}>Cancel</Button>
            <Button
              onClick={handleSetRole}
              disabled={setUserRole.isPending}
              className="bg-primary text-primary-foreground"
            >
              {setUserRole.isPending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, userId: "", name: "" }); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User: {deleteDialog.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this user, cancel their active trades, and remove all related data. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, userId: "", name: "" })}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteUser.mutate(deleteDialog.userId, {
                  onSuccess: () => setDeleteDialog({ open: false, userId: "", name: "" }),
                });
              }}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Admin;
