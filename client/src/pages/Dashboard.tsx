import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, MessageSquare, Zap, Settings, TrendingUp, Users, BarChart3, Calendar, Loader2, HelpCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: persona } = trpc.persona.get.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.analytics.stats.useQuery();
  const { data: dailyStats, isLoading: dailyLoading } = trpc.analytics.dailyStats.useQuery({ days: 14 });
  const { data: popularQuestions, isLoading: questionsLoading } = trpc.analytics.popularQuestions.useQuery({ limit: 10 });
  const { data: recentConversations, isLoading: conversationsLoading } = trpc.analytics.recentConversations.useQuery({ limit: 10 });
  const { data: publishedDomain } = trpc.domains.getPublished.useQuery();

  const chatUrl = persona 
    ? `${publishedDomain?.url || window.location.origin}/chat/${persona.id}` 
    : null;

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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("zh-TW", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
            <CardTitle className="text-sm font-medium">今日對話</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayConversations || 0}</div>
            <p className="text-xs text-muted-foreground">今天收到的訊息數</p>
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
              <Button onClick={() => setLocation("/training")}>
                <Settings className="h-4 w-4 mr-2" />
                前往設定
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            對話趨勢
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            熱門問題
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            最近對話
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>每日對話趨勢</CardTitle>
              <CardDescription>過去14天的客戶對話數量變化</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dailyStats && dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      labelFormatter={(label) => `日期: ${label}`}
                      formatter={(value: number) => [`${value} 則訊息`, "對話數"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
                  <p>尚無對話數據</p>
                  <p className="text-sm">當客戶開始與您的AI助手對話後，數據將會顯示在這裡</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>熱門問題</CardTitle>
              <CardDescription>客戶最常詢問的問題排行</CardDescription>
            </CardHeader>
            <CardContent>
              {questionsLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : popularQuestions && popularQuestions.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={popularQuestions.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis 
                        type="category" 
                        dataKey="content" 
                        width={150}
                        tickFormatter={(value) => truncateText(value, 20)}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} 次`, "詢問次數"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {popularQuestions.map((q, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{q.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            被詢問 {q.count} 次
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mb-3 opacity-50" />
                  <p>尚無問題數據</p>
                  <p className="text-sm">當客戶開始提問後，熱門問題將會顯示在這裡</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>最近對話</CardTitle>
              <CardDescription>最近與AI助手互動的客戶對話</CardDescription>
            </CardHeader>
            <CardContent>
              {conversationsLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentConversations && recentConversations.length > 0 ? (
                <div className="space-y-3">
                  {recentConversations.map((conv, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">訪客 #{conv.sessionId.substring(0, 8)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(conv.lastActivity)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {conv.lastMessage || "（無訊息內容）"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          共 {conv.messageCount} 則訊息
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                  <p>尚無對話記錄</p>
                  <p className="text-sm">當客戶開始對話後，記錄將會顯示在這裡</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
