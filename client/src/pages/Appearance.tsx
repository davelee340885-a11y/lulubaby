import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, MessageSquare, User, Sparkles, Image as ImageIcon, Trash2, Send } from "lucide-react";

type LayoutStyle = "minimal" | "professional" | "custom";

const layoutOptions = [
  {
    value: "minimal" as LayoutStyle,
    label: "簡約風格",
    description: "類似 ChatGPT 的簡潔對話介面，專注於對話體驗",
    icon: MessageSquare,
  },
  {
    value: "professional" as LayoutStyle,
    label: "專業名片",
    description: "展示個人照片和標語，建立專業形象",
    icon: User,
  },
  {
    value: "custom" as LayoutStyle,
    label: "自訂背景",
    description: "上傳自訂背景圖片，打造獨特品牌風格",
    icon: Sparkles,
  },
];

// ==================== Preview Component ====================
function PreviewPanel({
  layoutStyle,
  agentName,
  avatarUrl,
  profilePhotoUrl,
  backgroundImageUrl,
  tagline,
  welcomeMessage,
  chatPlaceholder,
  suggestedQuestions,
  showQuickButtons,
  primaryColor,
}: {
  layoutStyle: LayoutStyle;
  agentName: string;
  avatarUrl: string;
  profilePhotoUrl: string;
  backgroundImageUrl: string;
  tagline: string;
  welcomeMessage: string;
  chatPlaceholder: string;
  suggestedQuestions: string[];
  showQuickButtons: boolean;
  primaryColor: string;
}) {
  const themeColor = primaryColor || "#3b82f6";

  // Minimal Layout Preview
  if (layoutStyle === "minimal") {
    return (
      <div className="bg-background rounded-lg border shadow-sm overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="p-3 border-b flex items-center gap-2">
          <div 
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: themeColor }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              agentName.charAt(0)
            )}
          </div>
          <span className="font-medium text-sm">{agentName || "AI 助手"}</span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-3 space-y-3 overflow-auto bg-muted/30">
          {/* Welcome Message */}
          <div className="flex gap-2">
            <div 
              className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px]"
              style={{ backgroundColor: themeColor }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                agentName.charAt(0)
              )}
            </div>
            <div className="bg-background rounded-lg p-2 text-xs max-w-[80%] shadow-sm">
              {welcomeMessage || "您好！有什麼可以幫助您的嗎？"}
            </div>
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedQuestions.slice(0, 3).map((q, i) => (
                <span 
                  key={i} 
                  className="text-[10px] px-2 py-1 rounded-full border cursor-pointer hover:bg-muted truncate max-w-[120px]"
                  style={{ borderColor: themeColor, color: themeColor }}
                >
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-2 border-t">
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground">
              {chatPlaceholder || "輸入您的問題..."}
            </div>
            <div 
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Send className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Professional Layout Preview
  if (layoutStyle === "professional") {
    return (
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg border shadow-sm overflow-hidden h-full flex flex-col">
        {/* Profile Header */}
        <div className="p-4 text-center border-b bg-white">
          <div className="relative inline-block">
            {profilePhotoUrl ? (
              <img 
                src={profilePhotoUrl} 
                alt="" 
                className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md mx-auto"
              />
            ) : (
              <div 
                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-medium mx-auto shadow-md"
                style={{ backgroundColor: themeColor }}
              >
                {agentName.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="font-semibold text-sm mt-2">{agentName || "AI 助手"}</h3>
          {tagline && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{tagline}</p>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-3 space-y-2 overflow-auto">
          <div className="bg-muted/50 rounded-lg p-2 text-xs">
            {welcomeMessage || "您好！有什麼可以幫助您的嗎？"}
          </div>
          
          {suggestedQuestions.length > 0 && (
            <div className="space-y-1 mt-2">
              {suggestedQuestions.slice(0, 2).map((q, i) => (
                <div 
                  key={i} 
                  className="text-[10px] p-1.5 rounded border cursor-pointer hover:bg-muted truncate"
                  style={{ borderColor: `${themeColor}40` }}
                >
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-2 border-t">
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground">
              {chatPlaceholder}
            </div>
            <div 
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Send className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Custom Background Layout Preview
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden h-full flex flex-col relative">
      {/* Background */}
      {backgroundImageUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}40)` }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-3 text-center">
          {profilePhotoUrl ? (
            <img 
              src={profilePhotoUrl} 
              alt="" 
              className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-lg mx-auto"
            />
          ) : (
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-medium mx-auto shadow-lg"
              style={{ backgroundColor: themeColor }}
            >
              {agentName.charAt(0)}
            </div>
          )}
          <h3 className={`font-semibold text-sm mt-2 ${backgroundImageUrl ? 'text-white' : ''}`}>
            {agentName || "AI 助手"}
          </h3>
          {tagline && (
            <p className={`text-[10px] mt-0.5 line-clamp-1 ${backgroundImageUrl ? 'text-white/80' : 'text-muted-foreground'}`}>
              {tagline}
            </p>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-3 overflow-auto">
          <div className="bg-white/90 backdrop-blur rounded-lg p-2 text-xs shadow-sm">
            {welcomeMessage || "您好！有什麼可以幫助您的嗎？"}
          </div>
          
          {suggestedQuestions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedQuestions.slice(0, 2).map((q, i) => (
                <span 
                  key={i} 
                  className="text-[10px] px-2 py-1 rounded-full bg-white/90 backdrop-blur shadow-sm truncate max-w-[100px]"
                >
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-2">
          <div className="flex gap-2">
            <div className="flex-1 bg-white/90 backdrop-blur rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground shadow-sm">
              {chatPlaceholder}
            </div>
            <div 
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              <Send className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Component ====================
export default function Appearance() {
  const { data: persona, isLoading } = trpc.persona.get.useQuery();
  const upsertMutation = trpc.persona.upsert.useMutation();
  const utils = trpc.useUtils();

  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>("minimal");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("");
  const [tagline, setTagline] = useState<string>("");
  const [chatPlaceholder, setChatPlaceholder] = useState<string>("輸入您的問題...");
  const [showQuickButtons, setShowQuickButtons] = useState<boolean>(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState<string>("");

  const profileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  useEffect(() => {
    if (persona) {
      setLayoutStyle((persona.layoutStyle as LayoutStyle) || "minimal");
      setProfilePhotoUrl(persona.profilePhotoUrl || "");
      setBackgroundImageUrl(persona.backgroundImageUrl || "");
      setTagline(persona.tagline || "");
      setChatPlaceholder(persona.chatPlaceholder || "輸入您的問題...");
      setShowQuickButtons(persona.showQuickButtons ?? true);
      
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

  const handleImageUpload = async (
    file: File,
    type: "profile" | "background"
  ) => {
    const setUploading = type === "profile" ? setUploadingProfile : setUploadingBackground;
    const setUrl = type === "profile" ? setProfilePhotoUrl : setBackgroundImageUrl;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        
        // Use knowledge upload API to store the image
        const result = await fetch("/api/trpc/knowledge.upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: base64,
            mimeType: file.type,
          }),
        });
        
        if (result.ok) {
          const data = await result.json();
          if (data.result?.data?.fileUrl) {
            setUrl(data.result.data.fileUrl);
            toast.success("圖片上傳成功");
          }
        } else {
          // Fallback: use base64 data URL for preview
          setUrl(`data:${file.type};base64,${base64}`);
          toast.success("圖片已載入");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("圖片上傳失敗");
    } finally {
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

  const handleSave = async () => {
    if (!persona) {
      toast.error("請先完成基本AI設定");
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        agentName: persona.agentName,
        avatarUrl: persona.avatarUrl ?? undefined,
        welcomeMessage: persona.welcomeMessage ?? undefined,
        systemPrompt: persona.systemPrompt ?? undefined,
        primaryColor: persona.primaryColor ?? undefined,
        layoutStyle,
        profilePhotoUrl: profilePhotoUrl || undefined,
        backgroundImageUrl: backgroundImageUrl || undefined,
        tagline: tagline || undefined,
        chatPlaceholder: chatPlaceholder || undefined,
        showQuickButtons,
        suggestedQuestions: JSON.stringify(suggestedQuestions),
      });
      
      utils.persona.get.invalidate();
      toast.success("版面設定已保存");
    } catch (error) {
      toast.error("保存失敗，請稍後再試");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">版面設定</h1>
          <p className="text-muted-foreground mt-1">自訂您的AI對話頁面外觀</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">請先完成基本AI設定</p>
            <Button onClick={() => window.location.href = "/settings"}>
              前往AI設定
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">版面設定</h1>
        <p className="text-muted-foreground mt-1">自訂您的AI對話頁面外觀，打造獨特的客戶體驗</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Left: Settings */}
        <div className="space-y-6">
          {/* Layout Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">佈局風格</CardTitle>
              <CardDescription>選擇最適合您業務的頁面風格</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={layoutStyle}
                onValueChange={(value) => setLayoutStyle(value as LayoutStyle)}
                className="grid gap-4 md:grid-cols-3"
              >
                {layoutOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/50 ${
                      layoutStyle === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="sr-only"
                    />
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      layoutStyle === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}>
                      <option.icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {option.description}
                      </p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Profile Photo - for professional style */}
          {(layoutStyle === "professional" || layoutStyle === "custom") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">個人照片</CardTitle>
                <CardDescription>上傳您的專業照片，建立信任感</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {profilePhotoUrl ? (
                    <div className="relative">
                      <img
                        src={profilePhotoUrl}
                        alt="Profile"
                        className="h-20 w-20 rounded-full object-cover border-4 border-background shadow-lg"
                      />
                      <button
                        onClick={() => setProfilePhotoUrl("")}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => profileInputRef.current?.click()}
                      className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploadingProfile ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => profileInputRef.current?.click()}
                      disabled={uploadingProfile}
                    >
                      {uploadingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      上傳照片
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      建議使用正方形圖片，最佳尺寸 400x400 像素
                    </p>
                  </div>
                </div>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "profile");
                  }}
                />

                {/* Tagline */}
                <div className="space-y-2">
                  <Label htmlFor="tagline">個人標語</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="例如：專業保險顧問，為您的未來保駕護航"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    簡短描述您的專業或服務特色
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Background Image - for custom style */}
          {layoutStyle === "custom" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">背景圖片</CardTitle>
                <CardDescription>上傳自訂背景，打造獨特品牌風格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {backgroundImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={backgroundImageUrl}
                      alt="Background"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <button
                      onClick={() => setBackgroundImageUrl("")}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => backgroundInputRef.current?.click()}
                    className="h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {uploadingBackground ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">點擊上傳背景圖片</p>
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
                    if (file) handleImageUpload(file, "background");
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  建議使用 1920x1080 或更高解析度的圖片
                </p>
              </CardContent>
            </Card>
          )}

          {/* Chat Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">對話設定</CardTitle>
              <CardDescription>自訂對話框的顯示方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="placeholder">輸入框提示文字</Label>
                <Input
                  id="placeholder"
                  value={chatPlaceholder}
                  onChange={(e) => setChatPlaceholder(e.target.value)}
                  placeholder="輸入您的問題..."
                  maxLength={100}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>顯示快捷按鈕</Label>
                  <p className="text-xs text-muted-foreground">
                    在對話頁面顯示您配置的快捷功能按鈕
                  </p>
                </div>
                <Switch
                  checked={showQuickButtons}
                  onCheckedChange={setShowQuickButtons}
                />
              </div>
            </CardContent>
          </Card>

          {/* Suggested Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">引導問題</CardTitle>
              <CardDescription>
                設定常見問題，幫助客戶快速開始對話（最多6個）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="例如：你們有什麼保險產品？"
                  maxLength={100}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddQuestion();
                    }
                  }}
                />
                <Button
                  onClick={handleAddQuestion}
                  disabled={!newQuestion.trim() || suggestedQuestions.length >= 6}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50"
                    >
                      <span className="flex-1 text-sm truncate">{question}</span>
                      <button
                        onClick={() => handleRemoveQuestion(index)}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {suggestedQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  尚未添加引導問題
                </p>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              size="lg"
            >
              {upsertMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              保存設定
            </Button>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">即時預覽</h3>
            <span className="text-xs text-muted-foreground">手機版效果</span>
          </div>
          <div className="h-[500px] w-full max-w-[280px] mx-auto">
            <PreviewPanel
              layoutStyle={layoutStyle}
              agentName={persona?.agentName || "AI 助手"}
              avatarUrl={persona?.avatarUrl || ""}
              profilePhotoUrl={profilePhotoUrl}
              backgroundImageUrl={backgroundImageUrl}
              tagline={tagline}
              welcomeMessage={persona?.welcomeMessage || "您好！有什麼可以幫助您的嗎？"}
              chatPlaceholder={chatPlaceholder}
              suggestedQuestions={suggestedQuestions}
              showQuickButtons={showQuickButtons}
              primaryColor={persona?.primaryColor || "#3b82f6"}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            預覽會隨您的設定即時更新
          </p>
        </div>
      </div>
    </div>
  );
}
