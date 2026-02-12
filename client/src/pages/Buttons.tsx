import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, GripVertical, Search, Calendar, Link, MessageSquare, User, Building2, Package, FileText, Phone, Mail, ExternalLink, ShoppingBag, Star, Info, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const iconOptions = [
  { value: "search", label: "搜尋", icon: Search },
  { value: "calendar", label: "日曆/預約", icon: Calendar },
  { value: "link", label: "連結", icon: Link },
  { value: "message", label: "訊息", icon: MessageSquare },
  { value: "user", label: "個人資料", icon: User },
  { value: "building", label: "公司", icon: Building2 },
  { value: "package", label: "產品", icon: Package },
  { value: "file", label: "文件", icon: FileText },
  { value: "phone", label: "電話", icon: Phone },
  { value: "mail", label: "郵件", icon: Mail },
  { value: "external", label: "外部連結", icon: ExternalLink },
  { value: "shopping", label: "購物", icon: ShoppingBag },
  { value: "star", label: "精選", icon: Star },
  { value: "info", label: "資訊", icon: Info },
  { value: "help", label: "幫助", icon: HelpCircle },
];

const actionTypeOptions = [
  { value: "query", label: "發送預設問題", description: "點擊後自動發送預設問題給AI" },
  { value: "link", label: "打開連結", description: "點擊後打開指定網址" },
  { value: "booking", label: "即時預約", description: "打開預約系統或日曆連結" },
  { value: "product", label: "產品展示", description: "展示產品資料或打開產品頁面" },
  { value: "profile", label: "個人介紹", description: "展示銷售員詳細介紹" },
  { value: "company", label: "公司介紹", description: "展示公司資料和介紹" },
  { value: "catalog", label: "產品目錄", description: "打開產品資料庫或目錄" },
  { value: "contact", label: "聯絡方式", description: "顯示聯絡資訊或撥打電話" },
  { value: "faq", label: "常見問題", description: "展示常見問題列表" },
  { value: "custom", label: "自訂動作", description: "自定義動作類型" },
];

const actionTypeLabels: Record<string, string> = {
  query: "發送預設問題",
  link: "打開連結",
  booking: "即時預約",
  product: "產品展示",
  profile: "個人介紹",
  company: "公司介紹",
  catalog: "產品目錄",
  contact: "聯絡方式",
  faq: "常見問題",
  custom: "自訂動作",
};

type ButtonFormData = {
  label: string;
  icon: string;
  actionType: string;
  actionValue: string;
  description: string;
  isActive: boolean;
};

const defaultFormData: ButtonFormData = {
  label: "",
  icon: "search",
  actionType: "query",
  actionValue: "",
  description: "",
  isActive: true,
};

// 預設按鈕模板
const buttonTemplates = [
  { label: "即時預約", icon: "calendar", actionType: "booking", description: "預約會面時間" },
  { label: "產品介紹", icon: "package", actionType: "product", description: "查看熱門產品" },
  { label: "關於我", icon: "user", actionType: "profile", description: "了解更多關於我" },
  { label: "公司介紹", icon: "building", actionType: "company", description: "了解我們公司" },
  { label: "產品目錄", icon: "shopping", actionType: "catalog", description: "瀏覽所有產品" },
  { label: "聯絡我", icon: "phone", actionType: "contact", description: "獲取聯絡方式" },
];

export default function Buttons() {
  const { data: buttons, isLoading } = trpc.quickButtons.list.useQuery();
  const utils = trpc.useUtils();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ButtonFormData>(defaultFormData);
  const [showTemplates, setShowTemplates] = useState(false);

  const createMutation = trpc.quickButtons.create.useMutation({
    onSuccess: () => {
      toast.success("按鈕已創建");
      utils.quickButtons.list.invalidate();
      setDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("創建失敗: " + error.message);
    },
  });

  const updateMutation = trpc.quickButtons.update.useMutation({
    onSuccess: () => {
      toast.success("按鈕已更新");
      utils.quickButtons.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("更新失敗: " + error.message);
    },
  });

  const deleteMutation = trpc.quickButtons.delete.useMutation({
    onSuccess: () => {
      toast.success("按鈕已刪除");
      utils.quickButtons.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const toggleMutation = trpc.quickButtons.update.useMutation({
    onSuccess: () => {
      utils.quickButtons.list.invalidate();
    },
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setShowTemplates(true);
    setDialogOpen(true);
  };

  const handleSelectTemplate = (template: typeof buttonTemplates[0]) => {
    setFormData({
      ...defaultFormData,
      label: template.label,
      icon: template.icon,
      actionType: template.actionType,
      description: template.description,
    });
    setShowTemplates(false);
  };

  const handleOpenEdit = (button: NonNullable<typeof buttons>[0]) => {
    setEditingId(button.id);
    setFormData({
      label: button.label,
      icon: button.icon || "search",
      actionType: button.actionType,
      actionValue: button.actionValue || "",
      description: "",
      isActive: button.isActive,
    });
    setShowTemplates(false);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ 
        id: editingId, 
        label: formData.label,
        icon: formData.icon,
        actionType: formData.actionType as "query" | "link" | "booking" | "product" | "profile" | "company" | "catalog" | "contact" | "faq" | "custom",
        actionValue: formData.actionValue,
        isActive: formData.isActive,
      });
    } else {
      createMutation.mutate({
        label: formData.label,
        icon: formData.icon,
        actionType: formData.actionType as "query" | "link" | "booking" | "product" | "profile" | "company" | "catalog" | "contact" | "faq" | "custom",
        actionValue: formData.actionValue,
        isActive: formData.isActive,
      });
    }
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !isActive });
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find((o) => o.value === iconName);
    return option ? option.icon : Search;
  };

  const getActionPlaceholder = (actionType: string) => {
    switch (actionType) {
      case "query": return "例如：請介紹你們的熱門產品";
      case "link": return "https://example.com";
      case "booking": return "預約系統連結或日曆URL";
      case "product": return "產品頁面連結或產品ID";
      case "profile": return "個人介紹頁面連結";
      case "company": return "公司介紹頁面連結";
      case "catalog": return "產品目錄連結";
      case "contact": return "電話號碼或聯絡頁面連結";
      case "faq": return "常見問題頁面連結";
      default: return "輸入動作參數";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">快捷按鈕配置</h1>
          <p className="text-muted-foreground mt-1">設定對話頁面顯示的快捷功能按鈕，幫助客戶快速達成目標</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增按鈕
        </Button>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">快速添加常用按鈕</CardTitle>
          <CardDescription>點擊下方模板快速創建常用功能按鈕</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {buttonTemplates.map((template, index) => {
              const IconComponent = getIconComponent(template.icon);
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      ...defaultFormData,
                      label: template.label,
                      icon: template.icon,
                      actionType: template.actionType,
                      description: template.description,
                    });
                    setShowTemplates(false);
                    setDialogOpen(true);
                  }}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  {template.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>按鈕列表</CardTitle>
          <CardDescription>這些按鈕會顯示在客戶的對話頁面上，方便快速操作</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : buttons?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>尚未創建任何快捷按鈕</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                創建第一個按鈕
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {buttons?.map((button) => {
                const IconComponent = getIconComponent(button.icon || "search");
                return (
                  <div
                    key={button.id}
                    className={`flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors ${
                      !button.isActive ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{button.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {actionTypeLabels[button.actionType] || button.actionType}
                          {button.actionValue && ` · ${button.actionValue.substring(0, 30)}${button.actionValue.length > 30 ? '...' : ''}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={button.isActive}
                        onCheckedChange={() => handleToggle(button.id, button.isActive)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(button)}>
                        編輯
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(button.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯按鈕" : "新增按鈕"}</DialogTitle>
            <DialogDescription>
              設定按鈕的顯示文字和點擊後的動作
            </DialogDescription>
          </DialogHeader>

          {showTemplates && !editingId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">選擇一個模板快速開始，或自訂按鈕</p>
              <div className="grid grid-cols-2 gap-2">
                {buttonTemplates.map((template, index) => {
                  const IconComponent = getIconComponent(template.icon);
                  return (
                    <button
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{template.label}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowTemplates(false)}>
                自訂按鈕
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">按鈕文字</Label>
                  <Input
                    id="label"
                    placeholder="例如：熱門產品"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">圖標</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionType">動作類型</Label>
                <Select
                  value={formData.actionType}
                  onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">- {option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionValue">
                  {formData.actionType === "query" ? "預設問題內容" : "連結或參數"}
                </Label>
                {formData.actionType === "query" ? (
                  <Textarea
                    id="actionValue"
                    placeholder={getActionPlaceholder(formData.actionType)}
                    value={formData.actionValue}
                    onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                    rows={2}
                  />
                ) : (
                  <Input
                    id="actionValue"
                    placeholder={getActionPlaceholder(formData.actionType)}
                    value={formData.actionValue}
                    onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.actionType === "query" && "客戶點擊後會自動發送此問題給AI"}
                  {formData.actionType === "link" && "客戶點擊後會在新視窗打開此連結"}
                  {formData.actionType === "booking" && "連結到您的預約系統或日曆"}
                  {formData.actionType === "product" && "連結到產品詳情頁面"}
                  {formData.actionType === "profile" && "連結到您的個人介紹頁面"}
                  {formData.actionType === "company" && "連結到公司介紹頁面"}
                  {formData.actionType === "catalog" && "連結到產品目錄或資料庫"}
                  {formData.actionType === "contact" && "可以是電話號碼（tel:）或聯絡頁面連結"}
                  {formData.actionType === "faq" && "連結到常見問題頁面"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">啟用按鈕</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "保存" : "創建"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個按鈕嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後，此按鈕將不再顯示在對話頁面上。此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
