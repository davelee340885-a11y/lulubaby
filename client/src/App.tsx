import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
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
import Widget from "./pages/Widget";
import CustomDomainChat from "./pages/CustomDomainChat";
import ApiDocs from "./pages/ApiDocs";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";

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
        <Route path="/widget" component={Widget} />
        <Route path="/api-docs" component={ApiDocs} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  // Check if this is a custom domain (not localhost)
  const isCustomDomain = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('manus.computer');
  
  // If custom domain, show custom domain chat page for root path
  if (isCustomDomain && window.location.pathname === '/') {
    return <CustomDomainChat />;
  }
  
  return (
    <Switch>
      {/* Google OAuth callback */}
      <Route path="/auth/google/callback" component={GoogleAuthCallback} />
      
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
      <Route path="/widget" component={DashboardRoutes} />
      <Route path="/api-docs" component={DashboardRoutes} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Network status monitor component
function NetworkStatusMonitor() {
  useNetworkStatus();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <NetworkStatusMonitor />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
