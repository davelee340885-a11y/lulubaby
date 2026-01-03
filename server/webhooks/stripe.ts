/**
 * Stripe Webhook 處理器
 * 監聽支付事件並自動觸發 Name.com 域名購買
 */

import Stripe from 'stripe';
import { getDb } from '../db';
import { updateDomainOrderStatus, getDomainOrder } from '../db';
import { purchaseDomain } from '../namecom';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

/**
 * 處理 payment_intent.succeeded 事件
 * 當支付成功時，自動調用 Name.com API 購買域名
 */
export const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    const orderIdStr = paymentIntent.metadata?.orderId;
    if (!orderIdStr) {
      console.error('Payment intent missing orderId in metadata');
      return;
    }

    const orderId = parseInt(orderIdStr);
    // 獲取訂單信息
    const order = await getDomainOrder(orderId);

    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // 驗證支付金額
    const expectedAmount = order.domain_price + (order.include_management ? 9900 : 0);
    if (paymentIntent.amount !== expectedAmount) {
      console.error(
        `Payment amount mismatch. Expected: ${expectedAmount}, Got: ${paymentIntent.amount}`
      );
      return;
    }

    // 更新訂單狀態為支付成功
    await updateDomainOrderStatus(orderId, 'payment_completed');

    // 自動調用 Name.com 購買 API
    console.log(`Triggering Name.com domain registration for order: ${orderId}`);
    
    try {
      // 準備域名購買請求
      const purchaseRequest = {
        domain: {
          domainName: order.domain_name,
        },
        purchasePrice: order.domain_price / 100, // 轉換為美元
        years: 1,
      };

      const registrationResult = await purchaseDomain(purchaseRequest);

      // 更新訂單狀態為已註冊
      await updateDomainOrderStatus(orderId, 'registered');

      // 保存 Name.com 註冊信息
      const db = await getDb();
      if (db) {
        // 使用原始 SQL 更新（因為 Drizzle 可能沒有直接支持）
        await db.execute(
          `UPDATE domain_orders SET 
            registrar_order_id = ?, 
            expiration_date = ?, 
            status = ? 
          WHERE id = ?`,
          [
            registrationResult.orderId || 'namecom_' + orderId,
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            'registered',
            orderId,
          ]
        );
      }

      console.log(`Domain registered successfully: ${order.domain_name}`);
    } catch (error) {
      console.error(`Failed to register domain with Name.com: ${error}`);
      // 更新訂單狀態為註冊失敗
      await updateDomainOrderStatus(orderId, 'registration_failed');
      throw error;
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
};

/**
 * 處理 payment_intent.payment_failed 事件
 * 當支付失敗時，更新訂單狀態
 */
export const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    const orderIdStr = paymentIntent.metadata?.orderId;
    if (!orderIdStr) {
      console.error('Payment intent missing orderId in metadata');
      return;
    }

    const orderId = parseInt(orderIdStr);
    // 更新訂單狀態為支付失敗
    await updateDomainOrderStatus(orderId, 'payment_failed');

    console.log(`Payment failed for order: ${orderIdStr}`);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
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
    return stripe.webhooks.constructEvent(body, signature, secret) as WebhookEvent;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * 處理 Webhook 事件
 */
export const handleWebhookEvent = async (event: WebhookEvent): Promise<void> => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.refunded':
      console.log('Charge refunded:', event.data.object);
      // 處理退款邏輯
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};
