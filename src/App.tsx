import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Segments from "./pages/Segments";
import Events from "./pages/Events";
import Sponsors from "./pages/Sponsors";
import AdminLogs from "./pages/AdminLogs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Forecast from "./pages/Forecast";
import InsightsPlanner from "./pages/InsightsPlanner";
import Clustering from "./pages/Clustering";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/insights-planner" element={<InsightsPlanner />} />
            <Route path="/clustering" element={<Clustering />} />
            <Route path="/events" element={<Events />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/sponsors" element={<Forecast />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
