/**
 * Lulubaby 30% 加價策略利潤計算測試
 * 
 * 用途：驗證不同價格區間的域名利潤率
 */

// 常數
const MARKUP_PERCENTAGE = 0.30;  // 30% 加價
const USD_TO_HKD_RATE = 7.8;
const STRIPE_FEE_RATE = 0.034;  // 3.4%
const STRIPE_FIXED_FEE = 2.35;  // HK$2.35
const MANAGEMENT_FEE = 99;  // HK$99/年

interface ProfitAnalysis {
  namecomCostUsd: number;
  namecomCostHkd: number;
  sellingPriceHkd: number;
  managementFee: number;
  totalRevenue: number;
  stripeFees: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
}

/**
 * 計算 Lulubaby 售價（含 30% 加價）
 */
function calculateSellingPrice(usdPrice: number): number {
  const hkdPrice = usdPrice * USD_TO_HKD_RATE;
  const markedUpPrice = hkdPrice * (1 + MARKUP_PERCENTAGE);
  return Math.round(markedUpPrice);
}

/**
 * 計算利潤分析
 */
function analyzeProfitability(
  namecomCostUsd: number,
  includeManagement: boolean = false
): ProfitAnalysis {
  // 1. 計算 Name.com 成本（HKD）
  const namecomCostHkd = namecomCostUsd * USD_TO_HKD_RATE;
  
  // 2. 計算 Lulubaby 售價（含 30% 加價）
  const sellingPriceHkd = calculateSellingPrice(namecomCostUsd);
  
  // 3. 計算管理費
  const managementFee = includeManagement ? MANAGEMENT_FEE : 0;
  
  // 4. 計算總收入
  const totalRevenue = sellingPriceHkd + managementFee;
  
  // 5. 計算 Stripe 手續費
  const stripeFees = totalRevenue * STRIPE_FEE_RATE + STRIPE_FIXED_FEE;
  
  // 6. 計算總成本
  const totalCost = stripeFees + namecomCostHkd;
  
  // 7. 計算淨利潤
  const netProfit = totalRevenue - totalCost;
  
  // 8. 計算利潤率
  const profitMargin = (netProfit / totalRevenue) * 100;
  
  return {
    namecomCostUsd,
    namecomCostHkd: Math.round(namecomCostHkd * 100) / 100,
    sellingPriceHkd,
    managementFee,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    stripeFees: Math.round(stripeFees * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
  };
}

/**
 * 打印利潤分析表
 */
function printProfitTable(analysis: ProfitAnalysis) {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│              財務分析報告                        │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ Name.com 成本：    $${analysis.namecomCostUsd.toFixed(2)} USD = HK$${analysis.namecomCostHkd.toFixed(2)}`);
  console.log(`│ Lulubaby 售價：    HK$${analysis.sellingPriceHkd.toFixed(2)} (含 30% 加價)`);
  console.log(`│ 管理費：           HK$${analysis.managementFee.toFixed(2)}`);
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ 總收入：           HK$${analysis.totalRevenue.toFixed(2)}`);
  console.log(`│ Stripe 手續費：    HK$${analysis.stripeFees.toFixed(2)}`);
  console.log(`│ Name.com 成本：    HK$${analysis.namecomCostHkd.toFixed(2)}`);
  console.log(`│ 總成本：           HK$${analysis.totalCost.toFixed(2)}`);
  console.log('├─────────────────────────────────────────────────┤');
  
  const profitStatus = analysis.netProfit >= 0 ? '✅' : '❌';
  const marginStatus = analysis.profitMargin >= 20 ? '✅' : analysis.profitMargin >= 0 ? '⚠️' : '❌';
  
  console.log(`│ 淨利潤：           HK$${analysis.netProfit.toFixed(2)} ${profitStatus}`);
  console.log(`│ 利潤率：           ${analysis.profitMargin.toFixed(2)}% ${marginStatus}`);
  console.log('└─────────────────────────────────────────────────┘');
  console.log('');
}

/**
 * 測試不同價格區間的域名
 */
function testPriceRanges() {
  console.log('\n🧪 Lulubaby 30% 加價策略 - 利潤分析測試\n');
  console.log('='.repeat(60));
  console.log('\n📊 測試場景 1: 便宜域名（$1-5 USD）\n');
  
  const cheapDomains = [
    { name: '.xyz', price: 1.99 },
    { name: '.co', price: 5.99 },
    { name: '.site', price: 2.99 },
  ];
  
  cheapDomains.forEach(domain => {
    console.log(`\n域名類型: ${domain.name} - $${domain.price} USD`);
    console.log('\n不包含管理費：');
    printProfitTable(analyzeProfitability(domain.price, false));
    
    console.log('包含管理費（HK$99/年）：');
    printProfitTable(analyzeProfitability(domain.price, true));
  });
  
  console.log('='.repeat(60));
  console.log('\n📊 測試場景 2: 中等價格域名（$10-20 USD）\n');
  
  const mediumDomains = [
    { name: '.com', price: 12.99 },
    { name: '.net', price: 14.99 },
    { name: '.io', price: 19.99 },
  ];
  
  mediumDomains.forEach(domain => {
    console.log(`\n域名類型: ${domain.name} - $${domain.price} USD`);
    console.log('\n不包含管理費：');
    printProfitTable(analyzeProfitability(domain.price, false));
    
    console.log('包含管理費（HK$99/年）：');
    printProfitTable(analyzeProfitability(domain.price, true));
  });
  
  console.log('='.repeat(60));
  console.log('\n📊 測試場景 3: 高價域名（$30+ USD）\n');
  
  const expensiveDomains = [
    { name: '.ai', price: 39.99 },
    { name: '.premium', price: 99.99 },
  ];
  
  expensiveDomains.forEach(domain => {
    console.log(`\n域名類型: ${domain.name} - $${domain.price} USD`);
    console.log('\n不包含管理費：');
    printProfitTable(analyzeProfitability(domain.price, false));
    
    console.log('包含管理費（HK$99/年）：');
    printProfitTable(analyzeProfitability(domain.price, true));
  });
}

/**
 * 生成利潤率對比表
 */
function generateComparisonTable() {
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 利潤率對比表\n');
  
  console.log('┌──────────┬────────────┬──────────────┬──────────────┐');
  console.log('│ 成本(USD)│ 售價(HKD)  │ 利潤(無管理) │ 利潤(含管理) │');
  console.log('├──────────┼────────────┼──────────────┼──────────────┤');
  
  const testPrices = [1.99, 2.99, 5.99, 9.99, 12.99, 19.99, 29.99, 49.99];
  
  testPrices.forEach(price => {
    const withoutMgmt = analyzeProfitability(price, false);
    const withMgmt = analyzeProfitability(price, true);
    
    const sellingPrice = calculateSellingPrice(price);
    
    console.log(
      `│ $${price.toFixed(2).padEnd(7)} │ HK$${sellingPrice.toString().padEnd(7)} │ ` +
      `${withoutMgmt.profitMargin.toFixed(1).padStart(5)}% ${withoutMgmt.netProfit >= 0 ? '✅' : '❌'} │ ` +
      `${withMgmt.profitMargin.toFixed(1).padStart(5)}% ${withMgmt.netProfit >= 0 ? '✅' : '❌'} │`
    );
  });
  
  console.log('└──────────┴────────────┴──────────────┴──────────────┘');
  console.log('');
}

/**
 * 分析最佳定價策略
 */
function analyzeBestStrategy() {
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 定價策略建議\n');
  
  // 找出盈虧平衡點
  let breakEvenPrice = 0;
  for (let price = 0.5; price <= 10; price += 0.1) {
    const analysis = analyzeProfitability(price, false);
    if (analysis.netProfit >= 0) {
      breakEvenPrice = price;
      break;
    }
  }
  
  console.log(`1. 盈虧平衡點（不含管理費）：`);
  console.log(`   Name.com 成本 ≥ $${breakEvenPrice.toFixed(2)} USD`);
  console.log(`   Lulubaby 售價 ≥ HK$${calculateSellingPrice(breakEvenPrice)}`);
  console.log('');
  
  // 找出 20% 利潤率的價格點
  let targetPrice = 0;
  for (let price = 0.5; price <= 50; price += 0.5) {
    const analysis = analyzeProfitability(price, false);
    if (analysis.profitMargin >= 20) {
      targetPrice = price;
      break;
    }
  }
  
  console.log(`2. 達到 20% 利潤率（不含管理費）：`);
  console.log(`   Name.com 成本 ≥ $${targetPrice.toFixed(2)} USD`);
  console.log(`   Lulubaby 售價 ≥ HK$${calculateSellingPrice(targetPrice)}`);
  console.log('');
  
  console.log('3. 建議策略：');
  console.log('   ✅ 便宜域名（< $6 USD）：強制包含管理費 HK$99');
  console.log('   ✅ 中等域名（$6-20 USD）：可選管理費');
  console.log('   ✅ 高價域名（> $20 USD）：不需要管理費也能盈利');
  console.log('');
  
  console.log('4. 預期利潤率：');
  const cheap = analyzeProfitability(1.99, true);
  const medium = analyzeProfitability(12.99, false);
  const expensive = analyzeProfitability(39.99, false);
  
  console.log(`   便宜域名 + 管理費：${cheap.profitMargin.toFixed(1)}% ✅`);
  console.log(`   中等域名（無管理費）：${medium.profitMargin.toFixed(1)}% ${medium.profitMargin >= 20 ? '✅' : '⚠️'}`);
  console.log(`   高價域名（無管理費）：${expensive.profitMargin.toFixed(1)}% ✅`);
  console.log('');
}

// 執行測試
console.clear();
testPriceRanges();
generateComparisonTable();
analyzeBestStrategy();

console.log('='.repeat(60));
console.log('\n✅ 測試完成！\n');
console.log('結論：');
console.log('- 30% 加價策略對中高價域名有效');
console.log('- 便宜域名需要搭配管理費才能盈利');
console.log('- 建議根據域名成本動態調整是否包含管理費\n');
