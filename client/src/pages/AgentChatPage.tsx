/**
 * AgentChatPage - 智能體對話頁面
 * 
 * 100% 複製 Manus 的對話框模式
 * 支持對話中學習功能
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Send, Loader2, Bot, User, Sparkles, Brain, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";
import AgentChatLayout from "@/components/AgentChatLayout";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  memorySaved?: boolean;
  timestamp: Date;
}

export default function AgentChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 獲取 persona 信息
  const { data: persona } = trpc.persona.get.useQuery();

  // 發送消息 mutation
  const sendMessageMutation = trpc.agentChat.sendMessage.useMutation({
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: typeof data.reply === 'string' ? data.reply : JSON.stringify(data.reply),
        memorySaved: data.memorySaved,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // 如果保存了記憶，顯示提示
      if (data.memorySaved) {
        toast.success("記憶已保存到「我的大腦」", {
          description: "您可以在「我的大腦」頁面查看和管理所有記憶",
        });
      }
      
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error("發送失敗", {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  // 自動滾動到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // 處理發送消息
  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // 構建對話歷史
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    sendMessageMutation.mutate({
      message: userMessage.content,
      conversationHistory,
    });
  };

  // 處理按鍵事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 清除對話
  const handleClearChat = () => {
    setMessages([]);
    toast.info("對話已清除");
  };

  // 建議的提示
  const suggestedPrompts = [
    "記住，我的客戶 John 對花生過敏",
    "幫我分析一下最近的銷售數據",
    "如何提高客戶轉化率？",
    "學習：保險產品的常見異議處理方法",
  ];

  return (
    <AgentChatLayout>
      <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
        {/* 頂部標題欄 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                {persona?.avatarUrl ? (
                  <AvatarImage src={persona.avatarUrl} alt={persona.agentName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{persona?.agentName || "AI 智能體"}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                在線
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              清除對話
            </Button>
          </div>
        </div>

        {/* 對話區域 */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              // 空狀態
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-violet-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">
                    {persona?.welcomeMessage || "你好！我是你的 AI 智能體"}
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    你可以和我對話、下達指令，或者讓我學習新知識。
                    <br />
                    試試說「記住，...」來教我新東西！
                  </p>
                </div>
                
                {/* 建議提示 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-4">
                  {suggestedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4 text-sm"
                      onClick={() => setInput(prompt)}
                    >
                      <span className="line-clamp-2">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // 消息列表
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* 頭像 */}
                  <Avatar className={cn(
                    "h-8 w-8 shrink-0",
                    message.role === "user" ? "ring-2 ring-primary/20" : "ring-2 ring-violet-500/20"
                  )}>
                    {message.role === "user" ? (
                      <>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        {persona?.avatarUrl ? (
                          <AvatarImage src={persona.avatarUrl} alt={persona.agentName} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>

                  {/* 消息內容 */}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border rounded-tl-sm"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {/* 記憶保存標記 */}
                    {message.memorySaved && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 text-xs text-violet-500">
                        <Brain className="h-3 w-3" />
                        <span>已保存到記憶</span>
                      </div>
                    )}
                    
                    {/* 時間戳 */}
                    <p className={cn(
                      "text-[10px] mt-1",
                      message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {message.timestamp.toLocaleTimeString("zh-HK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* 載入中指示器 */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-violet-500/20">
                  {persona?.avatarUrl ? (
                    <AvatarImage src={persona.avatarUrl} alt={persona.agentName} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 輸入區域 */}
        <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="輸入訊息... (Shift+Enter 換行)"
                  className="min-h-[52px] max-h-[200px] resize-none pr-12 rounded-xl"
                  rows={1}
                />
                <Button
                  size="icon"
                  className={cn(
                    "absolute right-2 bottom-2 h-8 w-8 rounded-lg",
                    "bg-primary hover:bg-primary/90",
                    (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              💡 提示：說「記住」、「學習」等關鍵詞，我會把知識存入大腦
            </p>
          </div>
        </div>
      </div>
    </AgentChatLayout>
  );
}
