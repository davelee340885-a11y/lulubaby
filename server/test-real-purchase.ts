/**
 * 真實域名購買端到端測試腳本
 * 
 * 用途：驗證完整的支付 → 購買 → 分成流程
 * 
 * 使用方法：
 * 1. 確保 Name.com 帳戶有足夠餘額
 * 2. 運行：pnpm exec tsx server/test-real-purchase.ts
 * 3. 按照提示完成測試
 */

import { getDomainPricing, purchaseDomain, verifyConnection } from './namecom';
import { createDomainOrder, getDomainOrder, updateDomainOrderStatus } from './db';

interface TestResult {
  step: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logResult(step: string, status: 'success' | 'failed' | 'skipped', message: string, data?: any) {
  results.push({ step, status, message, data });
  const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏭️';
  console.log(`${emoji} ${step}: ${message}`);
  if (data) {
    console.log('   詳情:', JSON.stringify(data, null, 2));
  }
}

async function testNameComConnection() {
  console.log('\n🔗 步驟 1: 測試 Name.com API 連接\n');
  
  try {
    const username = await verifyConnection();
    logResult('Name.com 連接', 'success', `已連接，用戶名: ${username}`);
    return true;
  } catch (error: any) {
    logResult('Name.com 連接', 'failed', error.message);
    return false;
  }
}

async function testDomainPricing(domain: string) {
  console.log('\n💰 步驟 2: 查詢域名價格\n');
  
  try {
    const pricing = await getDomainPricing(domain);
    
    if (!pricing.available) {
      logResult('域名可用性', 'failed', `域名 ${domain} 不可用或已被註冊`);
      return null;
    }
    
    logResult('域名可用性', 'success', `域名 ${domain} 可用`);
    logResult('域名價格', 'success', `註冊價格: $${pricing.originalPriceUsd} USD, 續費價格: $${pricing.renewalPriceUsd} USD`, pricing);
    
    return pricing;
  } catch (error: any) {
    logResult('域名價格查詢', 'failed', error.message);
    return null;
  }
}

async function testOrderCreation(domain: string, priceUsd: number) {
  console.log('\n📝 步驟 3: 創建測試訂單\n');
  
  try {
    // 模擬用戶 ID（實際應該從認證系統獲取）
    const testUserId = 1;
    
    // 將 USD 轉換為 HKD（假設匯率 1:7.8）
    const exchangeRate = 7.8;
    const priceHkd = priceUsd * exchangeRate;
    const priceCents = Math.round(priceHkd * 100);
    
    // 不包含管理費（測試用）
    const managementFeeCents = 0;
    const totalPriceCents = priceCents + managementFeeCents;
    
    const order = await createDomainOrder({
      userId: testUserId,
      domain: domain,
      tld: domain.split('.').pop() || 'com',
      domainPrice: priceCents,
      managementFee: managementFeeCents,
      totalPrice: totalPriceCents,
      currency: 'HKD',
      status: 'pending_payment',
    });
    
    if (!order) {
      logResult('訂單創建', 'failed', '無法創建訂單');
      return null;
    }
    
    logResult('訂單創建', 'success', `訂單 ID: ${order.id}`, {
      orderId: order.id,
      domain: order.domain,
      priceHkd: (totalPriceCents / 100).toFixed(2),
      priceCents: totalPriceCents,
    });
    
    return order;
  } catch (error: any) {
    logResult('訂單創建', 'failed', error.message);
    return null;
  }
}

async function testDomainPurchase(domain: string, priceUsd: number, orderId: number) {
  console.log('\n🛒 步驟 4: 測試 Name.com 域名購買\n');
  console.log('⚠️  警告：這將使用真實的 Name.com 帳戶餘額購買域名！');
  console.log('⚠️  請確認您的帳戶有足夠餘額，並且願意支付域名費用。\n');
  
  // 安全檢查：要求用戶確認
  console.log('如果您想繼續測試真實購買，請修改代碼中的 ENABLE_REAL_PURCHASE 變數為 true');
  const ENABLE_REAL_PURCHASE = false;
  
  if (!ENABLE_REAL_PURCHASE) {
    logResult('域名購買', 'skipped', '已跳過真實購買測試（安全保護）');
    console.log('\n💡 提示：如果您想測試真實購買，請：');
    console.log('   1. 確認 Name.com 帳戶餘額充足');
    console.log('   2. 修改 ENABLE_REAL_PURCHASE = true');
    console.log('   3. 重新運行測試腳本\n');
    return false;
  }
  
  try {
    // 更新訂單狀態為支付完成
    await updateDomainOrderStatus(orderId, 'payment_completed');
    logResult('訂單狀態', 'success', '訂單狀態已更新為 payment_completed');
    
    // 調用 Name.com 購買 API
    const purchaseRequest = {
      domain: {
        domainName: domain,
      },
      purchasePrice: priceUsd,
      years: 1,
    };
    
    console.log('正在調用 Name.com API 購買域名...');
    const result = await purchaseDomain(purchaseRequest);
    
    logResult('域名購買', 'success', '域名購買成功！', result);
    
    // 更新訂單狀態為已註冊
    await updateDomainOrderStatus(orderId, 'registered');
    logResult('訂單狀態', 'success', '訂單狀態已更新為 registered');
    
    return true;
  } catch (error: any) {
    logResult('域名購買', 'failed', error.message);
    
    // 更新訂單狀態為失敗
    await updateDomainOrderStatus(orderId, 'failed');
    logResult('訂單狀態', 'success', '訂單狀態已更新為 failed');
    
    return false;
  }
}

function calculateFinancials(priceUsd: number, includeManagement: boolean = false) {
  console.log('\n💰 步驟 5: 財務計算\n');
  
  const exchangeRate = 7.8;
  const stripeFeesRate = 0.034; // 3.4%
  const stripeFeesFixed = 2.35; // HK$2.35
  
  const priceHkd = priceUsd * exchangeRate;
  const managementFeeHkd = includeManagement ? 99 : 0;
  const totalRevenueHkd = priceHkd + managementFeeHkd;
  
  const stripeFeesHkd = totalRevenueHkd * stripeFeesRate + stripeFeesFixed;
  const namecomCostHkd = priceUsd * exchangeRate;
  const netProfitHkd = totalRevenueHkd - stripeFeesHkd - namecomCostHkd;
  const profitMargin = (netProfitHkd / totalRevenueHkd) * 100;
  
  const financials = {
    revenue: {
      domainPrice: priceHkd.toFixed(2),
      managementFee: managementFeeHkd.toFixed(2),
      total: totalRevenueHkd.toFixed(2),
    },
    costs: {
      stripeFees: stripeFeesHkd.toFixed(2),
      namecomCost: namecomCostHkd.toFixed(2),
      total: (stripeFeesHkd + namecomCostHkd).toFixed(2),
    },
    profit: {
      net: netProfitHkd.toFixed(2),
      margin: profitMargin.toFixed(2) + '%',
    },
  };
  
  console.log('📊 財務報告：');
  console.log('');
  console.log('收入：');
  console.log(`  域名價格：HK$${financials.revenue.domainPrice}`);
  console.log(`  管理費用：HK$${financials.revenue.managementFee}`);
  console.log(`  總收入：  HK$${financials.revenue.total}`);
  console.log('');
  console.log('成本：');
  console.log(`  Stripe 手續費：HK$${financials.costs.stripeFees}`);
  console.log(`  Name.com 成本：HK$${financials.costs.namecomCost}`);
  console.log(`  總成本：      HK$${financials.costs.total}`);
  console.log('');
  console.log('利潤：');
  console.log(`  淨利潤：HK$${financials.profit.net}`);
  console.log(`  利潤率：${financials.profit.margin}`);
  console.log('');
  
  if (netProfitHkd < 0) {
    logResult('利潤分析', 'failed', `利潤為負數 (HK$${netProfitHkd.toFixed(2)})，定價策略需要調整`, financials);
    console.log('⚠️  建議：');
    console.log('   1. 增加管理費（建議 HK$99/年）');
    console.log('   2. 調整域名價格（成本 × 1.5 + 固定利潤）');
    console.log('   3. 只銷售高利潤的 TLD（如 .com, .net）');
  } else if (profitMargin < 20) {
    logResult('利潤分析', 'success', `利潤率偏低 (${profitMargin.toFixed(2)}%)，建議優化定價`, financials);
  } else {
    logResult('利潤分析', 'success', `利潤率良好 (${profitMargin.toFixed(2)}%)`, financials);
  }
  
  return financials;
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 測試總結');
  console.log('='.repeat(60) + '\n');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  console.log(`總測試步驟：${results.length}`);
  console.log(`✅ 成功：${successCount}`);
  console.log(`❌ 失敗：${failedCount}`);
  console.log(`⏭️  跳過：${skippedCount}`);
  console.log('');
  
  if (failedCount > 0) {
    console.log('失敗的步驟：');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.step}: ${r.message}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('🧪 域名購買端到端測試');
  console.log('='.repeat(60) + '\n');
  
  // 測試域名（使用便宜的 .xyz）
  const testDomain = `test-${Date.now()}.xyz`;
  console.log(`測試域名：${testDomain}\n`);
  
  // 步驟 1: 測試 Name.com 連接
  const connectionOk = await testNameComConnection();
  if (!connectionOk) {
    console.log('\n❌ Name.com 連接失敗，測試終止');
    printSummary();
    process.exit(1);
  }
  
  // 步驟 2: 查詢域名價格
  const pricing = await testDomainPricing(testDomain);
  if (!pricing) {
    console.log('\n❌ 域名價格查詢失敗，測試終止');
    printSummary();
    process.exit(1);
  }
  
  // 步驟 3: 創建測試訂單
  const order = await testOrderCreation(testDomain, pricing.originalPriceUsd);
  if (!order) {
    console.log('\n❌ 訂單創建失敗，測試終止');
    printSummary();
    process.exit(1);
  }
  
  // 步驟 4: 測試域名購買（可選）
  await testDomainPurchase(testDomain, pricing.originalPriceUsd, order.id);
  
  // 步驟 5: 財務計算
  console.log('\n不包含管理費的情況：');
  calculateFinancials(pricing.originalPriceUsd, false);
  
  console.log('\n包含管理費的情況：');
  calculateFinancials(pricing.originalPriceUsd, true);
  
  // 打印總結
  printSummary();
  
  console.log('✅ 測試完成！');
  console.log('\n下一步：');
  console.log('1. 如果要測試真實購買，請修改 ENABLE_REAL_PURCHASE = true');
  console.log('2. 根據財務分析調整定價策略');
  console.log('3. 在前端完成完整的支付流程測試');
  console.log('4. 驗證 Webhook 自動觸發機制\n');
}

// 執行測試
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 測試異常:', error);
    process.exit(1);
  });
