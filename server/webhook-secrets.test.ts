import { describe, it, expect } from "vitest";

describe("Webhook Secrets Validation", () => {
  it("should have LULUBABY_STRIPE_WEBHOOK_SECRET set (Spark payments)", () => {
    expect(process.env.LULUBABY_STRIPE_WEBHOOK_SECRET).toBeDefined();
    expect(process.env.LULUBABY_STRIPE_WEBHOOK_SECRET).toMatch(/^whsec_/);
  });

  it("should have STRIPE_DOMAIN_WEBHOOK_SECRET set (domain purchases)", () => {
    expect(process.env.STRIPE_DOMAIN_WEBHOOK_SECRET).toBeDefined();
    expect(process.env.STRIPE_DOMAIN_WEBHOOK_SECRET).toMatch(/^whsec_/);
  });

  it("should have different secrets for each endpoint", () => {
    expect(process.env.LULUBABY_STRIPE_WEBHOOK_SECRET).not.toBe(
      process.env.STRIPE_DOMAIN_WEBHOOK_SECRET
    );
  });
});
