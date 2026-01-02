import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Loader2, Copy, Check, Code, Globe, MessageCircle, 
  Send, Bot, X, Settings2, Palette, Zap, 
  Clock, Users, TrendingUp, Shield, Sparkles,
  CheckCircle2, ArrowRight, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Widget position options
const positionOptions = [
  { value: "bottom-right", label: "右下角", icon: "↘" },
  { value: "bottom-left", label: "左下角", icon: "↙" },
  { value: "top-right", label: "右上角", icon: "↗" },
  { value: "top-left", label: "左上角", icon: "↖" },
];

// Widget size options
const sizeOptions = [
  { value: "small", label: "小", width: 350, height: 500 },
  { value: "medium", label: "中", width: 400, height: 600 },
  { value: "large", label: "大", width: 450, height: 700 },
];

// Widget benefits
const widgetBenefits = [
  {
    icon: Clock,
    title: "24小時自動回覆",
    description: "您的AI助手全天候在線，即使您休息時也能回覆客戶諮詢",
  },
  {
    icon: Users,
    title: "同時服務無限客戶",
    description: "不再錯過任何潛在客戶，AI可以同時處理多個對話",
  },
  {
    icon: TrendingUp,
    title: "提升轉換率",
    description: "即時回應訪客問題，把握黃金時機促成交易",
  },
  {
    icon: Shield,
    title: "專業一致的服務",
    description: "基於您的訓練設定，提供統一的專業回覆",
  },
];

// Use cases
const useCases = [
  "公司官網 - 自動回答產品和服務諮詢",
  "個人網站 - 提供24小時客戶支援",
  "電商網站 - 解答購物相關問題",
  "Landing Page - 收集潛在客戶資料",
];

export default function Extensions() {
  const { data: persona, isLoading } = trpc.persona.get.useQuery();
  
  // Widget settings state
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [position, setPosition] = useState("bottom-right");
  const [size, setSize] = useState("medium");
  const [bubbleSize, setBubbleSize] = useState(60);
  const [showBubbleText, setShowBubbleText] = useState(true);
  const [bubbleText, setBubbleText] = useState("需要幫助嗎？");
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoOpenDelay, setAutoOpenDelay] = useState(5);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Get the base URL for the widget
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const personaId = persona?.id || 1;

  // Generate embed code
  const generateEmbedCode = () => {
    const config = {
      agentId: personaId,
      position,
      size,
      bubbleSize,
      showBubbleText,
      bubbleText,
      autoOpen,
      autoOpenDelay,
      primaryColor: persona?.primaryColor || "#3B82F6",
      agentName: persona?.agentName || "AI助手",
    };

    return `<!-- AI智能體Widget - 開始 -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['AIAgentWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','aiagent','${baseUrl}/widget.js'));
  
  aiagent('init', ${JSON.stringify(config, null, 2)});
</script>
<!-- AI智能體Widget - 結束 -->`;
  };

  // Copy embed code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    toast.success("嵌入代碼已複製到剪貼板");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">網站嵌入Widget</h1>
        <p className="text-muted-foreground mt-1">將您的AI助手部署到任何網站，24小時自動服務客戶</p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            功能介紹
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            設定Widget
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-1.5">
            <Code className="h-3.5 w-3.5" />
            獲取代碼
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Hero Section */}
          <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex-1 space-y-4">
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <Zap className="h-3 w-3 mr-1" />
                    核心功能
                  </Badge>
                  <h2 className="text-2xl font-bold">讓您的AI助手出現在任何網站</h2>
                  <p className="text-muted-foreground">
                    只需複製一段代碼，您培訓的AI智能體就能在您的網站上24小時自動回覆客戶。
                    所有訓練設定、知識庫內容都會自動套用，提供一致的專業服務。
                  </p>
                  <Button onClick={() => setActiveTab("settings")} className="gap-2">
                    開始設定
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Mini Preview */}
                <div className="relative w-64 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 p-3">
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-3" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
                      <div className="h-2.5 w-1/2 bg-gray-300 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div 
                      className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: persona?.primaryColor || "#3B82F6" }}
                    >
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">為什麼使用Widget？</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {widgetBenefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Use Cases */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">適用場景</CardTitle>
              <CardDescription>Widget可以部署到各種類型的網站</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{useCase}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">運作原理</CardTitle>
              <CardDescription>簡單三步驟，讓AI助手上線</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium">自訂Widget外觀</p>
                    <p className="text-sm text-muted-foreground">選擇位置、大小、顏色，讓Widget融入您的網站設計</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium">複製嵌入代碼</p>
                    <p className="text-sm text-muted-foreground">一鍵複製生成的JavaScript代碼</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium">貼到您的網站</p>
                    <p className="text-sm text-muted-foreground">將代碼貼到網站的 &lt;/body&gt; 標籤之前，Widget即刻上線</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    外觀設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Position */}
                  <div className="space-y-2">
                    <Label>Widget位置</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {positionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPosition(opt.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            position === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="text-lg mr-2">{opt.icon}</span>
                          <span className="text-sm">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">選擇Widget在網頁上的顯示位置</p>
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <Label>對話框大小</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label} ({opt.width}x{opt.height})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">對話框打開後的尺寸</p>
                  </div>

                  {/* Bubble Size */}
                  <div className="space-y-2">
                    <Label>氣泡按鈕大小: {bubbleSize}px</Label>
                    <Slider
                      value={[bubbleSize]}
                      onValueChange={(v) => setBubbleSize(v[0])}
                      min={40}
                      max={80}
                      step={4}
                    />
                    <p className="text-xs text-muted-foreground">浮動按鈕的直徑大小</p>
                  </div>

                  {/* Bubble Text */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>顯示提示文字</Label>
                        <p className="text-xs text-muted-foreground">在氣泡旁顯示引導文字</p>
                      </div>
                      <Switch checked={showBubbleText} onCheckedChange={setShowBubbleText} />
                    </div>
                    {showBubbleText && (
                      <Input
                        value={bubbleText}
                        onChange={(e) => setBubbleText(e.target.value)}
                        placeholder="需要幫助嗎？"
                        maxLength={20}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    行為設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Auto Open */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>自動打開對話框</Label>
                        <p className="text-xs text-muted-foreground">訪客進入頁面後自動展開</p>
                      </div>
                      <Switch checked={autoOpen} onCheckedChange={setAutoOpen} />
                    </div>
                    {autoOpen && (
                      <div className="space-y-2">
                        <Label>延遲時間: {autoOpenDelay}秒</Label>
                        <Slider
                          value={[autoOpenDelay]}
                          onValueChange={(v) => setAutoOpenDelay(v[0])}
                          min={1}
                          max={30}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">訪客進入頁面後多久自動打開</p>
                      </div>
                    )}
                  </div>

                  {/* Widget Enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>啟用Widget</Label>
                      <p className="text-xs text-muted-foreground">關閉後Widget將不會顯示</p>
                    </div>
                    <Switch checked={widgetEnabled} onCheckedChange={setWidgetEnabled} />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => setActiveTab("code")} className="w-full gap-2">
                下一步：獲取代碼
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">即時預覽</Label>
                <Button
                  size="sm"
                  variant={previewOpen ? "default" : "outline"}
                  onClick={() => setPreviewOpen(!previewOpen)}
                >
                  {previewOpen ? "關閉對話框" : "打開對話框"}
                </Button>
              </div>

              {/* Preview Container */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden" style={{ height: "500px" }}>
                {/* Simulated website content */}
                <div className="absolute inset-0 p-4">
                  <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>

                {/* Widget Preview */}
                <div 
                  className={`absolute ${
                    position.includes("bottom") ? "bottom-4" : "top-4"
                  } ${
                    position.includes("right") ? "right-4" : "left-4"
                  }`}
                >
                  {/* Chat Window */}
                  {previewOpen && (
                    <div 
                      className="mb-3 bg-background rounded-2xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-2"
                      style={{ 
                        width: sizeOptions.find(s => s.value === size)?.width || 400,
                        height: Math.min(sizeOptions.find(s => s.value === size)?.height || 600, 400),
                      }}
                    >
                      {/* Header */}
                      <div className="p-3 border-b flex items-center gap-3" style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}10` }}>
                        <div 
                          className="h-9 w-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}20` }}
                        >
                          <Bot className="h-5 w-5" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{persona?.agentName || "AI助手"}</p>
                          <p className="text-xs text-muted-foreground">在線</p>
                        </div>
                        <button 
                          onClick={() => setPreviewOpen(false)}
                          className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Chat Area */}
                      <div className="p-3 flex-1">
                        <div className="flex gap-2">
                          <div 
                            className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}
                          >
                            <Bot className="h-3.5 w-3.5" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                            <p className="text-sm">{persona?.welcomeMessage || "您好！有什麼可以幫您？"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="p-3 border-t">
                        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                          <span className="text-sm text-muted-foreground flex-1">輸入訊息...</span>
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: persona?.primaryColor || "#3B82F6" }}
                          >
                            <Send className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bubble Button */}
                  <div className="flex items-center gap-2">
                    {showBubbleText && !previewOpen && (
                      <div 
                        className={`bg-background shadow-lg rounded-full px-3 py-1.5 text-sm animate-in fade-in ${
                          position.includes("right") ? "order-first" : "order-last"
                        }`}
                      >
                        {bubbleText}
                      </div>
                    )}
                    <button
                      onClick={() => setPreviewOpen(!previewOpen)}
                      className="rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                      style={{ 
                        width: bubbleSize, 
                        height: bubbleSize,
                        backgroundColor: persona?.primaryColor || "#3B82F6",
                      }}
                    >
                      {previewOpen ? (
                        <X className="text-white" style={{ width: bubbleSize * 0.4, height: bubbleSize * 0.4 }} />
                      ) : (
                        <MessageCircle className="text-white" style={{ width: bubbleSize * 0.4, height: bubbleSize * 0.4 }} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                這是Widget在您網站上的預覽效果
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                嵌入代碼
              </CardTitle>
              <CardDescription>
                複製以下代碼並貼到您網站的 HTML 中
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <Button 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                >
                  {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copied ? "已複製" : "複製代碼"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Installation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">安裝步驟</CardTitle>
              <CardDescription>按照以下步驟將Widget添加到您的網站</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium">複製嵌入代碼</p>
                    <p className="text-sm text-muted-foreground mt-1">點擊上方「複製代碼」按鈕</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium">打開您的網站編輯器</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      可以是 HTML 文件、WordPress、Wix、Shopify 或其他網站建設工具
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium">貼上代碼</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      將代碼貼到 <code className="bg-background px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code> 標籤之前
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium">保存並發布</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      保存您的更改並發布網站，Widget 將自動顯示
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform specific guides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">常見平台安裝指南</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border hover:border-primary/50 transition-colors">
                  <p className="font-medium text-sm">WordPress</p>
                  <p className="text-xs text-muted-foreground mt-1">在主題編輯器的 footer.php 中添加代碼</p>
                </div>
                <div className="p-3 rounded-lg border hover:border-primary/50 transition-colors">
                  <p className="font-medium text-sm">Wix</p>
                  <p className="text-xs text-muted-foreground mt-1">使用「添加自定義代碼」功能</p>
                </div>
                <div className="p-3 rounded-lg border hover:border-primary/50 transition-colors">
                  <p className="font-medium text-sm">Shopify</p>
                  <p className="text-xs text-muted-foreground mt-1">在主題設定中添加到 theme.liquid</p>
                </div>
                <div className="p-3 rounded-lg border hover:border-primary/50 transition-colors">
                  <p className="font-medium text-sm">純 HTML</p>
                  <p className="text-xs text-muted-foreground mt-1">直接貼到 &lt;/body&gt; 標籤之前</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">小提示</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Widget會自動使用您在「版面設定」和「訓練智能體」中配置的設定。
                    修改這些設定後，Widget會即時更新，無需重新安裝代碼。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
