import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // 公開的聯繫表單提交 API（用於 AI 開發內地客戶諮詢）
  submitContactForm: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "請輸入姓名"),
        phone: z.string().min(1, "請輸入電話"),
        email: z.string().email().optional().or(z.literal("")),
        message: z.string().min(1, "請輸入諮詢內容"),
      })
    )
    .mutation(async ({ input }) => {
      const { name, phone, email, message } = input;
      const delivered = await notifyOwner({
        title: `🌏 AI 開發內地客戶諮詢 - ${name}`,
        content: `姓名：${name}\n電話：${phone}\n電郵：${email || "未提供"}\n\n諮詢內容：\n${message}`
      });
      return {
        success: delivered,
      } as const;
    }),
});
