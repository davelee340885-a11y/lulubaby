import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, WifiOff } from "lucide-react";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  isNetworkError = () => {
    const { error } = this.state;
    if (!error) return false;
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Network") ||
      error.message.includes("Failed to fetch") ||
      error.name === "TypeError"
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetwork = this.isNetworkError();

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            {isNetwork ? (
              <WifiOff size={48} className="text-muted-foreground mb-6" />
            ) : (
              <AlertTriangle size={48} className="text-destructive mb-6" />
            )}

            <h2 className="text-xl font-semibold mb-2">
              {isNetwork ? "網絡連接問題" : "發生了一些問題"}
            </h2>

            <p className="text-muted-foreground mb-6">
              {isNetwork
                ? "請檢查您的網絡連接，然後重試。"
                : "抱歉，頁面遇到了一些問題。請嘗試重新載入頁面。"}
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-4 w-full rounded-lg bg-muted overflow-auto mb-6 text-left">
                <p className="text-sm font-medium text-destructive mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                  {this.state.error.stack?.split("\n").slice(0, 5).join("\n")}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw size={16} />
                重試
              </Button>
              <Button
                onClick={this.handleReload}
                className="gap-2"
              >
                <RotateCcw size={16} />
                重新載入
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="gap-2"
              >
                <Home size={16} />
                返回首頁
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Inline error display component for smaller sections
 */
export function InlineError({
  error,
  onRetry,
  className,
}: {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}) {
  const message = typeof error === "string" ? error : error.message;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center",
        className
      )}
    >
      <AlertTriangle size={32} className="text-destructive mb-3" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RotateCcw size={14} />
          重試
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      {Icon && <Icon size={48} className="text-muted-foreground/50 mb-4" />}
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

/**
 * Loading skeleton component
 */
export function LoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Card loading skeleton
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 space-y-4 animate-pulse",
        className
      )}
    >
      <div className="h-5 bg-muted rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}
