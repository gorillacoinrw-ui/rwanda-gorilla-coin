import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SocialTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  platform: string;
  url: string | null;
  coin_reward: number;
  icon: string | null;
  is_active: boolean;
  requires_approval: boolean;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  coins_credited: boolean;
}

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["social_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_tasks")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as SocialTask[];
    },
  });

  const completionsQuery = useQuery({
    queryKey: ["task_completions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_task_completions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as TaskCompletion[];
    },
    enabled: !!user,
  });

  const submitTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_task_completions")
        .insert({ user_id: user.id, task_id: taskId, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_completions", user?.id] });
      toast({ title: "Task submitted!", description: "Waiting for admin approval." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const retryTask = useMutation({
    mutationFn: async ({ completionId }: { completionId: string; taskId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_task_completions")
        .update({ status: "pending", reviewed_at: null, reviewed_by: null, coins_credited: false, submitted_at: new Date().toISOString() })
        .eq("id", completionId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_completions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin_task_completions"] });
      toast({ title: "Task resubmitted!", description: "Waiting for admin approval." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    completions: completionsQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    submitTask,
    retryTask,
  };
}

// Admin hook for managing task approvals
export function useAdminTasks() {
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ["admin_task_completions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_task_completions")
        .select("*")
        .eq("status", "pending")
        .order("submitted_at");
      if (error) throw error;
      return (data ?? []) as TaskCompletion[];
    },
  });

  const allTasksQuery = useQuery({
    queryKey: ["admin_social_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_tasks")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as SocialTask[];
    },
  });

  const approveTask = useMutation({
    mutationFn: async ({ completionId, userId, reward }: { completionId: string; userId: string; reward: number }) => {
      // Update completion status
      const { error: updateError } = await supabase
        .from("user_task_completions")
        .update({ status: "approved", coins_credited: true, reviewed_at: new Date().toISOString() })
        .eq("id", completionId);
      if (updateError) throw updateError;

      // Credit coins to user
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("user_id", userId)
        .single();
      if (profileError) throw profileError;

      const { error: creditError } = await supabase
        .from("profiles")
        .update({ coin_balance: (profile.coin_balance ?? 0) + reward })
        .eq("user_id", userId);
      if (creditError) throw creditError;

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Task Approved! 🎉",
        message: `Your task has been approved! You earned ${reward} GOR coins.`,
        type: "task",
        action_url: "/tasks",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_task_completions"] });
      toast({ title: "Task approved and coins credited!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectTask = useMutation({
    mutationFn: async (completionId: string) => {
      const { error } = await supabase
        .from("user_task_completions")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", completionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_task_completions"] });
      toast({ title: "Task rejected" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: Omit<SocialTask, "id" | "created_at">) => {
      const { error } = await supabase.from("social_tasks").insert(task);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_social_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["social_tasks"] });
      toast({ title: "Task created!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SocialTask> & { id: string }) => {
      const { error } = await supabase.from("social_tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_social_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["social_tasks"] });
      toast({ title: "Task updated!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_social_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["social_tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return {
    pendingCompletions: pendingQuery.data ?? [],
    allTasks: allTasksQuery.data ?? [],
    isLoading: pendingQuery.isLoading,
    approveTask,
    rejectTask,
    createTask,
    updateTask,
    deleteTask,
  };
}
