import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { sendEmail } from "../emailService";

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
      const CS_EMAIL = "cs@lulubaby.xyz";

      // 1. 發送電郵到 cs@lulubaby.xyz
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">🌏 AI 開發內地客戶諮詢</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; font-weight:bold; width:80px;">姓名</td><td style="padding:8px;">${name}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:8px; font-weight:bold;">電話</td><td style="padding:8px;">${phone}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">電郵</td><td style="padding:8px;">${email || "未提供"}</td></tr>
          </table>
          <h3 style="margin-top:16px;">諮詢內容</h3>
          <p style="background:#f3f4f6; padding:12px; border-radius:8px; white-space:pre-wrap;">${message}</p>
          <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
          <p style="color:#9ca3af; font-size:12px;">此郵件由 Lulubaby 平台自動發送</p>
        </div>
      `;
      const emailText = `AI 開發內地客戶諮詢\n\n姓名：${name}\n電話：${phone}\n電郵：${email || "未提供"}\n\n諮詢內容：\n${message}`;

      const [emailSent, notified] = await Promise.allSettled([
        sendEmail({
          to: CS_EMAIL,
          subject: `[Lulubaby] AI 開發內地客戶諮詢 - ${name}`,
          text: emailText,
          html: emailHtml,
        }),
        notifyOwner({
          title: `🌏 AI 開發內地客戶諮詢 - ${name}`,
          content: emailText,
        }),
      ]);

      const emailSuccess = emailSent.status === "fulfilled" && emailSent.value;
      const notifySuccess = notified.status === "fulfilled" && notified.value;

      console.log(`[ContactForm] Email to ${CS_EMAIL}: ${emailSuccess ? "sent" : "failed"}, Owner notify: ${notifySuccess ? "sent" : "failed"}`);

      return {
        success: emailSuccess || notifySuccess,
      } as const;
    }),
});
