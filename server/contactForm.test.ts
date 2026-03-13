import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the email service
vi.mock("./emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Contact Form API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitContactForm", () => {
    it("should submit contact form successfully with all fields", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.system.submitContactForm({
        name: "測試用戶",
        phone: "+852 9123 4567",
        email: "test@example.com",
        message: "我想了解如何使用 AI 開發內地客戶",
      });

      expect(result.success).toBe(true);
    });

    it("should send email to cs@lulubaby.xyz on form submission", async () => {
      const { sendEmail } = await import("./emailService");
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await caller.system.submitContactForm({
        name: "陳大文",
        phone: "+852 9876 5432",
        email: "chan@example.com",
        message: "想了解 AI 開發內地客戶服務",
      });

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "cs@lulubaby.xyz",
          subject: expect.stringContaining("陳大文"),
        })
      );
    });

    it("should include all contact details in email content", async () => {
      const { sendEmail } = await import("./emailService");
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await caller.system.submitContactForm({
        name: "李小明",
        phone: "+86 138 0000 0000",
        email: "li@example.com",
        message: "希望了解更多詳情",
      });

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "cs@lulubaby.xyz",
          text: expect.stringContaining("李小明"),
        })
      );
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("+86 138 0000 0000"),
        })
      );
    });

    it("should still succeed even if email fails (fallback to notifyOwner)", async () => {
      const { sendEmail } = await import("./emailService");
      const { notifyOwner } = await import("./_core/notification");
      // Email fails, but notifyOwner succeeds
      vi.mocked(sendEmail).mockResolvedValueOnce(false);
      vi.mocked(notifyOwner).mockResolvedValueOnce(true);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.system.submitContactForm({
        name: "測試用戶",
        phone: "+852 9123 4567",
        email: "",
        message: "測試訊息",
      });

      expect(result.success).toBe(true);
    });

    it("should submit contact form successfully without email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.system.submitContactForm({
        name: "測試用戶",
        phone: "+852 9123 4567",
        email: "",
        message: "我想了解如何使用 AI 開發內地客戶",
      });

      expect(result.success).toBe(true);
    });

    it("should fail when name is empty", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.system.submitContactForm({
          name: "",
          phone: "+852 9123 4567",
          email: "test@example.com",
          message: "測試訊息",
        })
      ).rejects.toThrow();
    });

    it("should fail when phone is empty", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.system.submitContactForm({
          name: "測試用戶",
          phone: "",
          email: "test@example.com",
          message: "測試訊息",
        })
      ).rejects.toThrow();
    });

    it("should fail when message is empty", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.system.submitContactForm({
          name: "測試用戶",
          phone: "+852 9123 4567",
          email: "test@example.com",
          message: "",
        })
      ).rejects.toThrow();
    });

    it("should fail when email format is invalid", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.system.submitContactForm({
          name: "測試用戶",
          phone: "+852 9123 4567",
          email: "invalid-email",
          message: "測試訊息",
        })
      ).rejects.toThrow();
    });
  });
});
