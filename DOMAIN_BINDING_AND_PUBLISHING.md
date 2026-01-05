# 域名綁定和發布功能完整指南

## 功能概述

本系統實現了完整的域名綁定和發布功能，允許用戶將購買的域名綁定到特定的 AI 智能體，並在 DNS 配置完成後發布網站。

## 核心功能

### 1. 域名綁定管理
- **綁定智能體**：將已購買的域名綁定到用戶的 AI 智能體
- **解除綁定**：取消域名與智能體的綁定關係
- **查看綁定狀態**：在域名列表中顯示當前綁定的智能體

### 2. DNS 和 SSL 狀態監控
- **DNS 狀態**：
  - `pending`：待配置
  - `propagating`：傳播中
  - `active`：已生效
  - `error`：錯誤
- **SSL 狀態**：
  - `pending`：待申請
  - `provisioning`：申請中
  - `active`：已啟用
  - `error`：錯誤
- **手動檢查**：提供刷新按鈕手動檢查 DNS 和 SSL 狀態

### 3. 域名發布系統
- **發布前置條件檢查**：
  - ✅ 域名已成功註冊
  - ✅ 已綁定智能體
  - ✅ DNS 已生效
- **發布操作**：一鍵發布網站，使域名可公開訪問
- **取消發布**：隨時取消發布，停止公開訪問
- **訪問網站**：已發布域名提供「訪問網站」按鈕

## 技術實現

### 數據庫架構

#### domain_orders 表新增欄位
```sql
personaId INT NULL,              -- 綁定的智能體 ID
isPublished BOOLEAN DEFAULT FALSE, -- 是否已發布
publishedAt DATETIME NULL,        -- 發布時間
dnsStatus VARCHAR(18),            -- DNS 狀態
sslStatus VARCHAR(18),            -- SSL 狀態
```

### 後端 API

#### 域名綁定 API
```typescript
// 綁定域名到智能體
domains.bindPersona.useMutation({
  orderId: number,
  personaId: number,
})

// 解除域名綁定
domains.unbindPersona.useMutation({
  orderId: number,
})
```

#### 域名發布 API
```typescript
// 發布域名
domains.publish.useMutation({
  orderId: number,
})

// 取消發布域名
domains.unpublish.useMutation({
  orderId: number,
})
```

#### DNS/SSL 檢查 API
```typescript
// 檢查 DNS 狀態
domains.checkDnsStatus.useMutation({
  orderId: number,
})

// 檢查 SSL 狀態
domains.checkSslStatus.useMutation({
  orderId: number,
})
```

### 前端界面

#### 已購買域名列表增強
- **域名狀態卡片**：顯示域名基本信息、訂單狀態
- **DNS/SSL 狀態顯示**：實時顯示 DNS 和 SSL 配置狀態
- **綁定智能體區域**：
  - 未綁定：顯示「綁定智能體」按鈕
  - 已綁定：顯示綁定的智能體名稱
- **發布按鈕**：
  - 條件滿足時顯示綠色「發布網站」按鈕
  - 已發布時顯示「已發布」徽章和「訪問網站」按鈕
- **發布條件提示**：清晰顯示發布所需的條件和當前狀態

## 使用流程

### 完整發布流程

1. **購買域名**
   - 在「搜索域名」標籤頁搜索並購買域名
   - 完成 Stripe 支付
   - 等待域名註冊完成

2. **配置 DNS**（自動）
   - 系統自動配置 Cloudflare DNS
   - 設置 CNAME 記錄指向 lulubaby.manus.space
   - 更新 Nameservers 到 Cloudflare

3. **等待 DNS 傳播**
   - DNS 傳播通常需要 5 分鐘 - 48 小時
   - 可點擊刷新按鈕手動檢查狀態
   - DNS 狀態變為「已生效」後可繼續

4. **綁定智能體**
   - 點擊「綁定智能體」按鈕
   - 系統自動綁定到當前用戶的 AI 智能體
   - 顯示綁定成功提示

5. **發布網站**
   - 確認所有條件已滿足（✅ 綁定智能體 + ✅ DNS 已生效）
   - 點擊綠色「發布網站」按鈕
   - 發布成功後可通過域名訪問 AI 對話頁面

6. **訪問網站**
   - 點擊「訪問網站」按鈕在新標籤頁打開
   - 或直接在瀏覽器輸入域名訪問

## 動態路由系統

### 域名識別機制
```typescript
// 從 HTTP 請求頭獲取訪問域名
const host = req.headers.host;

// 查詢已發布的域名
const publishedDomain = await getPublishedDomainByName(host);

// 載入對應的智能體配置
if (publishedDomain && publishedDomain.personaId) {
  const persona = await getPersonaById(publishedDomain.personaId);
  // 渲染智能體對話頁面
}
```

### 路由優先級
1. **自定義域名**：優先匹配已發布的自定義域名
2. **系統域名**：使用默認的 lulubaby.manus.space 域名
3. **子域名**：支持用戶自定義子域名（未來功能）

## 測試覆蓋

### 單元測試（10/10 通過）
- ✅ 綁定域名到智能體
- ✅ 更新智能體綁定
- ✅ 解除域名綁定
- ✅ 發布域名
- ✅ 查找已發布域名
- ✅ 未發布域名不可查找
- ✅ 取消發布域名
- ✅ 驗證發布前置條件（智能體綁定）
- ✅ 驗證發布前置條件（DNS 狀態）
- ✅ 完整發布工作流程

### 測試文件
- `server/domain-binding.test.ts`：域名綁定和發布功能測試

## 錯誤處理

### 常見錯誤和解決方案

#### 1. 綁定失敗
**錯誤**：「請先設定您的 AI 智能體」
**原因**：用戶尚未創建 AI 智能體
**解決**：前往「版面設定」頁面配置 AI 智能體

#### 2. 發布失敗
**錯誤**：「請先綁定智能體」
**原因**：域名尚未綁定到智能體
**解決**：點擊「綁定智能體」按鈕完成綁定

**錯誤**：「DNS 尚未生效，請先完成 DNS 配置」
**原因**：DNS 記錄尚未傳播完成
**解決**：等待 DNS 傳播（5 分鐘 - 48 小時），或點擊刷新按鈕檢查狀態

#### 3. DNS 檢查失敗
**錯誤**：「DNS 查詢失敗」
**原因**：DNS 記錄尚未生效或配置錯誤
**解決**：等待更長時間或聯繫技術支持

## 安全性考慮

### 權限控制
- 所有 API 端點都需要用戶登入（`protectedProcedure`）
- 驗證域名訂單屬於當前用戶
- 驗證智能體屬於當前用戶
- 防止跨用戶操作

### 數據驗證
- 訂單狀態檢查（必須是 `registered`）
- DNS 狀態檢查（發布前必須是 `active`）
- 智能體綁定檢查（發布前必須已綁定）

## 未來擴展

### 計劃中的功能
1. **多智能體支持**：一個域名可綁定多個智能體，使用路徑區分
2. **子域名管理**：支持創建和管理子域名（如 chat.example.com）
3. **自定義 DNS 記錄**：允許用戶添加自定義 DNS 記錄
4. **域名轉移**：支持將域名轉移到其他用戶
5. **域名分析**：提供域名訪問統計和分析

## 相關文檔

- [域名購買指南](./lulubaby_domain_purchase_guide.md)
- [Cloudflare API 集成](./server/services/cloudflare.ts)
- [Name.com API 集成](./server/namecom.ts)
- [技術藍圖](./LULUBABY_TECHNICAL_BLUEPRINT.md)

## 技術支持

如遇到問題，請查看：
1. 開發者控制台錯誤信息
2. 後端日誌（`server/_core/index.ts`）
3. 數據庫訂單狀態（`domain_orders` 表）
4. DNS 傳播狀態（使用 dig 或 nslookup 命令）

---

**最後更新**：2026-01-05
**版本**：1.0.0
**測試狀態**：✅ 10/10 測試通過
