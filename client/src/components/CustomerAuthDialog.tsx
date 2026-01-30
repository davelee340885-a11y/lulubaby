import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";

type AuthMode = "login" | "register" | "forgot-password" | "reset-success";

interface CustomerAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaId: number;
  onLoginSuccess: (customer: {
    id: number;
    email: string | null;
    name: string | null;
  }) => void;
}

export function CustomerAuthDialog({
  open,
  onOpenChange,
  personaId,
  onLoginSuccess,
}: CustomerAuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.customerAuth.login.useMutation();
  const registerMutation = trpc.customerAuth.register.useMutation();
  const forgotPasswordMutation = trpc.customerAuth.requestPasswordReset.useMutation();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        personaId,
        email,
        password,
      });

      if (result.success && result.customer) {
        // Store customer info in localStorage
        localStorage.setItem(
          `customer-${personaId}`,
          JSON.stringify({
            id: result.customer.id,
            email: result.customer.email,
            name: result.customer.name,
          })
        );
        onLoginSuccess({
          id: result.customer.id,
          email: result.customer.email,
          name: result.customer.name,
        });
        resetForm();
        onOpenChange(false);
      } else {
        setError(result.error || "登入失敗");
      }
    } catch (err: any) {
      setError(err.message || "登入失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("密碼不一致");
      return;
    }

    if (password.length < 6) {
      setError("密碼至少需要6個字符");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerMutation.mutateAsync({
        personaId,
        email,
        password,
        name: name || undefined,
      });

      if (result.success && result.customer) {
        // Auto login after registration
        localStorage.setItem(
          `customer-${personaId}`,
          JSON.stringify({
            id: result.customer.id,
            email: result.customer.email,
            name: result.customer.name,
          })
        );
        onLoginSuccess({
          id: result.customer.id,
          email: result.customer.email,
          name: result.customer.name,
        });
        resetForm();
        onOpenChange(false);
      } else {
        setError(result.error || "註冊失敗");
      }
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await forgotPasswordMutation.mutateAsync({
        personaId,
        email,
      });
      setMode("reset-success");
    } catch (err: any) {
      setError(err.message || "發送失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" && "登入帳戶"}
            {mode === "register" && "建立帳戶"}
            {mode === "forgot-password" && "忘記密碼"}
            {mode === "reset-success" && "郵件已發送"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" && "登入後可以保存您的對話記錄"}
            {mode === "register" && "建立帳戶以保存您的對話記錄"}
            {mode === "forgot-password" && "輸入您的電郵地址，我們會發送重設密碼的連結"}
            {mode === "reset-success" && "如果此電郵已註冊，您將收到重設密碼的連結"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電郵地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode("forgot-password")}
                className="text-sm text-primary hover:underline"
              >
                忘記密碼？
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登入中...
                </>
              ) : (
                "登入"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              還沒有帳戶？{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-primary hover:underline"
              >
                立即註冊
              </button>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名稱（選填）</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="您的名稱"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">電郵地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">密碼</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="至少6個字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">確認密碼</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="再次輸入密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  註冊中...
                </>
              ) : (
                "建立帳戶"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              已有帳戶？{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-primary hover:underline"
              >
                立即登入
              </button>
            </div>
          </form>
        )}

        {mode === "forgot-password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">電郵地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  發送中...
                </>
              ) : (
                "發送重設連結"
              )}
            </Button>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回登入
            </button>
          </form>
        )}

        {mode === "reset-success" && (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              如果此電郵已註冊，您將收到重設密碼的連結。請檢查您的收件箱。
            </p>
            <Button
              onClick={() => {
                resetForm();
                switchMode("login");
              }}
              className="w-full"
            >
              返回登入
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
