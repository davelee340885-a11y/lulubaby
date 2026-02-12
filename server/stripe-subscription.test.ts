import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import Stripe from "stripe";
import { SPARK_PACKAGES, SPARK_COSTS, SPARK_PRICE_IDS, FREE_SPARK_AMOUNT, type SparkPackageType } from "../shared/stripeConfig";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-spark-user",
    email: "spark-test@example.com",
    name: "Spark Test User",
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
      headers: {
        host: "localhost:3000",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {
        host: "localhost:3000",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// ==================== Spark Configuration Tests ====================

describe("Spark Package Configuration (v3.14)", () => {
  it("should have four packages defined (flagship replaces unlimited)", () => {
    const packageKeys = Object.keys(SPARK_PACKAGES);
    expect(packageKeys).toEqual(["snack", "energy", "super", "flagship"]);
    expect(packageKeys.length).toBe(4);
  });

  it("should have correct prices in HKD", () => {
    expect(SPARK_PACKAGES.snack.price).toBe(88);
    expect(SPARK_PACKAGES.energy.price).toBe(288);
    expect(SPARK_PACKAGES.super.price).toBe(888);
    expect(SPARK_PACKAGES.flagship.price).toBe(2888);
  });

  it("should have correct spark amounts", () => {
    expect(SPARK_PACKAGES.snack.sparks).toBe(1000);
    expect(SPARK_PACKAGES.energy.sparks).toBe(3000);
    expect(SPARK_PACKAGES.super.sparks).toBe(10000);
    expect(SPARK_PACKAGES.flagship.sparks).toBe(60000);
  });

  it("should have correct bonus amounts (v3.14 updated)", () => {
    expect(SPARK_PACKAGES.snack.bonus).toBe(0);
    expect(SPARK_PACKAGES.energy.bonus).toBe(1000);
    expect(SPARK_PACKAGES.super.bonus).toBe(5000);
    expect(SPARK_PACKAGES.flagship.bonus).toBe(0);
  });

  it("should have all currencies as HKD", () => {
    for (const pkg of Object.values(SPARK_PACKAGES)) {
      expect(pkg.currency).toBe("HKD");
    }
  });

  it("should have names and taglines for each package", () => {
    for (const pkg of Object.values(SPARK_PACKAGES)) {
      expect(pkg.name).toBeTruthy();
      expect(pkg.nameEn).toBeTruthy();
      expect(pkg.tagline).toBeTruthy();
    }
  });

  it("should have decreasing price per spark for larger packages", () => {
    const snackPPS = SPARK_PACKAGES.snack.price / (SPARK_PACKAGES.snack.sparks + SPARK_PACKAGES.snack.bonus);
    const energyPPS = SPARK_PACKAGES.energy.price / (SPARK_PACKAGES.energy.sparks + SPARK_PACKAGES.energy.bonus);
    const superPPS = SPARK_PACKAGES.super.price / (SPARK_PACKAGES.super.sparks + SPARK_PACKAGES.super.bonus);
    const flagshipPPS = SPARK_PACKAGES.flagship.price / (SPARK_PACKAGES.flagship.sparks + SPARK_PACKAGES.flagship.bonus);

    expect(energyPPS).toBeLessThan(snackPPS);
    expect(superPPS).toBeLessThan(energyPPS);
    expect(flagshipPPS).toBeLessThan(superPPS);
  });

  it("should have FREE_SPARK_AMOUNT set to 100", () => {
    expect(FREE_SPARK_AMOUNT).toBe(100);
  });
});

describe("Spark Cost Configuration (v3.14)", () => {
  it("should have all cost types defined", () => {
    expect(SPARK_COSTS.chatMessage).toBeDefined();
    expect(SPARK_COSTS.knowledgeBasePerMB).toBeDefined();
    expect(SPARK_COSTS.knowledgeBaseOverlimitPerChat).toBeDefined();
    expect(SPARK_COSTS.superpowerActivation).toBeDefined();
  });

  it("should have correct v3.14 cost values", () => {
    expect(SPARK_COSTS.chatMessage).toBe(1);
    expect(SPARK_COSTS.knowledgeBasePerMB).toBe(10);
    expect(SPARK_COSTS.knowledgeBaseOverlimitPerChat).toBe(3);
    expect(SPARK_COSTS.superpowerActivation).toBe(30);
  });
});

describe("Spark Stripe Price IDs", () => {
  it("should have valid price IDs for all packages", () => {
    for (const [key, priceId] of Object.entries(SPARK_PRICE_IDS)) {
      expect(priceId).toBeTruthy();
      expect(priceId).toMatch(/^price_/);
    }
  });

  it("should have LULUBABY_STRIPE_SECRET_KEY environment variable", () => {
    expect(process.env.LULUBABY_STRIPE_SECRET_KEY).toBeDefined();
    expect(process.env.LULUBABY_STRIPE_SECRET_KEY).toMatch(/^sk_(test|live)_/);
  });
});

// ==================== Stripe API Connection Tests ====================

describe("Stripe API Connection", () => {
  it("should connect to Stripe API and retrieve account", async () => {
    const stripe = new Stripe(process.env.LULUBABY_STRIPE_SECRET_KEY!);
    const account = await stripe.accounts.retrieve();

    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(account.country).toBe("HK");
  });

  it("should verify all configured price IDs exist in Stripe", async () => {
    const stripe = new Stripe(process.env.LULUBABY_STRIPE_SECRET_KEY!);

    for (const [pkgType, priceId] of Object.entries(SPARK_PRICE_IDS)) {
      const price = await stripe.prices.retrieve(priceId);
      expect(price).toBeDefined();
      expect(price.id).toBe(priceId);
      expect(price.active).toBe(true);
      // One-time payment prices should NOT have recurring
      expect(price.recurring).toBeNull();
    }
  });

  it("should have correct price amounts in Stripe", async () => {
    const stripe = new Stripe(process.env.LULUBABY_STRIPE_SECRET_KEY!);

    const snackPrice = await stripe.prices.retrieve(SPARK_PRICE_IDS.snack);
    expect(snackPrice.unit_amount).toBe(8800); // 88 HKD in cents

    const energyPrice = await stripe.prices.retrieve(SPARK_PRICE_IDS.energy);
    expect(energyPrice.unit_amount).toBe(28800); // 288 HKD in cents

    const superPrice = await stripe.prices.retrieve(SPARK_PRICE_IDS.super);
    expect(superPrice.unit_amount).toBe(88800); // 888 HKD in cents

    const flagshipPrice = await stripe.prices.retrieve(SPARK_PRICE_IDS.flagship);
    expect(flagshipPrice.unit_amount).toBe(288800); // 2888 HKD in cents
  });
});

// ==================== Stripe Router Tests ====================

describe("Stripe Router - getPackages", () => {
  it("should return all four packages", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const packages = await caller.stripe.getPackages();

    expect(packages).toBeDefined();
    expect(packages.length).toBe(4);

    const pkgIds = packages.map(p => p.id);
    expect(pkgIds).toContain("snack");
    expect(pkgIds).toContain("energy");
    expect(pkgIds).toContain("super");
    expect(pkgIds).toContain("flagship");
  });

  it("should include totalSparks and pricePerSpark", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const packages = await caller.stripe.getPackages();

    for (const pkg of packages) {
      expect(pkg.totalSparks).toBeGreaterThan(0);
      expect(pkg.pricePerSpark).toBeGreaterThan(0);
    }

    // Verify totalSparks = sparks + bonus (v3.14: energy = 3000 + 1000 = 4000)
    const energy = packages.find(p => p.id === "energy")!;
    expect(energy.totalSparks).toBe(4000);
  });
});

describe("Stripe Router - getCosts", () => {
  it("should return spark cost configuration (v3.14)", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const costs = await caller.stripe.getCosts();

    expect(costs).toBeDefined();
    expect(costs.chatMessage).toBe(1);
    expect(costs.knowledgeBasePerMB).toBe(10);
    expect(costs.knowledgeBaseOverlimitPerChat).toBe(3);
    expect(costs.superpowerActivation).toBe(30);
  });
});

describe("Stripe Router - getBalance", () => {
  it("should require authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.stripe.getBalance()).rejects.toThrow();
  });

  it("should return a number for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const balance = await caller.stripe.getBalance();
    expect(typeof balance).toBe("number");
    expect(balance).toBeGreaterThanOrEqual(0);
  });
});

describe("Stripe Router - getTransactions", () => {
  it("should require authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.stripe.getTransactions()).rejects.toThrow();
  });

  it("should return an array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.stripe.getTransactions();
    expect(Array.isArray(transactions)).toBe(true);
  });
});

describe("Stripe Router - createCheckoutSession", () => {
  it("should create a checkout session for snack package", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      packageType: "snack",
    });

    expect(result).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("should create a checkout session for flagship package", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      packageType: "flagship",
    });

    expect(result).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.url).toBeDefined();
  });

  it("should reject invalid package type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stripe.createCheckoutSession({
        packageType: "invalid" as any,
      })
    ).rejects.toThrow();
  });

  it("should require authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stripe.createCheckoutSession({ packageType: "snack" })
    ).rejects.toThrow();
  });
});

// ==================== Webhook Handler Tests ====================

describe("Spark Webhook Handler", () => {
  it("should have webhook handler module with correct exports", async () => {
    const webhookModule = await import("./webhooks/stripeSubscription");

    expect(webhookModule.handleCheckoutCompleted).toBeDefined();
    expect(webhookModule.verifyLulubabyWebhookSignature).toBeDefined();
    expect(webhookModule.handleSubscriptionWebhookEvent).toBeDefined();
  });

  it("should have getPackageFromMetadata logic working correctly (v3.14: flagship)", () => {
    // Test the package determination logic
    function getPackageFromMetadata(packageType: string): SparkPackageType | null {
      if (packageType in SPARK_PACKAGES) return packageType as SparkPackageType;
      return null;
    }

    expect(getPackageFromMetadata("snack")).toBe("snack");
    expect(getPackageFromMetadata("energy")).toBe("energy");
    expect(getPackageFromMetadata("super")).toBe("super");
    expect(getPackageFromMetadata("flagship")).toBe("flagship");
    expect(getPackageFromMetadata("unlimited")).toBeNull(); // removed in v3.14
    expect(getPackageFromMetadata("invalid")).toBeNull();
  });
});

// ==================== Subscription Router Spark Tests ====================

describe("Subscription Router - Spark Balance", () => {
  it("should return spark balance via subscription.getSparkBalance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.getSparkBalance();
    expect(result).toBeDefined();
    expect(typeof result.balance).toBe("number");
    expect(result.balance).toBeGreaterThanOrEqual(0);
  });

  it("should return spark transactions via subscription.getSparkTransactions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.subscription.getSparkTransactions();
    expect(Array.isArray(transactions)).toBe(true);
  });

  it("should require auth for getSparkBalance", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.subscription.getSparkBalance()).rejects.toThrow();
  });

  it("should require auth for getSparkTransactions", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.subscription.getSparkTransactions()).rejects.toThrow();
  });
});
