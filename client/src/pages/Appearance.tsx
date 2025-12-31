import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, MessageSquare, User, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";

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
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 cursor-pointer transition-all hover:border-primary/50 ${
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
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  layoutStyle === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
                    className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-lg"
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
                  className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
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
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  onClick={() => setBackgroundImageUrl("")}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => backgroundInputRef.current?.click()}
                className="h-48 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
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
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {suggestedQuestions.length > 0 && (
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <span className="flex-1 text-sm">{question}</span>
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
  );
}
