import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// DropdownMenu removed - using direct buttons instead
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, FileText, Bot, Palette, Globe, Brain, Zap, User, CreditCard, ExternalLink, MessageCircle, Users, UserCircle, Monitor, Settings, Sparkles, Code, Puzzle, Phone, Mail, MapPin, Gift, Shield } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Navigation categories with colors
const baseNavCategories = [
  {
    id: "dashboard",
    label: "儀表板",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    items: [
      { icon: LayoutDashboard, label: "儀表板", path: "/dashboard" },
      { icon: MessageCircle, label: "內部訓練對話", path: "/agent-chat" },
    ],
  },
  {
    id: "customer",
    label: "客戶前端",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    borderColor: "border-l-emerald-500",
    items: [
      { icon: Palette, label: "版面設定", path: "/appearance" },
      { icon: UserCircle, label: "客戶記憶", path: "/customers" },
      { icon: Globe, label: "專屬網址", path: "/domain" },
    ],
  },
  {
    id: "ai-brain",
    label: "AI 大腦",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    borderColor: "border-l-violet-500",
    items: [
      { icon: Sparkles, label: "🧠 我的大腦", path: "/brain" },
      { icon: Brain, label: "訓練智能體", path: "/training" },
      { icon: Zap, label: "開發超能力", path: "/superpowers" },
      { icon: FileText, label: "知識庫", path: "/knowledge" },
    ],
  },
  {
    id: "developer",
    label: "開發者",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    borderColor: "border-l-cyan-500",
    items: [
      { icon: Puzzle, label: "Widget 嵌入", path: "/widget" },
      { icon: Code, label: "API 文檔", path: "/api-docs" },
    ],
  },
  {
    id: "settings",
    label: "設定",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    borderColor: "border-l-amber-500",
    items: [
      { icon: User, label: "帳戶設定", path: "/account" },
      { icon: Gift, label: "推薦有賞", path: "/account#referral" },
    ],
  },
];

const adminCategory = {
  id: "admin",
  label: "管理員",
  color: "bg-red-500/10 text-red-600 dark:text-red-400",
  borderColor: "border-l-red-500",
  items: [
    { icon: Shield, label: "用戶管理", path: "/admin/users" },
  ],
};

function getNavCategories(isAdmin: boolean) {
  if (isAdmin) {
    return [...baseNavCategories, adminCategory];
  }
  return baseNavCategories;
}

// Flatten menu items for finding active item (includes admin items)
const allMenuItems = [...baseNavCategories, adminCategory].flatMap(cat => cat.items);

// Helper: resolve workspace path
function wsPath(workspaceId: string | undefined, path: string) {
  if (!workspaceId) return path; // fallback for legacy
  return `/w/${workspaceId}${path}`;
}

// Helper: check if current location matches a nav item path
function isNavActive(location: string, workspaceId: string | undefined, itemPath: string) {
  const full = wsPath(workspaceId, itemPath);
  return location === full;
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;

// AI 開發內地客戶 Modal 狀態
let globalContactModalOpen = false;
let globalSetContactModalOpen: ((open: boolean) => void) | null = null;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
  workspaceId,
}: {
  children: React.ReactNode;
  workspaceId?: string;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Lulubaby" className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Lulubaby
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              登入後即可管理您的AI智能助手，為您的客戶提供專業的自動化服務
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            登入開始使用
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} workspaceId={workspaceId}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  workspaceId?: string;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  workspaceId,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Fetch user's persona for dynamic preview link
  const { data: persona } = trpc.persona.get.useQuery();
  const { data: subdomainData } = trpc.subdomain.get.useQuery();
  const { data: publishedDomain } = trpc.domains.getPublished.useQuery();
  const [isResizing, setIsResizing] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const submitContactForm = trpc.system.submitContactForm.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("提交成功！我們將盡快與您聯繫。");
        setContactModalOpen(false);
        setContactForm({ name: "", phone: "", email: "", message: "" });
      } else {
        toast.error("提交失敗，請稍後再試。");
      }
    },
    onError: () => {
      toast.error("提交失敗，請稍後再試。");
    },
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = allMenuItems.find(item => isNavActive(location, workspaceId, item.path));
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "admin";
  const navCategories = getNavCategories(isAdmin ?? false);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Find which category the current path belongs to
  const getItemCategory = (path: string) => {
    return navCategories.find(cat => cat.items.some(item => item.path === path));
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-auto py-3 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center justify-between min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src="/logo.png" alt="Lulubaby" className="h-6 w-6 shrink-0" />
                    <span className="font-semibold tracking-tight truncate">
                      Lulubaby
                    </span>
                  </div>
                  {/* Spark Balance Badge */}
                  <button
                    onClick={() => setLocation(wsPath(workspaceId, '/pricing'))}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-700/40 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-sm hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20 transition-all duration-300 cursor-pointer shrink-0"
                    title="Spark 餘額 — 點擊查看方案"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors fill-amber-400/30 dark:fill-amber-500/20" />
                    <span className="text-xs font-bold tabular-nums text-amber-700 dark:text-amber-300 group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                      {user?.sparkBalance?.toLocaleString() ?? '0'}
                    </span>
                  </button>
                </div>
              )}
            </div>
            {/* Collapsed state: show spark icon only */}
            {isCollapsed && (
              <div className="flex justify-center mt-1">
                <button
                  onClick={() => setLocation(wsPath(workspaceId, '/pricing'))}
                  className="group relative flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-700/40 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-sm transition-all duration-300 cursor-pointer"
                  title={`Spark 餘額: ${user?.sparkBalance?.toLocaleString() ?? '0'}`}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 fill-amber-400/30" />
                </button>
              </div>
            )}
          </SidebarHeader>

          {/* Preview AI Chat Link */}
          <div className={`px-3 pb-3 shrink-0 ${isCollapsed ? 'px-2' : ''}`}>
            <a
              href={persona 
                ? (publishedDomain?.url && subdomainData?.subdomain
                  ? `${publishedDomain.url}/s/${subdomainData.subdomain}`
                  : subdomainData?.subdomain 
                    ? `https://lulubaby.xyz/s/${subdomainData.subdomain}` 
                    : `${window.location.origin}/chat/${persona.id}`)
                : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">預覽 AI 客戶端</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </>
              )}
            </a>
          </div>

          <SidebarContent className="gap-0 overflow-y-auto">
            {navCategories.map((category, categoryIndex) => (
              <div key={category.id} className={categoryIndex > 0 ? "mt-2" : ""}>
                {/* Category Header - only show when not collapsed */}
                {!isCollapsed && (
                  <div className={`px-4 py-2 flex items-center gap-2`}>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${category.color.split(' ').slice(1).join(' ')}`}>
                      {category.label}
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                )}
                
                <SidebarMenu className="px-2 py-0.5">
                  {category.items.map(item => {
                    const isActive = isNavActive(location, workspaceId, item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(wsPath(workspaceId, item.path))}
                          tooltip={item.label}
                          className={`h-9 transition-all font-normal ${isActive ? `border-l-2 ${category.borderColor} rounded-l-none ml-0.5` : ''}`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? category.color.split(' ').slice(1).join(' ') : ""}`}
                          />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          {/* AI 開發內地客戶按鈕 */}
          <div className={`px-3 py-2 shrink-0 ${isCollapsed ? 'px-2' : ''}`}>
            <Button
              variant="outline"
              className={`w-full justify-start gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950 ${isCollapsed ? 'justify-center px-2' : ''}`}
              onClick={() => setContactModalOpen(true)}
            >
              <MessageCircle className="h-4 w-4 text-violet-500 shrink-0" />
              {!isCollapsed && (
                <span className="text-violet-600 dark:text-violet-400">AI 開發內地客戶</span>
              )}
            </Button>
          </div>

          <SidebarFooter className="p-3 shrink-0">
            <div className="space-y-2">
              {/* User info */}
              <button
                onClick={() => setLocation(wsPath(workspaceId, '/account'))}
                className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none">
                    {user?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {user?.email || "-"}
                  </p>
                </div>
              </button>

              {/* Action buttons */}
              {!isCollapsed && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start gap-2 h-8 text-xs"
                    onClick={() => setLocation(wsPath(workspaceId, '/account'))}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    帳戶設定
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start gap-2 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    登出
                  </Button>
                </div>
              )}
              {isCollapsed && (
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mx-auto"
                    onClick={() => setLocation(wsPath(workspaceId, '/account'))}
                    title="帳戶設定"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mx-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                    title="登出"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "選單"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>

      {/* AI 開發內地客戶 Modal */}
      <Dialog open={contactModalOpen} onOpenChange={(open) => {
        setContactModalOpen(open);
        if (!open) {
          setContactForm({ name: "", phone: "", email: "", message: "" });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-violet-500" />
              AI 開發內地客戶
            </DialogTitle>
            <DialogDescription>
              填寫以下表單，我們的團隊將在 24 小時內與您聯繫
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!contactForm.name || !contactForm.phone || !contactForm.message) {
              toast.error("請填寫必填欄位");
              return;
            }
            submitContactForm.mutate({
              name: contactForm.name,
              phone: contactForm.phone,
              email: contactForm.email || undefined,
              message: contactForm.message,
            });
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">姓名 <span className="text-destructive">*</span></Label>
              <Input
                id="contact-name"
                placeholder="請輸入您的姓名"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">電話 <span className="text-destructive">*</span></Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="請輸入您的聯絡電話"
                value={contactForm.phone}
                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">電郵（選填）</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="請輸入您的電郵地址"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">諮詢內容 <span className="text-destructive">*</span></Label>
              <Textarea
                id="contact-message"
                placeholder="請描述您的需求或問題..."
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={submitContactForm.isPending}
            >
              {submitContactForm.isPending ? "提交中..." : "提交諮詢"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
