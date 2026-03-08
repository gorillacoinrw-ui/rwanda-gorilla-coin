import { ReactNode } from "react";
import { Home, Pickaxe, ArrowLeftRight, User, History, Gift } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Pickaxe, labelKey: "nav.mine", path: "/mine" },
  { icon: Gift, labelKey: "nav.tasks", path: "/tasks" },
  { icon: ArrowLeftRight, labelKey: "nav.trade", path: "/trade" },
  { icon: User, labelKey: "nav.profile", path: "/profile" },
];

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-rwanda-blue" />
        <div className="flex-1 bg-rwanda-yellow" />
        <div className="flex-1 bg-rwanda-green" />
      </div>

      {/* Top bar with notification bell */}
      <div className="fixed top-2 left-4 z-[60]">
        <NotificationBell />
      </div>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-6 md:pt-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
        <div className="flex items-center justify-around h-16 max-w-md md:max-w-4xl lg:max-w-6xl mx-auto md:justify-end md:gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-2 px-4 py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_hsl(48,95%,55%)]" : ""}`} />
                <span className="text-[10px] md:text-sm font-medium tracking-wide">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
