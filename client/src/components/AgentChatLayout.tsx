/**
 * AgentChatLayout - 智能體對話佈局組件
 * 
 * 包含可收合的側邊欄和主對話區
 * 側邊欄嵌入完整的用戶設定版面
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  Palette,
  UserCircle,
  Globe,
  Brain,
  Sparkles,
  Zap,
  FileText,
  Puzzle,
  Code,
  Users,
  User,
  CreditCard,
  MessageCircle,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// 側邊欄導航項目
const sidebarNavItems = [
  {
    category: "儀表板",
    items: [
      { icon: LayoutDashboard, label: "儀表板", path: "/" },
    ],
  },
  {
    category: "客戶前端",
    items: [
      { icon: Palette, label: "版面設定", path: "/appearance" },
      { icon: UserCircle, label: "客戶記憶", path: "/customers" },
      { icon: Globe, label: "專屬網址", path: "/domain" },
    ],
  },
  {
    category: "AI 大腦",
    items: [
      { icon: Sparkles, label: "🧠 我的大腦", path: "/brain" },
      { icon: Brain, label: "訓練智能體", path: "/training" },
      { icon: Zap, label: "開發超能力", path: "/superpowers" },
      { icon: FileText, label: "知識庫", path: "/knowledge" },
    ],
  },
  {
    category: "開發者",
    items: [
      { icon: Puzzle, label: "Widget 嵌入", path: "/widget" },
      { icon: Code, label: "API 文檔", path: "/api-docs" },
    ],
  },
  {
    category: "設定",
    items: [
      { icon: Users, label: "團隊管理", path: "/team" },
      { icon: User, label: "帳戶設定", path: "/account" },
      { icon: CreditCard, label: "會員計劃", path: "/pricing" },
    ],
  },
];

interface AgentChatLayoutProps {
  children: React.ReactNode;
}

export default function AgentChatLayout({ children }: AgentChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  // 處理側邊欄外部點擊
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("agent-chat-sidebar");
      const toggleBtn = document.getElementById("sidebar-toggle-btn");
      
      if (sidebarOpen && sidebar && toggleBtn) {
        if (!sidebar.contains(e.target as Node) && !toggleBtn.contains(e.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  // 處理導航點擊
  const handleNavClick = (path: string) => {
    setLocation(path);
    setSidebarOpen(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* 側邊欄切換按鈕 - 放在左下角避免與對話頂部欄重疊 */}
      <Button
        id="sidebar-toggle-btn"
        variant="outline"
        size="icon"
        className={cn(
          "fixed bottom-6 z-50 transition-all duration-300 shadow-lg",
          sidebarOpen ? "left-[408px]" : "left-4"
        )}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
      </Button>

      {/* 可收合側邊欄 */}
      <div
        id="agent-chat-sidebar"
        className={cn(
          "fixed top-0 left-0 h-screen w-[400px] bg-card border-r border-border z-40",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>
          {/* 側邊欄標題 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">設定面板</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 導航列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {sidebarNavItems.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category.category}
                  </h3>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-10"
                        onClick={() => handleNavClick(item.path)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 開發內地客戶按鈕 - 固定在底部 */}
          <div className="flex-shrink-0 p-4 border-t border-border bg-card sticky bottom-0">
            <Button
              variant="outline"
              className="w-full gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border-violet-500/30"
              onClick={() => setContactModalOpen(true)}
            >
              <MessageCircle className="h-4 w-4 text-violet-500" />
              <span className="text-violet-600 dark:text-violet-400">AI 開發內地客戶</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 主對話區 */}
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-[400px]" : "ml-0"
        )}
      >
        {children}
      </div>

      {/* AI 開發內地客戶 Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-violet-500" />
              AI 開發內地客戶
            </DialogTitle>
            <DialogDescription>
              聯繫我們了解如何使用 AI 智能體開發內地客戶
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="font-medium">Lulubaby 團隊</p>
                  <p className="text-sm text-muted-foreground">AI 智能體專家</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📧 電郵：</span>
                  <a href="mailto:contact@lulubaby.ai" className="text-primary hover:underline">
                    contact@lulubaby.ai
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📱 WhatsApp：</span>
                  <a href="https://wa.me/85212345678" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    +852 1234 5678
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🌐 網站：</span>
                  <a href="https://lulubaby.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    lulubaby.ai
                  </a>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>我們的 AI 智能體可以幫助您：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>自動化客戶開發流程</li>
                <li>個性化郵件和訊息發送</li>
                <li>智能客戶分類和跟進</li>
                <li>24/7 自動回覆客戶查詢</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
