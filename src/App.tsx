import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Mine from "./pages/Mine";
import Trade from "./pages/Trade";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import History from "./pages/History";
import Chat from "./pages/Chat";
import Tasks from "./pages/Tasks";
import Admin from "./pages/Admin";
import FounderDashboard from "./pages/FounderDashboard";
import Ads from "./pages/Ads";
import Invest from "./pages/Invest";
import ResetPassword from "./pages/ResetPassword";

import Leaderboard from "./pages/Leaderboard";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import RewardedAdProvider from "./components/RewardedAdProvider";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <RewardedAdProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/mine" element={<ProtectedRoute><Mine /></ProtectedRoute>} />
              <Route path="/trade" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/founder" element={<ProtectedRoute><FounderDashboard /></ProtectedRoute>} />
              <Route path="/ads" element={<ProtectedRoute><Ads /></ProtectedRoute>} />
              <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
              
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
              <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </RewardedAdProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
