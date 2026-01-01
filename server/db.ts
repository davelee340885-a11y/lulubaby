import { eq, and, asc, desc, sql, count, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  aiPersonas, InsertAiPersona, AiPersona,
  knowledgeBases, InsertKnowledgeBase, KnowledgeBase,
  quickButtons, InsertQuickButton, QuickButton,
  conversations, InsertConversation, Conversation
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Operations ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

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
      systemPrompt: data.systemPrompt,
      primaryColor: data.primaryColor,
      layoutStyle: data.layoutStyle,
      backgroundImageUrl: data.backgroundImageUrl,
      profilePhotoUrl: data.profilePhotoUrl,
      tagline: data.tagline,
      suggestedQuestions: data.suggestedQuestions,
      showQuickButtons: data.showQuickButtons,
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

export async function getKnowledgeContentByUserId(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  
  const files = await db.select({ content: knowledgeBases.content })
    .from(knowledgeBases)
    .where(and(eq(knowledgeBases.userId, userId), eq(knowledgeBases.status, "ready")));
  
  return files.map(f => f.content).filter(Boolean).join("\n\n");
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
import { subscriptions, InsertSubscription, Subscription, usageLogs, InsertUsageLog, UsageLog, PLAN_LIMITS, PlanType } from "../drizzle/schema";

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
      startDate: new Date(),
      endDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelledAt: null,
      cancelReason: null,
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
