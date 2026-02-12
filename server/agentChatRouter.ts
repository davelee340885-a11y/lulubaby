/**
 * Agent Chat Router - 智能體對話 API
 * 
 * 提供智能體對話功能，包含「對話中學習」邏輯
 * 當用戶輸入包含學習關鍵詞時，自動將知識存入學習日記
 * 
 * 新增：對話歷史持久化（saveHistory / listSessions / getSession / deleteSession）
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { createMemoryService } from "./services/memoryService";
import { invokeLLM } from "./_core/llm";
import { getPersonaByUserId, getTrainingByUserId, getSuperpowersByUserId, getKnowledgeContentByUserId, createOrGetSubscription, checkSparkBalance, deductSpark } from "./db";
import { generateStylePrompt } from "./styleToPrompt";
import { getDb } from "./db";
import { chatSessions, conversations, PLAN_LIMITS, PlanType, SPARK_COSTS } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// 學習意圖關鍵詞（明確的保存指令）
const LEARNING_KEYWORDS = [
  "請記住", "幫我記住", "你要記得", "這是一條新知識",
  "請記下", "幫我記下", "請記錄", "幫我記錄",
  "請學習", "幫我學習", "請學會",
  "remember this", "note this", "keep in mind", "please remember"
];

// 查詢意圖關鍵詞（排除學習意圖）
const QUERY_PATTERNS = [
  /你記得.+嗎/,
  /你還記得/,
  /記得.+嗎[?？]/,
  /學習過.+嗎/,
  /學到了?什麼/,
  /do you remember/i,
  /have you learned/i,
];

// 檢測是否為學習意圖
function detectLearningIntent(message: string): { isLearning: boolean; cleanedContent: string } {
  const lowerMessage = message.toLowerCase();
  
  // 先檢查是否為查詢意圖（問句），如果是則不是學習意圖
  for (const pattern of QUERY_PATTERNS) {
    if (pattern.test(message)) {
      return { isLearning: false, cleanedContent: message };
    }
  }
  
  // 檢查是否包含問號（問句通常不是學習意圖）
  if (message.includes('？') || message.includes('?')) {
    return { isLearning: false, cleanedContent: message };
  }
  
  for (const keyword of LEARNING_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      // 移除關鍵詞，保留實際內容
      let cleanedContent = message;
      
      const patterns = [
        new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[，,：:、\\s]*`, 'i'),
        new RegExp(`[，,：:、\\s]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[，,：:、\\s]*`, 'gi'),
      ];
      
      for (const pattern of patterns) {
        cleanedContent = cleanedContent.replace(pattern, '');
      }
      
      cleanedContent = cleanedContent.trim();
      
      if (cleanedContent.length < 5) {
        return { isLearning: false, cleanedContent: message };
      }
      
      return { isLearning: true, cleanedContent };
    }
  }
  
  return { isLearning: false, cleanedContent: message };
}

// 使用 LLM 分析記憶內容並生成標題
async function analyzeMemoryContent(content: string): Promise<{
  title: string;
  memoryType: string;
  importance: string;
  tags: string[];
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一個記憶分析助手。分析用戶提供的知識內容，並返回 JSON 格式的結構化數據。

返回格式：
{
  "title": "簡短的標題（最多 50 字）",
  "memoryType": "類型（選擇一個：sales_experience, customer_insight, product_knowledge, objection_handling, success_case, market_trend, personal_note）",
  "importance": "重要性（選擇一個：low, medium, high, critical）",
  "tags": ["標籤1", "標籤2"]
}

類型說明：
- sales_experience: 銷售經驗
- customer_insight: 客戶洞察（如客戶偏好、過敏等）
- product_knowledge: 產品知識
- objection_handling: 異議處理
- success_case: 成功案例
- market_trend: 市場趨勢
- personal_note: 個人筆記`
        },
        {
          role: "user",
          content: `分析以下內容：\n${content}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "memory_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              memoryType: { type: "string" },
              importance: { type: "string" },
              tags: { type: "array", items: { type: "string" } }
            },
            required: ["title", "memoryType", "importance", "tags"],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = response.choices[0].message.content;
    const contentStr = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    const result = JSON.parse(contentStr || "{}");
    
    const validMemoryTypes = ["sales_experience", "customer_insight", "product_knowledge", "objection_handling", "success_case", "market_trend", "personal_note"];
    const validImportance = ["low", "medium", "high", "critical"];
    
    return {
      title: result.title || content.substring(0, 50),
      memoryType: validMemoryTypes.includes(result.memoryType) ? result.memoryType : "personal_note",
      importance: validImportance.includes(result.importance) ? result.importance : "medium",
      tags: Array.isArray(result.tags) ? result.tags : []
    };
  } catch (error) {
    console.error("[AgentChat] Failed to analyze memory content:", error);
    return {
      title: content.substring(0, 50),
      memoryType: "personal_note",
      importance: "medium",
      tags: []
    };
  }
}

// 使用 LLM 為對話生成標題
async function generateSessionTitle(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    // Take first user message as context
    const firstUserMsg = messages.find(m => m.role === "user");
    if (!firstUserMsg) return "新對話";
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "根據用戶的第一條消息，生成一個簡短的對話標題（最多 20 個字）。直接返回標題文字，不要加引號或其他格式。"
        },
        {
          role: "user",
          content: firstUserMsg.content
        }
      ]
    });
    
    const rawContent = response.choices[0].message.content;
    const titleStr = typeof rawContent === 'string' ? rawContent : '';
    const title = titleStr.trim().replace(/^["\u300c]|["\u300d]$/g, "");
    return title.substring(0, 50) || "新對話";
  } catch {
    return "新對話";
  }
}

export const agentChatRouter = router({
  /**
   * 發送消息到智能體
   * 包含對話中學習邏輯
   */
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })).optional(),
      sessionId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { message, conversationHistory = [], sessionId } = input;
      const userId = ctx.user.id;
      
      // Check and deduct 1 Spark for agent chat message
      const { checkSparkBalance, deductSpark } = await import('./db');
      const sparkCheck = await checkSparkBalance(userId, 1);
      if (!sparkCheck.allowed) {
        throw new Error(`Spark 不足，請先充值。當前餘額：${sparkCheck.balance} Spark`);
      }
      await deductSpark(userId, 1, 'AI 智能體對話');
      
      // 檢測學習意圖
      const { isLearning, cleanedContent } = detectLearningIntent(message);
      
      if (isLearning && cleanedContent.length > 0) {
        try {
          const memoryService = createMemoryService(userId);
          const analysis = await analyzeMemoryContent(cleanedContent);
          
          await memoryService.createDiaryEntry({
            title: analysis.title,
            content: cleanedContent,
            memoryType: analysis.memoryType as any,
            importance: analysis.importance as any,
            tags: analysis.tags
          });
          
          return {
            reply: `好的，我記住了：「${cleanedContent}」\n\n這條記憶已保存到「我的大腦」中，類型：${getMemoryTypeLabel(analysis.memoryType)}`,
            memorySaved: true,
            memoryDetails: {
              title: analysis.title,
              type: analysis.memoryType,
              importance: analysis.importance
            }
          };
        } catch (error) {
          console.error("[AgentChat] Failed to save memory:", error);
          return {
            reply: "抱歉，保存記憶時發生錯誤，請稍後再試。",
            memorySaved: false
          };
        }
      }
      
      // 常規對話模式
      try {
        const [persona, training, superpowers, knowledgeData] = await Promise.all([
          getPersonaByUserId(userId),
          getTrainingByUserId(userId),
          getSuperpowersByUserId(userId),
          getKnowledgeContentByUserId(userId)
        ]);
        
        let systemPrompt = persona?.systemPrompt || "你是一個友善的 AI 助手。";
        
        if (training || superpowers) {
          const stylePrompt = generateStylePrompt(training || null, superpowers || null);
          if (stylePrompt) {
            systemPrompt = `${systemPrompt}\n\n${stylePrompt}`;
          }
        }
        
        // Add knowledge base content with plan-based limits
        if (knowledgeData.content && knowledgeData.content.trim().length > 0) {
          const subscription = await createOrGetSubscription(userId);
          const limits = PLAN_LIMITS[subscription.plan as PlanType];
          const charLimit = limits.knowledgeBaseCharsLimit;
          
          let knowledgeContent = '';
          if (knowledgeData.totalChars <= charLimit) {
            knowledgeContent = knowledgeData.content;
          } else {
            const overlimitCost = SPARK_COSTS.knowledgeBaseOverlimitPerChat;
            const overlimitCheck = await checkSparkBalance(userId, overlimitCost);
            if (overlimitCheck.allowed) {
              await deductSpark(userId, overlimitCost, `知識庫超限費用（${Math.round(knowledgeData.totalChars / 1000)}K 字元）`);
              knowledgeContent = knowledgeData.content.substring(0, 500000);
            } else {
              knowledgeContent = knowledgeData.content.substring(0, charLimit);
            }
          }
          
          if (knowledgeContent) {
            systemPrompt += `\n\n以下是你的專業知識庫內容，請優先根據這些內容回答問題：\n---\n${knowledgeContent}\n---`;
            console.log(`[AgentChat] Knowledge injected: ${knowledgeContent.length} chars (total: ${knowledgeData.totalChars} chars)`);
          }
        }
        
        const memoryService = createMemoryService(userId);
        const memoryContext = await memoryService.getMemoryContext(message, 3);
        
        if (memoryContext && memoryContext.length > 0) {
          systemPrompt = `${systemPrompt}\n\n${memoryContext}`;
        }
        
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt }
        ];
        
        for (const msg of conversationHistory.slice(-10)) {
          messages.push({ role: msg.role, content: msg.content });
        }
        
        messages.push({ role: "user", content: message });
        
        const response = await invokeLLM({ messages });
        const reply = response.choices[0].message.content || "抱歉，我無法生成回覆。";
        
        return { reply, memorySaved: false };
      } catch (error) {
        console.error("[AgentChat] Failed to generate response:", error);
        return {
          reply: "抱歉，處理您的請求時發生錯誤，請稍後再試。",
          memorySaved: false
        };
      }
    }),

  /**
   * 保存對話歷史到資料庫
   */
  saveHistory: protectedProcedure
    .input(z.object({
      sessionId: z.string().min(1),
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { sessionId, messages: msgs } = input;
      
      // Get persona for personaId
      const persona = await getPersonaByUserId(userId);
      const personaId = persona?.id || 0;
      
      // Upsert chat session
      const db = (await getDb())!;
      const existing = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
      
      if (existing.length === 0) {
        // Generate title from first user message
        const title = await generateSessionTitle(msgs);
        await db.insert(chatSessions).values({
          userId,
          sessionId,
          title,
          messageCount: msgs.length,
        });
      } else {
        await db.update(chatSessions)
          .set({ messageCount: msgs.length })
          .where(eq(chatSessions.sessionId, sessionId));
      }
      
      // Delete old messages for this session and re-insert all
      await db.delete(conversations).where(eq(conversations.sessionId, sessionId));
      
      if (msgs.length > 0) {
        const values = msgs.map((m) => ({
          userId,
          personaId,
          sessionId,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        await db.insert(conversations).values(values);
      }
      
      return { success: true };
    }),

  /**
   * 列出用戶的對話歷史
   */
  listSessions: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      const db = (await getDb())!;
      const sessions = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, userId))
        .orderBy(desc(chatSessions.updatedAt))
        .limit(50);
      
      // Get last message for each session
      const result = await Promise.all(
        sessions.map(async (s: typeof sessions[number]) => {
          const lastMsg = await db
            .select()
            .from(conversations)
            .where(eq(conversations.sessionId, s.sessionId))
            .orderBy(desc(conversations.id))
            .limit(1);
          
          return {
            sessionId: s.sessionId,
            title: s.title,
            lastMessage: lastMsg[0]?.content?.substring(0, 100) || "",
            messageCount: s.messageCount,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          };
        })
      );
      
      return result;
    }),

  /**
   * 獲取特定對話的完整消息
   */
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().min(1)
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      // Verify ownership
      const db = (await getDb())!;
      const session = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.sessionId, input.sessionId), eq(chatSessions.userId, userId)))
        .limit(1);
      
      if (session.length === 0) {
        return { messages: [], title: "" };
      }
      
      const msgs = await db
        .select()
        .from(conversations)
        .where(eq(conversations.sessionId, input.sessionId))
        .orderBy(conversations.id);
      
      return {
        title: session[0].title,
        messages: msgs.map((m: typeof msgs[number]) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      };
    }),

  /**
   * 刪除對話
   */
  deleteSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      // Verify ownership
      const db = (await getDb())!;
      const session = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.sessionId, input.sessionId), eq(chatSessions.userId, userId)))
        .limit(1);
      
      if (session.length === 0) {
        return { success: false };
      }
      
      // Delete messages then session
      await db.delete(conversations).where(eq(conversations.sessionId, input.sessionId));
      await db.delete(chatSessions).where(eq(chatSessions.sessionId, input.sessionId));
      
      return { success: true };
    }),

  /**
   * 獲取對話歷史（舊 API 保留相容性）
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50)
    }).optional())
    .query(async ({ ctx }) => {
      return [];
    }),

  /**
   * 清除對話歷史（舊 API 保留相容性）
   */
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { success: true };
    })
});

// 輔助函數：獲取記憶類型的中文標籤
function getMemoryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sales_experience: "銷售經驗",
    customer_insight: "客戶洞察",
    product_knowledge: "產品知識",
    objection_handling: "異議處理",
    success_case: "成功案例",
    market_trend: "市場趨勢",
    personal_note: "個人筆記"
  };
  return labels[type] || "個人筆記";
}
