import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Check, X, User, Zap, Crown, MessageSquare, 
  Database, FileText, Clock, Brain, Puzzle,
  Globe, BarChart3, Headphones, Code, Sparkles,
  Users, Building2, Shield, Share2, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Individual Plan configuration
const INDIVIDUAL_PLANS = [
  {
    id: "free",
    name: "免費計劃",
    description: "適合初次體驗的用戶",
    price: 0,
    priceLabel: "免費",
    icon: User,
    color: "border-gray-200",
    buttonVariant: "outline" as const,
    buttonText: "當前計劃",
    popular: false,
    features: [
      { icon: MessageSquare, text: "每日 20 次對話", included: true },
      { icon: MessageSquare, text: "每月 300 次對話", included: true },
      { icon: Database, text: "1 MB 知識庫空間", included: true },
      { icon: FileText, text: "最多 3 個文件", included: true },
      { icon: Clock, text: "對話記錄保留 7 天", included: true },
      { icon: Brain, text: "基礎訓練設定", included: true },
      { icon: BarChart3, text: "基礎數據統計", included: true },
      { icon: Zap, text: "超能力功能", included: false },
      { icon: Puzzle, text: "Widget 嵌入", included: false },
      { icon: Globe, text: "自訂域名", included: false },
      { icon: Code, text: "API 存取", included: false },
      { icon: Headphones, text: "優先客服支援", included: false },
    ],
  },
  {
    id: "basic",
    name: "基本計劃",
    description: "適合個人銷售員使用",
    price: 299,
    priceLabel: "HK$299/月",
    icon: Zap,
    color: "border-blue-500 ring-2 ring-blue-500/20",
    buttonVariant: "default" as const,
    buttonText: "升級至基本",
    popular: true,
    features: [
      { icon: MessageSquare, text: "每日 200 次對話", included: true },
      { icon: MessageSquare, text: "每月 5,000 次對話", included: true },
      { icon: Database, text: "50 MB 知識庫空間", included: true },
      { icon: FileText, text: "最多 20 個文件", included: true },
      { icon: Clock, text: "對話記錄保留 90 天", included: true },
      { icon: Brain, text: "完整訓練設定 (48項)", included: true },
      { icon: BarChart3, text: "詳細數據報表", included: true },
      { icon: Zap, text: "5 項基礎超能力", included: true },
      { icon: Puzzle, text: "Widget 嵌入", included: true },
      { icon: Globe, text: "自訂域名", included: false },
      { icon: Code, text: "API 存取", included: false },
      { icon: Headphones, text: "客服支援", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium 計劃",
    description: "適合重度用戶",
    price: 599,
    priceLabel: "HK$599/月",
    icon: Crown,
    color: "border-amber-500",
    buttonVariant: "default" as const,
    buttonText: "升級至 Premium",
    popular: false,
    features: [
      { icon: MessageSquare, text: "每日 2,000 次對話", included: true },
      { icon: MessageSquare, text: "每月 50,000 次對話", included: true },
      { icon: Database, text: "500 MB 知識庫空間", included: true },
      { icon: FileText, text: "最多 100 個文件", included: true },
      { icon: Clock, text: "對話記錄永久保留", included: true },
      { icon: Brain, text: "完整訓練設定 (48項)", included: true },
      { icon: BarChart3, text: "進階數據分析", included: true },
      { icon: Zap, text: "全部 17 項超能力", included: true },
      { icon: Puzzle, text: "Widget 嵌入", included: true },
      { icon: Globe, text: "自訂域名", included: true },
      { icon: Code, text: "API 存取", included: true },
      { icon: Headphones, text: "優先客服支援", included: true },
    ],
  },
];

// Team Plan configuration
const TEAM_PLANS = [
  {
    id: "team_basic",
    name: "團隊基礎版",
    description: "適合小型團隊使用",
    price: 299,
    priceLabel: "HK$299/月",
    icon: Users,
    color: "border-emerald-200",
    buttonVariant: "outline" as const,
    buttonText: "選擇此計劃",
    popular: false,
    memberCount: "最多 5 位成員",
    features: [
      { icon: BookOpen, text: "團隊大腦（共享知識庫）", included: true },
      { icon: Users, text: "最多 5 位成員", included: true },
      { icon: Database, text: "100 MB 團隊知識庫", included: true },
      { icon: FileText, text: "最多 50 個知識項目", included: true },
      { icon: Shield, text: "基本成員管理", included: true },
      { icon: BarChart3, text: "團隊統計報表", included: true },
      { icon: Share2, text: "知識分享控制", included: true },
      { icon: Brain, text: "細粒度權限控制", included: false },
      { icon: Code, text: "API 存取", included: false },
      { icon: Headphones, text: "客服支援", included: false },
    ],
  },
  {
    id: "team_pro",
    name: "團隊專業版",
    description: "適合中型團隊和部門",
    price: 599,
    priceLabel: "HK$599/月",
    icon: Building2,
    color: "border-emerald-500 ring-2 ring-emerald-500/20",
    buttonVariant: "default" as const,
    buttonText: "選擇此計劃",
    popular: true,
    memberCount: "最多 15 位成員",
    features: [
      { icon: BookOpen, text: "團隊大腦（進階知識庫）", included: true },
      { icon: Users, text: "最多 15 位成員", included: true },
      { icon: Database, text: "500 MB 團隊知識庫", included: true },
      { icon: FileText, text: "最多 200 個知識項目", included: true },
      { icon: Shield, text: "進階成員管理", included: true },
      { icon: BarChart3, text: "詳細數據分析", included: true },
      { icon: Share2, text: "細粒度知識分享", included: true },
      { icon: Brain, text: "完整權限控制", included: true },
      { icon: Code, text: "API 存取", included: false },
      { icon: Headphones, text: "優先客服支援", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "企業版",
    description: "適合大型企業和機構",
    price: 1299,
    priceLabel: "HK$1,299/月",
    icon: Crown,
    color: "border-purple-500",
    buttonVariant: "default" as const,
    buttonText: "聯繫銷售",
    popular: false,
    memberCount: "最多 50 位成員",
    features: [
      { icon: BookOpen, text: "團隊大腦（企業級知識庫）", included: true },
      { icon: Users, text: "最多 50 位成員", included: true },
      { icon: Database, text: "2 GB 團隊知識庫", included: true },
      { icon: FileText, text: "無限知識項目", included: true },
      { icon: Shield, text: "完整權限控制", included: true },
      { icon: BarChart3, text: "進階數據分析", included: true },
      { icon: Share2, text: "自訂整合", included: true },
      { icon: Brain, text: "專屬客戶經理", included: true },
      { icon: Code, text: "API 存取", included: true },
      { icon: Headphones, text: "SLA 保證", included: true },
    ],
  },
];

// FAQ data
const FAQ = [
  {
    question: "可以隨時取消訂閱嗎？",
    answer: "是的，您可以隨時取消訂閱。取消後，您的計劃將在當前計費週期結束時降級為免費計劃。",
  },
  {
    question: "超出對話限額會怎樣？",
    answer: "當您達到每日或每月對話限額時，AI將暫停回應新訊息。您可以等待限額重置或升級計劃以獲得更多對話次數。",
  },
  {
    question: "知識庫文件支援哪些格式？",
    answer: "目前支援 TXT、PDF、DOC、DOCX 等常見文檔格式。上傳後系統會自動提取文字內容供AI學習。",
  },
  {
    question: "升級後原有數據會保留嗎？",
    answer: "是的，升級計劃不會影響您現有的設定、知識庫和對話記錄。所有數據都會完整保留。",
  },
  {
    question: "團隊計劃和個人計劃有什麼分別？",
    answer: "團隊計劃提供「團隊大腦」功能，讓團隊成員共享公司知識庫。團隊成員可以選擇使用團隊知識，也可以額外購買個人計劃來訓練自己的AI智能體。",
  },
  {
    question: "團隊成員可以有自己的AI智能體嗎？",
    answer: "可以。團隊成員可以額外購買個人計劃，擁有自己的AI智能體和個人知識庫。個人智能體可以選擇是否引用團隊大腦的知識。",
  },
];

export default function Pricing() {
  const { data: subscription } = trpc.subscription.get.useQuery();
  const currentPlan = subscription?.plan || "free";

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) {
      toast.info("您已經在使用此計劃");
      return;
    }
    
    if (planId === "free") {
      toast.info("如需降級，請聯繫客服");
      return;
    }
    
    if (planId === "enterprise") {
      toast.info("企業版請聯繫銷售團隊：sales@example.com");
      return;
    }
    
    // TODO: Integrate with Stripe
    toast.info("付款功能即將推出，請稍候");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">選擇適合您的計劃</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          無論您是個人用戶還是團隊，我們都有適合您的方案
        </p>
      </div>

      {/* Plan Type Tabs */}
      <Tabs defaultValue="individual" className="max-w-6xl mx-auto">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="individual" className="gap-2">
            <User className="h-4 w-4" />
            個人計劃
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            團隊計劃
          </TabsTrigger>
        </TabsList>

        {/* Individual Plans */}
        <TabsContent value="individual">
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {INDIVIDUAL_PLANS.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const PlanIcon = plan.icon;
              
              return (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "relative flex flex-col",
                    plan.color,
                    plan.popular && "shadow-lg"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-500 hover:bg-blue-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        最受歡迎
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                      plan.id === "free" && "bg-gray-100",
                      plan.id === "basic" && "bg-blue-100",
                      plan.id === "premium" && "bg-amber-100"
                    )}>
                      <PlanIcon className={cn(
                        "h-6 w-6",
                        plan.id === "free" && "text-gray-600",
                        plan.id === "basic" && "text-blue-600",
                        plan.id === "premium" && "text-amber-600"
                      )} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold">
                        {plan.price === 0 ? "免費" : `HK$${plan.price}`}
                      </div>
                      {plan.price > 0 && (
                        <div className="text-sm text-muted-foreground">/月</div>
                      )}
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm",
                            !feature.included && "text-muted-foreground"
                          )}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA Button */}
                    <Button 
                      variant={isCurrentPlan ? "outline" : plan.buttonVariant}
                      className={cn(
                        "w-full mt-6",
                        plan.id === "basic" && !isCurrentPlan && "bg-blue-500 hover:bg-blue-600",
                        plan.id === "premium" && !isCurrentPlan && "bg-amber-500 hover:bg-amber-600"
                      )}
                      disabled={isCurrentPlan}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {isCurrentPlan ? "當前計劃" : plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Team Plans */}
        <TabsContent value="team">
          {/* Team Plans Introduction */}
          <div className="text-center mb-8 p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">什麼是「團隊大腦」？</h3>
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              團隊大腦是公司級別的共享知識庫，包含產品資料、服務說明、公司歷史、銷售話術等。
              團隊成員的AI智能體可以引用這些知識，確保回答一致且專業。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {TEAM_PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              
              return (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "relative flex flex-col",
                    plan.color,
                    plan.popular && "shadow-lg"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 hover:bg-emerald-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        最受歡迎
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                      plan.id === "team_basic" && "bg-emerald-100",
                      plan.id === "team_pro" && "bg-emerald-100",
                      plan.id === "enterprise" && "bg-purple-100"
                    )}>
                      <PlanIcon className={cn(
                        "h-6 w-6",
                        plan.id === "team_basic" && "text-emerald-600",
                        plan.id === "team_pro" && "text-emerald-600",
                        plan.id === "enterprise" && "text-purple-600"
                      )} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <Badge variant="outline" className="mt-2 mx-auto">
                      {plan.memberCount}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold">
                        HK${plan.price}
                      </div>
                      <div className="text-sm text-muted-foreground">/月</div>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm",
                            !feature.included && "text-muted-foreground"
                          )}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA Button */}
                    <Button 
                      variant={plan.buttonVariant}
                      className={cn(
                        "w-full mt-6",
                        plan.id === "team_basic" && "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
                        plan.id === "team_pro" && "bg-emerald-500 hover:bg-emerald-600",
                        plan.id === "enterprise" && "bg-purple-500 hover:bg-purple-600"
                      )}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Team vs Individual Comparison */}
          <Card className="max-w-3xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                團隊計劃 vs 個人計劃
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-emerald-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    團隊計劃
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>公司級別的共享知識庫（團隊大腦）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>統一管理團隊成員</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>知識分享權限控制</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>團隊使用統計</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    個人計劃
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>個人專屬AI智能體</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>個人知識庫</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>完整訓練設定（48項）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>超能力功能</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                <strong>提示：</strong>團隊成員可以同時擁有團隊計劃和個人計劃。
                個人智能體可以選擇是否引用團隊大腦的知識，實現公司知識與個人風格的完美結合。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Comparison Table - Individual */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>個人計劃功能對比</CardTitle>
          <CardDescription>詳細比較各計劃的功能差異</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">功能</th>
                  <th className="text-center py-3 px-4 font-medium">免費</th>
                  <th className="text-center py-3 px-4 font-medium text-blue-600">基本</th>
                  <th className="text-center py-3 px-4 font-medium text-amber-600">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">每日對話次數</td>
                  <td className="text-center py-3 px-4">20</td>
                  <td className="text-center py-3 px-4">200</td>
                  <td className="text-center py-3 px-4">無限</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">每月對話次數</td>
                  <td className="text-center py-3 px-4">300</td>
                  <td className="text-center py-3 px-4">6,000</td>
                  <td className="text-center py-3 px-4">50,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">知識庫空間</td>
                  <td className="text-center py-3 px-4">1 MB</td>
                  <td className="text-center py-3 px-4">50 MB</td>
                  <td className="text-center py-3 px-4">500 MB</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">知識庫文件數</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">20</td>
                  <td className="text-center py-3 px-4">100</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">對話記錄保留</td>
                  <td className="text-center py-3 px-4">7 天</td>
                  <td className="text-center py-3 px-4">90 天</td>
                  <td className="text-center py-3 px-4">永久</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">訓練維度</td>
                  <td className="text-center py-3 px-4">2 項</td>
                  <td className="text-center py-3 px-4">48 項</td>
                  <td className="text-center py-3 px-4">48 項</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">超能力功能</td>
                  <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                  <td className="text-center py-3 px-4">5 項</td>
                  <td className="text-center py-3 px-4">17 項</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Widget 嵌入</td>
                  <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                  <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">自訂域名</td>
                  <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                  <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                  <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">API 存取</td>
                  <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                  <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                  <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>常見問題</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQ.map((item, index) => (
            <div key={index}>
              <h4 className="font-medium mb-1">{item.question}</h4>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
              {index < FAQ.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact CTA */}
      <div className="text-center space-y-4 py-8">
        <h3 className="text-xl font-semibold">需要更多？</h3>
        <p className="text-muted-foreground">
          如果您有特殊需求或需要定制方案，請聯繫我們
        </p>
        <Button variant="outline" onClick={() => toast.info("請發送郵件至 support@example.com")}>
          聯繫我們
        </Button>
      </div>
    </div>
  );
}
