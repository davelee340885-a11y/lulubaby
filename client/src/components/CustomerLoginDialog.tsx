import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Mail, User, LogOut, Loader2 } from "lucide-react";

// Customer session stored in localStorage
const CUSTOMER_TOKEN_KEY = "customer_auth_token";

export type CustomerUser = {
  id: string;
  email: string;
  name?: string;
  provider: "email" | "google" | "apple" | "microsoft";
  personaId: number;
};

interface CustomerLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaId: number;
  primaryColor?: string;
  onLoginSuccess?: (user: CustomerUser) => void;
}

export function CustomerLoginDialog({
  open,
  onOpenChange,
  personaId,
  primaryColor = "#3B82F6",
  onLoginSuccess,
}: CustomerLoginDialogProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendCodeMutation = trpc.customerAuth.sendVerificationCode.useMutation();
  const verifyCodeMutation = trpc.customerAuth.verifyCode.useMutation();

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError("請輸入有效的電郵地址");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await sendCodeMutation.mutateAsync({ email, personaId });
      setStep("code");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "發送驗證碼失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("請輸入6位數驗證碼");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await verifyCodeMutation.mutateAsync({ email, code, personaId });
      if (result.success && result.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
        onLoginSuccess?.(result.user as CustomerUser);
        onOpenChange(false);
        resetForm();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "驗證碼錯誤，請重試");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setError("");
  };

  const handleSocialLogin = (provider: "google" | "apple" | "microsoft") => {
    // Social login would typically redirect to OAuth flow
    // For now, show a message that this feature is coming soon
    setError(`${provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Microsoft"} 登入即將推出`);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">客戶登入</DialogTitle>
          <DialogDescription className="text-center">
            登入後可以保存您的對話記錄
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "email" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">電郵地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                className="w-full"
                style={{ backgroundColor: primaryColor }}
                onClick={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                發送驗證碼
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或使用社交帳號
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("google")}
                  className="w-full"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("apple")}
                  className="w-full"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("microsoft")}
                  className="w-full"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                  </svg>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center text-sm text-muted-foreground mb-4">
                驗證碼已發送至 <span className="font-medium">{email}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">驗證碼</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                className="w-full"
                style={{ backgroundColor: primaryColor }}
                onClick={handleVerifyCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                驗證並登入
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                返回
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage customer authentication state
export function useCustomerAuth(personaId: number) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSessionQuery = trpc.customerAuth.getSession.useQuery(
    { token: typeof window !== "undefined" ? localStorage.getItem(CUSTOMER_TOKEN_KEY) || "" : "" },
    { enabled: typeof window !== "undefined" && !!localStorage.getItem(CUSTOMER_TOKEN_KEY) }
  );

  useEffect(() => {
    if (getSessionQuery.data) {
      if (getSessionQuery.data.user && getSessionQuery.data.user.personaId === personaId) {
        setUser(getSessionQuery.data.user as CustomerUser);
      } else {
        // Token is invalid or for different persona
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        setUser(null);
      }
    }
    setIsLoading(getSessionQuery.isLoading);
  }, [getSessionQuery.data, getSessionQuery.isLoading, personaId]);

  const logout = () => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    setUser(null);
  };

  const login = (newUser: CustomerUser) => {
    setUser(newUser);
  };

  return { user, isLoading, logout, login };
}

// Customer info display component
interface CustomerInfoProps {
  user: CustomerUser;
  onLogout: () => void;
  primaryColor?: string;
}

export function CustomerInfo({ user, onLogout, primaryColor = "#3B82F6" }: CustomerInfoProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>
        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name || user.email}</p>
        {user.name && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={onLogout} title="登出">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Login button component
interface CustomerLoginButtonProps {
  onClick: () => void;
  primaryColor?: string;
  className?: string;
}

export function CustomerLoginButton({ onClick, primaryColor = "#3B82F6", className = "" }: CustomerLoginButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`gap-2 ${className}`}
      style={{ color: primaryColor }}
    >
      <User className="h-4 w-4" />
      登入
    </Button>
  );
}
