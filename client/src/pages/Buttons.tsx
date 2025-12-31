import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, GripVertical, Search, Calendar, Link, MessageSquare } from "lucide-react";
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
  { value: "calendar", label: "日曆", icon: Calendar },
  { value: "link", label: "連結", icon: Link },
  { value: "message", label: "訊息", icon: MessageSquare },
];

const actionTypeLabels: Record<string, string> = {
  query: "發送預設問題",
  link: "打開連結",
  booking: "預約功能",
  custom: "自訂動作",
};

type ButtonFormData = {
  label: string;
  icon: string;
  actionType: "query" | "link" | "booking" | "custom";
  actionValue: string;
  isActive: boolean;
};

const defaultFormData: ButtonFormData = {
  label: "",
  icon: "search",
  actionType: "query",
  actionValue: "",
  isActive: true,
};

export default function Buttons() {
  const { data: buttons, isLoading } = trpc.quickButtons.list.useQuery();
  const utils = trpc.useUtils();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ButtonFormData>(defaultFormData);

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
    setDialogOpen(true);
  };

  const handleOpenEdit = (button: NonNullable<typeof buttons>[0]) => {
    setEditingId(button.id);
    setFormData({
      label: button.label,
      icon: button.icon || "search",
      actionType: button.actionType as ButtonFormData["actionType"],
      actionValue: button.actionValue || "",
      isActive: button.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !isActive });
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find((o) => o.value === iconName);
    return option ? option.icon : Search;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">快捷按鈕配置</h1>
          <p className="text-muted-foreground mt-1">設定對話頁面顯示的快捷功能按鈕</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增按鈕
        </Button>
      </div>

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
                          {actionTypeLabels[button.actionType]}
                          {button.actionValue && ` · ${button.actionValue.substring(0, 30)}...`}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯按鈕" : "新增按鈕"}</DialogTitle>
            <DialogDescription>
              設定按鈕的顯示文字和點擊後的動作
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="actionType">動作類型</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value: ButtonFormData["actionType"]) =>
                  setFormData({ ...formData, actionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="query">發送預設問題</SelectItem>
                  <SelectItem value="link">打開連結</SelectItem>
                  <SelectItem value="booking">預約功能</SelectItem>
                  <SelectItem value="custom">自訂動作</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionValue">
                {formData.actionType === "query"
                  ? "預設問題內容"
                  : formData.actionType === "link"
                  ? "連結網址"
                  : "動作參數"}
              </Label>
              <Input
                id="actionValue"
                placeholder={
                  formData.actionType === "query"
                    ? "例如：請介紹你們的熱門產品"
                    : formData.actionType === "link"
                    ? "https://example.com"
                    : "輸入參數"
                }
                value={formData.actionValue}
                onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
              />
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
