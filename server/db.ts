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
