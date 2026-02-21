# Lulubaby 專案部署總結

## 部署日期
2026-02-20

## 部署狀態
✅ **成功部署並運行中**

---

## 1. 專案遷移完成

### 源碼克隆
- **Repository**: https://github.com/davelee340885-a11y/lu
- **版本**: v3.16.0
- **位置**: `/home/ubuntu/ai_agent_ui`

### 依賴安裝
- 使用 `pnpm install` 完成所有依賴安裝
- Node.js 版本: v22.13.0

---

## 2. 資料庫配置

### 本地 MySQL 資料庫
- **連接字串**: `mysql://lulubaby:lulubaby@localhost:3306/lulubaby`
- **資料表數量**: 27 個
- **Schema 同步**: 已完成 `pnpm db:push`

### 資料表列表
- users
- agents
- agent_knowledge
- agent_conversations
- agent_messages
- agent_customers
- agent_customer_memory
- agent_analytics
- domains
- domain_purchases
- stripe_webhooks
- ... 等共 27 個資料表

---

## 3. Cloudflare DNS 修復

### 問題診斷
- **錯誤**: Error 1014 - CNAME Cross-User Banned
- **原因**: lulubaby.xyz 使用 Proxied CNAME 指向 lulubaby.manus.space（跨帳戶）

### 解決方案
- 將 `lulubaby.xyz` CNAME 記錄的 Proxy 狀態改為 **DNS only**（灰色雲朵）
- 將 `www.lulubaby.xyz` CNAME 記錄的 Proxy 狀態改為 **DNS only**

### 修復結果
- ✅ 網站可正常訪問
- ✅ HTTP 200 OK
- ⚠️ 失去 Cloudflare CDN 加速和 DDoS 保護

---

## 4. 生產環境部署

### 構建
- 執行 `pnpm build` 生成生產版本
- 前端靜態文件: `/home/ubuntu/ai_agent_ui/dist/client/`
- 後端編譯代碼: `/home/ubuntu/ai_agent_ui/dist/index.js`

### PM2 進程管理
- **進程名稱**: `lulubaby-prod`
- **狀態**: ✅ online
- **PID**: 自動管理
- **記憶體使用**: ~125MB
- **自動重啟**: 已啟用
- **開機自啟**: 已配置 systemd

### 環境變數
- 配置文件: `/home/ubuntu/ai_agent_ui/.env.production`
- DATABASE_URL: 已配置
- VITE_APP_ID: 使用佔位符（需要真實值）
- OAUTH_SERVER_URL: https://api.manus.im
- JWT_SECRET: 使用佔位符（需要真實值）

---

## 5. 服務訪問

### 本地訪問
- **URL**: http://localhost:3000
- **狀態**: ✅ 運行中

### 公網訪問
- **域名**: https://lulubaby.xyz
- **狀態**: ✅ 可訪問
- **DNS**: 指向 lulubaby.manus.space (104.19.168.112, 104.19.169.112)

---

## 6. PM2 常用命令

### 查看狀態
```bash
pm2 status
```

### 查看日誌
```bash
pm2 logs lulubaby-prod
pm2 logs lulubaby-prod --lines 100
```

### 重啟服務
```bash
pm2 restart lulubaby-prod
```

### 停止服務
```bash
pm2 stop lulubaby-prod
```

### 刪除服務
```bash
pm2 delete lulubaby-prod
```

### 監控
```bash
pm2 monit
```

---

## 7. 待辦事項

### 必要配置（功能受限）
以下環境變數目前使用佔位符，需要提供真實值以啟用完整功能：

1. **Manus OAuth**
   - `VITE_APP_ID`
   - `OWNER_OPEN_ID`
   - `JWT_SECRET`

2. **Stripe 支付**
   - `LULUBABY_STRIPE_SECRET_KEY`
   - `LULUBABY_STRIPE_PUBLISHABLE_KEY`
   - `LULUBABY_STRIPE_WEBHOOK_SECRET`

3. **Name.com API**
   - `NAMECOM_USERNAME`
   - `NAMECOM_API_TOKEN`

4. **Cloudflare API**（可選，用於自動 DNS 管理）
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### 建議改進

1. **恢復 Cloudflare 保護**
   - 將 lulubaby.xyz 改為 A 記錄，直接指向您控制的伺服器 IP
   - 或將 lulubaby.manus.space 轉移到您的 Cloudflare 帳戶

2. **SSL 證書**
   - 目前依賴 lulubaby.manus.space 的 SSL
   - 如果需要獨立 SSL，需配置 Let's Encrypt 或 Cloudflare SSL

3. **資料庫備份**
   - 設置定期備份腳本
   - 配置備份到遠端存儲

4. **監控告警**
   - 配置 PM2 Plus 或其他監控服務
   - 設置服務異常告警

---

## 8. 技術棧總結

- **前端**: React + TypeScript + Vite + TailwindCSS
- **後端**: Node.js + Express + TypeScript
- **資料庫**: MySQL 8.0
- **ORM**: Drizzle ORM
- **進程管理**: PM2
- **DNS**: Cloudflare
- **域名**: lulubaby.xyz

---

## 聯絡資訊

- **Cloudflare 帳戶**: 8sobot@gmail.com
- **GitHub Repository**: https://github.com/davelee340885-a11y/lu
- **專案路徑**: /home/ubuntu/ai_agent_ui

---

**部署完成！** 🎉
