/**
 * CustomerChatClient - Unified customer-facing chat component
 * 
 * Consolidates the shared logic from Chat.tsx, SubdomainChat.tsx, and CustomDomainChat.tsx
 * into a single reusable component. Each page component becomes a lightweight wrapper
 * that resolves personaId and passes it here.
 * 
 * Props:
 *   - personaId: number - The resolved persona ID
 *   - sessionKey?: string - Optional key suffix for session storage (default: personaId)
 *   - isInternalTraining?: boolean - Shows "Return to Dashboard" button when true
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Send, Loader2, Bot, User, Search, Calendar, Link as LinkIcon,
  MessageSquare, ExternalLink, Sparkles, FileText, Building2, Phone,
  HelpCircle, ShoppingBag, UserCircle, ArrowLeft,
} from "lucide-react";
// Login components removed - client UI doesn't need login button
import React, { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

// ==================== Types ====================

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type PersonaData = {
  id: number;
  agentName: string;
  avatarUrl: string | null;
  welcomeMessage: string;
  welcomeMessageColor: string | null;
  welcomeMessageSize: string | null;
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
  handleQuickButton: (button: PersonaData["quickButtons"][0]) => void;
  handleSuggestedQuestion: (question: string) => void;
  customer: any | null;
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
  onLogin: (user: any) => void;
  onLogout: () => void;
};

export interface CustomerChatClientProps {
  personaId: number;
  sessionKey?: string;
  isInternalTraining?: boolean;
}

// ==================== Icon Map ====================

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

// ==================== Helper Functions ====================

const getWelcomeMessageFontSize = (size: string | null) => {
  switch (size) {
    case "xsmall": return "12px";
    case "small": return "14px";
    case "medium": return "16px";
    case "large": return "18px";
    case "xlarge": return "20px";
    case "xxlarge": return "24px";
    case "xxxlarge": return "28px";
    case "huge": return "32px";
    case "massive": return "36px";
    default: return "16px";
  }
};

// ==================== QuickButtonGroup ====================

function QuickButtonGroup({
  buttons,
  displayMode,
  primaryColor,
  onButtonClick,
  hasBackground = false,
}: {
  buttons: PersonaData["quickButtons"];
  displayMode: string;
  primaryColor: string;
  onButtonClick: (button: PersonaData["quickButtons"][0]) => void;
  hasBackground?: boolean;
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
                    className={`p-2 rounded-lg transition-colors group ${
                      hasBackground
                        ? "bg-white/90 hover:bg-white shadow-sm"
                        : "hover:bg-muted/80"
                    }`}
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
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                hasBackground
                  ? "bg-white/90 hover:bg-white shadow-sm"
                  : "hover:bg-muted/50"
              }`}
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

  // Full mode
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {buttons.map((button) => {
        const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
        return (
          <Button
            key={button.id}
            variant="outline"
            size="sm"
            className={`h-6 px-2 text-[11px] rounded-md font-normal ${
              hasBackground ? "bg-white/90 hover:bg-white shadow-sm" : ""
            }`}
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

// ==================== Return to Dashboard Button ====================

function ReturnToDashboardButton() {
  const [, navigate] = useLocation();
  return (
    <div className="fixed top-4 left-4 z-[9999]">
      <button
        onClick={() => navigate("/")}
        className="
          group flex items-center gap-2
          px-4 py-2
          bg-white/95 hover:bg-white
          border border-gray-200 hover:border-gray-300
          rounded-full
          text-sm font-medium text-gray-700 hover:text-gray-900
          shadow-lg hover:shadow-xl
          backdrop-blur-sm
          transition-all duration-200
        "
      >
        <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
        <span>返回後台</span>
      </button>
    </div>
  );
}

// ==================== Main Component ====================

export default function CustomerChatClient({
  personaId,
  sessionKey,
  isInternalTraining = false,
}: CustomerChatClientProps) {
  const effectiveSessionKey = sessionKey || String(personaId);

  const [sessionId] = useState(() => {
    const storageKey = `chat-session-${effectiveSessionKey}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) return stored;
    const newId = nanoid();
    sessionStorage.setItem(storageKey, newId);
    return newId;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Customer login state
  const [customer, setCustomer] = useState<any | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Customer session query to restore login state
  const customerToken = typeof window !== "undefined" ? localStorage.getItem("customerToken") : null;
  const { data: customerSession } = trpc.userAuth.customerSession.useQuery(
    { token: customerToken || "" },
    { enabled: !!customerToken && !customer }
  );

  // Restore customer login state from token
  useEffect(() => {
    if (customerSession?.user && !customer) {
      setCustomer(customerSession.user);
    }
  }, [customerSession, customer]);

  const handleCustomerLogin = (user: any) => setCustomer(user);
  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem("customerToken");
  };

  // Fetch persona data
  const { data: persona, isLoading: personaLoading } = trpc.persona.getPublic.useQuery(
    { personaId },
    { enabled: personaId > 0 }
  );

  // Fetch chat history
  const { data: history } = trpc.chat.history.useQuery(
    { personaId, sessionId },
    { enabled: personaId > 0 }
  );

  // Send message mutation
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
    onError: (error) => {
      let errorMessage = "抱歉，發生了一些問題，請稍後再試。";
      
      // Check if this is a Spark insufficient error
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.type === "SPARK_INSUFFICIENT") {
          errorMessage = "抱歉，AI 助手目前暫時離線，請稍後再試。\u611f謝您的耐心等待\uff01";
        }
      } catch {
        // Not a JSON error, use default message
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: errorMessage,
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
      if (messages.length >= 2 && !summaryGeneratedRef.current && !isTyping) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          summaryGeneratedRef.current = true;
          endConversationMutation.mutate({ personaId, sessionId });
        }
      }
    };

    const inactivityInterval = setInterval(generateSummaryIfNeeded, 60 * 1000);

    const handleBeforeUnload = () => {
      if (messages.length >= 2 && !summaryGeneratedRef.current) {
        summaryGeneratedRef.current = true;
        navigator.sendBeacon?.(
          `/api/trpc/chat.endConversation?batch=1&input=${encodeURIComponent(
            JSON.stringify({ "0": { json: { personaId, sessionId } } })
          )}`
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && messages.length >= 2 && !summaryGeneratedRef.current) {
        summaryGeneratedRef.current = true;
        endConversationMutation.mutate({ personaId, sessionId });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(inactivityInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [messages.length, isTyping, personaId, sessionId, endConversationMutation]);

  // Load history on mount
  useEffect(() => {
    if (history && history.length > 0) {
      setMessages(
        history.map((msg: any) => ({
          id: msg.id?.toString() || nanoid(),
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.createdAt || msg.timestamp),
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

  // Handlers
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

  const handleQuickButton = (button: PersonaData["quickButtons"][0]) => {
    switch (button.actionType) {
      case "query":
        if (button.actionValue) handleSend(button.actionValue);
        break;
      case "link":
        if (button.actionValue) window.open(button.actionValue, "_blank");
        break;
      case "booking":
        handleSend("我想預約諮詢");
        break;
      default:
        if (button.actionValue) handleSend(button.actionValue);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  // Loading state
  if (personaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not found state
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

  // Derived values
  const primaryColor = persona.primaryColor || "#3B82F6";
  const layoutStyle = persona.layoutStyle || "minimal";
  const chatPlaceholder = persona.chatPlaceholder || "輸入您的問題...";
  const suggestedQuestions = persona.suggestedQuestions || [];
  const showQuickButtons = persona.showQuickButtons ?? true;
  const buttonDisplayMode = persona.buttonDisplayMode || "full";

  const layoutProps: LayoutProps = {
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
    customer,
    showLoginDialog,
    setShowLoginDialog,
    onLogin: handleCustomerLogin,
    onLogout: handleCustomerLogout,
  };

  // Select layout
  let LayoutComponent: React.FC<LayoutProps>;
  if (layoutStyle === "professional") {
    LayoutComponent = ProfessionalLayout;
  } else if (layoutStyle === "custom") {
    LayoutComponent = CustomLayout;
  } else {
    LayoutComponent = MinimalLayout;
  }

  return (
    <>
      {isInternalTraining && <ReturnToDashboardButton />}
      <LayoutComponent {...layoutProps} />
    </>
  );
}

// ==================== Minimal Layout (ChatGPT Style) ====================

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
  customer,
  showLoginDialog,
  setShowLoginDialog,
  onLogin,
  onLogout,
}: LayoutProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State */}
        {!hasMessages && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl text-center space-y-5">
              {/* Avatar */}
              {persona.avatarUrl && (
                <div className="flex justify-center">
                  <Avatar className="h-16 w-16 shadow-md">
                    <AvatarImage src={persona.avatarUrl} className="object-cover" />
                    <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <Bot className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Agent Name */}
              {persona.agentName && (
                <h3 className="text-base font-medium text-foreground">{persona.agentName}</h3>
              )}

              {/* Welcome Message */}
              <h2
                className="font-semibold text-foreground"
                style={{
                  color: persona.welcomeMessageColor || undefined,
                  fontSize: getWelcomeMessageFontSize(persona.welcomeMessageSize),
                }}
              >
                {persona.welcomeMessage || "您好！我是AI助手"}
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
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
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
                className="rounded-full h-8 text-xs px-3 flex-1"
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
  customer,
  showLoginDialog,
  setShowLoginDialog,
  onLogin,
  onLogout,
}: LayoutProps) {
  const hasStartedChat = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State - Professional Business Card Style */}
        {!hasStartedChat && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl text-center space-y-5">
              {/* Profile Photo - Prominent display for professional layout */}
              {persona.profilePhotoUrl && (
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                    <AvatarImage src={persona.profilePhotoUrl} className="object-cover" />
                    <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Agent Name */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{persona.agentName || "AI 助手"}</h3>
                {persona.tagline && (
                  <p className="text-sm text-muted-foreground mt-1">{persona.tagline}</p>
                )}
              </div>

              {/* Welcome Message */}
              <h2
                className="font-semibold text-foreground"
                style={{
                  color: persona.welcomeMessageColor || undefined,
                  fontSize: getWelcomeMessageFontSize(persona.welcomeMessageSize),
                }}
              >
                {persona.welcomeMessage || "您好！我是您的AI助手"}
              </h2>

              {/* Input */}
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

              {/* Suggested Questions */}
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

              {/* Quick Buttons */}
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
                        message.role === "user" ? "text-white" : "bg-background border shadow-sm"
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

      {/* Input Area - Only show at bottom when chatting */}
      {hasStartedChat && (
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
                className="rounded-full h-9 text-sm flex-1"
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
  customer,
  showLoginDialog,
  setShowLoginDialog,
  onLogin,
  onLogout,
}: LayoutProps) {
  const hasStartedChat = messages.length > 0;
  const backgroundType = (persona as any).backgroundType || "none";
  const backgroundColor = (persona as any).backgroundColor;
  const backgroundImage = persona.backgroundImageUrl;
  const backgroundSize = (persona as any).backgroundSize || "cover";
  const backgroundPosition = (persona as any).backgroundPosition || "center";
  const backgroundRepeat = (persona as any).backgroundRepeat || "no-repeat";
  const immersiveMode = (persona as any).immersiveMode || false;

  const getBackgroundStyle = () => {
    if (backgroundType === "image" && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize,
        backgroundPosition,
        backgroundRepeat,
        backgroundColor: undefined,
      };
    } else if (backgroundType === "color" && backgroundColor) {
      return { backgroundImage: undefined, backgroundColor };
    } else {
      return { backgroundImage: undefined, backgroundColor: "#ffffff" };
    }
  };

  const backgroundStyle = getBackgroundStyle();
  const hasBackgroundImage = backgroundType === "image" && backgroundImage;

  return (
    <div
      className={`min-h-screen flex flex-col`}
      style={immersiveMode ? {} : backgroundStyle}
    >
      {/* Gradient Overlay for Immersive Mode */}
      {immersiveMode && (
        <div className="fixed inset-0 -z-10" style={backgroundStyle}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)" }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Welcome State */}
        {!hasStartedChat && (
          <div
            className={`flex-1 flex flex-col items-center justify-center px-4 py-6 relative ${
              !immersiveMode && hasBackgroundImage ? "bg-cover bg-center" : ""
            }`}
            style={!immersiveMode ? backgroundStyle : {}}
          >
            {!immersiveMode && backgroundImage && <div className="absolute inset-0 bg-black/40 -z-10" />}
            <div className="w-full max-w-xl text-center space-y-5 relative z-10">
              <h2
                className={`font-semibold ${!immersiveMode && hasBackgroundImage ? "text-white" : "text-foreground"}`}
                style={{
                  color: persona.welcomeMessageColor || undefined,
                  fontSize: getWelcomeMessageFontSize(persona.welcomeMessageSize),
                }}
              >
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
                    hasBackground={!!backgroundImage || !!backgroundColor}
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
                        message.role === "user" ? "text-white" : "bg-background/95 backdrop-blur"
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

      {/* Input Area - Only show at bottom when chatting */}
      {hasStartedChat && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t">
          <div className="container max-w-2xl py-3">
            {showQuickButtons && persona.quickButtons.length > 0 && (
              <div className="mb-2">
                <QuickButtonGroup
                  buttons={persona.quickButtons}
                  displayMode={buttonDisplayMode}
                  primaryColor={primaryColor}
                  onButtonClick={handleQuickButton}
                  hasBackground={!!backgroundImage || !!backgroundColor}
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
                className="rounded-full h-9 text-sm bg-background flex-1"
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
