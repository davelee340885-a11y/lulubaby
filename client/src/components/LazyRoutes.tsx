import { lazy, Suspense, ComponentType } from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading fallback component for lazy-loaded routes
 */
export function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">載入中...</p>
      </div>
    </div>
  );
}

/**
 * Full page loading fallback
 */
export function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">載入中...</p>
      </div>
    </div>
  );
}

/**
 * Helper to create lazy-loaded components with Suspense
 */
export function lazyWithSuspense<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <RouteLoadingFallback />
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy-loaded page components
// These are the heavier pages that benefit from code splitting

export const LazyDashboard = lazyWithSuspense(
  () => import("@/pages/Dashboard")
);

export const LazyKnowledge = lazyWithSuspense(
  () => import("@/pages/Knowledge")
);

export const LazyAppearance = lazyWithSuspense(
  () => import("@/pages/Appearance")
);

export const LazyDomain = lazyWithSuspense(
  () => import("@/pages/Domain")
);

export const LazyTraining = lazyWithSuspense(
  () => import("@/pages/Training")
);

export const LazySuperpowers = lazyWithSuspense(
  () => import("@/pages/Superpowers")
);

export const LazyCustomers = lazyWithSuspense(
  () => import("@/pages/Customers")
);

export const LazyTeam = lazyWithSuspense(
  () => import("@/pages/Team")
);

export const LazyWidget = lazyWithSuspense(
  () => import("@/pages/Widget")
);

export const LazyPricing = lazyWithSuspense(
  () => import("@/pages/Pricing")
);

export const LazyAccount = lazyWithSuspense(
  () => import("@/pages/Account")
);

// Chat pages - loaded with full page fallback since they're standalone
export const LazyChat = lazyWithSuspense(
  () => import("@/pages/Chat"),
  <PageLoadingFallback />
);

export const LazyCustomDomainChat = lazyWithSuspense(
  () => import("@/pages/CustomDomainChat"),
  <PageLoadingFallback />
);
