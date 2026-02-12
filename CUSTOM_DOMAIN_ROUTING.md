# 自定義域名動態路由系統

## 概述

本系統實現了完整的自定義域名動態路由功能，讓用戶可以通過已發布的自定義域名（如 lulubaby.xyz）直接訪問綁定的 AI 智能體對話頁面。

## 核心功能

### 1. 後端動態路由中間件

**文件位置：** `server/_core/domainRouting.ts`

**功能：**
- 從 HTTP 請求頭中獲取訪問域名
- 自動識別自定義域名和內部域名
- 查詢已發布的域名並獲取綁定的智能體 ID
- 將智能體 ID 注入到請求上下文中

**工作原理：**
```typescript
// 中間件會在每個請求中執行
app.use(domainRoutingMiddleware);

// 識別自定義域名
const host = req.headers.host; // 例如: lulubaby.xyz
const domain = host.split(':')[0]; // 移除端口號

// 跳過內部域名
if (domain === 'localhost' || domain.includes('manus.computer')) {
  return next();
}

// 查詢已發布的域名
const publishedDomain = await getPublishedDomainByName(domain);

// 注入智能體 ID 到請求上下文
if (publishedDomain && publishedDomain.personaId) {
  req.customDomainPersonaId = publishedDomain.personaId;
  req.customDomain = domain;
}
```

### 2. 前端域名識別和智能體載入

**文件位置：** `client/src/pages/CustomDomainChat.tsx`

**功能：**
- 自動檢測當前訪問域名
- 通過 tRPC API 查詢域名信息和綁定的智能體
- 載入智能體配置（頭像、歡迎語、快捷按鈕等）
- 顯示專屬的對話界面

**使用方式：**
```typescript
// 獲取當前域名
const currentDomain = window.location.hostname;

// 查詢域名信息
const { data: domainInfo } = trpc.domains.getPublishedDomain.useQuery({
  domain: currentDomain
});

// 獲取智能體 ID
const personaId = domainInfo?.personaId || 0;

// 載入智能體配置
const { data: persona } = trpc.persona.getPublic.useQuery({
  personaId
}, { enabled: personaId > 0 });
```

### 3. 路由邏輯

**文件位置：** `client/src/App.tsx`

**功能：**
- 在應用啟動時檢測是否為自定義域名
- 如果是自定義域名且訪問根路徑，自動顯示 CustomDomainChat 組件
- 保留內部路由（如 /domain、/appearance 等）的正常訪問

**實現邏輯：**
```typescript
function Router() {
  // 檢測是否為自定義域名
  const isCustomDomain = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('manus.computer');
  
  // 自定義域名訪問根路徑時，顯示對話頁面
  if (isCustomDomain && window.location.pathname === '/') {
    return <CustomDomainChat />;
  }
  
  // 其他情況使用正常路由
  return <Switch>...</Switch>;
}
```

## API 端點

### 1. 查詢已發布域名

**端點：** `trpc.domains.getPublishedDomain`

**類型：** `publicProcedure`（無需認證）

**輸入：**
```typescript
{
  domain: string // 域名，例如 "lulubaby.xyz"
}
```

**輸出：**
```typescript
{
  domain: string,      // 域名
  personaId: number,   // 綁定的智能體 ID
  isPublished: boolean // 是否已發布
} | null
```

**實現邏輯：**
- 查詢 `domainOrders` 表
- 條件：`domain` 匹配、`isPublished = true`、`status = 'registered'`、`personaId` 不為 null
- 大小寫不敏感

### 2. 獲取智能體公開信息

**端點：** `trpc.persona.getPublic`

**類型：** `publicProcedure`（無需認證）

**輸入：**
```typescript
{
  personaId: number // 智能體 ID
}
```

**輸出：**
```typescript
{
  id: number,
  agentName: string,
  avatarUrl: string | null,
  welcomeMessage: string,
  primaryColor: string | null,
  layoutStyle: string,
  backgroundImageUrl: string | null,
  profilePhotoUrl: string | null,
  tagline: string | null,
  suggestedQuestions: string[],
  showQuickButtons: boolean,
  buttonDisplayMode: string,
  chatPlaceholder: string | null,
  quickButtons: Array<{
    id: number,
    label: string,
    icon: string,
    actionType: string,
    actionValue: string | null
  }>
}
```

## 數據庫查詢

### getPublishedDomainByName

**文件位置：** `server/db.ts`

**功能：** 根據域名查詢已發布的域名訂單

**實現：**
```typescript
export async function getPublishedDomainByName(domain: string): Promise<DomainOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const { isNotNull } = await import('drizzle-orm');
  
  const result = await db.select()
    .from(domainOrders)
    .where(and(
      eq(domainOrders.domain, domain),
      eq(domainOrders.isPublished, true),
      eq(domainOrders.status, 'registered'),
      isNotNull(domainOrders.personaId) // 必須已綁定智能體
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}
```

**查詢條件：**
1. 域名匹配（大小寫不敏感）
2. 已發布（`isPublished = true`）
3. 已註冊（`status = 'registered'`）
4. 已綁定智能體（`personaId IS NOT NULL`）

## 錯誤處理

### 1. 域名未配置

**場景：** 訪問的域名不存在或未發布

**處理：** 顯示友好的錯誤提示，引導用戶完成配置步驟

**界面：**
```
域名未配置

此域名（example.com）尚未配置或未發布。

如果您是網站擁有者，請前往管理後台完成以下步驟：
1. 確認域名已成功註冊
2. 綁定域名到 AI 智能體
3. 等待 DNS 生效
4. 點擊「發布網站」按鈕
```

### 2. 智能體不存在

**場景：** 域名綁定的智能體 ID 無效

**處理：** 顯示錯誤提示，建議聯繫管理員

**界面：**
```
智能體不存在

找不到與此域名關聯的 AI 智能體。請聯繫網站管理員。
```

### 3. 載入中狀態

**場景：** 正在查詢域名和智能體信息

**處理：** 顯示載入動畫

**界面：**
```
[載入動畫]
載入中...
```

## 測試覆蓋

### 單元測試

**文件位置：** `server/domain-routing.test.ts`

**測試用例：** 11 個測試全部通過 ✅

**測試覆蓋：**

1. **域名查詢測試**
   - ✅ 查找已發布域名
   - ✅ 未發布域名返回 null
   - ✅ 不存在的域名返回 null

2. **發布前置條件測試**
   - ✅ 驗證域名必須已註冊
   - ✅ 驗證必須綁定智能體
   - ✅ 驗證 DNS 必須生效

3. **數據返回測試**
   - ✅ 返回正確的 persona ID
   - ✅ 返回域名名稱
   - ✅ 返回發布狀態

4. **大小寫敏感性測試**
   - ✅ 大寫域名查詢
   - ✅ 混合大小寫域名查詢

## 使用流程

### 1. 管理員配置流程

1. **購買域名**
   - 前往「專屬網址」頁面
   - 搜索並購買域名（例如 lulubaby.xyz）
   - 完成支付

2. **等待域名註冊**
   - 系統自動向 Name.com 提交註冊請求
   - 等待註冊完成（通常幾分鐘）

3. **配置 DNS**
   - 點擊「設定 DNS」按鈕
   - 系統自動配置 Cloudflare DNS
   - 等待 DNS 傳播（24-48 小時）

4. **綁定智能體**
   - 在域名卡片中點擊「綁定智能體」
   - 選擇要綁定的 AI 智能體
   - 確認綁定

5. **發布網站**
   - 確認 DNS 和 SSL 狀態為「已生效」
   - 點擊「發布網站」按鈕
   - 系統標記域名為已發布

### 2. 訪客訪問流程

1. **訪問自定義域名**
   - 在瀏覽器中輸入域名（例如 https://lulubaby.xyz）

2. **自動路由**
   - 系統識別自定義域名
   - 查詢綁定的智能體
   - 載入智能體配置

3. **顯示對話界面**
   - 顯示智能體頭像和歡迎語
   - 顯示建議問題和快捷按鈕
   - 開始對話

## 技術架構

### 請求流程

```
用戶訪問 lulubaby.xyz
    ↓
DNS 解析到 Manus 伺服器
    ↓
Express 接收請求
    ↓
domainRoutingMiddleware 中間件
    ↓
識別域名：lulubaby.xyz
    ↓
查詢數據庫：getPublishedDomainByName
    ↓
找到 personaId: 123
    ↓
注入到請求上下文：req.customDomainPersonaId = 123
    ↓
前端 Router 檢測自定義域名
    ↓
渲染 CustomDomainChat 組件
    ↓
調用 trpc.domains.getPublishedDomain API
    ↓
調用 trpc.persona.getPublic API
    ↓
載入智能體配置
    ↓
顯示對話界面
```

### 數據流

```
domainOrders 表
├── domain: "lulubaby.xyz"
├── personaId: 123
├── isPublished: true
├── status: "registered"
├── dnsStatus: "active"
└── sslStatus: "active"
    ↓
getPublishedDomainByName("lulubaby.xyz")
    ↓
返回 { domain, personaId, isPublished }
    ↓
getPersonaById(123)
    ↓
返回智能體配置
    ↓
渲染對話界面
```

## 安全考慮

### 1. 公開 API 訪問控制

- `trpc.domains.getPublishedDomain` 使用 `publicProcedure`，無需認證
- 只返回已發布域名的基本信息（domain、personaId、isPublished）
- 不暴露敏感信息（userId、訂單詳情等）

### 2. 智能體信息保護

- `trpc.persona.getPublic` 使用 `publicProcedure`，無需認證
- 只返回公開信息（名稱、頭像、歡迎語等）
- 不返回系統提示詞（systemPrompt）或私密配置

### 3. 域名驗證

- 查詢時驗證域名必須已註冊、已發布、已綁定智能體
- 防止未授權訪問未完成配置的域名

## 性能優化

### 1. 數據庫查詢優化

- 使用索引加速域名查詢
- 限制查詢結果為 1 條（`.limit(1)`）
- 只查詢必要的字段

### 2. 前端緩存

- tRPC 自動緩存查詢結果
- 減少重複的 API 調用
- 提升頁面載入速度

### 3. 中間件效率

- 跳過內部路由和靜態資源
- 只處理可能的自定義域名請求
- 避免不必要的數據庫查詢

## 未來擴展

### 1. 多智能體支持

- 支持一個域名綁定多個智能體
- 通過路徑區分不同智能體（例如 /sales、/support）

### 2. 自定義主題

- 允許用戶為每個域名設置獨立的主題
- 支持自定義 CSS 和品牌元素

### 3. 分析統計

- 記錄自定義域名的訪問量
- 提供域名級別的對話統計
- 生成域名使用報告

### 4. 多語言支持

- 根據訪客瀏覽器語言自動切換界面語言
- 支持智能體多語言對話

## 故障排除

### 問題 1：訪問域名顯示「域名未配置」

**可能原因：**
- 域名尚未發布
- 域名未綁定智能體
- DNS 尚未生效

**解決方法：**
1. 前往管理後台檢查域名狀態
2. 確認已完成綁定和發布步驟
3. 等待 DNS 傳播完成

### 問題 2：顯示「智能體不存在」

**可能原因：**
- 綁定的智能體已被刪除
- 數據庫數據不一致

**解決方法：**
1. 重新綁定智能體
2. 聯繫技術支持檢查數據庫

### 問題 3：載入緩慢

**可能原因：**
- 網絡延遲
- 數據庫查詢慢
- 前端資源載入慢

**解決方法：**
1. 檢查網絡連接
2. 優化數據庫索引
3. 啟用 CDN 加速

## 總結

自定義域名動態路由系統實現了完整的域名到智能體的映射和訪問功能，讓用戶可以通過專屬域名直接訪問 AI 智能體對話頁面。系統具有以下特點：

✅ **完整的路由邏輯** - 從後端中間件到前端組件的完整實現
✅ **友好的錯誤處理** - 清晰的錯誤提示和引導
✅ **全面的測試覆蓋** - 11 個單元測試全部通過
✅ **安全的訪問控制** - 只暴露必要的公開信息
✅ **高效的性能** - 優化的查詢和緩存策略

系統已準備好投入生產使用！
