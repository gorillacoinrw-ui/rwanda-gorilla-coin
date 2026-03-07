import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useAppSettings } from "@/hooks/use-app-settings";

interface AccessKeyGateProps {
  settingsKey: "admin_access_key" | "founder_access_key";
  title: string;
  children: React.ReactNode;
}

const AccessKeyGate = ({ settingsKey, title, children }: AccessKeyGateProps) => {
  const [unlocked, setUnlocked] = useState(false);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const { settings } = useAppSettings();

  const storedKey = settings[settingsKey] ? String(settings[settingsKey]) : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === storedKey) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Invalid access key");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <Dialog open={!unlocked} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>Enter the access key to continue</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Access key"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(""); }}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccessKeyGate;
