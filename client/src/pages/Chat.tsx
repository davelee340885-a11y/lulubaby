import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Search, Calendar, Link as LinkIcon, MessageSquare, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  calendar: Calendar,
  link: LinkIcon,
  message: MessageSquare,
};

export default function Chat() {
  const params = useParams<{ personaId: string }>();
  const personaId = parseInt(params.personaId || "0");
  
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem(`chat-session-${personaId}`);
    if (stored) return stored;
    const newId = nanoid();
    sessionStorage.setItem(`chat-session-${personaId}`, newId);
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

  // Load history on mount
  useEffect(() => {
    if (history && history.length > 0) {
      setMessages(
        history.map((msg) => ({
          id: msg.id.toString(),
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }))
      );
    }
  }, [history]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    sendMutation.mutate({
      personaId,
      sessionId,
      message: text,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickButton = (button: NonNullable<typeof persona>["quickButtons"][0]) => {
    switch (button.actionType) {
      case "query":
        if (button.actionValue) {
          handleSend(button.actionValue);
        }
        break;
      case "link":
        if (button.actionValue) {
          window.open(button.actionValue, "_blank");
        }
        break;
      case "booking":
        handleSend("我想預約諮詢");
        break;
      default:
        if (button.actionValue) {
          handleSend(button.actionValue);
        }
    }
  };

  if (personaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">找不到此AI助手</h1>
          <p className="text-muted-foreground">請確認連結是否正確</p>
        </div>
      </div>
    );
  }

  const primaryColor = persona.primaryColor || "#3B82F6";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header 
        className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ borderColor: `${primaryColor}20` }}
      >
        <div className="container max-w-3xl py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2" style={{ borderColor: primaryColor }}>
              <AvatarImage src={persona.avatarUrl || undefined} />
              <AvatarFallback style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{persona.agentName}</h1>
              <p className="text-xs text-muted-foreground">AI智能助手 · 在線</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container max-w-3xl">
        <ScrollArea className="h-[calc(100vh-180px)] py-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div 
                    className="inline-block rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <p className="text-sm">{persona.welcomeMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === "assistant" ? (
                    <>
                      <AvatarImage src={persona.avatarUrl || undefined} />
                      <AvatarFallback style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 max-w-[85%] ${
                      message.role === "user"
                        ? "rounded-tr-sm text-white"
                        : "rounded-tl-sm"
                    }`}
                    style={{
                      backgroundColor: message.role === "user" ? primaryColor : `${primaryColor}10`,
                    }}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm max-w-none">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="inline-block rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Quick Buttons & Input */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-3xl py-3 space-y-3">
          {/* Quick Buttons */}
          {persona.quickButtons.length > 0 && messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {persona.quickButtons.map((button) => {
                const IconComponent = iconMap[button.icon || "message"] || MessageSquare;
                return (
                  <Button
                    key={button.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleQuickButton(button)}
                    style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                  >
                    <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                    {button.label}
                    {button.actionType === "link" && <ExternalLink className="h-3 w-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="輸入您的問題..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              className="rounded-full"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-full shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
