import { eq, and, asc, desc, sql, count, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2"; 
import { 
  InsertUser, users, 
  aiPersonas, InsertAiPersona, AiPersona,
  knowledgeBases, InsertKnowledgeBase, KnowledgeBase,
  quickButtons, InsertQuickButton, QuickButton,
  conversations, InsertConversation, Conversation,
  customerUsers, InsertCustomerUser, CustomerUser
} from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from "bcryptjs";
import { customAlphabet } from 'nanoid';

// 推薦碼生成器：6 位大寫字母+數字，排除易混淆字符 (O/0, I/1/L)
const nanoidReferral = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export function generateReferralCode(): string {
  return `LULU-${nanoidReferral()}`;
}

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Force fresh connection with schema
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Operations ====================
export async function upsertUser(user: Partial<InsertUser> & { openId?: string; email?: string }): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // For Manus OAuth users, use openId as identifier
    // For email/password users, use email as identifier
    // Generate a unique subdomain for new users
    let newSubdomain: string | undefined;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRandomSubdomain();
      const available = await isSubdomainAvailable(candidate);
      if (available) {
        newSubdomain = candidate;
        break;
      }
    }

    const values: InsertUser = {
      name: user.name || "User",
      email: user.email || `${user.openId}@manus.local`, // Generate email for OAuth users
      openId: user.openId || null,
      loginMethod: user.loginMethod || (user.openId ? "manus" : "email"),
      passwordHash: user.passwordHash || null,
      role: user.role || "user",
      lastSignedIn: user.lastSignedIn || new Date(),
      subdomain: newSubdomain, // Auto-assign subdomain for new users
    };

    // Set admin role for owner
    if (user.openId && user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    const updateSet: Record<string, unknown> = {
      lastSignedIn: new Date(),
    };

    if (user.name) updateSet.name = user.name;
    if (user.loginMethod) updateSet.loginMethod = user.loginMethod;
    if (user.role) updateSet.role = user.role;

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByReferralCode(referralCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
  return result[0] || undefined;
}

// ==================== AI Persona Operations ====================
export async function getPersonaByUserId(userId: number): Promise<AiPersona | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiPersonas).where(eq(aiPersonas.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPersonaById(id: number): Promise<AiPersona | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiPersonas).where(eq(aiPersonas.id, id)).limit(1);
  console.log('[getPersonaById] id:', id, 'result:', result[0] ? { welcomeMessageColor: result[0].welcomeMessageColor, welcomeMessageSize: result[0].welcomeMessageSize } : 'not found');
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertPersona(data: InsertAiPersona): Promise<AiPersona | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(aiPersonas).values(data).onDuplicateKeyUpdate({
    set: {
      agentName: data.agentName,
      avatarUrl: data.avatarUrl,
      welcomeMessage: data.welcomeMessage,
      welcomeMessageColor: data.welcomeMessageColor,
      welcomeMessageSize: data.welcomeMessageSize,
      systemPrompt: data.systemPrompt,
      primaryColor: data.primaryColor,
      layoutStyle: data.layoutStyle,
      backgroundType: data.backgroundType,
      backgroundColor: data.backgroundColor,
      backgroundImageUrl: data.backgroundImageUrl,
      backgroundSize: data.backgroundSize,
      backgroundPosition: data.backgroundPosition,
      backgroundRepeat: data.backgroundRepeat,
      immersiveMode: data.immersiveMode,
      profilePhotoUrl: data.profilePhotoUrl,
      tagline: data.tagline,
      suggestedQuestions: data.suggestedQuestions,
      showQuickButtons: data.showQuickButtons,
      buttonDisplayMode: data.buttonDisplayMode,
      chatPlaceholder: data.chatPlaceholder,
    },
  });

  return getPersonaByUserId(data.userId);
}

// ==================== Knowledge Base Operations ====================
export async function getKnowledgeBasesByUserId(userId: number): Promise<KnowledgeBase[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBases).where(eq(knowledgeBases.userId, userId));
}

export async function createKnowledgeBase(data: InsertKnowledgeBase): Promise<KnowledgeBase | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(knowledgeBases).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

export async function updateKnowledgeBase(id: number, userId: number, data: Partial<InsertKnowledgeBase>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(knowledgeBases)
    .set(data)
    .where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)));
}

export async function deleteKnowledgeBase(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(knowledgeBases)
    .where(and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId)));
}

/**
 * Get all knowledge content for a user (no DB limit).
 * Returns full content with labels, ordered by newest first.
 * The caller is responsible for applying plan-based limits.
 */
export async function getKnowledgeContentByUserId(userId: number): Promise<{ content: string; totalChars: number }> {
  const db = await getDb();
  if (!db) return { content: "", totalChars: 0 };
  
  // DB query: no limit, fetch ALL knowledge base entries, newest first
  const files = await db.select({ 
    fileName: knowledgeBases.fileName,
    content: knowledgeBases.content,
    sourceType: knowledgeBases.sourceType,
  })
    .from(knowledgeBases)
    .where(and(eq(knowledgeBases.userId, userId), eq(knowledgeBases.status, "ready")))
    .orderBy(desc(knowledgeBases.id));
  
  // Build content with labels, no truncation at DB level
  let result = '';
  for (const f of files) {
    if (!f.content) continue;
    const label = `【${f.fileName || f.sourceType}】`;
    result += `${label}\n${f.content}\n\n`;
  }
  return { content: result, totalChars: result.length };
}

// ==================== Quick Button Operations ====================
export async function getQuickButtonsByUserId(userId: number): Promise<QuickButton[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quickButtons)
    .where(eq(quickButtons.userId, userId))
    .orderBy(asc(quickButtons.sortOrder));
}

export async function createQuickButton(data: InsertQuickButton): Promise<QuickButton | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(quickButtons).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(quickButtons).where(eq(quickButtons.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

export async function updateQuickButton(id: number, userId: number, data: Partial<InsertQuickButton>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(quickButtons)
    .set(data)
    .where(and(eq(quickButtons.id, id), eq(quickButtons.userId, userId)));
}

export async function deleteQuickButton(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(quickButtons)
    .where(and(eq(quickButtons.id, id), eq(quickButtons.userId, userId)));
}

// ==================== Conversation Operations ====================
export async function getConversationsBySession(personaId: number, sessionId: string): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(and(eq(conversations.personaId, personaId), eq(conversations.sessionId, sessionId)))
    .orderBy(asc(conversations.createdAt));
}

export async function createConversation(data: InsertConversation): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(conversations).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(conversations).where(eq(conversations.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

// ==================== Analytics Operations ====================
export type AnalyticsStats = {
  totalConversations: number;
  totalSessions: number;
  todayConversations: number;
  weekConversations: number;
};

export async function getAnalyticsStats(personaId: number): Promise<AnalyticsStats> {
  const db = await getDb();
  if (!db) return { totalConversations: 0, totalSessions: 0, todayConversations: 0, weekConversations: 0 };
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Total conversations (user messages only)
  const totalResult = await db.select({ count: count() })
    .from(conversations)
    .where(and(eq(conversations.personaId, personaId), eq(conversations.role, "user")));
  const totalConversations = totalResult[0]?.count || 0;
  
  // Unique sessions
  const sessionsResult = await db.select({ sessionId: conversations.sessionId })
    .from(conversations)
    .where(eq(conversations.personaId, personaId))
    .groupBy(conversations.sessionId);
  const totalSessions = sessionsResult.length;
  
  // Today's conversations
  const todayResult = await db.select({ count: count() })
    .from(conversations)
    .where(and(
      eq(conversations.personaId, personaId),
      eq(conversations.role, "user"),
      gte(conversations.createdAt, todayStart)
    ));
  const todayConversations = todayResult[0]?.count || 0;
  
  // This week's conversations
  const weekResult = await db.select({ count: count() })
    .from(conversations)
    .where(and(
      eq(conversations.personaId, personaId),
      eq(conversations.role, "user"),
      gte(conversations.createdAt, weekStart)
    ));
  const weekConversations = weekResult[0]?.count || 0;
  
  return { totalConversations, totalSessions, todayConversations, weekConversations };
}

export type DailyStats = {
  date: string;
  count: number;
};

export async function getDailyStats(personaId: number, days: number = 7): Promise<DailyStats[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Use raw SQL to avoid GROUP BY issues with MySQL strict mode
  const rawResult = await db.execute(
    sql`SELECT DATE(createdAt) as date, COUNT(*) as count 
        FROM conversations 
        WHERE personaId = ${personaId} 
        AND role = 'user' 
        AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt)`
  );
  
  // MySQL2 returns [rows, fields], extract rows
  const rows = Array.isArray(rawResult) && rawResult.length > 0 ? rawResult[0] : [];
  const result = (Array.isArray(rows) ? rows : []) as { date: string; count: number | bigint }[];
  
  // Fill in missing dates with 0
  const statsMap = new Map<string, number>();
  for (const r of result) {
    const dateVal = r.date as unknown;
    const dateStr = dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : String(r.date);
    statsMap.set(dateStr, Number(r.count));
  }
  
  const dailyStats: DailyStats[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    dailyStats.push({
      date: dateStr,
      count: statsMap.get(dateStr) || 0,
    });
  }
  
  return dailyStats;
}

export type PopularQuestion = {
  content: string;
  count: number;
};

export async function getPopularQuestions(personaId: number, limit: number = 10): Promise<PopularQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get user messages and group similar ones
  const result = await db.select({
    content: conversations.content,
    count: count(),
  })
    .from(conversations)
    .where(and(
      eq(conversations.personaId, personaId),
      eq(conversations.role, "user")
    ))
    .groupBy(conversations.content)
    .orderBy(desc(count()))
    .limit(limit);
  
  return result;
}

export type RecentConversation = {
  sessionId: string;
  lastMessage: string;
  messageCount: number;
  lastActivity: Date;
};

export async function getRecentConversations(personaId: number, limit: number = 10): Promise<RecentConversation[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get unique sessions with their latest activity
  const sessions = await db.select({
    sessionId: conversations.sessionId,
    lastActivity: sql<Date>`MAX(${conversations.createdAt})`,
    messageCount: count(),
  })
    .from(conversations)
    .where(eq(conversations.personaId, personaId))
    .groupBy(conversations.sessionId)
    .orderBy(desc(sql`MAX(${conversations.createdAt})`))
    .limit(limit);
  
  // Get last message for each session
  const result: RecentConversation[] = [];
  for (const session of sessions) {
    const lastMsg = await db.select({ content: conversations.content })
      .from(conversations)
      .where(and(
        eq(conversations.personaId, personaId),
        eq(conversations.sessionId, session.sessionId),
        eq(conversations.role, "user")
      ))
      .orderBy(desc(conversations.createdAt))
      .limit(1);
    
    result.push({
      sessionId: session.sessionId,
      lastMessage: lastMsg[0]?.content || "",
      messageCount: session.messageCount,
      lastActivity: session.lastActivity,
    });
  }
  
  return result;
}


// ==================== AI Training Operations ====================
import { aiTraining, InsertAiTraining, AiTraining, superpowers, InsertSuperpower, Superpower } from "../drizzle/schema";

export async function getTrainingByUserId(userId: number): Promise<AiTraining | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiTraining).where(eq(aiTraining.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertTraining(data: InsertAiTraining): Promise<AiTraining | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'userId' && key !== 'id' && value !== undefined) {
      updateSet[key] = value;
    }
  });

  // If no update values, just set a timestamp to avoid "No values to set" error
  if (Object.keys(updateSet).length === 0) {
    updateSet.updatedAt = new Date();
  }

  await db.insert(aiTraining).values(data).onDuplicateKeyUpdate({
    set: updateSet,
  });

  return getTrainingByUserId(data.userId);
}

// ==================== Superpowers Operations ====================
export async function getSuperpowersByUserId(userId: number): Promise<Superpower | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(superpowers).where(eq(superpowers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSuperpowers(data: InsertSuperpower): Promise<Superpower | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'userId' && key !== 'id' && value !== undefined) {
      updateSet[key] = value;
    }
  });

  // If no update values, just set a timestamp to avoid "No values to set" error
  if (Object.keys(updateSet).length === 0) {
    updateSet.updatedAt = new Date();
  }

  await db.insert(superpowers).values(data).onDuplicateKeyUpdate({
    set: updateSet,
  });

  return getSuperpowersByUserId(data.userId);
}

// Update superpower stats
export async function incrementSuperpowerStats(userId: number, stat: 'totalConversationsHandled' | 'customersRemembered' | 'afterHoursMessages' | 'researchReportsGenerated' | 'predictionsAccurate'): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.execute(
    sql`UPDATE superpowers SET ${sql.identifier(stat)} = ${sql.identifier(stat)} + 1 WHERE userId = ${userId}`
  );
}


// ==================== Subscription Operations ====================
import { subscriptions, InsertSubscription, Subscription, usageLogs, InsertUsageLog, UsageLog, PLAN_LIMITS, PlanType, sparkTransactions, InsertSparkTransaction, SparkTransaction } from "../drizzle/schema";

export async function getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrGetSubscription(userId: number): Promise<Subscription> {
  const db = await getDb();
  if (!db) {
    // Return a default free subscription if DB is not available
    return {
      id: 0,
      userId,
      plan: "free",
      status: "active",
      stripeCustomerId: "",
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Try to get existing subscription
  const existing = await getSubscriptionByUserId(userId);
  if (existing) return existing;

  // Create new free subscription
  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: "",
    plan: "free",
    status: "active",
  });

  const result = await getSubscriptionByUserId(userId);
  return result!;
}

export async function updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'userId' && key !== 'id' && value !== undefined) {
      updateSet[key] = value;
    }
  });

  if (Object.keys(updateSet).length === 0) return getSubscriptionByUserId(userId);

  await db.update(subscriptions)
    .set(updateSet)
    .where(eq(subscriptions.userId, userId));

  return getSubscriptionByUserId(userId);
}

// ==================== Usage Log Operations ====================

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getMonthStartDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function getTodayUsage(userId: number): Promise<UsageLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const today = getTodayDateString();
  const result = await db.select()
    .from(usageLogs)
    .where(and(
      eq(usageLogs.userId, userId),
      eq(usageLogs.date, today)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateTodayUsage(userId: number): Promise<UsageLog> {
  const db = await getDb();
  const today = getTodayDateString();
  
  if (!db) {
    return {
      id: 0,
      userId,
      date: today,
      messageCount: 0,
      tokenCount: 0,
      knowledgeBaseSizeBytes: 0,
      knowledgeBaseFileCount: 0,
      widgetViews: 0,
      widgetConversations: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const existing = await getTodayUsage(userId);
  if (existing) return existing;

  // Create new usage log for today
  await db.insert(usageLogs).values({
    userId,
    date: today,
    messageCount: 0,
    tokenCount: 0,
    knowledgeBaseSizeBytes: 0,
    knowledgeBaseFileCount: 0,
    widgetViews: 0,
    widgetConversations: 0,
  });

  const result = await getTodayUsage(userId);
  return result!;
}

export async function incrementMessageCount(userId: number, tokenEstimate: number = 0): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const today = getTodayDateString();
  
  // Ensure today's usage log exists
  await getOrCreateTodayUsage(userId);
  
  // Increment message count
  await db.execute(
    sql`UPDATE usage_logs 
        SET messageCount = messageCount + 1, 
            tokenCount = tokenCount + ${tokenEstimate},
            updatedAt = NOW()
        WHERE userId = ${userId} AND date = ${today}`
  );
}

export async function getMonthlyMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const monthStart = getMonthStartDateString();
  
  const result = await db.select({
    total: sql<number>`SUM(messageCount)`,
  })
    .from(usageLogs)
    .where(and(
      eq(usageLogs.userId, userId),
      sql`date >= ${monthStart}`
    ));
  
  return result[0]?.total || 0;
}

export async function getTotalMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    total: sql<number>`SUM(messageCount)`,
  })
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId));
  
  return result[0]?.total || 0;
}

export async function getActiveDaysCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(DISTINCT date)`,
  })
    .from(usageLogs)
    .where(and(
      eq(usageLogs.userId, userId),
      sql`messageCount > 0`
    ));
  
  return result[0]?.count || 0;
}

export async function updateKnowledgeBaseUsage(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Calculate total knowledge base size and count
  const kbStats = await db.select({
    totalSize: sql<number>`COALESCE(SUM(fileSize), 0)`,
    fileCount: sql<number>`COUNT(*)`,
  })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.userId, userId));

  const today = getTodayDateString();
  await getOrCreateTodayUsage(userId);

  await db.update(usageLogs)
    .set({
      knowledgeBaseSizeBytes: kbStats[0]?.totalSize || 0,
      knowledgeBaseFileCount: kbStats[0]?.fileCount || 0,
    })
    .where(and(
      eq(usageLogs.userId, userId),
      eq(usageLogs.date, today)
    ));
}

// ==================== Usage Limit Checking ====================

export type UsageLimitCheck = {
  allowed: boolean;
  reason?: 'daily_limit' | 'monthly_limit' | 'storage_limit' | 'file_count_limit';
  remaining?: number;
  limit?: number;
  current?: number;
};

export async function checkMessageLimit(userId: number): Promise<UsageLimitCheck> {
  const subscription = await createOrGetSubscription(userId);
  const limits = PLAN_LIMITS[subscription.plan as PlanType];
  
  // Check daily limit
  const todayUsage = await getOrCreateTodayUsage(userId);
  if (limits.dailyMessages !== -1 && todayUsage.messageCount >= limits.dailyMessages) {
    return {
      allowed: false,
      reason: 'daily_limit',
      remaining: 0,
      limit: limits.dailyMessages,
      current: todayUsage.messageCount,
    };
  }
  
  // Check monthly limit
  const monthlyCount = await getMonthlyMessageCount(userId);
  const monthlyLimit = limits.monthlyMessages as number;
  if (monthlyLimit !== -1 && monthlyCount >= monthlyLimit) {
    return {
      allowed: false,
      reason: 'monthly_limit',
      remaining: 0,
      limit: monthlyLimit,
      current: monthlyCount,
    };
  }
  
  const dailyRemaining = limits.dailyMessages === -1 ? Infinity : limits.dailyMessages - todayUsage.messageCount;
  const monthlyRemaining = monthlyLimit === -1 ? Infinity : monthlyLimit - monthlyCount;
  
  return {
    allowed: true,
    remaining: Math.min(dailyRemaining, monthlyRemaining),
  };
}

export async function checkKnowledgeBaseLimit(userId: number, newFileSize: number = 0): Promise<UsageLimitCheck> {
  const subscription = await createOrGetSubscription(userId);
  const limits = PLAN_LIMITS[subscription.plan as PlanType];
  
  const db = await getDb();
  if (!db) return { allowed: true };

  // Get current knowledge base stats
  const kbStats = await db.select({
    totalSize: sql<number>`COALESCE(SUM(fileSize), 0)`,
    fileCount: sql<number>`COUNT(*)`,
  })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.userId, userId));

  const currentSize = kbStats[0]?.totalSize || 0;
  const currentCount = kbStats[0]?.fileCount || 0;
  const limitBytes = limits.knowledgeBaseSizeMB * 1024 * 1024;

  // Check file count limit
  if (currentCount >= limits.knowledgeBaseFiles) {
    return {
      allowed: false,
      reason: 'file_count_limit',
      limit: limits.knowledgeBaseFiles,
      current: currentCount,
    };
  }

  // Check storage limit
  if (currentSize + newFileSize > limitBytes) {
    return {
      allowed: false,
      reason: 'storage_limit',
      limit: limitBytes,
      current: currentSize,
    };
  }

  return { allowed: true };
}

// ==================== Usage Summary ====================

export type UsageSummary = {
  todayMessages: number;
  monthMessages: number;
  totalMessages: number;
  knowledgeBaseSizeBytes: number;
  knowledgeBaseFileCount: number;
  widgetViews: number;
  daysActive: number;
};

export async function getUsageSummary(userId: number): Promise<UsageSummary> {
  const todayUsage = await getOrCreateTodayUsage(userId);
  const monthMessages = await getMonthlyMessageCount(userId);
  const totalMessages = await getTotalMessageCount(userId);
  const daysActive = await getActiveDaysCount(userId);
  
  // Get latest knowledge base stats
  const db = await getDb();
  let kbSize = 0;
  let kbCount = 0;
  let widgetViews = 0;
  
  if (db) {
    const kbStats = await db.select({
      totalSize: sql<number>`COALESCE(SUM(fileSize), 0)`,
      fileCount: sql<number>`COUNT(*)`,
    })
      .from(knowledgeBases)
      .where(eq(knowledgeBases.userId, userId));
    
    kbSize = kbStats[0]?.totalSize || 0;
    kbCount = kbStats[0]?.fileCount || 0;
    
    // Get total widget views
    const widgetStats = await db.select({
      total: sql<number>`COALESCE(SUM(widgetViews), 0)`,
    })
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId));
    
    widgetViews = widgetStats[0]?.total || 0;
  }

  return {
    todayMessages: todayUsage.messageCount,
    monthMessages,
    totalMessages,
    knowledgeBaseSizeBytes: kbSize,
    knowledgeBaseFileCount: kbCount,
    widgetViews,
    daysActive,
  };
}


// ==================== Spark Operations ====================

/**
 * 獲取用戶 Spark 餘額
 */
export async function getSparkBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ sparkBalance: users.sparkBalance }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0]?.sparkBalance ?? 0;
}

/**
 * 獲取 Spark 交易記錄
 */
export async function getSparkTransactions(userId: number, limit: number = 20, offset: number = 0): Promise<SparkTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(sparkTransactions)
    .where(eq(sparkTransactions.userId, userId))
    .orderBy(sql`createdAt DESC`)
    .limit(limit)
    .offset(offset);
}

/**
 * 增加 Spark（充值/贈送）
 */
export async function addSpark(
  userId: number,
  amount: number,
  description: string,
  stripeSessionId?: string,
  metadata?: string
): Promise<{ balance: number }> {
  const db = await getDb();
  if (!db) return { balance: 0 };

  // 更新用戶餘額
  await db.execute(
    sql`UPDATE users SET sparkBalance = sparkBalance + ${amount} WHERE id = ${userId}`
  );

  // 獲取更新後的餘額
  const balanceResult = await db.select({ sparkBalance: users.sparkBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const newBalance = balanceResult[0]?.sparkBalance ?? 0;

  // 記錄交易
  await db.insert(sparkTransactions).values({
    userId,
    type: stripeSessionId ? "topup" : (description.includes("推薦獎勵") ? "referral_bonus" : "bonus"),
    amount,
    balance: newBalance,
    description,
    stripeSessionId: stripeSessionId || null,
    metadata: metadata || null,
  });

  return { balance: newBalance };
}

/**
 * 扣除 Spark（消耗）
 */
export async function deductSpark(
  userId: number,
  amount: number,
  description: string,
  metadata?: string
): Promise<{ success: boolean; balance: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, balance: 0, reason: "Database not available" };

  // 檢查餘額是否足夠
  const currentBalance = await getSparkBalance(userId);
  if (currentBalance < amount) {
    return {
      success: false,
      balance: currentBalance,
      reason: `Spark 不足，需要 ${amount} Spark，當前餘額 ${currentBalance} Spark`,
    };
  }

  // 扣除餘額
  await db.execute(
    sql`UPDATE users SET sparkBalance = sparkBalance - ${amount} WHERE id = ${userId} AND sparkBalance >= ${amount}`
  );

  // 獲取更新後的餘額
  const balanceResult = await db.select({ sparkBalance: users.sparkBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const newBalance = balanceResult[0]?.sparkBalance ?? 0;

  // 記錄交易
  await db.insert(sparkTransactions).values({
    userId,
    type: "consume",
    amount: -amount,
    balance: newBalance,
    description,
    metadata: metadata || null,
  });

  return { success: true, balance: newBalance };
}

/**
 * 檢查 Spark 餘額是否足夠
 */
export async function checkSparkBalance(userId: number, requiredAmount: number): Promise<{ allowed: boolean; balance: number; required: number }> {
  const balance = await getSparkBalance(userId);
  return {
    allowed: balance >= requiredAmount,
    balance,
    required: requiredAmount,
  };
}

// ==================== Team Operations ====================
import { 
  teams, InsertTeam, Team,
  teamMembers, InsertTeamMember, TeamMember,
  teamKnowledge, InsertTeamKnowledge, TeamKnowledge,
  teamKnowledgeAccess, InsertTeamKnowledgeAccess, TeamKnowledgeAccess,
  TEAM_PLAN_LIMITS, TeamPlanType
} from "../drizzle/schema";

// Get team by ID
export async function getTeamById(teamId: number): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get team by owner ID
export async function getTeamByOwnerId(ownerId: number): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.ownerId, ownerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get teams where user is a member
export async function getTeamsByUserId(userId: number): Promise<Array<Team & { memberRole: string }>> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    team: teams,
    memberRole: teamMembers.role,
  })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.inviteStatus, "accepted")
    ));
  
  return result.map(r => ({
    ...r.team,
    memberRole: r.memberRole,
  }));
}

// Create a new team
export async function createTeam(data: InsertTeam): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(teams).values(data);
  
  // Get the created team
  const result = await db.select().from(teams).where(eq(teams.ownerId, data.ownerId)).orderBy(desc(teams.createdAt)).limit(1);
  const team = result[0];
  
  if (team) {
    // Add owner as a member with owner role
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: data.ownerId,
      role: "owner",
      knowledgeAccess: "full",
      inviteStatus: "accepted",
    });
  }
  
  return team;
}

// Update team
export async function updateTeam(teamId: number, data: Partial<InsertTeam>): Promise<Team | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateSet[key] = value;
    }
  });

  if (Object.keys(updateSet).length === 0) return getTeamById(teamId);

  await db.update(teams).set(updateSet).where(eq(teams.id, teamId));
  return getTeamById(teamId);
}

// Delete team
export async function deleteTeam(teamId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete all related data
  await db.delete(teamKnowledgeAccess).where(
    sql`knowledgeId IN (SELECT id FROM team_knowledge WHERE teamId = ${teamId})`
  );
  await db.delete(teamKnowledge).where(eq(teamKnowledge.teamId, teamId));
  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  await db.delete(teams).where(eq(teams.id, teamId));
}

// ==================== Team Member Operations ====================

// Get all members of a team
export async function getTeamMembers(teamId: number): Promise<Array<TeamMember & { userName?: string; userEmail?: string }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    member: teamMembers,
    userName: users.name,
    userEmail: users.email,
  })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));

  return result.map(r => ({
    ...r.member,
    userName: r.userName ?? undefined,
    userEmail: r.userEmail ?? undefined,
  }));
}

// Get member by ID
export async function getTeamMemberById(memberId: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get member by team and user
export async function getTeamMemberByUserAndTeam(teamId: number, userId: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.userId, userId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Invite a member to team
export async function inviteTeamMember(data: InsertTeamMember): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  // Check if already a member
  const existing = await getTeamMemberByUserAndTeam(data.teamId, data.userId);
  if (existing) return existing;

  await db.insert(teamMembers).values({
    ...data,
    inviteStatus: "pending",
  });

  return getTeamMemberByUserAndTeam(data.teamId, data.userId);
}

// Accept team invitation
export async function acceptTeamInvitation(memberId: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(teamMembers)
    .set({ inviteStatus: "accepted", joinedAt: new Date() })
    .where(eq(teamMembers.id, memberId));

  return getTeamMemberById(memberId);
}

// Update member role or access
export async function updateTeamMember(memberId: number, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'teamId' && key !== 'userId' && value !== undefined) {
      updateSet[key] = value;
    }
  });

  if (Object.keys(updateSet).length === 0) return getTeamMemberById(memberId);

  await db.update(teamMembers).set(updateSet).where(eq(teamMembers.id, memberId));
  return getTeamMemberById(memberId);
}

// Remove member from team
export async function removeTeamMember(memberId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete knowledge access records
  await db.delete(teamKnowledgeAccess).where(eq(teamKnowledgeAccess.memberId, memberId));
  // Delete member
  await db.delete(teamMembers).where(eq(teamMembers.id, memberId));
}

// Get team member count
export async function getTeamMemberCount(teamId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.inviteStatus, "accepted")
    ));

  return result[0]?.count || 0;
}

// ==================== Team Knowledge Operations ====================

// Get all knowledge items for a team
export async function getTeamKnowledgeByTeamId(teamId: number): Promise<TeamKnowledge[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(teamKnowledge)
    .where(eq(teamKnowledge.teamId, teamId))
    .orderBy(desc(teamKnowledge.createdAt));

  return result;
}

// Get knowledge item by ID
export async function getTeamKnowledgeById(knowledgeId: number): Promise<TeamKnowledge | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teamKnowledge).where(eq(teamKnowledge.id, knowledgeId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Create knowledge item
export async function createTeamKnowledge(data: InsertTeamKnowledge): Promise<TeamKnowledge | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(teamKnowledge).values(data);

  const result = await db.select()
    .from(teamKnowledge)
    .where(and(
      eq(teamKnowledge.teamId, data.teamId),
      eq(teamKnowledge.title, data.title)
    ))
    .orderBy(desc(teamKnowledge.createdAt))
    .limit(1);

  return result[0];
}

// Update knowledge item
export async function updateTeamKnowledge(knowledgeId: number, data: Partial<InsertTeamKnowledge>): Promise<TeamKnowledge | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'teamId' && value !== undefined) {
      updateSet[key] = value;
    }
  });

  if (Object.keys(updateSet).length === 0) return getTeamKnowledgeById(knowledgeId);

  await db.update(teamKnowledge).set(updateSet).where(eq(teamKnowledge.id, knowledgeId));
  return getTeamKnowledgeById(knowledgeId);
}

// Delete knowledge item
export async function deleteTeamKnowledge(knowledgeId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete access records first
  await db.delete(teamKnowledgeAccess).where(eq(teamKnowledgeAccess.knowledgeId, knowledgeId));
  // Delete knowledge item
  await db.delete(teamKnowledge).where(eq(teamKnowledge.id, knowledgeId));
}

// Get accessible knowledge for a member
export async function getAccessibleTeamKnowledge(teamId: number, memberId: number): Promise<TeamKnowledge[]> {
  const db = await getDb();
  if (!db) return [];

  // Get member's access level
  const member = await getTeamMemberById(memberId);
  if (!member) return [];

  // If full access, return all shared knowledge
  if (member.knowledgeAccess === "full") {
    return db.select()
      .from(teamKnowledge)
      .where(and(
        eq(teamKnowledge.teamId, teamId),
        eq(teamKnowledge.isShared, true)
      ))
      .orderBy(desc(teamKnowledge.createdAt));
  }

  // If partial access, check specific permissions
  if (member.knowledgeAccess === "partial") {
    const result = await db.select({
      knowledge: teamKnowledge,
    })
      .from(teamKnowledge)
      .innerJoin(teamKnowledgeAccess, eq(teamKnowledge.id, teamKnowledgeAccess.knowledgeId))
      .where(and(
        eq(teamKnowledge.teamId, teamId),
        eq(teamKnowledge.isShared, true),
        eq(teamKnowledgeAccess.memberId, memberId),
        eq(teamKnowledgeAccess.canAccess, true)
      ))
      .orderBy(desc(teamKnowledge.createdAt));

    return result.map(r => r.knowledge);
  }

  // No access
  return [];
}

// Get team knowledge content as string for AI context
export async function getTeamKnowledgeContent(teamId: number, memberId?: number): Promise<string> {
  const db = await getDb();
  if (!db) return "";

  let knowledge: TeamKnowledge[];
  
  if (memberId) {
    knowledge = await getAccessibleTeamKnowledge(teamId, memberId);
  } else {
    // Get all shared knowledge (for admin/owner)
    knowledge = await db.select()
      .from(teamKnowledge)
      .where(and(
        eq(teamKnowledge.teamId, teamId),
        eq(teamKnowledge.isShared, true)
      ));
  }

  if (knowledge.length === 0) return "";

  // Format knowledge for AI context
  const sections = knowledge.map(k => {
    const categoryLabels: Record<string, string> = {
      company_info: "公司資料",
      products: "產品目錄",
      services: "服務項目",
      history: "公司歷史",
      faq: "常見問題",
      sales_scripts: "銷售話術",
      case_studies: "案例研究",
      policies: "政策規定",
      training: "培訓資料",
      other: "其他",
    };
    return `【${categoryLabels[k.category] || k.category}】${k.title}\n${k.content}`;
  });

  return sections.join("\n\n---\n\n");
}

// ==================== Team Statistics ====================

export type TeamStats = {
  memberCount: number;
  knowledgeCount: number;
  totalConversations: number;
  monthlyConversations: number;
};

export async function getTeamStats(teamId: number): Promise<TeamStats> {
  const db = await getDb();
  if (!db) {
    return {
      memberCount: 0,
      knowledgeCount: 0,
      totalConversations: 0,
      monthlyConversations: 0,
    };
  }

  // Get member count
  const memberCount = await getTeamMemberCount(teamId);

  // Get knowledge count
  const knowledgeResult = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(teamKnowledge)
    .where(eq(teamKnowledge.teamId, teamId));
  const knowledgeCount = knowledgeResult[0]?.count || 0;

  // Get conversation stats (sum of all members' conversations)
  const members = await getTeamMembers(teamId);
  const memberIds = members.map(m => m.userId);
  
  let totalConversations = 0;
  let monthlyConversations = 0;
  
  if (memberIds.length > 0) {
    const monthStart = getMonthStartDateString();
    
    const totalResult = await db.select({
      total: sql<number>`COALESCE(SUM(messageCount), 0)`,
    })
      .from(usageLogs)
      .where(sql`userId IN (${sql.join(memberIds, sql`, `)})`);
    totalConversations = totalResult[0]?.total || 0;

    const monthlyResult = await db.select({
      total: sql<number>`COALESCE(SUM(messageCount), 0)`,
    })
      .from(usageLogs)
      .where(and(
        sql`userId IN (${sql.join(memberIds, sql`, `)})`,
        sql`date >= ${monthStart}`
      ));
    monthlyConversations = monthlyResult[0]?.total || 0;
  }

  return {
    memberCount,
    knowledgeCount,
    totalConversations,
    monthlyConversations,
  };
}


// ==================== Customer Memory Operations ====================
import {
  customers, InsertCustomer, Customer,
  customerMemories, InsertCustomerMemory, CustomerMemory,
  customerConversationSummaries, InsertCustomerConversationSummary, CustomerConversationSummary
} from "../drizzle/schema";

// Get or create customer by session ID
export async function getOrCreateCustomer(personaId: number, sessionId: string, fingerprint?: string): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  // First try to find by fingerprint (more reliable for returning customers)
  if (fingerprint) {
    const existingByFingerprint = await db.select()
      .from(customers)
      .where(and(
        eq(customers.personaId, personaId),
        eq(customers.fingerprint, fingerprint)
      ))
      .limit(1);
    
    if (existingByFingerprint.length > 0) {
      // Update session ID and last visit
      await db.update(customers)
        .set({ 
          sessionId,
          lastVisitAt: new Date(),
          totalConversations: sql`${customers.totalConversations} + 1`
        })
        .where(eq(customers.id, existingByFingerprint[0].id));
      
      return { ...existingByFingerprint[0], sessionId, lastVisitAt: new Date() };
    }
  }

  // Try to find by session ID
  const existingBySession = await db.select()
    .from(customers)
    .where(and(
      eq(customers.personaId, personaId),
      eq(customers.sessionId, sessionId)
    ))
    .limit(1);

  if (existingBySession.length > 0) {
    // Update fingerprint if provided and last visit
    const updateData: Partial<InsertCustomer> = { lastVisitAt: new Date() };
    if (fingerprint && !existingBySession[0].fingerprint) {
      updateData.fingerprint = fingerprint;
    }
    await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, existingBySession[0].id));
    
    return { ...existingBySession[0], ...updateData };
  }

  // Create new customer
  const result = await db.insert(customers).values({
    personaId,
    sessionId,
    fingerprint,
    firstVisitAt: new Date(),
    lastVisitAt: new Date(),
    totalConversations: 1,
  });

  const insertId = result[0].insertId;
  const created = await db.select().from(customers).where(eq(customers.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

// Get customer by ID
export async function getCustomerById(customerId: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get all customers for a persona
export async function getCustomersByPersonaId(personaId: number): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(customers)
    .where(eq(customers.personaId, personaId))
    .orderBy(desc(customers.lastVisitAt));
}

// Update customer info
export async function updateCustomer(customerId: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateSet: Record<string, unknown> = {};
  const fields = ['name', 'email', 'phone', 'company', 'title', 'preferredLanguage', 'tags', 'notes', 'sentiment', 'status'] as const;
  
  fields.forEach(field => {
    if (data[field] !== undefined) {
      updateSet[field] = data[field];
    }
  });

  if (Object.keys(updateSet).length > 0) {
    await db.update(customers).set(updateSet).where(eq(customers.id, customerId));
  }

  return getCustomerById(customerId);
}

// Increment customer message count
export async function incrementCustomerMessageCount(customerId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(customers)
    .set({ totalMessages: sql`${customers.totalMessages} + 1` })
    .where(eq(customers.id, customerId));
}

// Delete customer
export async function deleteCustomer(customerId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete related data first
  await db.delete(customerMemories).where(eq(customerMemories.customerId, customerId));
  await db.delete(customerConversationSummaries).where(eq(customerConversationSummaries.customerId, customerId));
  await db.delete(customers).where(eq(customers.id, customerId));
}

// ==================== Customer Memory Operations ====================

// Add a memory for a customer
export async function addCustomerMemory(data: InsertCustomerMemory): Promise<CustomerMemory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  // Check if similar memory exists (same customer, type, and key)
  const existing = await db.select()
    .from(customerMemories)
    .where(and(
      eq(customerMemories.customerId, data.customerId),
      eq(customerMemories.key, data.key),
      eq(customerMemories.isActive, true)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing memory
    await db.update(customerMemories)
      .set({
        value: data.value,
        memoryType: data.memoryType,
        confidence: data.confidence,
        sourceConversationId: data.sourceConversationId,
        extractedAt: new Date(),
      })
      .where(eq(customerMemories.id, existing[0].id));
    
    return { ...existing[0], ...data, extractedAt: new Date() };
  }

  // Create new memory
  const result = await db.insert(customerMemories).values(data);
  const insertId = result[0].insertId;
  const created = await db.select().from(customerMemories).where(eq(customerMemories.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

// Get all memories for a customer
export async function getCustomerMemories(customerId: number): Promise<CustomerMemory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(customerMemories)
    .where(and(
      eq(customerMemories.customerId, customerId),
      eq(customerMemories.isActive, true)
    ))
    .orderBy(desc(customerMemories.extractedAt));
}

// Get memories formatted for AI context
export async function getCustomerMemoryContext(customerId: number): Promise<string> {
  const memories = await getCustomerMemories(customerId);
  const customer = await getCustomerById(customerId);
  
  if (!customer && memories.length === 0) return "";

  let context = "【客戶資料】\n";
  
  if (customer) {
    if (customer.name) context += `姓名：${customer.name}\n`;
    if (customer.email) context += `電郵：${customer.email}\n`;
    if (customer.phone) context += `電話：${customer.phone}\n`;
    if (customer.company) context += `公司：${customer.company}\n`;
    if (customer.title) context += `職位：${customer.title}\n`;
    context += `訪問次數：${customer.totalConversations}\n`;
    context += `首次訪問：${customer.firstVisitAt?.toLocaleDateString('zh-TW')}\n`;
    if (customer.lastVisitAt) {
      context += `上次訪問：${customer.lastVisitAt.toLocaleDateString('zh-TW')}\n`;
    }
  }

  if (memories.length > 0) {
    context += "\n【客戶記憶】\n";
    
    const memoryTypeLabels: Record<string, string> = {
      preference: "偏好",
      fact: "事實",
      need: "需求",
      concern: "顧慮",
      interaction: "互動",
      purchase: "購買",
      feedback: "反饋",
      custom: "其他",
    };

    memories.forEach(memory => {
      const typeLabel = memoryTypeLabels[memory.memoryType] || memory.memoryType;
      context += `- [${typeLabel}] ${memory.key}：${memory.value}\n`;
    });
  }

  return context;
}

// Delete a memory
export async function deleteCustomerMemory(memoryId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(customerMemories)
    .set({ isActive: false })
    .where(eq(customerMemories.id, memoryId));
}

// ==================== Conversation Summary Operations ====================

// Add conversation summary
export async function addConversationSummary(data: InsertCustomerConversationSummary): Promise<CustomerConversationSummary | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(customerConversationSummaries).values(data);
  const insertId = result[0].insertId;
  const created = await db.select().from(customerConversationSummaries).where(eq(customerConversationSummaries.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

// Get conversation summaries for a customer
export async function getCustomerConversationSummaries(customerId: number, limit: number = 10): Promise<CustomerConversationSummary[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(customerConversationSummaries)
    .where(eq(customerConversationSummaries.customerId, customerId))
    .orderBy(desc(customerConversationSummaries.conversationDate))
    .limit(limit);
}

// Get recent conversation context for AI
export async function getRecentConversationContext(customerId: number, limit: number = 3): Promise<string> {
  const summaries = await getCustomerConversationSummaries(customerId, limit);
  
  if (summaries.length === 0) return "";

  let context = "【近期對話記錄】\n";
  
  summaries.forEach((summary, index) => {
    const date = summary.conversationDate?.toLocaleDateString('zh-TW') || '未知日期';
    context += `\n對話 ${index + 1} (${date}):\n`;
    context += `摘要：${summary.summary}\n`;
    
    if (summary.keyTopics) {
      try {
        const topics = JSON.parse(summary.keyTopics);
        if (Array.isArray(topics) && topics.length > 0) {
          context += `主題：${topics.join('、')}\n`;
        }
      } catch {}
    }
    
    if (summary.questionsAsked) {
      try {
        const questions = JSON.parse(summary.questionsAsked);
        if (Array.isArray(questions) && questions.length > 0) {
          context += `客戶問題：${questions.slice(0, 3).join('；')}\n`;
        }
      } catch {}
    }
  });

  return context;
}

// Get customer statistics for a persona
export async function getCustomerStats(personaId: number): Promise<{
  totalCustomers: number;
  returningCustomers: number;
  newCustomersToday: number;
  activeCustomers: number;
}> {
  const db = await getDb();
  if (!db) return { totalCustomers: 0, returningCustomers: 0, newCustomersToday: 0, activeCustomers: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allCustomers = await db.select({
    id: customers.id,
    totalConversations: customers.totalConversations,
    firstVisitAt: customers.firstVisitAt,
    status: customers.status,
  })
    .from(customers)
    .where(eq(customers.personaId, personaId));

  const totalCustomers = allCustomers.length;
  const returningCustomers = allCustomers.filter(c => c.totalConversations > 1).length;
  const newCustomersToday = allCustomers.filter(c => c.firstVisitAt && c.firstVisitAt >= today).length;
  const activeCustomers = allCustomers.filter(c => c.status === 'active').length;

  return { totalCustomers, returningCustomers, newCustomersToday, activeCustomers };
}


// ==================== Custom Domain Operations ====================
import { userDomains, domainHealthLogs, InsertUserDomain, UserDomain, InsertDomainHealthLog, DomainHealthLog } from "../drizzle/schema";

// Get all domains for a user
export async function getDomainsByUserId(userId: number): Promise<UserDomain[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userDomains).where(eq(userDomains.userId, userId));
}

// Get a specific domain by ID
export async function getDomainById(id: number): Promise<UserDomain | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userDomains).where(eq(userDomains.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get domain by domain name
export async function getDomainByName(domain: string): Promise<UserDomain | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userDomains).where(eq(userDomains.domain, domain)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Create a new domain
export async function createDomain(data: InsertUserDomain): Promise<UserDomain | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(userDomains).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(userDomains).where(eq(userDomains.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

// Update domain
export async function updateDomain(id: number, userId: number, data: Partial<InsertUserDomain>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(userDomains)
    .set(data)
    .where(and(eq(userDomains.id, id), eq(userDomains.userId, userId)));
}

// Delete domain
export async function deleteDomain(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Also delete health logs
  await db.delete(domainHealthLogs).where(eq(domainHealthLogs.domainId, id));
  await db.delete(userDomains).where(and(eq(userDomains.id, id), eq(userDomains.userId, userId)));
}

// Update domain DNS verification status
export async function updateDomainDnsStatus(id: number, verified: boolean, errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertUserDomain> = {
    dnsVerified: verified,
    lastHealthCheck: new Date(),
  };
  
  if (verified) {
    updateData.dnsVerifiedAt = new Date();
    updateData.status = 'ssl_pending';
    updateData.healthStatus = 'healthy';
    updateData.lastErrorMessage = null;
  } else {
    updateData.status = 'error';
    updateData.healthStatus = 'error';
    updateData.lastErrorMessage = errorMessage || 'DNS verification failed';
  }
  
  await db.update(userDomains).set(updateData).where(eq(userDomains.id, id));
}

// Update domain SSL status
export async function updateDomainSslStatus(id: number, enabled: boolean, expiresAt?: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertUserDomain> = {
    sslEnabled: enabled,
    lastHealthCheck: new Date(),
  };
  
  if (enabled) {
    updateData.sslIssuedAt = new Date();
    updateData.sslExpiresAt = expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    updateData.status = 'active';
    updateData.healthStatus = 'healthy';
  }
  
  await db.update(userDomains).set(updateData).where(eq(userDomains.id, id));
}

// Update domain subscription status
export async function updateDomainSubscription(id: number, status: 'trial' | 'active' | 'expired' | 'cancelled'): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertUserDomain> = {
    subscriptionStatus: status,
  };
  
  if (status === 'active') {
    updateData.subscriptionStartAt = new Date();
    updateData.subscriptionExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  }
  
  await db.update(userDomains).set(updateData).where(eq(userDomains.id, id));
}

// Create health log entry
export async function createDomainHealthLog(data: InsertDomainHealthLog): Promise<DomainHealthLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(domainHealthLogs).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(domainHealthLogs).where(eq(domainHealthLogs.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

// Get health logs for a domain
export async function getDomainHealthLogs(domainId: number, limit: number = 10): Promise<DomainHealthLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(domainHealthLogs)
    .where(eq(domainHealthLogs.domainId, domainId))
    .orderBy(desc(domainHealthLogs.checkedAt))
    .limit(limit);
}

// Get domains expiring soon (for notifications)
export async function getDomainsExpiringSoon(daysAhead: number = 30): Promise<UserDomain[]> {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  
  return db.select()
    .from(userDomains)
    .where(and(
      eq(userDomains.subscriptionStatus, 'active'),
      eq(userDomains.expiryNotificationSent, false),
      sql`${userDomains.subscriptionExpiresAt} <= ${futureDate}`
    ));
}

// Get domains with DNS errors (for notifications)
export async function getDomainsWithDnsErrors(): Promise<UserDomain[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(userDomains)
    .where(and(
      eq(userDomains.healthStatus, 'error'),
      eq(userDomains.dnsErrorNotificationSent, false)
    ));
}

// Mark expiry notification as sent
export async function markExpiryNotificationSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(userDomains)
    .set({ expiryNotificationSent: true })
    .where(eq(userDomains.id, id));
}

// Mark DNS error notification as sent
export async function markDnsErrorNotificationSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(userDomains)
    .set({ dnsErrorNotificationSent: true })
    .where(eq(userDomains.id, id));
}

// ==================== Domain Orders Operations ====================
import { DomainOrder, InsertDomainOrder, domainOrders, StripePayment, InsertStripePayment, stripePayments } from "../drizzle/schema";

export async function createDomainOrder(data: InsertDomainOrder): Promise<DomainOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(domainOrders).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(domainOrders).where(eq(domainOrders.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

export async function getDomainOrder(id: number): Promise<DomainOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(domainOrders).where(eq(domainOrders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDomainOrdersByUser(userId: number): Promise<DomainOrder[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(domainOrders)
    .where(eq(domainOrders.userId, userId))
    .orderBy(desc(domainOrders.createdAt));
}

export async function getDomainOrderByStripePaymentIntent(paymentIntentId: string): Promise<DomainOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(domainOrders)
    .where(eq(domainOrders.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDomainOrder(id: number, data: Partial<InsertDomainOrder>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(domainOrders).set(data).where(eq(domainOrders.id, id));
}

export async function updateDomainOrderStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(domainOrders)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(domainOrders.id, id));
}

// ==================== Stripe Payments Operations ====================

export async function createStripePayment(data: InsertStripePayment): Promise<StripePayment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(stripePayments).values(data);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(stripePayments).where(eq(stripePayments.id, insertId)).limit(1);
  return created.length > 0 ? created[0] : undefined;
}

export async function getStripePayment(id: number): Promise<StripePayment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(stripePayments).where(eq(stripePayments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStripePaymentByPaymentIntentId(paymentIntentId: string): Promise<StripePayment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(stripePayments)
    .where(eq(stripePayments.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getStripePaymentsByUser(userId: number): Promise<StripePayment[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(stripePayments)
    .where(eq(stripePayments.userId, userId))
    .orderBy(desc(stripePayments.createdAt));
}

export async function updateStripePayment(id: number, data: Partial<InsertStripePayment>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(stripePayments).set(data).where(eq(stripePayments.id, id));
}

export async function updateStripePaymentStatus(paymentIntentId: string, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(stripePayments)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(stripePayments.stripePaymentIntentId, paymentIntentId));
}


// ==================== Domain DNS/SSL Configuration Operations ====================

export type DnsStatus = 'pending' | 'configuring' | 'propagating' | 'active' | 'error';
export type SslStatus = 'pending' | 'provisioning' | 'active' | 'error';

export interface DomainConfigUpdate {
  dnsStatus?: DnsStatus;
  sslStatus?: SslStatus;
  cloudflareZoneId?: string;
  cloudflareCnameRecordId?: string;
  nameservers?: string[];
  targetHost?: string;
  lastDnsCheck?: Date;
  lastSslCheck?: Date;
  dnsErrorMessage?: string;
  sslErrorMessage?: string;
}

/**
 * Update domain order DNS configuration
 */
export async function updateDomainOrderDnsConfig(
  orderId: number,
  config: DomainConfigUpdate
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, any> = {};
  
  if (config.dnsStatus !== undefined) updateData.dnsStatus = config.dnsStatus;
  if (config.sslStatus !== undefined) updateData.sslStatus = config.sslStatus;
  if (config.cloudflareZoneId !== undefined) updateData.cloudflareZoneId = config.cloudflareZoneId;
  if (config.cloudflareCnameRecordId !== undefined) updateData.cloudflareCnameRecordId = config.cloudflareCnameRecordId;
  if (config.nameservers !== undefined) updateData.nameservers = JSON.stringify(config.nameservers);
  if (config.targetHost !== undefined) updateData.targetHost = config.targetHost;
  if (config.lastDnsCheck !== undefined) updateData.lastDnsCheck = config.lastDnsCheck;
  if (config.lastSslCheck !== undefined) updateData.lastSslCheck = config.lastSslCheck;
  if (config.dnsErrorMessage !== undefined) updateData.dnsErrorMessage = config.dnsErrorMessage;
  if (config.sslErrorMessage !== undefined) updateData.sslErrorMessage = config.sslErrorMessage;
  
  updateData.updatedAt = new Date();
  
  await db.update(domainOrders).set(updateData).where(eq(domainOrders.id, orderId));
}

/**
 * Get all registered domain orders for a user (for domain management)
 */
export async function getRegisteredDomainOrders(userId: number): Promise<DomainOrder[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(domainOrders)
    .where(and(
      eq(domainOrders.userId, userId),
      eq(domainOrders.status, 'registered')
    ))
    .orderBy(desc(domainOrders.createdAt));
}

/**
 * Get domain orders pending DNS configuration
 */
export async function getDomainOrdersPendingDns(): Promise<DomainOrder[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(domainOrders)
    .where(and(
      eq(domainOrders.status, 'registered'),
      eq(domainOrders.dnsStatus, 'pending')
    ));
}

/**
 * Get domain orders with DNS propagating status
 */
export async function getDomainOrdersPropagating(): Promise<DomainOrder[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(domainOrders)
    .where(and(
      eq(domainOrders.status, 'registered'),
      eq(domainOrders.dnsStatus, 'propagating')
    ));
}

/**
 * Get domain order by domain name
 */
export async function getDomainOrderByDomain(domain: string): Promise<DomainOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(domainOrders)
    .where(eq(domainOrders.domain, domain))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}


/**
 * Bind a domain to an AI persona
 */
export async function bindDomainToPersona(orderId: number, personaId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(domainOrders)
    .set({ personaId, updatedAt: new Date() })
    .where(eq(domainOrders.id, orderId));
}

/**
 * Unbind a domain from its persona
 */
export async function unbindDomainFromPersona(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(domainOrders)
    .set({ personaId: null, updatedAt: new Date() })
    .where(eq(domainOrders.id, orderId));
}

/**
 * Publish a domain
 */
export async function publishDomain(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(domainOrders)
    .set({ isPublished: true, publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(domainOrders.id, orderId));
}

/**
 * Unpublish a domain
 */
export async function unpublishDomain(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(domainOrders)
    .set({ isPublished: false, publishedAt: null, updatedAt: new Date() })
    .where(eq(domainOrders.id, orderId));
}

/**
 * Get published domain by domain name (for dynamic routing)
 */
export async function getPublishedDomainByName(domain: string): Promise<DomainOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const { isNotNull } = await import('drizzle-orm');
  
  const result = await db.select()
    .from(domainOrders)
    .where(and(
      eq(domainOrders.domain, domain),
      eq(domainOrders.isPublished, true),
      eq(domainOrders.status, 'registered'),
      isNotNull(domainOrders.personaId) // Must have persona bound
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}


// ==================== Customer User Operations ====================

/**
 * Create a new customer user with email and password
 */
export async function createCustomerUser(
  email: string,
  name: string,
  password: string,
  personaId: number,
  provider: "email" | "google" | "apple" | "microsoft" = "email"
): Promise<CustomerUser> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.insert(customerUsers).values({
    email,
    name,
    passwordHash,
    personaId,
    provider,
    isActive: true,
  });

  // Fetch and return the created user
  const user = await db
    .select()
    .from(customerUsers)
    .where(eq(customerUsers.email, email))
    .limit(1);

  if (!user.length) {
    throw new Error("Failed to create customer user");
  }

  return user[0];
}

/**
 * Get customer user by email
 */
export async function getCustomerUserByEmail(
  email: string
): Promise<CustomerUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerUsers)
    .where(eq(customerUsers.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get customer user by ID
 */
export async function getCustomerUserById(
  id: number
): Promise<CustomerUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerUsers)
    .where(eq(customerUsers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Verify customer user password
 */
export async function verifyCustomerPassword(
  email: string,
  password: string
): Promise<boolean> {
  const user = await getCustomerUserByEmail(email);
  if (!user) return false;

  try {
    return await bcrypt.compare(password, user.passwordHash);
  } catch {
    return false;
  }
}

/**
 * Update customer user last login time
 */
export async function updateCustomerLastLogin(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(customerUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(customerUsers.id, id));
}

/**
 * Check if customer email already exists
 */
export async function customerEmailExists(email: string): Promise<boolean> {
  const user = await getCustomerUserByEmail(email);
  return user !== undefined;
}

// ==================== Subdomain Operations ====================

/** Generate a random 8-char subdomain */
export function generateRandomSubdomain(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  // First char must be a letter
  result += chars.charAt(Math.floor(Math.random() * 26));
  for (let i = 1; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const RESERVED_SUBDOMAINS = new Set([
  'www', 'mail', 'ftp', 'admin', 'api', 'app', 'blog', 'chat', 'dev',
  'docs', 'help', 'info', 'login', 'ns1', 'ns2', 'pop', 'smtp', 'ssl',
  'staging', 'test', 'web', 'webmail', 'support', 'status', 'cdn',
  'static', 'assets', 'img', 'images', 'media', 'video', 'shop',
  'store', 'pay', 'billing', 'dashboard', 'panel', 'portal',
]);

/** Validate subdomain format */
export function isValidSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (subdomain.length < 3) return { valid: false, error: '子域名至少需要 3 個字符' };
  if (subdomain.length > 63) return { valid: false, error: '子域名不能超過 63 個字符' };
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return { valid: false, error: '子域名只能包含小寫字母、數字和連字符，且不能以連字符開頭或結尾' };
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return { valid: false, error: '此子域名為系統保留名稱，請選擇其他名稱' };
  }
  return { valid: true };
}

/** Check if subdomain is available */
export async function isSubdomainAvailable(subdomain: string, excludeUserId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(users.subdomain, subdomain)];
  if (excludeUserId) {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.subdomain, subdomain));
    return rows.length === 0 || rows[0].id === excludeUserId;
  }
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.subdomain, subdomain));
  return rows.length === 0;
}

/** Get user by subdomain */
export async function getUserBySubdomain(subdomain: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.subdomain, subdomain)).limit(1);
  return rows[0];
}

/** Get persona by subdomain (resolve subdomain -> persona) */
export async function getPersonaBySubdomain(subdomain: string) {
  const db = await getDb();
  if (!db) return null;
  const user = await getUserBySubdomain(subdomain);
  if (!user) return null;
  let persona = await getPersonaByUserId(user.id);
  // Auto-create persona if user exists but persona doesn't
  if (!persona) {
    persona = await upsertPersona({
      userId: user.id,
      agentName: `${user.name || 'AI'} 的 AI 助手`,
    });
  }
  if (!persona) return null;
  return {
    personaId: persona.id,
    agentName: persona.agentName,
    userId: user.id,
    userName: user.name,
  };
}

/** Set user subdomain */
export async function setUserSubdomain(userId: number, subdomain: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ subdomain }).where(eq(users.id, userId));
}


import { widgetSettings, InsertWidgetSetting, WidgetSetting } from "../drizzle/schema";

// ==================== Widget Settings ====================

/** Get widget settings by personaId */
export async function getWidgetSettings(personaId: number): Promise<WidgetSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(widgetSettings).where(eq(widgetSettings.personaId, personaId)).limit(1);
  return rows[0];
}

/** Create or update widget settings */
export async function upsertWidgetSettings(data: InsertWidgetSetting): Promise<WidgetSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(widgetSettings).where(eq(widgetSettings.personaId, data.personaId)).limit(1);

  if (existing.length > 0) {
    await db.update(widgetSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(widgetSettings.personaId, data.personaId));
  } else {
    await db.insert(widgetSettings).values(data);
  }

  const rows = await db.select().from(widgetSettings).where(eq(widgetSettings.personaId, data.personaId)).limit(1);
  return rows[0];
}
