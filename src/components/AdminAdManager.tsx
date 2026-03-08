import { useState } from "react";
import { useAdminAds } from "@/hooks/use-ads";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, EyeOff, Pencil, Image, Video, FileText, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const adTypeIcons: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  text_image: FileText,
};

const AdminAdManager = () => {
  const { ads, isLoading, createAd, updateAd, deleteAd } = useAdminAds();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    ad_type: "image",
    image_url: "",
    video_url: "",
    link_url: "",
    coin_reward: 2,
  });

  const resetForm = () => {
    setForm({ title: "", description: "", ad_type: "image", image_url: "", video_url: "", link_url: "", coin_reward: 2 });
    setEditId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("ad-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (!user) return;

    const payload = {
      title: form.title,
      description: form.description || null,
      ad_type: form.ad_type,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      link_url: form.link_url || null,
      coin_reward: form.coin_reward,
      is_active: true,
      created_by: user.id,
    };

    if (editId) {
      updateAd.mutate({ id: editId, ...payload }, { onSuccess: () => { resetForm(); setOpen(false); } });
    } else {
      createAd.mutate(payload, { onSuccess: () => { resetForm(); setOpen(false); } });
    }
  };

  const startEdit = (ad: any) => {
    setForm({
      title: ad.title,
      description: ad.description || "",
      ad_type: ad.ad_type,
      image_url: ad.image_url || "",
      video_url: ad.video_url || "",
      link_url: ad.link_url || "",
      coin_reward: ad.coin_reward,
    });
    setEditId(ad.id);
    setOpen(true);
  };

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ads ({ads.length})</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Ad" : "Create Ad"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Ad title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
              <Select value={form.ad_type} onValueChange={(v) => setForm((f) => ({ ...f, ad_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image Ad</SelectItem>
                  <SelectItem value="video">Video Ad</SelectItem>
                  <SelectItem value="text_image">Text + Image Ad</SelectItem>
                </SelectContent>
              </Select>

              {(form.ad_type === "image" || form.ad_type === "text_image") && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Ad Image</label>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploading ? (
                      <p className="text-xs text-muted-foreground">Uploading...</p>
                    ) : form.image_url ? (
                      <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Tap to upload image from device</span>
                      </>
                    )}
                  </label>
                  {form.image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
              )}

              {form.ad_type === "video" && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Video</label>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    {uploadingVideo ? (
                      <p className="text-xs text-muted-foreground">Uploading video...</p>
                    ) : form.video_url ? (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Video className="w-4 h-4" />
                        <span>Video uploaded</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Tap to upload video from device</span>
                      </>
                    )}
                  </label>
                  <p className="text-[10px] text-muted-foreground">Or paste a YouTube/video URL below:</p>
                  <Input
                    placeholder="Video URL (optional)"
                    value={form.video_url}
                    onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  />
                  {form.video_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                      onClick={() => setForm((f) => ({ ...f, video_url: "" }))}
                    >
                      Remove video
                    </Button>
                  )}
                </div>
              )}

              <Input
                placeholder="Link URL (optional)"
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              />

              <div>
                <label className="text-xs text-muted-foreground">Coin Reward</label>
                <Input
                  type="number"
                  min={1}
                  value={form.coin_reward}
                  onChange={(e) => setForm((f) => ({ ...f, coin_reward: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={!form.title.trim() || createAd.isPending || updateAd.isPending}>
                {editId ? "Update Ad" : "Create Ad"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((ad) => {
              const TypeIcon = adTypeIcons[ad.ad_type] || Image;
              return (
                <TableRow key={ad.id}>
                  <TableCell>
                    <TypeIcon className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium text-sm">{ad.title}</TableCell>
                  <TableCell className="text-right font-mono">{ad.coin_reward} GOR</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ad.is_active ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                      {ad.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(ad)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateAd.mutate({ id: ad.id, is_active: !ad.is_active })}
                      >
                        {ad.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteAd.mutate(ad.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {ads.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No ads yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminAdManager;
