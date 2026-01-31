import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  MessageSquare, 
  Calendar,
  ArrowLeft,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  LogOut
} from "lucide-react";

type CustomerProfile = {
  id: number;
  personaId: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  preferredLanguage: string | null;
  totalConversations: number;
  totalMessages: number;
  lastVisitAt: Date | null;
  firstVisitAt: Date;
  createdAt: Date;
};

export default function CustomerDashboard() {
  const currentDomain = window.location.hostname;
  
  // Get persona ID from domain
  const { data: domainInfo, isLoading: domainLoading } = trpc.domains.getPublishedDomain.useQuery(
    { domain: currentDomain }
  );
  
  const personaId = domainInfo?.personaId || 0;
  
  // Get customer from localStorage
  const [customerId, setCustomerId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      // Try to get from URL or localStorage
      const stored = localStorage.getItem(`customer-${personaId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.id;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Update customerId when personaId changes
  useEffect(() => {
    if (personaId) {
      const stored = localStorage.getItem(`customer-${personaId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCustomerId(parsed.id);
        } catch {
          setCustomerId(null);
        }
      }
    }
  }, [personaId]);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.customerAuth.getProfile.useQuery(
    { customerId: customerId || 0 },
    { enabled: !!customerId }
  );

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const updateProfileMutation = trpc.customerAuth.updateProfile.useMutation();
  const changePasswordMutation = trpc.customerAuth.changePassword.useMutation();

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCompany(profile.company || "");
      setTitle(profile.title || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      await updateProfileMutation.mutateAsync({
        customerId,
        name: name || undefined,
        phone: phone || undefined,
        company: company || undefined,
        title: title || undefined,
      });
      
      // Update localStorage
      const stored = localStorage.getItem(`customer-${personaId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = name;
        localStorage.setItem(`customer-${personaId}`, JSON.stringify(parsed));
      }
      
      setSaveSuccess(true);
      refetchProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("新密碼不一致");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("新密碼至少需要6個字符");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePasswordMutation.mutateAsync({
        customerId,
        currentPassword,
        newPassword,
      });

      if (result.success) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(result.error || "更改密碼失敗");
      }
    } catch (err: any) {
      setPasswordError(err.message || "更改密碼失敗");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (personaId) {
      localStorage.removeItem(`customer-${personaId}`);
    }
    window.location.href = "/";
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  // Loading state
  if (domainLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!customerId || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>請先登入</CardTitle>
            <CardDescription>您需要登入才能查看帳戶資料</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack} className="w-full">
              返回首頁登入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回聊天
          </Button>
          <h1 className="text-lg font-semibold">我的帳戶</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700">
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Summary Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {profile.name?.[0] || profile.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{profile.name || "未設定名稱"}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-2 justify-end">
                  <MessageSquare className="h-4 w-4" />
                  <span>{profile.totalMessages} 則訊息</span>
                </div>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>加入於 {new Date(profile.createdAt).toLocaleDateString("zh-TW")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">個人資料</TabsTrigger>
            <TabsTrigger value="security">安全設定</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>個人資料</CardTitle>
                <CardDescription>更新您的個人資料</CardDescription>
              </CardHeader>
              <CardContent>
                {saveSuccess && (
                  <Alert className="mb-4 border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700">資料已儲存</AlertDescription>
                  </Alert>
                )}
                {saveError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">名稱</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="您的名稱"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">電郵地址</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={profile.email || ""}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">電郵地址無法更改</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">電話號碼</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="您的電話號碼"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">公司名稱</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="您的公司名稱"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="title">職位</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="您的職位"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          儲存變更
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>更改密碼</CardTitle>
                <CardDescription>定期更改密碼以保護您的帳戶安全</CardDescription>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <Alert className="mb-4 border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700">密碼已更改</AlertDescription>
                  </Alert>
                )}
                {passwordError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">目前密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="輸入目前密碼"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">新密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少6個字符"
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">確認新密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-new-password"
                        type={showConfirmNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="再次輸入新密碼"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        更改中...
                      </>
                    ) : (
                      "更改密碼"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
