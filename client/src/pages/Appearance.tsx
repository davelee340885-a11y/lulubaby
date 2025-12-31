import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X, Plus, Trash2, Image as ImageIcon, Bot, Send, MessageSquare, Sparkles, User, Building2, Package, Calendar, Phone, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";


const layoutStyles = [
  {
    id: "minimal",
    name: "簡約風格",
    description: "類似ChatGPT的簡潔對話界面",
    preview: "💬",
  },
  {
    id: "professional",
    name: "專業名片",
    description: "展示個人照片和專業標語",
    preview: "👔",
  },
  {
    id: "custom",
    name: "自訂背景",
    description: "上傳背景圖片打造獨特風格",
    preview: "🎨",
  },
];

export default function Appearance() {
  const { data: persona, isLoading } = trpc.persona.get.useQuery();
  const utils = trpc.useUtils();

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
    } catch (error) {
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
        <p className="text-muted-foreground mt-1">自訂您的AI對話頁面外觀和風格</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Left: Settings */}
        <div className="space-y-6">
          {/* Layout Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">佈局風格</CardTitle>
              <CardDescription>選擇對話頁面的整體風格</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                {layoutStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setLayoutStyle(style.id as "minimal" | "professional" | "custom")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      layoutStyle === style.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{style.preview}</div>
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                  </button>
                ))}
              </div>
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
                        className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-md"
                      />
                      <button
                        onClick={() => setProfilePhotoUrl("")}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => profileInputRef.current?.click()}
                      className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploadingProfile ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" />
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
                    <p className="text-xs text-muted-foreground mt-1">
                      建議 400x400 像素
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
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={backgroundImageUrl}
                      alt="Background"
                      className="w-full h-24 object-cover"
                    />
                    <button
                      onClick={() => setBackgroundImageUrl("")}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => backgroundInputRef.current?.click()}
                    className="h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {uploadingBackground ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">點擊上傳</p>
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
              </CardContent>
            </Card>
          )}

          {/* Chat Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">對話設定</CardTitle>
              <CardDescription>自訂對話框的顯示方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                設定常見問題，幫助客戶快速開始對話（最多6個，可同時顯示多個）
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
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-sm truncate">{question}</span>
                      <button
                        onClick={() => handleRemoveQuestion(index)}
                        className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {suggestedQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">
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

        {/* Right: Compact Preview Panel */}
        <div className="lg:sticky lg:top-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">即時預覽</h3>
            <span className="text-xs text-muted-foreground">手機版效果</span>
          </div>
          
          {/* Compact Phone Preview */}
          <div className="relative mx-auto" style={{ width: "240px" }}>
            {/* Phone Frame */}
            <div className="rounded-[24px] border-4 border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
              {/* Notch */}
              <div className="h-5 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-3 bg-black rounded-full" />
              </div>
              
              {/* Screen Content */}
              <div 
                className="bg-background overflow-hidden"
                style={{ 
                  height: "380px",
                  backgroundImage: layoutStyle === "custom" && backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {layoutStyle === "custom" && backgroundImageUrl && (
                  <div className="absolute inset-0 bg-black/40" />
                )}
                
                <div className={`h-full flex flex-col ${layoutStyle === "custom" ? "relative z-10" : ""}`}>
                  {/* Header */}
                  <div className={`p-2.5 border-b ${layoutStyle === "custom" ? "bg-black/20 border-white/10" : "bg-background/95"}`}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-7 w-7 rounded-full flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}
                      >
                        {persona?.avatarUrl ? (
                          <img src={persona.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${layoutStyle === "custom" ? "text-white" : ""}`}>
                          {persona?.agentName || "AI 助手"}
                        </p>
                        <p className={`text-[10px] ${layoutStyle === "custom" ? "text-white/70" : "text-muted-foreground"}`}>
                          在線
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Section for Professional */}
                  {layoutStyle === "professional" && (
                    <div className="p-3 text-center border-b">
                      {profilePhotoUrl ? (
                        <img 
                          src={profilePhotoUrl} 
                          alt="" 
                          className="h-12 w-12 rounded-full object-cover mx-auto border-2 border-background shadow-sm"
                        />
                      ) : (
                        <div 
                          className="h-12 w-12 rounded-full mx-auto flex items-center justify-center"
                          style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}
                        >
                          <User className="h-5 w-5" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                        </div>
                      )}
                      {tagline && (
                        <p className="text-[10px] text-muted-foreground mt-1.5 px-2 line-clamp-2">
                          {tagline}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Chat Area */}
                  <div className="flex-1 p-2.5 overflow-hidden">
                    {/* Welcome Message */}
                    <div className="flex gap-1.5 mb-2">
                      <div 
                        className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${persona?.primaryColor || "#3B82F6"}15` }}
                      >
                        <Bot className="h-2.5 w-2.5" style={{ color: persona?.primaryColor || "#3B82F6" }} />
                      </div>
                      <div className={`rounded-lg px-2 py-1.5 max-w-[85%] ${layoutStyle === "custom" ? "bg-white/90 text-gray-900" : "bg-muted"}`}>
                        <p className="text-[10px] leading-relaxed">
                          {persona?.welcomeMessage || "您好！有什麼可以幫您？"}
                        </p>
                      </div>
                    </div>

                    {/* Suggested Questions */}
                    {suggestedQuestions.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {suggestedQuestions.slice(0, 3).map((q, i) => (
                          <div 
                            key={i}
                            className={`text-[9px] px-2 py-1 rounded-full border cursor-pointer truncate ${
                              layoutStyle === "custom" 
                                ? "bg-white/80 border-white/50 text-gray-700" 
                                : "bg-background border-border hover:bg-muted"
                            }`}
                          >
                            {q}
                          </div>
                        ))}
                        {suggestedQuestions.length > 3 && (
                          <p className={`text-[8px] text-center ${layoutStyle === "custom" ? "text-white/60" : "text-muted-foreground"}`}>
                            +{suggestedQuestions.length - 3} 更多問題
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quick Buttons Preview */}
                    {showQuickButtons && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <div className={`text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${layoutStyle === "custom" ? "bg-white/80 text-gray-700" : "bg-primary/10 text-primary"}`}>
                          <Calendar className="h-2 w-2" />
                          預約
                        </div>
                        <div className={`text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${layoutStyle === "custom" ? "bg-white/80 text-gray-700" : "bg-primary/10 text-primary"}`}>
                          <Package className="h-2 w-2" />
                          產品
                        </div>
                        <div className={`text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${layoutStyle === "custom" ? "bg-white/80 text-gray-700" : "bg-primary/10 text-primary"}`}>
                          <User className="h-2 w-2" />
                          關於我
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className={`p-2 border-t ${layoutStyle === "custom" ? "bg-black/20 border-white/10" : ""}`}>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 ${layoutStyle === "custom" ? "bg-white/90" : "bg-muted"}`}>
                      <span className="text-[9px] text-muted-foreground flex-1 truncate">
                        {chatPlaceholder}
                      </span>
                      <div 
                        className="h-5 w-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: persona?.primaryColor || "#3B82F6" }}
                      >
                        <Send className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Home Indicator */}
              <div className="h-4 bg-gray-800 flex items-center justify-center">
                <div className="w-20 h-1 bg-gray-600 rounded-full" />
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center">
            預覽會隨設定即時更新
          </p>
        </div>
      </div>
    </div>
  );
}
