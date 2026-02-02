import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
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
