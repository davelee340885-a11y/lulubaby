import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
// Settings page content has been merged into Appearance page
import Knowledge from "./pages/Knowledge";
// Analytics merged into Dashboard
import Appearance from "./pages/Appearance";
import Domain from "./pages/Domain";
import Training from "./pages/Training";
import Superpowers from "./pages/Superpowers";
// Extensions removed - features integrated elsewhere
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Chat from "./pages/Chat";
import Team from "./pages/Team";
import Customers from "./pages/Customers";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        {/* Settings merged into Appearance */}
        <Route path="/knowledge" component={Knowledge} />
        {/* Analytics merged into Dashboard */}
        <Route path="/appearance" component={Appearance} />
        <Route path="/domain" component={Domain} />
        <Route path="/training" component={Training} />
        <Route path="/superpowers" component={Superpowers} />
        {/* Extensions removed - features integrated elsewhere */}
        <Route path="/account" component={Account} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/team" component={Team} />
        <Route path="/customers" component={Customers} />
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
      {/* Settings merged into Appearance */}
      <Route path="/knowledge" component={DashboardRoutes} />
      {/* Analytics merged into Dashboard */}
      <Route path="/appearance" component={DashboardRoutes} />
      <Route path="/domain" component={DashboardRoutes} />
      <Route path="/training" component={DashboardRoutes} />
      <Route path="/superpowers" component={DashboardRoutes} />
      {/* Extensions removed - features integrated elsewhere */}
      <Route path="/account" component={DashboardRoutes} />
      <Route path="/pricing" component={DashboardRoutes} />
      <Route path="/team" component={DashboardRoutes} />
      <Route path="/customers" component={DashboardRoutes} />
      
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
