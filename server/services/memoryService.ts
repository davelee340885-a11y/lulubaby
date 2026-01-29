/**
 * Memory Service - 超級銷售大腦記憶系統
 * 
 * 功能：
 * 1. 學習日記管理 - 記錄銷售經驗、客戶互動、成功案例
 * 2. 向量搜索 - 基於語義相似度檢索相關記憶
 * 3. 記憶整合 - 在對話中自動檢索並應用相關記憶
 * 
 * MVP 階段使用 MySQL 存儲，預留 Qdrant 向量數據庫接口
 */

import { getDb } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { learningDiaries, memoryEmbeddings } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// 記憶類型定義
export type MemoryType = 
  | "sales_experience"    // 銷售經驗
  | "customer_insight"    // 客戶洞察
  | "product_knowledge"   // 產品知識
  | "objection_handling"  // 異議處理
  | "success_case"        // 成功案例
  | "market_trend"        // 市場趨勢
  | "personal_note";      // 個人筆記

// 記憶重要性等級
export type ImportanceLevel = "low" | "medium" | "high" | "critical";

// 學習日記條目
export interface LearningDiaryEntry {
  id?: number;
  userId: number;
  title: string;
  content: string;
  memoryType: MemoryType;
  importance: ImportanceLevel;
  tags?: string[];
  relatedCustomer?: string;
  relatedProduct?: string;
  actionItems?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// 記憶搜索結果
export interface MemorySearchResult {
  entry: LearningDiaryEntry;
  relevanceScore: number;
  matchedKeywords?: string[];
}

/**
 * 記憶服務類
 */
export class MemoryService {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * 創建學習日記條目
   */
  async createDiaryEntry(entry: Omit<LearningDiaryEntry, "id" | "userId" | "createdAt" | "updatedAt">): Promise<LearningDiaryEntry> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(learningDiaries).values({
      userId: this.userId,
      title: entry.title,
      content: entry.content,
      memoryType: entry.memoryType,
      importance: entry.importance,
      tags: entry.tags ? JSON.stringify(entry.tags) : null,
      relatedCustomer: entry.relatedCustomer || null,
      relatedProduct: entry.relatedProduct || null,
      actionItems: entry.actionItems ? JSON.stringify(entry.actionItems) : null,
    });

    const insertId = result[0].insertId;
    
    // 異步生成嵌入向量（MVP 階段使用關鍵詞）
    this.generateAndStoreEmbedding(insertId, entry.title, entry.content, entry.memoryType);

    return {
      id: insertId,
      userId: this.userId,
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 獲取所有學習日記
   */
  async getAllDiaries(limit: number = 50, offset: number = 0): Promise<LearningDiaryEntry[]> {
    const db = await getDb();
    if (!db) return [];

    const entries = await db
      .select()
      .from(learningDiaries)
      .where(eq(learningDiaries.userId, this.userId))
      .orderBy(desc(learningDiaries.createdAt))
      .limit(limit)
      .offset(offset);

    return entries.map(this.mapDbEntryToLearningDiary);
  }

  /**
   * 根據類型獲取學習日記
   */
  async getDiariesByType(memoryType: MemoryType, limit: number = 20): Promise<LearningDiaryEntry[]> {
    const db = await getDb();
    if (!db) return [];

    const entries = await db
      .select()
      .from(learningDiaries)
      .where(and(
        eq(learningDiaries.userId, this.userId),
        eq(learningDiaries.memoryType, memoryType)
      ))
      .orderBy(desc(learningDiaries.createdAt))
      .limit(limit);

    return entries.map(this.mapDbEntryToLearningDiary);
  }

  /**
   * 搜索相關記憶（基於關鍵詞匹配，MVP 階段）
   */
  async searchMemories(query: string, limit: number = 5): Promise<MemorySearchResult[]> {
    const db = await getDb();
    if (!db) return [];

    // 提取關鍵詞
    const keywords = await this.extractKeywords(query);
    
    // 基於關鍵詞搜索
    const results: MemorySearchResult[] = [];
    
    for (const keyword of keywords) {
      const entries = await db
        .select()
        .from(learningDiaries)
        .where(and(
          eq(learningDiaries.userId, this.userId),
          sql`(${learningDiaries.title} LIKE ${`%${keyword}%`} OR ${learningDiaries.content} LIKE ${`%${keyword}%`} OR ${learningDiaries.tags} LIKE ${`%${keyword}%`})`
        ))
        .limit(limit);

      for (const entry of entries) {
        const existingIndex = results.findIndex(r => r.entry.id === entry.id);
        if (existingIndex >= 0) {
          results[existingIndex].relevanceScore += 1;
          results[existingIndex].matchedKeywords?.push(keyword);
        } else {
          results.push({
            entry: this.mapDbEntryToLearningDiary(entry),
            relevanceScore: 1,
            matchedKeywords: [keyword],
          });
        }
      }
    }

    // 按相關性排序
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * 獲取對話上下文相關的記憶
   * 用於在 AI 對話中自動注入相關記憶
   */
  async getContextualMemories(conversationContext: string, limit: number = 3): Promise<string> {
    const memories = await this.searchMemories(conversationContext, limit);
    
    if (memories.length === 0) {
      return "";
    }

    let contextPrompt = "\n【相關銷售經驗和知識】\n";
    
    for (const memory of memories) {
      const entry = memory.entry;
      contextPrompt += `\n📝 ${entry.title}\n`;
      contextPrompt += `類型：${this.getMemoryTypeLabel(entry.memoryType)}\n`;
      contextPrompt += `內容：${entry.content.substring(0, 500)}${entry.content.length > 500 ? '...' : ''}\n`;
      
      if (entry.actionItems && entry.actionItems.length > 0) {
        contextPrompt += `行動要點：${entry.actionItems.join('、')}\n`;
      }
    }

    return contextPrompt;
  }

  /**
   * 更新學習日記
   */
  async updateDiaryEntry(id: number, updates: Partial<LearningDiaryEntry>): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const updateData: Record<string, unknown> = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.content) updateData.content = updates.content;
    if (updates.memoryType) updateData.memoryType = updates.memoryType;
    if (updates.importance) updateData.importance = updates.importance;
    if (updates.tags) updateData.tags = JSON.stringify(updates.tags);
    if (updates.relatedCustomer !== undefined) updateData.relatedCustomer = updates.relatedCustomer;
    if (updates.relatedProduct !== undefined) updateData.relatedProduct = updates.relatedProduct;
    if (updates.actionItems) updateData.actionItems = JSON.stringify(updates.actionItems);

    const result = await db
      .update(learningDiaries)
      .set(updateData)
      .where(and(
        eq(learningDiaries.id, id),
        eq(learningDiaries.userId, this.userId)
      ));

    // 如果內容更新，重新生成嵌入
    if (updates.title || updates.content) {
      const entry = await this.getDiaryById(id);
      if (entry) {
        this.generateAndStoreEmbedding(id, entry.title, entry.content, entry.memoryType);
      }
    }

    return result[0].affectedRows > 0;
  }

  /**
   * 刪除學習日記
   */
  async deleteDiaryEntry(id: number): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    // 先刪除相關的嵌入
    await db
      .delete(memoryEmbeddings)
      .where(eq(memoryEmbeddings.diaryId, id));

    const result = await db
      .delete(learningDiaries)
      .where(and(
        eq(learningDiaries.id, id),
        eq(learningDiaries.userId, this.userId)
      ));

    return result[0].affectedRows > 0;
  }

  /**
   * 獲取單個日記條目
   */
  async getDiaryById(id: number): Promise<LearningDiaryEntry | null> {
    const db = await getDb();
    if (!db) return null;

    const entries = await db
      .select()
      .from(learningDiaries)
      .where(and(
        eq(learningDiaries.id, id),
        eq(learningDiaries.userId, this.userId)
      ))
      .limit(1);

    if (entries.length === 0) return null;
    return this.mapDbEntryToLearningDiary(entries[0]);
  }

  /**
   * 獲取記憶統計
   */
  async getMemoryStats(): Promise<{
    totalEntries: number;
    byType: Record<MemoryType, number>;
    byImportance: Record<ImportanceLevel, number>;
    recentActivity: number;
  }> {
    const db = await getDb();
    const defaultStats = {
      totalEntries: 0,
      byType: {} as Record<MemoryType, number>,
      byImportance: {} as Record<ImportanceLevel, number>,
      recentActivity: 0,
    };
    
    if (!db) return defaultStats;

    const allEntries = await db
      .select()
      .from(learningDiaries)
      .where(eq(learningDiaries.userId, this.userId));

    const stats = {
      totalEntries: allEntries.length,
      byType: {} as Record<MemoryType, number>,
      byImportance: {} as Record<ImportanceLevel, number>,
      recentActivity: 0,
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const entry of allEntries) {
      // 按類型統計
      const type = entry.memoryType as MemoryType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 按重要性統計
      const importance = entry.importance as ImportanceLevel;
      stats.byImportance[importance] = (stats.byImportance[importance] || 0) + 1;

      // 最近活動
      if (entry.createdAt && entry.createdAt > oneWeekAgo) {
        stats.recentActivity++;
      }
    }

    return stats;
  }

  /**
   * 從對話中自動提取學習要點
   */
  async extractLearningFromConversation(
    conversation: { role: string; content: string }[],
    outcome: "success" | "pending" | "failed"
  ): Promise<LearningDiaryEntry | null> {
    try {
      const conversationText = conversation
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `你是一個銷售教練，專門從對話中提取學習要點。請分析以下對話並提取：
1. 關鍵學習點
2. 客戶洞察
3. 可改進之處
4. 行動建議

請以JSON格式回覆：
{
  "title": "簡短標題",
  "content": "詳細學習內容",
  "memoryType": "sales_experience|customer_insight|objection_handling|success_case",
  "importance": "low|medium|high|critical",
  "tags": ["標籤1", "標籤2"],
  "actionItems": ["行動1", "行動2"]
}`
          },
          {
            role: "user",
            content: `對話結果：${outcome}\n\n對話內容：\n${conversationText}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "learning_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                memoryType: { type: "string", enum: ["sales_experience", "customer_insight", "objection_handling", "success_case"] },
                importance: { type: "string", enum: ["low", "medium", "high", "critical"] },
                tags: { type: "array", items: { type: "string" } },
                actionItems: { type: "array", items: { type: "string" } }
              },
              required: ["title", "content", "memoryType", "importance", "tags", "actionItems"],
              additionalProperties: false
            }
          }
        }
      });

      const responseContent = response.choices[0].message.content;
      const extracted = JSON.parse(typeof responseContent === 'string' ? responseContent : '{}');
      
      if (extracted.title && extracted.content) {
        return this.createDiaryEntry({
          title: extracted.title,
          content: extracted.content,
          memoryType: extracted.memoryType as MemoryType,
          importance: extracted.importance as ImportanceLevel,
          tags: extracted.tags,
          actionItems: extracted.actionItems,
        });
      }

      return null;
    } catch (error) {
      console.error("[MemoryService] Failed to extract learning:", error);
      return null;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 提取關鍵詞（MVP 階段使用 LLM）
   */
  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "從以下文本中提取3-5個關鍵詞，用於搜索相關銷售經驗。只回覆關鍵詞，用逗號分隔。"
          },
          { role: "user", content: text }
        ],
      });

      const content = response.choices[0].message.content;
      const keywords = (typeof content === 'string' ? content : '')
        .split(/[,，、]/)
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      return keywords.slice(0, 5);
    } catch (error) {
      // 降級到簡單分詞
      return text
        .split(/[\s,，、。！？]/)
        .filter(w => w.length >= 2)
        .slice(0, 5);
    }
  }

  /**
   * 生成並存儲嵌入向量（預留 Qdrant 接口）
   */
  private async generateAndStoreEmbedding(
    diaryId: number,
    title: string,
    content: string,
    memoryType: MemoryType
  ): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // MVP 階段：提取關鍵詞作為簡化的"嵌入"
      const keywords = await this.extractKeywords(`${title} ${content}`);
      
      // 存儲到 memory_embeddings 表
      await db.insert(memoryEmbeddings).values({
        diaryId,
        keywords: JSON.stringify(keywords),
        memoryType,
      }).onDuplicateKeyUpdate({
        set: {
          keywords: JSON.stringify(keywords),
          memoryType,
        }
      });
    } catch (error) {
      console.error("[MemoryService] Failed to generate embedding:", error);
    }
  }

  /**
   * 映射數據庫條目到 LearningDiaryEntry
   */
  private mapDbEntryToLearningDiary(entry: {
    id: number;
    userId: number;
    title: string;
    content: string;
    memoryType: string;
    importance: string;
    tags: string | null;
    relatedCustomer: string | null;
    relatedProduct: string | null;
    actionItems: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }): LearningDiaryEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      title: entry.title,
      content: entry.content,
      memoryType: entry.memoryType as MemoryType,
      importance: entry.importance as ImportanceLevel,
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      relatedCustomer: entry.relatedCustomer || undefined,
      relatedProduct: entry.relatedProduct || undefined,
      actionItems: entry.actionItems ? JSON.parse(entry.actionItems) : [],
      createdAt: entry.createdAt || undefined,
      updatedAt: entry.updatedAt || undefined,
    };
  }

  /**
   * 獲取記憶類型標籤
   */
  private getMemoryTypeLabel(type: MemoryType): string {
    const labels: Record<MemoryType, string> = {
      sales_experience: "銷售經驗",
      customer_insight: "客戶洞察",
      product_knowledge: "產品知識",
      objection_handling: "異議處理",
      success_case: "成功案例",
      market_trend: "市場趨勢",
      personal_note: "個人筆記",
    };
    return labels[type] || type;
  }
}

/**
 * 創建記憶服務實例
 */
export function createMemoryService(userId: number): MemoryService {
  return new MemoryService(userId);
}
