# Lulubaby v1.0 夜間測試 Bug 清單

**測試日期：** 2026-02-10（UTC）
**報告生成時間：** 2026-02-11 UTC
**測試版本：** Checkpoint `da3935fc`

---

## Bug 統計

| 嚴重度 | 數量 | 已修復 | 待處理 |
| :---: | :---: | :---: | :---: |
| **P0（阻斷）** | 2 | 2 | 0 |
| **P1（嚴重）** | 1 | 1 | 0 |
| **P2（一般）** | 3 | 0 | 3（記錄不修復） |
| **合計** | 6 | 3 | 3 |

---

## P0 Bug（已修復）

### P-001：CustomerLoginDialog UI 截斷

- **發現階段：** Phase 5（Bug 修復）
- **嚴重度：** P0
- **狀態：** 已修復
- **修復版本：** `d597df45`

**問題描述：** 在小螢幕設備上，客戶登入彈窗（CustomerLoginDialog）的內容超出可視區域，導致「建立帳戶」按鈕被截斷，新用戶無法完成註冊流程。

**根本原因：** Dialog 內容容器缺少 `overflow-y-auto` 和 `my-auto` 類，固定高度內容無法滾動。

**修復方案：** 在 `CustomerLoginDialog.tsx` 的 `DialogContent` 組件中添加 `overflow-y-auto` 和 `my-auto` CSS 類，確保內容在小螢幕上可滾動。

---

### P-002：大腦記憶注入不足

- **發現階段：** Phase 5（Bug 修復）
- **嚴重度：** P0
- **狀態：** 已修復
- **修復版本：** `d597df45`

**問題描述：** 在某些對話場景中，AI 未能引用用戶設定的大腦記憶，導致回覆缺乏個性化內容。

**根本原因：** `memoryService.ts` 的 `getMemoryContext` 函數僅依賴關鍵詞匹配和高重要性記憶兩層邏輯，當兩者都未命中時，記憶上下文為空。

**修復方案：** 在 `memoryService.ts` 中增加第三層 fallback — `getRecentMemories`，當關鍵詞搜索和高重要性記憶都為空時，回退到最近的所有記憶，確保 AI 始終有記憶上下文可用。新增 `p0-bugfix.test.ts` 測試文件（11 個測試全部通過）。

---

## P1 Bug（已修復）

### T-001：customerAuth 單元測試 Schema 不匹配

- **發現階段：** Vitest 回歸測試
- **嚴重度：** P1
- **狀態：** 已修復
- **修復版本：** 本次夜間測試

**問題描述：** `customerAuth.test.ts` 中 4 個測試用例失敗。`emailLogin` 測試缺少必要的 `password` 參數（API schema 已更新為要求密碼驗證），`socialLogin` 測試期望返回 `avatarUrl` 字段但 `CustomerSession` 類型中不包含此字段。

**根本原因：** 測試文件在 `customerAuthRouter.ts` 從簡單 email-only 登入升級為 email+password 登入後未同步更新。`CustomerSession` 類型定義中不包含 `avatarUrl`，但測試仍在斷言此字段。

**修復方案：** 重寫 `customerAuth.test.ts`，更新 `emailLogin` 測試為驗證型測試（測試缺少密碼、無效 email 等邊界情況），移除 `socialLogin` 中對 `avatarUrl` 的斷言，改為驗證 `CustomerSession` 中實際存在的字段（email, name, provider, personaId）。修復後 444 個測試全部通過。

---

## P2 Bug（記錄不修復）

### N-001：chat.send 超長文字返回 500

- **發現階段：** Phase 4（API 健壯性）
- **嚴重度：** P2
- **狀態：** 記錄

**問題描述：** 當 `chat.send` 接收 50,000 字的超長消息時，服務器返回 HTTP 500 Internal Server Error，而非 400 Bad Request 並附帶友好的字數限制提示。

**影響範圍：** 極端邊界情況，正常用戶不會發送 50,000 字消息。服務器未崩潰，僅返回錯誤碼。

**建議修復方案：** 在 `chat.send` 的 Zod schema 中添加 `.max(5000)` 驗證，並返回 400 +「消息長度超過限制」提示。

---

### N-002：*.lulubaby.xyz 子域名 Cloudflare Error 1014

- **發現階段：** Phase 1（用戶生命週期）
- **嚴重度：** P2
- **狀態：** 已有替代方案

**問題描述：** 用戶專屬子域名（如 `meimei.lulubaby.xyz`）訪問時返回 Cloudflare Error 1014（CNAME Cross-User Banned），因為 `lulubaby.xyz` 和 Manus 平台的 Cloudflare 帳戶不同。

**影響範圍：** 子域名功能無法直接使用，但已通過 `/s/:subdomain` 主站路由提供替代方案。

**替代方案：** 已實作 `lulubaby.xyz/s/meimei` 格式的主站路由，功能完全等效。

**根本解決方案：** 需向 Manus 平台提交支援請求，申請 `*.lulubaby.xyz` 通配符 Custom Hostname 支持（Cloudflare for SaaS）。

---

### N-003：/settings 路由 404

- **發現階段：** Phase 3（前端 UI）
- **嚴重度：** P2
- **狀態：** 記錄

**問題描述：** 直接訪問 `/settings` 路由返回 404 頁面。正確的帳戶設定路由為 `/account`。

**影響範圍：** 不影響正常使用。側邊欄導航已正確指向 `/account`，用戶不會遇到此問題。

**建議修復方案：** 在 `App.tsx` 中添加 `/settings` → `/account` 的路由重定向。

---

## 測試數據保留

以下測試用戶數據已保留在數據庫中，供後續測試使用：

| 用戶 | Email | Persona | 角色 |
| :--- | :--- | :--- | :--- |
| Alice | alice_nightly@test.com | 美美 | 美容顧問 |
| Bob | bob_nightly@test.com | 小房 | 房地產顧問 |

---

*報告由 Manus AI 自動化測試引擎生成 | 2026-02-11 UTC*
