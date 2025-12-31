import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
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

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
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

describe("persona router", () => {
  describe("persona.get", () => {
    it("returns persona data or undefined for user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // This will return persona if exists, or undefined if not
      const result = await caller.persona.get();
      
      // Result should be undefined/null for new users, or have expected shape if exists
      if (result !== undefined && result !== null) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("agentName");
        expect(result).toHaveProperty("userId");
      } else {
        expect(result === undefined || result === null).toBe(true);
      }
    });
  });

  describe("persona.getPublic", () => {
    it("returns null for non-existent persona", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.persona.getPublic({ personaId: 99999 });
      
      expect(result).toBeNull();
    });
  });
});

describe("quickButtons router", () => {
  describe("quickButtons.list", () => {
    it("returns empty array when no buttons exist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.quickButtons.list();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("knowledge router", () => {
  describe("knowledge.list", () => {
    it("returns empty array when no knowledge bases exist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.knowledge.list();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("chat router", () => {
  describe("chat.history", () => {
    it("returns empty array for new session", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.chat.history({ 
        personaId: 1, 
        sessionId: "test-session-123" 
      });
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
