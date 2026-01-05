/**
 * 檢查 lulubaby.xyz 在 Cloudflare 的配置狀態
 */

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

async function checkCloudflareZone() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!apiToken || !accountId) {
    console.error('❌ Cloudflare API Token 或 Account ID 未配置');
    return;
  }
  
  console.log('='.repeat(60));
  console.log('檢查 lulubaby.xyz 的 Cloudflare 配置');
  console.log('='.repeat(60));
  
  try {
    // 1. 查找 Zone
    console.log('\n1. 查找 lulubaby.xyz 的 Zone...');
    const zonesResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones?name=lulubaby.xyz`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const zonesData = await zonesResponse.json() as any;
    
    if (!zonesData.success || !zonesData.result || zonesData.result.length === 0) {
      console.error('❌ 找不到 lulubaby.xyz 的 Zone');
      return;
    }
    
    const zone = zonesData.result[0];
    console.log('✅ 找到 Zone:');
    console.log(`   Zone ID: ${zone.id}`);
    console.log(`   狀態: ${zone.status}`);
    console.log(`   Nameservers:`);
    zone.name_servers?.forEach((ns: string) => console.log(`     - ${ns}`));
    
    // 2. 查詢 DNS 記錄
    console.log('\n2. 查詢 DNS 記錄...');
    const dnsResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zone.id}/dns_records`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const dnsData = await dnsResponse.json() as any;
    
    if (dnsData.success && dnsData.result) {
      console.log(`✅ 找到 ${dnsData.result.length} 條 DNS 記錄:`);
      dnsData.result.forEach((record: any) => {
        console.log(`\n   記錄 ID: ${record.id}`);
        console.log(`   類型: ${record.type}`);
        console.log(`   名稱: ${record.name}`);
        console.log(`   內容: ${record.content}`);
        console.log(`   代理: ${record.proxied ? '是' : '否'}`);
        console.log(`   TTL: ${record.ttl}`);
      });
      
      // 檢查是否有指向 lulubaby.manus.space 的 CNAME
      const cnameRecords = dnsData.result.filter((r: any) => r.type === 'CNAME');
      const correctCname = cnameRecords.find((r: any) => 
        r.content.includes('lulubaby.manus.space') || r.content.includes('manus.space')
      );
      
      if (correctCname) {
        console.log('\n✅ 找到正確的 CNAME 記錄');
        console.log(`   ${correctCname.name} -> ${correctCname.content}`);
      } else {
        console.log('\n❌ 沒有找到指向 lulubaby.manus.space 的 CNAME 記錄');
        console.log('   需要添加 CNAME 記錄');
      }
    }
    
    // 3. 檢查 SSL 狀態
    console.log('\n3. 檢查 SSL 狀態...');
    const sslResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zone.id}/settings/ssl`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const sslData = await sslResponse.json() as any;
    
    if (sslData.success && sslData.result) {
      console.log('✅ SSL 設置:');
      console.log(`   模式: ${sslData.result.value}`);
      console.log(`   可修改: ${sslData.result.editable ? '是' : '否'}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('檢查完成');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 檢查過程中發生錯誤:');
    console.error(error);
  }
}

checkCloudflareZone()
  .then(() => {
    console.log('\n腳本執行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n腳本執行失敗:', error);
    process.exit(1);
  });
