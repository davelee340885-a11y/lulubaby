import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Knowledge from "./pages/Knowledge";
import Analytics from "./pages/Analytics";
import Appearance from "./pages/Appearance";
import Domain from "./pages/Domain";
import Training from "./pages/Training";
import Superpowers from "./pages/Superpowers";
import Chat from "./pages/Chat";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/appearance" component={Appearance} />
        <Route path="/domain" component={Domain} />
        <Route path="/training" component={Training} />
        <Route path="/superpowers" component={Superpowers} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public chat page - no auth required */}
      <Route path="/chat/:personaId" component={Chat} />
      
      {/* Dashboard routes - auth required */}
      <Route path="/" component={DashboardRoutes} />
      <Route path="/settings" component={DashboardRoutes} />
      <Route path="/knowledge" component={DashboardRoutes} />
      <Route path="/analytics" component={DashboardRoutes} />
      <Route path="/appearance" component={DashboardRoutes} />
      <Route path="/domain" component={DashboardRoutes} />
      <Route path="/training" component={DashboardRoutes} />
      <Route path="/superpowers" component={DashboardRoutes} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
