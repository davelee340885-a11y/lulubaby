import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect authenticated users to workspace dashboard
  useEffect(() => {
    if (!loading && user) {
      const ws = (user as any).subdomain || user.id;
      setLocation(`/w/${ws}/dashboard`);
    }
  }, [user, loading, setLocation]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Hidden admin entry: tap logo 5 times
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminEntry, setShowAdminEntry] = useState(false);

  const loginMutation = trpc.userAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success("登入成功！");
      const ws = data.user.subdomain || data.user.id;
      setLocation(`/w/${ws}/dashboard`);
    },
    onError: (error) => {
      toast.error(error.message || "登入失敗，請檢查您的電郵和密碼");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const handleManusLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    
    if (tapCountRef.current >= 5) {
      setShowAdminEntry(true);
      tapCountRef.current = 0;
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={handleLogoTap}
              className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden focus:outline-none"
              aria-label="Lulubaby"
            >
              <img src="/logo.png" alt="Lulubaby" className="h-9 w-9" />
            </button>
          </div>
          <CardTitle className="text-2xl font-bold text-center">歡迎回來</CardTitle>
          <CardDescription className="text-center">
            登入您的 Lulubaby 帳戶
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電郵地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密碼</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  忘記密碼？
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="請輸入密碼"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登入中...
                </>
              ) : (
                "登入"
              )}
            </Button>
            
            {/* Hidden admin OAuth entry - only shows after tapping logo 5 times */}
            {showAdminEntry && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">管理員</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleManusLogin}
                >
                  管理員登入
                </Button>
              </>
            )}

            <p className="text-sm text-center text-muted-foreground">
              還沒有帳戶？{" "}
              <Link href="/signup" className="text-primary hover:underline">
                立即註冊
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
