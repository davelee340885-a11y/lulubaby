import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Send, MessageSquare, Calendar, Phone, ShoppingBag, User, Building2, Search, Link, FileText, HelpCircle, Smartphone, Monitor } from "lucide-react";

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
  layoutStyle?: string;
  profilePhotoUrl?: string;
  backgroundImageUrl?: string;
  backgroundType?: "none" | "color" | "image";
  backgroundColor?: string;
  immersiveMode?: boolean;
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

function PreviewContent({
  agentName,
  avatarUrl,
  welcomeMessage,
  primaryColor,
  suggestedQuestions,
  quickButtons,
  buttonDisplayMode,
  chatPlaceholder,
  layoutStyle,
  profilePhotoUrl,
  backgroundImageUrl,
  backgroundType,
  backgroundColor,
  immersiveMode,
  isMobile,
}: PreviewProps & { isMobile: boolean }) {
  // Determine which avatar to display based on layout style
  const displayAvatarUrl = layoutStyle === "professional" && profilePhotoUrl 
    ? profilePhotoUrl 
    : avatarUrl;

  // Determine background style based on type
  const getBackgroundStyle = () => {
    if (layoutStyle === "custom") {
      if (backgroundType === "image" && backgroundImageUrl) {
        return { 
          backgroundImage: `url(${backgroundImageUrl})`, 
          backgroundSize: "cover", 
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      } else if (backgroundType === "color" && backgroundColor) {
        return {
          backgroundColor: backgroundColor,
        };
      }
    }
    return {};
  };

  const backgroundStyle = getBackgroundStyle();
  const hasBackgroundImage = layoutStyle === "custom" && backgroundType === "image" && backgroundImageUrl;

  // Check if we should show profile photo in the welcome area (professional layout)
  const showProfilePhoto = layoutStyle === "professional" && profilePhotoUrl;

  return (
    <div 
      className="w-full h-full bg-background border border-border rounded-lg shadow-sm overflow-hidden flex flex-col relative"
      style={immersiveMode ? backgroundStyle : {}}
    >
      {/* Gradient Overlay for Immersive Mode */}
      {immersiveMode && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
          <div className="absolute inset-0 backdrop-blur-[2px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
        </div>
      )}
      {/* Minimal Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar className={isMobile ? "h-6 w-6" : "h-8 w-8"}>
            {displayAvatarUrl && <AvatarImage src={displayAvatarUrl} />}
            <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Bot className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate ${isMobile ? "text-xs" : "text-sm"}`}>{agentName || "AI 助手"}</h3>
          </div>
          <span className={`flex items-center gap-1 text-green-600 ${isMobile ? "text-[10px]" : "text-xs"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            在線
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-auto relative"
        style={!immersiveMode ? backgroundStyle : {}}
      >
        {/* Overlay for non-immersive mode */}
        {!immersiveMode && hasBackgroundImage && <div className="absolute inset-0 bg-black/40 z-0" />}
        <div className={`w-full text-center space-y-4 relative z-10 ${isMobile ? "max-w-md" : "max-w-2xl"}`}>
          {/* Professional Layout: Show Profile Photo */}
          {showProfilePhoto && (
            <div className="flex justify-center mb-2">
              <Avatar className={isMobile ? "h-16 w-16" : "h-24 w-24"}>
                {profilePhotoUrl && <AvatarImage src={profilePhotoUrl} className="object-cover" />}
                <AvatarFallback style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  <User className={isMobile ? "h-8 w-8" : "h-12 w-12"} />
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Welcome Message */}
          <h2 className={`font-semibold ${hasBackgroundImage ? "text-white drop-shadow-lg" : "text-foreground"} ${isMobile ? "text-lg" : "text-2xl"}`}>
            {welcomeMessage || "您好！我是您的AI助手"}
          </h2>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className={`flex flex-wrap justify-center ${isMobile ? "gap-1.5" : "gap-2"}`}>
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  disabled
                  className={`inline-flex items-center gap-1 rounded-full border border-border/60 ${layoutStyle === "custom" && backgroundImageUrl ? "bg-white/90 text-foreground" : "bg-background text-muted-foreground"} pointer-events-none ${isMobile ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
                >
                  <MessageSquare className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                  <span className={isMobile ? "max-w-[100px] truncate" : "max-w-[150px] truncate"}>{question}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Buttons */}
          {quickButtons.length > 0 && (
            <div className={`flex flex-wrap justify-center ${isMobile ? "gap-1.5" : "gap-2"}`}>
              {buttonDisplayMode === "icon" ? (
                // Icon mode
                quickButtons.slice(0, 6).map((button, index) => {
                  const IconComponent = iconMap[button.icon || button.actionType] || MessageSquare;
                  return (
                    <button
                      key={index}
                      disabled
                      className={`rounded-lg hover:bg-muted/80 transition-colors pointer-events-none ${layoutStyle === "custom" && backgroundImageUrl ? "bg-white/90" : ""} ${isMobile ? "p-1.5" : "p-2"}`}
                      style={{ color: primaryColor }}
                    >
                      <IconComponent className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
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
                      className={`inline-flex items-center gap-1 rounded-md border hover:bg-muted/50 transition-colors pointer-events-none ${layoutStyle === "custom" && backgroundImageUrl ? "bg-white/90 border-white/20" : ""} ${isMobile ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
                    >
                      <IconComponent className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                      <span className={isMobile ? "max-w-[50px] truncate" : "max-w-[80px] truncate"}>{button.label}</span>
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
                      className={`rounded-md font-normal pointer-events-none ${layoutStyle === "custom" && backgroundImageUrl ? "bg-white/90 border-white/20" : ""} ${isMobile ? "h-6 px-2 text-[10px]" : "h-8 px-3 text-xs"}`}
                    >
                      <IconComponent className={isMobile ? "h-2.5 w-2.5 mr-1" : "h-3 w-3 mr-1.5"} />
                      <span className={isMobile ? "max-w-[60px] truncate" : "max-w-[100px] truncate"}>{button.label}</span>
                    </Button>
                  );
                })
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="relative w-full">
            <div className={`flex items-center bg-background border border-border/60 rounded-xl shadow-sm ${isMobile ? "px-3 py-2" : "px-4 py-3"}`}>
              <Input
                placeholder={chatPlaceholder || "輸入您的問題..."}
                disabled
                className={`border-0 shadow-none focus-visible:ring-0 h-auto px-0 bg-transparent pointer-events-none ${isMobile ? "text-xs" : "text-sm"}`}
              />
              <Button
                size="icon"
                className={`rounded-full shrink-0 ml-2 pointer-events-none ${isMobile ? "h-7 w-7" : "h-9 w-9"}`}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Label */}
      <div className="border-t border-border/40 bg-muted/30 px-3 py-1.5 text-center">
        <p className={isMobile ? "text-[10px] text-muted-foreground" : "text-xs text-muted-foreground"}>即時預覽</p>
      </div>
    </div>
  );
}

export default function CompactChatPreview(props: PreviewProps) {
  const [activeTab, setActiveTab] = React.useState("mobile");

  return (
    <div className="sticky top-4 w-full h-[calc(100vh-8rem)] flex flex-col">
      <div className="grid w-full grid-cols-2 mb-2 rounded-md bg-muted p-1">
        <button
          onClick={() => setActiveTab("mobile")}
          className={`flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm transition-colors ${
            activeTab === "mobile" ? "bg-background shadow-sm" : "hover:bg-background/50"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          手機版
        </button>
        <button
          onClick={() => setActiveTab("desktop")}
          className={`flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm transition-colors ${
            activeTab === "desktop" ? "bg-background shadow-sm" : "hover:bg-background/50"
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
          桌面版
        </button>
      </div>
      
      <div className="flex-1">
        {activeTab === "mobile" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-[375px] h-full">
              <PreviewContent {...props} isMobile={true} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            <PreviewContent {...props} isMobile={false} />
          </div>
        )}
      </div>
    </div>
  );
}
