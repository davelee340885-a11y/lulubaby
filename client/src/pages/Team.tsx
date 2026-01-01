import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { 
  Users, Building2, BookOpen, Shield, Settings, 
  Plus, Trash2, Mail, Crown, UserCog, User,
  FileText, Briefcase, History, HelpCircle, MessageSquare,
  BookMarked, Scale, GraduationCap, MoreHorizontal,
  Upload, Share2, Lock, Unlock, BarChart3, Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Knowledge categories
const KNOWLEDGE_CATEGORIES = [
  { id: "company_info", label: "公司資料", icon: Building2, description: "公司名稱、簡介、聯絡方式" },
  { id: "products", label: "產品目錄", icon: Briefcase, description: "產品資料、規格、價格" },
  { id: "services", label: "服務項目", icon: FileText, description: "服務內容、流程、收費" },
  { id: "history", label: "公司歷史", icon: History, description: "公司發展歷程、里程碑" },
  { id: "faq", label: "常見問題", icon: HelpCircle, description: "客戶常見問題和標準回答" },
  { id: "sales_scripts", label: "銷售話術", icon: MessageSquare, description: "銷售技巧、話術範本" },
  { id: "case_studies", label: "案例研究", icon: BookMarked, description: "成功案例、客戶見證" },
  { id: "policies", label: "政策規定", icon: Scale, description: "公司政策、合規要求" },
  { id: "training", label: "培訓資料", icon: GraduationCap, description: "員工培訓、技能提升" },
  { id: "other", label: "其他", icon: MoreHorizontal, description: "其他知識內容" },
];

// Mock team data
const MOCK_TEAM = {
  id: 1,
  name: "保險精英團隊",
  description: "專注於人壽保險和財務規劃的專業團隊",
  logoUrl: null as string | null,
  plan: "team_pro" as "team_basic" | "team_pro" | "enterprise",
  maxMembers: 15,
  memberCount: 8,
};

type MemberRole = "owner" | "admin" | "member";
type KnowledgeAccess = "full" | "partial" | "none";

const MOCK_MEMBERS: Array<{
  id: number;
  name: string;
  email: string;
  role: MemberRole;
  knowledgeAccess: KnowledgeAccess;
  joinedAt: string;
}> = [
  { id: 1, name: "陳大文", email: "chen@example.com", role: "owner", knowledgeAccess: "full", joinedAt: "2024-01-15" },
  { id: 2, name: "李小明", email: "lee@example.com", role: "admin", knowledgeAccess: "full", joinedAt: "2024-02-01" },
  { id: 3, name: "王美玲", email: "wang@example.com", role: "member", knowledgeAccess: "full", joinedAt: "2024-02-15" },
  { id: 4, name: "張志強", email: "zhang@example.com", role: "member", knowledgeAccess: "partial", joinedAt: "2024-03-01" },
  { id: 5, name: "林雅婷", email: "lin@example.com", role: "member", knowledgeAccess: "full", joinedAt: "2024-03-15" },
];

const MOCK_KNOWLEDGE = [
  { id: 1, category: "company_info", title: "公司簡介", content: "我們是一家專業的保險顧問公司...", isShared: true, createdAt: "2024-01-20" },
  { id: 2, category: "products", title: "人壽保險產品列表", content: "1. 終身人壽保險\n2. 定期人壽保險...", isShared: true, createdAt: "2024-01-25" },
  { id: 3, category: "faq", title: "常見問題 - 理賠流程", content: "Q: 如何申請理賠？\nA: 首先需要...", isShared: true, createdAt: "2024-02-01" },
  { id: 4, category: "sales_scripts", title: "開場白話術", content: "您好，我是XXX，很高興認識您...", isShared: false, createdAt: "2024-02-10" },
  { id: 5, category: "case_studies", title: "成功案例 - 家庭保障規劃", content: "客戶背景：35歲男性，已婚...", isShared: true, createdAt: "2024-02-15" },
];

export default function Team() {
  const [activeTab, setActiveTab] = useState("info");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isAddKnowledgeDialogOpen, setIsAddKnowledgeDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  
  // New knowledge form state
  const [newKnowledge, setNewKnowledge] = useState({
    category: "other",
    title: "",
    content: "",
    isShared: true,
  });

  // Check if user has a team (mock for now)
  const hasTeam = true; // In real implementation, check from API

  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast.error("請輸入電郵地址");
      return;
    }
    toast.success(`已發送邀請至 ${inviteEmail}`);
    setInviteEmail("");
    setIsInviteDialogOpen(false);
  };

  const handleAddKnowledge = () => {
    if (!newKnowledge.title || !newKnowledge.content) {
      toast.error("請填寫標題和內容");
      return;
    }
    toast.success("知識項目已添加");
    setNewKnowledge({ category: "other", title: "", content: "", isShared: true });
    setIsAddKnowledgeDialogOpen(false);
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    toast.success(`已移除成員：${memberName}`);
  };

  const handleToggleKnowledgeShare = (knowledgeId: number, currentState: boolean) => {
    toast.success(currentState ? "已取消分享" : "已開始分享");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown className="h-4 w-4 text-amber-500" />;
      case "admin": return <UserCog className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return "擁有者";
      case "admin": return "管理員";
      default: return "成員";
    }
  };

  const getAccessLabel = (access: string) => {
    switch (access) {
      case "full": return "完整訪問";
      case "partial": return "部分訪問";
      default: return "無訪問";
    }
  };

  // If user doesn't have a team, show create team UI
  if (!hasTeam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle>建立您的團隊</CardTitle>
            <CardDescription>
              建立團隊後，您可以邀請成員加入並共享團隊知識庫
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => toast.info("請先訂閱團隊計劃")}>
              <Plus className="h-4 w-4 mr-2" />
              建立團隊
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              建立團隊需要訂閱團隊計劃，請前往會員計劃頁面了解詳情
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">團隊管理</h1>
          <p className="text-muted-foreground">管理您的團隊、成員和共享知識庫</p>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
          {MOCK_TEAM.plan === "team_basic" ? "團隊基礎版" : 
           MOCK_TEAM.plan === "team_pro" ? "團隊專業版" : "企業版"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="info" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">團隊資料</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">成員管理</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">團隊大腦</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">使用統計</span>
          </TabsTrigger>
        </TabsList>

        {/* Team Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>團隊資料</CardTitle>
              <CardDescription>管理團隊的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={MOCK_TEAM.logoUrl || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-2xl">
                    {MOCK_TEAM.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    上傳Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">建議尺寸：200x200px</p>
                </div>
              </div>

              <Separator />

              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">團隊名稱</Label>
                <Input id="teamName" defaultValue={MOCK_TEAM.name} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="teamDescription">團隊簡介</Label>
                <Textarea 
                  id="teamDescription" 
                  defaultValue={MOCK_TEAM.description || ""} 
                  placeholder="描述您的團隊..."
                  rows={3}
                />
              </div>

              {/* Plan Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">當前計劃</span>
                  <Badge className="bg-emerald-500">團隊專業版</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">成員數量</span>
                  <span className="text-sm">{MOCK_TEAM.memberCount} / {MOCK_TEAM.maxMembers}</span>
                </div>
              </div>

              <Button onClick={() => toast.success("團隊資料已更新")}>
                儲存變更
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>團隊成員</CardTitle>
                <CardDescription>
                  {MOCK_TEAM.memberCount} / {MOCK_TEAM.maxMembers} 位成員
                </CardDescription>
              </div>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="h-4 w-4 mr-2" />
                    邀請成員
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>邀請新成員</DialogTitle>
                    <DialogDescription>
                      輸入成員的電郵地址，系統將發送邀請連結
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">電郵地址</Label>
                      <Input 
                        id="inviteEmail" 
                        type="email"
                        placeholder="member@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inviteRole">角色</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理員</SelectItem>
                          <SelectItem value="member">成員</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleInviteMember} className="bg-emerald-500 hover:bg-emerald-600">
                      發送邀請
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_MEMBERS.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-gray-100">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {getRoleIcon(member.role)}
                          <Badge variant="outline" className="text-xs">
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              member.knowledgeAccess === "full" && "text-green-600 border-green-200 bg-green-50",
                              member.knowledgeAccess === "partial" && "text-amber-600 border-amber-200 bg-amber-50",
                              member.knowledgeAccess === "none" && "text-red-600 border-red-200 bg-red-50"
                            )}
                          >
                            {getAccessLabel(member.knowledgeAccess)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          加入於 {member.joinedAt}
                        </div>
                      </div>
                      {member.role !== "owner" && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                角色權限說明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">擁有者</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 完全控制團隊設定</li>
                    <li>• 管理所有成員</li>
                    <li>• 管理付款和計劃</li>
                    <li>• 刪除團隊</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">管理員</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 邀請和移除成員</li>
                    <li>• 編輯團隊知識庫</li>
                    <li>• 設定知識分享權限</li>
                    <li>• 查看使用統計</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">成員</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 使用團隊知識庫</li>
                    <li>• 管理個人AI智能體</li>
                    <li>• 查看個人統計</li>
                    <li>• 購買個人計劃</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          {/* Knowledge Categories Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {KNOWLEDGE_CATEGORIES.slice(0, 5).map((cat) => {
              const Icon = cat.icon;
              const count = MOCK_KNOWLEDGE.filter(k => k.category === cat.id).length;
              return (
                <Card key={cat.id} className="cursor-pointer hover:border-emerald-300 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{count} 項</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Knowledge List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  團隊大腦
                </CardTitle>
                <CardDescription>
                  管理團隊共享的知識內容，成員的AI智能體可以引用這些知識
                </CardDescription>
              </div>
              <Dialog open={isAddKnowledgeDialogOpen} onOpenChange={setIsAddKnowledgeDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="h-4 w-4 mr-2" />
                    添加知識
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>添加知識項目</DialogTitle>
                    <DialogDescription>
                      添加新的知識內容到團隊大腦
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>分類</Label>
                      <Select 
                        value={newKnowledge.category} 
                        onValueChange={(v) => setNewKnowledge({...newKnowledge, category: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KNOWLEDGE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="knowledgeTitle">標題</Label>
                      <Input 
                        id="knowledgeTitle"
                        placeholder="例如：產品價格表"
                        value={newKnowledge.title}
                        onChange={(e) => setNewKnowledge({...newKnowledge, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="knowledgeContent">內容</Label>
                      <Textarea 
                        id="knowledgeContent"
                        placeholder="輸入知識內容..."
                        rows={8}
                        value={newKnowledge.content}
                        onChange={(e) => setNewKnowledge({...newKnowledge, content: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>分享給成員</Label>
                        <p className="text-xs text-muted-foreground">
                          開啟後，團隊成員的AI智能體可以引用此知識
                        </p>
                      </div>
                      <Switch 
                        checked={newKnowledge.isShared}
                        onCheckedChange={(v) => setNewKnowledge({...newKnowledge, isShared: v})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddKnowledgeDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleAddKnowledge} className="bg-emerald-500 hover:bg-emerald-600">
                      添加
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_KNOWLEDGE.map((item) => {
                  const category = KNOWLEDGE_CATEGORIES.find(c => c.id === item.category);
                  const Icon = category?.icon || FileText;
                  return (
                    <div 
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <Icon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {category?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            創建於 {item.createdAt}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleKnowledgeShare(item.id, item.isShared)}
                          title={item.isShared ? "取消分享" : "開始分享"}
                        >
                          {item.isShared ? (
                            <Unlock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">1,234</div>
                <div className="text-sm text-muted-foreground">本月對話總數</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">活躍成員</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">知識項目</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">89%</div>
                <div className="text-sm text-muted-foreground">知識引用率</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>成員使用統計</CardTitle>
              <CardDescription>查看每位成員的AI使用情況</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-gray-100">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{Math.floor(Math.random() * 200) + 50} 次對話</div>
                      <div className="text-sm text-muted-foreground">本月</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
