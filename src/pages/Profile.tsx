import { useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { User, Settings, Globe, Shield, LogOut, Camera, Loader2, Mail, Phone, Check } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "fr", label: "Français" },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar, referralCount } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit profile
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Security
  const [securityOpen, setSecurityOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Language
  const [langOpen, setLangOpen] = useState(false);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!" });
      setNewPassword("");
      setConfirmPassword("");
      setSecurityOpen(false);
    }
  };

  const handleLanguageSelect = (code: string) => {
    updateProfile.mutate({ language: code });
    setLangOpen(false);
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
          <button
            onClick={openEdit}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            Edit Profile
          </button>
          <button
            onClick={() => setSecurityOpen(true)}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors border-t border-border"
          >
            <Shield className="w-4 h-4 text-muted-foreground" />
            Security & 2FA
          </button>
          <button
            onClick={() => setLangOpen(true)}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors border-t border-border"
          >
            <Globe className="w-4 h-4 text-muted-foreground" />
            Language
            <span className="ml-auto text-xs text-muted-foreground uppercase">
              {profile?.language ?? "en"}
            </span>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors border-t border-border"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            Settings
          </button>
        </div>

        {/* Customer Support */}
        <div className="bg-gradient-card rounded-xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-display font-semibold text-foreground">Customer Support</h3>
          <a
            href="mailto:gorillacoinrw@gmail.com"
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            gorillacoinrw@gmail.com
          </a>
          <a
            href="tel:0785790765"
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            0785790765
          </a>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-destructive hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">Edit Profile</DialogTitle>
            <DialogDescription>Update your display name and phone number.</DialogDescription>
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

      {/* Security & 2FA Dialog */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">Security & 2FA</DialogTitle>
            <DialogDescription>Change your password to keep your account secure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              className="w-full bg-gradient-gold text-primary-foreground font-display"
              disabled={changingPassword}
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={langOpen} onOpenChange={setLangOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">Language</DialogTitle>
            <DialogDescription>Choose your preferred language.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors ${
                  profile?.language === lang.code
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                {lang.label}
                {profile?.language === lang.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">Settings</DialogTitle>
            <DialogDescription>App preferences and account settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Email</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Referral Code</span>
              <span className="text-sm font-mono text-primary">{profile?.referral_code}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Member Since</span>
              <span className="text-sm text-muted-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Profile;
