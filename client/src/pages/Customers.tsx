import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  MessageSquare,
  Brain,
  Trash2,
  Edit,
  Plus,
  Eye,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Clock
} from "lucide-react";
import { toast } from "sonner";

type Customer = {
  id: number;
  personaId: number;
  sessionId: string;
  fingerprint: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  preferredLanguage: string | null;
  tags: string | null;
  notes: string | null;
  totalConversations: number;
  totalMessages: number;
  lastVisitAt: Date | null;
  firstVisitAt: Date;
  sentiment: "positive" | "neutral" | "negative" | null;
  status: "active" | "inactive" | "blocked";
  createdAt: Date;
  updatedAt: Date;
};

type CustomerMemory = {
  id: number;
  customerId: number;
  memoryType: string;
  key: string;
  value: string;
  confidence: number;
  sourceConversationId: number | null;
  extractedAt: Date;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ConversationSummary = {
  id: number;
  customerId: number;
  sessionId: string;
  summary: string;
  keyTopics: string | null;
  questionsAsked: string | null;
  messageCount: number;
  duration: number | null;
  outcome: string | null;
  conversationDate: Date;
  createdAt: Date;
};

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});
  const [newMemory, setNewMemory] = useState({
    memoryType: "fact" as const,
    key: "",
    value: "",
    confidence: 80,
  });

  // Queries
  const { data: customers, isLoading, refetch } = trpc.customer.list.useQuery();
  const { data: stats } = trpc.customer.stats.useQuery();
  const { data: customerDetail, refetch: refetchDetail } = trpc.customer.getWithContext.useQuery(
    { customerId: selectedCustomer?.id ?? 0 },
    { enabled: !!selectedCustomer }
  );

  // Mutations
  const updateCustomerMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      toast.success("客戶資料已更新");
      refetch();
      refetchDetail();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteCustomerMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success("客戶已刪除");
      setSelectedCustomer(null);
      setIsDetailOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const addMemoryMutation = trpc.memory.add.useMutation({
    onSuccess: () => {
      toast.success("記憶已添加");
      setIsAddMemoryOpen(false);
      setNewMemory({ memoryType: "fact", key: "", value: "", confidence: 80 });
      refetchDetail();
    },
    onError: (error) => {
      toast.error(error.message || "添加失敗");
    },
  });

  const deleteMemoryMutation = trpc.memory.delete.useMutation({
    onSuccess: () => {
      toast.success("記憶已刪除");
      refetchDetail();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  // Filter customers by search query
  const filteredCustomers = customers?.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.company?.toLowerCase().includes(query) ||
      customer.phone?.includes(query)
    );
  });

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditingCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!selectedCustomer) return;
    updateCustomerMutation.mutate({
      customerId: selectedCustomer.id,
      name: editingCustomer.name || undefined,
      email: editingCustomer.email || undefined,
      phone: editingCustomer.phone || undefined,
      company: editingCustomer.company || undefined,
      title: editingCustomer.title || undefined,
      tags: editingCustomer.tags || undefined,
      notes: editingCustomer.notes || undefined,
      sentiment: editingCustomer.sentiment || undefined,
      status: editingCustomer.status || undefined,
    });
  };

  const handleAddMemory = () => {
    if (!selectedCustomer || !newMemory.key || !newMemory.value) return;
    addMemoryMutation.mutate({
      customerId: selectedCustomer.id,
      ...newMemory,
    });
  };

  const getSentimentBadge = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return <Badge className="bg-green-500">正面</Badge>;
      case "negative":
        return <Badge className="bg-red-500">負面</Badge>;
      default:
        return <Badge variant="secondary">中性</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">活躍</Badge>;
      case "inactive":
        return <Badge variant="secondary">不活躍</Badge>;
      case "blocked":
        return <Badge className="bg-red-500">已封鎖</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMemoryTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; color: string }> = {
      preference: { label: "偏好", color: "bg-blue-500" },
      fact: { label: "事實", color: "bg-gray-500" },
      need: { label: "需求", color: "bg-yellow-500" },
      concern: { label: "顧慮", color: "bg-orange-500" },
      interaction: { label: "互動", color: "bg-purple-500" },
      purchase: { label: "購買", color: "bg-green-500" },
      feedback: { label: "反饋", color: "bg-pink-500" },
      custom: { label: "其他", color: "bg-gray-400" },
    };
    const config = typeConfig[type] || typeConfig.custom;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">客戶記憶</h1>
        <p className="text-muted-foreground">
          管理您的客戶資料和AI記憶，讓智能體提供更個人化的服務
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers ?? 0}</div>
            <p className="text-xs text-muted-foreground">所有接觸過的客戶</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">回訪客戶</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.returningCustomers ?? 0}</div>
            <p className="text-xs text-muted-foreground">多次訪問的客戶</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新客戶</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newCustomersToday ?? 0}</div>
            <p className="text-xs text-muted-foreground">今天首次訪問</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活躍客戶</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCustomers ?? 0}</div>
            <p className="text-xs text-muted-foreground">狀態為活躍</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>客戶列表</CardTitle>
              <CardDescription>查看和管理所有客戶的資料和記憶</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索客戶姓名、電郵、公司..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : filteredCustomers?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "沒有找到符合條件的客戶" : "尚未有任何客戶記錄"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                當客戶與您的AI智能體對話時，系統會自動記錄客戶資料
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers?.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewCustomer(customer)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {customer.name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {customer.name || "未知客戶"}
                        </span>
                        {getStatusBadge(customer.status)}
                        {getSentimentBadge(customer.sentiment)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                        {customer.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {customer.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <div className="font-medium text-foreground">{customer.totalConversations}</div>
                      <div>對話</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{customer.totalMessages}</div>
                      <div>訊息</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{formatDate(customer.lastVisitAt)}</div>
                      <div>最後訪問</div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {selectedCustomer?.name?.charAt(0) || "?"}
                </span>
              </div>
              {selectedCustomer?.name || "未知客戶"}
              {selectedCustomer && getStatusBadge(selectedCustomer.status)}
            </DialogTitle>
            <DialogDescription>
              首次訪問：{formatDate(selectedCustomer?.firstVisitAt)} | 
              最後訪問：{formatDate(selectedCustomer?.lastVisitAt)} | 
              總對話：{selectedCustomer?.totalConversations} 次
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">
                <Edit className="h-4 w-4 mr-2" />
                基本資料
              </TabsTrigger>
              <TabsTrigger value="memories">
                <Brain className="h-4 w-4 mr-2" />
                客戶記憶
              </TabsTrigger>
              <TabsTrigger value="history">
                <MessageSquare className="h-4 w-4 mr-2" />
                對話歷史
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={editingCustomer.name || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="客戶姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">電郵</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingCustomer.email || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    placeholder="電郵地址"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">電話</Label>
                  <Input
                    id="phone"
                    value={editingCustomer.phone || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="電話號碼"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">公司</Label>
                  <Input
                    id="company"
                    value={editingCustomer.company || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                    placeholder="公司名稱"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">職位</Label>
                  <Input
                    id="title"
                    value={editingCustomer.title || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, title: e.target.value })}
                    placeholder="職位"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentiment">客戶情緒</Label>
                  <Select
                    value={editingCustomer.sentiment || "neutral"}
                    onValueChange={(value) => setEditingCustomer({ ...editingCustomer, sentiment: value as "positive" | "neutral" | "negative" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">正面</SelectItem>
                      <SelectItem value="neutral">中性</SelectItem>
                      <SelectItem value="negative">負面</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">狀態</Label>
                  <Select
                    value={editingCustomer.status || "active"}
                    onValueChange={(value) => setEditingCustomer({ ...editingCustomer, status: value as "active" | "inactive" | "blocked" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">活躍</SelectItem>
                      <SelectItem value="inactive">不活躍</SelectItem>
                      <SelectItem value="blocked">已封鎖</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">標籤</Label>
                  <Input
                    id="tags"
                    value={editingCustomer.tags || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, tags: e.target.value })}
                    placeholder="用逗號分隔標籤"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  value={editingCustomer.notes || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="關於這位客戶的備註..."
                  rows={3}
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedCustomer && confirm("確定要刪除這位客戶嗎？此操作無法復原。")) {
                      deleteCustomerMutation.mutate({ customerId: selectedCustomer.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除客戶
                </Button>
                <Button onClick={handleSaveCustomer} disabled={updateCustomerMutation.isPending}>
                  {updateCustomerMutation.isPending ? "儲存中..." : "儲存變更"}
                </Button>
              </div>
            </TabsContent>

            {/* Memories Tab */}
            <TabsContent value="memories" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  AI會根據這些記憶提供更個人化的服務
                </p>
                <Dialog open={isAddMemoryOpen} onOpenChange={setIsAddMemoryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      添加記憶
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加客戶記憶</DialogTitle>
                      <DialogDescription>
                        手動添加關於這位客戶的重要資訊
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>記憶類型</Label>
                        <Select
                          value={newMemory.memoryType}
                          onValueChange={(value) => setNewMemory({ ...newMemory, memoryType: value as typeof newMemory.memoryType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preference">偏好</SelectItem>
                            <SelectItem value="fact">事實</SelectItem>
                            <SelectItem value="need">需求</SelectItem>
                            <SelectItem value="concern">顧慮</SelectItem>
                            <SelectItem value="interaction">互動</SelectItem>
                            <SelectItem value="purchase">購買</SelectItem>
                            <SelectItem value="feedback">反饋</SelectItem>
                            <SelectItem value="custom">其他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>標題</Label>
                        <Input
                          value={newMemory.key}
                          onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
                          placeholder="例如：預算、偏好產品、家庭成員"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>內容</Label>
                        <Textarea
                          value={newMemory.value}
                          onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })}
                          placeholder="具體內容..."
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleAddMemory} disabled={addMemoryMutation.isPending} className="w-full">
                        {addMemoryMutation.isPending ? "添加中..." : "添加記憶"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {customerDetail?.memories?.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">尚未有任何客戶記憶</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    記憶會在對話過程中自動提取，或您可以手動添加
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customerDetail?.memories?.map((memory: CustomerMemory) => (
                    <div
                      key={memory.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getMemoryTypeBadge(memory.memoryType)}
                          <span className="font-medium">{memory.key}</span>
                          <span className="text-xs text-muted-foreground">
                            確信度: {memory.confidence}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{memory.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          提取於 {formatDate(memory.extractedAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedCustomer && confirm("確定要刪除這條記憶嗎？")) {
                            deleteMemoryMutation.mutate({
                              memoryId: memory.id,
                              customerId: selectedCustomer.id,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {customerDetail?.conversationSummaries?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">尚未有對話摘要</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    對話摘要會在對話結束後自動生成
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerDetail?.conversationSummaries?.map((summary: ConversationSummary) => (
                    <Card key={summary.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatDate(summary.conversationDate)}
                            </span>
                            <Badge variant="outline">{summary.messageCount} 條訊息</Badge>
                          </div>
                          {summary.outcome && (
                            <Badge variant={summary.outcome === "resolved" ? "default" : "secondary"}>
                              {summary.outcome === "resolved" ? "已解決" :
                               summary.outcome === "converted" ? "已轉化" :
                               summary.outcome === "pending" ? "待跟進" :
                               summary.outcome === "escalated" ? "已升級" : "已離開"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-2">{summary.summary}</p>
                        {summary.keyTopics && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {JSON.parse(summary.keyTopics).map((topic: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
