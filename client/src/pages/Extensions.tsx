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
  Loader2, Copy, Check, ExternalLink, Code, Globe, MessageCircle, 
  Mail, Phone, Video, Instagram, Facebook, Send, Bot, X,
  Smartphone, Monitor, Settings2, Palette, Zap, ChevronRight,
  CheckCircle2, Clock, Lock
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Extension channels
const channels = [
  {
    id: "widget",
    name: "網站嵌入Widget",
    description: "在您的網站上嵌入AI對話氣泡",
    icon: Globe,
    status: "available",
    color: "bg-blue-500",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "自動回覆WhatsApp訊息",
    icon: MessageCircle,
    status: "coming",
    color: "bg-green-500",
  },
  {
    id: "email",
    name: "Email自動回覆",
    description: "智能處理郵件諮詢",
    icon: Mail,
    status: "coming",
    color: "bg-orange-500",
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    description: "部署到Telegram機器人",
    icon: Send,
    status: "coming",
    color: "bg-sky-500",
  },
  {
    id: "facebook",
    name: "Facebook Messenger",
    description: "自動回覆FB訊息",
    icon: Facebook,
    status: "coming",
    color: "bg-blue-600",
  },
  {
    id: "instagram",
    name: "Instagram DM",
    description: "自動回覆IG私訊",
    icon: Instagram,
    status: "coming",
    color: "bg-pink-500",
  },
  {
    id: "video",
    name: "AI影片生成",
    description: "生成AI數字人影片",
    icon: Video,
    status: "premium",
    color: "bg-purple-500",
  },
  {
    id: "voice",
    name: "語音通話",
    description: "AI語音客服系統",
    icon: Phone,
    status: "premium",
    color: "bg-red-500",
  },
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
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">可用</Badge>;
      case "connected":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">已連接</Badge>;
      case "coming":
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />即將推出</Badge>;
      case "premium":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20"><Lock className="h-3 w-3 mr-1" />Premium</Badge>;
      default:
        return null;
    }
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
        <h1 className="text-2xl font-bold tracking-tight">擴充功能</h1>
        <p className="text-muted-foreground mt-1">讓您的AI分身無處不在 - 部署到任何渠道</p>
      </div>

      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">一次培訓，處處部署</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                您花心機培訓的AI智能體，可以部署到網站、WhatsApp、Email等多個渠道，成為您真正的人工智能分身
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((channel) => {
          const IconComponent = channel.icon;
          const isAvailable = channel.status === "available" || channel.status === "connected";
          
          return (
            <Card 
              key={channel.id} 
              className={`relative overflow-hidden transition-all ${
                isAvailable ? "hover:shadow-md cursor-pointer" : "opacity-70"
              } ${channel.id === "widget" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                if (channel.id === "widget") {
                  setShowCodeDialog(true);
                } else if (channel.status === "coming") {
                  toast.info(`${channel.name} 即將推出，敬請期待！`);
                } else if (channel.status === "premium") {
                  toast.info(`${channel.name} 是Premium功能，請升級解鎖`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl ${channel.color} flex items-center justify-center`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  {getStatusBadge(channel.status)}
                </div>
                <h3 className="font-medium text-sm">{channel.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{channel.description}</p>
                
                {channel.id === "widget" && (
                  <Button size="sm" className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setShowCodeDialog(true); }}>
                    <Code className="h-3.5 w-3.5 mr-1.5" />
                    獲取嵌入代碼
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Widget Configuration Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              網站嵌入Widget設定
            </DialogTitle>
            <DialogDescription>
              自訂Widget外觀，然後複製代碼到您的網站
            </DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-2 gap-6 mt-4">
            {/* Left: Settings */}
            <div className="space-y-6">
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appearance" className="gap-1.5">
                    <Palette className="h-3.5 w-3.5" />
                    外觀
                  </TabsTrigger>
                  <TabsTrigger value="behavior" className="gap-1.5">
                    <Settings2 className="h-3.5 w-3.5" />
                    行為
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4 mt-4">
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
                  </div>

                  {/* Bubble Text */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>顯示提示文字</Label>
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
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4 mt-4">
                  {/* Auto Open */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>自動打開對話框</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">訪客進入頁面後自動展開</p>
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
                      </div>
                    )}
                  </div>

                  {/* Widget Enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>啟用Widget</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">關閉後Widget將不會顯示</p>
                    </div>
                    <Switch checked={widgetEnabled} onCheckedChange={setWidgetEnabled} />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Embed Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>嵌入代碼</Label>
                  <Button size="sm" variant="outline" onClick={handleCopyCode}>
                    {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                    {copied ? "已複製" : "複製代碼"}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto max-h-40">
                    <code>{generateEmbedCode()}</code>
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  將此代碼貼到您網站的 <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> 標籤之前
                </p>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>即時預覽</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={previewOpen ? "default" : "outline"}
                    onClick={() => setPreviewOpen(!previewOpen)}
                  >
                    {previewOpen ? "關閉對話框" : "打開對話框"}
                  </Button>
                </div>
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

          {/* Installation Steps */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-3">安裝步驟</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">點擊「複製代碼」按鈕複製嵌入代碼</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">打開您的網站HTML文件或CMS編輯器</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">將代碼貼到 <code className="bg-background px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code> 標籤之前</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">4</span>
                </div>
                <p className="text-sm text-muted-foreground">保存並發布您的網站，Widget將自動顯示</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">部署統計</CardTitle>
          <CardDescription>您的AI分身在各渠道的使用情況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Globe className="h-4 w-4" />
                <span className="text-sm">網站Widget</span>
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">本月對話數</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">WhatsApp</span>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">-</p>
              <p className="text-xs text-muted-foreground">即將推出</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">-</p>
              <p className="text-xs text-muted-foreground">即將推出</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">即將推出的功能</CardTitle>
          <CardDescription>我們正在努力開發更多渠道整合</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">WhatsApp Business 整合</p>
                <p className="text-xs text-muted-foreground">讓您的AI自動回覆WhatsApp客戶訊息</p>
              </div>
              <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />開發中</Badge>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">AI影片生成</p>
                <p className="text-xs text-muted-foreground">用您的AI分身生成真人影片</p>
              </div>
              <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />規劃中</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
