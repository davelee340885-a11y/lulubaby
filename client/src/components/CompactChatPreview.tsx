import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, MessageSquare, Calendar, Phone, ShoppingBag, User, Building2, Search, Link, FileText, HelpCircle } from "lucide-react";

type PreviewProps = {
  agentName: string;
  avatarUrl: string;
  welcomeMessage: string;
  primaryColor: string;
  suggestedQuestions: string[];
  quickButtons: Array<{
    label: string;
    icon: string;
    actionType: string;
  }>;
  buttonDisplayMode: string;
  chatPlaceholder: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  calendar: Calendar,
  link: Link,
  message: MessageSquare,
  user: User,
  building: Building2,
  package: ShoppingBag,
  phone: Phone,
  file: FileText,
  help: HelpCircle,
  // Action type mapping
  query: MessageSquare,
  booking: Calendar,
  product: ShoppingBag,
  profile: User,
  company: Building2,
  contact: Phone,
  faq: HelpCircle,
};

export default function CompactChatPreview({
  agentName,
  avatarUrl,
  welcomeMessage,
  primaryColor,
  suggestedQuestions,
  quickButtons,
  buttonDisplayMode,
  chatPlaceholder,
}: PreviewProps) {
  return (
    <div className="sticky top-4 w-full h-[calc(100vh-8rem)] bg-background border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Minimal Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Bot className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs truncate">{agentName || "AI 助手"}</h3>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            在線
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-auto">
        <div className="w-full max-w-md text-center space-y-4">
          {/* Welcome Message */}
          <h2 className="text-lg font-semibold text-foreground">
            {welcomeMessage || "您好！我是您的AI助手"}
          </h2>

          {/* Input Area */}
          <div className="relative w-full">
            <div className="flex items-center bg-background border border-border/60 rounded-xl shadow-sm px-3 py-2">
              <Input
                placeholder={chatPlaceholder || "輸入您的問題..."}
                disabled
                className="border-0 shadow-none focus-visible:ring-0 h-auto text-xs px-0 bg-transparent pointer-events-none"
              />
              <Button
                size="icon"
                className="rounded-full h-7 w-7 shrink-0 ml-2 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  disabled
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border/60 bg-background text-[10px] text-muted-foreground pointer-events-none"
                >
                  <MessageSquare className="h-2.5 w-2.5" />
                  <span className="max-w-[100px] truncate">{question}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Buttons */}
          {quickButtons.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {buttonDisplayMode === "icon" ? (
                // Icon mode
                quickButtons.slice(0, 6).map((button, index) => {
                  const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
                  return (
                    <button
                      key={index}
                      disabled
                      className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors pointer-events-none"
                      style={{ color: primaryColor }}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </button>
                  );
                })
              ) : buttonDisplayMode === "compact" ? (
                // Compact mode
                quickButtons.slice(0, 4).map((button, index) => {
                  const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
                  return (
                    <button
                      key={index}
                      disabled
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border hover:bg-muted/50 transition-colors pointer-events-none"
                    >
                      <IconComponent className="h-2.5 w-2.5" />
                      <span className="max-w-[50px] truncate">{button.label}</span>
                    </button>
                  );
                })
              ) : (
                // Full mode
                quickButtons.slice(0, 4).map((button, index) => {
                  const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      disabled
                      className="h-6 px-2 text-[10px] rounded-md font-normal pointer-events-none"
                    >
                      <IconComponent className="h-2.5 w-2.5 mr-1" />
                      <span className="max-w-[60px] truncate">{button.label}</span>
                    </Button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Label */}
      <div className="border-t border-border/40 bg-muted/30 px-3 py-1.5 text-center">
        <p className="text-[10px] text-muted-foreground">即時預覽</p>
      </div>
    </div>
  );
}
