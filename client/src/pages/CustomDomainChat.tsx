import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Loader2, Bot, User, Search, Calendar, Link as LinkIcon, MessageSquare, ExternalLink, Sparkles, FileText, Building2, Phone, HelpCircle, ShoppingBag, UserCircle, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Extended icon map with more options
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  calendar: Calendar,
  link: LinkIcon,
  message: MessageSquare,
  sparkles: Sparkles,
  file: FileText,
  building: Building2,
  phone: Phone,
  help: HelpCircle,
  shopping: ShoppingBag,
  user: UserCircle,
  // Action type to icon mapping
  query: MessageSquare,
  booking: Calendar,
  product: ShoppingBag,
  profile: UserCircle,
  company: Building2,
  catalog: FileText,
  contact: Phone,
  faq: HelpCircle,
  custom: Sparkles,
};

export default function CustomDomainChat() {
  // Get current domain
  const currentDomain = window.location.hostname;
  
  // Query persona by domain
  const { data: domainInfo, isLoading: domainLoading, error: domainError } = trpc.domains.getPublishedDomain.useQuery(
    { domain: currentDomain }
  );
  
  const personaId = domainInfo?.personaId || 0;
  
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem(`chat-session-domain-${currentDomain}`);
    if (stored) return stored;
    const newId = nanoid();
    sessionStorage.setItem(`chat-session-domain-${currentDomain}`, newId);
    return newId;
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: persona, isLoading: personaLoading } = trpc.persona.getPublic.useQuery(
    { personaId },
    { enabled: personaId > 0 }
  );

  const { data: history } = trpc.chat.history.useQuery(
    { personaId, sessionId },
    { enabled: personaId > 0 }
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: "抱歉，發生了一些問題，請稍後再試。",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    },
  });

  // Load conversation history
  useEffect(() => {
    if (history) {
      const formattedHistory: Message[] = history.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedHistory);
    }
  }, [history]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !personaId) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    sendMutation.mutate({
      personaId,
      message: userMessage.content,
      sessionId,
    });
  };

  const handleGuidedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleQuickButton = (button: any) => {
    if (button.actionType === "link" && button.actionValue) {
      window.open(button.actionValue, "_blank");
    } else if (button.actionType === "query" && button.actionValue) {
      handleGuidedQuestion(button.actionValue);
    }
  };

  // Loading state
  if (domainLoading || personaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state - domain not found or not published
  if (domainError || !domainInfo || !personaId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>域名未配置</AlertTitle>
          <AlertDescription>
            此域名（{currentDomain}）尚未配置或未發布。
            <br />
            <br />
            如果您是網站擁有者，請前往管理後台完成以下步驟：
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>確認域名已成功註冊</li>
              <li>綁定域名到 AI 智能體</li>
              <li>等待 DNS 生效</li>
              <li>點擊「發布網站」按鈕</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Persona not found
  if (!persona) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>智能體不存在</AlertTitle>
          <AlertDescription>
            找不到與此域名關聯的 AI 智能體。請聯繫網站管理員。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const IconComponent = persona.quickButtons?.[0]?.icon
    ? iconMap[persona.quickButtons[0].icon]
    : MessageSquare;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            // Welcome Screen - Compact & Centered Layout
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              {/* Welcome Message */}
              <h2 className="text-lg font-semibold text-foreground">
                {persona.welcomeMessage || `您好！我是 ${persona.agentName}`}
              </h2>

              {/* Guided Questions - Compact Tags */}
              {persona.suggestedQuestions && persona.suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 max-w-2xl">
                  {persona.suggestedQuestions.slice(0, 3).map((question: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleGuidedQuestion(question)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border/60 bg-background text-[10px] text-muted-foreground"
                    >
                      <MessageSquare className="h-2.5 w-2.5" />
                      <span className="max-w-[100px] truncate">{question}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Buttons - Icon Mode */}
              {persona.quickButtons && persona.quickButtons.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 max-w-2xl">
                  <TooltipProvider>
                    {persona.quickButtons.slice(0, 6).map((button: any) => {
                      const ButtonIcon = iconMap[button.icon] || MessageSquare;
                      return (
                        <Tooltip key={button.id}>
                          <TooltipTrigger asChild>
                            <button
                              className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                              style={{ color: persona.primaryColor || '#15f9de' }}
                              onClick={() => handleQuickButton(button)}
                            >
                              <ButtonIcon className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{button.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
              )}
            </div>
          ) : (
            // Conversation Messages
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={persona.avatarUrl || undefined} alt={persona.agentName} />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={persona.avatarUrl || undefined} alt={persona.agentName} />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="輸入您的問題..."
            className="flex-1"
            disabled={isTyping || !personaId}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isTyping || !personaId}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
