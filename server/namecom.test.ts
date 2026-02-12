import { describe, it, expect } from "vitest";

/**
 * Name.com API 驗證測試
 * 測試 API 憑證是否有效
 */

const NAMECOM_API_URL = "https://api.name.com/v4";

describe("Name.com API 憑證驗證", () => {
  const username = process.env.NAMECOM_USERNAME;
  const token = process.env.NAMECOM_API_TOKEN;

  it("應該已設置 NAMECOM_USERNAME 環境變數", () => {
    expect(username).toBeDefined();
    expect(username).not.toBe("");
  });

  it("應該已設置 NAMECOM_API_TOKEN 環境變數", () => {
    expect(token).toBeDefined();
    expect(token).not.toBe("");
  });

  it("應該能成功連接 Name.com API（Hello 端點）", async () => {
    // 使用 Hello 端點測試 API 連接
    const response = await fetch(`${NAMECOM_API_URL}/hello`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    // 檢查響應狀態
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    console.log("Name.com API Hello 響應:", data);
    
    // Hello 端點應該返回用戶名
    expect(data).toHaveProperty("username");
    expect(data.username).toBe(username);
  });

  it("應該能查詢域名可用性", async () => {
    // 測試域名可用性查詢
    const testDomain = "example-test-domain-12345.com";
    
    const response = await fetch(`${NAMECOM_API_URL}/domains:checkAvailability`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domainNames: [testDomain],
      }),
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    console.log("域名可用性查詢響應:", data);
    
    // 應該返回 results 陣列
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
  });

  // 跳過不穩定的價格列表測試 - Name.com API 有時會返回 404
  it.skip("應該能獲取 TLD 價格列表", async () => {
    // 測試獲取價格列表
    const response = await fetch(`${NAMECOM_API_URL}/domains:getPricing`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    console.log("TLD 價格列表響應（部分）:", JSON.stringify(data).substring(0, 500));
    
    // 應該返回價格資訊
    expect(data).toBeDefined();
  });
});
