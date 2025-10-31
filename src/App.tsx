import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Segments from "./pages/Segments";
import Events from "./pages/Events";
import Sponsors from "./pages/Sponsors";
import AdminLogs from "./pages/AdminLogs";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Forecast from "./pages/Forecast";
import InsightsPlanner from "./pages/InsightsPlanner";
import Clustering from "./pages/Clustering";
import Orchestrator from "./pages/Orchestrator";
import ZigCasas from "./pages/ZigCasas";
import MarketingAssistant from "./pages/MarketingAssistant";
import Birthdays from "./pages/Birthdays";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout><Dashboard /></AppLayout>} path="/dashboard" />
              <Route element={<AppLayout><Import /></AppLayout>} path="/import" />
              <Route element={<AppLayout><InsightsPlanner /></AppLayout>} path="/insights-planner" />
              <Route element={<AppLayout><Clustering /></AppLayout>} path="/clustering" />
              <Route element={<AppLayout><Orchestrator /></AppLayout>} path="/orchestrator" />
              <Route element={<AppLayout><MarketingAssistant /></AppLayout>} path="/marketing-assistant" />
              <Route element={<AppLayout><ZigCasas /></AppLayout>} path="/zig-casas" />
              <Route element={<AppLayout><Birthdays /></AppLayout>} path="/birthdays" />
              <Route element={<AppLayout><Events /></AppLayout>} path="/events" />
              <Route element={<AppLayout><Sponsors /></AppLayout>} path="/sponsors" />
              <Route element={<AppLayout><Forecast /></AppLayout>} path="/forecast" />
              <Route element={<AppLayout><Segments /></AppLayout>} path="/segments" />
              <Route element={<AppLayout><AdminLogs /></AppLayout>} path="/admin/logs" />
              <Route element={<AppLayout><AdminPanel /></AppLayout>} path="/admin" />
              <Route element={<AppLayout><Settings /></AppLayout>} path="/settings" />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
