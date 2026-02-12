/**
 * Spark 充值 Router
 * 處理 Stripe 一次性付款 Checkout 和 Spark 餘額管理
 */

import { z } from "zod";
import Stripe from "stripe";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { SPARK_PACKAGES, SPARK_COSTS, SPARK_PRICE_IDS, type SparkPackageType } from "../shared/stripeConfig";
import { getSparkBalance, getSparkTransactions, addSpark, deductSpark, checkSparkBalance } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe(): Stripe {
  const key = ENV.stripeSecretKey;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured. Please set LULUBABY_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY in environment.");
  }
  return new Stripe(key);
}

export const stripeRouter = router({
  /**
   * 獲取 Spark 充值包列表
   */
  getPackages: publicProcedure.query(() => {
    return Object.entries(SPARK_PACKAGES).map(([key, pkg]) => ({
      id: key as SparkPackageType,
      ...pkg,
      totalSparks: pkg.sparks + pkg.bonus,
      pricePerSpark: +(pkg.price / (pkg.sparks + pkg.bonus)).toFixed(2),
    }));
  }),

  /**
   * 獲取 Spark 消耗標準
   */
  getCosts: publicProcedure.query(() => {
    return SPARK_COSTS;
  }),

  /**
   * 獲取當前用戶的 Spark 餘額
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    return getSparkBalance(ctx.user.id);
  }),

  /**
   * 獲取充值/消耗記錄
   */
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      return getSparkTransactions(ctx.user.id, limit, offset);
    }),

  /**
   * 創建 Stripe Checkout Session（一次性付款）
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        packageType: z.enum(["snack", "energy", "super", "flagship"]),
        successUrl: z.string().optional(),
        cancelUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const user = ctx.user;
      const pkg = SPARK_PACKAGES[input.packageType];
      const priceId = SPARK_PRICE_IDS[input.packageType];

      // Use Origin or Referer header to get the actual frontend URL (not internal Cloud Run host)
      const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/[^/]*$/, '') || '';
      const baseUrl = origin || `${ctx.req.protocol}://${ctx.req.headers.host || ctx.req.headers[":"] || "localhost:3000"}`;
      const successUrl = input.successUrl || `${baseUrl}/account?spark_topup=success`;
      const cancelUrl = input.cancelUrl || `${baseUrl}/feed`;

      // Build line items - use price ID if available, otherwise create price inline
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
        ? [{ price: priceId, quantity: 1 }]
        : [{
            price_data: {
              currency: pkg.currency.toLowerCase(),
              product_data: {
                name: `Lulubaby Spark - ${pkg.nameEn}`,
                description: `${pkg.sparks.toLocaleString()} Spark${pkg.bonus > 0 ? ` + ${pkg.bonus.toLocaleString()} bonus` : ""}`,
              },
              unit_amount: pkg.price * 100, // Stripe uses cents
            },
            quantity: 1,
          }];

      const session = await stripe.checkout.sessions.create({
        mode: "payment", // 一次性付款，不是訂閱
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id.toString(),
          packageType: input.packageType,
          sparks: pkg.sparks.toString(),
          bonus: pkg.bonus.toString(),
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * 消耗 Spark（內部使用，由其他路由調用）
   */
  consume: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
        description: z.string(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return deductSpark(
        ctx.user.id,
        input.amount,
        input.description,
        input.metadata ? JSON.stringify(input.metadata) : undefined
      );
    }),
});
