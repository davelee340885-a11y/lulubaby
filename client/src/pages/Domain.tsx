import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Crown, ChevronRight, Sparkles, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Domain() {
  const { data: persona } = trpc.persona.get.useQuery();
  const [copied, setCopied] = useState(false);
  
  const chatUrl = persona ? `${window.location.origin}/chat/${persona.id}` : null;

  const copyUrl = () => {
    if (chatUrl) {
      navigator.clipboard.writeText(chatUrl);
      setCopied(true);
      toast.success("連結已複製到剪貼板");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">專屬網址</h1>
        <p className="text-muted-foreground mt-1">設定您的AI助手專屬網址，提升品牌專業形象</p>
      </div>

      {/* Current URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            您目前的對話連結
          </CardTitle>
          <CardDescription>
            將此連結分享給您的客戶，讓他們可以與您的AI助手對話
          </CardDescription>
        </CardHeader>
        <CardContent>
          {persona ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all">
                {chatUrl}
              </div>
              <Button onClick={copyUrl} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={() => window.open(chatUrl!, "_blank")} variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">請先在「AI設定」中完成基本設定</p>
          )}
        </CardContent>
      </Card>

      {/* URL Options */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Free Option */}
        <Card className="relative">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              目前方案
            </span>
          </div>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-base">系統網址</CardTitle>
            <CardDescription className="text-xs">免費使用系統自動生成的對話連結</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
              yoursite.manus.space/chat/1
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ 永久免費</li>
              <li>✓ 即時可用</li>
              <li>✓ SSL安全加密</li>
            </ul>
          </CardContent>
        </Card>

        {/* Subdomain Option */}
        <Card className="relative border-primary/30">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              推薦
            </span>
          </div>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">自訂子域名</CardTitle>
            <CardDescription className="text-xs">自訂您的專屬子域名前綴</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
              <span className="text-primary font-semibold">yourname</span>.manus.space
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ 專業品牌形象</li>
              <li>✓ 易於記憶分享</li>
              <li>✓ 在設定面板修改</li>
            </ul>
          </CardContent>
        </Card>

        {/* Custom Domain Option */}
        <Card>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-2">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-base">自訂域名</CardTitle>
            <CardDescription className="text-xs">綁定您自己的品牌域名</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
              ai.<span className="text-primary font-semibold">yourbrand</span>.com
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ 完整品牌體驗</li>
              <li>✓ 支援購買新域名</li>
              <li>✓ 支援綁定現有域名</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How to Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">如何設定專屬網址？</CardTitle>
          <CardDescription>只需三個簡單步驟即可完成設定</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">打開管理介面</p>
                <p className="text-sm text-muted-foreground mt-1">點擊頁面右上角的管理介面圖示</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">進入域名設定</p>
                <p className="text-sm text-muted-foreground mt-1">選擇「設定」→「域名」</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">選擇方案</p>
                <p className="text-sm text-muted-foreground mt-1">修改前綴、綁定或購買域名</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              專屬網址讓您的AI助手更專業，提升客戶對您品牌的信任度
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => toast.info("請點擊右上角管理介面圖示，進入「設定」→「域名」進行設定")}
            >
              開始設定
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
