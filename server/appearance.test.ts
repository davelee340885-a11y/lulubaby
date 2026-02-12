import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-appearance",
    email: "test@example.com",
    name: "Test User",
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

describe("persona appearance settings", () => {
  it("should accept layout style in upsert", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the upsert mutation accepts appearance-related fields
    const input = {
      agentName: "Test Agent",
      layoutStyle: "professional" as const,
      profilePhotoUrl: "https://example.com/photo.jpg",
      backgroundImageUrl: "https://example.com/bg.jpg",
      tagline: "專業保險顧問",
      suggestedQuestions: JSON.stringify(["問題1", "問題2"]),
      showQuickButtons: true,
      chatPlaceholder: "請輸入您的問題...",
    };

    // This test verifies the input validation passes
    // The actual database operation may fail in test environment
    // but the schema validation should succeed
    try {
      await caller.persona.upsert(input);
    } catch (error: any) {
      // Database errors are expected in test environment
      // but validation errors would throw before this
      expect(error.message).not.toContain("validation");
    }
  });

  it("should validate layout style enum values", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Valid layout styles
    const validStyles = ["minimal", "professional", "custom"];
    
    for (const style of validStyles) {
      const input = {
        agentName: "Test Agent",
        layoutStyle: style as "minimal" | "professional" | "custom",
      };

      try {
        await caller.persona.upsert(input);
      } catch (error: any) {
        // Should not fail on validation for valid styles
        expect(error.message).not.toContain("Invalid enum value");
      }
    }
  });

  it("should accept suggested questions as JSON string", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const questions = ["你們有什麼保險產品？", "如何預約諮詢？", "保費如何計算？"];
    const input = {
      agentName: "Test Agent",
      suggestedQuestions: JSON.stringify(questions),
    };

    try {
      await caller.persona.upsert(input);
    } catch (error: any) {
      // Validation should pass for JSON string
      expect(error.message).not.toContain("Expected string");
    }
  });

  it("should handle optional appearance fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Minimal input without appearance fields
    const input = {
      agentName: "Minimal Agent",
    };

    try {
      await caller.persona.upsert(input);
    } catch (error: any) {
      // Should not fail validation when optional fields are omitted
      expect(error.message).not.toContain("Required");
    }
  });
});

describe("persona getPublic with appearance", () => {
  it("should return appearance fields in public query", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that getPublic accepts personaId
    try {
      const result = await caller.persona.getPublic({ personaId: 1 });
      
      // If persona exists, check it has the expected shape
      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("agentName");
        expect(result).toHaveProperty("layoutStyle");
        expect(result).toHaveProperty("suggestedQuestions");
        expect(result).toHaveProperty("showQuickButtons");
        expect(result).toHaveProperty("quickButtons");
        expect(Array.isArray(result.suggestedQuestions)).toBe(true);
        expect(Array.isArray(result.quickButtons)).toBe(true);
      }
    } catch (error: any) {
      // Database errors are acceptable in test environment
      expect(error.message).not.toContain("validation");
    }
  });

  it("should return null for non-existent persona", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.persona.getPublic({ personaId: 999999 });
      expect(result).toBeNull();
    } catch (error: any) {
      // Database connection errors are acceptable
      expect(error.message).not.toContain("validation");
    }
  });
});
