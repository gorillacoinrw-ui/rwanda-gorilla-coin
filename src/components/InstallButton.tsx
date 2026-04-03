import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const InstallButton = () => {
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const { t } = useLanguage();

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canInstall) {
      const accepted = await install();
      if (accepted) {
        toast.success("App installed successfully!");
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
      <span className="text-xs font-medium">Install App</span>
    </Button>
  );
};

export default InstallButton;
