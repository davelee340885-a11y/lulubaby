# Lulubaby 版本變更日誌

> **文檔用途**：此文檔記錄 Lulubaby 平台的所有版本變更，包含每個版本的功能新增、修改、修復和技術細節。任何 AI 或開發者都可以根據此文檔回滾到特定版本或在其他平台重建。
>
> **當前版本**：v1.0  
> **最後更新**：2026年1月6日  
> **作者**：Manus AI

---

## 版本索引

| 版本 | 發布日期 | 主要變更 | 狀態 |
|-----|---------|---------|------|
| v1.0 | 2026-01-06 | 初始完整版本 | ✅ 當前版本 |

---

## v1.0 - 初始完整版本

**發布日期**：2026年1月6日  
**Checkpoint ID**：待創建  
**技術文檔**：LULUBABY_PLATFORM_REBUILD_GUIDE.md

### 功能清單

此版本包含 Lulubaby 平台的所有核心功能：

#### 1. 用戶認證系統
- Manus OAuth 整合
- 用戶角色管理（user/admin）
- Session 管理

#### 2. AI 智能體配置
- AI 人設設定（名稱、頭像、歡迎語、System Prompt）
- 48 項性格評分系統（8 大維度 × 6 項）
- 17 項超能力開關
- 快速人設模板

#### 3. 知識庫管理
- 5 種知識來源類型：
  - 文件上傳（PDF、TXT、DOCX）
  - YouTube 影片字幕提取
  - 網頁內容抓取
  - 直接文字輸入
  - FAQ 問答對

#### 4. 對話系統
- 即時 AI 對話
- 對話歷史記錄
- 知識庫上下文注入
- 客戶記憶注入

#### 5. 客戶記憶系統
- 客戶識別（Session ID + 瀏覽器指紋）
- 7 種記憶類型
- 對話摘要自動生成
- 客戶資料自動提取

#### 6. 版面設定
- 3 種佈局風格（簡約、專業名片、自訂背景）
- 快捷按鈕配置（10 種按鈕類型）
- 主題顏色自訂
- 即時預覽功能

#### 7. 自訂網域系統
- Name.com API 整合（域名搜索、購買）
- Stripe 支付整合（Checkout Session、Webhook）
- Cloudflare DNS 整合（Zone 創建、CNAME、SSL）
- 域名動態路由
- 價格策略：Name.com 原價 × 1.3（30% 加價）

#### 8. 會員計劃
- 免費計劃（每日 20 次對話）
- 基本計劃（HK$299/月）
- Premium 計劃（HK$599/月）

#### 9. 團隊功能
- 團隊創建和管理
- 成員角色（owner/admin/member）
- 團隊知識庫共享

### 數據庫結構

此版本包含 **18 個數據表**：

| 表名 | 用途 |
|-----|------|
| users | 用戶基本資料 |
| ai_personas | AI 人設配置 |
| ai_training | 訓練設定（48 項評分） |
| superpowers | 超能力開關 |
| knowledge_bases | 知識庫項目 |
| quick_buttons | 快捷按鈕 |
| conversations | 對話記錄 |
| customers | 客戶檔案 |
| customer_memories | 客戶記憶 |
| customer_conversation_summaries | 對話摘要 |
| teams | 團隊資料 |
| team_members | 團隊成員 |
| team_knowledge | 團隊知識庫 |
| user_domains | 用戶域名 |
| domain_health_logs | 域名健康記錄 |
| domain_orders | 域名訂單 |
| stripe_payments | 支付記錄 |
| subscriptions | 訂閱記錄 |

### 第三方服務

| 服務 | 用途 | API 版本 |
|-----|------|---------|
| Manus OAuth | 用戶認證 | - |
| Manus LLM API | AI 對話 | gpt-4o-mini |
| Name.com | 域名註冊 | v4 |
| Cloudflare | DNS 和 SSL | v4 |
| Stripe | 支付處理 | - |
| S3 | 文件存儲 | - |

### 環境變數

```
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
NAMECOM_USERNAME=...
NAMECOM_API_TOKEN=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PUBLISHABLE_KEY=...
```

### 重建指南

要重建此版本，請參考 `LULUBABY_PLATFORM_REBUILD_GUIDE.md` 的第十部分。

---

## 版本管理指令

| 您說的指令 | 系統動作 | 版本變化 |
|-----------|---------|----------|
| **「save this version」** | 自動遞增次版本號，生成這次升級的內容摘要 | v1.0 → v1.1 → v1.2... |
| **「save to Lulubaby vX」** | 跳轉到指定主版本，生成完整平台摘要（包含所有中間更新） | v1.x → v2.0 → v3.0... |

**範例流程**：
1. 當前 v1.0
2. 您說「save this version」→ 自動變成 v1.1，記錄這次的變更
3. 您說「save this version」→ 自動變成 v1.2，記錄這次的變更
4. 您說「save to Lulubaby v2」→ 跳轉到 v2.0，生成完整摘要（包含 v1.1、v1.2 的所有內容）

---

## 版本升級模板

### 次版本升級模板（save this version）

```markdown
## vX.X - 版本名稱

**發布日期**：YYYY-MM-DD  
**Checkpoint ID**：xxxxxxxx  
**基於版本**：vX.X-1

### 新增功能
- 功能 1：詳細說明
- 功能 2：詳細說明

### 修改功能
- 修改 1：原本 → 現在
- 修改 2：原本 → 現在

### 修復問題
- 修復 1：問題描述和解決方案
- 修復 2：問題描述和解決方案

### 數據庫變更
- 新增表：表名和結構
- 修改表：變更說明
- 新增欄位：表名.欄位名

### API 變更
- 新增路由：路由名稱和功能
- 修改路由：變更說明
- 移除路由：路由名稱

### 第三方服務變更
- 新增服務：服務名稱和用途
- 配置變更：變更說明

### 環境變數變更
- 新增：變數名稱和用途
- 移除：變數名稱

### 重建差異
從 vX.X-1 升級到 vX.X 需要：
1. 步驟 1
2. 步驟 2
3. ...

### 回滾指南
從 vX.X 回滾到 vX.X-1 需要：
1. 步驟 1
2. 步驟 2
3. ...
```

### 主版本升級模板（save to Lulubaby vX）

```markdown
## vX.0 - 主版本名稱

**發布日期**：YYYY-MM-DD  
**Checkpoint ID**：xxxxxxxx  
**基於版本**：vX-1.Y（最後一個次版本）

### 完整平台摘要

此版本包含以下所有功能：

#### 1. 用戶認證系統
- 功能說明...

#### 2. AI 智能體配置
- 功能說明...

#### 3. 知識庫管理
- 功能說明...

#### 4. 對話系統
- 功能說明...

#### 5. 客戶記憶系統
- 功能說明...

#### 6. 版面設定
- 功能說明...

#### 7. 自訂網域系統
- 功能說明...

#### 8. 會員計劃
- 功能說明...

#### 9. 團隊功能
- 功能說明...

### 數據庫結構

| 表名 | 用途 |
|-----|------|
| ... | ... |

### 第三方服務

| 服務 | 用途 | API 版本 |
|-----|------|----------|
| ... | ... | ... |

### 環境變數

```
DATABASE_URL=...
...
```

### 從 vX-1 到 vX 的所有變更

包含以下次版本的所有更新：
- vX-1.1：變更摘要
- vX-1.2：變更摘要
- ...

### 重建指南

要重建此版本，請參考 `LULUBABY_PLATFORM_REBUILD_GUIDE.md`。
```

---

## 版本命名規則

- **主版本號（X.0）**：重大功能變更或架構調整
- **次版本號（X.X）**：新功能添加或重要修改
- **修訂號（X.X.X）**：Bug 修復或小幅優化

範例：
- v1.0 → v1.1：添加新功能
- v1.1 → v1.2：添加新功能
- v1.2 → v2.0：重大架構調整
- v2.0 → v2.0.1：Bug 修復

---

**文檔結束**
