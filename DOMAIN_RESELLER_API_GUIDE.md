# Lulubaby 域名轉售 API 接入指南

**版本**: 1.0  
**更新日期**: 2026-01-02  
**作者**: Manus AI

---

## 概述

本指南詳細說明如何在 Lulubaby 平台中接入域名轉售 API，實現一站式域名購買體驗。用戶可以直接在 Lulubaby 平台內搜索、購買和管理域名，無需跳轉到第三方網站。

---

## 方案比較

經過研究，以下是三個最適合 Lulubaby 的域名轉售 API 選項：

| 比較項目 | Name.com Core API | Porkbun API | Cloudflare Registrar |
|---------|------------------|-------------|---------------------|
| **接入門檻** | 免費註冊，無最低充值 | 免費註冊，無最低充值 | 僅限 Enterprise 客戶 |
| **.com 註冊價** | $9.99 USD/年 | $9.68 USD/年 | $9.15 USD/年（批發價） |
| **API 文檔質量** | 優秀（OpenAPI 3.1） | 良好 | 有限 |
| **Sandbox 測試** | ✅ 提供 | ❌ 無 | ❌ 無 |
| **DNS 管理 API** | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| **SSL 證書** | ❌ 需另購 | ✅ 免費提供 | ✅ 免費提供 |
| **知名客戶** | Vercel, Replit, Netlify | 個人開發者為主 | 大型企業 |
| **推薦程度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐（門檻高） |

**推薦選擇：Name.com Core API**

Name.com 提供最完整的 API 功能、優秀的文檔、Sandbox 測試環境，且被 Vercel、Replit 等知名公司使用，可靠性有保證。

---

## Name.com Core API 接入步驟

### 第一步：創建 Name.com 帳號

1. 前往 [name.com](https://www.name.com) 註冊帳號
2. 完成郵箱驗證
3. 登入後進入 Account Settings

### 第二步：生成 API Token

1. 進入 **Account Settings** → **Security** → **API Tokens**
2. 點擊 **Generate New Token**
3. 為 Token 命名（例如：`lulubaby-production`）
4. 保存生成的 API Token（只會顯示一次！）

> **重要**：API Token 等同於密碼，請妥善保管，不要在前端代碼中暴露。

### 第三步：設置 Sandbox 測試環境

Name.com 提供獨立的 Sandbox 環境用於測試：

| 環境 | API URL | 用戶名格式 |
|-----|---------|-----------|
| Production | `https://api.name.com` | `your_username` |
| Sandbox | `https://api.dev.name.com` | `your_username-test` |

在 Sandbox 環境中：
1. 使用 `your_username-test` 作為用戶名
2. 需要單獨生成 Sandbox API Token
3. 所有操作都是模擬的，不會產生真實費用

### 第四步：API 認證方式

Name.com 使用 HTTP Basic Authentication：

```bash
# 方式一：使用 curl -u 參數
curl -u "username:api_token" https://api.name.com/v4/domains

# 方式二：使用 Authorization Header
curl -H "Authorization: Basic $(echo -n 'username:api_token' | base64)" \
     https://api.name.com/v4/domains
```

### 第五步：核心 API 端點

以下是實現一站式域名購買所需的核心 API：

#### 1. 檢查域名可用性

```
GET /core/v1/domains/{domainName}/check
```

**請求示例**：
```bash
curl -u "username:token" \
     "https://api.name.com/core/v1/domains/example.com/check"
```

**響應示例**：
```json
{
  "domainName": "example.com",
  "available": false,
  "purchasable": false,
  "premium": false
}
```

#### 2. 獲取域名價格

```
GET /core/v1/domains/{domainName}/pricing
```

**響應示例**：
```json
{
  "domainName": "mywebsite.com",
  "registrationPrice": 9.99,
  "renewalPrice": 9.99,
  "transferPrice": 9.99,
  "premium": false
}
```

#### 3. 註冊域名

```
POST /core/v1/domains
```

**請求體**：
```json
{
  "domainName": "mywebsite.com",
  "duration": 1,
  "contacts": {
    "registrant": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1.5551234567",
      "address1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "US"
    }
  },
  "nameservers": [
    "ns1.example.com",
    "ns2.example.com"
  ]
}
```

#### 4. 管理 DNS 記錄

```
# 列出 DNS 記錄
GET /core/v1/domains/{domainName}/records

# 創建 DNS 記錄
POST /core/v1/domains/{domainName}/records

# 刪除 DNS 記錄
DELETE /core/v1/domains/{domainName}/records/{recordId}
```

---

## Lulubaby 平台整合實現

### 數據庫設計

需要新增以下表來存儲域名訂單和配置：

```sql
-- 域名訂單表
CREATE TABLE domain_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255) NOT NULL,
  tld VARCHAR(50) NOT NULL,
  duration_years INT DEFAULT 1,
  cost_usd DECIMAL(10,2) NOT NULL,
  sell_price_hkd DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'registered', 'failed', 'refunded') DEFAULT 'pending',
  name_com_order_id VARCHAR(255),
  registrant_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- 域名價格緩存表（避免頻繁調用 API）
CREATE TABLE domain_pricing_cache (
  tld VARCHAR(50) PRIMARY KEY,
  registration_price_usd DECIMAL(10,2),
  renewal_price_usd DECIMAL(10,2),
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 後端 API 設計

在 `server/routers.ts` 中添加以下 tRPC 路由：

```typescript
// 域名購買相關路由
domainPurchase: {
  // 搜索域名可用性
  search: protectedProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ input }) => {
      // 調用 Name.com API 檢查可用性
    }),
  
  // 獲取域名價格（含 30% 加價）
  getPrice: protectedProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ input }) => {
      // 調用 Name.com API 獲取價格
      // 加價 30% 後返回
    }),
  
  // 創建域名訂單
  createOrder: protectedProcedure
    .input(z.object({
      domain: z.string(),
      duration: z.number().min(1).max(10),
      registrantInfo: z.object({...})
    }))
    .mutation(async ({ input, ctx }) => {
      // 創建訂單記錄
      // 返回 Stripe 付款連結
    }),
  
  // 完成域名註冊（Stripe Webhook 調用）
  completeRegistration: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      // 調用 Name.com API 註冊域名
      // 設置 DNS 記錄
      // 更新訂單狀態
    })
}
```

### 定價策略

| 項目 | 成本（USD） | 加價 30% | 港幣定價（1 USD = 7.8 HKD） |
|-----|-----------|---------|---------------------------|
| .com 註冊 | $9.99 | $12.99 | HK$102 |
| .com 續費 | $9.99 | $12.99 | HK$102 |
| .io 註冊 | ~$35 | $45.50 | HK$355 |
| .ai 註冊 | ~$80 | $104 | HK$812 |
| 域名管理費 | - | - | HK$99/年（額外收取） |

**總收費公式**：
```
用戶支付 = (Name.com 價格 × 1.3 × 7.8) + HK$99 管理費
```

### 前端用戶流程

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 搜索域名                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔍 輸入您想要的域名                                      │   │
│  │  ┌─────────────────────────────────────┐ [搜索]          │   │
│  │  │ mybusiness                          │                 │   │
│  │  └─────────────────────────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 選擇域名                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ mybusiness.com        HK$102/年     [選擇]           │   │
│  │  ✅ mybusiness.io         HK$355/年     [選擇]           │   │
│  │  ❌ mybusiness.ai         已被註冊                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 填寫註冊資料                                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  域名持有人資料（WHOIS）                                   │   │
│  │  姓名: _______________  電話: _______________            │   │
│  │  電郵: _______________  地址: _______________            │   │
│  │  城市: _______________  國家: _______________            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: 付款                                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  訂單摘要                                                 │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  mybusiness.com (1 年)              HK$102               │   │
│  │  域名管理費 (1 年)                   HK$99                │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  總計                               HK$201               │   │
│  │                                                         │   │
│  │  [💳 使用 Stripe 付款]                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: 完成                                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎉 恭喜！域名註冊成功！                                   │   │
│  │                                                         │   │
│  │  您的域名: mybusiness.com                                │   │
│  │  到期日期: 2027-01-02                                    │   │
│  │                                                         │   │
│  │  DNS 已自動配置，您的 AI 助手現在可以通過                  │   │
│  │  https://mybusiness.com 訪問了！                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 實施時間表

| 階段 | 任務 | 預計時間 |
|-----|------|---------|
| 1 | 申請 Name.com API Token | 30 分鐘 |
| 2 | 設置 Sandbox 測試環境 | 1 小時 |
| 3 | 實現域名搜索 API | 2 小時 |
| 4 | 實現域名價格查詢 API | 1 小時 |
| 5 | 整合 Stripe 支付 | 3 小時 |
| 6 | 實現域名註冊 API | 3 小時 |
| 7 | 實現自動 DNS 配置 | 2 小時 |
| 8 | 前端 UI 開發 | 4 小時 |
| 9 | 測試和調試 | 3 小時 |
| **總計** | | **約 20 小時** |

---

## 下一步行動

1. **立即**：前往 [name.com](https://www.name.com) 註冊帳號
2. **生成 API Token**：Account Settings → Security → API Tokens
3. **提供 API 憑證**：將 API Token 提供給 Manus，我將為您完成技術整合
4. **整合 Stripe**：確保 Stripe 已設置好，用於處理域名購買付款

---

## 參考資源

- [Name.com Core API 文檔](https://docs.name.com/docs)
- [Name.com API 認證指南](https://docs.name.com/docs/getting-started/authentication)
- [Name.com TLD 價格列表](https://docs.name.com/docs/api-reference/tld-pricing/tld-price-list)
- [Porkbun API 文檔](https://porkbun.com/api/json/v3/documentation)（備選方案）

---

**文檔版本歷史**

| 版本 | 日期 | 更新內容 |
|-----|------|---------|
| 1.0 | 2026-01-02 | 初始版本 |
