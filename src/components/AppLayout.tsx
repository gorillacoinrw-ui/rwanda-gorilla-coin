import { ReactNode } from "react";
import { Home, Pickaxe, ArrowLeftRight, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Pickaxe, label: "Mine", path: "/mine" },
  { icon: ArrowLeftRight, label: "Trade", path: "/trade" },
  { icon: User, label: "Profile", path: "/profile" },
];

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Flag accent stripe at top */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-rwanda-blue" />
        <div className="flex-1 bg-rwanda-yellow" />
        <div className="flex-1 bg-rwanda-green" />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_hsl(48,95%,55%)]" : ""}`} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
