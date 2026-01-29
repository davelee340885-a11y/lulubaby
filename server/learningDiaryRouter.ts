/**
 * Learning Diary Router - 學習日記 API
 * 
 * 提供學習日記的 CRUD 操作和記憶搜索功能
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { createMemoryService, MemoryType, ImportanceLevel } from "./services/memoryService";

// 記憶類型驗證
const memoryTypeSchema = z.enum([
  "sales_experience",
  "customer_insight",
  "product_knowledge",
  "objection_handling",
  "success_case",
  "market_trend",
  "personal_note"
]);

// 重要性等級驗證
const importanceSchema = z.enum(["low", "medium", "high", "critical"]);

export const learningDiaryRouter = router({
  /**
   * 創建學習日記條目
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      memoryType: memoryTypeSchema,
      importance: importanceSchema,
      tags: z.array(z.string()).optional(),
      relatedCustomer: z.string().optional(),
      relatedProduct: z.string().optional(),
      actionItems: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.createDiaryEntry(input);
    }),

  /**
   * 獲取所有學習日記
   */
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.getAllDiaries(input?.limit ?? 50, input?.offset ?? 0);
    }),

  /**
   * 根據類型獲取學習日記
   */
  listByType: protectedProcedure
    .input(z.object({
      memoryType: memoryTypeSchema,
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.getDiariesByType(input.memoryType, input.limit);
    }),

  /**
   * 獲取單個學習日記
   */
  get: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.getDiaryById(input.id);
    }),

  /**
   * 更新學習日記
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      content: z.string().min(1).optional(),
      memoryType: memoryTypeSchema.optional(),
      importance: importanceSchema.optional(),
      tags: z.array(z.string()).optional(),
      relatedCustomer: z.string().optional(),
      relatedProduct: z.string().optional(),
      actionItems: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.updateDiaryEntry(id, updates);
    }),

  /**
   * 刪除學習日記
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.deleteDiaryEntry(input.id);
    }),

  /**
   * 搜索相關記憶
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.searchMemories(input.query, input.limit);
    }),

  /**
   * 獲取記憶統計
   */
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.getMemoryStats();
    }),

  /**
   * 從對話中提取學習要點
   */
  extractFromConversation: protectedProcedure
    .input(z.object({
      conversation: z.array(z.object({
        role: z.string(),
        content: z.string(),
      })),
      outcome: z.enum(["success", "pending", "failed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const memoryService = createMemoryService(ctx.user.id);
      return memoryService.extractLearningFromConversation(input.conversation, input.outcome);
    }),

  /**
   * 獲取記憶類型選項（用於前端下拉選單）
   */
  getMemoryTypes: protectedProcedure
    .query(async () => {
      return [
        { value: "sales_experience", label: "銷售經驗", icon: "💼", description: "記錄銷售技巧和成功經驗" },
        { value: "customer_insight", label: "客戶洞察", icon: "👥", description: "記錄客戶需求和行為模式" },
        { value: "product_knowledge", label: "產品知識", icon: "📦", description: "記錄產品特點和優勢" },
        { value: "objection_handling", label: "異議處理", icon: "🛡️", description: "記錄常見異議和應對方法" },
        { value: "success_case", label: "成功案例", icon: "🏆", description: "記錄成功成交的案例" },
        { value: "market_trend", label: "市場趨勢", icon: "📈", description: "記錄市場動態和趨勢" },
        { value: "personal_note", label: "個人筆記", icon: "📝", description: "記錄個人心得和反思" },
      ];
    }),

  /**
   * 獲取重要性等級選項
   */
  getImportanceLevels: protectedProcedure
    .query(async () => {
      return [
        { value: "low", label: "低", color: "gray" },
        { value: "medium", label: "中", color: "blue" },
        { value: "high", label: "高", color: "orange" },
        { value: "critical", label: "關鍵", color: "red" },
      ];
    }),
});

export type LearningDiaryRouter = typeof learningDiaryRouter;
