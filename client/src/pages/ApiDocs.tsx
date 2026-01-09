import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, FileJson, Key, MessageSquare, Send, User, Zap } from "lucide-react";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-5xl py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileJson className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API 文檔</h1>
              <p className="text-muted-foreground">整合 AI 智能體到您的應用程式</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">REST API</Badge>
            <Badge variant="outline">JSON</Badge>
            <Badge variant="outline">WebSocket</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl py-8">
        <Tabs defaultValue="quickstart" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quickstart">快速開始</TabsTrigger>
            <TabsTrigger value="authentication">認證</TabsTrigger>
            <TabsTrigger value="endpoints">API 端點</TabsTrigger>
            <TabsTrigger value="examples">範例程式碼</TabsTrigger>
          </TabsList>

          {/* Quick Start */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  快速開始
                </CardTitle>
                <CardDescription>
                  只需幾步即可開始使用 AI 智能體 API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. 獲取 API 金鑰</h4>
                  <p className="text-sm text-muted-foreground">
                    在設定頁面中生成您的 API 金鑰。每個智能體都有獨立的金鑰。
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. 發送第一個請求</h4>
                  <CodeBlock language="bash" code={`curl -X POST https://api.example.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "你好！"}'`} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. 處理回應</h4>
                  <CodeBlock language="json" code={`{
  "id": "msg_123",
  "response": "你好！有什麼我可以幫助你的嗎？",
  "timestamp": "2024-01-01T00:00:00Z"
}`} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication */}
          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  認證方式
                </CardTitle>
                <CardDescription>
                  所有 API 請求都需要認證
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Bearer Token 認證</h4>
                  <p className="text-sm text-muted-foreground">
                    在每個請求的 Header 中包含您的 API 金鑰：
                  </p>
                  <CodeBlock language="http" code={`Authorization: Bearer YOUR_API_KEY`} />
                </div>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm">
                    <strong>安全提示：</strong> 請勿在客戶端代碼中暴露您的 API 金鑰。
                    建議通過後端服務器代理 API 請求。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints */}
          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  發送訊息
                </CardTitle>
                <CardDescription>POST /v1/chat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">請求參數</h4>
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">參數</th>
                          <th className="text-left p-3">類型</th>
                          <th className="text-left p-3">必填</th>
                          <th className="text-left p-3">說明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3"><code>message</code></td>
                          <td className="p-3">string</td>
                          <td className="p-3">是</td>
                          <td className="p-3">用戶發送的訊息</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3"><code>session_id</code></td>
                          <td className="p-3">string</td>
                          <td className="p-3">否</td>
                          <td className="p-3">會話 ID，用於保持對話上下文</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3"><code>metadata</code></td>
                          <td className="p-3">object</td>
                          <td className="p-3">否</td>
                          <td className="p-3">自定義元數據</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  獲取對話歷史
                </CardTitle>
                <CardDescription>GET /v1/conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">查詢參數</h4>
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">參數</th>
                          <th className="text-left p-3">類型</th>
                          <th className="text-left p-3">說明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3"><code>session_id</code></td>
                          <td className="p-3">string</td>
                          <td className="p-3">會話 ID</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3"><code>limit</code></td>
                          <td className="p-3">number</td>
                          <td className="p-3">返回數量限制（預設 50）</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  客戶認證
                </CardTitle>
                <CardDescription>POST /v1/customer/auth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">說明</h4>
                  <p className="text-sm text-muted-foreground">
                    允許您的客戶通過電郵驗證碼或社交登入進行認證，以便追蹤對話歷史和提供個性化服務。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  JavaScript / Node.js
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock language="javascript" code={`const response = await fetch('https://api.example.com/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '你好！',
    session_id: 'user_123',
  }),
});

const data = await response.json();
console.log(data.response);`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Python
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock language="python" code={`import requests

response = requests.post(
    'https://api.example.com/v1/chat',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'message': '你好！',
        'session_id': 'user_123',
    }
)

data = response.json()
print(data['response'])`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  cURL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock language="bash" code={`curl -X POST https://api.example.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "你好！",
    "session_id": "user_123"
  }'`} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Code Block Component
function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs">{language}</Badge>
      </div>
      <ScrollArea className="rounded-lg border bg-muted/50 p-4">
        <pre className="text-sm font-mono whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
