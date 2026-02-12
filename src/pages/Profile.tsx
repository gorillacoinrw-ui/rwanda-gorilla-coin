import AppLayout from "@/components/AppLayout";
import { User, Settings, Globe, Shield, LogOut } from "lucide-react";

const Profile = () => {
  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-display font-bold text-gradient-gold tracking-wider text-center">
          Profile
        </h1>

        {/* Profile card */}
        <div className="bg-gradient-card rounded-xl border border-border p-6 text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-rwanda-flag overflow-hidden border-2 border-primary/30" />
          <div>
            <h3 className="font-display font-semibold text-foreground">Gorilla Miner</h3>
            <p className="text-xs text-muted-foreground">gorilla@example.rw</p>
          </div>
          <div className="flex justify-center gap-6 pt-2">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-primary">142</p>
              <p className="text-[10px] text-muted-foreground uppercase">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-accent">3</p>
              <p className="text-[10px] text-muted-foreground uppercase">Referrals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-secondary">12</p>
              <p className="text-[10px] text-muted-foreground uppercase">Days</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
          {[
            { icon: User, label: "Edit Profile" },
            { icon: Shield, label: "Security & 2FA" },
            { icon: Globe, label: "Language" },
            { icon: Settings, label: "Settings" },
          ].map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-destructive hover:opacity-80 transition-opacity">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;
