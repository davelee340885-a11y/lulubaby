import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * AI Persona configuration for each user
 * Includes layout and appearance settings for the chat page
 */
export const aiPersonas = mysqlTable("ai_personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  agentName: varchar("agentName", { length: 100 }).default("AI Assistant").notNull(),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  welcomeMessage: text("welcomeMessage"),
  systemPrompt: text("systemPrompt"),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#3B82F6"),
  
  // Layout and appearance settings
  layoutStyle: mysqlEnum("layoutStyle", ["minimal", "professional", "custom"]).default("minimal").notNull(),
  backgroundImageUrl: varchar("backgroundImageUrl", { length: 512 }),
  profilePhotoUrl: varchar("profilePhotoUrl", { length: 512 }),
  tagline: varchar("tagline", { length: 255 }),
  suggestedQuestions: text("suggestedQuestions"), // JSON array of suggested questions
  showQuickButtons: boolean("showQuickButtons").default(true).notNull(),
  chatPlaceholder: varchar("chatPlaceholder", { length: 255 }).default("輸入您的問題..."),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiPersona = typeof aiPersonas.$inferSelect;
export type InsertAiPersona = typeof aiPersonas.$inferInsert;

/**
 * Knowledge base files uploaded by users
 */
export const knowledgeBases = mysqlTable("knowledge_bases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  content: text("content"),
  status: mysqlEnum("status", ["processing", "ready", "error"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;

/**
 * Quick action buttons configuration
 */
export const quickButtons = mysqlTable("quick_buttons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  actionType: mysqlEnum("actionType", ["query", "link", "booking", "product", "profile", "company", "catalog", "contact", "faq", "custom"]).default("query").notNull(),
  actionValue: text("actionValue"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuickButton = typeof quickButtons.$inferSelect;
export type InsertQuickButton = typeof quickButtons.$inferInsert;

/**
 * Conversation history
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * AI Training configuration - 8 dimensions with 1-5 ratings
 * 訓練智能體 - 8大維度評分系統
 */
export const aiTraining = mysqlTable("ai_training", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // 當前使用的人設模板
  activePersonaTemplate: varchar("activePersonaTemplate", { length: 50 }),
  
  // 💬 說話風格 (Speaking Style) - 6 items
  humorLevel: int("humorLevel").default(3).notNull(), // 幽默度 1-5
  friendlinessLevel: int("friendlinessLevel").default(3).notNull(), // 親切度 1-5
  formalityLevel: int("formalityLevel").default(3).notNull(), // 正式度 1-5
  enthusiasmLevel: int("enthusiasmLevel").default(3).notNull(), // 熱情度 1-5
  patienceLevel: int("patienceLevel").default(3).notNull(), // 耐心度 1-5
  empathyLevel: int("empathyLevel").default(3).notNull(), // 同理心 1-5
  
  // 📝 回應方式 (Response Method) - 6 items
  responseLength: int("responseLength").default(3).notNull(), // 回覆長度 1-5
  responseDepth: int("responseDepth").default(3).notNull(), // 回覆深度 1-5
  exampleUsage: int("exampleUsage").default(3).notNull(), // 舉例頻率 1-5
  dataUsage: int("dataUsage").default(3).notNull(), // 數據使用 1-5
  metaphorUsage: int("metaphorUsage").default(3).notNull(), // 比喻使用 1-5
  structuredResponse: int("structuredResponse").default(3).notNull(), // 結構化程度 1-5
  
  // 🤝 溝通態度 (Communication Attitude) - 6 items
  proactiveness: int("proactiveness").default(3).notNull(), // 主動性 1-5
  questioningStyle: int("questioningStyle").default(3).notNull(), // 提問頻率 1-5
  suggestionFrequency: int("suggestionFrequency").default(3).notNull(), // 建議頻率 1-5
  humilityLevel: int("humilityLevel").default(3).notNull(), // 謙遜度 1-5
  persistenceLevel: int("persistenceLevel").default(3).notNull(), // 堅持度 1-5
  careLevel: int("careLevel").default(3).notNull(), // 關心度 1-5
  
  // 💼 銷售風格 (Sales Style) - 6 items
  pushIntensity: int("pushIntensity").default(3).notNull(), // 推銷強度 1-5
  urgencyCreation: int("urgencyCreation").default(3).notNull(), // 緊迫感 1-5
  priceSensitivity: int("priceSensitivity").default(3).notNull(), // 價格敏感度 1-5
  comparisonUsage: int("comparisonUsage").default(3).notNull(), // 比較使用 1-5
  closingIntensity: int("closingIntensity").default(3).notNull(), // 成交強度 1-5
  followUpFrequency: int("followUpFrequency").default(3).notNull(), // 跟進頻率 1-5
  
  // 🎓 專業表現 (Professional Performance) - 6 items
  terminologyUsage: int("terminologyUsage").default(3).notNull(), // 術語使用 1-5
  regulationAwareness: int("regulationAwareness").default(3).notNull(), // 法規意識 1-5
  riskWarningLevel: int("riskWarningLevel").default(3).notNull(), // 風險提示 1-5
  caseStudyUsage: int("caseStudyUsage").default(3).notNull(), // 案例使用 1-5
  marketAnalysis: int("marketAnalysis").default(3).notNull(), // 市場分析 1-5
  educationalContent: int("educationalContent").default(3).notNull(), // 教育內容 1-5
  
  // 😊 情緒處理 (Emotion Handling) - 6 items
  soothingAbility: int("soothingAbility").default(3).notNull(), // 安撫能力 1-5
  praiseFrequency: int("praiseFrequency").default(3).notNull(), // 讚美頻率 1-5
  encouragementLevel: int("encouragementLevel").default(3).notNull(), // 鼓勵程度 1-5
  negativeHandling: int("negativeHandling").default(3).notNull(), // 負面處理 1-5
  optimismLevel: int("optimismLevel").default(3).notNull(), // 樂觀程度 1-5
  humorInTension: int("humorInTension").default(3).notNull(), // 緊張時幽默 1-5
  
  // 🗣️ 語言習慣 (Language Habits) - 6 items
  emojiUsage: int("emojiUsage").default(3).notNull(), // Emoji使用 1-5
  colloquialLevel: int("colloquialLevel").default(3).notNull(), // 口語化程度 1-5
  cantoneseUsage: int("cantoneseUsage").default(3).notNull(), // 廣東話使用 1-5
  englishMixing: int("englishMixing").default(3).notNull(), // 中英夾雜 1-5
  exclamationUsage: int("exclamationUsage").default(3).notNull(), // 感嘆詞使用 1-5
  addressingStyle: int("addressingStyle").default(3).notNull(), // 稱呼方式 1-5
  
  // ⚠️ 服務邊界 (Service Boundaries) - 6 items
  topicRange: int("topicRange").default(3).notNull(), // 話題範圍 1-5
  privacyAwareness: int("privacyAwareness").default(3).notNull(), // 隱私意識 1-5
  promiseCaution: int("promiseCaution").default(3).notNull(), // 承諾謹慎 1-5
  referralWillingness: int("referralWillingness").default(3).notNull(), // 轉介意願 1-5
  uncertaintyHandling: int("uncertaintyHandling").default(3).notNull(), // 不確定處理 1-5
  complaintHandling: int("complaintHandling").default(3).notNull(), // 投訴處理 1-5
  
  // ✍️ 自訂指令 (Custom Instructions)
  behaviorInstructions: text("behaviorInstructions"), // AI行為指令
  prohibitedActions: text("prohibitedActions"), // 絕對禁止事項
  customGreeting: text("customGreeting"), // 自訂開場白
  customClosing: text("customClosing"), // 自訂結束語
  customPhrases: text("customPhrases"), // 常用句式 JSON array
  
  // 訓練進度
  trainingProgress: int("trainingProgress").default(0).notNull(), // 訓練完成度 0-100
  intelligenceScore: int("intelligenceScore").default(50).notNull(), // 智能指數 0-100
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiTraining = typeof aiTraining.$inferSelect;
export type InsertAiTraining = typeof aiTraining.$inferInsert;

/**
 * AI Superpowers configuration
 * 開發超能力 - Toggle開關設定
 */
export const superpowers = mysqlTable("superpowers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // 🧠 超級大腦 (Super Brain)
  instantResearch: boolean("instantResearch").default(false).notNull(), // 即時研究報告
  globalComparison: boolean("globalComparison").default(false).notNull(), // 全球產品比較
  legalInterpretation: boolean("legalInterpretation").default(false).notNull(), // 即時法規解讀
  caseSearch: boolean("caseSearch").default(false).notNull(), // 案例庫搜索
  
  // ⏰ 時間掌控 (Time Control)
  cloneAbility: boolean("cloneAbility").default(true).notNull(), // 分身術
  perfectMemory: boolean("perfectMemory").default(true).notNull(), // 時光倒流/完美記憶
  alwaysOnline: boolean("alwaysOnline").default(true).notNull(), // 24小時在線
  instantReply: boolean("instantReply").default(true).notNull(), // 秒速回覆
  
  // 🔮 預知未來 (Future Prediction)
  needsPrediction: boolean("needsPrediction").default(false).notNull(), // 需求預測
  riskWarning: boolean("riskWarning").default(false).notNull(), // 風險預警
  bestTiming: boolean("bestTiming").default(false).notNull(), // 最佳時機
  
  // 🌍 全球視野 (Global Vision)
  marketRadar: boolean("marketRadar").default(false).notNull(), // 即時市場雷達
  multiLanguage: boolean("multiLanguage").default(true).notNull(), // 多語言瞬譯
  globalInfo: boolean("globalInfo").default(false).notNull(), // 全球資訊
  
  // 💬 讀心術 (Mind Reading)
  emotionSense: boolean("emotionSense").default(false).notNull(), // 情緒透視
  persuasionMaster: boolean("persuasionMaster").default(false).notNull(), // 說服大師
  styleAdaptation: boolean("styleAdaptation").default(false).notNull(), // 風格適應
  
  // Settings for specific superpowers
  researchDepth: mysqlEnum("researchDepth", ["quick", "standard", "deep"]).default("standard"), // 研究報告深度
  followUpIntensity: int("followUpIntensity").default(3), // 跟進強度 1-5
  persuasionStyle: mysqlEnum("persuasionStyle", ["gentle", "balanced", "aggressive"]).default("balanced"), // 說服風格
  
  // Superpower level and stats
  superpowerLevel: int("superpowerLevel").default(1).notNull(), // 超能力等級 1-5
  totalConversationsHandled: int("totalConversationsHandled").default(0).notNull(),
  customersRemembered: int("customersRemembered").default(0).notNull(),
  afterHoursMessages: int("afterHoursMessages").default(0).notNull(),
  researchReportsGenerated: int("researchReportsGenerated").default(0).notNull(),
  predictionsAccurate: int("predictionsAccurate").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Superpower = typeof superpowers.$inferSelect;
export type InsertSuperpower = typeof superpowers.$inferInsert;


/**
 * Subscription plans for users
 * 用戶訂閱計劃
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // 計劃類型
  plan: mysqlEnum("plan", ["free", "basic", "premium"]).default("free").notNull(),
  
  // 訂閱狀態
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due"]).default("active").notNull(),
  
  // 訂閱期間
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  
  // Stripe整合（未來使用）
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  
  // 取消信息
  cancelledAt: timestamp("cancelledAt"),
  cancelReason: text("cancelReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Daily usage logs for tracking limits
 * 每日使用量記錄
 */
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // 日期（用於每日限額追蹤）
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  
  // 對話統計
  messageCount: int("messageCount").default(0).notNull(), // 當日對話數
  tokenCount: int("tokenCount").default(0).notNull(), // 當日Token數（估算）
  
  // 知識庫統計
  knowledgeBaseSizeBytes: int("knowledgeBaseSizeBytes").default(0).notNull(), // 知識庫總大小
  knowledgeBaseFileCount: int("knowledgeBaseFileCount").default(0).notNull(), // 知識庫文件數
  
  // Widget統計
  widgetViews: int("widgetViews").default(0).notNull(), // Widget瀏覽次數
  widgetConversations: int("widgetConversations").default(0).notNull(), // Widget對話數
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

/**
 * Plan limits configuration
 * 計劃限額配置（常量，不存數據庫）
 */
export const PLAN_LIMITS = {
  free: {
    dailyMessages: 20,
    monthlyMessages: 300,
    knowledgeBaseSizeMB: 1,
    knowledgeBaseFiles: 3,
    conversationRetentionDays: 7,
    superpowersEnabled: false,
    widgetEnabled: false,
    customDomain: false,
    trainingDimensions: 2, // 只能調整2個維度
    analyticsLevel: 'basic' as const,
  },
  basic: {
    dailyMessages: 200,
    monthlyMessages: 6000,
    knowledgeBaseSizeMB: 50,
    knowledgeBaseFiles: 20,
    conversationRetentionDays: 90,
    superpowersEnabled: true, // 5項基礎超能力
    widgetEnabled: true,
    customDomain: false,
    trainingDimensions: 8, // 全部8個維度
    analyticsLevel: 'detailed' as const,
  },
  premium: {
    dailyMessages: -1, // -1 = 無限制
    monthlyMessages: 50000, // 公平使用上限
    knowledgeBaseSizeMB: 500,
    knowledgeBaseFiles: 100,
    conversationRetentionDays: -1, // -1 = 永久
    superpowersEnabled: true, // 全部17項
    widgetEnabled: true,
    customDomain: true,
    trainingDimensions: 8,
    analyticsLevel: 'advanced' as const,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
export type PlanLimits = typeof PLAN_LIMITS[PlanType];
