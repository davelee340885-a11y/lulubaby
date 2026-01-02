import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { LayoutDashboard, LogOut, PanelLeft, FileText, Bot, Palette, Globe, Brain, Zap, User, CreditCard, ExternalLink, MessageCircle, Users, UserCircle, Monitor, Settings, Sparkles, Code, Puzzle } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Navigation categories with colors
const navCategories = [
  {
    id: "dashboard",
    label: "儀表板",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    items: [
      { icon: LayoutDashboard, label: "儀表板", path: "/" },
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
      { icon: Users, label: "團隊管理", path: "/team" },
      { icon: User, label: "帳戶設定", path: "/account" },
      { icon: CreditCard, label: "會員計劃", path: "/pricing" },
    ],
  },
];

// Flatten menu items for finding active item
const allMenuItems = navCategories.flatMap(cat => cat.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
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
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              AI客服管理平台
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
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = allMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

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
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold tracking-tight truncate">
                    AI客服平台
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          {/* Preview AI Chat Link */}
          <div className={`px-3 pb-3 ${isCollapsed ? 'px-2' : ''}`}>
            <a
              href="/chat/1"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">預覽AI對話</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </>
              )}
            </a>
          </div>

          <SidebarContent className="gap-0">
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
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
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

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    </>
  );
}
