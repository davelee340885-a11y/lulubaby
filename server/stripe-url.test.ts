/**
 * Tests for Stripe Checkout Session URL resolution
 * Ensures success_url and cancel_url use the correct frontend domain,
 * not internal Cloud Run / deployment host headers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Stripe
const mockCreate = vi.fn().mockResolvedValue({
  id: "cs_test_123",
  url: "https://checkout.stripe.com/test",
});

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe("Stripe Checkout Session URL resolution", () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  describe("stripeRouter.createCheckoutSession", () => {
    it("should use Origin header for success_url when available", async () => {
      // Import after mocks
      const { stripeRouter } = await import("./stripeRouter");
      const { router } = await import("./_core/trpc");

      // Create a test caller with mocked context
      const appRouter = router({ stripe: stripeRouter });
      const caller = appRouter.createCaller({
        user: { id: 1, name: "Test", email: "test@test.com", role: "user", subdomain: "testuser" },
        req: {
          protocol: "https",
          headers: {
            host: "internal-cloudrun-host.a.run.app",
            origin: "https://lulubaby.xyz",
          },
        } as any,
        res: {} as any,
      });

      await caller.stripe.createCheckoutSession({
        packageType: "snack",
      });

      // Verify the Stripe session was created with the correct origin-based URL
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.success_url).toContain("https://lulubaby.xyz");
      expect(createArgs.success_url).not.toContain("internal-cloudrun-host");
      expect(createArgs.cancel_url).toContain("https://lulubaby.xyz");
      expect(createArgs.cancel_url).not.toContain("internal-cloudrun-host");
    });

    it("should use Referer header when Origin is not available", async () => {
      const { stripeRouter } = await import("./stripeRouter");
      const { router } = await import("./_core/trpc");

      const appRouter = router({ stripe: stripeRouter });
      const caller = appRouter.createCaller({
        user: { id: 1, name: "Test", email: "test@test.com", role: "user", subdomain: "testuser" },
        req: {
          protocol: "https",
          headers: {
            host: "internal-cloudrun-host.a.run.app",
            referer: "https://lulubaby.xyz/w/testuser/pricing",
          },
        } as any,
        res: {} as any,
      });

      await caller.stripe.createCheckoutSession({
        packageType: "energy",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockCreate.mock.calls[0][0];
      // Referer should be parsed to extract origin
      expect(createArgs.success_url).toContain("lulubaby.xyz");
      expect(createArgs.success_url).not.toContain("internal-cloudrun-host");
    });

    it("should use client-provided successUrl when passed", async () => {
      const { stripeRouter } = await import("./stripeRouter");
      const { router } = await import("./_core/trpc");

      const appRouter = router({ stripe: stripeRouter });
      const caller = appRouter.createCaller({
        user: { id: 1, name: "Test", email: "test@test.com", role: "user", subdomain: "testuser" },
        req: {
          protocol: "https",
          headers: {
            host: "internal-cloudrun-host.a.run.app",
            origin: "https://lulubaby.xyz",
          },
        } as any,
        res: {} as any,
      });

      await caller.stripe.createCheckoutSession({
        packageType: "snack",
        successUrl: "https://lulubaby.xyz/w/testuser/pricing?spark_topup=success",
        cancelUrl: "https://lulubaby.xyz/w/testuser/pricing",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.success_url).toBe("https://lulubaby.xyz/w/testuser/pricing?spark_topup=success");
      expect(createArgs.cancel_url).toBe("https://lulubaby.xyz/w/testuser/pricing");
    });

    it("should fall back to host header when no Origin or Referer", async () => {
      const { stripeRouter } = await import("./stripeRouter");
      const { router } = await import("./_core/trpc");

      const appRouter = router({ stripe: stripeRouter });
      const caller = appRouter.createCaller({
        user: { id: 1, name: "Test", email: "test@test.com", role: "user", subdomain: "testuser" },
        req: {
          protocol: "https",
          headers: {
            host: "localhost:3000",
          },
        } as any,
        res: {} as any,
      });

      await caller.stripe.createCheckoutSession({
        packageType: "snack",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.success_url).toContain("localhost:3000");
    });
  });
});
