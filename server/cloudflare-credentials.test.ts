import { describe, it, expect } from 'vitest';

describe('Cloudflare API 憑證驗證', () => {
  it('應該已設置 CLOUDFLARE_ACCOUNT_ID 環境變數', () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(accountId).toBeDefined();
    expect(accountId).not.toBe('');
    // Account ID 應該是 32 位十六進制字符串
    expect(accountId?.length).toBe(32);
  });

  it('應該已設置 CLOUDFLARE_API_TOKEN 環境變數', () => {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    expect(apiToken).toBeDefined();
    expect(apiToken).not.toBe('');
    // API Token 應該有一定長度
    expect(apiToken!.length).toBeGreaterThan(30);
  });

  it('應該能成功驗證 Cloudflare API Token', async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.log('跳過測試：缺少 Cloudflare 憑證');
      return;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json() as { success: boolean; result?: { status: string } };
    
    expect(data.success).toBe(true);
    expect(data.result?.status).toBe('active');
  }, 15000);

  it('應該能查詢 Zones 列表', async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.log('跳過測試：缺少 Cloudflare 憑證');
      return;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?account.id=${accountId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json() as { success: boolean; result: unknown[] };
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.result)).toBe(true);
  }, 15000);
});
