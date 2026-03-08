import { ReactNode } from "react";
import { Home, Pickaxe, ArrowLeftRight, User, Clock, Gift, Bot } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Pickaxe, labelKey: "nav.mine", path: "/mine" },
  { icon: Gift, labelKey: "nav.tasks", path: "/tasks" },
  { icon: ArrowLeftRight, labelKey: "nav.trade", path: "/trade" },
  { icon: Bot, labelKey: "nav.chat", path: "/chat" },
  { icon: Clock, labelKey: "nav.history", path: "/history" },
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

      {/* Top bar with notification bell and AI coin below it */}
      <div className="fixed top-2 left-4 z-[60] flex flex-col items-center gap-2">
        <NotificationBell />
        <button
          onClick={() => navigate("/chat")}
          className={`relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-primary/50 flex items-center justify-center shadow-lg animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:scale-110 transition-transform ${
            location.pathname === "/chat" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
          }`}
        >
          <span className="text-xs font-display font-bold text-primary-foreground tracking-tight">AI</span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rwanda-green border border-background animate-bounce" />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-28 md:pb-12 md:pt-20">
        {children}
      </main>

      <div className="pb-16 md:pb-0">
        <Footer />
      </div>

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
