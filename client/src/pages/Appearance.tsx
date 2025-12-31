import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, Plus, Trash2, Image as ImageIcon, Bot, Send, MessageSquare, User, Package, Calendar, Phone, HelpCircle, Search, Link, Building2, FileText, Mail, ExternalLink, ShoppingBag, Star, Info, GripVertical, Palette, Zap } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
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

const layoutStyles = [
  { id: "minimal", name: "簡約風格", description: "類似ChatGPT的簡潔對話界面", preview: "💬" },
  { id: "professional", name: "專業名片", description: "展示個人照片和專業標語", preview: "👔" },
  { id: "custom", name: "自訂背景", description: "上傳背景圖片打造獨特風格", preview: "🎨" },
];

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

const buttonTemplates = [
  { label: "即時預約", icon: "calendar", actionType: "booking", description: "預約會面時間" },
  { label: "產品介紹", icon: "package", actionType: "product", description: "查看熱門產品" },
  { label: "關於我", icon: "user", actionType: "profile", description: "了解更多關於我" },
  { label: "公司介紹", icon: "building", actionType: "company", description: "了解我們公司" },
  { label: "產品目錄", icon: "shopping", actionType: "catalog", description: "瀏覽所有產品" },
  { label: "聯絡我", icon: "phone", actionType: "contact", description: "獲取聯絡方式" },
];

type ButtonFormData = {
  label: string;
  icon: string;
  actionType: string;
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

export default function Appearance() {
  const { data: persona, isLoading: personaLoading } = trpc.persona.get.useQuery();
  const { data: buttons, isLoading: buttonsLoading } = trpc.quickButtons.list.useQuery();
  const utils = trpc.useUtils();

  // Appearance state
  const [layoutStyle, setLayoutStyle] = useState<"minimal" | "professional" | "custom">("minimal");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [showQuickButtons, setShowQuickButtons] = useState(true);
  const [chatPlaceholder, setChatPlaceholder] = useState("輸入您的問題...");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  // Button state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ButtonFormData>(defaultFormData);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (persona) {
      setLayoutStyle((persona.layoutStyle as "minimal" | "professional" | "custom") || "minimal");
      setProfilePhotoUrl(persona.profilePhotoUrl || "");
      setBackgroundImageUrl(persona.backgroundImageUrl || "");
      setTagline(persona.tagline || "");
      setShowQuickButtons(persona.showQuickButtons ?? true);
      setChatPlaceholder(persona.chatPlaceholder || "輸入您的問題...");
      
      if (persona.suggestedQuestions) {
        try {
          const parsed = JSON.parse(persona.suggestedQuestions);
          setSuggestedQuestions(Array.isArray(parsed) ? parsed : []);
        } catch {
          setSuggestedQuestions([]);
        }
      }
    }
  }, [persona]);

  const upsertMutation = trpc.persona.upsert.useMutation({
    onSuccess: () => {
      toast.success("版面設定已保存");
      utils.persona.get.invalidate();
    },
    onError: (error) => {
      toast.error("保存失敗: " + error.message);
    },
  });

  // Button mutations
  const createButtonMutation = trpc.quickButtons.create.useMutation({
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

  const updateButtonMutation = trpc.quickButtons.update.useMutation({
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

  const deleteButtonMutation = trpc.quickButtons.delete.useMutation({
    onSuccess: () => {
      toast.success("按鈕已刪除");
      utils.quickButtons.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const toggleButtonMutation = trpc.quickButtons.update.useMutation({
    onSuccess: () => {
      utils.quickButtons.list.invalidate();
    },
  });

  const handleImageUpload = async (file: File, type: "profile" | "background") => {
    const setUploading = type === "profile" ? setUploadingProfile : setUploadingBackground;
    const setUrl = type === "profile" ? setProfilePhotoUrl : setBackgroundImageUrl;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUrl(dataUrl);
        toast.success("圖片上傳成功");
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("圖片上傳失敗");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("圖片上傳失敗");
      setUploading(false);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim() && suggestedQuestions.length < 6) {
      setSuggestedQuestions([...suggestedQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setSuggestedQuestions(suggestedQuestions.filter((_, i) => i !== index));
  };

  const handleSaveAppearance = () => {
    if (!persona?.agentName) {
      toast.error("請先在AI設定中設定助手名稱");
      return;
    }

    upsertMutation.mutate({
      agentName: persona.agentName,
      avatarUrl: persona.avatarUrl,
      welcomeMessage: persona.welcomeMessage,
      systemPrompt: persona.systemPrompt,
      primaryColor: persona.primaryColor || "#3B82F6",
      layoutStyle,
      backgroundImageUrl: backgroundImageUrl || null,
      profilePhotoUrl: profilePhotoUrl || null,
      tagline: tagline || null,
      suggestedQuestions: JSON.stringify(suggestedQuestions),
      showQuickButtons,
      chatPlaceholder: chatPlaceholder || null,
    });
  };

  const handleOpenCreateButton = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEditButton = (button: NonNullable<typeof buttons>[0]) => {
    setEditingId(button.id);
    setFormData({
      label: button.label,
      icon: button.icon || "search",
      actionType: button.actionType,
      actionValue: button.actionValue || "",
      isActive: button.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmitButton = (e: React.FormEvent) => {
    e.preventDefault();
    const actionType = formData.actionType as "query" | "link" | "booking" | "product" | "profile" | "company" | "catalog" | "contact" | "faq" | "custom";
    
    if (editingId) {
      updateButtonMutation.mutate({ 
        id: editingId, 
        label: formData.label,
        icon: formData.icon,
        actionType,
        actionValue: formData.actionValue,
        isActive: formData.isActive,
      });
    } else {
      createButtonMutation.mutate({
        label: formData.label,
        icon: formData.icon,
        actionType,
        actionValue: formData.actionValue,
        isActive: formData.isActive,
      });
    }
  };

  const handleToggleButton = (id: number, isActive: boolean) => {
    toggleButtonMutation.mutate({ id, isActive: !isActive });
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

  const isLoading = personaLoading || buttonsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">版面設定</h1>
        <p className="text-muted-foreground mt-1">自訂您的AI對話頁面外觀、風格和功能按鈕</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        {/* Left: Settings with Tabs */}
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              外觀風格
            </TabsTrigger>
            <TabsTrigger value="buttons" className="gap-2">
              <Zap className="h-4 w-4" />
              快捷按鈕
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Layout Style Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">佈局風格</CardTitle>
                <CardDescription>選擇對話頁面的整體風格</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-3">
                  {layoutStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setLayoutStyle(style.id as "minimal" | "professional" | "custom")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        layoutStyle === style.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-xl mb-1">{style.preview}</div>
                      <div className="font-medium text-sm">{style.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{style.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Photo - for professional style */}
            {(layoutStyle === "professional" || layoutStyle === "custom") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">個人照片</CardTitle>
                  <CardDescription>上傳您的專業照片，建立信任感</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {profilePhotoUrl ? (
                      <div className="relative">
                        <img src={profilePhotoUrl} alt="Profile" className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md" />
                        <button onClick={() => setProfilePhotoUrl("")} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => profileInputRef.current?.click()} className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        {uploadingProfile ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}>
                        {uploadingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        上傳照片
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">建議 400x400 像素</p>
                    </div>
                  </div>
                  <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "profile"); }} />
                  <div className="space-y-2">
                    <Label htmlFor="tagline">個人標語</Label>
                    <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="例如：專業保險顧問，為您的未來保駕護航" maxLength={100} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Background Image - for custom style */}
            {layoutStyle === "custom" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">背景圖片</CardTitle>
                  <CardDescription>上傳自訂背景，打造獨特品牌風格</CardDescription>
                </CardHeader>
                <CardContent>
                  {backgroundImageUrl ? (
                    <div className="relative rounded-lg overflow-hidden">
                      <img src={backgroundImageUrl} alt="Background" className="w-full h-20 object-cover" />
                      <button onClick={() => setBackgroundImageUrl("")} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => backgroundInputRef.current?.click()} className="h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      {uploadingBackground ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <><ImageIcon className="h-5 w-5 text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">點擊上傳</p></>}
                    </div>
                  )}
                  <input ref={backgroundInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "background"); }} />
                </CardContent>
              </Card>
            )}

            {/* Chat Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">對話設定</CardTitle>
                <CardDescription>自訂對話框的顯示方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="placeholder">輸入框提示文字</Label>
                  <Input id="placeholder" value={chatPlaceholder} onChange={(e) => setChatPlaceholder(e.target.value)} placeholder="輸入您的問題..." maxLength={100} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>顯示快捷按鈕</Label>
                    <p className="text-xs text-muted-foreground">在對話頁面顯示您配置的快捷功能按鈕</p>
                  </div>
                  <Switch checked={showQuickButtons} onCheckedChange={setShowQuickButtons} />
                </div>
              </CardContent>
            </Card>

            {/* Suggested Questions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">引導問題</CardTitle>
                <CardDescription>設定常見問題，幫助客戶快速開始對話（最多6個）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="例如：你們有什麼保險產品？" maxLength={100} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddQuestion(); } }} />
                  <Button onClick={handleAddQuestion} disabled={!newQuestion.trim() || suggestedQuestions.length >= 6} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {suggestedQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((question, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-sm truncate">{question}</span>
                        <button onClick={() => handleRemoveQuestion(index)} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {suggestedQuestions.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">尚未添加引導問題</p>}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveAppearance} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存外觀設定
              </Button>
            </div>
          </TabsContent>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-6">
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
                          setFormData({ ...defaultFormData, label: template.label, icon: template.icon, actionType: template.actionType });
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

            {/* Button List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">按鈕列表</CardTitle>
                    <CardDescription>這些按鈕會顯示在客戶的對話頁面上</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleOpenCreateButton}>
                    <Plus className="h-4 w-4 mr-1" />
                    新增
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {buttons?.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">尚未創建任何快捷按鈕</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenCreateButton}>
                      <Plus className="h-4 w-4 mr-1" />
                      創建第一個按鈕
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {buttons?.map((button) => {
                      const IconComponent = getIconComponent(button.icon || "search");
                      return (
                        <div key={button.id} className={`flex items-center gap-3 p-3 rounded-lg border ${button.isActive ? "bg-background" : "bg-muted/30 opacity-60"}`}>
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{button.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{actionTypeOptions.find(a => a.value === button.actionType)?.label || button.actionType}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={button.isActive} onCheckedChange={() => handleToggleButton(button.id, button.isActive)} />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditButton(button)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(button.id)}>
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
          </TabsContent>
        </Tabs>

        {/* Right: Compact Preview Panel */}
        <div className="lg:sticky lg:top-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">即時預覽</h3>
            <span className="text-xs text-muted-foreground">手機版</span>
          </div>
          
          <div className="relative mx-auto" style={{ width: "220px" }}>
            <div className="rounded-[20px] border-4 border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
              <div className="h-4 bg-gray-800 flex items-center justify-center">
                <div className="w-12 h-2.5 bg-black rounded-full" />
              </div>
              
              <div 
                className="bg-background overflow-hidden"
                style={{ 
                  height: "340px",
                  backgroundImage: layoutStyle === "custom" && backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {layoutStyle === "custom" && backgroundImageUrl && <div className="absolute inset-0 bg-black/40" />}
                
                <div className={`h-full flex flex-col ${layoutStyle === "custom" ? "relative z-10" : ""}`}>
                  {/* Header */}
                  <div className={`p-2 border-b ${layoutStyle === "custom" ? "bg-black/20 border-white/10" : "bg-background/95"}`}>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}>
                        {persona?.avatarUrl ? <img src={persona.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Bot className="h-3 w-3" style={{ color: persona?.primaryColor || "#3B82F6" }} />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${layoutStyle === "custom" ? "text-white" : ""}`}>{persona?.agentName || "AI 助手"}</p>
                        <p className={`text-[8px] ${layoutStyle === "custom" ? "text-white/70" : "text-muted-foreground"}`}>在線</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Section for Professional */}
                  {layoutStyle === "professional" && (
                    <div className="p-2 text-center border-b">
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="" className="h-10 w-10 rounded-full object-cover mx-auto border-2 border-background shadow-sm" />
                      ) : (
                        <div className="h-10 w-10 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}>
                          <User className="h-4 w-4" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                        </div>
                      )}
                      {tagline && <p className="text-[8px] text-muted-foreground mt-1 px-2 line-clamp-2">{tagline}</p>}
                    </div>
                  )}

                  {/* Chat Area */}
                  <div className="flex-1 p-2 overflow-hidden">
                    <div className="flex gap-1.5 mb-2">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}>
                        <Bot className="h-2 w-2" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                      </div>
                      <div className={`rounded-lg px-2 py-1 max-w-[85%] ${layoutStyle === "custom" ? "bg-white/90 text-gray-900" : "bg-muted"}`}>
                        <p className="text-[8px] leading-relaxed">{persona?.welcomeMessage || "您好！有什麼可以幫您？"}</p>
                      </div>
                    </div>

                    {suggestedQuestions.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {suggestedQuestions.slice(0, 2).map((q, i) => (
                          <div key={i} className={`text-[7px] px-1.5 py-0.5 rounded-full border truncate ${layoutStyle === "custom" ? "bg-white/80 border-white/50 text-gray-700" : "bg-background border-border"}`}>{q}</div>
                        ))}
                        {suggestedQuestions.length > 2 && <p className={`text-[7px] text-center ${layoutStyle === "custom" ? "text-white/60" : "text-muted-foreground"}`}>+{suggestedQuestions.length - 2} 更多</p>}
                      </div>
                    )}

                    {showQuickButtons && buttons && buttons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {buttons.filter(b => b.isActive).slice(0, 3).map((button) => {
                          const IconComponent = getIconComponent(button.icon || "search");
                          return (
                            <div key={button.id} className={`text-[7px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${layoutStyle === "custom" ? "bg-white/80 text-gray-700" : "bg-primary/10 text-primary"}`}>
                              <IconComponent className="h-2 w-2" />
                              {button.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className={`p-1.5 border-t ${layoutStyle === "custom" ? "bg-black/20 border-white/10" : ""}`}>
                    <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${layoutStyle === "custom" ? "bg-white/90" : "bg-muted"}`}>
                      <span className="text-[8px] text-muted-foreground flex-1 truncate">{chatPlaceholder}</span>
                      <div className="h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: persona?.primaryColor || "#3B82F6" }}>
                        <Send className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-3 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-0.5 bg-gray-600 rounded-full" />
              </div>
            </div>
          </div>
          
          <p className="text-[9px] text-muted-foreground text-center">預覽會隨設定即時更新</p>
        </div>
      </div>

      {/* Button Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯按鈕" : "新增按鈕"}</DialogTitle>
            <DialogDescription>設定按鈕的顯示名稱、圖示和點擊動作</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitButton} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">按鈕名稱</Label>
              <Input id="label" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="例如：即時預約" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>圖示</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>動作類型</Label>
                <Select value={formData.actionType} onValueChange={(value) => setFormData({ ...formData, actionType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {actionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionValue">動作參數</Label>
              <Input id="actionValue" value={formData.actionValue} onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })} placeholder={getActionPlaceholder(formData.actionType)} />
              <p className="text-xs text-muted-foreground">{actionTypeOptions.find(a => a.value === formData.actionType)?.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">啟用按鈕</Label>
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit" disabled={createButtonMutation.isPending || updateButtonMutation.isPending}>
                {(createButtonMutation.isPending || updateButtonMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>此操作無法撤銷，確定要刪除這個按鈕嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteButtonMutation.mutate({ id: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteButtonMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
