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
    it("should require password field", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // emailLogin requires email, password, and personaId
      // Without password, it should throw a validation error
      await expect(
        caller.customerAuth.emailLogin({
          email: "test@example.com",
          password: "", // empty password should fail min(1) validation
          personaId: 1,
        })
      ).rejects.toThrow();
    });

    it("should reject login for non-existent user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Login with a non-existent email should throw UNAUTHORIZED
      await expect(
        caller.customerAuth.emailLogin({
          email: "nonexistent_customer_test_xyz@example.com",
          password: "SomePassword123!",
          personaId: 1,
        })
      ).rejects.toThrow();
    });

    it("should validate email format", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.customerAuth.emailLogin({
          email: "not-an-email",
          password: "password123",
          personaId: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe("getSession", () => {
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
    it("should login with valid ID token and return session fields", async () => {
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
      expect(result.user.provider).toBe("google");
      // Note: CustomerSession does not include avatarUrl field
      expect(result.user.personaId).toBe(1);
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
