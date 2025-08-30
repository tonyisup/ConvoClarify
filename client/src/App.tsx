import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home.tsx";
import Landing from "@/pages/landing";
import Subscription from "@/pages/subscription";
import HistoryPage from "@/pages/history";
import AnalysisViewPage from "@/pages/analysis-view";
import SharedAnalysisPage from "@/pages/shared-analysis";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/analysis/:id" component={AnalysisViewPage} />
          <Route path="/subscription" component={Subscription} />
        </>
      )}
      {/* Public routes (no auth required) */}
      <Route path="/shared/:token" component={SharedAnalysisPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="conversation-clarify-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
