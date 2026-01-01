import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  User, Mail, Calendar, Shield, Crown, Zap, 
  MessageSquare, Database, FileText, Clock,
  AlertTriangle, ChevronRight, LogOut
} from "lucide-react";
import { useLocation } from "wouter";

// Plan display info
const PLAN_INFO = {
  free: {
    name: "免費計劃",
    color: "bg-gray-100 text-gray-800",
    icon: User,
    limits: {
      dailyMessages: 20,
      monthlyMessages: 300,
      knowledgeBaseSizeMB: 1,
      knowledgeBaseFiles: 3,
    }
  },
  basic: {
    name: "基本計劃",
    color: "bg-blue-100 text-blue-800",
    icon: Zap,
    limits: {
      dailyMessages: 200,
      monthlyMessages: 6000,
      knowledgeBaseSizeMB: 50,
      knowledgeBaseFiles: 20,
    }
  },
  premium: {
    name: "Premium計劃",
    color: "bg-amber-100 text-amber-800",
    icon: Crown,
    limits: {
      dailyMessages: -1,
      monthlyMessages: 50000,
      knowledgeBaseSizeMB: 500,
      knowledgeBaseFiles: 100,
    }
  },
};

export default function Account() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get subscription info
  const { data: subscription } = trpc.subscription.get.useQuery();
  const { data: usage } = trpc.subscription.getUsage.useQuery();
  
  const currentPlan = subscription?.plan || "free";
  const planInfo = PLAN_INFO[currentPlan as keyof typeof PLAN_INFO];
  const PlanIcon = planInfo.icon;
  
  // Calculate usage percentages
  const dailyUsagePercent = planInfo.limits.dailyMessages === -1 
    ? 0 
    : Math.min(100, ((usage?.todayMessages || 0) / planInfo.limits.dailyMessages) * 100);
  
  const monthlyUsagePercent = planInfo.limits.monthlyMessages === -1
    ? 0
    : Math.min(100, ((usage?.monthMessages || 0) / planInfo.limits.monthlyMessages) * 100);
  
  const storageUsagePercent = Math.min(100, 
    ((usage?.knowledgeBaseSizeBytes || 0) / (planInfo.limits.knowledgeBaseSizeMB * 1024 * 1024)) * 100
  );

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">帳戶設定</h1>
        <p className="text-muted-foreground">管理您的帳戶資料和訂閱計劃</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              個人資料
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{user?.name || "用戶"}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user?.email || "未設定"}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">帳戶ID</span>
                <span className="font-mono">{user?.id || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">註冊日期</span>
                <span>{formatDate(user?.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最後登入</span>
                <span>{formatDate(user?.lastSignedIn)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlanIcon className="h-5 w-5" />
              當前計劃
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${planInfo.color}`}>
                  <PlanIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{planInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === "active" ? "使用中" : "已過期"}
                  </p>
                </div>
              </div>
              <Badge className={planInfo.color}>
                {currentPlan.toUpperCase()}
              </Badge>
            </div>
            
            {subscription?.endDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                到期日：{formatDate(subscription.endDate)}
              </div>
            )}
            
            <Separator />
            
            <Button 
              className="w-full" 
              onClick={() => setLocation("/pricing")}
            >
              {currentPlan === "free" ? "升級計劃" : "管理訂閱"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid gap-6 md:grid-cols-3">
            {/* Daily Messages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  今日對話
                </span>
                <span className="font-medium">
                  {usage?.todayMessages || 0} / {planInfo.limits.dailyMessages === -1 ? "∞" : planInfo.limits.dailyMessages}
                </span>
              </div>
              <Progress value={dailyUsagePercent} className="h-2" />
              {dailyUsagePercent >= 80 && dailyUsagePercent < 100 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  即將達到每日限額
                </p>
              )}
              {dailyUsagePercent >= 100 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  已達每日限額
                </p>
              )}
            </div>

            {/* Monthly Messages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  本月對話
                </span>
                <span className="font-medium">
                  {usage?.monthMessages || 0} / {planInfo.limits.monthlyMessages === -1 ? "∞" : planInfo.limits.monthlyMessages.toLocaleString()}
                </span>
              </div>
              <Progress value={monthlyUsagePercent} className="h-2" />
              {monthlyUsagePercent >= 80 && monthlyUsagePercent < 100 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  即將達到每月限額
                </p>
              )}
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  知識庫存儲
                </span>
                <span className="font-medium">
                  {formatBytes(usage?.knowledgeBaseSizeBytes || 0)} / {planInfo.limits.knowledgeBaseSizeMB} MB
                </span>
              </div>
              <Progress value={storageUsagePercent} className="h-2" />
            </div>
          </div>

          {/* Additional Stats */}
          <Separator className="my-6" />
          
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
              <div className="text-2xl font-bold">{usage?.widgetViews || 0}</div>
              <div className="text-sm text-muted-foreground">Widget瀏覽</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{usage?.daysActive || 0}</div>
              <div className="text-sm text-muted-foreground">活躍天數</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            安全設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">登出帳戶</h4>
              <p className="text-sm text-muted-foreground">登出當前設備</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison CTA */}
      {currentPlan === "free" && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">升級您的計劃</h3>
                <p className="text-sm text-muted-foreground">
                  解鎖更多對話次數、知識庫空間和進階功能
                </p>
              </div>
              <Button onClick={() => setLocation("/pricing")}>
                查看計劃
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
