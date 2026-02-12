import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  User, Mail, Calendar, Shield, Sparkles,
  MessageSquare, Database, FileText, Clock,
  ChevronRight, LogOut, ArrowUpRight, ArrowDownRight,
  Gift, Zap, Pencil, Check, X, Eye, EyeOff, KeyRound, Save,
  Copy, Share2
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function Account() {
  const { user, logout, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const { wsPath } = useWorkspaceId();
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Get Spark balance
  const { data: balanceData, refetch: refetchBalance } = trpc.subscription.getSparkBalance.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Get Spark transactions
  const { data: transactions } = trpc.subscription.getSparkTransactions.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user }
  );
  
  // Get usage stats
  const { data: usage } = trpc.subscription.getUsage.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const updateProfileMutation = trpc.userAuth.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsEditingName(false);
      setIsEditingEmail(false);
      // Refetch user data to update sidebar and other components
      refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = trpc.userAuth.changePassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Check for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("spark_topup") === "success") {
      toast.success("充值成功！Spark 已到帳 ✨");
      refetchBalance();
      window.history.replaceState({}, "", wsPath("/account"));
    }
  }, [refetchBalance]);

  // Sync edit fields when user data changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
    }
  }, [user]);

  const handleSaveName = () => {
    if (!editName.trim()) {
      toast.error("姓名不能為空");
      return;
    }
    updateProfileMutation.mutate({ name: editName.trim() });
  };

  const handleSaveEmail = () => {
    if (!editEmail.trim()) {
      toast.error("電郵不能為空");
      return;
    }
    updateProfileMutation.mutate({ email: editEmail.trim() });
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error("請輸入當前密碼");
      return;
    }
    if (!newPassword) {
      toast.error("請輸入新密碼");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("兩次輸入的新密碼不一致");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("密碼至少需要 8 個字符");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-HK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBytes = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0 || i >= sizes.length) return "0 B";
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const balance = balanceData?.balance ?? 0;
  const isOAuthUser = user?.loginMethod === "manus";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">帳戶設定</h1>
        <p className="text-muted-foreground">管理您的帳戶資料、安全設定和 Spark 餘額</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card - Editable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              個人資料
            </CardTitle>
            <CardDescription>
              點擊編輯按鈕修改您的個人資料
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {(isEditingName ? editName : user?.name)?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{user?.name || "用戶"}</h3>
                <Badge variant="outline" className="text-xs">
                  {isOAuthUser ? "Manus OAuth" : "電郵登入"}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            {/* Name field */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                姓名
              </Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="輸入您的姓名"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setEditName(user?.name || "");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSaveName}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(user?.name || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <span className="text-sm font-medium">{user?.name || "-"}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                電郵地址
              </Label>
              {isEditingEmail ? (
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="輸入您的電郵地址"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEmail();
                      if (e.key === "Escape") {
                        setIsEditingEmail(false);
                        setEditEmail(user?.email || "");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSaveEmail}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setEditEmail(user?.email || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <span className="text-sm font-medium">{user?.email || "-"}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingEmail(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Account info */}
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  註冊日期
                </span>
                <span>{formatDate(user?.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  最後登入
                </span>
                <span>{formatDate(user?.lastSignedIn)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spark Balance Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Spark 餘額
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-8 w-8 text-amber-500" />
                <span className="text-5xl font-bold text-amber-800 dark:text-amber-200">
                  {balance.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">可用 Spark</p>
            </div>
            
            <Separator className="border-amber-200 dark:border-amber-800" />
            
            <div className="space-y-2">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                onClick={() => setLocation(wsPath("/feed"))}
              >
                <Zap className="h-4 w-4 mr-2" />
                立即充值
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            {balance < 10 && (
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-lg">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Spark 餘額偏低，建議充值以繼續使用 AI 功能</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Settings - Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            安全設定
          </CardTitle>
          <CardDescription>
            管理您的密碼和帳戶安全
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password */}
          {isChangingPassword ? (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4" />
                <h4 className="font-medium">更改密碼</h4>
              </div>
              
              {isOAuthUser ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  此帳戶使用 Manus OAuth 登入，無法更改密碼。
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">當前密碼</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="輸入當前密碼"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">新密碼</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少 8 個字符，包含大小寫字母和數字"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">確認新密碼</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次輸入新密碼"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleChangePassword();
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {changePasswordMutation.isPending ? "更新中..." : "確認更改"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  密碼
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOAuthUser ? "使用 Manus OAuth 登入" : "定期更改密碼以保護帳戶安全"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
                disabled={isOAuthUser}
              >
                <Pencil className="h-4 w-4 mr-2" />
                更改密碼
              </Button>
            </div>
          )}

          <Separator />

          {/* Logout */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">登出帳戶</h4>
              <p className="text-sm text-muted-foreground">登出當前設備</p>
            </div>
            <Button variant="outline" onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30">
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            充值 / 消耗記錄
          </CardTitle>
          <CardDescription>
            最近的 Spark 交易記錄
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx: {
                id: number;
                type: string;
                amount: number;
                balance: number;
                description: string | null;
                createdAt: Date | string | null;
              }) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tx.type === "topup" ? "bg-green-100 dark:bg-green-900/50" :
                      tx.type === "bonus" ? "bg-blue-100 dark:bg-blue-900/50" :
                      tx.type === "refund" ? "bg-purple-100 dark:bg-purple-900/50" :
                      "bg-red-100 dark:bg-red-900/50"
                    }`}>
                      {tx.type === "topup" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : tx.type === "bonus" ? (
                        <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tx.description || (tx.type === "topup" ? "充值" : "消耗")}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} ✨
                    </div>
                    <div className="text-xs text-muted-foreground">
                      餘額 {tx.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暫無交易記錄</p>
              <Button variant="link" size="sm" onClick={() => setLocation(wsPath("/feed"))} className="mt-2">
                前往充值 →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Program */}
      <Card id="referral" className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            推薦有賞計畫
          </CardTitle>
          <CardDescription>
            分享您的專屬推薦連結，邀請朋友加入 Lulubaby，雙方都能獲得 100 Spark 獎勵！
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">您的專屬推薦碼</Label>
            <div className="flex items-center gap-2">
              <Input
                value={(user as any)?.referralCode || "生成中..."}
                readOnly
                className="font-mono text-lg tracking-wider bg-white dark:bg-gray-900"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const code = (user as any)?.referralCode;
                  if (code) {
                    navigator.clipboard.writeText(code);
                    toast.success("推薦碼已複製！");
                  } else {
                    toast.error("推薦碼尚未生成，請稍後再試");
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">您的專屬推薦連結</Label>
            <div className="flex items-center gap-2">
              <Input
                value={`https://lulubaby.xyz/signup?ref=${(user as any)?.referralCode || ""}`}
                readOnly
                className="text-sm bg-white dark:bg-gray-900"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const code = (user as any)?.referralCode;
                  if (code) {
                    navigator.clipboard.writeText(`https://lulubaby.xyz/signup?ref=${code}`);
                    toast.success("推薦連結已複製！");
                  } else {
                    toast.error("推薦碼尚未生成，請稍後再試");
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg border border-green-100 dark:border-green-900">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              獎勵規則
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">100</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">您的獎勵 (Spark)</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">100</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">朋友的獎勵 (Spark)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            使用量統計
          </CardTitle>
          <CardDescription>
            查看您的資源使用情況
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{usage?.totalMessages || 0}</div>
              <div className="text-sm text-muted-foreground">總對話數</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{usage?.knowledgeBaseFileCount || 0}</div>
              <div className="text-sm text-muted-foreground">知識庫文件</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{usage?.knowledgeBaseSizeBytes ? formatBytes(usage.knowledgeBaseSizeBytes) : "0 B"}</div>
              <div className="text-sm text-muted-foreground">知識庫大小</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{usage?.daysActive || 0}</div>
              <div className="text-sm text-muted-foreground">活躍天數</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Balance CTA */}
      {balance < 50 && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Spark 餘額偏低
                </h3>
                <p className="text-sm text-muted-foreground">
                  充值更多 Spark 以繼續使用 AI 對話和其他功能
                </p>
              </div>
              <Button onClick={() => setLocation(wsPath("/feed"))} className="bg-amber-600 hover:bg-amber-700 text-white">
                前往充值
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
