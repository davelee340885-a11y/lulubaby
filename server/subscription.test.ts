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
      expect(["free", "pro", "enterprise"]).toContain(result.plan);
      expect(["active", "canceled", "incomplete", "incomplete_expired", "past_due", "trialing", "unpaid", "paused"]).toContain(result.status);
    });
  });

  describe("subscription.getUsage", () => {
    it("should return usage summary", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.getUsage();
      
      expect(result).toBeDefined();
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

  describe("subscription.getSparkBalance", () => {
    it("should return spark balance", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.getSparkBalance();
      
      expect(result).toBeDefined();
      expect(typeof result.balance).toBe("number");
      expect(result.balance).toBeGreaterThanOrEqual(0);
    });
  });

  describe("subscription.getSparkTransactions", () => {
    it("should return spark transactions array", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.subscription.getSparkTransactions();
      
      expect(Array.isArray(result)).toBe(true);
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
    expect(PLAN_LIMITS.free.knowledgeBaseCharsLimit).toBe(50000);
    expect(PLAN_LIMITS.free.superpowersEnabled).toBe(false);
    expect(PLAN_LIMITS.free.widgetEnabled).toBe(false);
  });

  it("should have correct pro plan limits", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    expect(PLAN_LIMITS.pro.dailyMessages).toBe(200);
    expect(PLAN_LIMITS.pro.monthlyMessages).toBe(6000);
    expect(PLAN_LIMITS.pro.knowledgeBaseSizeMB).toBe(50);
    expect(PLAN_LIMITS.pro.knowledgeBaseFiles).toBe(20);
    expect(PLAN_LIMITS.pro.knowledgeBaseCharsLimit).toBe(200000);
    expect(PLAN_LIMITS.pro.superpowersEnabled).toBe(true);
    expect(PLAN_LIMITS.pro.widgetEnabled).toBe(true);
  });

  it("should have correct enterprise plan limits", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    expect(PLAN_LIMITS.enterprise.dailyMessages).toBe(-1); // Unlimited
    expect(PLAN_LIMITS.enterprise.monthlyMessages).toBe(50000);
    expect(PLAN_LIMITS.enterprise.knowledgeBaseSizeMB).toBe(500);
    expect(PLAN_LIMITS.enterprise.knowledgeBaseFiles).toBe(100);
    expect(PLAN_LIMITS.enterprise.knowledgeBaseCharsLimit).toBe(500000);
    expect(PLAN_LIMITS.enterprise.superpowersEnabled).toBe(true);
    expect(PLAN_LIMITS.enterprise.widgetEnabled).toBe(true);
    expect(PLAN_LIMITS.enterprise.customDomain).toBe(true);
  });

  it("should have increasing limits from free to enterprise", async () => {
    const { PLAN_LIMITS } = await import("../drizzle/schema");
    
    // Daily messages should increase (or be unlimited for enterprise)
    expect(PLAN_LIMITS.pro.dailyMessages).toBeGreaterThan(PLAN_LIMITS.free.dailyMessages);
    
    // Monthly messages should increase
    expect(PLAN_LIMITS.pro.monthlyMessages).toBeGreaterThan(PLAN_LIMITS.free.monthlyMessages);
    expect(PLAN_LIMITS.enterprise.monthlyMessages).toBeGreaterThan(PLAN_LIMITS.pro.monthlyMessages);
    
    // Knowledge base size should increase
    expect(PLAN_LIMITS.pro.knowledgeBaseSizeMB).toBeGreaterThan(PLAN_LIMITS.free.knowledgeBaseSizeMB);
    expect(PLAN_LIMITS.enterprise.knowledgeBaseSizeMB).toBeGreaterThan(PLAN_LIMITS.pro.knowledgeBaseSizeMB);
  });
});

describe("Spark Configuration (v3.14)", () => {
  it("should have SPARK_PACKAGES with correct structure (flagship replaces unlimited)", async () => {
    const { SPARK_PACKAGES } = await import("../shared/stripeConfig");
    
    expect(SPARK_PACKAGES.snack).toBeDefined();
    expect(SPARK_PACKAGES.energy).toBeDefined();
    expect(SPARK_PACKAGES.super).toBeDefined();
    expect(SPARK_PACKAGES.flagship).toBeDefined();
    
    // Each package should have required fields
    for (const pkg of Object.values(SPARK_PACKAGES)) {
      expect(pkg.name).toBeTruthy();
      expect(pkg.nameEn).toBeTruthy();
      expect(pkg.price).toBeGreaterThan(0);
      expect(pkg.currency).toBe("HKD");
      expect(pkg.sparks).toBeGreaterThan(0);
      expect(pkg.tagline).toBeTruthy();
    }
  });

  it("should have SPARK_COSTS with correct v3.14 values", async () => {
    const { SPARK_COSTS } = await import("../shared/stripeConfig");
    
    expect(SPARK_COSTS.chatMessage).toBe(1);
    expect(SPARK_COSTS.knowledgeBasePerMB).toBe(10);
    expect(SPARK_COSTS.knowledgeBaseOverlimitPerChat).toBe(3);
    expect(SPARK_COSTS.superpowerActivation).toBe(30);
  });
});
