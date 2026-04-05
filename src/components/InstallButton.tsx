import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const InstallButton = () => {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (isInstalled) return null;

  const creditInstallReward = async () => {
    if (!user) return;
    try {
      // Check if already claimed
      const { data: existing } = await supabase
        .from("app_install_rewards")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) return; // Already claimed

      // Insert reward record
      const { error: insertErr } = await supabase
        .from("app_install_rewards")
        .insert({ user_id: user.id, coins_earned: 20 });

      if (insertErr) throw insertErr;

      // Credit 20 GOR to balance
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ coin_balance: (await supabase.from("profiles").select("coin_balance").eq("user_id", user.id).single()).data!.coin_balance + 20 })
        .eq("user_id", user.id);

      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("🦍 You earned 20 GOR for installing the app!");
    } catch (err) {
      console.error("Install reward error:", err);
    }
  };

  const handleClick = async () => {
    if (canInstall) {
      const accepted = await install();
      if (accepted) {
        toast.success("App installed successfully!");
        await creditInstallReward();
      }
    } else {
      toast.info("Use your browser menu to install this app", {
        duration: 4000,
      });
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">Install App (+20 GOR)</span>
    </Button>
  );
};

export default InstallButton;
