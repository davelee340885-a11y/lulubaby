/**
 * Agent Chat Router - 智能體對話 API
 * 
 * 提供智能體對話功能，包含「對話中學習」邏輯
 * 當用戶輸入包含學習關鍵詞時，自動將知識存入學習日記
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { createMemoryService } from "./services/memoryService";
import { invokeLLM } from "./_core/llm";
import { getPersonaByUserId, getTrainingByUserId, getSuperpowersByUserId } from "./db";
import { generateStylePrompt } from "./styleToPrompt";

// 學習意圖關鍵詞
const LEARNING_KEYWORDS = [
  "記住", "學習", "你要記得", "這是一條新知識",
  "記得", "學會", "記下", "記錄", "學到",
  "remember", "learn", "note this", "keep in mind"
];

// 檢測是否為學習意圖
function detectLearningIntent(message: string): { isLearning: boolean; cleanedContent: string } {
  const lowerMessage = message.toLowerCase();
  
  for (const keyword of LEARNING_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      // 移除關鍵詞，保留實際內容
      let cleanedContent = message;
      
      // 嘗試移除各種格式的關鍵詞
      const patterns = [
        new RegExp(`^${keyword}[，,：:、\\s]*`, 'i'),
        new RegExp(`[，,：:、\\s]*${keyword}[，,：:、\\s]*`, 'gi'),
      ];
      
      for (const pattern of patterns) {
        cleanedContent = cleanedContent.replace(pattern, '');
      }
      
      cleanedContent = cleanedContent.trim();
      
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
    
    // 驗證並設置默認值
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
    // 返回默認值
    return {
      title: content.substring(0, 50),
      memoryType: "personal_note",
      importance: "medium",
      tags: []
    };
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
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { message, conversationHistory = [] } = input;
      const userId = ctx.user.id;
      
      // 檢測學習意圖
      const { isLearning, cleanedContent } = detectLearningIntent(message);
      
      if (isLearning && cleanedContent.length > 0) {
        // 學習模式：將內容存入學習日記
        try {
          const memoryService = createMemoryService(userId);
          
          // 使用 LLM 分析內容
          const analysis = await analyzeMemoryContent(cleanedContent);
          
          // 創建學習日記條目
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
      
      // 常規對話模式：調用 LLM 處理
      try {
        // 獲取用戶的 persona 和訓練設定
        const [persona, training, superpowers] = await Promise.all([
          getPersonaByUserId(userId),
          getTrainingByUserId(userId),
          getSuperpowersByUserId(userId)
        ]);
        
        // 構建系統提示
        let systemPrompt = persona?.systemPrompt || "你是一個友善的 AI 助手。";
        
        // 如果有訓練設定，生成風格提示
        if (training || superpowers) {
          const stylePrompt = generateStylePrompt(training || null, superpowers || null);
          if (stylePrompt) {
            systemPrompt = `${systemPrompt}\n\n${stylePrompt}`;
          }
        }
        
        // 獲取相關記憶上下文
        const memoryService = createMemoryService(userId);
        const memoryContext = await memoryService.getMemoryContext(message, 3);
        
        if (memoryContext && memoryContext.length > 0) {
          systemPrompt = `${systemPrompt}\n\n${memoryContext}`;
        }
        
        // 構建消息歷史
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt }
        ];
        
        // 添加對話歷史
        for (const msg of conversationHistory.slice(-10)) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
        
        // 添加當前消息
        messages.push({ role: "user", content: message });
        
        // 調用 LLM
        const response = await invokeLLM({ messages });
        const reply = response.choices[0].message.content || "抱歉，我無法生成回覆。";
        
        return {
          reply,
          memorySaved: false
        };
      } catch (error) {
        console.error("[AgentChat] Failed to generate response:", error);
        return {
          reply: "抱歉，處理您的請求時發生錯誤，請稍後再試。",
          memorySaved: false
        };
      }
    }),

  /**
   * 獲取對話歷史
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50)
    }).optional())
    .query(async ({ ctx }) => {
      // TODO: 實現對話歷史存儲和檢索
      return [];
    }),

  /**
   * 清除對話歷史
   */
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      // TODO: 實現清除對話歷史
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
