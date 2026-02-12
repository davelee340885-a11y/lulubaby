import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Brain, 
  Clock, 
  Eye, 
  Globe, 
  MessageCircle,
  Zap,
  Save,
  Search,
  Scale,
  BookOpen,
  FolderSearch,
  Users,
  History,
  Wifi,
  Timer,
  TrendingUp,
  AlertTriangle,
  Target,
  Radio,
  Languages,
  Newspaper,
  Heart,
  Sparkles,
  Palette,
  Trophy,
  Star,
  Award,
  Crown,
  ChevronDown,
  ChevronUp,
  Lock,
  Info
} from "lucide-react";

// 超能力項目組件
function SuperpowerItem({ 
  icon: Icon, 
  title, 
  description, 
  humanLimit,
  aiPower,
  enabled, 
  onChange,
  locked = false,
  stats,
  color = "primary"
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  humanLimit: string;
  aiPower: string;
  enabled: boolean; 
  onChange: (v: boolean) => void;
  locked?: boolean;
  stats?: { label: string; value: string | number };
  color?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl p-4 transition-all ${enabled ? 'border-primary/50 bg-primary/5' : 'border-muted'} ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/20' : 'bg-muted'} shrink-0`}>
            <Icon className={`h-5 w-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{title}</h4>
              {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              {enabled && !locked && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  已啟用
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            
            {/* 展開/收起按鈕 */}
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? '收起詳情' : '查看對比'}
            </button>
            
            {/* 展開的對比詳情 */}
            {expanded && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">👤 人類極限：</span>
                  <span className="text-foreground">{humanLimit}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">🤖 AI能力：</span>
                  <span className="text-primary font-medium">{aiPower}</span>
                </div>
                {stats && (
                  <div className="flex items-center gap-2 text-xs pt-2 border-t">
                    <span className="text-muted-foreground">{stats.label}：</span>
                    <span className="font-medium">{stats.value}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Switch 
          checked={enabled} 
          onCheckedChange={onChange}
          disabled={locked}
        />
      </div>
    </div>
  );
}

// 超能力類別卡片
function SuperpowerCategory({ 
  icon: Icon, 
  title, 
  description, 
  children,
  enabledCount,
  totalCount,
  color
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  children: React.ReactNode;
  enabledCount: number;
  totalCount: number;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {enabledCount}/{totalCount} 已啟用
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

// 成就徽章組件
function AchievementBadge({ 
  icon: Icon, 
  title, 
  description, 
  unlocked,
  color
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  unlocked: boolean;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all
      ${unlocked ? 'border-amber-300 bg-amber-50' : 'border-muted bg-muted/30 opacity-50'}
    `}>
      <div className={`p-2 rounded-lg ${unlocked ? color : 'bg-muted'}`}>
        <Icon className={`h-5 w-5 ${unlocked ? 'text-white' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${unlocked ? '' : 'text-muted-foreground'}`}>{title}</span>
          {unlocked && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function Superpowers() {
  const utils = trpc.useUtils();
  
  // 獲取超能力設定
  const { data: superpowers, isLoading } = trpc.superpowers.get.useQuery();
  
  // 更新超能力設定
  const updateMutation = trpc.superpowers.update.useMutation({
    onSuccess: () => {
      toast.success("超能力設定已保存");
      utils.superpowers.get.invalidate();
    },
    onError: (error) => {
      toast.error("保存失敗: " + error.message);
    }
  });

  // 本地狀態
  const [settings, setSettings] = useState<Record<string, boolean | string | number>>({
    // 超級大腦
    instantResearch: false,
    globalComparison: false,
    legalInterpretation: false,
    caseSearch: false,
    // 時間掌控
    cloneAbility: true,
    perfectMemory: true,
    alwaysOnline: true,
    instantReply: true,
    // 預知未來
    needsPrediction: false,
    riskWarning: false,
    bestTiming: false,
    // 全球視野
    marketRadar: false,
    multiLanguage: true,
    globalInfo: false,
    // 讀心術
    emotionSense: false,
    persuasionMaster: false,
    styleAdaptation: false,
    // 設定
    researchDepth: "standard",
    followUpIntensity: 3,
    persuasionStyle: "balanced"
  });

  // 當數據加載後初始化本地狀態
  useEffect(() => {
    if (superpowers) {
      const { createdAt, updatedAt, id, userId, superpowerLevel, totalConversationsHandled, customersRemembered, afterHoursMessages, researchReportsGenerated, predictionsAccurate, ...rest } = superpowers;
      setSettings(rest as any);
    }
  }, [superpowers]);

  // 更新設定
  const updateSetting = (key: string, value: boolean | string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 保存設定
  const handleSave = () => {
    updateMutation.mutate(settings as any);
  };

  // 計算啟用的超能力數量
  const countEnabled = (keys: string[]) => {
    return keys.filter(key => settings[key] === true).length;
  };

  // 計算超能力等級
  const calculateLevel = () => {
    const totalEnabled = Object.values(settings).filter(v => v === true).length;
    if (totalEnabled >= 15) return 5;
    if (totalEnabled >= 12) return 4;
    if (totalEnabled >= 8) return 3;
    if (totalEnabled >= 4) return 2;
    return 1;
  };

  // 計算經驗值百分比
  const calculateExpPercentage = () => {
    const totalEnabled = Object.values(settings).filter(v => v === true).length;
    const thresholds = [0, 4, 8, 12, 15, 18];
    const level = calculateLevel();
    const currentThreshold = thresholds[level - 1];
    const nextThreshold = thresholds[level];
    const progress = ((totalEnabled - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const level = calculateLevel();
  const levelNames = ["新手", "進階", "專家", "大師", "傳奇"];
  const levelColors = ["bg-slate-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-gradient-to-r from-amber-500 to-red-500"];

  // 成就數據
  const achievements = [
    { 
      icon: Users, 
      title: "分身大師", 
      description: "同時服務超過10位客戶",
      unlocked: superpowers?.totalConversationsHandled ? superpowers.totalConversationsHandled >= 10 : false,
      color: "bg-blue-500"
    },
    { 
      icon: History, 
      title: "完美記憶", 
      description: "記住超過50位客戶的對話",
      unlocked: superpowers?.customersRemembered ? superpowers.customersRemembered >= 50 : false,
      color: "bg-purple-500"
    },
    { 
      icon: Clock, 
      title: "夜貓子", 
      description: "處理超過100條非工作時間訊息",
      unlocked: superpowers?.afterHoursMessages ? superpowers.afterHoursMessages >= 100 : false,
      color: "bg-indigo-500"
    },
    { 
      icon: Search, 
      title: "研究達人", 
      description: "生成超過20份研究報告",
      unlocked: superpowers?.researchReportsGenerated ? superpowers.researchReportsGenerated >= 20 : false,
      color: "bg-green-500"
    },
    { 
      icon: Target, 
      title: "預言家", 
      description: "準確預測超過30次客戶需求",
      unlocked: superpowers?.predictionsAccurate ? superpowers.predictionsAccurate >= 30 : false,
      color: "bg-amber-500"
    },
    { 
      icon: Crown, 
      title: "超能力大師", 
      description: "啟用所有超能力",
      unlocked: Object.values(settings).filter(v => v === true).length >= 18,
      color: "bg-gradient-to-r from-amber-500 to-red-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            開發超能力
          </h1>
          <p className="text-muted-foreground mt-1">
            解鎖AI的超凡能力，讓您的智能體擁有人類做不到的超能力
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "保存中..." : "保存設定"}
        </Button>
      </div>

      {/* 超能力等級 */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${levelColors[level - 1]}`}>
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">Lv.{level}</span>
                  <Badge className={`${levelColors[level - 1]} text-white`}>
                    {levelNames[level - 1]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  已啟用 {Object.values(settings).filter(v => v === true).length} 項超能力
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-sm mb-1">
                <span>經驗值</span>
                <span>{Math.round(calculateExpPercentage())}%</span>
              </div>
              <Progress value={calculateExpPercentage()} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {level < 5 ? `再啟用 ${[4, 8, 12, 15, 18][level] - Object.values(settings).filter(v => v === true).length} 項超能力升級` : '已達最高等級！'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 五大超能力類別 */}
      <div className="grid gap-6">
        {/* 🧠 超級大腦 */}
        <SuperpowerCategory
          icon={Brain}
          title="超級大腦"
          description="知識處理與研究能力"
          enabledCount={countEnabled(['instantResearch', 'globalComparison', 'legalInterpretation', 'caseSearch'])}
          totalCount={4}
          color="bg-purple-500"
        >
          <SuperpowerItem
            icon={Search}
            title="即時研究報告"
            description="60秒內掃描1000+份全球研究，生成專業報告"
            humanLimit="3-5天 + 研究團隊"
            aiPower="60秒 掃描1000+份研究"
            enabled={settings.instantResearch as boolean}
            onChange={(v) => updateSetting('instantResearch', v)}
            stats={{ label: "已生成報告", value: superpowers?.researchReportsGenerated || 0 }}
          />
          <SuperpowerItem
            icon={Scale}
            title="全球產品比較"
            description="30秒內比較100+款產品的功能、價格、評價"
            humanLimit="2週收集資料"
            aiPower="30秒 比較100+款產品"
            enabled={settings.globalComparison as boolean}
            onChange={(v) => updateSetting('globalComparison', v)}
          />
          <SuperpowerItem
            icon={BookOpen}
            title="即時法規解讀"
            description="即時更新所有最新法規，提供專業解讀"
            humanLimit="需專業資格 + 持續進修"
            aiPower="即時更新 所有最新法規"
            enabled={settings.legalInterpretation as boolean}
            onChange={(v) => updateSetting('legalInterpretation', v)}
          />
          <SuperpowerItem
            icon={FolderSearch}
            title="案例庫搜索"
            description="10萬+真實案例庫，秒速找到相關案例"
            humanLimit="記得幾十個案例"
            aiPower="10萬+ 真實案例庫"
            enabled={settings.caseSearch as boolean}
            onChange={(v) => updateSetting('caseSearch', v)}
          />
          
          {/* 研究深度設定 */}
          {settings.instantResearch && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label className="text-sm">研究報告深度</Label>
              <Select 
                value={settings.researchDepth as string} 
                onValueChange={(v) => updateSetting('researchDepth', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">快速摘要 (30秒)</SelectItem>
                  <SelectItem value="standard">標準報告 (60秒)</SelectItem>
                  <SelectItem value="deep">深度分析 (2分鐘)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SuperpowerCategory>

        {/* ⏰ 時間掌控 */}
        <SuperpowerCategory
          icon={Clock}
          title="時間掌控"
          description="效率與時間管理能力"
          enabledCount={countEnabled(['cloneAbility', 'perfectMemory', 'alwaysOnline', 'instantReply'])}
          totalCount={4}
          color="bg-blue-500"
        >
          <SuperpowerItem
            icon={Users}
            title="分身術"
            description="同時服務100+客戶，每位都獲得專屬關注"
            humanLimit="同時處理2-3個對話"
            aiPower="無限分身 同時服務100+客戶"
            enabled={settings.cloneAbility as boolean}
            onChange={(v) => updateSetting('cloneAbility', v)}
            stats={{ label: "已服務對話", value: superpowers?.totalConversationsHandled || 0 }}
          />
          <SuperpowerItem
            icon={History}
            title="時光倒流"
            description="100%完美記憶，3年前對話一字不漏"
            humanLimit="記得20%對話內容"
            aiPower="100%完美記憶 永不遺忘"
            enabled={settings.perfectMemory as boolean}
            onChange={(v) => updateSetting('perfectMemory', v)}
            stats={{ label: "記住客戶", value: superpowers?.customersRemembered || 0 }}
          />
          <SuperpowerItem
            icon={Wifi}
            title="24小時在線"
            description="永不休息，凌晨3點也能即時回覆"
            humanLimit="工作8小時"
            aiPower="24/7 永不休息"
            enabled={settings.alwaysOnline as boolean}
            onChange={(v) => updateSetting('alwaysOnline', v)}
            stats={{ label: "非工作時間訊息", value: superpowers?.afterHoursMessages || 0 }}
          />
          <SuperpowerItem
            icon={Timer}
            title="秒速回覆"
            description="2秒內即時回應，不讓客戶等待"
            humanLimit="幾分鐘回覆"
            aiPower="2秒 即時回應"
            enabled={settings.instantReply as boolean}
            onChange={(v) => updateSetting('instantReply', v)}
          />
        </SuperpowerCategory>

        {/* 🔮 預知未來 */}
        <SuperpowerCategory
          icon={Eye}
          title="預知未來"
          description="預測與風險預警能力"
          enabledCount={countEnabled(['needsPrediction', 'riskWarning', 'bestTiming'])}
          totalCount={3}
          color="bg-indigo-500"
        >
          <SuperpowerItem
            icon={TrendingUp}
            title="需求預測"
            description="78%準確率預測客戶未說出的需求"
            humanLimit="靠經驗直覺，40%準確"
            aiPower="78%準確 預測未說出的需求"
            enabled={settings.needsPrediction as boolean}
            onChange={(v) => updateSetting('needsPrediction', v)}
            stats={{ label: "準確預測", value: superpowers?.predictionsAccurate || 0 }}
          />
          <SuperpowerItem
            icon={AlertTriangle}
            title="風險預警"
            description="即時預警潛在風險，提前化解問題"
            humanLimit="事後才發現問題"
            aiPower="即時預警 提前化解風險"
            enabled={settings.riskWarning as boolean}
            onChange={(v) => updateSetting('riskWarning', v)}
          />
          <SuperpowerItem
            icon={Target}
            title="最佳時機"
            description="數據分析預測最佳跟進時間"
            humanLimit="靠感覺跟進"
            aiPower="數據分析 預測最佳時機"
            enabled={settings.bestTiming as boolean}
            onChange={(v) => updateSetting('bestTiming', v)}
          />
          
          {/* 跟進強度設定 */}
          {settings.bestTiming && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm">跟進強度</Label>
                <span className="text-sm text-muted-foreground">{settings.followUpIntensity}/5</span>
              </div>
              <Slider
                value={[settings.followUpIntensity as number]}
                onValueChange={([v]) => updateSetting('followUpIntensity', v)}
                min={1}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>溫和提醒</span>
                <span>積極跟進</span>
              </div>
            </div>
          )}
        </SuperpowerCategory>

        {/* 🌍 全球視野 */}
        <SuperpowerCategory
          icon={Globe}
          title="全球視野"
          description="信息收集與多語言能力"
          enabledCount={countEnabled(['marketRadar', 'multiLanguage', 'globalInfo'])}
          totalCount={3}
          color="bg-green-500"
        >
          <SuperpowerItem
            icon={Radio}
            title="即時市場雷達"
            description="24小時監控50+國家、1000+新聞源"
            humanLimit="每天2小時看新聞"
            aiPower="24小時 監控50+國家"
            enabled={settings.marketRadar as boolean}
            onChange={(v) => updateSetting('marketRadar', v)}
          />
          <SuperpowerItem
            icon={Languages}
            title="多語言瞬譯"
            description="50+種語言全部母語級別，無縫切換"
            humanLimit="精通2-3種語言"
            aiPower="50+種語言 母語級別"
            enabled={settings.multiLanguage as boolean}
            onChange={(v) => updateSetting('multiLanguage', v)}
          />
          <SuperpowerItem
            icon={Newspaper}
            title="全球資訊"
            description="即時獲取全球最新資訊和趨勢"
            humanLimit="資訊滯後1-2天"
            aiPower="即時更新 全球資訊"
            enabled={settings.globalInfo as boolean}
            onChange={(v) => updateSetting('globalInfo', v)}
          />
        </SuperpowerCategory>

        {/* 💬 讀心術 */}
        <SuperpowerCategory
          icon={MessageCircle}
          title="讀心術"
          description="情緒感知與溝通能力"
          enabledCount={countEnabled(['emotionSense', 'persuasionMaster', 'styleAdaptation'])}
          totalCount={3}
          color="bg-pink-500"
        >
          <SuperpowerItem
            icon={Heart}
            title="情緒透視"
            description="85%準確率從文字讀出客戶情緒"
            humanLimit="面對面才能讀表情"
            aiPower="85%準確 從文字讀出情緒"
            enabled={settings.emotionSense as boolean}
            onChange={(v) => updateSetting('emotionSense', v)}
          />
          <SuperpowerItem
            icon={Sparkles}
            title="說服大師"
            description="學習10萬+成功案例的說服技巧"
            humanLimit="需多年銷售經驗"
            aiPower="學習 10萬+成功案例"
            enabled={settings.persuasionMaster as boolean}
            onChange={(v) => updateSetting('persuasionMaster', v)}
          />
          <SuperpowerItem
            icon={Palette}
            title="風格適應"
            description="自動適應客戶溝通風格，建立共鳴"
            humanLimit="需刻意練習"
            aiPower="自動適應 每位客戶風格"
            enabled={settings.styleAdaptation as boolean}
            onChange={(v) => updateSetting('styleAdaptation', v)}
          />
          
          {/* 說服風格設定 */}
          {settings.persuasionMaster && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label className="text-sm">說服風格</Label>
              <Select 
                value={settings.persuasionStyle as string} 
                onValueChange={(v) => updateSetting('persuasionStyle', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">溫和說服</SelectItem>
                  <SelectItem value="balanced">平衡風格</SelectItem>
                  <SelectItem value="aggressive">積極說服</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SuperpowerCategory>
      </div>

      {/* 成就徽章 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            成就徽章
          </CardTitle>
          <CardDescription>
            使用超能力解鎖特殊成就
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                unlocked={achievement.unlocked}
                color={achievement.color}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">超能力使用提示</h4>
              <p className="text-sm text-blue-700 mt-1">
                啟用的超能力會自動整合到AI的回應中。部分高級超能力（如即時研究報告）可能需要更多處理時間。
                建議根據您的業務需求選擇性啟用，以獲得最佳效果。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部保存按鈕 */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "保存中..." : "保存所有設定"}
        </Button>
      </div>
    </div>
  );
}
