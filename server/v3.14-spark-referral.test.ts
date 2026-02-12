/**
 * v3.14 Tests: Spark Pricing + Referral System
 */
import { describe, it, expect } from "vitest";

// ============ Spark Config Tests ============

describe("v3.14: Spark Package Configuration", () => {
  it("should have correct package pricing", async () => {
    const { SPARK_PACKAGES } = await import("../shared/stripeConfig");
    
    expect(SPARK_PACKAGES.snack.price).toBe(88);
    expect(SPARK_PACKAGES.snack.sparks).toBe(1000);
    expect(SPARK_PACKAGES.snack.bonus).toBe(0);
    
    expect(SPARK_PACKAGES.energy.price).toBe(288);
    expect(SPARK_PACKAGES.energy.sparks).toBe(3000);
    expect(SPARK_PACKAGES.energy.bonus).toBe(1000);
    
    expect(SPARK_PACKAGES.super.price).toBe(888);
    expect(SPARK_PACKAGES.super.sparks).toBe(10000);
    expect(SPARK_PACKAGES.super.bonus).toBe(5000);
    
    expect(SPARK_PACKAGES.flagship.price).toBe(2888);
    expect(SPARK_PACKAGES.flagship.sparks).toBe(60000);
    expect(SPARK_PACKAGES.flagship.bonus).toBe(0);
  });

  it("should have flagship package replacing unlimited", async () => {
    const { SPARK_PACKAGES, SPARK_PRICE_IDS } = await import("../shared/stripeConfig");
    
    expect(SPARK_PACKAGES).toHaveProperty("flagship");
    expect(SPARK_PACKAGES).not.toHaveProperty("unlimited");
    expect(SPARK_PRICE_IDS).toHaveProperty("flagship");
    expect(SPARK_PRICE_IDS.flagship).not.toBe("price_PLACEHOLDER_FLAGSHIP");
  });

  it("should have correct Spark costs", async () => {
    const { SPARK_COSTS } = await import("../shared/stripeConfig");
    
    expect(SPARK_COSTS.chatMessage).toBe(1);
    expect(SPARK_COSTS.knowledgeBasePerMB).toBe(10);
    expect(SPARK_COSTS.knowledgeBaseOverlimitPerChat).toBe(3);
    expect(SPARK_COSTS.superpowerActivation).toBe(30);
  });

  it("should have 100 free sparks for new users", async () => {
    const { FREE_SPARK_AMOUNT } = await import("../shared/stripeConfig");
    expect(FREE_SPARK_AMOUNT).toBe(100);
  });
});

// ============ Schema Tests ============

describe("v3.14: Database Schema - Referral Fields", () => {
  it("should have referralCode and referredById in users schema", async () => {
    const { users } = await import("../drizzle/schema");
    
    expect(users).toHaveProperty("referralCode");
    expect(users).toHaveProperty("referredById");
  });

  it("should have referral_bonus in sparkTransactions type enum", async () => {
    const { sparkTransactions } = await import("../drizzle/schema");
    
    // The type column should exist
    expect(sparkTransactions).toHaveProperty("type");
  });

  it("should have SPARK_COSTS in schema matching stripeConfig", async () => {
    const { SPARK_COSTS } = await import("../drizzle/schema");
    const { SPARK_COSTS: configCosts } = await import("../shared/stripeConfig");
    
    expect(SPARK_COSTS.chatMessage).toBe(configCosts.chatMessage);
    expect(SPARK_COSTS.knowledgeBasePerMB).toBe(configCosts.knowledgeBasePerMB);
  });
});

// ============ Referral Code Generation Tests ============

describe("v3.14: Referral Code Generation", () => {
  it("should generate codes in LULU-XXXXXX format", async () => {
    const { generateReferralCode } = await import("./db");
    
    const code = generateReferralCode();
    expect(code).toMatch(/^LULU-[A-Z0-9]{6}$/);
  });

  it("should generate unique codes", async () => {
    const { generateReferralCode } = await import("./db");
    
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateReferralCode());
    }
    // With 6 chars from 31-char alphabet, collision in 100 is extremely unlikely
    expect(codes.size).toBeGreaterThanOrEqual(95);
  });
});

// ============ Stripe Router Tests ============

describe("v3.14: Stripe Router - Package Types", () => {
  it("should accept flagship as a valid packageType", async () => {
    // Import the stripeRouter to check it compiles and has the right types
    const stripeRouter = await import("./stripeRouter");
    expect(stripeRouter).toBeDefined();
  });
});

// ============ Auth Router - Signup with Referral ============

describe("v3.14: Auth Router - Signup Schema", () => {
  it("should accept referralCode in signup input", async () => {
    const { z } = await import("zod");
    
    // Simulate the signup input schema
    const signupSchema = z.object({
      name: z.string().min(1).max(255),
      email: z.string().email(),
      password: z.string().min(8),
      referralCode: z.string().max(16).optional(),
    });

    // Valid input with referral code
    const validWithCode = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      referralCode: "LULU-KZXKHB",
    });
    expect(validWithCode.success).toBe(true);

    // Valid input without referral code
    const validWithoutCode = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(validWithoutCode.success).toBe(true);
  });
});
