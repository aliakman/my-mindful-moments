import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import OnboardingTutorial, { TUTORIAL_KEY } from "@/components/OnboardingTutorial";
import Paywall from "@/components/Paywall";
import PermissionGate from "@/components/PermissionGate";
import { useSubscription } from "@/hooks/useSubscription";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import CollectionDetail from "./pages/CollectionDetail";
import Locations from "./pages/Locations";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Wraps routes that require active subscription; shows paywall if expired */
const ProtectedRoute = ({ hasAccess, children }: { hasAccess: boolean; children: React.ReactNode }) => {
  if (!hasAccess) return <Paywall />;
  return <>{children}</>;
};

/** Inner component that can use context providers */
const AppContent = () => {
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem(TUTORIAL_KEY) !== "true";
  });

  const { hasAccess } = useSubscription();

  if (showTutorial) {
    return <OnboardingTutorial onComplete={() => setShowTutorial(false)} />;
  }

  return (
    <PermissionGate>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute hasAccess={hasAccess}><Index /></ProtectedRoute>} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute hasAccess={hasAccess}>
                <Settings onShowTutorial={() => setShowTutorial(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collection/:id"
            element={<ProtectedRoute hasAccess={hasAccess}><CollectionDetail /></ProtectedRoute>}
          />
          <Route
            path="/locations"
            element={<ProtectedRoute hasAccess={hasAccess}><Locations /></ProtectedRoute>}
          />
          <Route
            path="/statistics"
            element={<ProtectedRoute hasAccess={hasAccess}><Statistics /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </PermissionGate>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SubscriptionProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
