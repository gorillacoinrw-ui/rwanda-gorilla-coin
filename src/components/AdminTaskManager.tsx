import { useState } from "react";
import { useAdminTasks, SocialTask } from "@/hooks/use-tasks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

const fmt = (d: string) => {
  try { return format(new Date(d), "dd MMM yyyy, HH:mm"); } catch { return d; }
};

interface TaskFormData {
  title: string;
  description: string;
  task_type: string;
  platform: string;
  url: string;
  coin_reward: number;
  icon: string;
  is_active: boolean;
  requires_approval: boolean;
}

const emptyForm: TaskFormData = {
  title: "",
  description: "",
  task_type: "follow",
  platform: "youtube",
  url: "",
  coin_reward: 5,
  icon: "",
  is_active: true,
  requires_approval: true,
};

const platforms = ["youtube", "facebook", "instagram", "tiktok", "twitter", "whatsapp", "telegram", "other"];
const taskTypes = ["follow", "subscribe", "share", "like", "other"];

interface Props {
  userMap: Map<string, string>;
}

export default function AdminTaskManager({ userMap }: Props) {
  const { pendingCompletions, allTasks, approveTask, rejectTask, createTask, updateTask, deleteTask, isLoading } = useAdminTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SocialTask | null>(null);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<"pending" | "manage">("pending");

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (task: SocialTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      task_type: task.task_type,
      platform: task.platform,
      url: task.url || "",
      coin_reward: task.coin_reward,
      icon: task.icon || "",
      is_active: task.is_active,
      requires_approval: task.requires_approval,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.platform) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      task_type: form.task_type,
      platform: form.platform,
      url: form.url.trim() || null,
      coin_reward: form.coin_reward,
      icon: form.icon.trim() || null,
      is_active: form.is_active,
      requires_approval: form.requires_approval,
    };
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createTask.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this task permanently?")) {
      deleteTask.mutate(id);
    }
  };

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <Button size="sm" variant={activeTab === "pending" ? "default" : "outline"} onClick={() => setActiveTab("pending")}>
          Pending Approvals ({pendingCompletions.length})
        </Button>
        <Button size="sm" variant={activeTab === "manage" ? "default" : "outline"} onClick={() => setActiveTab("manage")}>
          Manage Tasks ({allTasks.length})
        </Button>
      </div>

      {activeTab === "pending" && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingCompletions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No pending tasks</TableCell></TableRow>
              ) : pendingCompletions.map((c) => {
                const task = allTasks.find((t) => t.id === c.task_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{userMap.get(c.user_id) || c.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs font-medium">{task?.title ?? "Unknown"}</TableCell>
                    <TableCell className="font-mono text-xs">+{task?.coin_reward ?? 0} GOR</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(c.submitted_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs text-green-500 border-green-500/20 hover:bg-green-500/10"
                          onClick={() => approveTask.mutate({ completionId: c.id, userId: c.user_id, reward: task?.coin_reward ?? 0 })}
                          disabled={approveTask.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10"
                          onClick={() => rejectTask.mutate({ completionId: c.id, userId: c.user_id })}
                          disabled={rejectTask.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "manage" && (
        <>
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Task</Button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No tasks created yet</TableCell></TableRow>
                ) : allTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-xs font-medium">{task.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{task.platform}</Badge></TableCell>
                    <TableCell className="text-xs capitalize">{task.task_type}</TableCell>
                    <TableCell className="text-right font-mono text-xs">+{task.coin_reward} GOR</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={task.is_active ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground"}>
                        {task.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(task)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Subscribe to YouTube" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Platform *</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Task Type</Label>
                <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Coin Reward</Label>
                <Input type="number" min={1} value={form.coin_reward} onChange={(e) => setForm({ ...form, coin_reward: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label className="text-xs">Icon (emoji)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎬" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.requires_approval} onCheckedChange={(v) => setForm({ ...form, requires_approval: v })} />
                <Label className="text-xs">Requires Approval</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createTask.isPending || updateTask.isPending}>
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
