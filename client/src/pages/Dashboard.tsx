import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, MessageSquare, FileText, Zap, Settings } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: persona } = trpc.persona.get.useQuery();
  const { data: knowledgeBases } = trpc.knowledge.list.useQuery();
  const { data: quickButtons } = trpc.quickButtons.list.useQuery();

  const chatUrl = persona ? `${window.location.origin}/chat/${persona.id}` : null;

  const copyUrl = () => {
    if (chatUrl) {
      navigator.clipboard.writeText(chatUrl);
      toast.success("連結已複製到剪貼板");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">歡迎回來，{user?.name || "用戶"}</h1>
        <p className="text-muted-foreground mt-1">管理您的AI智能體設定和查看使用狀況</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI狀態</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
            將此連結分享給您的客戶，讓他們可以直接與您的AI助手對話
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
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">您尚未設定AI助手，請先完成基本設定</p>
              <Button onClick={() => setLocation("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                前往設定
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/settings")}>
          <CardHeader>
            <CardTitle className="text-lg">AI個性化設定</CardTitle>
            <CardDescription>自訂AI助手的名稱、頭像和歡迎語</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/knowledge")}>
          <CardHeader>
            <CardTitle className="text-lg">知識庫管理</CardTitle>
            <CardDescription>上傳專業文件讓AI學習您的業務知識</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/buttons")}>
          <CardHeader>
            <CardTitle className="text-lg">快捷按鈕配置</CardTitle>
            <CardDescription>設定對話頁面的快捷功能按鈕</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => chatUrl && window.open(chatUrl, "_blank")}>
          <CardHeader>
            <CardTitle className="text-lg">預覽對話頁面</CardTitle>
            <CardDescription>查看您的客戶將看到的AI對話介面</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
