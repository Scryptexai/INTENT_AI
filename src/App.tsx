import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import HybridOnboarding from "./pages/HybridOnboarding";
import BranchingOnboarding from "./pages/BranchingOnboarding";
import PathDetail from "./pages/PathDetail";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
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
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <HybridOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/full"
              element={
                <ProtectedRoute>
                  <BranchingOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/legacy"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/path/:pathId" 
              element={
                <ProtectedRoute>
                  <PathDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspace" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/oauth/*" element={<AuthCallback />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
