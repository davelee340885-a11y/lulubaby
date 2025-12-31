import { eq, and, asc } from "drizzle-orm";
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
