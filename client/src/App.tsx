import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Knowledge from "./pages/Knowledge";
import Appearance from "./pages/Appearance";
import Domain from "./pages/Domain";
import Training from "./pages/Training";
import Superpowers from "./pages/Superpowers";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Chat from "./pages/Chat";
import Team from "./pages/Team";
import Customers from "./pages/Customers";
import Widget from "./pages/Widget";
import CustomDomainChat from "./pages/CustomDomainChat";
import ApiDocs from "./pages/ApiDocs";
import Brain from "./pages/Brain";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import AgentChatPage from "./pages/AgentChatPage";
import { BackgroundTaskProvider } from "./contexts/BackgroundTaskContext";
import { AgentChatProvider } from "./contexts/AgentChatContext";
import { BackgroundTaskIndicator } from "./components/BackgroundTaskIndicator";
import SubdomainChat from "./pages/SubdomainChat";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminUsers from "./pages/AdminUsers";
import HomePage from "./pages/HomePage";
import WidgetClient from "./pages/WidgetClient";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// WorkspaceGuard: validates session + workspaceId ownership
function WorkspaceGuard({ children, workspaceId }: { children: React.ReactNode; workspaceId: string }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Determine if workspace mismatch exists
  const userWs = user ? (user.subdomain || String(user.id)) : null;
  const isMismatch = !!(user && userWs && userWs !== workspaceId && String(user.id) !== workspaceId);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation("/login");
    } else if (isMismatch && userWs) {
      setLocation(`/w/${userWs}/dashboard`);
    }
  }, [user, loading, isMismatch, userWs, setLocation]);

  if (loading || !user || isMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

// DashboardRoutes: renders dashboard layout with workspace-aware paths
function DashboardRoutes({ workspaceId }: { workspaceId: string }) {
  return (
    <DashboardLayout workspaceId={workspaceId}>
      <Switch>
        <Route path="/w/:workspaceId/dashboard" component={Dashboard} />
        <Route path="/w/:workspaceId/knowledge" component={Knowledge} />
        <Route path="/w/:workspaceId/appearance" component={Appearance} />
        <Route path="/w/:workspaceId/domain" component={Domain} />
        <Route path="/w/:workspaceId/training" component={Training} />
        <Route path="/w/:workspaceId/superpowers" component={Superpowers} />
        <Route path="/w/:workspaceId/brain" component={Brain} />
        <Route path="/w/:workspaceId/account" component={Account} />
        <Route path="/w/:workspaceId/pricing" component={Pricing} />
        <Route path="/w/:workspaceId/feed" component={Pricing} />
        <Route path="/w/:workspaceId/team" component={Team} />
        <Route path="/w/:workspaceId/customers" component={Customers} />
        <Route path="/w/:workspaceId/widget" component={Widget} />
        <Route path="/w/:workspaceId/api-docs" component={ApiDocs} />
        <Route path="/w/:workspaceId/admin/users" component={AdminUsers} />
        <Route path="/w/:workspaceId/agent-chat" component={AgentChatPage} />
        {/* Default: show dashboard */}
        <Route>{() => <Dashboard />}</Route>
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // xxx.lulubaby.xyz subdomains → pure customer chat, no login, no dashboard
  const isLulubabySubdomain = hostname.endsWith('.lulubaby.xyz') && hostname !== 'lulubaby.xyz';
  
  // Other custom domains (not manus, not lulubaby.xyz) → pure customer chat
  const isOtherCustomDomain = typeof window !== 'undefined' && 
    hostname !== 'localhost' && 
    hostname !== '127.0.0.1' &&
    !hostname.includes('manus.computer') &&
    !hostname.endsWith('.manus.space') &&
    hostname !== 'lulubaby.xyz' &&
    !hostname.endsWith('.lulubaby.xyz');
  
  // Subdomain or other custom domain → pure chat only (no login, no dashboard)
  if (isLulubabySubdomain || isOtherCustomDomain) {
    return <CustomDomainChat />;
  }
  
  // All other domains (lulubaby.xyz, manus preview, localhost)
  return (
    <Switch>
      {/* Authentication pages */}
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/auth/google/callback" component={GoogleAuthCallback} />
      
      {/* Widget client for iframe embedding */}
      <Route path="/widget-client" component={WidgetClient} />
      
      {/* Public chat pages */}
      <Route path="/chat/:personaId" component={Chat} />
      <Route path="/s/:subdomain" component={SubdomainChat} />
      
      {/* Workspace routes (core) — guarded by WorkspaceGuard */}
      <Route path="/w/:workspaceId/*">
        {(params: { workspaceId: string }) => (
          <WorkspaceGuard workspaceId={params.workspaceId}>
            <DashboardRoutes workspaceId={params.workspaceId} />
          </WorkspaceGuard>
        )}
      </Route>
      
      {/* Root path: Landing page / HomePage */}
      <Route path="/" component={HomePage} />
      
      {/* Legacy dashboard paths → redirect to workspace if logged in */}
      <Route path="/:rest*">
        {() => <LegacyRedirect />}
      </Route>
    </Switch>
  );
}

// LegacyRedirect: handles old /dashboard, /knowledge etc. paths
// Redirects logged-in users to /w/{subdomain}/... or to login
function LegacyRedirect() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (user && user.subdomain) {
      // Redirect old path to workspace path
      const path = location.startsWith('/') ? location : `/${location}`;
      setLocation(`/w/${user.subdomain}${path}`);
    } else {
      setLocation("/login");
    }
  }, [user, loading, location, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function NetworkStatusMonitor() {
  useNetworkStatus();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <BackgroundTaskProvider>
            <AgentChatProvider>
              <Toaster />
              <NetworkStatusMonitor />
              <BackgroundTaskIndicator />
              <Router />
            </AgentChatProvider>
          </BackgroundTaskProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
