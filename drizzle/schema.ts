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
