import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Loader2, Bot } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Settings() {
  const { data: persona, isLoading } = trpc.persona.get.useQuery();
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState({
    agentName: "",
    avatarUrl: "",
    welcomeMessage: "",
    systemPrompt: "",
    primaryColor: "#3B82F6",
  });

  useEffect(() => {
    if (persona) {
      setFormData({
        agentName: persona.agentName || "",
        avatarUrl: persona.avatarUrl || "",
        welcomeMessage: persona.welcomeMessage || "",
        systemPrompt: persona.systemPrompt || "",
        primaryColor: persona.primaryColor || "#3B82F6",
      });
    }
  }, [persona]);

  const upsertMutation = trpc.persona.upsert.useMutation({
    onSuccess: () => {
      toast.success("設定已保存");
      utils.persona.get.invalidate();
    },
    onError: (error) => {
      toast.error("保存失敗: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI個性化設定</h1>
        <p className="text-muted-foreground mt-1">自訂您的AI助手外觀和行為</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
            <CardDescription>設定AI助手的名稱和頭像</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatarUrl} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  <Bot className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatarUrl">頭像網址</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">輸入圖片網址，建議使用正方形圖片</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentName">AI助手名稱</Label>
              <Input
                id="agentName"
                placeholder="例如：小明的保險顧問"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">主題顏色</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>對話設定</CardTitle>
            <CardDescription>設定AI助手的歡迎語和行為指引</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">歡迎語</Label>
              <Textarea
                id="welcomeMessage"
                placeholder="您好！我是您的專屬AI助手，請問有什麼可以幫您？"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">客戶進入對話頁面時看到的第一條訊息</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">AI行為指引（System Prompt）</Label>
              <Textarea
                id="systemPrompt"
                placeholder="例如：你是一位專業的保險顧問，專門為客戶提供保險產品諮詢服務。請用友善、專業的語氣回答問題，並在適當時候引導客戶預約諮詢。"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                告訴AI它的角色、專業領域和回答風格。這段文字不會顯示給客戶看。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存設定
          </Button>
        </div>
      </form>
    </div>
  );
}
