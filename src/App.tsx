import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PouleDetail from "./pages/PouleDetail";
import CreatePoule from "./pages/CreatePoule";
import PouleManagement from "./pages/PouleManagement";
import Matches from "./pages/Matches";
import AdminMatches from "./pages/AdminMatches";
import Players from "./pages/Players";
import AdminPlayers from "./pages/AdminPlayers";
import Auth from "./pages/Auth";
import Guide from "./pages/Guide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/poule/:id" element={<PouleDetail />} />
            <Route path="/create-poule" element={<CreatePoule />} />
            <Route path="/poule-management" element={<PouleManagement />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/admin/matches" element={<AdminMatches />} />
            <Route path="/players" element={<Players />} />
            <Route path="/admin/players" element={<AdminPlayers />} />
            <Route path="/handleiding" element={<Guide />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
