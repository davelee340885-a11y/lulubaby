/**
 * 測試腳本：手動觸發域名註冊流程
 * 用於測試 Name.com API 對接
 */

import { getDomainOrder, updateDomainOrderStatus } from './db';
import { purchaseDomain } from './namecom';

async function testDomainRegistration() {
  try {
    console.log('=== 開始測試域名註冊流程 ===\n');
    
    // 1. 獲取最新的已支付訂單
    console.log('1. 查詢最新的已支付訂單...');
    const { getDb } = await import('./db');
    const db = await getDb();
    if (!db) {
      console.error('無法連接到數據庫');
      return;
    }
    
    const { domainOrders } = await import('../drizzle/schema');
    const { desc } = await import('drizzle-orm');
    
    const orders = await db
      .select()
      .from(domainOrders)
      .orderBy(desc(domainOrders.createdAt))
      .limit(5);
    
    console.log(`找到 ${orders.length} 筆訂單\n`);
    
    if (orders.length === 0) {
      console.log('沒有找到訂單，請先完成一次支付');
      return;
    }
    
    // 顯示所有訂單
    orders.forEach((order, index) => {
      console.log(`訂單 ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  域名: ${order.domain}`);
      console.log(`  狀態: ${order.status}`);
      console.log(`  價格: HK$${(order.totalPrice / 100).toFixed(2)}`);
      console.log(`  創建時間: ${order.createdAt}`);
      console.log('');
    });
    
    // 選擇第一個訂單進行測試
    const testOrder = orders[0];
    console.log(`\n2. 使用訂單 ID ${testOrder.id} 進行測試`);
    console.log(`   域名: ${testOrder.domain}`);
    console.log(`   當前狀態: ${testOrder.status}\n`);
    
    // 3. 先查詢 Name.com 的實際價格
    console.log('3. 查詢 Name.com 的實際價格...');
    const { checkDomainAvailability } = await import('./namecom');
    
    try {
      const availabilityResult = await checkDomainAvailability([testOrder.domain]);
      console.log('域名價格資訊:', JSON.stringify(availabilityResult, null, 2));
      console.log('');
      
      if (!availabilityResult.results || availabilityResult.results.length === 0) {
        console.error('❗ 無法查詢域名資訊');
        await updateDomainOrderStatus(testOrder.id, 'failed');
        return;
      }
      
      const domainInfo = availabilityResult.results[0];
      if (!domainInfo.purchasable) {
        console.error('❗ 域名不可購買');
        await updateDomainOrderStatus(testOrder.id, 'failed');
        return;
      }
      
      const actualPrice = domainInfo.purchasePrice;
      if (!actualPrice) {
        console.error('❗ 無法獲取域名價格');
        await updateDomainOrderStatus(testOrder.id, 'failed');
        return;
      }
      
      console.log(`實際價格: $${actualPrice}`);
      console.log('');
      
      // 4. 調用 Name.com API 購買域名
      console.log('4. 調用 Name.com API 購買域名...');
      
      const purchaseRequest = {
        domain: {
          domainName: testOrder.domain,
        },
        purchasePrice: actualPrice, // 使用實際價格
        years: 1,
      };
      
      console.log('購買請求:', JSON.stringify(purchaseRequest, null, 2));
      console.log('');
      
      const registrationResult = await purchaseDomain(purchaseRequest);
      
      console.log('✅ 域名註冊成功！');
      console.log('註冊結果:', JSON.stringify(registrationResult, null, 2));
      console.log('');
      
      // 5. 更新訂單狀態
      console.log('5. 更新訂單狀態為 registered...');
      await updateDomainOrderStatus(testOrder.id, 'registered');
      console.log('✅ 訂單狀態已更新\n');
      
      // 6. 驗證更新結果
      console.log('6. 驗證訂單狀態...');
      const updatedOrder = await getDomainOrder(testOrder.id);
      console.log(`當前狀態: ${updatedOrder?.status}`);
      console.log('');
      
      console.log('=== 測試完成 ===');
      
    } catch (error: any) {
      console.error('❗ 域名註冊失敗:', error.message);
      console.error('錯誤詳情:', error);
      
      // 更新訂單狀態為註冊失敗
      console.log('\n更新訂單狀態為 failed...');
      await updateDomainOrderStatus(testOrder.id, 'failed');
      console.log('訂單狀態已更新');
      
      throw error;
    }
    
  } catch (error) {
    console.error('測試腳本執行失敗:', error);
    process.exit(1);
  }
}

// 執行測試
testDomainRegistration()
  .then(() => {
    console.log('\n✅ 所有測試通過');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 測試失敗:', error);
    process.exit(1);
  });
