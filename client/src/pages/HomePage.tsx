import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Loader2, Bot, User, Search, Calendar, Link as LinkIcon, MessageSquare, ExternalLink, Sparkles, FileText, Building2, Phone, HelpCircle, ShoppingBag, UserCircle, LogIn, PanelLeft, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Knowledge from "@/pages/Knowledge";
import Appearance from "@/pages/Appearance";
import Domain from "@/pages/Domain";
import Training from "@/pages/Training";
import Superpowers from "@/pages/Superpowers";
import Account from "@/pages/Account";
import Pricing from "@/pages/Pricing";
import Team from "@/pages/Team";
import Customers from "@/pages/Customers";
import Widget from "@/pages/Widget";
import ApiDocs from "@/pages/ApiDocs";
import Brain from "@/pages/Brain";
import AdminUsers from "@/pages/AdminUsers";
import AgentChatPage from "@/pages/AgentChatPage";
import { Route, Switch } from "wouter";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Icon map for quick buttons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search, calendar: Calendar, link: LinkIcon, message: MessageSquare,
  sparkles: Sparkles, file: FileText, building: Building2, phone: Phone,
  help: HelpCircle, shopping: ShoppingBag, user: UserCircle, query: MessageSquare,
  booking: Calendar, product: ShoppingBag, profile: UserCircle, company: Building2,
  catalog: FileText, contact: Phone, faq: HelpCircle, custom: Sparkles,
};

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

function QuickButtonGroup({ buttons, displayMode, primaryColor, onButtonClick }: {
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
                  <button onClick={() => onButtonClick(button)} className="p-2 rounded-lg hover:bg-muted/80 transition-colors" style={{ color: primaryColor }}>
                    <IconComponent className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{button.label}</TooltipContent>
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
            <button key={button.id} onClick={() => onButtonClick(button)} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border hover:bg-muted/50 transition-colors">
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
          <Button key={button.id} variant="outline" size="sm" className="h-6 px-2 text-[11px] rounded-md font-normal" onClick={() => onButtonClick(button)}>
            <IconComponent className="h-3 w-3 mr-1" />
            {button.label}
            {button.actionType === "link" && <ExternalLink className="h-2 w-2 ml-0.5 opacity-50" />}
          </Button>
        );
      })}
    </div>
  );
}

// Dashboard Overlay component
function DashboardOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      {/* Close button - fixed top right */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors shadow-md"
        aria-label="關閉儀表板"
      >
        <X className="h-5 w-5" />
      </button>
      
      {/* Full Dashboard */}
      <div className="h-full overflow-auto">
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/knowledge" component={Knowledge} />
            <Route path="/appearance" component={Appearance} />
            <Route path="/domain" component={Domain} />
            <Route path="/training" component={Training} />
            <Route path="/superpowers" component={Superpowers} />
            <Route path="/brain" component={Brain} />
            <Route path="/account" component={Account} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/feed" component={Pricing} />
            <Route path="/team" component={Team} />
            <Route path="/customers" component={Customers} />
            <Route path="/widget" component={Widget} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/agent-chat" component={AgentChatPage} />
            <Route component={Dashboard} />
          </Switch>
        </DashboardLayout>
      </div>
    </div>
  );
}

// The default personaId for lulubaby.xyz (Dave Lee's agent)
const DEFAULT_PERSONA_ID = 1;

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem("chat-session-home");
    if (stored) return stored;
    const newId = nanoid();
    sessionStorage.setItem("chat-session-home", newId);
    return newId;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: persona, isLoading: personaLoading } = trpc.persona.getPublic.useQuery(
    { personaId: DEFAULT_PERSONA_ID },
    { enabled: true }
  );

  const { data: history } = trpc.chat.history.useQuery(
    { personaId: DEFAULT_PERSONA_ID, sessionId },
    { enabled: true }
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, {
        id: nanoid(), role: "assistant", content: data.message, timestamp: new Date(),
      }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [...prev, {
        id: nanoid(), role: "assistant", content: "抱歉，發生了一些問題，請稍後再試。", timestamp: new Date(),
      }]);
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

  // Handle Escape key to close dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dashboardOpen) {
        setDashboardOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dashboardOpen]);

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: nanoid(), role: "user", content: text, timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    sendMutation.mutate({
      personaId: DEFAULT_PERSONA_ID,
      message: userMessage.content,
      sessionId,
    });
  }, [input, sendMutation, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">智能體載入失敗</p>
        </div>
      </div>
    );
  }

  const primaryColor = persona.primaryColor || "#3B82F6";
  const chatPlaceholder = persona.chatPlaceholder || "輸入您的問題...";
  const suggestedQuestions = persona.suggestedQuestions || [];
  const showQuickButtons = persona.showQuickButtons ?? true;
  const buttonDisplayMode = persona.buttonDisplayMode || "full";
  const backgroundType = (persona as any).backgroundType || "none";
  const backgroundColor = (persona as any).backgroundColor;
  const backgroundImage = persona.backgroundImageUrl;
  const profilePhoto = persona.profilePhotoUrl;
  const immersiveMode = (persona as any).immersiveMode || false;

  const getBackgroundStyle = () => {
    if (backgroundType === "image" && backgroundImage) {
      return { backgroundImage: `url(${backgroundImage})`, backgroundColor: undefined };
    } else if (backgroundType === "color" && backgroundColor) {
      return { backgroundImage: undefined, backgroundColor };
    } else {
      return { backgroundImage: undefined, backgroundColor: "#ffffff" };
    }
  };

  const backgroundStyle = getBackgroundStyle();
  const hasBackgroundImage = backgroundType === "image" && backgroundImage;

  return (
    <>
      {/* Dashboard Overlay */}
      <DashboardOverlay isOpen={dashboardOpen} onClose={() => setDashboardOpen(false)} />

      {/* Main Chat Page */}
      <div
        className="min-h-screen flex flex-col"
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

        {/* Bottom input bar when messages exist */}
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

        {/* Fixed Bottom-Left Button: Login or Dashboard Icon */}
        <div className="fixed bottom-4 left-4 z-50">
          {authLoading ? null : user ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      const ws = (user as any).subdomain || user.id;
                      setLocation(`/w/${ws}/dashboard`);
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-border/60 bg-background/95 backdrop-blur shadow-md hover:bg-muted/80 transition-all hover:shadow-lg"
                    aria-label="開啟儀表板"
                  >
                    <PanelLeft className="h-5 w-5 text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>管理儀表板</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLocation("/login")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background/95 backdrop-blur shadow-md hover:bg-muted/80 transition-all hover:shadow-lg text-sm text-muted-foreground hover:text-foreground"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>登入</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>登入帳戶</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </>
  );
}
