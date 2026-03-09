import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminNewsManager() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: news, isLoading } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createNews = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("news")
        .insert([{ title, content, created_by: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("News created successfully");
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["active-news"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from("news")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["active-news"] });
    }
  });

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("News deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["active-news"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    createNews.mutate();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="p-4 bg-card border border-border rounded-xl space-y-4">
        <h3 className="text-lg font-bold">Add News</h3>
        <Input 
          placeholder="Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          disabled={createNews.isPending}
        />
        <Textarea 
          placeholder="Content..." 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          disabled={createNews.isPending}
          className="min-h-[100px]"
        />
        <Button type="submit" disabled={createNews.isPending || !title || !content}>
          <Plus className="w-4 h-4 mr-2" /> Add News
        </Button>
      </form>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
            ) : news?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Switch 
                    checked={item.is_active} 
                    onCheckedChange={(checked) => toggleActive.mutate({ id: item.id, is_active: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteNews.mutate(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {news?.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No news found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}