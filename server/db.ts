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
