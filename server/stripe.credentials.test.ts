import { describe, it, expect } from "vitest";
import Stripe from "stripe";

describe("Stripe Credentials Validation", () => {
  it("should have LULUBABY_STRIPE_SECRET_KEY set", () => {
    expect(process.env.LULUBABY_STRIPE_SECRET_KEY).toBeDefined();
    // Accept both test (sk_test_) and live (sk_live_) keys
    expect(process.env.LULUBABY_STRIPE_SECRET_KEY).toMatch(/^sk_(test|live)_/);
  });

  it("should have LULUBABY_STRIPE_PUBLISHABLE_KEY set", () => {
    expect(process.env.LULUBABY_STRIPE_PUBLISHABLE_KEY).toBeDefined();
    // Accept both test (pk_test_) and live (pk_live_) keys
    expect(process.env.LULUBABY_STRIPE_PUBLISHABLE_KEY).toMatch(/^pk_(test|live)_/);
  });

  it("should have LULUBABY_STRIPE_WEBHOOK_SECRET set", () => {
    expect(process.env.LULUBABY_STRIPE_WEBHOOK_SECRET).toBeDefined();
    expect(process.env.LULUBABY_STRIPE_WEBHOOK_SECRET).toMatch(/^whsec_/);
  });

  it("should connect to Stripe API successfully", async () => {
    const stripe = new Stripe(process.env.LULUBABY_STRIPE_SECRET_KEY!, {
      apiVersion: "2025-01-27.acacia" as any,
    });
    const account = await stripe.accounts.retrieve();
    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
  });
});
