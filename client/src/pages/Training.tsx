import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  MessageSquare, 
  FileText, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Heart, 
  Languages, 
  Shield,
  Sparkles,
  Save,
  RotateCcw,
  Zap,
  User,
  Building,
  Smile,
  Brain
} from "lucide-react";

// 評分選擇器組件
function RatingSelector({ 
  value, 
  onChange, 
  leftLabel, 
  rightLabel,
  disabled = false 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  leftLabel: string; 
  rightLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 text-right shrink-0">{leftLabel}</span>
      <div className="flex gap-1 flex-1 justify-center">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onClick={() => onChange(rating)}
            className={`w-8 h-8 rounded-full border-2 transition-all text-sm font-medium
              ${value === rating 
                ? 'bg-primary border-primary text-primary-foreground scale-110' 
                : 'border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {rating}
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-20 shrink-0">{rightLabel}</span>
    </div>
  );
}

// 維度卡片組件
function DimensionCard({ 
  icon: Icon, 
  title, 
  description, 
  children,
  color = "primary"
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

// 人設模板數據
type TemplateSettings = Record<string, number>;

const personaTemplates: Array<{
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  settings: TemplateSettings;
}> = [
  { 
    id: "friendly_sales", 
    name: "親切銷售員", 
    icon: Smile,
    description: "熱情友善，善於建立關係",
    color: "text-orange-500",
    settings: {
      humorLevel: 4, friendlinessLevel: 5, formalityLevel: 2, enthusiasmLevel: 5,
      patienceLevel: 4, empathyLevel: 5, pushIntensity: 3, closingIntensity: 3
    }
  },
  { 
    id: "professional_consultant", 
    name: "專業顧問", 
    icon: Briefcase,
    description: "專業嚴謹，數據導向",
    color: "text-blue-500",
    settings: {
      humorLevel: 2, friendlinessLevel: 3, formalityLevel: 5, enthusiasmLevel: 3,
      terminologyUsage: 5, dataUsage: 5, structuredResponse: 5, regulationAwareness: 5
    }
  },
  { 
    id: "caring_helper", 
    name: "貼心助手", 
    icon: Heart,
    description: "溫暖體貼，善解人意",
    color: "text-pink-500",
    settings: {
      humorLevel: 3, friendlinessLevel: 5, empathyLevel: 5, careLevel: 5,
      soothingAbility: 5, encouragementLevel: 5, patienceLevel: 5, praiseFrequency: 4
    }
  },
  { 
    id: "knowledgeable_expert", 
    name: "知識專家", 
    icon: GraduationCap,
    description: "博學多聞，深入淺出",
    color: "text-purple-500",
    settings: {
      responseDepth: 5, exampleUsage: 5, educationalContent: 5, caseStudyUsage: 5,
      terminologyUsage: 4, structuredResponse: 4, dataUsage: 4, marketAnalysis: 4
    }
  },
  { 
    id: "local_buddy", 
    name: "本地好友", 
    icon: User,
    description: "親切地道，廣東話流利",
    color: "text-green-500",
    settings: {
      cantoneseUsage: 5, colloquialLevel: 5, emojiUsage: 4, humorLevel: 4,
      friendlinessLevel: 5, formalityLevel: 1, exclamationUsage: 4, addressingStyle: 5
    }
  },
  { 
    id: "corporate_rep", 
    name: "企業代表", 
    icon: Building,
    description: "正式專業，代表公司形象",
    color: "text-slate-500",
    settings: {
      formalityLevel: 5, terminologyUsage: 4, privacyAwareness: 5, promiseCaution: 5,
      regulationAwareness: 5, riskWarningLevel: 4, structuredResponse: 4, humorLevel: 1
    }
  }
];

export default function Training() {
  const utils = trpc.useUtils();
  
  // 獲取訓練設定
  const { data: training, isLoading } = trpc.training.get.useQuery();
  
  // 更新訓練設定
  const updateMutation = trpc.training.update.useMutation({
    onSuccess: () => {
      toast.success("訓練設定已保存");
      utils.training.get.invalidate();
    },
    onError: (error) => {
      toast.error("保存失敗: " + error.message);
    }
  });

  // 本地狀態
  const [settings, setSettings] = useState<Record<string, number | string | boolean | null | undefined>>({});
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState({
    behaviorInstructions: "",
    prohibitedActions: "",
    customGreeting: "",
    customClosing: ""
  });

  // 當數據加載後初始化本地狀態
  useEffect(() => {
    if (training) {
      const { createdAt, updatedAt, id, userId, ...rest } = training;
      setSettings(rest);
      setActiveTemplate(training.activePersonaTemplate);
      setCustomInstructions({
        behaviorInstructions: training.behaviorInstructions || "",
        prohibitedActions: training.prohibitedActions || "",
        customGreeting: training.customGreeting || "",
        customClosing: training.customClosing || ""
      });
    }
  }, [training]);

  // 更新單個設定
  const updateSetting = (key: string, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setActiveTemplate(null); // 清除模板選擇
  };

  // 應用人設模板
  const applyTemplate = (templateId: string) => {
    const template = personaTemplates.find(t => t.id === templateId);
    if (template) {
      setSettings(prev => ({ ...prev, ...template.settings }));
      setActiveTemplate(templateId);
      toast.success(`已套用「${template.name}」模板`);
    }
  };

  // 重置為默認值
  const resetToDefault = () => {
    const defaultSettings: Record<string, number> = {};
    // 所有評分項目默認為3
    Object.keys(settings).forEach(key => {
      if (typeof settings[key] === 'number') {
        defaultSettings[key] = 3;
      }
    });
    setSettings(prev => ({ ...prev, ...defaultSettings }));
    setActiveTemplate(null);
    toast.info("已重置為默認值");
  };

  // 保存設定
  const handleSave = () => {
    updateMutation.mutate({
      ...settings,
      activePersonaTemplate: activeTemplate,
      ...customInstructions
    } as any);
  };

  // 計算訓練進度
  const calculateProgress = () => {
    let filled = 0;
    let total = 48; // 8維度 x 6項目
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === 'number' && value !== 3 && !['trainingProgress', 'intelligenceScore'].includes(key)) {
        filled++;
      }
    });
    // 自訂指令也計入
    if (customInstructions.behaviorInstructions) filled += 5;
    if (customInstructions.prohibitedActions) filled += 5;
    if (customInstructions.customGreeting) filled += 2;
    if (customInstructions.customClosing) filled += 2;
    return Math.min(100, Math.round((filled / (total + 14)) * 100));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            訓練智能體
          </h1>
          <p className="text-muted-foreground mt-1">
            調整AI的性格特質和溝通風格，打造專屬於您的智能助手
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={resetToDefault} disabled={updateMutation.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "保存中..." : "保存設定"}
          </Button>
        </div>
      </div>

      {/* 訓練進度 */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-medium">訓練完成度</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3">
              {progress}%
            </Badge>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            完成更多設定可以讓AI更了解您的需求，提供更精準的服務
          </p>
        </CardContent>
      </Card>

      {/* 快速人設模板 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            快速人設模板
          </CardTitle>
          <CardDescription>
            選擇一個預設人設快速開始，或自行調整每個維度
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {personaTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md
                  ${activeTemplate === template.id 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-muted hover:border-primary/50'
                  }
                `}
              >
                <template.icon className={`h-8 w-8 ${template.color} mb-2`} />
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 8大維度設定 */}
      <Tabs defaultValue="speaking" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="speaking" className="text-xs py-2 px-2">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">說話風格</span>
          </TabsTrigger>
          <TabsTrigger value="response" className="text-xs py-2 px-2">
            <FileText className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">回應方式</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="text-xs py-2 px-2">
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">溝通態度</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs py-2 px-2">
            <Briefcase className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">銷售風格</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="text-xs py-2 px-2">
            <GraduationCap className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">專業表現</span>
          </TabsTrigger>
          <TabsTrigger value="emotion" className="text-xs py-2 px-2">
            <Heart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">情緒處理</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="text-xs py-2 px-2">
            <Languages className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">語言習慣</span>
          </TabsTrigger>
          <TabsTrigger value="boundary" className="text-xs py-2 px-2">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">服務邊界</span>
          </TabsTrigger>
        </TabsList>

        {/* 說話風格 */}
        <TabsContent value="speaking">
          <DimensionCard 
            icon={MessageSquare} 
            title="說話風格" 
            description="調整AI的語氣和表達方式"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">幽默度</Label>
                <RatingSelector 
                  value={settings.humorLevel as number || 3}
                  onChange={(v) => updateSetting('humorLevel', v)}
                  leftLabel="嚴肅認真"
                  rightLabel="幽默風趣"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">親切度</Label>
                <RatingSelector 
                  value={settings.friendlinessLevel as number || 3}
                  onChange={(v) => updateSetting('friendlinessLevel', v)}
                  leftLabel="保持距離"
                  rightLabel="親切友善"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">正式度</Label>
                <RatingSelector 
                  value={settings.formalityLevel as number || 3}
                  onChange={(v) => updateSetting('formalityLevel', v)}
                  leftLabel="輕鬆隨意"
                  rightLabel="正式專業"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">熱情度</Label>
                <RatingSelector 
                  value={settings.enthusiasmLevel as number || 3}
                  onChange={(v) => updateSetting('enthusiasmLevel', v)}
                  leftLabel="冷靜沉穩"
                  rightLabel="熱情洋溢"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">耐心度</Label>
                <RatingSelector 
                  value={settings.patienceLevel as number || 3}
                  onChange={(v) => updateSetting('patienceLevel', v)}
                  leftLabel="簡潔直接"
                  rightLabel="耐心細緻"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">同理心</Label>
                <RatingSelector 
                  value={settings.empathyLevel as number || 3}
                  onChange={(v) => updateSetting('empathyLevel', v)}
                  leftLabel="理性分析"
                  rightLabel="感同身受"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 回應方式 */}
        <TabsContent value="response">
          <DimensionCard 
            icon={FileText} 
            title="回應方式" 
            description="調整AI回覆的結構和內容"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">回覆長度</Label>
                <RatingSelector 
                  value={settings.responseLength as number || 3}
                  onChange={(v) => updateSetting('responseLength', v)}
                  leftLabel="簡短精煉"
                  rightLabel="詳細完整"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">回覆深度</Label>
                <RatingSelector 
                  value={settings.responseDepth as number || 3}
                  onChange={(v) => updateSetting('responseDepth', v)}
                  leftLabel="淺顯易懂"
                  rightLabel="深入分析"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">舉例頻率</Label>
                <RatingSelector 
                  value={settings.exampleUsage as number || 3}
                  onChange={(v) => updateSetting('exampleUsage', v)}
                  leftLabel="少用例子"
                  rightLabel="多用例子"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">數據使用</Label>
                <RatingSelector 
                  value={settings.dataUsage as number || 3}
                  onChange={(v) => updateSetting('dataUsage', v)}
                  leftLabel="少用數據"
                  rightLabel="數據導向"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">比喻使用</Label>
                <RatingSelector 
                  value={settings.metaphorUsage as number || 3}
                  onChange={(v) => updateSetting('metaphorUsage', v)}
                  leftLabel="直接說明"
                  rightLabel="善用比喻"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">結構化程度</Label>
                <RatingSelector 
                  value={settings.structuredResponse as number || 3}
                  onChange={(v) => updateSetting('structuredResponse', v)}
                  leftLabel="自然流暢"
                  rightLabel="條理分明"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 溝通態度 */}
        <TabsContent value="communication">
          <DimensionCard 
            icon={Users} 
            title="溝通態度" 
            description="調整AI與客戶互動的方式"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">主動性</Label>
                <RatingSelector 
                  value={settings.proactiveness as number || 3}
                  onChange={(v) => updateSetting('proactiveness', v)}
                  leftLabel="被動回應"
                  rightLabel="主動引導"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">提問頻率</Label>
                <RatingSelector 
                  value={settings.questioningStyle as number || 3}
                  onChange={(v) => updateSetting('questioningStyle', v)}
                  leftLabel="少問問題"
                  rightLabel="多問了解"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">建議頻率</Label>
                <RatingSelector 
                  value={settings.suggestionFrequency as number || 3}
                  onChange={(v) => updateSetting('suggestionFrequency', v)}
                  leftLabel="等待詢問"
                  rightLabel="主動建議"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">謙遜度</Label>
                <RatingSelector 
                  value={settings.humilityLevel as number || 3}
                  onChange={(v) => updateSetting('humilityLevel', v)}
                  leftLabel="自信果斷"
                  rightLabel="謙虛謹慎"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">堅持度</Label>
                <RatingSelector 
                  value={settings.persistenceLevel as number || 3}
                  onChange={(v) => updateSetting('persistenceLevel', v)}
                  leftLabel="隨和配合"
                  rightLabel="堅持立場"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">關心度</Label>
                <RatingSelector 
                  value={settings.careLevel as number || 3}
                  onChange={(v) => updateSetting('careLevel', v)}
                  leftLabel="公事公辦"
                  rightLabel="關懷備至"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 銷售風格 */}
        <TabsContent value="sales">
          <DimensionCard 
            icon={Briefcase} 
            title="銷售風格" 
            description="調整AI的銷售和推廣策略"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">推銷強度</Label>
                <RatingSelector 
                  value={settings.pushIntensity as number || 3}
                  onChange={(v) => updateSetting('pushIntensity', v)}
                  leftLabel="軟性推薦"
                  rightLabel="積極推銷"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">緊迫感</Label>
                <RatingSelector 
                  value={settings.urgencyCreation as number || 3}
                  onChange={(v) => updateSetting('urgencyCreation', v)}
                  leftLabel="不催促"
                  rightLabel="製造緊迫"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">價格敏感度</Label>
                <RatingSelector 
                  value={settings.priceSensitivity as number || 3}
                  onChange={(v) => updateSetting('priceSensitivity', v)}
                  leftLabel="強調價值"
                  rightLabel="強調優惠"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">比較使用</Label>
                <RatingSelector 
                  value={settings.comparisonUsage as number || 3}
                  onChange={(v) => updateSetting('comparisonUsage', v)}
                  leftLabel="避免比較"
                  rightLabel="善用比較"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">成交強度</Label>
                <RatingSelector 
                  value={settings.closingIntensity as number || 3}
                  onChange={(v) => updateSetting('closingIntensity', v)}
                  leftLabel="自然成交"
                  rightLabel="積極促成"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">跟進頻率</Label>
                <RatingSelector 
                  value={settings.followUpFrequency as number || 3}
                  onChange={(v) => updateSetting('followUpFrequency', v)}
                  leftLabel="等待回覆"
                  rightLabel="主動跟進"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 專業表現 */}
        <TabsContent value="professional">
          <DimensionCard 
            icon={GraduationCap} 
            title="專業表現" 
            description="調整AI的專業知識展現"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">術語使用</Label>
                <RatingSelector 
                  value={settings.terminologyUsage as number || 3}
                  onChange={(v) => updateSetting('terminologyUsage', v)}
                  leftLabel="通俗易懂"
                  rightLabel="專業術語"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">法規意識</Label>
                <RatingSelector 
                  value={settings.regulationAwareness as number || 3}
                  onChange={(v) => updateSetting('regulationAwareness', v)}
                  leftLabel="一般提醒"
                  rightLabel="嚴格合規"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">風險提示</Label>
                <RatingSelector 
                  value={settings.riskWarningLevel as number || 3}
                  onChange={(v) => updateSetting('riskWarningLevel', v)}
                  leftLabel="輕描淡寫"
                  rightLabel="充分警示"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">案例使用</Label>
                <RatingSelector 
                  value={settings.caseStudyUsage as number || 3}
                  onChange={(v) => updateSetting('caseStudyUsage', v)}
                  leftLabel="少用案例"
                  rightLabel="多用案例"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">市場分析</Label>
                <RatingSelector 
                  value={settings.marketAnalysis as number || 3}
                  onChange={(v) => updateSetting('marketAnalysis', v)}
                  leftLabel="簡單說明"
                  rightLabel="深入分析"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">教育內容</Label>
                <RatingSelector 
                  value={settings.educationalContent as number || 3}
                  onChange={(v) => updateSetting('educationalContent', v)}
                  leftLabel="直接回答"
                  rightLabel="教育引導"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 情緒處理 */}
        <TabsContent value="emotion">
          <DimensionCard 
            icon={Heart} 
            title="情緒處理" 
            description="調整AI處理客戶情緒的方式"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">安撫能力</Label>
                <RatingSelector 
                  value={settings.soothingAbility as number || 3}
                  onChange={(v) => updateSetting('soothingAbility', v)}
                  leftLabel="理性處理"
                  rightLabel="溫柔安撫"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">讚美頻率</Label>
                <RatingSelector 
                  value={settings.praiseFrequency as number || 3}
                  onChange={(v) => updateSetting('praiseFrequency', v)}
                  leftLabel="少讚美"
                  rightLabel="多讚美"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">鼓勵程度</Label>
                <RatingSelector 
                  value={settings.encouragementLevel as number || 3}
                  onChange={(v) => updateSetting('encouragementLevel', v)}
                  leftLabel="客觀陳述"
                  rightLabel="積極鼓勵"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">負面處理</Label>
                <RatingSelector 
                  value={settings.negativeHandling as number || 3}
                  onChange={(v) => updateSetting('negativeHandling', v)}
                  leftLabel="直面問題"
                  rightLabel="轉化正面"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">樂觀程度</Label>
                <RatingSelector 
                  value={settings.optimismLevel as number || 3}
                  onChange={(v) => updateSetting('optimismLevel', v)}
                  leftLabel="務實客觀"
                  rightLabel="樂觀積極"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">緊張時幽默</Label>
                <RatingSelector 
                  value={settings.humorInTension as number || 3}
                  onChange={(v) => updateSetting('humorInTension', v)}
                  leftLabel="保持嚴肅"
                  rightLabel="適時幽默"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 語言習慣 */}
        <TabsContent value="language">
          <DimensionCard 
            icon={Languages} 
            title="語言習慣" 
            description="調整AI的語言表達習慣"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">Emoji使用</Label>
                <RatingSelector 
                  value={settings.emojiUsage as number || 3}
                  onChange={(v) => updateSetting('emojiUsage', v)}
                  leftLabel="不用Emoji"
                  rightLabel="常用Emoji"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">口語化程度</Label>
                <RatingSelector 
                  value={settings.colloquialLevel as number || 3}
                  onChange={(v) => updateSetting('colloquialLevel', v)}
                  leftLabel="書面語"
                  rightLabel="口語化"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">廣東話使用</Label>
                <RatingSelector 
                  value={settings.cantoneseUsage as number || 3}
                  onChange={(v) => updateSetting('cantoneseUsage', v)}
                  leftLabel="標準中文"
                  rightLabel="廣東話"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">中英夾雜</Label>
                <RatingSelector 
                  value={settings.englishMixing as number || 3}
                  onChange={(v) => updateSetting('englishMixing', v)}
                  leftLabel="純中文"
                  rightLabel="中英夾雜"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">感嘆詞使用</Label>
                <RatingSelector 
                  value={settings.exclamationUsage as number || 3}
                  onChange={(v) => updateSetting('exclamationUsage', v)}
                  leftLabel="少用感嘆"
                  rightLabel="多用感嘆"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">稱呼方式</Label>
                <RatingSelector 
                  value={settings.addressingStyle as number || 3}
                  onChange={(v) => updateSetting('addressingStyle', v)}
                  leftLabel="正式稱呼"
                  rightLabel="親切稱呼"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>

        {/* 服務邊界 */}
        <TabsContent value="boundary">
          <DimensionCard 
            icon={Shield} 
            title="服務邊界" 
            description="調整AI的服務範圍和限制"
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block">話題範圍</Label>
                <RatingSelector 
                  value={settings.topicRange as number || 3}
                  onChange={(v) => updateSetting('topicRange', v)}
                  leftLabel="嚴格限制"
                  rightLabel="廣泛討論"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">隱私意識</Label>
                <RatingSelector 
                  value={settings.privacyAwareness as number || 3}
                  onChange={(v) => updateSetting('privacyAwareness', v)}
                  leftLabel="一般注意"
                  rightLabel="高度警覺"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">承諾謹慎</Label>
                <RatingSelector 
                  value={settings.promiseCaution as number || 3}
                  onChange={(v) => updateSetting('promiseCaution', v)}
                  leftLabel="靈活承諾"
                  rightLabel="謹慎承諾"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">轉介意願</Label>
                <RatingSelector 
                  value={settings.referralWillingness as number || 3}
                  onChange={(v) => updateSetting('referralWillingness', v)}
                  leftLabel="盡量處理"
                  rightLabel="適時轉介"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">不確定處理</Label>
                <RatingSelector 
                  value={settings.uncertaintyHandling as number || 3}
                  onChange={(v) => updateSetting('uncertaintyHandling', v)}
                  leftLabel="嘗試回答"
                  rightLabel="坦承不知"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">投訴處理</Label>
                <RatingSelector 
                  value={settings.complaintHandling as number || 3}
                  onChange={(v) => updateSetting('complaintHandling', v)}
                  leftLabel="解釋說明"
                  rightLabel="道歉優先"
                />
              </div>
            </div>
          </DimensionCard>
        </TabsContent>
      </Tabs>

      {/* 主動資料索取 */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            主動資料索取
          </CardTitle>
          <CardDescription>
            開啟後，AI 會在對話早期找自然的時機，禮貌地詢問新客戶的姓名和聯絡方式，以便更好地提供個人化服務
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium">允許 AI 主動索取客戶資料</p>
              <p className="text-xs text-muted-foreground">
                AI 會在對話中自然地詢問客戶姓名、電郵等基本資料，不會強迫或重複詢問
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!settings.proactiveDataCollection}
              onClick={() => updateSetting('proactiveDataCollection', !settings.proactiveDataCollection)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                settings.proactiveDataCollection ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  settings.proactiveDataCollection ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 自訂指令 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            自訂指令
          </CardTitle>
          <CardDescription>
            用自然語言描述您希望AI如何表現，這些指令會直接影響AI的行為
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>AI行為指令</Label>
              <Textarea 
                placeholder="例如：每次回覆都要先確認客戶的需求，然後再提供建議..."
                value={customInstructions.behaviorInstructions}
                onChange={(e) => setCustomInstructions(prev => ({ ...prev, behaviorInstructions: e.target.value }))}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">描述您希望AI如何回應客戶</p>
            </div>
            <div className="space-y-2">
              <Label>絕對禁止事項</Label>
              <Textarea 
                placeholder="例如：絕對不能承諾具體回報率、不能批評競爭對手..."
                value={customInstructions.prohibitedActions}
                onChange={(e) => setCustomInstructions(prev => ({ ...prev, prohibitedActions: e.target.value }))}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">列出AI絕對不能做的事情</p>
            </div>
            <div className="space-y-2">
              <Label>自訂開場白</Label>
              <Textarea 
                placeholder="例如：您好！我是您的專屬理財顧問小明，很高興為您服務..."
                value={customInstructions.customGreeting}
                onChange={(e) => setCustomInstructions(prev => ({ ...prev, customGreeting: e.target.value }))}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">AI開始對話時使用的問候語</p>
            </div>
            <div className="space-y-2">
              <Label>自訂結束語</Label>
              <Textarea 
                placeholder="例如：感謝您的諮詢！如有任何問題，隨時聯繫我..."
                value={customInstructions.customClosing}
                onChange={(e) => setCustomInstructions(prev => ({ ...prev, customClosing: e.target.value }))}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">AI結束對話時使用的結束語</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部保存按鈕 */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={resetToDefault} disabled={updateMutation.isPending}>
          <RotateCcw className="h-4 w-4 mr-2" />
          重置為默認
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "保存中..." : "保存所有設定"}
        </Button>
      </div>
    </div>
  );
}
