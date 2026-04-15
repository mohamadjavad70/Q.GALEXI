import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import StarWorld from "./pages/StarWorld";
import QCore from "./pages/QCore";
import CommandCenter from "./pages/CommandCenter";
import Command from "./pages/Command";
import SunCorePage from "./pages/SunCore";
import CommandDashboard from "./pages/CommandDashboard";
import SovereignHub from "./pages/SovereignHub";
import NotFound from "./pages/NotFound";

const GalaxyMode = lazy(() => import("./components/galaxy/GalaxyMode"));
const PlanetWorld = lazy(() => import("./components/planet/PlanetWorld"));

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/star/:slug" element={<StarWorld />} />
        <Route path="/q" element={<QCore />} />
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/command" element={<Command />} />
        <Route path="/sun-core" element={<SunCorePage />} />
        <Route path="/empire" element={<CommandDashboard />} />
        <Route path="/q-sovereign" element={<SovereignHub />} />
        <Route
          path="/galaxy"
          element={
            <Suspense fallback={<div className="w-full h-screen bg-black flex items-center justify-center text-cyan-400 font-mono">🌌 LOADING GALAXY...</div>}>
              <GalaxyMode />
            </Suspense>
          }
        />
        <Route
          path="/planet/:planetId"
          element={
            <Suspense fallback={<div className="w-full h-screen bg-black flex items-center justify-center text-cyan-400 font-mono">🪐 LOADING PLANET...</div>}>
              <PlanetWorld />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => {
  useEffect(() => {
    // Suppress runtime errors from browser extensions (wallets, injected scripts)
    const handleError = (event: ErrorEvent) => {
      const src = event.filename || "";
      const msg = event.message || "";
      if (
        src.includes("chrome-extension://") ||
        src.includes("moz-extension://") ||
        msg.includes("ethereum") ||
        msg.includes("Cannot redefine property")
      ) {
        event.preventDefault();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason || "");
      const stack = String(event.reason?.stack || "");
      if (
        msg.includes("MetaMask") ||
        msg.includes("ethereum") ||
        msg.includes("func sseError not found") ||
        msg.includes("Cannot redefine property") ||
        stack.includes("chrome-extension://") ||
        stack.includes("moz-extension://")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
