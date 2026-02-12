import { useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { User, Settings, Globe, Shield, LogOut, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar, referralCount } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
  };

  const openEdit = () => {
    setDisplayName(profile?.display_name ?? "");
    setPhone(profile?.phone ?? "");
    setEditOpen(true);
  };

  const saveProfile = () => {
    updateProfile.mutate({ display_name: displayName, phone });
    setEditOpen(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider text-center">
          Profile
        </h1>

        {/* Profile card */}
        <div className="bg-gradient-card rounded-xl border border-border p-6 text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto">
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="Avatar" />
              <AvatarFallback className="bg-muted text-foreground text-xl font-display">
                {(profile?.display_name ?? "G")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              {profile?.display_name ?? "Gorilla Miner"}
            </h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex justify-center gap-6 pt-2">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-primary">{profile?.coin_balance ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-accent">{referralCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-secondary">{profile?.total_mined ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Mined</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <button
                onClick={openEdit}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Edit Profile
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-gradient-gold">Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250..." />
                </div>
                <Button
                  onClick={saveProfile}
                  className="w-full bg-gradient-gold text-primary-foreground font-display"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {[
            { icon: Shield, label: "Security & 2FA" },
            { icon: Globe, label: "Language" },
            { icon: Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors border-t border-border"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-destructive hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;
