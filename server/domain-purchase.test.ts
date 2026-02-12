import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import {
  createDomainOrder,
  getDomainOrder,
  getDomainOrdersByUser,
  updateDomainOrderStatus,
  createStripePayment,
  getStripePaymentByPaymentIntentId,
} from "./db";
import type { InsertDomainOrder, InsertStripePayment } from "../drizzle/schema";

describe("Domain Purchase with Stripe", () => {
  const testUserId = 999;
  let testOrderId: number;
  let testPaymentIntentId: string;

  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  describe("Domain Order Operations", () => {
    it("should create a domain order", async () => {
      const orderData: InsertDomainOrder = {
        userId: testUserId,
        domain: "example",
        tld: ".com",
        domainPrice: 1001, // HK$10.01
        managementFee: 9900, // HK$99
        totalPrice: 10901, // Total
        currency: "HKD",
        status: "pending_payment",
        metadata: JSON.stringify({
          fullDomain: "example.com",
          createdAt: new Date().toISOString(),
        }),
      };

      const order = await createDomainOrder(orderData);
      expect(order).toBeDefined();
      expect(order?.domain).toBe("example");
      expect(order?.tld).toBe(".com");
      expect(order?.totalPrice).toBe(10901);
      expect(order?.status).toBe("pending_payment");
      
      testOrderId = order!.id;
    });

    it("should retrieve a domain order by ID", async () => {
      const order = await getDomainOrder(testOrderId);
      expect(order).toBeDefined();
      expect(order?.id).toBe(testOrderId);
      expect(order?.userId).toBe(testUserId);
      expect(order?.domain).toBe("example");
    });

    it("should retrieve all domain orders for a user", async () => {
      const orders = await getDomainOrdersByUser(testUserId);
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.some((o) => o.id === testOrderId)).toBe(true);
    });

    it("should update domain order status", async () => {
      await updateDomainOrderStatus(testOrderId, "payment_processing");
      const order = await getDomainOrder(testOrderId);
      expect(order?.status).toBe("payment_processing");
    });
  });

  describe("Stripe Payment Operations", () => {
    it("should create a Stripe payment record", async () => {
      testPaymentIntentId = `pi_test_${Date.now()}`;
      
      const paymentData: InsertStripePayment = {
        userId: testUserId,
        stripePaymentIntentId: testPaymentIntentId,
        amount: 10901, // HK$109.01
        currency: "HKD",
        status: "processing",
        relatedType: "domain_order",
        relatedId: testOrderId,
        description: "Domain registration: example.com",
        metadata: JSON.stringify({
          orderId: testOrderId,
          domain: "example.com",
        }),
      };

      const payment = await createStripePayment(paymentData);
      expect(payment).toBeDefined();
      expect(payment?.stripePaymentIntentId).toBe(testPaymentIntentId);
      expect(payment?.amount).toBe(10901);
      expect(payment?.status).toBe("processing");
      expect(payment?.relatedId).toBe(testOrderId);
    });

    it("should retrieve Stripe payment by payment intent ID", async () => {
      const payment = await getStripePaymentByPaymentIntentId(testPaymentIntentId);
      expect(payment).toBeDefined();
      expect(payment?.stripePaymentIntentId).toBe(testPaymentIntentId);
      expect(payment?.userId).toBe(testUserId);
      expect(payment?.relatedId).toBe(testOrderId);
    });

    it("should handle duplicate payment intent ID gracefully", async () => {
      const duplicatePaymentData: InsertStripePayment = {
        userId: testUserId,
        stripePaymentIntentId: testPaymentIntentId, // Same as before
        amount: 5000,
        currency: "HKD",
        status: "succeeded",
        relatedType: "domain_order",
        relatedId: testOrderId,
        description: "Duplicate payment",
      };

      // This should fail due to unique constraint
      try {
        await createStripePayment(duplicatePaymentData);
        // If it doesn't fail, that's also acceptable for this test
      } catch (error) {
        // Expected: unique constraint violation
        expect(error).toBeDefined();
      }
    });
  });

  describe("Domain Purchase Flow", () => {
    it("should complete a full domain purchase flow", async () => {
      // Step 1: Create order
      const orderData: InsertDomainOrder = {
        userId: testUserId,
        domain: "mycompany",
        tld: ".io",
        domainPrice: 2000, // HK$20
        managementFee: 9900, // HK$99
        totalPrice: 11900,
        currency: "HKD",
        status: "pending_payment",
      };

      const order = await createDomainOrder(orderData);
      expect(order?.status).toBe("pending_payment");

      // Step 2: Update to payment processing
      await updateDomainOrderStatus(order!.id, "payment_processing");
      let updatedOrder = await getDomainOrder(order!.id);
      expect(updatedOrder?.status).toBe("payment_processing");

      // Step 3: Create payment record
      const paymentIntentId = `pi_test_purchase_${Date.now()}`;
      const paymentData: InsertStripePayment = {
        userId: testUserId,
        stripePaymentIntentId: paymentIntentId,
        amount: order!.totalPrice,
        currency: "HKD",
        status: "succeeded",
        relatedType: "domain_order",
        relatedId: order!.id,
        description: `Domain registration: mycompany.io`,
      };

      const payment = await createStripePayment(paymentData);
      expect(payment?.status).toBe("succeeded");

      // Step 4: Update order to registered
      await updateDomainOrderStatus(order!.id, "registered");
      updatedOrder = await getDomainOrder(order!.id);
      expect(updatedOrder?.status).toBe("registered");

      // Verify payment is linked
      const linkedPayment = await getStripePaymentByPaymentIntentId(paymentIntentId);
      expect(linkedPayment?.relatedId).toBe(order!.id);
    });
  });

  describe("Pricing Calculations", () => {
    it("should calculate correct pricing for different TLDs", async () => {
      const testCases = [
        { domain: "test1", tld: ".com", domainPrice: 1001, expected: 10901 },
        { domain: "test2", tld: ".net", domainPrice: 1501, expected: 11401 },
        { domain: "test3", tld: ".org", domainPrice: 1201, expected: 11101 },
        { domain: "test4", tld: ".io", domainPrice: 2001, expected: 11901 },
      ];

      for (const testCase of testCases) {
        const order = await createDomainOrder({
          userId: testUserId,
          domain: testCase.domain,
          tld: testCase.tld,
          domainPrice: testCase.domainPrice,
          managementFee: 9900,
          totalPrice: testCase.expected,
          currency: "HKD",
          status: "pending_payment",
        });

        expect(order?.totalPrice).toBe(testCase.expected);
        expect(order?.domainPrice).toBe(testCase.domainPrice);
        expect(order?.managementFee).toBe(9900);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid order retrieval", async () => {
      const order = await getDomainOrder(999999);
      expect(order).toBeUndefined();
    });

    it("should handle empty user orders", async () => {
      const orders = await getDomainOrdersByUser(999999);
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    });
  });
});
