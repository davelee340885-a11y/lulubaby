import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, MessageSquare, FileText, Zap, Settings, TrendingUp, Users, BarChart3, Globe, Crown, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: persona } = trpc.persona.get.useQuery();
  const { data: knowledgeBases } = trpc.knowledge.list.useQuery();
  const { data: quickButtons } = trpc.quickButtons.list.useQuery();
  const { data: stats } = trpc.analytics.stats.useQuery();
  const { data: dailyStats } = trpc.analytics.dailyStats.useQuery({ days: 7 });

  const chatUrl = persona ? `${window.location.origin}/chat/${persona.id}` : null;

  const copyUrl = () => {
    if (chatUrl) {
      navigator.clipboard.writeText(chatUrl);
      toast.success("連結已複製到剪貼板");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">歡迎回來，{user?.name || "用戶"}</h1>
        <p className="text-muted-foreground mt-1">管理您的AI智能體設定和查看使用狀況</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總對話數</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground">客戶發送的訊息總數</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">獨立訪客</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">不重複的對話會話數</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本週對話</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekConversations || 0}</div>
            <p className="text-xs text-muted-foreground">過去7天的訊息數</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI狀態</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">運行中</div>
            <p className="text-xs text-muted-foreground">您的AI助手已就緒</p>
          </CardContent>
        </Card>
      </div>

      {/* Mini Chart & Share URL */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setLocation("/analytics")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                對話趨勢
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                查看詳情 →
              </Button>
            </div>
            <CardDescription>過去7天的客戶互動數據</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStats && dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorCountMini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value: number) => [`${value} 則`, "對話"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorCountMini)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
                尚無對話數據
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share URL Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              您的專屬AI對話連結
            </CardTitle>
            <CardDescription>
              將此連結分享給您的客戶
            </CardDescription>
          </CardHeader>
          <CardContent>
            {persona ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all">
                  {chatUrl}
                </div>
                <Button onClick={copyUrl} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={() => window.open(chatUrl!, "_blank")} variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">您尚未設定AI助手，請先完成基本設定</p>
                <Button onClick={() => setLocation("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  前往設定
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Domain Guide - Premium Feature */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  自訂專屬網址
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                    <Crown className="h-3 w-3" />
                    進階功能
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  讓您的AI助手擁有專業的品牌網址，提升客戶信任度
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Options */}
          <div className="grid sm:grid-cols-3 gap-3">
            {/* Free Option */}
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium">免費</span>
                </div>
                <span className="font-medium text-sm">系統網址</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">使用系統自動生成的對話連結</p>
              <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
                yoursite.manus.space/chat/1
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                您目前使用此方案
              </p>
            </div>

            {/* Subdomain Option */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 relative">
              <div className="absolute -top-2 -right-2">
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">推薦</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="h-3 w-3 text-primary" />
                </div>
                <span className="font-medium text-sm">自訂子域名</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">自訂您的專屬子域名前綴</p>
              <div className="bg-background rounded-lg px-3 py-2 font-mono text-xs break-all border">
                <span className="text-primary font-semibold">yourname</span>.manus.space
              </div>
              <p className="text-xs text-muted-foreground mt-2">在設定面板中修改</p>
            </div>

            {/* Custom Domain Option */}
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Crown className="h-3 w-3 text-amber-600" />
                </div>
                <span className="font-medium text-sm">自訂域名</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">綁定您自己的品牌域名</p>
              <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
                ai.<span className="text-primary font-semibold">yourbrand</span>.com
              </div>
              <p className="text-xs text-muted-foreground mt-2">支援購買或綁定域名</p>
            </div>
          </div>

          {/* How to Setup */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              如何設定專屬網址？
            </h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">打開設定面板</p>
                  <p className="text-xs text-muted-foreground">點擊右上角的管理介面圖示</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">進入域名設定</p>
                  <p className="text-xs text-muted-foreground">選擇「設定」→「域名」</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">選擇方案</p>
                  <p className="text-xs text-muted-foreground">修改前綴、綁定或購買域名</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              專屬網址讓您的AI助手更專業，提升客戶對您品牌的信任度
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("請點擊右上角管理介面圖示，進入「設定」→「域名」進行設定")}>
              了解更多
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">知識庫文件</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeBases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">已上傳的專業文件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">快捷按鈕</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickButtons?.length || 0}</div>
            <p className="text-xs text-muted-foreground">已配置的快捷功能</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/settings")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI個性化設定</CardTitle>
            <CardDescription className="text-xs">自訂名稱、頭像和歡迎語</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/knowledge")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">知識庫管理</CardTitle>
            <CardDescription className="text-xs">上傳專業文件</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/appearance")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">版面設定</CardTitle>
            <CardDescription className="text-xs">自訂外觀和快捷按鈕</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/analytics")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">數據分析</CardTitle>
            <CardDescription className="text-xs">查看詳細統計報告</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
