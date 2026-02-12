import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Sparkles, Zap, Rocket, Crown, Loader2, 
  MessageSquare, Database, Globe, Users, FileText, BrainCircuit, MousePointerClick, Copy,
  Shield, ArrowRight, Gift, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

// Package card styling
const PACKAGE_STYLES = {
  snack: {
    icon: Zap,
    gradient: "from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    buttonClass: "bg-slate-600 hover:bg-slate-700 text-white",
  },
  energy: {
    icon: Sparkles,
    gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50",
    border: "border-blue-300 ring-2 ring-blue-500/20 dark:border-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  super: {
    icon: Rocket,
    gradient: "from-purple-50 to-fuchsia-50 dark:from-purple-950/50 dark:to-fuchsia-950/50",
    border: "border-purple-200 dark:border-purple-700",
    iconBg: "bg-purple-100 dark:bg-purple-900",
    iconColor: "text-purple-600 dark:text-purple-400",
    buttonClass: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  flagship: {
    icon: Crown,
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50",
    border: "border-amber-200 dark:border-amber-700",
    iconBg: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
};

// Spark cost items for display
const SPARK_COST_ITEMS = [
  { icon: MessageSquare, label: "AI 對話", cost: "1 Spark / 訊息", description: "與您的 AI 智能體基礎對話" },
  { icon: Database, label: "知識庫上傳", cost: "10 Spark / MB", description: "上傳文件到知識庫（PDF, TXT, MD 等）" },
  { icon: FileText, label: "知識庫文字 / FAQ", cost: "1-2 Spark / 次", description: "文字輸入 1 Spark，FAQ 2 Spark" },
  { icon: MousePointerClick, label: "網頁抓取", cost: "3 Spark / 頁", description: "從網址讀取基本文字內容" },
  { icon: BrainCircuit, label: "AI 智能讀取網頁", cost: "5 Spark / 頁", description: "AI 深度理解和總結網頁核心內容" },
  { icon: Users, label: "知識庫超限對話", cost: "3 Spark / 訊息", description: "知識庫用量超出免費額度時額外收費" },
  { icon: Zap, label: "超能力啟用", cost: "30 Spark / 個", description: "首次啟用每個超能力（一次性費用）" },
  { icon: Globe, label: "自訂域名", cost: "$12.99 / 年", description: "獨立 Stripe 付費，包含 SSL 和管理服務" },
];

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  
  // Get packages from backend
  const { data: packages } = trpc.stripe.getPackages.useQuery();
  
  // Get current balance
  const { data: balanceData } = trpc.subscription.getSparkBalance.useQuery(undefined, {
    enabled: !!user,
  });

  // Check for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("spark_topup") === "success") {
      toast.success("充值成功！Spark 已到帳 ✨");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data: { sessionId: string; url: string | null }) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("無法創建付款頁面，請稍後再試");
      }
      setLoadingPackage(null);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "付款失敗，請稍後再試");
      setLoadingPackage(null);
    },
  });

  const handleTopUp = (packageType: "snack" | "energy" | "super" | "flagship") => {
    if (!user) {
      toast.error("請先登入後再充值");
      return;
    }
    setLoadingPackage(packageType);
    // Pass current origin so Stripe redirects to the correct domain
    const currentOrigin = window.location.origin;
    createCheckout.mutate({
      packageType,
      successUrl: `${currentOrigin}${window.location.pathname}?spark_topup=success`,
      cancelUrl: `${currentOrigin}${window.location.pathname}`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Pay-as-you-go · 用多少付多少
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Feed ✨</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          為你的 AI 智能體充值 Spark，按需使用，不綁定月費
        </p>
        
        {/* Current balance */}
        {user && balanceData && (
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-full border border-amber-200 dark:border-amber-800">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              當前餘額：{balanceData.balance.toLocaleString()} Spark
            </span>
          </div>
        )}
      </div>

      {/* Spark Packages */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {(packages || []).map((pkg) => {
          const style = PACKAGE_STYLES[pkg.id as keyof typeof PACKAGE_STYLES];
          if (!style) return null;
          const PackageIcon = style.icon;
          const isLoading = loadingPackage === pkg.id;
          const isPopular = pkg.id === "energy";
          
          return (
            <Card 
              key={pkg.id} 
              className={cn(
                "relative flex flex-col bg-gradient-to-br transition-all hover:shadow-lg",
                style.gradient,
                style.border,
                isPopular && "shadow-md"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-white gap-1">
                    <Sparkles className="h-3 w-3" />
                    最受歡迎
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2 pt-6">
                <div className={cn("mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2", style.iconBg)}>
                  <PackageIcon className={cn("h-6 w-6", style.iconColor)} />
                </div>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription className="text-xs">{pkg.nameEn}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold">HK${pkg.price}</div>
                  <div className="text-xs text-muted-foreground mt-1">一次性付款</div>
                </div>
                
                {/* Spark amount */}
                <div className="text-center space-y-1 mb-4">
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-xl font-bold">{pkg.sparks.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">Spark</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                      <Gift className="h-3 w-3" />
                      <span className="text-sm font-medium">+{pkg.bonus.toLocaleString()} 贈送</span>
                    </div>
                  )}
                </div>
                
                <Separator className="mb-4" />
                
                {/* Details */}
                <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
                  <div className="flex justify-between">
                    <span>總計</span>
                    <span className="font-medium text-foreground">{pkg.totalSparks.toLocaleString()} Spark</span>
                  </div>
                  <div className="flex justify-between">
                    <span>單價</span>
                    <span className="font-medium text-foreground">HK${pkg.pricePerSpark}/Spark</span>
                  </div>
                </div>
                
                {/* Tagline */}
                <p className="text-xs text-center text-muted-foreground mb-4 italic">
                  {pkg.tagline}
                </p>
                
                {/* CTA Button */}
                <Button 
                  className={cn("w-full", style.buttonClass)}
                  disabled={isLoading}
                  onClick={() => handleTopUp(pkg.id)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      跳轉付款中...
                    </>
                  ) : (
                    <>
                      充值
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Referral & Free Spark Section */}
      <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-2">
        {/* Free Spark Info */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="py-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full shrink-0">
              <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">新用戶福利</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                每位新用戶註冊即送 <strong>100 Spark</strong>，無需充值即可開始體驗 AI 的威力
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referral Promotion */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="py-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full shrink-0">
              <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">推薦有賞</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                邀請朋友加入，您和朋友都將獲得 <strong>100 Spark</strong> 獎勵！
              </p>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  onClick={() => setLocation("/w/" + ((user as any)?.subdomain || "") + "/account")}
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  前往推薦有賞
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spark Cost Table */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Spark 消耗標準
          </CardTitle>
          <CardDescription>
            了解各項功能的 Spark 消耗量
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {SPARK_COST_ITEMS.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <ItemIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 font-mono text-xs">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {item.cost}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>付款由 Stripe 安全處理，我們不會存儲您的信用卡資訊</span>
        </div>
      </div>
    </div>
  );
}
