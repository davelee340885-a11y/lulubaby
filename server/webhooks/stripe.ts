/**
 * Stripe Webhook 處理器
 * 監聽支付事件並自動觸發 Name.com 域名購買 + Cloudflare 配置
 * 
 * 所有操作均為冪等性設計：
 * - 域名已購買 → 跳過購買，直接進行 Cloudflare 配置
 * - Cloudflare Zone 已存在 → 重用現有 Zone
 * - Worker Route 已存在 → 重用現有 Route
 * - DNS 記錄已存在 → 重用現有記錄
 */

import Stripe from 'stripe';
import { getDb } from '../db';
import { updateDomainOrderStatus, getDomainOrder } from '../db';
import { purchaseDomain, checkDomainAvailability } from '../namecom';
import { ENV } from '../_core/env';

// 使用統一的 ENV 環境變數
function getDomainStripe(): Stripe {
  const key = ENV.stripeSecretKey;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Please set LULUBABY_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY in environment.');
  }
  return new Stripe(key);
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

/**
 * 檢查域名是否已在 Name.com 帳戶中（已購買）
 */
async function isDomainAlreadyRegistered(domain: string): Promise<boolean> {
  try {
    const NAMECOM_USERNAME = process.env.NAMECOM_USERNAME;
    const NAMECOM_API_TOKEN = process.env.NAMECOM_API_TOKEN;
    if (!NAMECOM_USERNAME || !NAMECOM_API_TOKEN) return false;

    const auth = Buffer.from(`${NAMECOM_USERNAME}:${NAMECOM_API_TOKEN}`).toString("base64");
    const response = await fetch(`https://api.name.com/v4/domains/${domain}`, {
      headers: { "Authorization": `Basic ${auth}` },
    });
    // 200 = domain exists in our account, 404 = not found
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * 執行完整的域名配置流程（Name.com 購買 + Cloudflare 配置）
 * 此函數為冪等性設計，可安全重試
 */
async function performDomainSetup(orderId: number, domain: string, userId: number): Promise<void> {
  const { updateDomainOrderDnsConfig, bindDomainToPersona, publishDomain, getPersonaByUserId } = await import('../db');
  const { setupCustomDomain } = await import('../cloudflare');

  // ── Step 1: 購買域名（如果尚未購買）──────────────────────────────────────
  const alreadyRegistered = await isDomainAlreadyRegistered(domain);

  if (alreadyRegistered) {
    console.log(`[webhook] Domain ${domain} already registered in Name.com account, skipping purchase`);
    // 確保訂單狀態反映已購買
    await updateDomainOrderStatus(orderId, 'registered');
  } else {
    console.log(`[webhook] Fetching current price from Name.com for: ${domain}`);
    const availabilityResult = await checkDomainAvailability([domain]);

    if (!availabilityResult.results || availabilityResult.results.length === 0) {
      throw new Error('Unable to fetch domain price from Name.com');
    }

    const domainInfo = availabilityResult.results[0];
    if (!domainInfo.purchasable) {
      // 域名不可購買但也不在我們帳戶中 → 可能被他人搶注
      throw new Error(`Domain ${domain} is not purchasable (may have been registered by someone else)`);
    }

    const actualPurchasePrice = domainInfo.purchasePrice;
    if (!actualPurchasePrice) {
      throw new Error('Unable to get domain purchase price from Name.com');
    }

    console.log(`[webhook] Name.com original price: $${actualPurchasePrice} USD`);
    console.log(`[webhook] Purchasing domain ${domain}...`);

    const purchaseRequest = {
      domain: { domainName: domain },
      purchasePrice: actualPurchasePrice,
      purchaseType: domainInfo.purchaseType || 'registration',
      years: 1,
    };

    await purchaseDomain(purchaseRequest);
    await updateDomainOrderStatus(orderId, 'registered');
    console.log(`[webhook] Domain ${domain} purchased successfully`);
  }

  // ── Step 2: 配置 Cloudflare（冪等性，可安全重試）──────────────────────────
  console.log(`[webhook] Setting up Cloudflare for ${domain}...`);

  await updateDomainOrderDnsConfig(orderId, {
    dnsStatus: 'configuring',
  });

  const { zoneId, nameservers, routeId } = await setupCustomDomain(domain);

  console.log(`[webhook] Cloudflare setup complete: Zone=${zoneId}, Route=${routeId}`);
  console.log(`[webhook] Nameservers: ${nameservers.join(', ')}`);

  // 更新數據庫記錄
  await updateDomainOrderDnsConfig(orderId, {
    cloudflareZoneId: zoneId,
    nameservers: nameservers,
    dnsStatus: 'pending',
    sslStatus: 'pending',
    lastDnsCheck: new Date(),
  });

  // ── Step 3: 綁定域名到用戶的 Persona 並發布 ─────────────────────────────
  const persona = await getPersonaByUserId(userId);
  if (persona) {
    await bindDomainToPersona(orderId, persona.id);
    await publishDomain(orderId);
    console.log(`[webhook] Domain ${domain} bound to Persona ID: ${persona.id} and published`);
  } else {
    console.warn(`[webhook] No persona found for userId=${userId}, skipping persona binding`);
  }

  console.log(`[webhook] Full setup complete for ${domain}. DNS will propagate within 24-48 hours.`);
}

/**
 * 處理 checkout.session.completed 事件（主要處理器）
 * 當 Checkout Session 完成時觸發
 */
export const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const orderIdStr = session.metadata?.orderId;
  if (!orderIdStr) {
    console.error('[webhook] Checkout session missing orderId in metadata');
    return;
  }

  const orderId = parseInt(orderIdStr);
  console.log(`[webhook] Processing checkout.session.completed for order ${orderId}`);

  const order = await getDomainOrder(orderId);
  if (!order) {
    console.error(`[webhook] Order not found: ${orderId}`);
    return;
  }

  // 更新訂單狀態為支付成功
  await updateDomainOrderStatus(orderId, 'payment_completed');
  console.log(`[webhook] Order ${orderId} (${order.domain}) marked as payment_completed`);

  try {
    await performDomainSetup(orderId, order.domain, order.userId);
  } catch (error) {
    console.error(`[webhook] Domain setup failed for ${order.domain}:`, error);

    // 記錄詳細錯誤信息到數據庫
    try {
      const { updateDomainOrderDnsConfig } = await import('../db');
      await updateDomainOrderDnsConfig(orderId, {
        dnsStatus: 'error',
        dnsErrorMessage: String(error),
      });
    } catch (dbError) {
      console.error('[webhook] Failed to update error status in DB:', dbError);
    }

    // 不重新拋出錯誤，避免 Stripe 重試（重試會導致重複購買）
    // 改為記錄錯誤並讓管理員手動處理
  }
};

/**
 * 處理 payment_intent.succeeded 事件（備用處理器）
 */
export const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  const orderIdStr = paymentIntent.metadata?.orderId;
  if (!orderIdStr) {
    console.error('[webhook] Payment intent missing orderId in metadata');
    return;
  }

  const orderId = parseInt(orderIdStr);
  const order = await getDomainOrder(orderId);

  if (!order) {
    console.error(`[webhook] Order not found: ${orderId}`);
    return;
  }

  // 驗證支付金額
  if (paymentIntent.amount !== order.totalPrice) {
    console.error(`[webhook] Payment amount mismatch. Expected: ${order.totalPrice}, Got: ${paymentIntent.amount}`);
    return;
  }

  await updateDomainOrderStatus(orderId, 'payment_completed');

  try {
    await performDomainSetup(orderId, order.domain, order.userId);
  } catch (error) {
    console.error(`[webhook] Domain setup failed for ${order.domain}:`, error);
    try {
      const { updateDomainOrderDnsConfig } = await import('../db');
      await updateDomainOrderDnsConfig(orderId, {
        dnsStatus: 'error',
        dnsErrorMessage: String(error),
      });
    } catch (dbError) {
      console.error('[webhook] Failed to update error status in DB:', dbError);
    }
  }
};

/**
 * 處理 payment_intent.payment_failed 事件
 */
export const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  const orderIdStr = paymentIntent.metadata?.orderId;
  if (!orderIdStr) {
    console.error('[webhook] Payment intent missing orderId in metadata');
    return;
  }

  const orderId = parseInt(orderIdStr);
  await updateDomainOrderStatus(orderId, 'payment_failed');
  console.log(`[webhook] Payment failed for order: ${orderId}`);
};

/**
 * 驗證 Webhook 簽名
 */
export const verifyWebhookSignature = (
  body: string,
  signature: string,
  secret: string
): WebhookEvent => {
  try {
    return getDomainStripe().webhooks.constructEvent(body, signature, secret) as WebhookEvent;
  } catch (error) {
    console.error('[webhook] Signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * 處理 Webhook 事件（主入口）
 */
export const handleWebhookEvent = async (event: WebhookEvent): Promise<void> => {
  console.log(`[webhook] Received event: ${event.type}`);
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.refunded':
      console.log('[webhook] Charge refunded:', event.data.object);
      break;
    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }
};
