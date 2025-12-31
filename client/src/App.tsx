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
import Buttons from "./pages/Buttons";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/buttons" component={Buttons} />
        <Route path="/analytics" component={Analytics} />
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
      <Route path="/buttons" component={DashboardRoutes} />
      <Route path="/analytics" component={DashboardRoutes} />
      
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
