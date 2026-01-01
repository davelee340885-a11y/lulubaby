import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  Check, X, User, Zap, Crown, MessageSquare, 
  Database, FileText, Clock, Brain, Puzzle,
  Globe, BarChart3, Headphones, Code, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Plan configuration
const PLANS = [
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
    price: 99,
    priceLabel: "HK$99/月",
    icon: Zap,
    color: "border-blue-500 ring-2 ring-blue-500/20",
    buttonVariant: "default" as const,
    buttonText: "升級至基本",
    popular: true,
    features: [
      { icon: MessageSquare, text: "每日 200 次對話", included: true },
      { icon: MessageSquare, text: "每月 6,000 次對話", included: true },
      { icon: Database, text: "50 MB 知識庫空間", included: true },
      { icon: FileText, text: "最多 20 個文件", included: true },
      { icon: Clock, text: "對話記錄保留 90 天", included: true },
      { icon: Brain, text: "完整訓練設定 (48項)", included: true },
      { icon: BarChart3, text: "詳細數據報表", included: true },
      { icon: Zap, text: "5 項基礎超能力", included: true },
      { icon: Puzzle, text: "Widget 嵌入", included: true },
      { icon: Globe, text: "自訂域名", included: false },
      { icon: Code, text: "API 存取", included: false },
      { icon: Headphones, text: "Email 客服支援", included: true },
    ],
  },
  {
    id: "premium",
    name: "Premium 計劃",
    description: "適合團隊和重度用戶",
    price: 299,
    priceLabel: "HK$299/月",
    icon: Crown,
    color: "border-amber-500",
    buttonVariant: "default" as const,
    buttonText: "升級至 Premium",
    popular: false,
    features: [
      { icon: MessageSquare, text: "無限對話次數", included: true },
      { icon: MessageSquare, text: "公平使用上限 50,000/月", included: true },
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
    question: "有團隊或企業方案嗎？",
    answer: "如果您有特殊需求或需要更大的使用量，請聯繫我們討論定制方案。",
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
    
    // TODO: Integrate with Stripe
    toast.info("付款功能即將推出，請稍候");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">選擇適合您的計劃</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          無論您是剛開始使用還是需要更強大的功能，我們都有適合您的方案
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
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

      {/* Feature Comparison Table */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>功能對比</CardTitle>
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
          如果您有特殊需求或需要企業方案，請聯繫我們
        </p>
        <Button variant="outline" onClick={() => toast.info("請發送郵件至 support@example.com")}>
          聯繫我們
        </Button>
      </div>
    </div>
  );
}
