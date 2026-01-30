import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X, Plus, Trash2, Image as ImageIcon, Bot, Send, MessageSquare, User, Package, Calendar, Phone, HelpCircle, Search, Link, Building2, FileText, Mail, ExternalLink, ShoppingBag, Star, Info, Palette, Zap, MessageCircle, Settings2, Save } from "lucide-react";
import CompactChatPreview from "@/components/CompactChatPreview";
import ImageCropper from "@/components/ImageCropper";
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

  // AI Settings state (from Settings.tsx)
  const [agentName, setAgentName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [welcomeMessageColor, setWelcomeMessageColor] = useState("#000000");
  const [welcomeMessageSize, setWelcomeMessageSize] = useState("medium");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");

  // Appearance state
  const [layoutStyle, setLayoutStyle] = useState<"minimal" | "professional" | "custom">("minimal");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [showQuickButtons, setShowQuickButtons] = useState(true);
  const [buttonDisplayMode, setButtonDisplayMode] = useState<"full" | "compact" | "icon">("full");
  const [chatPlaceholder, setChatPlaceholder] = useState("輸入您的問題...");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundType, setBackgroundType] = useState<"none" | "color" | "image">("none");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [backgroundSize, setBackgroundSize] = useState("cover");
  const [backgroundPosition, setBackgroundPosition] = useState("center");
  const [backgroundRepeat, setBackgroundRepeat] = useState("no-repeat");
  
  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState("");
  const [cropperType, setCropperType] = useState<"profile" | "background">("profile");

  // Button state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ButtonFormData>(defaultFormData);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (persona) {
      // AI Settings
      setAgentName(persona.agentName || "");
      setAvatarUrl(persona.avatarUrl || "");
      setWelcomeMessage(persona.welcomeMessage || "");
      setWelcomeMessageColor(persona.welcomeMessageColor || "#000000");
      setWelcomeMessageSize(persona.welcomeMessageSize || "medium");
      setSystemPrompt(persona.systemPrompt || "");
      setPrimaryColor(persona.primaryColor || "#3B82F6");
      
      // Appearance settings
      setLayoutStyle((persona.layoutStyle as "minimal" | "professional" | "custom") || "minimal");
      setProfilePhotoUrl(persona.profilePhotoUrl || "");
      setBackgroundImageUrl(persona.backgroundImageUrl || "");
      setTagline(persona.tagline || "");
      setShowQuickButtons(persona.showQuickButtons ?? true);
      setButtonDisplayMode((persona.buttonDisplayMode as "full" | "compact" | "icon") || "full");
      setChatPlaceholder(persona.chatPlaceholder || "輸入您的問題...");
      setBackgroundType((persona.backgroundType as "none" | "color" | "image") || "none");
      setBackgroundColor(persona.backgroundColor || "#FFFFFF");
      setImmersiveMode(persona.immersiveMode ?? false);
      setBackgroundSize((persona as any).backgroundSize || "cover");
      setBackgroundPosition((persona as any).backgroundPosition || "center");
      setBackgroundRepeat((persona as any).backgroundRepeat || "no-repeat");
      
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
      toast.success("設定已保存");
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

  const uploadImageMutation = trpc.images.uploadImage.useMutation();

  const handleImageSelect = (file: File, type: "profile" | "background") => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不能超過 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片文件");
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setCropperType(type);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (
    croppedBlob: Blob,
    displaySettings?: {
      backgroundSize: string;
      backgroundPosition: string;
      backgroundRepeat: string;
    }
  ) => {
    const type = cropperType;
    const setUploading = type === "profile" ? setUploadingProfile : setUploadingBackground;
    const setUrl = type === "profile" ? setProfilePhotoUrl : setBackgroundImageUrl;

    setUploading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("讀取文件失敗"));
        reader.readAsDataURL(croppedBlob);
      });

      const base64Content = await base64Promise;

      // Upload to S3 via tRPC
      const result = await uploadImageMutation.mutateAsync({
        fileName: `${type}_${Date.now()}.jpg`,
        fileContent: base64Content,
        mimeType: "image/jpeg",
        imageType: type,
      });

      // Set the S3 URL
      setUrl(result.url);
      if (type === "background") {
        setBackgroundType("image");
        // Apply display settings if provided
        if (displaySettings) {
          setBackgroundSize(displaySettings.backgroundSize);
          setBackgroundPosition(displaySettings.backgroundPosition);
          setBackgroundRepeat(displaySettings.backgroundRepeat);
        }
      }
      toast.success("圖片上傳成功");
      setUploading(false);
    } catch (error) {
      console.error("Upload error:", error);
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

  const handleSave = () => {
    if (!agentName) {
      toast.error("請先設定AI助手名稱");
      return;
    }

    upsertMutation.mutate({
      agentName,
      avatarUrl: avatarUrl || null,
      welcomeMessage: welcomeMessage || null,
      welcomeMessageColor: welcomeMessageColor || "#000000",
      welcomeMessageSize: welcomeMessageSize || "medium",
      systemPrompt: systemPrompt || null,
      primaryColor,
      layoutStyle,
      backgroundType,
      backgroundColor: backgroundColor || null,
      backgroundImageUrl: backgroundImageUrl || null,
      backgroundSize: backgroundSize || null,
      backgroundPosition: backgroundPosition || null,
      backgroundRepeat: backgroundRepeat || null,
      immersiveMode,
      profilePhotoUrl: profilePhotoUrl || null,
      tagline: tagline || null,
      suggestedQuestions: JSON.stringify(suggestedQuestions),
      showQuickButtons,
      buttonDisplayMode,
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

  const handleToggleButton = (id: number, currentActive: boolean) => {
    toggleButtonMutation.mutate({ id, isActive: !currentActive });
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option?.icon || Search;
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
        <p className="text-muted-foreground mt-1">自訂您的AI助手外觀、行為和對話頁面設定</p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Left: Settings with Tabs */}
        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai" className="gap-2">
              <Settings2 className="h-4 w-4" />
              AI設定
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              外觀風格
            </TabsTrigger>
            <TabsTrigger value="buttons" className="gap-2">
              <Zap className="h-4 w-4" />
              快捷按鈕
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              對話設定
            </TabsTrigger>
          </TabsList>

          {/* ===== AI設定 Tab (NEW) ===== */}
          <TabsContent value="ai" className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">基本資訊</CardTitle>
                <CardDescription>設定AI助手的名稱和頭像</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">AI助手名稱 *</Label>
                  <Input
                    id="agentName"
                    placeholder="例如：小明的保險顧問"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">主題顏色</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">對話設定</CardTitle>
                <CardDescription>設定AI助手的歡迎語和行為指引</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">歡迎語</Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="您好！我是您的專屬AI助手，請問有什麼可以幫您？"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">客戶進入對話頁面時看到的第一條訊息</p>
                  
                  {/* Welcome Message Styling */}
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessageColor">文字顏色</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="welcomeMessageColor"
                          value={welcomeMessageColor}
                          onChange={(e) => setWelcomeMessageColor(e.target.value)}
                          className="h-9 w-16 rounded border border-input cursor-pointer"
                        />
                        <input
                          type="text"
                          value={welcomeMessageColor}
                          onChange={(e) => setWelcomeMessageColor(e.target.value)}
                          className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessageSize">文字大小</Label>
                      <select
                        id="welcomeMessageSize"
                        value={welcomeMessageSize}
                        onChange={(e) => setWelcomeMessageSize(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="xsmall">超小 (12px)</option>
                        <option value="small">小 (14px)</option>
                        <option value="medium">中 (16px)</option>
                        <option value="large">大 (18px)</option>
                        <option value="xlarge">特大 (20px)</option>
                        <option value="xxlarge">超大 (24px)</option>
                        <option value="xxxlarge">巨大 (28px)</option>
                        <option value="huge">極大 (32px)</option>
                        <option value="massive">超級大 (36px)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">AI行為指引（System Prompt）</Label>
                  <Textarea
                    id="systemPrompt"
                    placeholder="例如：你是一位專業的保險顧問，專門為客戶提供保險產品諮詢服務。請用友善、專業的語氣回答問題，並在適當時候引導客戶預約諮詢。"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    告訴AI它的角色、專業領域和回答風格。這段文字不會顯示給客戶看。
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存AI設定
              </Button>
            </div>
          </TabsContent>

          {/* ===== 外觀風格 Tab ===== */}
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
                        <button 
                          onClick={async () => {
                            try {
                              setUploadingProfile(true);
                              // Use backend proxy to get image as base64
                              const result = await utils.client.images.getImageAsBase64.query({ imageUrl: profilePhotoUrl });
                              setCropperImage(result.dataUrl);
                              setCropperType("profile");
                              setCropperOpen(true);
                              setUploadingProfile(false);
                            } catch (error) {
                              console.error("Failed to load image:", error);
                              toast.error("無法載入圖片，請重新上傳");
                              setUploadingProfile(false);
                            }
                          }}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          title="編輯個人照片"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button onClick={() => setProfilePhotoUrl("")} className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        建議 400x400 像素，JPG/PNG 格式，最大 5MB
                      </p>
                    </div>
                  </div>
                  <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageSelect(file, "profile"); }} />
                  <div className="space-y-2">
                    <Label htmlFor="tagline">個人標語</Label>
                    <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="例如：專業保險顧問，為您的未來保駕護航" maxLength={100} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Background Settings - for custom style */}
            {layoutStyle === "custom" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">背景設定</CardTitle>
                  <CardDescription>選擇使用圖片或顏色作為背景</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Background Type Selection */}
                  <div className="space-y-2">
                    <Label>背景類型</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setBackgroundType("none");
                          setBackgroundImageUrl("");
                        }}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          backgroundType === "none"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-sm font-medium">無背景</div>
                        <div className="text-xs text-muted-foreground mt-0.5">白色背景</div>
                      </button>
                      <button
                        onClick={() => setBackgroundType("color")}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          backgroundType === "color"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-sm font-medium">純色背景</div>
                        <div className="text-xs text-muted-foreground mt-0.5">選擇顏色</div>
                      </button>
                      <button
                        onClick={() => setBackgroundType("image")}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          backgroundType === "image"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-sm font-medium">圖片背景</div>
                        <div className="text-xs text-muted-foreground mt-0.5">上傳圖片</div>
                      </button>
                    </div>
                  </div>

                  {/* Color Picker - shown when backgroundType is "color" */}
                  {backgroundType === "color" && (
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">背景顏色</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id="backgroundColor"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-32"
                          placeholder="#FFFFFF"
                        />
                        <div 
                          className="h-10 flex-1 rounded border"
                          style={{ backgroundColor: backgroundColor }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">選擇一個顏色作為對話頁面的背景</p>
                    </div>
                  )}

                  {/* Image Upload - shown when backgroundType is "image" */}
                  {backgroundType === "image" && (
                    <div className="space-y-2">
                      <Label>背景圖片</Label>
                      {backgroundImageUrl ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <img src={backgroundImageUrl} alt="Background" className="w-full h-32 object-cover" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button 
                              onClick={async () => {
                                try {
                                  setUploadingBackground(true);
                                  // Use backend proxy to get image as base64
                                  const result = await utils.client.images.getImageAsBase64.query({ imageUrl: backgroundImageUrl });
                                  setCropperImage(result.dataUrl);
                                  setCropperType("background");
                                  setCropperOpen(true);
                                  setUploadingBackground(false);
                                } catch (error) {
                                  console.error("Failed to load image:", error);
                                  toast.error("無法載入圖片，請重新上傳");
                                  setUploadingBackground(false);
                                }
                              }}
                              className="h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                              title="編輯背景圖片"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => {
                                setBackgroundImageUrl("");
                                setBackgroundType("none");
                              }} 
                              className="h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                              title="刪除背景圖片"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => backgroundInputRef.current?.click()} 
                          className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {uploadingBackground ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">點擊上傳背景圖片</p>
                              <p className="text-xs text-muted-foreground mt-1">建議 1920x1080 像素，最大 5MB</p>
                            </>
                          )}
                        </div>
                      )}
                      <input 
                        ref={backgroundInputRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => { 
                          const file = e.target.files?.[0]; 
                          if (file) handleImageSelect(file, "background"); 
                        }} 
                      />
                    </div>
                  )}

                  {/* Immersive Mode Checkbox - shown when background is set */}
                  {(backgroundType === "color" || backgroundType === "image") && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
                      <Checkbox 
                        id="immersiveMode" 
                        checked={immersiveMode}
                        onCheckedChange={(checked) => setImmersiveMode(checked as boolean)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="immersiveMode" className="cursor-pointer font-medium">
                          沉浸式風格
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          啟用後，背景將延伸到整個對話區域，包括輸入框和按鈕，創造更具沉浸感的視覺體驗
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存外觀設定
              </Button>
            </div>
          </TabsContent>

          {/* ===== 快捷按鈕 Tab ===== */}
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

            {/* Show Quick Buttons Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">按鈕顯示設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>在對話頁面顯示快捷按鈕</Label>
                    <p className="text-xs text-muted-foreground">關閉後，客戶將不會看到快捷功能按鈕</p>
                  </div>
                  <Switch checked={showQuickButtons} onCheckedChange={setShowQuickButtons} />
                </div>

                {/* Button Display Mode */}
                {showQuickButtons && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label>按鈕顯示模式</Label>
                    <p className="text-xs text-muted-foreground mb-2">選擇快捷按鈕的顯示方式</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setButtonDisplayMode("full")}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          buttonDisplayMode === "full" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                            <MessageSquare className="h-3 w-3" />
                          </div>
                          <span className="text-[10px]">按鈕</span>
                        </div>
                        <p className="text-xs font-medium">完整模式</p>
                        <p className="text-[10px] text-muted-foreground">圖標+文字</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setButtonDisplayMode("compact")}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          buttonDisplayMode === "compact" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-0.5 mb-1">
                          <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                            <MessageSquare className="h-2 w-2" />
                          </div>
                          <span className="text-[8px]">按</span>
                        </div>
                        <p className="text-xs font-medium">緊湊模式</p>
                        <p className="text-[10px] text-muted-foreground">小圖標+短文字</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setButtonDisplayMode("icon")}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          buttonDisplayMode === "icon" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                            <MessageSquare className="h-2.5 w-2.5" />
                          </div>
                          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                            <Calendar className="h-2.5 w-2.5" />
                          </div>
                        </div>
                        <p className="text-xs font-medium">圖標模式</p>
                        <p className="text-[10px] text-muted-foreground">僅圖標+懸停提示</p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={upsertMutation.isPending} size="sm">
                    {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    保存設定
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== 對話設定 Tab ===== */}
          <TabsContent value="chat" className="space-y-6">
            {/* Chat Input Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">輸入框設定</CardTitle>
                <CardDescription>自訂對話輸入框的顯示方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="placeholder">輸入框提示文字</Label>
                  <Input id="placeholder" value={chatPlaceholder} onChange={(e) => setChatPlaceholder(e.target.value)} placeholder="輸入您的問題..." maxLength={100} />
                  <p className="text-xs text-muted-foreground">這段文字會顯示在輸入框內，引導客戶輸入問題</p>
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
                {suggestedQuestions.length > 0 ? (
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((question, index) => (
                      <div key={index} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-sm truncate">{question}</span>
                        <button onClick={() => handleRemoveQuestion(index)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">尚未添加引導問題</p>
                    <p className="text-xs mt-1">添加引導問題可以幫助客戶快速開始對話</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存對話設定
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Right: Compact Preview Panel */}
        <div className="sticky top-20 self-start h-[calc(100vh-6rem)] overflow-hidden">
          <CompactChatPreview
            agentName={agentName}
            avatarUrl={avatarUrl}
            welcomeMessage={welcomeMessage}
            welcomeMessageColor={welcomeMessageColor}
            welcomeMessageSize={welcomeMessageSize}
            primaryColor={primaryColor}
            suggestedQuestions={suggestedQuestions}
            quickButtons={(buttons || []).filter(b => b.isActive).map(b => ({
              label: b.label,
              icon: b.icon || "search",
              actionType: b.actionType,
            }))}
            buttonDisplayMode={buttonDisplayMode}
            chatPlaceholder={chatPlaceholder}
            layoutStyle={layoutStyle}
            profilePhotoUrl={profilePhotoUrl}
            backgroundImageUrl={backgroundImageUrl}
            backgroundType={backgroundType}
            backgroundColor={backgroundColor}
            immersiveMode={immersiveMode}
          />
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

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperImage}
        onCropComplete={handleCropComplete}
        aspectRatio={cropperType === "profile" ? 1 : 16 / 9}
        cropShape={cropperType === "profile" ? "round" : "rect"}
        title={cropperType === "profile" ? "裁切個人照片" : "裁切背景圖片"}
        showDisplaySettings={cropperType === "background"}
        initialDisplaySettings={{
          backgroundSize,
          backgroundPosition,
          backgroundRepeat,
        }}
      />
    </div>
  );
}
