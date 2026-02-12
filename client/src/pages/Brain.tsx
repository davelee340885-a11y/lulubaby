import { useState } from "react";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Brain, Plus, Search, Trash2, Edit, Lightbulb, TrendingUp, Users, Shield, Trophy, BarChart3, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

// 記憶類型配置
const memoryTypeConfig = {
  sales_experience: { label: "銷售經驗", icon: "💼", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  customer_insight: { label: "客戶洞察", icon: "👥", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  product_knowledge: { label: "產品知識", icon: "📦", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  objection_handling: { label: "異議處理", icon: "🛡️", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  success_case: { label: "成功案例", icon: "🏆", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  market_trend: { label: "市場趨勢", icon: "📈", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
  personal_note: { label: "個人筆記", icon: "📝", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
};

// 重要性配置
const importanceConfig = {
  low: { label: "低", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  medium: { label: "中", color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" },
  high: { label: "高", color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400" },
  critical: { label: "關鍵", color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400" },
};

type MemoryType = keyof typeof memoryTypeConfig;
type ImportanceLevel = keyof typeof importanceConfig;

export default function BrainPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MemoryType | "all">("all");
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    memoryType: "sales_experience" as MemoryType,
    importance: "medium" as ImportanceLevel,
    tags: "",
    relatedCustomer: "",
    relatedProduct: "",
    actionItems: "",
  });

  // API 查詢
  const utils = trpc.useUtils();
  const { data: diaries, isLoading, refetch } = trpc.learningDiary.list.useQuery({ limit: 100 });
  const { data: stats } = trpc.learningDiary.stats.useQuery();
  const { data: searchResults } = trpc.learningDiary.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 0 }
  );

  // API 變更
  const createMutation = trpc.learningDiary.create.useMutation({
    onSuccess: () => {
      toast.success("學習日記已創建");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
      utils.learningDiary.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`創建失敗: ${error.message}`);
    },
  });

  const updateMutation = trpc.learningDiary.update.useMutation({
    onSuccess: () => {
      toast.success("學習日記已更新");
      setEditingEntry(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const deleteMutation = trpc.learningDiary.delete.useMutation({
    onSuccess: () => {
      toast.success("學習日記已刪除");
      refetch();
      utils.learningDiary.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      memoryType: "sales_experience",
      importance: "medium",
      tags: "",
      relatedCustomer: "",
      relatedProduct: "",
      actionItems: "",
    });
  };

  const handleSubmit = () => {
    const data = {
      title: formData.title,
      content: formData.content,
      memoryType: formData.memoryType,
      importance: formData.importance,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : undefined,
      relatedCustomer: formData.relatedCustomer || undefined,
      relatedProduct: formData.relatedProduct || undefined,
      actionItems: formData.actionItems ? formData.actionItems.split("\n").map(t => t.trim()).filter(t => t) : undefined,
    };

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      memoryType: entry.memoryType,
      importance: entry.importance,
      tags: entry.tags?.join(", ") || "",
      relatedCustomer: entry.relatedCustomer || "",
      relatedProduct: entry.relatedProduct || "",
      actionItems: entry.actionItems?.join("\n") || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  // 過濾日記
  const filteredDiaries = diaries?.filter(diary => {
    if (selectedType !== "all" && diary.memoryType !== selectedType) return false;
    if (searchQuery && !diary.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !diary.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  // 統計卡片數據
  const statsCards = [
    { 
      title: "總記憶數", 
      value: stats?.totalEntries || 0, 
      icon: Brain, 
      color: "text-violet-600",
      bgColor: "bg-violet-100 dark:bg-violet-900/30"
    },
    { 
      title: "本週新增", 
      value: stats?.recentActivity || 0, 
      icon: TrendingUp, 
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    { 
      title: "銷售經驗", 
      value: stats?.byType?.sales_experience || 0, 
      icon: Lightbulb, 
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    { 
      title: "成功案例", 
      value: stats?.byType?.success_case || 0, 
      icon: Trophy, 
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30"
    },
  ];

  return (
      <div className="flex flex-col gap-6 p-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">🧠 我的大腦</h1>
              <p className="text-sm text-muted-foreground">記錄銷售經驗、客戶洞察和成功案例，讓 AI 學習你的專業知識</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingEntry(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新增記憶
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "編輯記憶" : "新增學習記憶"}</DialogTitle>
                <DialogDescription>
                  記錄你的銷售經驗和專業知識，AI 會在對話中自動應用這些記憶
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">標題 *</Label>
                  <Input
                    id="title"
                    placeholder="例如：如何處理客戶對價格的異議"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>記憶類型</Label>
                    <Select
                      value={formData.memoryType}
                      onValueChange={(value) => setFormData({ ...formData, memoryType: value as MemoryType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(memoryTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.icon} {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>重要性</Label>
                    <Select
                      value={formData.importance}
                      onValueChange={(value) => setFormData({ ...formData, importance: value as ImportanceLevel })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(importanceConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">內容 *</Label>
                  <Textarea
                    id="content"
                    placeholder="詳細描述你的經驗、技巧或洞察..."
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">標籤（用逗號分隔）</Label>
                  <Input
                    id="tags"
                    placeholder="例如：價格談判, 異議處理, 保險"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="relatedCustomer">相關客戶</Label>
                    <Input
                      id="relatedCustomer"
                      placeholder="例如：年輕家庭客戶"
                      value={formData.relatedCustomer}
                      onChange={(e) => setFormData({ ...formData, relatedCustomer: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="relatedProduct">相關產品</Label>
                    <Input
                      id="relatedProduct"
                      placeholder="例如：人壽保險"
                      value={formData.relatedProduct}
                      onChange={(e) => setFormData({ ...formData, relatedProduct: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actionItems">行動要點（每行一個）</Label>
                  <Textarea
                    id="actionItems"
                    placeholder="例如：&#10;先了解客戶預算&#10;強調產品價值而非價格&#10;提供分期付款選項"
                    rows={3}
                    value={formData.actionItems}
                    onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingEntry(null);
                  resetForm();
                }}>
                  取消
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.content || createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? "保存中..." : editingEntry ? "更新" : "創建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 搜索和過濾 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索記憶..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as MemoryType | "all")}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="所有類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有類型</SelectItem>
              {Object.entries(memoryTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.icon} {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 記憶列表 */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">列表視圖</TabsTrigger>
            <TabsTrigger value="grid">卡片視圖</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">載入中...</div>
                ) : filteredDiaries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">還沒有記憶</p>
                    <p className="text-sm text-muted-foreground mt-1">點擊「新增記憶」開始記錄你的專業知識</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredDiaries.map((diary) => {
                      const typeConfig = memoryTypeConfig[diary.memoryType as MemoryType];
                      const impConfig = importanceConfig[diary.importance as ImportanceLevel];
                      return (
                        <div key={diary.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{typeConfig?.icon}</span>
                                <h3 className="font-medium truncate">{diary.title}</h3>
                                <Badge variant="secondary" className={typeConfig?.color}>
                                  {typeConfig?.label}
                                </Badge>
                                <Badge variant="outline" className={impConfig?.color}>
                                  {impConfig?.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {diary.content}
                              </p>
                              {diary.tags && diary.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {diary.tags.map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(diary)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>確定要刪除這條記憶嗎？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      此操作無法撤銷。刪除後，AI 將無法再使用這條記憶。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => diary.id && handleDelete(diary.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      刪除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grid" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiaries.map((diary) => {
                const typeConfig = memoryTypeConfig[diary.memoryType as MemoryType];
                const impConfig = importanceConfig[diary.importance as ImportanceLevel];
                return (
                  <Card key={diary.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{typeConfig?.icon}</span>
                          <Badge variant="secondary" className={typeConfig?.color}>
                            {typeConfig?.label}
                          </Badge>
                        </div>
                        <Badge variant="outline" className={impConfig?.color}>
                          {impConfig?.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{diary.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {diary.content}
                      </p>
                      {diary.tags && diary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {diary.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {diary.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{diary.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(diary)}>
                          <Edit className="h-4 w-4 mr-1" />
                          編輯
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              刪除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確定要刪除這條記憶嗎？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作無法撤銷。刪除後，AI 將無法再使用這條記憶。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => diary.id && handleDelete(diary.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* 使用提示 */}
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h4 className="font-medium text-violet-900 dark:text-violet-100">如何使用「我的大腦」？</h4>
                <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                  記錄你的銷售經驗、客戶洞察和成功案例。當客戶與 AI 對話時，系統會自動搜索相關記憶，
                  讓 AI 能夠運用你的專業知識來回應客戶，就像你親自在場一樣。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
