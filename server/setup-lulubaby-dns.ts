/**
 * 測試腳本：為 lulubaby.xyz 配置 DNS
 * 使用 Cloudflare API 創建 Zone 和 CNAME 記錄
 */

import { setupDomain } from './services/cloudflare';
import { getDomainOrder, updateDomainOrderDnsConfig } from './db';

async function setupLulubabyDns() {
  console.log('='.repeat(60));
  console.log('為 lulubaby.xyz 配置 DNS');
  console.log('='.repeat(60));
  
  try {
    // 1. 查詢域名訂單
    console.log('\n1. 查詢 lulubaby.xyz 的訂單信息...');
    const order = await getDomainOrder(210003);
    
    if (!order) {
      console.error('❌ 找不到訂單 ID 210003');
      return;
    }
    
    console.log(`✅ 找到訂單:`);
    console.log(`   域名: ${order.domain}`);
    console.log(`   狀態: ${order.status}`);
    console.log(`   DNS 狀態: ${order.dnsStatus || '未配置'}`);
    console.log(`   SSL 狀態: ${order.sslStatus || '未配置'}`);
    
    // 2. 調用 setupDomain 配置 DNS
    console.log('\n2. 開始配置 Cloudflare DNS...');
    console.log('   這將執行以下操作:');
    console.log('   - 創建 Cloudflare Zone');
    console.log('   - 添加 CNAME 記錄指向 lulubaby.manus.space');
    console.log('   - 啟用 Full SSL');
    console.log('   - 更新 Name.com Nameservers');
    
    const result = await setupDomain(order.domain);
    
    if (result.success) {
      console.log('\n✅ DNS 配置成功!');
      console.log(`   Zone ID: ${result.zoneId}`);
      console.log(`   CNAME Record ID: ${result.cnameRecordId}`);
      console.log(`   Nameservers:`);
      result.nameservers?.forEach(ns => console.log(`     - ${ns}`));
      
      // 3. 更新數據庫中的 DNS 配置信息
      console.log('\n3. 更新數據庫中的 DNS 配置...');
      await updateDomainOrderDnsConfig(210003, {
        cloudflareZoneId: result.zoneId,
        cloudflareCnameRecordId: result.cnameRecordId,
        nameservers: result.nameservers,
        dnsStatus: 'active' as const,
      });
      
      console.log('✅ 數據庫更新成功');
      
      console.log('\n' + '='.repeat(60));
      console.log('配置完成！');
      console.log('='.repeat(60));
      console.log('\n下一步：');
      console.log('1. 等待 DNS 傳播（通常需要 5-10 分鐘）');
      console.log('2. 訪問 https://lulubaby.xyz 測試');
      console.log('3. 如果看到 Cloudflare 錯誤，請檢查 Nameservers 是否已更新');
      
    } else {
      console.error('\n❌ DNS 配置失敗:');
      console.error(`   錯誤: ${result.error}`);
      
      if (result.error?.includes('already exists')) {
        console.log('\n提示: Zone 已存在，可能之前已經配置過');
        console.log('     請檢查 Cloudflare 控制台確認配置');
      }
    }
    
  } catch (error) {
    console.error('\n❌ 配置過程中發生錯誤:');
    console.error(error);
  }
}

// 執行配置
setupLulubabyDns()
  .then(() => {
    console.log('\n腳本執行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n腳本執行失敗:', error);
    process.exit(1);
  });
