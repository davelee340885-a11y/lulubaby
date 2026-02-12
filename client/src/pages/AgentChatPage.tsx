/**
 * AgentChatPage - 智能體對話頁面
 * 
 * 使用 AgentChatContext 持久化對話狀態
 * 支持對話中學習功能 + 對話歷史
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Send, Loader2, Bot, User, Sparkles, Brain, RefreshCw, 
  MessageSquarePlus, History, Trash2, ChevronLeft, ChevronRight 
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";
import AgentChatLayout from "@/components/AgentChatLayout";
import { toast } from "sonner";
import { useAgentChat } from "@/contexts/AgentChatContext";

export default function AgentChatPage() {
  const { user } = useAuth();
  const {
    messages,
    currentSessionId,
    isLoading,
    sendMessage,
    clearChat,
    loadSession,
    startNewSession,
    sessions,
    sessionsLoading,
    refreshSessions,
    deleteSession,
  } = useAgentChat();

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 獲取 persona 信息
  const { data: persona } = trpc.persona.get.useQuery();

  // 自動滾動到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 載入對話歷史列表
  useEffect(() => {
    if (showHistory) {
      refreshSessions();
    }
  }, [showHistory, refreshSessions]);

  // 處理發送消息
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  // 處理按鍵事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
      <div className="flex h-screen bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        {/* 對話歷史側邊欄 */}
        <div className={cn(
          "border-r border-border bg-background/95 backdrop-blur-sm transition-all duration-300 flex flex-col",
          showHistory ? "w-72" : "w-0 overflow-hidden"
        )}>
          {showHistory && (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  對話歷史
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowHistory(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    startNewSession();
                    setShowHistory(false);
                  }}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  新對話
                </Button>
              </div>

              <ScrollArea className="flex-1 px-3 pb-3">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>還沒有對話記錄</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                          currentSessionId === session.sessionId
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          loadSession(session.sessionId);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {session.lastMessage || `${session.messageCount} 條消息`}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {session.updatedAt.toLocaleDateString("zh-HK", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.sessionId);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        {/* 主對話區域 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 內部訓練模式提示 */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
            <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Brain className="h-4 w-4 shrink-0" />
              <span className="font-medium">內部訓練模式</span>
              <span className="text-amber-600/80 dark:text-amber-500/80">— 此對話用於訓練和測試您的 AI 智能體，不會被客戶看到</span>
            </div>
          </div>

          {/* 頂部標題欄 */}
          <div className="flex items-center justify-between pl-4 pr-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {!showHistory && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
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
                  {isLoading ? "思考中..." : "在線"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  startNewSession();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageSquarePlus className="h-4 w-4 mr-1" />
                新對話
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                清除
              </Button>
            </div>
          </div>

          {/* 對話區域 */}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-6">
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
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
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
          </div>

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
      </div>
    </AgentChatLayout>
  );
}
