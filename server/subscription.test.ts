import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-subscription",
    email: "subscription@example.com",
    name: "Subscription Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Subscription Router", () => {
  describe("subscription.get", () => {
    it("should return user subscription", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.get();
      
      expect(result).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.status).toBeDefined();
      expect(["free", "basic", "premium"]).toContain(result.plan);
      expect(["active", "cancelled", "past_due", "trialing"]).toContain(result.status);
    });
  });

  describe("subscription.getUsage", () => {
    it("should return usage summary", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.getUsage();
      
      expect(result).toBeDefined();
      // Values can be numbers or strings (from SQL aggregation)
      expect(result.todayMessages).toBeDefined();
      expect(result.monthMessages).toBeDefined();
      expect(result.totalMessages).toBeDefined();
      expect(result.knowledgeBaseSizeBytes).toBeDefined();
      expect(result.knowledgeBaseFileCount).toBeDefined();
      expect(result.widgetViews).toBeDefined();
      expect(result.daysActive).toBeDefined();
    });
  });

  describe("subscription.checkLimit", () => {
    it("should return limit check result", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.checkLimit();
      
      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
    });
  });

  describe("subscription.updatePlan", () => {
    it("should update subscription plan to basic", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.updatePlan({ plan: "basic" });
      
      expect(result).toBeDefined();
      expect(result?.plan).toBe("basic");
    });

    it("should update subscription plan to premium", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.updatePlan({ plan: "premium" });
      
      expect(result).toBeDefined();
      expect(result?.plan).toBe("premium");
    });

    it("should update subscription plan back to free", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.updatePlan({ plan: "free" });
      
      expect(result).toBeDefined();
      expect(result?.plan).toBe("free");
    });
  });
});

describe("Plan Limits Configuration", () => {
  it("should have correct free plan limits", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    expect(PLAN_LIMITS.free.dailyMessages).toBe(20);
    expect(PLAN_LIMITS.free.monthlyMessages).toBe(300);
    expect(PLAN_LIMITS.free.knowledgeBaseSizeMB).toBe(1);
    expect(PLAN_LIMITS.free.knowledgeBaseFiles).toBe(3);
    expect(PLAN_LIMITS.free.superpowersEnabled).toBe(false);
    expect(PLAN_LIMITS.free.widgetEnabled).toBe(false);
  });

  it("should have correct basic plan limits", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    expect(PLAN_LIMITS.basic.dailyMessages).toBe(200);
    expect(PLAN_LIMITS.basic.monthlyMessages).toBe(6000);
    expect(PLAN_LIMITS.basic.knowledgeBaseSizeMB).toBe(50);
    expect(PLAN_LIMITS.basic.knowledgeBaseFiles).toBe(20);
    expect(PLAN_LIMITS.basic.superpowersEnabled).toBe(true);
    expect(PLAN_LIMITS.basic.widgetEnabled).toBe(true);
  });

  it("should have correct premium plan limits", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    expect(PLAN_LIMITS.premium.dailyMessages).toBe(-1); // Unlimited
    expect(PLAN_LIMITS.premium.monthlyMessages).toBe(50000);
    expect(PLAN_LIMITS.premium.knowledgeBaseSizeMB).toBe(500);
    expect(PLAN_LIMITS.premium.knowledgeBaseFiles).toBe(100);
    expect(PLAN_LIMITS.premium.superpowersEnabled).toBe(true);
    expect(PLAN_LIMITS.premium.widgetEnabled).toBe(true);
    expect(PLAN_LIMITS.premium.customDomain).toBe(true);
  });

  it("should have increasing limits from free to premium", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    // Daily messages should increase (or be unlimited for premium)
    expect(PLAN_LIMITS.basic.dailyMessages).toBeGreaterThan(PLAN_LIMITS.free.dailyMessages);
    
    // Monthly messages should increase
    expect(PLAN_LIMITS.basic.monthlyMessages).toBeGreaterThan(PLAN_LIMITS.free.monthlyMessages);
    expect(PLAN_LIMITS.premium.monthlyMessages).toBeGreaterThan(PLAN_LIMITS.basic.monthlyMessages);
    
    // Knowledge base size should increase
    expect(PLAN_LIMITS.basic.knowledgeBaseSizeMB).toBeGreaterThan(PLAN_LIMITS.free.knowledgeBaseSizeMB);
    expect(PLAN_LIMITS.premium.knowledgeBaseSizeMB).toBeGreaterThan(PLAN_LIMITS.basic.knowledgeBaseSizeMB);
  });
});
