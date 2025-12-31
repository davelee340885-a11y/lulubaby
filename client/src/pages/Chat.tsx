import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Search, Calendar, Link as LinkIcon, MessageSquare, ExternalLink, Sparkles } from "lucide-react";
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
  sparkles: Sparkles,
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
  const layoutStyle = persona.layoutStyle || "minimal";
  const chatPlaceholder = persona.chatPlaceholder || "輸入您的問題...";
  const suggestedQuestions = persona.suggestedQuestions || [];
  const showQuickButtons = persona.showQuickButtons ?? true;

  // Render based on layout style
  if (layoutStyle === "professional") {
    return <ProfessionalLayout 
      persona={persona} 
      primaryColor={primaryColor}
      chatPlaceholder={chatPlaceholder}
      suggestedQuestions={suggestedQuestions}
      showQuickButtons={showQuickButtons}
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

// ==================== Minimal Layout (ChatGPT Style) ====================
function MinimalLayout({
  persona,
  primaryColor,
  chatPlaceholder,
  suggestedQuestions,
  showQuickButtons,
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
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-3xl py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={persona.avatarUrl || undefined} />
              <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-medium text-sm">{persona.agentName}</h1>
              <p className="text-xs text-muted-foreground">在線</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container max-w-3xl">
        <ScrollArea className="h-[calc(100vh-160px)] py-6" ref={scrollRef}>
          <div className="space-y-6">
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                    <Bot className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold mb-2">{persona.agentName}</h2>
                <p className="text-muted-foreground max-w-md mb-8">{persona.welcomeMessage}</p>
                
                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                  <div className="grid gap-2 w-full max-w-md">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-left p-3 rounded-xl border hover:bg-muted/50 transition-colors text-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === "assistant" ? (
                    <>
                      <AvatarImage src={persona.avatarUrl || undefined} />
                      <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
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
              <div className="flex gap-4">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t bg-background">
        <div className="container max-w-3xl py-4 space-y-3">
          {/* Quick Buttons */}
          {showQuickButtons && persona.quickButtons.length > 0 && messages.length === 0 && (
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
                  >
                    <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                    {button.label}
                    {button.actionType === "link" && <ExternalLink className="h-3 w-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={chatPlaceholder}
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
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
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
        <div className="relative py-12 px-4" style={{ backgroundColor: primaryColor }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="relative container max-w-2xl text-center text-white">
            {/* Profile Photo */}
            <div className="mb-6">
              {persona.profilePhotoUrl ? (
                <img
                  src={persona.profilePhotoUrl}
                  alt={persona.agentName}
                  className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-white/30 shadow-xl"
                />
              ) : (
                <Avatar className="w-28 h-28 mx-auto border-4 border-white/30 shadow-xl">
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback className="text-3xl bg-white/20">
                    <Bot className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{persona.agentName}</h1>
            {persona.tagline && (
              <p className="text-white/90 mb-4">{persona.tagline}</p>
            )}
            <p className="text-white/80 text-sm max-w-md mx-auto">{persona.welcomeMessage}</p>
          </div>
        </div>
      )}

      {/* Compact Header - Only show when chatting */}
      {hasStartedChat && (
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="container max-w-3xl py-3">
            <div className="flex items-center gap-3">
              {persona.profilePhotoUrl ? (
                <img
                  src={persona.profilePhotoUrl}
                  alt={persona.agentName}
                  className="w-10 h-10 rounded-full object-cover border-2"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <Avatar className="h-10 w-10 border-2" style={{ borderColor: primaryColor }}>
                  <AvatarImage src={persona.avatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <h1 className="font-semibold">{persona.agentName}</h1>
                {persona.tagline && <p className="text-xs text-muted-foreground">{persona.tagline}</p>}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Chat Area */}
      <div className="flex-1 container max-w-3xl bg-background rounded-t-3xl -mt-4 relative z-10 shadow-lg">
        <ScrollArea 
          className={hasStartedChat ? "h-[calc(100vh-180px)] py-4" : "h-auto py-6"} 
          ref={scrollRef}
        >
          <div className="space-y-4 px-4">
            {/* Suggested Questions - Only when no messages */}
            {!hasStartedChat && suggestedQuestions.length > 0 && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-3 text-center">常見問題</p>
                <div className="grid gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm"
                    >
                      <Sparkles className="h-4 w-4 inline mr-2 text-primary" />
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === "assistant" ? (
                    persona.profilePhotoUrl ? (
                      <AvatarImage src={persona.profilePhotoUrl} className="object-cover" />
                    ) : (
                      <>
                        <AvatarImage src={persona.avatarUrl || undefined} />
                        <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    )
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
                        : "rounded-tl-sm bg-muted"
                    }`}
                    style={{
                      backgroundColor: message.role === "user" ? primaryColor : undefined,
                    }}
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
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  {persona.profilePhotoUrl ? (
                    <AvatarImage src={persona.profilePhotoUrl} className="object-cover" />
                  ) : (
                    <>
                      <AvatarImage src={persona.avatarUrl || undefined} />
                      <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t bg-background shadow-lg">
        <div className="container max-w-3xl py-4 space-y-3">
          {/* Quick Buttons */}
          {showQuickButtons && persona.quickButtons.length > 0 && !hasStartedChat && (
            <div className="flex flex-wrap gap-2 justify-center">
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

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={chatPlaceholder}
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
  const hasBackground = !!persona.backgroundImageUrl;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      {hasBackground && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${persona.backgroundImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section - Only show when no messages */}
        {!hasStartedChat && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-lg">
              {/* Profile */}
              <div className="mb-6">
                {persona.profilePhotoUrl ? (
                  <img
                    src={persona.profilePhotoUrl}
                    alt={persona.agentName}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white/50 shadow-2xl"
                  />
                ) : (
                  <Avatar className="w-32 h-32 mx-auto border-4 border-white/50 shadow-2xl">
                    <AvatarImage src={persona.avatarUrl || undefined} />
                    <AvatarFallback className="text-4xl" style={{ backgroundColor: primaryColor, color: "white" }}>
                      <Bot className="h-14 w-14" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              
              <h1 className={`text-3xl font-bold mb-2 ${hasBackground ? "text-white" : ""}`}>
                {persona.agentName}
              </h1>
              {persona.tagline && (
                <p className={`text-lg mb-4 ${hasBackground ? "text-white/90" : "text-muted-foreground"}`}>
                  {persona.tagline}
                </p>
              )}
              <p className={`mb-8 ${hasBackground ? "text-white/80" : "text-muted-foreground"}`}>
                {persona.welcomeMessage}
              </p>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className={`w-full text-left p-4 rounded-xl transition-all text-sm ${
                        hasBackground 
                          ? "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/20" 
                          : "bg-background border hover:bg-muted"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 inline mr-2" style={{ color: hasBackground ? "white" : primaryColor }} />
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Buttons */}
              {showQuickButtons && persona.quickButtons.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {persona.quickButtons.map((button) => {
                    const IconComponent = iconMap[button.icon || "message"] || MessageSquare;
                    return (
                      <Button
                        key={button.id}
                        variant={hasBackground ? "secondary" : "outline"}
                        size="sm"
                        className={`rounded-full ${hasBackground ? "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-white/20" : ""}`}
                        onClick={() => handleQuickButton(button)}
                      >
                        <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                        {button.label}
                        {button.actionType === "link" && <ExternalLink className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Mode Header */}
        {hasStartedChat && (
          <header className={`sticky top-0 z-10 ${hasBackground ? "bg-black/30 backdrop-blur-md" : "bg-background/95 backdrop-blur border-b"}`}>
            <div className="container max-w-3xl py-3">
              <div className="flex items-center gap-3">
                {persona.profilePhotoUrl ? (
                  <img
                    src={persona.profilePhotoUrl}
                    alt={persona.agentName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={persona.avatarUrl || undefined} />
                    <AvatarFallback style={{ backgroundColor: primaryColor, color: "white" }}>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h1 className={`font-semibold ${hasBackground ? "text-white" : ""}`}>{persona.agentName}</h1>
                  {persona.tagline && (
                    <p className={`text-xs ${hasBackground ? "text-white/70" : "text-muted-foreground"}`}>
                      {persona.tagline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Chat Messages */}
        {hasStartedChat && (
          <div className="flex-1 container max-w-3xl">
            <ScrollArea className="h-[calc(100vh-160px)] py-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      {message.role === "assistant" ? (
                        persona.profilePhotoUrl ? (
                          <AvatarImage src={persona.profilePhotoUrl} className="object-cover" />
                        ) : (
                          <>
                            <AvatarImage src={persona.avatarUrl || undefined} />
                            <AvatarFallback style={{ backgroundColor: primaryColor, color: "white" }}>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        )
                      ) : (
                        <AvatarFallback className="bg-white/20 text-white">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                      <div
                        className={`inline-block rounded-2xl px-4 py-3 max-w-[85%] ${
                          message.role === "user"
                            ? "rounded-tr-sm text-white"
                            : `rounded-tl-sm ${hasBackground ? "bg-white/90 backdrop-blur-md" : "bg-muted"}`
                        }`}
                        style={{
                          backgroundColor: message.role === "user" ? primaryColor : undefined,
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
                      {persona.profilePhotoUrl ? (
                        <AvatarImage src={persona.profilePhotoUrl} className="object-cover" />
                      ) : (
                        <>
                          <AvatarImage src={persona.avatarUrl || undefined} />
                          <AvatarFallback style={{ backgroundColor: primaryColor, color: "white" }}>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${hasBackground ? "bg-white/90 backdrop-blur-md" : "bg-muted"}`}>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Input Area */}
        <div className={`sticky bottom-0 ${hasBackground ? "bg-black/30 backdrop-blur-md" : "bg-background border-t"}`}>
          <div className="container max-w-3xl py-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={chatPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className={`rounded-full ${hasBackground ? "bg-white/90 backdrop-blur-md border-white/20" : ""}`}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="rounded-full shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
