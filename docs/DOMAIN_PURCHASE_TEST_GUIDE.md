# 域名購買端到端測試指南

本文檔提供完整的域名購買流程測試步驟，用於驗證 Stripe 支付 → Name.com 購買 → 分成計算的完整流程。

---

## 📋 測試前準備

### 1. Name.com 帳戶檢查

**登入 Name.com Dashboard：** https://www.name.com

**檢查項目：**
- ✅ 帳戶餘額是否充足（建議至少 $50 USD）
- ✅ API 憑證是否有效（Username + API Token）
- ✅ 帳戶狀態是否正常

**如何充值：**
1. 登入 Name.com Dashboard
2. 點擊右上角的「Account」→「Billing」
3. 選擇「Add Funds」
4. 輸入充值金額（建議 $50-100 USD）
5. 使用信用卡或 PayPal 完成支付

---

### 2. Stripe 帳戶檢查

**登入 Stripe Dashboard：** https://dashboard.stripe.com/test

**檢查項目：**
- ✅ 測試模式已啟用
- ✅ Webhook 端點已配置
- ✅ API 金鑰有效

**測試卡號：**
```
卡號：4242 4242 4242 4242
到期日：任何未來日期（如 12/34）
CVC：任意 3 位數字（如 123）
郵遞區號：任意 5 位數字（如 12345）
```

---

### 3. 環境變數檢查

確認以下環境變數已正確配置：

```bash
NAMECOM_USERNAME=your_username
NAMECOM_API_TOKEN=your_api_token
STRIPE_WEBHOOK_SECRET=whsec_aKJeNqsAR89h0m2k8V4i2eDMpTSrwBjY
```

---

## 🧪 測試流程

### 步驟 1：記錄測試前的帳戶狀態

**Name.com 帳戶餘額：**
- 登入 Name.com Dashboard
- 記錄當前餘額：`$_______ USD`

**Stripe 帳戶餘額：**
- 登入 Stripe Dashboard → Payments
- 記錄當前餘額：`$_______ HKD`

---

### 步驟 2：選擇測試域名

**推薦的便宜測試域名：**

| TLD | 價格範圍 | 推薦理由 |
|-----|---------|---------|
| `.xyz` | $1-2 USD | 最便宜，適合測試 |
| `.co` | $5-10 USD | 常見，價格適中 |
| `.site` | $2-5 USD | 便宜且專業 |
| `.online` | $3-5 USD | 適合測試 |

**測試域名建議：**
- 使用隨機字串避免衝突，例如：`test-20260104-abc123.xyz`
- 避免使用真實的品牌名稱
- 確保域名可用且價格合理

---

### 步驟 3：前端購買流程

1. **打開專屬網址頁面**
   ```
   https://3000-i0zfdzhheckbods29bz9j-bd49e366.sg1.manus.computer/domain
   ```

2. **搜索測試域名**
   - 點擊「自訂網域」按鈕
   - 輸入測試域名關鍵字（如 `test20260104`）
   - 點擊「搜索」

3. **選擇域名**
   - 從搜索結果中選擇一個便宜的域名（如 `.xyz`）
   - 確認價格合理（建議 < $5 USD）
   - 決定是否包含管理服務（HK$99/年）

4. **完成支付**
   - 點擊「立即購買並支付」
   - 在 Stripe 支付頁面輸入測試卡號：`4242 4242 4242 4242`
   - 完成支付

5. **記錄訂單資訊**
   - 訂單 ID：`_______`
   - 域名：`_______`
   - 總價：`HK$ _______`
   - 支付時間：`_______`

---

### 步驟 4：驗證 Webhook 觸發

**檢查開發伺服器日誌：**

```bash
cd /home/ubuntu/ai_agent_ui
tail -f /tmp/*.log | grep -E "Webhook|payment_intent|Name.com"
```

**預期日誌輸出：**
```
✅ Webhook received: payment_intent.succeeded
✅ Order ID: 12345
✅ Payment amount verified: 160 cents
✅ Order status updated: payment_completed
✅ Triggering Name.com domain registration...
✅ Domain registered successfully: test20260104.xyz
```

---

### 步驟 5：驗證 Name.com 購買

**方法 A：檢查 Name.com Dashboard**

1. 登入 [Name.com Dashboard](https://www.name.com/account/domain)
2. 查看「My Domains」列表
3. 確認測試域名是否出現在列表中
4. 記錄域名狀態：
   - ✅ Active（已激活）
   - ⏳ Pending（處理中）
   - ❌ Failed（失敗）

**方法 B：檢查帳戶餘額變化**

1. 登入 Name.com Dashboard → Billing
2. 查看「Transaction History」
3. 確認是否有新的扣款記錄
4. 記錄扣款金額：`$_______ USD`

---

### 步驟 6：驗證訂單狀態更新

**檢查「已購買域名」列表：**

1. 回到專屬網址頁面
2. 點擊「已購買」標籤
3. 找到剛才的訂單
4. 確認訂單狀態：
   - ✅ `registered`（已註冊）
   - ⏳ `payment_completed`（支付完成，等待註冊）
   - ❌ `failed`（註冊失敗）

---

### 步驟 7：計算分成和利潤

**財務計算：**

```
Stripe 收入：HK$ _______ (用戶支付的總金額)
Stripe 手續費：HK$ _______ (約 3.4% + HK$2.35)
Name.com 成本：$_______ USD (域名註冊費用)
匯率：1 USD = HK$ _______ (當前匯率)
Name.com 成本（HKD）：HK$ _______

淨利潤 = Stripe 收入 - Stripe 手續費 - Name.com 成本（HKD）
淨利潤 = HK$ _______
```

**利潤率：**
```
利潤率 = (淨利潤 / Stripe 收入) × 100%
利潤率 = _______ %
```

---

## 📊 測試結果記錄表

| 項目 | 測試前 | 測試後 | 變化 |
|-----|-------|-------|------|
| Name.com 餘額 | $_____ | $_____ | -$_____ |
| Stripe 餘額 | HK$_____ | HK$_____ | +HK$_____ |
| 域名數量 | _____ | _____ | +_____ |
| 訂單狀態 | N/A | _____ | N/A |

---

## ✅ 測試檢查清單

### 支付流程
- [ ] 前端搜索域名成功
- [ ] 價格顯示正確（與 Name.com 一致）
- [ ] Stripe 支付頁面正常打開
- [ ] 測試卡號支付成功
- [ ] 支付成功後返回網站

### Webhook 流程
- [ ] Webhook 接收到 `payment_intent.succeeded` 事件
- [ ] 訂單金額驗證通過
- [ ] 訂單狀態更新為 `payment_completed`
- [ ] Name.com API 調用成功

### Name.com 購買
- [ ] 域名出現在 Name.com Dashboard
- [ ] Name.com 帳戶餘額正確扣款
- [ ] 域名狀態為 Active
- [ ] 域名註冊資訊正確

### 訂單管理
- [ ] 「已購買」列表顯示新訂單
- [ ] 訂單狀態顯示為 `registered`
- [ ] 訂單詳情資訊完整
- [ ] 購買時間和價格正確

### 財務驗證
- [ ] Stripe 收入記錄正確
- [ ] Name.com 成本記錄正確
- [ ] 利潤計算準確
- [ ] 利潤率符合預期（建議 > 20%）

---

## 🐛 常見問題排查

### 問題 1：Webhook 沒有觸發

**可能原因：**
- Webhook 端點配置錯誤
- Webhook 簽名密鑰不正確
- 開發伺服器無法訪問

**解決方案：**
1. 檢查 Stripe Dashboard 中的 Webhook 配置
2. 確認 `STRIPE_WEBHOOK_SECRET` 環境變數正確
3. 測試 Webhook 端點是否可訪問：
   ```bash
   curl https://3000-i0zfdzhheckbods29bz9j-bd49e366.sg1.manus.computer/api/webhooks/stripe
   ```

---

### 問題 2：Name.com 購買失敗

**可能原因：**
- Name.com 帳戶餘額不足
- API 憑證無效
- 域名價格不匹配
- 域名已被註冊

**解決方案：**
1. 檢查 Name.com 帳戶餘額
2. 驗證 API 憑證：
   ```bash
   cd /home/ubuntu/ai_agent_ui
   pnpm exec tsx -e "import { verifyConnection } from './server/namecom'; verifyConnection().then(console.log).catch(console.error)"
   ```
3. 查看詳細錯誤日誌
4. 嘗試不同的域名

---

### 問題 3：價格不匹配

**可能原因：**
- 前端使用的價格與 Name.com 實際價格不同
- 匯率轉換錯誤
- 管理費計算錯誤

**解決方案：**
1. 確認前端查詢的是 Name.com 實際價格
2. 檢查訂單創建時的價格計算邏輯
3. 驗證 Webhook 處理器的金額驗證邏輯

---

## 📝 測試報告模板

```markdown
# 域名購買測試報告

**測試日期：** 2026/01/04
**測試人員：** Dave Lee
**測試環境：** 生產環境

## 測試結果

### 1. 測試域名
- 域名：test20260104abc.xyz
- 價格：$1.50 USD
- 管理服務：否
- 總價：HK$1.50

### 2. 支付流程
- Stripe 支付：✅ 成功
- 支付金額：HK$1.50
- 訂單 ID：12345

### 3. Webhook 觸發
- 事件接收：✅ 成功
- 金額驗證：✅ 通過
- 狀態更新：✅ 成功

### 4. Name.com 購買
- API 調用：✅ 成功
- 域名註冊：✅ 成功
- 帳戶扣款：$1.50 USD

### 5. 財務計算
- Stripe 收入：HK$1.50
- Stripe 手續費：HK$0.10
- Name.com 成本：HK$11.70 (匯率 1:7.8)
- 淨利潤：HK$-10.30 ❌

### 6. 發現的問題
1. 利潤為負數，定價策略需要調整
2. 建議增加域名價格或管理費

### 7. 改進建議
1. 調整定價：域名成本 × 1.5 + HK$20 管理費
2. 實時匯率轉換
3. 最低利潤保證機制
```

---

## 🎯 下一步行動

測試完成後，根據結果採取以下行動：

### 如果測試成功 ✅
1. 記錄所有交易 ID 和截圖
2. 更新定價策略（確保利潤率 > 20%）
3. 準備生產環境部署
4. 編寫用戶使用文檔

### 如果測試失敗 ❌
1. 記錄詳細錯誤日誌
2. 分析失敗原因
3. 修復代碼並重新測試
4. 更新測試文檔

---

## 📞 支持資源

- **Name.com 支持：** https://www.name.com/support
- **Stripe 支持：** https://support.stripe.com
- **項目文檔：** `/home/ubuntu/ai_agent_ui/docs/`
