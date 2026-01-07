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

// Persona type from API
type PersonaData = {
  id: number;
  agentName: string;
  avatarUrl: string | null;
  welcomeMessage: string;
  primaryColor: string | null;
  layoutStyle: string | null;
  backgroundImageUrl: string | null;
  profilePhotoUrl: string | null;
  tagline: string | null;
  suggestedQuestions: string[];
  showQuickButtons: boolean | null;
  buttonDisplayMode: string | null;
  chatPlaceholder: string | null;
  quickButtons: Array<{
    id: number;
    label: string;
    icon: string | null;
    actionType: string;
    actionValue: string | null;
  }>;
};

// Quick Button Component
function QuickButtonGroup({ 
  buttons, 
  displayMode, 
  primaryColor,
  onButtonClick 
}: { 
  buttons: PersonaData["quickButtons"];
  displayMode: string;
  primaryColor: string;
  onButtonClick: (button: PersonaData["quickButtons"][0]) => void;
}) {
  if (buttons.length === 0) return null;

  if (displayMode === "icon") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center justify-center gap-1">
          {buttons.map((button) => {
            const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
            return (
              <Tooltip key={button.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onButtonClick(button)}
                    className="p-2 rounded-lg hover:bg-muted/80 transition-colors group"
                    style={{ color: primaryColor }}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {button.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  if (displayMode === "compact") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {buttons.map((button) => {
          const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
          return (
            <button
              key={button.id}
              onClick={() => onButtonClick(button)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border hover:bg-muted/50 transition-colors"
            >
              <IconComponent className="h-3 w-3" />
              <span className="max-w-[60px] truncate">{button.label}</span>
              {button.actionType === "link" && <ExternalLink className="h-2.5 w-2.5 opacity-50" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {buttons.map((button) => {
        const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
        return (
          <Button
            key={button.id}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px] rounded-md font-normal"
            onClick={() => onButtonClick(button)}
          >
            <IconComponent className="h-3 w-3 mr-1" />
            {button.label}
            {button.actionType === "link" && <ExternalLink className="h-2 w-2 ml-0.5 opacity-50" />}
          </Button>
        );
      })}
    </div>
  );
}

export default function CustomDomainChat() {
  const currentDomain = window.location.hostname;
  
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || !personaId) return;

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
      message: userMessage.content,
      sessionId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickButton = (button: PersonaData["quickButtons"][0]) => {
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

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
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

  // Error state
  if (domainError || !domainInfo || !personaId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>域名未配置</AlertTitle>
          <AlertDescription>
            此域名（{currentDomain}）尚未配置或未發布。
            <br /><br />
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

  const primaryColor = persona.primaryColor || "#3B82F6";
  const layoutStyle = persona.layoutStyle || "minimal";
  const chatPlaceholder = persona.chatPlaceholder || "輸入您的問題...";
  const suggestedQuestions = persona.suggestedQuestions || [];
  const showQuickButtons = persona.showQuickButtons ?? true;
  const buttonDisplayMode = persona.buttonDisplayMode || "full";
  const backgroundImage = persona.backgroundImageUrl;
  const profilePhoto = persona.profilePhotoUrl;
  const backgroundType = (persona as any).backgroundType || "none";
  const backgroundColor = (persona as any).backgroundColor;
  const immersiveMode = (persona as any).immersiveMode || false;

  // Determine background style for custom layout
  const getBackgroundStyle = () => {
    if (backgroundType === "image" && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundColor: undefined,
      };
    } else if (backgroundType === "color" && backgroundColor) {
      return {
        backgroundImage: undefined,
        backgroundColor: backgroundColor,
      };
    } else {
      return {
        backgroundImage: undefined,
        backgroundColor: "#ffffff",
      };
    }
  };

  // Custom Layout with Background (Image or Color)
  if (layoutStyle === "custom") {
    const backgroundStyle = getBackgroundStyle();
    const hasBackgroundImage = backgroundType === "image" && backgroundImage;
    
    return (
      <div 
        className={`min-h-screen flex flex-col ${immersiveMode ? "" : ""}`}
        style={immersiveMode ? {} : backgroundStyle}
      >
        {/* Gradient Overlay for Immersive Mode */}
        {immersiveMode && (
          <div className="fixed inset-0 -z-10" style={backgroundStyle}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
            <div className="absolute inset-0 backdrop-blur-[2px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {messages.length === 0 && (
            <div 
              className={`flex-1 flex flex-col items-center justify-center px-4 py-6 relative ${!immersiveMode && hasBackgroundImage ? "bg-cover bg-center" : ""}`}
              style={!immersiveMode ? backgroundStyle : {}}
            >
              {!immersiveMode && backgroundImage && <div className="absolute inset-0 bg-black/40 -z-10" />}
              <div className="w-full max-w-xl text-center space-y-5 relative z-10">
                <h2 className={`text-lg font-semibold ${hasBackgroundImage ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>
                  {persona.welcomeMessage || "您好！我是您的AI助手"}
                </h2>
                
                <div className="relative w-full">
                  <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm px-3 py-2">
                    <Input
                      ref={inputRef}
                      placeholder={chatPlaceholder}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isTyping}
                      className="border-0 shadow-none focus-visible:ring-0 h-auto text-xs px-0 bg-transparent"
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isTyping}
                      size="icon"
                      className="rounded-full h-7 w-7 shrink-0 ml-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isTyping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border/60 bg-background text-[10px] text-muted-foreground"
                      >
                        <MessageSquare className="h-2.5 w-2.5" />
                        <span className="max-w-[100px] truncate">{question}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showQuickButtons && persona.quickButtons.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <QuickButtonGroup
                      buttons={persona.quickButtons}
                      displayMode={buttonDisplayMode}
                      primaryColor={primaryColor}
                      onButtonClick={handleQuickButton}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="container max-w-2xl py-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      {message.role === "assistant" ? (
                        profilePhoto ? (
                          <AvatarImage src={profilePhoto} />
                        ) : (
                          <>
                            <AvatarImage src={persona.avatarUrl || undefined} />
                            <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </>
                        )
                      ) : (
                        <AvatarFallback className="bg-muted">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                      <div
                        className={`inline-block rounded-2xl px-3 py-2 max-w-[85%] shadow-sm ${
                          message.role === "user"
                            ? "text-white"
                            : "bg-background/95 backdrop-blur"
                        }`}
                        style={message.role === "user" ? { backgroundColor: primaryColor } : {}}
                      >
                        {message.role === "assistant" ? (
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2.5">
                    <Avatar className="h-6 w-6 shrink-0">
                      {profilePhoto ? (
                        <AvatarImage src={profilePhoto} />
                      ) : (
                        <>
                          <AvatarImage src={persona.avatarUrl || undefined} />
                          <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="bg-background/95 backdrop-blur rounded-2xl px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t">
            <div className="container max-w-2xl py-3">
              {showQuickButtons && persona.quickButtons.length > 0 && (
                <div className="mb-2">
                  <QuickButtonGroup
                    buttons={persona.quickButtons}
                    displayMode={buttonDisplayMode}
                    primaryColor={primaryColor}
                    onButtonClick={handleQuickButton}
                  />
                </div>
              )}

              <div className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  placeholder={chatPlaceholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  className="rounded-full h-9 text-sm bg-background"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="rounded-full h-9 w-9 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Professional Layout (same as minimal but with profile photo in messages)
  // and Minimal Layout (default)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl text-center space-y-5">
              <h2 className="text-lg font-semibold text-foreground">
                {persona.welcomeMessage || "您好！我是您的AI助手"}
              </h2>
              
              <div className="relative w-full">
                <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm px-3 py-2">
                  <Input
                    ref={inputRef}
                    placeholder={chatPlaceholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                    className="border-0 shadow-none focus-visible:ring-0 h-auto text-xs px-0 bg-transparent"
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className="rounded-full h-7 w-7 shrink-0 ml-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isTyping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border/60 bg-background text-[10px] text-muted-foreground"
                    >
                      <MessageSquare className="h-2.5 w-2.5" />
                      <span className="max-w-[100px] truncate">{question}</span>
                    </button>
                  ))}
                </div>
              )}

              {showQuickButtons && persona.quickButtons.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  <QuickButtonGroup
                    buttons={persona.quickButtons}
                    displayMode={buttonDisplayMode}
                    primaryColor={primaryColor}
                    onButtonClick={handleQuickButton}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="container max-w-2xl py-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    {message.role === "assistant" ? (
                      (layoutStyle === "professional" && profilePhoto) ? (
                        <AvatarImage src={profilePhoto} />
                      ) : (
                        <>
                          <AvatarImage src={persona.avatarUrl || undefined} />
                          <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </>
                      )
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                    <div
                      className={`inline-block rounded-2xl px-3 py-2 max-w-[85%] ${
                        message.role === "user"
                          ? "text-white"
                          : "bg-background border shadow-sm"
                      }`}
                      style={message.role === "user" ? { backgroundColor: primaryColor } : {}}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    {(layoutStyle === "professional" && profilePhoto) ? (
                      <AvatarImage src={profilePhoto} />
                    ) : (
                      <>
                        <AvatarImage src={persona.avatarUrl || undefined} />
                        <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="bg-background border shadow-sm rounded-2xl px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {messages.length > 0 && (
        <div className="sticky bottom-0 border-t bg-background">
          <div className="container max-w-2xl py-3">
            {showQuickButtons && persona.quickButtons.length > 0 && (
              <div className="mb-2">
                <QuickButtonGroup
                  buttons={persona.quickButtons}
                  displayMode={buttonDisplayMode}
                  primaryColor={primaryColor}
                  onButtonClick={handleQuickButton}
                />
              </div>
            )}

            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                placeholder={chatPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="rounded-full h-9 text-sm"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="rounded-full h-9 w-9 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
