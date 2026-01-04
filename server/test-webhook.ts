/**
 * Webhook 測試腳本
 * 模擬 Stripe 發送 payment_intent.succeeded 事件
 */

import { handlePaymentIntentSucceeded } from './webhooks/stripe';
import { getDomainOrder } from './db';

async function testWebhook() {
  console.log('🧪 開始測試 Webhook 處理邏輯...\n');

  // 先查詢訂單信息以獲取正確的總價
  const orderId = 60001;
  const order = await getDomainOrder(orderId);
  if (!order) {
    console.error('❌ 訂單不存在');
    return;
  }

  // 模擬一個支付成功的 PaymentIntent，使用訂單的實際總價
  const mockPaymentIntent = {
    id: 'pi_test_123456789',
    object: 'payment_intent',
    amount: order.totalPrice, // 使用訂單的實際總價
    currency: 'hkd',
    status: 'succeeded',
    metadata: {
      orderId: orderId.toString(),
    },
  } as any;

  try {
    console.log('📦 測試訂單 ID:', mockPaymentIntent.metadata.orderId);
    
    console.log('📋 訂單資訊:');
    console.log('  - 域名:', order.domain);
    console.log('  - 狀態:', order.status);
    console.log('  - 價格:', `HK$${(order.totalPrice / 100).toFixed(2)}`);
    console.log('');

    // 調用 Webhook 處理函數
    console.log('🚀 觸發 Webhook 處理邏輯...');
    await handlePaymentIntentSucceeded(mockPaymentIntent);

    console.log('\n✅ Webhook 處理完成！');
    console.log('');
    
    // 再次查詢訂單狀態
    const updatedOrder = await getDomainOrder(parseInt(mockPaymentIntent.metadata.orderId));
    if (updatedOrder) {
      console.log('📋 更新後的訂單狀態:', updatedOrder.status);
      if (updatedOrder.registrationDate) {
        console.log('📅 註冊時間:', new Date(updatedOrder.registrationDate).toLocaleString('zh-TW'));
      }
    }

  } catch (error: any) {
    console.error('\n❌ 測試失敗:', error.message);
    console.error('錯誤詳情:', error);
  }
}

// 執行測試
testWebhook()
  .then(() => {
    console.log('\n🎉 測試完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 測試異常:', error);
    process.exit(1);
  });
