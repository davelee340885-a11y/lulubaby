/**
 * Stripe Webhook 處理器
 * 監聽支付事件並自動觸發 Name.com 域名購買
 */

import Stripe from 'stripe';
import { getDb } from '../db';
import { updateDomainOrderStatus, getDomainOrder } from '../db';
import { purchaseDomain } from '../namecom';
import { ENV } from '../_core/env';

// 使用環境變數中的 Stripe Secret Key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

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

    // 驗證支付金額（使用訂單的總價）
    if (paymentIntent.amount !== order.totalPrice) {
      console.error(
        `Payment amount mismatch. Expected: ${order.totalPrice}, Got: ${paymentIntent.amount}`
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
          domainName: order.domain,
        },
        purchasePrice: order.domainPrice / 100, // 轉換為美元
        years: 1,
      };

      const registrationResult = await purchaseDomain(purchaseRequest);

      // 更新訂單狀態為已註冊
      await updateDomainOrderStatus(orderId, 'registered');

      // 保存 Name.com 註冊信息
      console.log(`Domain registration result:`, registrationResult);

      console.log(`Domain registered successfully: ${order.domain}`);
    } catch (error) {
      console.error(`Failed to register domain with Name.com: ${error}`);
      // 更新訂單狀態為註冊失敗（使用 'failed' 狀態）
      await updateDomainOrderStatus(orderId, 'failed');
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
 * 處理 checkout.session.completed 事件
 * 當 Checkout Session 完成時觸發（推薦使用此事件）
 */
export const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  try {
    const orderIdStr = session.metadata?.orderId;
    if (!orderIdStr) {
      console.error('Checkout session missing orderId in metadata');
      return;
    }

    const orderId = parseInt(orderIdStr);
    const order = await getDomainOrder(orderId);

    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // 更新訂單狀態為支付成功
    await updateDomainOrderStatus(orderId, 'payment_completed');
    console.log(`Order ${orderId} marked as payment_completed`);

    // 自動調用 Name.com 購買 API
    console.log(`Triggering Name.com domain registration for order: ${orderId}`);
    
    try {
      // 準備域名購買請求
      const purchaseRequest = {
        domain: {
          domainName: order.domain,
        },
        purchasePrice: order.domainPrice / 100, // 轉換為美元
        years: 1,
      };

      const registrationResult = await purchaseDomain(purchaseRequest);

      // 更新訂單狀態為已註冊
      await updateDomainOrderStatus(orderId, 'registered');

      console.log(`Domain registered successfully: ${order.domain}`);
      console.log(`Registration result:`, registrationResult);
    } catch (error) {
      console.error(`Failed to register domain with Name.com:`, error);
      await updateDomainOrderStatus(orderId, 'failed');
      throw error;
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
    throw error;
  }
};

/**
 * 處理 Webhook 事件
 */
export const handleWebhookEvent = async (event: WebhookEvent): Promise<void> => {
  switch (event.type) {
    case 'checkout.session.completed':
      // 推薦：使用 checkout.session.completed 事件
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.succeeded':
      // 備用：也處理 payment_intent.succeeded 事件
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
