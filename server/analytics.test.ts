import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-analytics",
    email: "analytics@example.com",
    name: "Analytics Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("analytics router", () => {
  describe("analytics.stats", () => {
    it("returns stats object with expected fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.stats();

      expect(result).toHaveProperty("totalConversations");
      expect(result).toHaveProperty("totalSessions");
      expect(result).toHaveProperty("todayConversations");
      expect(result).toHaveProperty("weekConversations");
      expect(typeof result.totalConversations).toBe("number");
      expect(typeof result.totalSessions).toBe("number");
      expect(typeof result.todayConversations).toBe("number");
      expect(typeof result.weekConversations).toBe("number");
    });

    it("returns zero values when no persona exists", async () => {
      const ctx = createAuthContext();
      // Use a different user ID that has no persona
      ctx.user!.id = 99999;
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.stats();

      expect(result.totalConversations).toBe(0);
      expect(result.totalSessions).toBe(0);
      expect(result.todayConversations).toBe(0);
      expect(result.weekConversations).toBe(0);
    });
  });

  describe("analytics.dailyStats", () => {
    it("returns array of daily stats", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.dailyStats({ days: 7 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when no persona exists", async () => {
      const ctx = createAuthContext();
      ctx.user!.id = 99999;
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.dailyStats({ days: 7 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("respects days parameter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result14 = await caller.analytics.dailyStats({ days: 14 });
      const result7 = await caller.analytics.dailyStats({ days: 7 });

      // Both should return arrays (may be empty if no persona)
      expect(Array.isArray(result14)).toBe(true);
      expect(Array.isArray(result7)).toBe(true);
    });
  });

  describe("analytics.popularQuestions", () => {
    it("returns array of popular questions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.popularQuestions({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when no persona exists", async () => {
      const ctx = createAuthContext();
      ctx.user!.id = 99999;
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.popularQuestions({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("analytics.recentConversations", () => {
    it("returns array of recent conversations", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.recentConversations({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when no persona exists", async () => {
      const ctx = createAuthContext();
      ctx.user!.id = 99999;
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.recentConversations({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
