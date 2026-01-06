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

  // End conversation mutation for generating summary
  const endConversationMutation = trpc.chat.endConversation.useMutation();

  // Track last activity time for auto-summary
  const lastActivityRef = useRef<number>(Date.now());
  const summaryGeneratedRef = useRef<boolean>(false);

  // Update last activity time on each message
  useEffect(() => {
    if (messages.length > 0) {
      lastActivityRef.current = Date.now();
      summaryGeneratedRef.current = false;
    }
  }, [messages]);

  // Auto-generate summary when user leaves or after inactivity
  useEffect(() => {
    const generateSummaryIfNeeded = () => {
      // Only generate if there are enough messages and summary hasn't been generated
      if (messages.length >= 2 && !summaryGeneratedRef.current && !isTyping) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        // Generate summary after 5 minutes of inactivity
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          summaryGeneratedRef.current = true;
          endConversationMutation.mutate({ personaId, sessionId });
        }
      }
    };

    // Check for inactivity every minute
    const inactivityInterval = setInterval(generateSummaryIfNeeded, 60 * 1000);

    // Generate summary when user leaves the page
    const handleBeforeUnload = () => {
      if (messages.length >= 2 && !summaryGeneratedRef.current) {
        summaryGeneratedRef.current = true;
        // Use sendBeacon for reliable delivery on page unload
        const data = JSON.stringify({ personaId, sessionId });
        navigator.sendBeacon?.(`/api/trpc/chat.endConversation?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { json: { personaId, sessionId } } }))}`)
      }
    };

    // Generate summary when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && messages.length >= 2 && !summaryGeneratedRef.current) {
        summaryGeneratedRef.current = true;
        endConversationMutation.mutate({ personaId, sessionId });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(inactivityInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages.length, isTyping, personaId, sessionId, endConversationMutation]);

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

  // Custom layout only when background image exists, otherwise fall back to minimal
  if (layoutStyle === "custom" && persona.backgroundImageUrl) {
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
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State - Compact & Centered Layout */}
        {!hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl text-center space-y-5">
              {/* Welcome Message - Hero Title */}
              <h2 className="text-lg font-semibold text-foreground">
                {persona.welcomeMessage || "您好！我是您的AI助手"}
              </h2>
              
              {/* Input Area - Centered, Prominent */}
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

              {/* Suggested Questions - Compact Tags */}
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

              {/* Quick Buttons - Prominent Display */}
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State - Compact & Centered Layout */}
        {!hasStartedChat && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl text-center space-y-5">
              {/* Welcome Message - Hero Title */}
              <h2 className="text-lg font-semibold text-foreground">
                {persona.welcomeMessage || "您好！我是您的AI助手"}
              </h2>
              
              {/* Input Area - Centered, Prominent */}
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

              {/* Suggested Questions - Compact Tags */}
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

              {/* Quick Buttons - Prominent Display */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State - Compact & Centered Layout */}
        {!hasStartedChat && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl text-center space-y-5">
              {/* Welcome Message - Hero Title */}
              <h2 className="text-lg font-semibold text-foreground">
                {persona.welcomeMessage || "您好！我是您的AI助手"}
              </h2>
              
              {/* Input Area - Centered, Prominent */}
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

              {/* Suggested Questions - Compact Tags */}
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

              {/* Quick Buttons - Prominent Display */}
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
