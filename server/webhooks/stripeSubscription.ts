/**
 * Stripe Spark 充值 Webhook 處理器
 * 處理一次性付款的 checkout.session.completed 事件
 */

import Stripe from "stripe";
import { ENV } from "../_core/env";
import { addSpark } from "../db";
import { SPARK_PACKAGES, type SparkPackageType } from "../../shared/stripeConfig";
import { getDb } from "../db";
import { sparkTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe(): Stripe {
  const key = ENV.stripeSecretKey;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured. Please set LULUBABY_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY in environment.");
  }
  return new Stripe(key);
}

/**
 * 檢查交易是否已處理（冪等性）
 */
async function isSessionAlreadyProcessed(sessionId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(sparkTransactions)
    .where(eq(sparkTransactions.stripeSessionId, sessionId))
    .limit(1);
  return result.length > 0;
}

/**
 * 處理 checkout.session.completed 事件
 * 為用戶增加 Spark（含 bonus）
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const packageType = session.metadata?.packageType as SparkPackageType | undefined;

  if (!userId || !packageType) {
    console.error("[Spark Webhook] checkout.session.completed missing userId or packageType metadata");
    return;
  }

  // 冪等性檢查
  if (await isSessionAlreadyProcessed(session.id)) {
    console.log(`[Spark Webhook] Session ${session.id} already processed, skipping`);
    return;
  }

  const pkg = SPARK_PACKAGES[packageType];
  if (!pkg) {
    console.error(`[Spark Webhook] Unknown package type: ${packageType}`);
    return;
  }

  const userIdNum = parseInt(userId);
  const totalSparks = pkg.sparks + pkg.bonus;

  // 為用戶增加 Spark
  await addSpark(
    userIdNum,
    totalSparks,
    `充值 ${pkg.name} (${pkg.nameEn})`,
    session.id,
    JSON.stringify({
      packageType,
      sparks: pkg.sparks,
      bonus: pkg.bonus,
      price: pkg.price,
      currency: pkg.currency,
    })
  );

  console.log(
    `[Spark Webhook] User ${userId} topped up ${totalSparks} Spark via ${pkg.nameEn} (session: ${session.id})`
  );
}

/**
 * 驗證 Lulubaby Stripe Webhook 簽名
 */
export function verifyLulubabyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const secret = ENV.stripeWebhookSecret;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured. Please set LULUBABY_STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET in environment.");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}

/**
 * 處理 Spark 充值相關的 Webhook 事件
 */
export async function handleSubscriptionWebhookEvent(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    default:
      console.log(`[Spark Webhook] Unhandled event type: ${event.type}`);
  }
}
