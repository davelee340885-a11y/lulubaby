# Lulubaby 平台完整重建指南

> **文檔用途**：此文檔是 Lulubaby 平台的完整技術規格書，包含所有功能模組、數據庫設計、API 接口、第三方服務整合的詳細說明。無論是 AI 助手還是人類開發者，都可以根據此文檔從零開始重建整個平台。
>
> **版本**：v1.0  
> **最後更新**：2026年1月6日  
> **作者**：Manus AI  
> **變更日誌**：LULUBABY_CHANGELOG.md

---

## 目錄

1. [平台概述](#第一部分平台概述)
2. [技術架構](#第二部分技術架構)
3. [數據庫設計](#第三部分數據庫設計)
4. [核心功能模組](#第四部分核心功能模組)
5. [自訂網域系統](#第五部分自訂網域系統)
6. [第三方服務整合](#第六部分第三方服務整合)
7. [前端組件結構](#第七部分前端組件結構)
8. [API 路由完整清單](#第八部分api-路由完整清單)
9. [部署與配置](#第九部分部署與配置)
10. [重建步驟指南](#第十部分重建步驟指南)

---

## 第一部分：平台概述

### 1.1 產品定義

**Lulubaby** 是一個個人化 AI 智能體平台，讓用戶（中小企業主、保險銷售、個人創業者）能夠快速創建專屬的 AI 客服助手。平台的核心價值在於讓非技術用戶也能訓練 AI、管理知識庫、並透過自訂域名發布專業的對話介面。

**品牌名稱含義**：「Lu」取自電影《Lucy》中開發大腦 100% 的超能力角色，「Baby」代表可愛的超能力寶貝，成為每一個人的 AI 助手。

### 1.2 目標用戶與使用場景

| 用戶類型 | 使用場景 | 核心需求 |
|---------|---------|---------|
| 中小企業主 | 電商客服、服務業諮詢 | 24小時自動回覆客戶問題 |
| 保險/金融銷售 | 產品介紹、客戶跟進 | 個性化銷售話術、客戶記憶 |
| 個人創業者 | 產品推廣、客戶支援 | 低成本建立專業客服形象 |
| 專業服務業 | 律師、會計師、顧問 | 初步諮詢自動化、預約管理 |

### 1.3 核心功能清單

平台包含以下主要功能模組：

**AI 智能體配置**：AI 人設設定、48 項性格評分、17 項超能力開關、知識庫管理（支援文件、YouTube、網頁、FAQ 等來源）。

**客戶關係管理**：客戶識別與記憶、對話摘要自動生成、客戶情緒分析、對話歷史追蹤。

**版面與品牌**：三種佈局風格（簡約、專業名片、自訂背景）、快捷按鈕配置、主題顏色自訂。

**自訂網域系統**：域名搜索與購買、Stripe 支付整合、Cloudflare DNS 自動配置、SSL 證書自動申請。

**數據分析**：對話統計、熱門問題排行、客戶行為分析。

**會員與計費**：免費/基本/Premium 三級會員、使用量追蹤、團隊計劃。

---

## 第二部分：技術架構

### 2.1 技術棧總覽

| 層級 | 技術 | 版本 | 用途 |
|-----|------|------|------|
| 前端框架 | React | 19 | UI 渲染和組件化 |
| 樣式系統 | Tailwind CSS | 4 | 原子化 CSS 樣式 |
| UI 組件庫 | shadcn/ui | 最新 | 預製 UI 組件 |
| 路由 | wouter | - | 輕量級客戶端路由 |
| 狀態管理 | tRPC + React Query | 11 | 類型安全的數據獲取 |
| 後端框架 | Express | 4 | HTTP 服務器 |
| API 層 | tRPC | 11 | 端到端類型安全 API |
| 數據庫 | MySQL / TiDB | - | 關係型數據持久化 |
| ORM | Drizzle ORM | - | 類型安全數據庫操作 |
| 認證 | Manus OAuth | - | 用戶身份認證 |
| 文件存儲 | S3 | - | 文件和圖片存儲 |
| AI 服務 | Manus LLM API | gpt-4o-mini | AI 對話生成 |
| 域名註冊 | Name.com API | v4 | 域名搜索與購買 |
| DNS 管理 | Cloudflare API | v4 | DNS 配置與 SSL |
| 支付處理 | Stripe | - | 域名購買支付 |

### 2.2 項目目錄結構

```
/home/ubuntu/ai_agent_ui/
├── client/                              # 前端代碼
│   ├── index.html                       # HTML 入口
│   ├── public/                          # 靜態資源
│   │   ├── logo.png                     # 主 Logo
│   │   └── favicon.ico                  # 網站圖標
│   └── src/
│       ├── App.tsx                      # 路由配置
│       ├── main.tsx                     # 應用入口
│       ├── index.css                    # 全局樣式
│       ├── pages/                       # 頁面組件
│       │   ├── Dashboard.tsx            # 儀表板
│       │   ├── Appearance.tsx           # 版面設定
│       │   ├── Training.tsx             # 訓練智能體
│       │   ├── Superpowers.tsx          # 開發超能力
│       │   ├── Knowledge.tsx            # 知識庫
│       │   ├── Customers.tsx            # 客戶記憶
│       │   ├── Domain.tsx               # 專屬網址
│       │   ├── Chat.tsx                 # 公開對話頁
│       │   ├── CustomDomainChat.tsx     # 自訂域名對話頁
│       │   ├── Pricing.tsx              # 會員計劃
│       │   └── Account.tsx              # 帳戶設定
│       ├── components/                  # 可重用組件
│       │   ├── DashboardLayout.tsx      # 側邊欄佈局
│       │   ├── AIChatBox.tsx            # 聊天組件
│       │   ├── CompactChatPreview.tsx   # 版面預覽組件
│       │   └── ui/                      # shadcn/ui 組件
│       └── lib/
│           ├── trpc.ts                  # tRPC 客戶端
│           └── utils.ts                 # 工具函數
├── server/                              # 後端代碼
│   ├── routers.ts                       # tRPC 路由定義
│   ├── db.ts                            # 數據庫操作函數
│   ├── storage.ts                       # S3 存儲操作
│   ├── namecom.ts                       # Name.com API 客戶端
│   ├── services/
│   │   └── cloudflare.ts                # Cloudflare API 客戶端
│   ├── webhooks/
│   │   └── stripe.ts                    # Stripe Webhook 處理器
│   └── _core/                           # 核心模組
│       ├── llm.ts                       # LLM 調用封裝
│       ├── oauth.ts                     # OAuth 認證
│       └── env.ts                       # 環境變數
├── drizzle/                             # 數據庫 Schema
│   └── schema.ts                        # 表結構定義
├── shared/                              # 共享類型
│   ├── types.ts                         # TypeScript 類型
│   ├── currency.ts                      # 貨幣處理
│   └── tldConfig.ts                     # TLD 配置
└── package.json                         # 依賴配置
```

### 2.3 環境變數配置

| 變數名 | 用途 | 來源 |
|-------|------|------|
| DATABASE_URL | MySQL/TiDB 連接字符串 | 系統注入 |
| JWT_SECRET | Session Cookie 簽名密鑰 | 系統注入 |
| VITE_APP_ID | Manus OAuth 應用 ID | 系統注入 |
| OAUTH_SERVER_URL | OAuth 後端 URL | 系統注入 |
| BUILT_IN_FORGE_API_URL | LLM API URL | 系統注入 |
| BUILT_IN_FORGE_API_KEY | LLM API 密鑰 | 系統注入 |
| NAMECOM_USERNAME | Name.com API 用戶名 | 手動配置 |
| NAMECOM_API_TOKEN | Name.com API Token | 手動配置 |
| CLOUDFLARE_API_TOKEN | Cloudflare API Token | 手動配置 |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare 帳戶 ID | 手動配置 |
| STRIPE_SECRET_KEY | Stripe 密鑰 | 手動配置 |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook 簽名密鑰 | 手動配置 |

---

## 第三部分：數據庫設計

### 3.1 數據表總覽

平台共有 **18 個數據表**，分為六大類別：

| 類別 | 數據表 | 用途 |
|-----|-------|------|
| 用戶與認證 | users | 用戶基本資料和角色 |
| AI 智能體 | ai_personas, ai_training, superpowers, knowledge_bases, quick_buttons | AI 配置和知識 |
| 客戶關係 | customers, customer_memories, customer_conversation_summaries, conversations | 客戶數據和對話 |
| 團隊協作 | teams, team_members, team_knowledge | 團隊功能 |
| 域名管理 | user_domains, domain_health_logs, domain_orders, stripe_payments | 自訂域名 |
| 會員計費 | subscriptions, usage_logs | 訂閱和使用量 |

### 3.2 核心表結構

#### users - 用戶表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  lastSignedIn TIMESTAMP
);
```

#### ai_personas - AI 人設表

```sql
CREATE TABLE ai_personas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT UNIQUE NOT NULL,
  agentName VARCHAR(100) DEFAULT 'AI Assistant',
  avatarUrl VARCHAR(512),
  welcomeMessage TEXT,
  systemPrompt TEXT,
  primaryColor VARCHAR(20) DEFAULT '#3B82F6',
  layoutStyle ENUM('minimal','professional','custom') DEFAULT 'minimal',
  backgroundImageUrl VARCHAR(512),
  profilePhotoUrl TEXT,
  tagline VARCHAR(255),
  suggestedQuestions TEXT,
  showQuickButtons BOOLEAN DEFAULT true,
  buttonDisplayMode VARCHAR(20) DEFAULT 'full',
  chatPlaceholder VARCHAR(255) DEFAULT '輸入您的問題...',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

#### domain_orders - 域名訂單表

```sql
CREATE TABLE domain_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  tld VARCHAR(20) NOT NULL,
  registrar VARCHAR(100) DEFAULT 'namecom',
  registrarOrderId VARCHAR(255),
  domainPrice INT NOT NULL,
  managementFee INT DEFAULT 1299,
  totalPrice INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripePaymentIntentId VARCHAR(255),
  status ENUM('pending_payment','payment_processing','payment_failed',
              'payment_completed','registering','registered','failed','cancelled'),
  registrationDate TIMESTAMP,
  expirationDate TIMESTAMP,
  autoRenewal BOOLEAN DEFAULT true,
  dnsStatus ENUM('pending','configuring','propagating','active','error') DEFAULT 'pending',
  sslStatus ENUM('pending','provisioning','active','error') DEFAULT 'pending',
  cloudflareZoneId VARCHAR(64),
  cloudflareCnameRecordId VARCHAR(64),
  targetHost VARCHAR(255) DEFAULT 'lulubaby.manus.space',
  personaId INT,
  isPublished BOOLEAN DEFAULT false,
  publishedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

#### ai_training - 訓練設定表（48 項評分）

此表包含 **8 大維度 × 6 項 = 48 項評分**（每項 1-5 分）：

| 維度 | 評分項目 |
|-----|---------|
| 💬 說話風格 | 幽默度、親切度、正式度、熱情度、耐心度、同理心 |
| 📝 回應方式 | 回覆長度、回覆深度、舉例頻率、數據使用、比喻使用、結構化程度 |
| 🤝 溝通態度 | 主動性、提問頻率、建議頻率、謙遜度、堅持度、關心度 |
| 💼 銷售風格 | 推銷強度、緊迫感、價格敏感度、比較使用、成交強度、跟進頻率 |
| 🎓 專業表現 | 術語使用、法規意識、風險提示、案例使用、市場分析、教育內容 |
| 😊 情緒處理 | 安撫能力、讚美頻率、鼓勵程度、負面處理、樂觀程度、緊張時幽默 |
| 🗣️ 語言習慣 | Emoji使用、口語化程度、廣東話使用、中英夾雜、感嘆詞使用、稱呼方式 |
| ⚠️ 服務邊界 | 話題範圍、隱私意識、承諾謹慎、轉介意願、不確定處理、投訴處理 |

---

## 第四部分：核心功能模組

### 4.1 AI 對話系統

AI 對話系統是平台的核心，負責處理用戶與 AI 智能體之間的對話。

**對話流程**：
1. 用戶發送訊息
2. 系統載入 AI 人設配置（System Prompt、訓練設定）
3. 系統載入相關知識庫內容
4. 系統載入客戶記憶（如有）
5. 調用 LLM API 生成回覆
6. 保存對話記錄
7. 返回 AI 回覆

**System Prompt 組成**：
```
基礎人設 + 訓練評分轉換的指令 + 知識庫內容 + 客戶記憶 + 對話歷史
```

### 4.2 知識庫管理

知識庫支援五種來源類型：

| 來源類型 | 說明 | 處理方式 |
|---------|------|---------|
| file | 文件上傳（PDF、TXT、DOCX） | 提取文字內容 |
| youtube | YouTube 影片 | 提取字幕文字 |
| webpage | 網頁 URL | 抓取網頁內容 |
| text | 直接文字輸入 | 直接存儲 |
| faq | FAQ 問答對 | JSON 格式存儲 |

### 4.3 客戶記憶系統

客戶記憶系統實現了跨對話的客戶識別和記憶功能：

**客戶識別機制**：
- 主要識別：Session ID
- 輔助識別：瀏覽器指紋（Fingerprint）
- 合併邏輯：相同指紋的不同 Session 會被合併

**記憶類型**：
- preference（偏好）
- fact（事實）
- need（需求）
- concern（顧慮）
- interaction（互動記錄）
- purchase（購買記錄）
- feedback（反饋意見）

**對話摘要自動生成**：
- 觸發時機：頁面關閉、標籤頁隱藏、5分鐘無活動
- 提取內容：對話摘要、關鍵話題、客戶提問、對話結果
- 自動提取客戶資料（姓名、電郵、電話）存入客戶記錄

---

## 第五部分：自訂網域系統

### 5.1 系統架構

自訂網域系統整合了三個第三方服務，實現從域名搜索到發布的完整流程：

```
用戶搜索域名 → Name.com API 查詢價格和可用性
     ↓
用戶選擇域名 → 創建訂單 → Stripe Checkout 支付
     ↓
支付成功 → Stripe Webhook 觸發 → Name.com API 購買域名
     ↓
域名購買成功 → Cloudflare API 創建 Zone → 設置 CNAME 記錄
     ↓
DNS 配置完成 → 更新 Nameservers → SSL 自動申請
     ↓
用戶綁定 AI 智能體 → 發布域名 → 域名可訪問
```

### 5.2 Name.com API 整合

**API 端點**：`https://api.name.com/v4`

**認證方式**：HTTP Basic Auth（用戶名:API Token）

**核心功能**：

| 功能 | API 端點 | 方法 |
|-----|---------|------|
| 檢查域名可用性 | /domains:checkAvailability | POST |
| 購買域名 | /domains | POST |
| 獲取域名資訊 | /domains/{domainName} | GET |
| 設置 DNS 記錄 | /domains/{domainName}/records | POST |
| 設置 Nameservers | /domains/{domainName}:setNameservers | POST |

**價格策略**：
- 加價比例：30%（MARKUP_PERCENTAGE = 0.30）
- 計算公式：`售價 = Name.com 原價 × 1.3`
- 管理費：$12.99 USD/年（可選）
- 貨幣：統一使用 USD

**代碼示例**（namecom.ts）：

```typescript
// 計算 Lulubaby 售價（含 30% 加價）
export const calculateSellingPrice = (usdPrice: number): number => {
  const markedUpPrice = usdPrice * (1 + MARKUP_PERCENTAGE);
  return Math.round(markedUpPrice * 100) / 100;
};

// 購買域名
export const purchaseDomain = async (
  request: DomainPurchaseRequest
): Promise<DomainInfo> => {
  return apiRequest<DomainInfo>("/domains", "POST", request);
};
```

### 5.3 Stripe 支付整合

**支付流程**：

1. **創建 Checkout Session**：
   - 用戶選擇域名後，後端創建 Stripe Checkout Session
   - 包含域名價格、管理費（可選）、訂單 ID 元數據

2. **用戶完成支付**：
   - 重定向到 Stripe Checkout 頁面
   - 支持信用卡、Apple Pay、Google Pay

3. **Webhook 處理**：
   - 監聽 `checkout.session.completed` 事件
   - 驗證簽名，更新訂單狀態
   - 自動觸發 Name.com 域名購買

**Webhook 處理器**（webhooks/stripe.ts）：

```typescript
export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
) => {
  const orderId = parseInt(session.metadata?.orderId);
  const order = await getDomainOrder(orderId);
  
  // 更新訂單狀態為支付成功
  await updateDomainOrderStatus(orderId, 'payment_completed');
  
  // 自動調用 Name.com 購買 API
  const purchaseRequest = {
    domain: { domainName: order.domain },
    purchasePrice: order.domainPrice / 100,
    years: 1,
  };
  
  const result = await purchaseDomain(purchaseRequest);
  await updateDomainOrderStatus(orderId, 'registered');
};
```

### 5.4 Cloudflare DNS 整合

**API 端點**：`https://api.cloudflare.com/client/v4`

**認證方式**：Bearer Token

**核心功能**：

| 功能 | API 端點 | 說明 |
|-----|---------|------|
| 創建 Zone | POST /zones | 將域名添加到 Cloudflare |
| 添加 DNS 記錄 | POST /zones/{zoneId}/dns_records | 設置 CNAME 指向 lulubaby.manus.space |
| 檢查 SSL 狀態 | GET /zones/{zoneId}/ssl/verification | 檢查 SSL 證書狀態 |
| 啟用 Full SSL | PATCH /zones/{zoneId}/settings/ssl | 啟用完整 SSL 模式 |

**完整域名設置流程**（services/cloudflare.ts）：

```typescript
export async function setupDomain(domain: string): Promise<DomainSetupResult> {
  // Step 1: 創建 Cloudflare Zone
  const zoneResult = await createZone(domain);
  
  // Step 2: 添加 CNAME 記錄
  const cnameResult = await addCnameRecord(zoneResult.zoneId!, domain);
  
  // Step 3: 啟用 Full SSL
  await enableFullSsl(zoneResult.zoneId!);
  
  // Step 4: 更新 Name.com 的 Nameservers
  await updateNamecomNameservers(domain, zoneResult.nameservers);
  
  return {
    success: true,
    zoneId: zoneResult.zoneId,
    cnameRecordId: cnameResult.recordId,
    nameservers: zoneResult.nameservers,
  };
}
```

### 5.5 域名動態路由

當用戶透過自訂域名（如 lulubaby.xyz）訪問時，系統需要識別域名並載入對應的 AI 智能體：

**前端路由邏輯**（App.tsx）：

```typescript
// 檢查是否為自訂域名
const isCustomDomain = !window.location.hostname.includes('manus.computer') 
                    && !window.location.hostname.includes('localhost');

// 自訂域名使用 CustomDomainChat 組件
if (isCustomDomain) {
  return <CustomDomainChat />;
}
```

**CustomDomainChat 組件邏輯**：

1. 從 `window.location.hostname` 獲取域名
2. 調用 `domains.getPublishedDomain` API 查詢綁定的智能體
3. 載入智能體配置（佈局風格、背景圖片、歡迎語等）
4. 渲染對話介面

---

## 第六部分：第三方服務整合

### 6.1 服務整合總覽

| 服務 | 用途 | API 版本 | 認證方式 |
|-----|------|---------|---------|
| Manus OAuth | 用戶認證 | - | OAuth 2.0 |
| Manus LLM API | AI 對話生成 | - | Bearer Token |
| Name.com | 域名註冊 | v4 | HTTP Basic Auth |
| Cloudflare | DNS 和 SSL | v4 | Bearer Token |
| Stripe | 支付處理 | - | Secret Key |
| S3 | 文件存儲 | - | AWS 憑證 |

### 6.2 Name.com 配置指南

**步驟 1：註冊 Name.com 帳戶**
- 訪問 https://www.name.com
- 創建帳戶並完成驗證

**步驟 2：獲取 API 憑證**
- 登入後進入 Account Settings → API Tokens
- 創建新的 API Token
- 記錄用戶名和 Token

**步驟 3：配置環境變數**
```
NAMECOM_USERNAME=your_username
NAMECOM_API_TOKEN=your_api_token
```

**步驟 4：預充值帳戶餘額**
- Name.com API 購買域名需要帳戶有足夠餘額
- 建議預充值 $100-500 USD

### 6.3 Cloudflare 配置指南

**步驟 1：創建 Cloudflare 帳戶**
- 訪問 https://dash.cloudflare.com
- 創建免費帳戶

**步驟 2：獲取 Account ID**
- 登入後在右側邊欄找到 Account ID

**步驟 3：創建 API Token**
- 進入 My Profile → API Tokens
- 創建新 Token，選擇 "Edit zone DNS" 模板
- 授權所有 Zones 的編輯權限

**步驟 4：配置環境變數**
```
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 6.4 Stripe 配置指南

**步驟 1：創建 Stripe 帳戶**
- 訪問 https://dashboard.stripe.com
- 完成帳戶設置和驗證

**步驟 2：獲取 API 密鑰**
- 進入 Developers → API keys
- 記錄 Publishable key 和 Secret key

**步驟 3：配置 Webhook**
- 進入 Developers → Webhooks
- 添加端點：`https://your-domain.com/api/webhooks/stripe`
- 選擇事件：`checkout.session.completed`
- 記錄 Webhook Signing Secret

**步驟 4：配置環境變數**
```
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 第七部分：前端組件結構

### 7.1 頁面組件

| 組件 | 路徑 | 功能 |
|-----|------|------|
| Dashboard | /dashboard | 儀表板、數據統計 |
| Appearance | /appearance | 版面設定、AI 設定 |
| Training | /training | 訓練智能體（48項評分） |
| Superpowers | /superpowers | 開發超能力（17項開關） |
| Knowledge | /knowledge | 知識庫管理 |
| Customers | /customers | 客戶記憶管理 |
| Domain | /domain | 專屬網址、域名購買 |
| Chat | /chat/:id | 公開對話頁 |
| CustomDomainChat | / | 自訂域名對話頁 |

### 7.2 對話頁面佈局風格

平台支援三種佈局風格，由 `layoutStyle` 欄位控制：

**minimal（簡約風格）**：
- 類似 ChatGPT 的簡潔設計
- 白色背景，無裝飾
- 適合專業、正式場合

**professional（專業名片風格）**：
- 顯示個人照片和標語
- 卡片式設計
- 適合個人品牌展示

**custom（自訂背景風格）**：
- 支援自訂背景圖片
- 文字使用白色配合陰影
- 適合品牌視覺強調

### 7.3 版面預覽組件

`CompactChatPreview` 組件提供即時預覽功能：

- 支援手機版和桌面版切換
- 即時反映設定變更
- 顯示所有佈局元素（歡迎語、輸入框、快捷按鈕）

---

## 第八部分：API 路由完整清單

### 8.1 認證相關

| 路由 | 方法 | 功能 |
|-----|------|------|
| auth.me | Query | 獲取當前用戶資訊 |
| auth.logout | Mutation | 登出 |

### 8.2 AI 智能體

| 路由 | 方法 | 功能 |
|-----|------|------|
| persona.get | Query | 獲取用戶的 AI 人設 |
| persona.getPublic | Query | 獲取公開的 AI 人設（對話頁用） |
| persona.update | Mutation | 更新 AI 人設 |
| training.get | Query | 獲取訓練設定 |
| training.update | Mutation | 更新訓練設定 |
| superpowers.get | Query | 獲取超能力設定 |
| superpowers.update | Mutation | 更新超能力設定 |

### 8.3 知識庫

| 路由 | 方法 | 功能 |
|-----|------|------|
| knowledge.list | Query | 列出知識庫項目 |
| knowledge.create | Mutation | 創建知識庫項目 |
| knowledge.delete | Mutation | 刪除知識庫項目 |

### 8.4 對話

| 路由 | 方法 | 功能 |
|-----|------|------|
| chat.send | Mutation | 發送訊息並獲取 AI 回覆 |
| chat.history | Query | 獲取對話歷史 |
| chat.endConversation | Mutation | 結束對話並生成摘要 |

### 8.5 客戶記憶

| 路由 | 方法 | 功能 |
|-----|------|------|
| customers.list | Query | 列出客戶 |
| customers.get | Query | 獲取客戶詳情 |
| customers.update | Mutation | 更新客戶資料 |
| customers.memories.list | Query | 列出客戶記憶 |
| customers.memories.create | Mutation | 創建記憶 |
| customers.memories.delete | Mutation | 刪除記憶 |

### 8.6 域名管理

| 路由 | 方法 | 功能 |
|-----|------|------|
| domains.search | Query | 搜索域名（含價格） |
| domains.checkAvailability | Query | 檢查單一域名可用性 |
| domains.createOrder | Mutation | 創建域名訂單 |
| domains.createCheckoutSession | Mutation | 創建 Stripe Checkout |
| domains.getOrders | Query | 獲取用戶的域名訂單 |
| domains.bindPersona | Mutation | 綁定 AI 智能體 |
| domains.unbindPersona | Mutation | 解除綁定 |
| domains.publish | Mutation | 發布域名 |
| domains.unpublish | Mutation | 取消發布 |
| domains.getPublished | Query | 獲取已發布的域名 |
| domains.getPublishedDomain | Query | 根據域名獲取綁定的智能體 |
| domains.checkDnsStatus | Query | 檢查 DNS 狀態 |
| domains.checkSslStatus | Query | 檢查 SSL 狀態 |

---

## 第九部分：部署與配置

### 9.1 Manus 平台部署

Lulubaby 設計為在 Manus 平台上運行，部署步驟：

1. 在 Manus 創建新的 Web 項目（web-db-user 模板）
2. 配置環境變數（Name.com、Cloudflare、Stripe）
3. 執行數據庫遷移：`pnpm db:push`
4. 啟動開發服務器：`pnpm dev`
5. 創建 Checkpoint 並發布

### 9.2 自訂域名配置

發布後，用戶可以：

1. 在「專屬網址」頁面搜索域名
2. 選擇域名並完成 Stripe 支付
3. 系統自動購買域名並配置 DNS
4. 綁定 AI 智能體並發布
5. 透過自訂域名訪問對話頁面

---

## 第十部分：重建步驟指南

### 10.1 從零開始重建

如果需要在新環境重建 Lulubaby 平台，請按以下步驟進行：

**步驟 1：創建項目**
```bash
# 在 Manus 平台創建 web-db-user 項目
# 或使用其他支援 React + Express + MySQL 的環境
```

**步驟 2：安裝依賴**
```bash
pnpm install
```

**步驟 3：配置環境變數**
- 設置所有必要的環境變數（參考 2.3 節）

**步驟 4：創建數據庫表**
- 複製 `drizzle/schema.ts` 中的表定義
- 執行 `pnpm db:push`

**步驟 5：實現核心功能**
按以下順序實現：
1. 用戶認證（OAuth）
2. AI 人設管理
3. 知識庫管理
4. 對話系統
5. 客戶記憶
6. 版面設定
7. 域名管理

**步驟 6：配置第三方服務**
- Name.com API
- Cloudflare API
- Stripe 支付

**步驟 7：測試與部署**
- 運行測試：`pnpm test`
- 創建 Checkpoint
- 發布到生產環境

### 10.2 關鍵代碼參考

本文檔中的代碼示例均來自實際運行的 Lulubaby 平台。完整代碼請參考以下文件：

| 功能 | 文件路徑 |
|-----|---------|
| 數據庫 Schema | drizzle/schema.ts |
| API 路由 | server/routers.ts |
| 數據庫操作 | server/db.ts |
| Name.com API | server/namecom.ts |
| Cloudflare API | server/services/cloudflare.ts |
| Stripe Webhook | server/webhooks/stripe.ts |
| 對話頁面 | client/src/pages/Chat.tsx |
| 自訂域名頁面 | client/src/pages/CustomDomainChat.tsx |
| 域名管理頁面 | client/src/pages/Domain.tsx |

---

## 附錄 A：會員計劃定價

| 計劃 | 月費 | 每日對話 | 每月對話 | 知識庫大小 |
|-----|------|---------|---------|-----------|
| 免費 | HK$0 | 20 次 | 300 次 | 1 MB |
| 基本 | HK$299 | 200 次 | 6,000 次 | 50 MB |
| Premium | HK$599 | 無限 | 50,000 次 | 500 MB |

## 附錄 B：團隊計劃定價

| 計劃 | 月費 | 成員上限 | 知識庫大小 |
|-----|------|---------|-----------|
| 基礎版 | HK$299 | 5 人 | 100 MB |
| 專業版 | HK$599 | 15 人 | 500 MB |
| 企業版 | HK$1,299 | 50 人 | 2,000 MB |

## 附錄 C：品牌設計規範

**主色調**：Teal (#14B8A6)

**Logo 概念**：眨眼對話氣泡 + 微笑表情

**配色方案**：
- 品牌主色：#14B8A6（Teal）
- 客戶前端類別：#10B981（綠色）
- AI 大腦類別：#8B5CF6（紫色）
- 開發者類別：#06B6D4（青色）
- 設定類別：#F59E0B（橙色）

---

**文檔結束**

此文檔涵蓋了 Lulubaby 平台的所有技術細節。如有任何問題或需要進一步說明，請聯繫開發團隊。
