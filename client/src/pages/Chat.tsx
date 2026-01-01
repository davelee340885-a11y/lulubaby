import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Loader2, Bot, User, Search, Calendar, Link as LinkIcon, MessageSquare, ExternalLink, Sparkles, FileText, Building2, Phone, HelpCircle, ShoppingBag, UserCircle } from "lucide-react";
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

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  if (personaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold mb-1">找不到此AI助手</h1>
          <p className="text-sm text-muted-foreground">請確認連結是否正確</p>
        </div>
      </div>
    );
  }

  const primaryColor = persona.primaryColor || "#3B82F6";
  const layoutStyle = persona.layoutStyle || "minimal";
  const chatPlaceholder = persona.chatPlaceholder || "輸入您的問題...";
  const suggestedQuestions = persona.suggestedQuestions || [];
  const showQuickButtons = persona.showQuickButtons ?? true;
  const buttonDisplayMode = persona.buttonDisplayMode || "full";

  // Render based on layout style
  if (layoutStyle === "professional") {
    return <ProfessionalLayout 
      persona={persona} 
      primaryColor={primaryColor}
      chatPlaceholder={chatPlaceholder}
      suggestedQuestions={suggestedQuestions}
      showQuickButtons={showQuickButtons}
      buttonDisplayMode={buttonDisplayMode}
      messages={messages}
      input={input}
      setInput={setInput}
      isTyping={isTyping}
      scrollRef={scrollRef}
      inputRef={inputRef}
      handleSend={handleSend}
      handleKeyDown={handleKeyDown}
      handleQuickButton={handleQuickButton}
      handleSuggestedQuestion={handleSuggestedQuestion}
    />;
  }

  if (layoutStyle === "custom") {
    return <CustomLayout 
      persona={persona} 
      primaryColor={primaryColor}
      chatPlaceholder={chatPlaceholder}
      suggestedQuestions={suggestedQuestions}
      showQuickButtons={showQuickButtons}
      buttonDisplayMode={buttonDisplayMode}
      messages={messages}
      input={input}
      setInput={setInput}
      isTyping={isTyping}
      scrollRef={scrollRef}
      inputRef={inputRef}
      handleSend={handleSend}
      handleKeyDown={handleKeyDown}
      handleQuickButton={handleQuickButton}
      handleSuggestedQuestion={handleSuggestedQuestion}
    />;
  }

  // Default: Minimal ChatGPT-style layout
  return <MinimalLayout 
    persona={persona} 
    primaryColor={primaryColor}
    chatPlaceholder={chatPlaceholder}
    suggestedQuestions={suggestedQuestions}
    showQuickButtons={showQuickButtons}
    buttonDisplayMode={buttonDisplayMode}
    messages={messages}
    input={input}
    setInput={setInput}
    isTyping={isTyping}
    scrollRef={scrollRef}
    inputRef={inputRef}
    handleSend={handleSend}
    handleKeyDown={handleKeyDown}
    handleQuickButton={handleQuickButton}
    handleSuggestedQuestion={handleSuggestedQuestion}
  />;
}

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

// Shared props type
type LayoutProps = {
  persona: PersonaData;
  primaryColor: string;
  chatPlaceholder: string;
  suggestedQuestions: string[];
  showQuickButtons: boolean;
  buttonDisplayMode: string;
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleSend: (messageText?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleQuickButton: (button: NonNullable<LayoutProps["persona"]>["quickButtons"][0]) => void;
  handleSuggestedQuestion: (question: string) => void;
};

// Quick Button Component with different display modes
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

  // Icon-only mode with tooltips
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

  // Compact mode - smaller buttons with icon + short label
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

  // Full mode - refined and compact
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

// ==================== Minimal Layout (ChatGPT Style) - Redesigned ====================
function MinimalLayout({
  persona,
  primaryColor,
  chatPlaceholder,
  suggestedQuestions,
  showQuickButtons,
  buttonDisplayMode,
  messages,
  input,
  setInput,
  isTyping,
  scrollRef,
  inputRef,
  handleSend,
  handleKeyDown,
  handleQuickButton,
  handleSuggestedQuestion,
}: LayoutProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-sm mx-auto py-1.5 px-4">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={persona.avatarUrl || undefined} />
              <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Bot className="h-2.5 w-2.5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-medium text-xs truncate">{persona.agentName}</h1>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-green-600">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              在線
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State - Everything Vertically Centered */}
        {!hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm text-center">
              <Avatar className="h-10 w-10 mx-auto mb-2">
                <AvatarImage src={persona.avatarUrl || undefined} />
                <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-base font-medium mb-1">{persona.agentName}</h2>
              <p className="text-xs text-muted-foreground mb-4">{persona.welcomeMessage}</p>
              
              {/* Suggested Questions - Compact */}
              {suggestedQuestions.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/40 hover:border-primary/20 transition-all text-xs text-muted-foreground hover:text-foreground"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Buttons */}
              {showQuickButtons && persona.quickButtons.length > 0 && (
                <div className="mb-4">
                  <QuickButtonGroup
                    buttons={persona.quickButtons}
                    displayMode={buttonDisplayMode}
                    primaryColor={primaryColor}
                    onButtonClick={handleQuickButton}
                  />
                </div>
              )}

              {/* Input Area - Centered with welcome content */}
              <div className="flex gap-1.5 items-center mt-2">
                <Input
                  ref={inputRef}
                  placeholder={chatPlaceholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  className="rounded-full h-8 text-xs px-3"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="rounded-full h-8 w-8 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isTyping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {hasMessages && (
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="container max-w-2xl py-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src={persona.avatarUrl || undefined} />
                        <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </>
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
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
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

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={persona.avatarUrl || undefined} />
                    <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-3 py-2">
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

      {/* Input Area - Only show at bottom when chatting */}
      {hasMessages && (
        <div className="sticky bottom-0 border-t bg-background">
          <div className="container max-w-sm mx-auto py-2 px-4">
            {/* Quick Buttons - Show when chatting */}
            {showQuickButtons && persona.quickButtons.length > 0 && (
              <div className="mb-1.5">
                <QuickButtonGroup
                  buttons={persona.quickButtons}
                  displayMode={buttonDisplayMode}
                  primaryColor={primaryColor}
                  onButtonClick={handleQuickButton}
                />
              </div>
            )}

            <div className="flex gap-1.5 items-center">
              <Input
                ref={inputRef}
                placeholder={chatPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="rounded-full h-8 text-xs px-3"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="rounded-full h-8 w-8 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {isTyping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Professional Layout (Business Card Style) ====================
function ProfessionalLayout({
  persona,
  primaryColor,
  chatPlaceholder,
  suggestedQuestions,
  showQuickButtons,
  buttonDisplayMode,
  messages,
  input,
  setInput,
  isTyping,
  scrollRef,
  inputRef,
  handleSend,
  handleKeyDown,
  handleQuickButton,
  handleSuggestedQuestion,
}: LayoutProps) {
  const hasStartedChat = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: `${primaryColor}05` }}>
      {/* Hero Section - Only show when no messages */}
      {!hasStartedChat && (
        <div className="relative py-10 px-4" style={{ backgroundColor: primaryColor }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="relative container max-w-xl text-center text-white">
            {/* Profile Photo */}
            <div className="mb-4">
              {persona.profilePhotoUrl ? (
                <img
                  src={persona.profilePhotoUrl}
                  alt={persona.agentName}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-3 border-white/30 shadow-lg"
                />
              ) : (
                <Avatar className="w-20 h-20 mx-auto border-3 border-white/30 shadow-lg">
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-white/20">
                    <Bot className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            <h1 className="text-xl font-bold mb-1">{persona.agentName}</h1>
            {persona.tagline && (
              <p className="text-white/90 text-sm mb-3">{persona.tagline}</p>
            )}
            <p className="text-white/80 text-sm max-w-md mx-auto">{persona.welcomeMessage}</p>
          </div>
        </div>
      )}

      {/* Compact Header - Only show when chatting */}
      {hasStartedChat && (
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="container max-w-2xl py-2">
            <div className="flex items-center gap-2">
              {persona.profilePhotoUrl ? (
                <img
                  src={persona.profilePhotoUrl}
                  alt={persona.agentName}
                  className="w-8 h-8 rounded-full object-cover border-2"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <Avatar className="h-8 w-8 border-2" style={{ borderColor: primaryColor }}>
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-sm truncate">{persona.agentName}</h1>
                {persona.tagline && <p className="text-xs text-muted-foreground truncate">{persona.tagline}</p>}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome Content */}
        {!hasStartedChat && (
          <div className="container max-w-xl px-4 py-6 space-y-4">
            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground text-center mb-2">常見問題</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-background border hover:bg-muted/50 transition-colors text-sm shadow-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Buttons */}
            {showQuickButtons && persona.quickButtons.length > 0 && (
              <div className="pt-2">
                <QuickButtonGroup
                  buttons={persona.quickButtons}
                  displayMode={buttonDisplayMode}
                  primaryColor={primaryColor}
                  onButtonClick={handleQuickButton}
                />
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {hasStartedChat && (
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="container max-w-2xl py-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    {message.role === "assistant" ? (
                      persona.profilePhotoUrl ? (
                        <AvatarImage src={persona.profilePhotoUrl} />
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

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    {persona.profilePhotoUrl ? (
                      <AvatarImage src={persona.profilePhotoUrl} />
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

      {/* Input Area */}
      <div className="sticky bottom-0 border-t bg-background">
        <div className="container max-w-2xl py-3">
          {/* Quick Buttons when chatting */}
          {hasStartedChat && showQuickButtons && persona.quickButtons.length > 0 && (
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
    </div>
  );
}

// ==================== Custom Layout (Background Image Style) ====================
function CustomLayout({
  persona,
  primaryColor,
  chatPlaceholder,
  suggestedQuestions,
  showQuickButtons,
  buttonDisplayMode,
  messages,
  input,
  setInput,
  isTyping,
  scrollRef,
  inputRef,
  handleSend,
  handleKeyDown,
  handleQuickButton,
  handleSuggestedQuestion,
}: LayoutProps) {
  const hasStartedChat = messages.length > 0;
  const backgroundImage = persona.backgroundImageUrl;

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundColor: backgroundImage ? undefined : `${primaryColor}10`
      }}
    >
      {/* Overlay */}
      {backgroundImage && <div className="fixed inset-0 bg-black/40 -z-10" />}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="container max-w-2xl py-2">
          <div className="flex items-center gap-2">
            {persona.profilePhotoUrl ? (
              <img
                src={persona.profilePhotoUrl}
                alt={persona.agentName}
                className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
              />
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src={persona.avatarUrl || undefined} />
                <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm truncate">{persona.agentName}</h1>
              {persona.tagline && <p className="text-xs text-muted-foreground truncate">{persona.tagline}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State */}
        {!hasStartedChat && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="bg-background/90 backdrop-blur rounded-2xl p-6 max-w-md w-full shadow-lg">
              <div className="text-center mb-4">
                {persona.profilePhotoUrl ? (
                  <img
                    src={persona.profilePhotoUrl}
                    alt={persona.agentName}
                    className="w-16 h-16 rounded-full mx-auto object-cover border-3 shadow-md mb-3"
                    style={{ borderColor: primaryColor }}
                  />
                ) : (
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarImage src={persona.avatarUrl || undefined} />
                    <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <Bot className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <h2 className="text-lg font-semibold">{persona.agentName}</h2>
                {persona.tagline && <p className="text-sm text-muted-foreground">{persona.tagline}</p>}
              </div>
              
              <p className="text-sm text-center text-muted-foreground mb-4">{persona.welcomeMessage}</p>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left px-3 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Buttons */}
              {showQuickButtons && persona.quickButtons.length > 0 && (
                <QuickButtonGroup
                  buttons={persona.quickButtons}
                  displayMode={buttonDisplayMode}
                  primaryColor={primaryColor}
                  onButtonClick={handleQuickButton}
                />
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {hasStartedChat && (
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="container max-w-2xl py-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    {message.role === "assistant" ? (
                      persona.profilePhotoUrl ? (
                        <AvatarImage src={persona.profilePhotoUrl} />
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

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    {persona.profilePhotoUrl ? (
                      <AvatarImage src={persona.profilePhotoUrl} />
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

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t">
        <div className="container max-w-2xl py-3">
          {/* Quick Buttons when chatting */}
          {hasStartedChat && showQuickButtons && persona.quickButtons.length > 0 && (
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
    </div>
  );
}
