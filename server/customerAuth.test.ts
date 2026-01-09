import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Create a mock context for testing
function createMockContext(): TrpcContext {
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

describe("Customer Auth Router", () => {
  describe("emailLogin", () => {
    it("should login with valid email", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customerAuth.emailLogin({
        email: "test@example.com",
        personaId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.provider).toBe("email");
      expect(result.user.personaId).toBe(1);
    });

    it("should create unique id for email users", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customerAuth.emailLogin({
        email: "unique@example.com",
        personaId: 2,
      });

      expect(result.user.id).toBe("email:unique@example.com");
    });
  });

  describe("getSession", () => {
    it("should return user from valid token", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // First login to get a token
      const loginResult = await caller.customerAuth.emailLogin({
        email: "session@example.com",
        personaId: 1,
      });

      // Then verify the session
      const sessionResult = await caller.customerAuth.getSession({
        token: loginResult.token,
      });

      expect(sessionResult.user).toBeDefined();
      expect(sessionResult.user?.email).toBe("session@example.com");
    });

    it("should return null for invalid token", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customerAuth.getSession({
        token: "invalid-token",
      });

      expect(result.user).toBeNull();
    });

    it("should return null for empty token", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customerAuth.getSession({
        token: "",
      });

      expect(result.user).toBeNull();
    });
  });

  describe("logout", () => {
    it("should return success", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customerAuth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("getGoogleAuthUrl", () => {
    it("should throw error when Google OAuth is not configured", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Since GOOGLE_CLIENT_ID is not set in test environment, it should throw
      await expect(
        caller.customerAuth.getGoogleAuthUrl({
          personaId: 1,
          redirectUri: "http://localhost:3000/auth/google/callback",
        })
      ).rejects.toThrow("Google OAuth is not configured");
    });
  });

  describe("googleCallback", () => {
    it("should throw error when Google OAuth is not configured", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Since GOOGLE_CLIENT_ID is not set in test environment, it should throw
      await expect(
        caller.customerAuth.googleCallback({
          code: "test-code",
          redirectUri: "http://localhost:3000/auth/google/callback",
          personaId: 1,
        })
      ).rejects.toThrow("Google OAuth is not configured");
    });
  });

  describe("socialLogin", () => {
    it("should login with valid ID token", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Create a mock JWT token with email
      const mockPayload = {
        email: "social@example.com",
        name: "Social User",
        picture: "https://example.com/avatar.jpg",
      };
      const mockToken = `header.${Buffer.from(JSON.stringify(mockPayload)).toString("base64")}.signature`;

      const result = await caller.customerAuth.socialLogin({
        provider: "google",
        idToken: mockToken,
        personaId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("social@example.com");
      expect(result.user.name).toBe("Social User");
      expect(result.user.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(result.user.provider).toBe("google");
    });

    it("should throw error for invalid token", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.customerAuth.socialLogin({
          provider: "google",
          idToken: "invalid-token",
          personaId: 1,
        })
      ).rejects.toThrow("Invalid token");
    });

    it("should throw error when email is missing from token", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Create a mock JWT token without email
      const mockPayload = {
        name: "No Email User",
      };
      const mockToken = `header.${Buffer.from(JSON.stringify(mockPayload)).toString("base64")}.signature`;

      await expect(
        caller.customerAuth.socialLogin({
          provider: "apple",
          idToken: mockToken,
          personaId: 1,
        })
      ).rejects.toThrow("Email not found in token");
    });
  });
});
