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
  profilePhotoUrl: text("profilePhotoUrl"),
  tagline: varchar("tagline", { length: 255 }),
  suggestedQuestions: text("suggestedQuestions"), // JSON array of suggested questions
  showQuickButtons: boolean("showQuickButtons").default(true).notNull(),
  buttonDisplayMode: varchar("buttonDisplayMode", { length: 20 }).default("full").notNull(), // 'full' | 'icon' | 'compact'
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
  fileUrl: varchar("fileUrl", { length: 512 }),
  fileKey: varchar("fileKey", { length: 512 }),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  content: text("content"),
  status: mysqlEnum("status", ["processing", "ready", "error"]).default("processing").notNull(),
  
  // Knowledge source type and metadata
  sourceType: mysqlEnum("sourceType", ["file", "youtube", "webpage", "text", "faq"]).default("file").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }), // Original URL for youtube/webpage
  sourceMeta: text("sourceMeta"), // JSON metadata (video title, duration, webpage title, etc.)
  
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


/**
 * Teams table for team/company plans
 * 團隊/公司表
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 512 }),
  ownerId: int("ownerId").notNull(), // 團隊擁有者的userId
  
  // 團隊計劃
  plan: mysqlEnum("plan", ["team_basic", "team_pro", "enterprise"]).default("team_basic").notNull(),
  maxMembers: int("maxMembers").default(5).notNull(),
  
  // 團隊狀態
  status: mysqlEnum("status", ["active", "suspended", "cancelled"]).default("active").notNull(),
  
  // Stripe整合
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Team members table
 * 團隊成員表
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  
  // 成員角色
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  
  // 知識訪問權限
  knowledgeAccess: mysqlEnum("knowledgeAccess", ["full", "partial", "none"]).default("full").notNull(),
  
  // 邀請狀態
  inviteStatus: mysqlEnum("inviteStatus", ["pending", "accepted", "declined"]).default("accepted").notNull(),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 64 }),
  
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Team knowledge base (Team Brain)
 * 團隊知識庫（團隊大腦）
 */
export const teamKnowledge = mysqlTable("team_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  
  // 知識分類
  category: mysqlEnum("category", [
    "company_info",    // 公司資料
    "products",        // 產品目錄
    "services",        // 服務項目
    "history",         // 公司歷史
    "faq",             // 常見問題
    "sales_scripts",   // 銷售話術
    "case_studies",    // 案例研究
    "policies",        // 政策規定
    "training",        // 培訓資料
    "other"            // 其他
  ]).default("other").notNull(),
  
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  
  // 分享設定
  isShared: boolean("isShared").default(true).notNull(), // 是否分享給成員
  
  // 創建者
  createdBy: int("createdBy").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamKnowledge = typeof teamKnowledge.$inferSelect;
export type InsertTeamKnowledge = typeof teamKnowledge.$inferInsert;

/**
 * Team knowledge access control
 * 團隊知識訪問權限控制（細粒度）
 */
export const teamKnowledgeAccess = mysqlTable("team_knowledge_access", {
  id: int("id").autoincrement().primaryKey(),
  knowledgeId: int("knowledgeId").notNull(),
  memberId: int("memberId").notNull(),
  canAccess: boolean("canAccess").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamKnowledgeAccess = typeof teamKnowledgeAccess.$inferSelect;
export type InsertTeamKnowledgeAccess = typeof teamKnowledgeAccess.$inferInsert;

/**
 * Team plan limits configuration
 * 團隊計劃限額配置
 */
export const TEAM_PLAN_LIMITS = {
  team_basic: {
    maxMembers: 5,
    knowledgeBaseSizeMB: 100,
    knowledgeBaseItems: 50,
    monthlyPrice: 299,
    features: [
      "團隊大腦（共享知識庫）",
      "最多5位成員",
      "基本成員管理",
      "團隊統計報表",
    ],
  },
  team_pro: {
    maxMembers: 15,
    knowledgeBaseSizeMB: 500,
    knowledgeBaseItems: 200,
    monthlyPrice: 599,
    features: [
      "團隊大腦（進階知識庫）",
      "最多15位成員",
      "進階權限控制",
      "細粒度知識分享",
      "詳細數據分析",
      "優先客服支援",
    ],
  },
  enterprise: {
    maxMembers: -1, // 無限制
    knowledgeBaseSizeMB: 2000,
    knowledgeBaseItems: -1, // 無限制
    monthlyPrice: 1299,
    features: [
      "團隊大腦（企業級知識庫）",
      "無限成員",
      "完整權限控制",
      "API存取",
      "自訂整合",
      "專屬客戶經理",
      "SLA保證",
    ],
  },
} as const;

export type TeamPlanType = keyof typeof TEAM_PLAN_LIMITS;
export type TeamPlanLimits = typeof TEAM_PLAN_LIMITS[TeamPlanType];


/**
 * Customer profiles - stores customer information for memory feature
 * 客戶檔案 - 儲存客戶資料以實現記憶功能
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull(), // Which AI persona this customer belongs to
  
  // Customer identification
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // Primary identifier
  fingerprint: varchar("fingerprint", { length: 128 }), // Browser fingerprint for cross-session identification
  
  // Customer basic info (collected during conversations)
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 200 }),
  title: varchar("title", { length: 100 }), // Job title
  
  // Customer preferences and notes
  preferredLanguage: varchar("preferredLanguage", { length: 20 }).default("zh-TW"),
  tags: text("tags"), // JSON array of tags for categorization
  notes: text("notes"), // Manual notes about the customer
  
  // Engagement metrics
  totalConversations: int("totalConversations").default(0).notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  lastVisitAt: timestamp("lastVisitAt"),
  firstVisitAt: timestamp("firstVisitAt").defaultNow().notNull(),
  
  // Customer sentiment and status
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  status: mysqlEnum("status", ["active", "inactive", "blocked"]).default("active").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Customer memories - stores important information extracted from conversations
 * 客戶記憶 - 儲存從對話中提取的重要資訊
 */
export const customerMemories = mysqlTable("customer_memories", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  
  // Memory type and content
  memoryType: mysqlEnum("memoryType", [
    "preference",    // 偏好（如：喜歡的產品類型）
    "fact",          // 事實（如：家庭成員數量）
    "need",          // 需求（如：正在尋找的解決方案）
    "concern",       // 顧慮（如：預算限制）
    "interaction",   // 互動記錄（如：曾經投訴過）
    "purchase",      // 購買記錄
    "feedback",      // 反饋意見
    "custom"         // 自定義
  ]).default("fact").notNull(),
  
  // Memory content
  key: varchar("key", { length: 100 }).notNull(), // e.g., "budget", "family_size", "preferred_product"
  value: text("value").notNull(), // The actual memory content
  confidence: int("confidence").default(80).notNull(), // Confidence level 0-100
  
  // Source tracking
  sourceConversationId: int("sourceConversationId"), // Which conversation this memory came from
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
  
  // Memory management
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"), // Optional expiration for time-sensitive memories
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerMemory = typeof customerMemories.$inferSelect;
export type InsertCustomerMemory = typeof customerMemories.$inferInsert;

/**
 * Customer conversation summaries - stores summarized conversation history
 * 客戶對話摘要 - 儲存對話歷史摘要
 */
export const customerConversationSummaries = mysqlTable("customer_conversation_summaries", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  
  // Conversation summary
  summary: text("summary").notNull(), // AI-generated summary of the conversation
  keyTopics: text("keyTopics"), // JSON array of main topics discussed
  questionsAsked: text("questionsAsked"), // JSON array of questions the customer asked
  
  // Conversation metrics
  messageCount: int("messageCount").default(0).notNull(),
  duration: int("duration"), // Duration in seconds
  
  // Outcome tracking
  outcome: mysqlEnum("outcome", [
    "resolved",      // 問題已解決
    "pending",       // 待跟進
    "escalated",     // 已升級
    "converted",     // 已轉化（購買/註冊等）
    "abandoned"      // 客戶離開
  ]).default("pending"),
  
  conversationDate: timestamp("conversationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerConversationSummary = typeof customerConversationSummaries.$inferSelect;
export type InsertCustomerConversationSummary = typeof customerConversationSummaries.$inferInsert;


/**
 * User custom domains - stores domain configuration for custom URLs
 * 用戶自訂域名 - 儲存專屬網址的域名配置
 * 
 * 域名管理費: HK$99/年
 * 包含: 自動 SSL、DNS 監控、到期提醒
 */
export const userDomains = mysqlTable("user_domains", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Domain information
  domain: varchar("domain", { length: 255 }).notNull(), // e.g., "chat.mycompany.com"
  subdomain: varchar("subdomain", { length: 100 }), // e.g., "chat" (if using subdomain)
  rootDomain: varchar("rootDomain", { length: 255 }).notNull(), // e.g., "mycompany.com"
  
  // Domain status
  status: mysqlEnum("status", [
    "pending_dns",     // 等待 DNS 設定
    "verifying",       // 正在驗證
    "active",          // 已啟用
    "ssl_pending",     // SSL 配置中
    "expired",         // 已過期
    "error"            // 錯誤
  ]).default("pending_dns").notNull(),
  
  // DNS verification
  dnsVerified: boolean("dnsVerified").default(false).notNull(),
  dnsVerifiedAt: timestamp("dnsVerifiedAt"),
  dnsRecordType: mysqlEnum("dnsRecordType", ["CNAME", "A"]).default("CNAME"),
  dnsRecordValue: varchar("dnsRecordValue", { length: 255 }), // Target value for DNS record
  verificationToken: varchar("verificationToken", { length: 64 }), // For TXT record verification
  
  // SSL status
  sslEnabled: boolean("sslEnabled").default(false).notNull(),
  sslIssuedAt: timestamp("sslIssuedAt"),
  sslExpiresAt: timestamp("sslExpiresAt"),
  
  // Subscription and billing
  subscriptionStatus: mysqlEnum("subscriptionStatus", [
    "trial",           // 試用期
    "active",          // 已付費
    "expired",         // 已過期
    "cancelled"        // 已取消
  ]).default("trial").notNull(),
  subscriptionStartAt: timestamp("subscriptionStartAt"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  annualFee: int("annualFee").default(99).notNull(), // HK$99/年
  
  // Monitoring
  lastHealthCheck: timestamp("lastHealthCheck"),
  healthStatus: mysqlEnum("healthStatus", ["healthy", "warning", "error"]).default("healthy"),
  lastErrorMessage: text("lastErrorMessage"),
  
  // Notifications
  expiryNotificationSent: boolean("expiryNotificationSent").default(false).notNull(),
  dnsErrorNotificationSent: boolean("dnsErrorNotificationSent").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDomain = typeof userDomains.$inferSelect;
export type InsertUserDomain = typeof userDomains.$inferInsert;

/**
 * Domain health check logs - stores DNS and SSL check history
 * 域名健康檢查記錄
 */
export const domainHealthLogs = mysqlTable("domain_health_logs", {
  id: int("id").autoincrement().primaryKey(),
  domainId: int("domainId").notNull(),
  
  // Check type and result
  checkType: mysqlEnum("checkType", ["dns", "ssl", "http"]).notNull(),
  status: mysqlEnum("status", ["success", "warning", "error"]).notNull(),
  
  // Check details
  responseTime: int("responseTime"), // Response time in ms
  details: text("details"), // JSON with detailed check results
  errorMessage: text("errorMessage"),
  
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
});

export type DomainHealthLog = typeof domainHealthLogs.$inferSelect;
export type InsertDomainHealthLog = typeof domainHealthLogs.$inferInsert;

/**
 * Domain orders - stores domain purchase orders
 * 域名訂單 - 儲存域名購買訂單
 */
export const domainOrders = mysqlTable("domain_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Domain information
  domain: varchar("domain", { length: 255 }).notNull(), // e.g., "mycompany.com"
  tld: varchar("tld", { length: 20 }).notNull(), // e.g., ".com"
  registrar: varchar("registrar", { length: 100 }).default("namecom").notNull(), // Domain registrar
  registrarOrderId: varchar("registrarOrderId", { length: 255 }), // Order ID from registrar (e.g., Name.com)
  
  // Pricing
  domainPrice: int("domainPrice").notNull(), // Price in HK cents (e.g., 1001 = HK$10.01)
  managementFee: int("managementFee").default(9900).notNull(), // HK$99/year in cents
  totalPrice: int("totalPrice").notNull(), // Total price in HK cents
  currency: varchar("currency", { length: 3 }).default("HKD").notNull(),
  
  // Payment information
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // Stripe payment intent ID
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }), // Stripe invoice ID
  
  // Order status
  status: mysqlEnum("status", [
    "pending_payment",    // 待支付
    "payment_processing", // 支付處理中
    "payment_failed",     // 支付失敗
    "payment_completed",  // 支付完成
    "registering",        // 正在註冊
    "registered",         // 已註冊
    "failed",             // 註冊失敗
    "cancelled"           // 已取消
  ]).default("pending_payment").notNull(),
  
  // Registration details
  registrationDate: timestamp("registrationDate"), // When domain was registered
  expirationDate: timestamp("expirationDate"), // Domain expiration date
  autoRenewal: boolean("autoRenewal").default(true).notNull(),
  
  // Error tracking
  lastErrorMessage: text("lastErrorMessage"),
  failureReason: text("failureReason"),
  
  // DNS and SSL Configuration (Cloudflare)
  dnsStatus: mysqlEnum("dnsStatus", [
    "pending",           // 待配置
    "configuring",       // 配置中
    "propagating",       // DNS 傳播中
    "active",            // 已生效
    "error"              // 配置失敗
  ]).default("pending").notNull(),
  sslStatus: mysqlEnum("sslStatus", [
    "pending",           // 待申請
    "provisioning",      // 申請中
    "active",            // 已生效
    "error"              // 申請失敗
  ]).default("pending").notNull(),
  cloudflareZoneId: varchar("cloudflareZoneId", { length: 64 }), // Cloudflare Zone ID
  cloudflareCnameRecordId: varchar("cloudflareCnameRecordId", { length: 64 }), // CNAME record ID
  nameservers: text("nameservers"), // JSON array of nameservers
  targetHost: varchar("targetHost", { length: 255 }).default("lulubaby.manus.space"), // Target host for CNAME
  lastDnsCheck: timestamp("lastDnsCheck"), // Last DNS propagation check
  lastSslCheck: timestamp("lastSslCheck"), // Last SSL status check
  dnsErrorMessage: text("dnsErrorMessage"), // DNS configuration error
  sslErrorMessage: text("sslErrorMessage"), // SSL configuration error
  
  // Domain Binding and Publishing
  personaId: int("personaId"), // Bound AI persona ID (null if not bound)
  isPublished: boolean("isPublished").default(false).notNull(), // Whether domain is published
  publishedAt: timestamp("publishedAt"), // When domain was published
  
  // Metadata
  metadata: text("metadata"), // JSON with additional info
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DomainOrder = typeof domainOrders.$inferSelect;
export type InsertDomainOrder = typeof domainOrders.$inferInsert;

/**
 * Stripe payments - stores Stripe payment records
 * Stripe 支付記錄
 */
export const stripePayments = mysqlTable("stripe_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Stripe IDs
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  
  // Payment details
  amount: int("amount").notNull(), // Amount in HK cents
  currency: varchar("currency", { length: 3 }).default("HKD").notNull(),
  description: text("description"),
  
  // Payment status
  status: mysqlEnum("status", [
    "requires_payment_method",
    "requires_confirmation",
    "requires_action",
    "processing",
    "requires_capture",
    "canceled",
    "succeeded"
  ]).notNull(),
  
  // Related entity
  relatedType: mysqlEnum("relatedType", [
    "domain_order",
    "subscription",
    "other"
  ]).default("domain_order"),
  relatedId: int("relatedId"), // ID of related entity (e.g., domain_orders.id)
  
  // Metadata
  metadata: text("metadata"), // JSON with additional info
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StripePayment = typeof stripePayments.$inferSelect;
export type InsertStripePayment = typeof stripePayments.$inferInsert;
