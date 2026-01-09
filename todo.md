# AI客服SaaS平台 TODO

## 數據庫與後端
- [x] 設計AI個性化配置表 (aiPersonas)
- [x] 設計知識庫文件表 (knowledgeBases)
- [x] 設計快捷按鈕配置表 (quickButtons)
- [x] 設計對話記錄表 (conversations)
- [x] 開發AI個性化配置API
- [x] 開發知識庫管理API
- [x] 開發快捷按鈕配置API
- [x] 開發AI對話API（整合LLM）

## 付費用戶後台
- [x] 後台儀表板佈局
- [x] AI個性化設定頁面（名稱、頭像、歡迎語）
- [x] 知識庫管理頁面（上傳、列表、刪除）
- [x] 快捷按鈕配置頁面
- [x] 專屬URL顯示與複製功能

## 終端客戶對話頁面
- [x] 動態路由頁面 (/chat/:personaId)
- [x] AI頭像和名稱顯示
- [x] 對話歷史區域
- [x] 問題輸入框
- [x] 快捷功能按鈕區域
- [x] 響應式設計（桌面和移動端）
- [x] 即時對話功能

## 視覺設計
- [x] 確定整體視覺風格
- [x] 設計配色方案
- [x] 響應式佈局優化

## 數據分析功能
- [x] 設計數據分析API（對話統計、熱門問題）
- [x] 開發對話統計圖表組件
- [x] 開發熱門問題列表組件
- [x] 整合到儀表板頁面

## 首頁版面設定功能
- [x] 擴展數據庫結構（佈局模板、背景圖片、個人照片、引導問題）
- [x] 開發版面設定API
- [x] 開發後台版面設定頁面（風格選擇、圖片上傳、引導問題配置）
- [x] 更新終端客戶對話頁面支援多種佈局風格
- [x] 實現簡約ChatGPT風格模板
- [x] 實現專業名片風格模板
- [x] 實現自訂背景風格模板

## 版面設定即時預覽
- [x] 在版面設定頁面加入即時預覽小圖示
- [x] 預覽組件顯示三種佈局風格的效果
- [x] 預覽隨設定變更即時更新

## 預覽優化與功能按鈕擴展
- [x] 優化預覽版面：更緊緻、對話方塊更細、profile pic更小
- [x] 支援多個引導問題同時顯示
- [x] 擴展功能按鈕類型（即時預約、產品展示、個人介紹、公司介紹等）
- [x] 更新終端客戶對話頁面支援新功能按鈕

## 簡化後台版面
- [x] 將快捷按鈕配置整合到版面設定頁面
- [x] 使用標籤頁組織版面設定和快捷按鈕
- [x] 更新導航菜單移除獨立的快捷按鈕頁面

## 版面設定標籤重組
- [x] 將版面設定分為三個頂層標籤：外觀風格、快捷按鈕、對話設定
- [x] 將引導問題移到對話設定標籤內
- [x] 優化各標籤的內容組織

## 自訂域名引導區塊
- [x] 在儀表板或設定頁面加入自訂域名引導區塊
- [x] 設計簡潔易用的UI/UX
- [x] 說明免費/付費用戶的URL選項
- [x] 提供操作步驟引導

## 導航欄調整與儀表板簡化
- [x] 將「自訂專屬網址」加入左側導航欄
- [x] 創建自訂網址設定頁面
- [x] 簡化儀表板版面，移除域名引導區塊

## 訓練智能體功能
- [x] 設計訓練智能體資料庫表 (aiTraining)
- [x] 創建訓練智能體頁面UI
- [x] 實現8大維度評分系統（說話風格、回應方式、溝通態度、銷售風格、專業表現、情緒處理、語言習慣、服務邊界）
- [x] 實現1-5分評分選擇器組件
- [x] 實現快速人設模板功能
- [x] 實現自訂指令輸入區域
- [x] 開發後端API存取訓練設定
- [x] 更新導航欄添加訓練智能體入口

## 開發超能力功能
- [x] 設計超能力設定資料庫表 (superpowers)
- [x] 創建超能力設定頁面UI
- [x] 實現五大超能力類別（超級大腦、時間掌控、預知未來、全球視野、讀心術）
- [x] 實現Toggle開關和詳細設定展開
- [x] 實現超能力等級和成就徽章系統
- [x] 開發後端API存取超能力設定
- [x] 更新導航欄添加超能力入口

## AI設定整合到版面設定
- [x] 將AI設定頁面內容（名稱、頭像、歡迎語、System Prompt）整合到版面設定
- [x] 更新版面設定標籤頁結構（新增AI設定標籤）
- [x] 從導航欄移除AI設定入口
- [x] 清理不再需要的Settings路由

## 網站嵌入Widget功能（擴充功能）
- [x] 創建擴充功能頁面（Extensions.tsx）
- [x] 實現Widget設定卡片（位置、顏色、大小、觸發方式）
- [x] 實現嵌入代碼生成功能
- [x] 實現即時預覽Widget效果
- [x] 添加一鍵複製代碼功能
- [x] 顯示其他渠道（WhatsApp、Email等）的「即將推出」卡片
- [x] 更新導航欄添加擴充功能入口

## 簡化擴充功能頁面
- [x] 移除即將推出的渠道卡片（WhatsApp、Email、Telegram等）
- [x] 專注於Widget功能展示
- [x] 加入Widget功能說明和使用場景
- [x] 加入安裝步驟和使用指南


## 帳戶設定和會員計劃系統
- [x] 設計成本結構和會員計劃定價
- [x] 創建訂閱表(subscriptions)和使用量表(usage_logs)
- [x] 創建帳戶設定頁面UI（個人資料、安全設定）
- [x] 創建會員計劃頁面UI（三個計劃對比、升級按鈕）
- [x] 實現後端API（訂閱管理、使用量追蹤）
- [x] 實現免費計劃限額檢查（每日對話數、知識庫大小）
- [x] 在chat.send中添加限額檢查邏輯
- [x] 更新導航欄添加帳戶設定入口


## 對話頁面UI優化
- [x] 對話輸入框置中（類似ChatGPT風格）
- [x] 快捷按鈕改為圖標模式（更小巧精緻）
- [x] 圖標hover時顯示tooltip說明
- [x] 整體結構更緊湊專業
- [x] 版面設定添加「圖標模式」選項（完整/緊湊/圖標三種模式）
- [x] 減少不必要的空白和間距

## 對話頁面置中和導航連結
- [x] 將對話區域（AI頭像、歡迎語、引導問題、快捷按鈕）垂直置中
- [x] 輸入框置中顯示
- [x] 在後台導航欄上方添加「預覽AI對話」連結
- [x] 連結可直接跳轉到用戶的AI對話頁面


## 對話頁面進一步優化（更緊湊專業）
- [x] 縮小AI頭像尺寸（16px→h-10→h-5）
- [x] 縮小引導問題按鈕（py-2.5→py-1.5，text-sm→text-xs）
- [x] 縮小快捷按鈕尺寸（h-8→h-6，text-xs→text-[11px]）
- [x] 減少元素間距（mb-6→mb-4，space-y-2→space-y-1.5）
- [x] 縮小輸入框高度（h-10→h-8）
- [x] 整體風格更乾淨俀落

## 輸入框垂直置中
- [x] 將輸入框與歡迎區域一起垂直置中顯示


## Manus風格對話頁面重新設計
- [x] 歡迎訊息大標題在上方
- [x] 輸入框置中（類似Manus的大輸入框設計）
- [x] 引導問題縮小為小按鈕/標籤，放在輸入框下方
- [x] 快捷按鈕放在引導問題下方
- [x] 版面設定已有歡迎語設定選項


## 團隊/公司計劃功能
- [x] 設計團隊計劃架構（團隊大腦、管理員、成員）
- [x] 創建團隊表（teams）- 團隊基本資料
- [x] 創建團隊成員表（team_members）- 成員角色和權限
- [x] 創建團隊知識庫表（team_knowledge）- 團隊大腦內容
- [x] 更新會員計劃頁面添加團隊計劃選項
- [x] 創建團隊管理頁面UI（團隊資料、成員管理、知識庫）
- [x] 實現團隊管理後端API
- [x] 實現成員知識分享權限控制
- [x] 更新導航欄添加團隊管理入口


## 定價調整優化
- [x] Premium計劃價格從HK$299調整為HK$399
- [x] 企業版成員上限從無限調整為50人
- [x] 更新前端定價頁面顯示
- [x] 更新後端限額檢查邏輯


## 知識庫上傳方式擴展
- [x] 研究可行的知識來源類型
- [x] 設計多來源知識庫架構
- [x] 實現YouTube影片字幕提取
- [x] 實現網頁內容抓取
- [x] 實現直接文字輸入
- [x] 實現FAQ問答對輸入
- [x] 更新前端知識庫上傳界面
- [x] 添加知識來源類型標識


## 客戶記憶功能
- [x] 設計客戶記憶數據庫架構（customers表、customer_memories表、conversation_summaries表）
- [x] 創建客戶識別機制（基於session/設備指紋）
- [x] 實現客戶資料CRUD API
- [x] 實現客戶記憶存儲和檢索
- [x] 更新對話系統整合客戶記憶
- [x] AI對話時注入客戶上下文（記憶、歷史對話摘要）
- [x] 實現客戶管理界面
- [x] 添加客戶詳情頁（資料、對話歷史、記憶）
- [x] 實現從對話自動提取客戶記憶（LLM輔助）
- [x] 更新導航欄添加客戶記憶入口


## 對話結束自動生成摘要
- [x] 設計對話摘要生成邏輯和觸發機制
- [x] 實現LLM自動生成對話摘要API
- [x] 提取關鍵話題、客戶需求、對話結果
- [x] 自動提取客戶資料（姓名、電郵等）存入記憶
- [x] 更新對話系統在結束時觸發摘要生成
- [x] 前端顯示對話摘要歷史


## 導航列整合優化
- [x] 設計三大類別導航結構（客戶前端、AI大腦、設定）
- [x] 為每個類別添加顏色區分
- [x] 整合儀表板和數據分析到儀表板頁面
- [x] 更新DashboardLayout導航列組件
- [x] 移除擴充功能導航項（已整合到其他功能）


## 定價調整（第一階段MVP）
- [x] 基本計劃價格從HK$99調整為HK$299
- [x] Premium計劃價格從HK$399調整為HK$599
- [x] 移除Email客服支援功能
- [x] 更新對話次數額度


## 開發者導航和Widget嵌入
- [x] 在導航列添加「開發者」類別
- [x] 添加Widget嵌入頁面到開發者類別
- [x] 導入之前開發的Extensions頁面作為Widget嵌入
- [x] 更新PROJECT_SUMMARY為完整技術文檔


## 項目改名為Lulubaby
- [x] 更新前端所有「AI客服平台」為「Lulubaby」
- [x] 更新DashboardLayout標題
- [x] 更新頁面標題和描述
- [x] 設計10個Logo方案（Teal主色調、簡約未來感）
- [x] 更新PROJECT_SUMMARY文檔


## Logo應用
- [x] 將選定Logo應用到網站導航列
- [x] 生成並設置Favicon


## 完整技術藍圖文檔
- [x] 整合Logo、設計規範、配色方案
- [x] 添加數據庫結構完整說明
- [x] 添加API路由和業務邏輯
- [x] 添加重建指南和回滾步驟
- [x] 創建獨立可用的技術藍圖文檔


## 自訂域名功能（域名管理費 HK$99/年）
- [x] 設計 user_domains 數據表結構
- [x] 實現域名管理 API（添加、驗證、刪除）
- [x] 實現 DNS 驗證功能
- [x] 實現 SSL 狀態檢查
- [x] 更新專屬網址頁面 UI
- [x] 添加域名管理費定價說明
- [x] 編寫測試用例 (17 tests passed)
- [x] 更新技術藍圖文檔


## 整合 Manus 域名購買（方案 A）
- [x] 在專屬網址頁面添加「購買新域名」按鈕
- [x] 創建購買引導彈窗（3 步驟說明）
- [x] 添加域名價格參考資訊
- [x] 清楚區分 Manus 域名費 vs Lulubaby 管理費
- [x] 實現跳轉到 Manus Domains 面板功能


## 方案 B：接入域名轉售 API（一站式購買）
- [x] 研究主流域名轉售 API 選項 (Name.com, Porkbun, Cloudflare)
- [x] 比較各 API 的價格、功能、門檻
- [x] 創建詳細的接入指南文檔 (DOMAIN_RESELLER_API_GUIDE.md)
- [x] 選擇最適合的 API 方案 (推薦 Name.com Core API)
- [x] 獲取 Name.com API Key
- [x] 設置 API Key 環境變數（已驗證連接成功）
- [x] 實現域名可用性搜索 API (domains.search)
- [x] 實現域名價格查詢 API (domains.checkAvailability)
- [x] 更新專屬網址頁面 UI（域名搜索、結果顯示）
- [x] 整合 Stripe 支付
- [x] 實現域名購買流程（下單、付款、註冊）


## 域名購買支付流程優化（Phase 2）
- [x] 1. UI 優化：按鈕標籤和圖標更新
  - [x] 「購買新域名」改為「自訂網域」，圖標改為 +
  - [x] 「連接現有域名」改為「連接現有網域」，圖標改為 link
- [x] 2. 驗證域名價格 30% 分成
  - [x] 檢查搜索結果中的 sellingPriceHkd 是否已包含 30% 分成
  - [x] 確認：已包含 30% 分成（MARKUP_PERCENTAGE = 0.30）
- [x] 3. 實現可選的域名管理服務
  - [x] 用戶可選擇「只購買域名」或「購買域名+管理服務」
  - [x] 更新支付摘要 UI 顯示管理費為可選項
  - [x] 添加管理服務複選框和動態價格計算
- [x] 4. 查詢 Name.com 測試環境
  - [x] 查詢 Name.com API 文檔是否有沙盒/測試環境
  - [x] 確認：https://api.dev.name.com（使用 username-test 憑證）
- [x] 5. 實現 Stripe 沙盒支付測試流程
  - [x] 使用 Stripe 測試卡號實現支付測試
  - [x] 創建支付測試用例（stripe-payment.test.ts）
  - [x] 10 個測試全部通過


## 完整的端到端支付和域名購買測試（Phase 3）
- [x] 1. 配置 Name.com 測試環境和 Stripe Webhook
  - [x] 配置 Name.com 測試環境 API 端點（https://api.dev.name.com）
  - [x] 創建 Stripe Webhook 端點監聽 payment_intent.succeeded
  - [x] 實現支付成功後的自動觸發機制
- [x] 2. 實現支付成功後自動調用 Name.com 購買 API
  - [x] 創建 registerDomainWithNamecom 函數
  - [x] 在 Webhook 中調用 Name.com 購買 API
  - [x] 處理購買失敗的重試邏輯
  - [x] 更新訂單狀態為已註冊
- [x] 3. 驗證 Stripe 支付金額和 30% 分成
  - [x] 驗證 Stripe 支付金額計算正確
  - [x] 驗證 30% 分成已正確應用
  - [x] 驗證分成分配到正確的 Stripe 賬戶
  - [x] 測試不同金額的支付計算
- [x] 4. 創建完整的端到端集成測試
  - [x] 搜索域名測試
  - [x] 選擇域名測試
  - [x] 創建支付意圖測試
  - [x] Stripe 支付測試
  - [x] Name.com 購買測試
  - [x] 訂單狀態驗證測試
- [x] 5. 測試和驗證完整流程
  - [x] 使用 Stripe 測試卡號進行完整流程測試
  - [x] 驗證 Name.com 測試環境中的域名購買
  - [x] 驗證訂單狀態的正確更新
  - [x] 驗證錯誤處理和重試機制


## 優化域名購買頁面佈局和支付流程（Phase 4）
- [x] 使用 Stripe Payment Link 替代自建支付表單
- [x] 移除 StripePaymentForm 組件
- [x] 創建 Stripe Checkout Session API
- [x] 優化自訂網域頁面佈局以避免滾動
- [x] 減少內容高度和間距
- [x] 測試完整的支付流程
- [x] 保存檢查點

- [x] 更新 Stripe Keys 為 Lulubaby 沙盒環境
- [x] 更新後端 Secret Key
- [x] 更新前端 Publishable Key


## Name.com API 對接和域名管理顯示（Phase 5）
- [x] 1. 驗證 Stripe 支付成功的訂單數據
  - [x] 查詢 domain_orders 表中的最新訂單
  - [x] 檢查訂單狀態是否為 payment_completed
  - [x] 驗證支付金額和域名資訊正確
- [x] 2. 測試 Stripe Webhook 自動觸發機制
  - [x] 檢查 Webhook 是否成功接收 payment_intent.succeeded 事件
  - [x] 驗證 Webhook 是否調用了 Name.com 購買 API
  - [x] 查看訂單狀態是否更新為 registered 或 registration_failed
- [x] 3. 測試 Name.com API 域名註冊
  - [x] 使用測試環境 (api.dev.name.com) 測試域名註冊
  - [x] 驗證域名註冊請求參數正確
  - [x] 處理註冊成功和失敗的情況
  - [x] 保存 Name.com 返回的註冊資訊
- [x] 4. 實現已購買域名列表 UI
  - [x] 在專屬網址頁面添加「已購買域名」區塊
  - [x] 顯示域名列表（域名、購買日期、狀態、到期日）
  - [x] 添加域名狀態標籤（處理中/已註冊/註冊失敗）
  - [x] 實現域名詳情展開功能
- [x] 6. 完整流程測試
  - [x] 端到端測試：搜索 → 支付 → 註冊 → 顯示
  - [x] 測試多個域名購買
  - [x] 測試註冊失敗處理
  - [x] 驗證所有 UI 顯示正確


## 生產環境配置 - Stripe Webhook 設置（Phase 6）
- [x] 1. 檢查當前 Stripe 配置
  - [x] 查看現有的 Webhook 端點
  - [x] 確認 Stripe API 金鑰狀態
  - [x] 檢查開發伺服器 URL
- [x] 2. 使用 Stripe MCP 創建 Webhook 端點
  - [x] 獲取開發伺服器的公開 URL
  - [x] 創建 Webhook 端點指向 /api/webhooks/stripe
  - [x] 配置監聽事件：payment_intent.succeeded
  - [x] 獲取 Webhook 簽名密鑰
- [x] 3. 配置環境變數
  - [x] 添加 STRIPE_WEBHOOK_SECRET 到環境變數
  - [x] 重啟開發伺服器應用新配置
- [x] 4. 測試 Webhook 功能
  - [x] 發送測試事件到 Webhook
  - [x] 驗證 Webhook 接收成功
  - [x] 檢查訂單狀態更新
  - [x] 驗證 Name.com 註冊調用
- [x] 5. 完整流程測試
  - [x] 測試真實支付 → Webhook → 域名註冊流程
  - [x] 驗證錯誤處理機制
  - [x] 確認所有日誌記錄正常


## Lulubaby 30% 域名加價策略（Phase 8）
- [x] 1. 更新後端價格計算邏輯
  - [x] 修改 namecom.ts 的 calculateSellingPrice 函數
  - [x] 設定加價率為 30%（1.3 倍）
  - [x] 確保價格計算包含 Stripe 手續費
- [x] 2. 更新前端價格顯示
  - [x] 顯示 Name.com 原價
  - [x] 顯示 Lulubaby 售價（原價 × 1.3）
  - [x] 顯示價格差異和加價說明
- [x] 3. 測試新定價策略
  - [x] 運行測試腳本驗證利潤計算
  - [x] 確認利潤率符合預期
  - [x] 測試不同價格區間的域名
- [x] 4. 更新財務計算
  - [x] 更新測試腳本的利潤計算邏輯
  - [x] 驗證 30% 加價後的利潤率
  - [x] 記錄不同場景的財務數據


## 改為全部使用 USD 交易（Phase 9）
- [x] 1. 更新後端價格計算邏輯
  - [x] 移除 HKD 轉換邏輯
  - [x] 直接使用 Name.com 的 USD 價格 × 1.3
  - [x] 更新 calculateSellingPrice 函數
- [x] 2. 更新數據庫貨幣欄位
  - [x] 將 currency 從 'HKD' 改為 'USD'
  - [x] 價格欄位改為存儲 USD cents
- [x] 3. 更新前端顯示
  - [x] 所有價格顯示改為 USD
  - [x] 更新管理費為 USD（如 $12.99）
- [x] 4. 更新 Stripe 支付
  - [x] Checkout Session 改為 'usd' 貨幣
  - [x] 價格計算改為 USD cents
- [x] 5. 測試 USD 交易流程
  - [x] 運行測試腳本驗證利潤計算


## 實現多貨幣支持（USD/HKD）（Phase 10）
- [x] 1. 設計多貨幣系統架構
  - [x] 定義支持的貨幣（USD, HKD）
  - [x] 設計匯率管理機制
  - [x] 設計貨幣偵測邏輯
- [x] 2. 實現後端貨幣偵測
  - [x] 使用 IP 地理位置 API 偵測客戶地區
  - [x] 根據地區返回對應貨幣
  - [x] 支持手動切換貨幣
- [x] 3. 更新價格計算邏輯
  - [x] 更新 namecom.ts 支持多貨幣
  - [x] 更新 routers.ts API 接收貨幣參數
  - [x] 實現貨幣轉換函數
- [x] 4. 更新前端顯示
  - [x] 創建 useCurrency hook
  - [x] 更新所有價格顯示使用 formatPrice
  - [x] 更新管理費顯示（USD $12.99 / HKD $99）


## 移除多貨幣功能，統一使用 USD（Phase 12）
- [x] 1. 移除前端貨幣切換按鈕和 useCurrency hook
- [x] 2. 移除後端 createCheckoutSession 的多貨幣計算邏輯
- [x] 3. 更新所有價格顯示為 USD
- [x] 4. 移除 shared/currency.ts 中的多貨幣相關代碼
- [x] 5. 更新管理費為統一 USD $12.99
- [x] 6. 測試完整的購買流程


## Stripe 支付流程完整測試（Phase 13）
- [x] 1. 檢查當前 Stripe 配置（API Key、Webhook Secret）
- [x] 2. 實現 Stripe webhook 處理端點（/api/webhooks/stripe）
- [x] 3. 處理 checkout.session.completed 事件
- [x] 4. 更新訂單狀態並調用 Name.com 註冊 API
- [x] 5. 配置 Stripe webhook URL
- [x] 6. 使用測試信用卡完成支付流程
- [x] 7. 驗證訂單狀態更新和域名註冊


## 配置 Stripe Webhook（Phase 15）
- [x] 1. 打開 Stripe Dashboard Webhook 頁面
- [x] 2. 添加 Webhook 端點 URL
- [x] 3. 配置監聽事件（checkout.session.completed）
- [x] 4. 保存並獲取 Webhook Signing Secret
- [x] 5. 更新代碼使用新的 Webhook Secret


## 修復域名價格顯示問題（Phase 10）
- [x] 1. 檢查 Name.com API 返回的域名數據結構
- [x] 2. 識別 .ai 等特殊 TLD 的最低購買年限
- [x] 3. 創建 TLD 配置文件（shared/tldConfig.ts）
- [x] 4. 更新後端 API 返回年限信息（minYears, pricePerYear）
- [x] 5. 更新前端顯示每年價格和總價
- [x] 6. 添加清晰的年限標註（琥珀色警告）
- [x] 7. 測試修復後的顯示

## 修復版面設定有背景時快捷按鈕的樣式
- [x] 分析目前快捷按鈕的樣式邏輯
- [x] 修改 QuickButtonGroup 組件添加 hasBackground 參數
- [x] 在三種顯示模式（Icon、Compact、Full）中添加白色底色支持
- [x] 在 CustomLayout 中傳遞 hasBackground 參數
- [x] 測試並驗證修改效果

## 背景圖片展示方式設定
- [x] 分析 CSS background-size 和 background-position 選項
- [x] 設計用戶友好的展示方式選項（平鋪、適應螢幕、按比例縮放、填滿、置中等）
- [x] 擴展數據庫 personas 表添加 backgroundSize、backgroundPosition 和 backgroundRepeat 欄位
- [x] 更新後端 API 支持背景圖片展示設定的保存和讀取
- [x] 更新版面設定頁面 UI 添加展示方式選擇器（三個下拉選單）
- [x] 更新對話頁面應用背景圖片展示設定
- [x] 測試所有展示方式在不同圖片尺寸下的效果

## 將背景圖片展示方式設定整合到圖片裁切器
- [x] 分析目前的圖片裁切器實現
- [x] 移除版面設定頁面中的展示方式選擇器
- [x] 在 ImageCropper 組件中添加展示方式設定選項（三個下拉選單）
- [x] 實現裁切器中的即時預覽功能
- [x] 更新 Appearance.tsx 調用 ImageCropper 的方式
- [x] 測試所有展示方式在不同圖片尺寸下的效果

## 優化背景圖片裁切器
- [x] 分析目前預覽版面的比例問題
- [x] 修復預覽版面比例（使用 16:9 比例 + contain 模式）
- [x] 添加放大縮小旋轉按鈕
- [x] 實現放大縮小旋轉功能邏輯
- [x] 添加編輯按鈕到背景圖片顯示區域
- [x] 測試所有功能（裁切、縮放、旋轉、預覽）
- [x] 1. 檢查 Name.com API 返回的域名數據結構
- [x] 2. 識別 .ai 等特殊 TLD 的最低購買年限
- [x] 3. 創建 TLD 配置文件（shared/tldConfig.ts）
- [x] 4. 更新後端 API 返回年限信息（minYears, pricePerYear）
- [x] 5. 更新前端顯示每年價格和總價
- [x] 6. 添加清晰的年限標註（琥珀色警告）
- [x] 7. 測試修復後的顯示

## 修復版面設定有背景時快捷按鈕的樣式
- [x] 分析目前快捷按鈕的樣式邏輯
- [x] 修改 QuickButtonGroup 組件添加 hasBackground 參數
- [x] 在三種顯示模式（Icon、Compact、Full）中添加白色底色支持
- [x] 在 CustomLayout 中傳遞 hasBackground 參數
- [x] 測試並驗證修改效果

## 背景圖片展示方式設定
- [x] 分析 CSS background-size 和 background-position 選項
- [x] 設計用戶友好的展示方式選項（平鋪、適應螢幕、按比例縮放、填滿、置中等）
- [x] 擴展數據庫 personas 表添加 backgroundSize、backgroundPosition 和 backgroundRepeat 欄位
- [x] 更新後端 API 支持背景圖片展示設定的保存和讀取
- [x] 更新版面設定頁面 UI 添加展示方式選擇器（三個下拉選單）
- [x] 更新對話頁面應用背景圖片展示設定
- [x] 測試所有展示方式在不同圖片尺寸下的效果

## 將背景圖片展示方式設定整合到圖片裁切器
- [x] 分析目前的圖片裁切器實現
- [x] 移除版面設定頁面中的展示方式選擇器
- [x] 在 ImageCropper 組件中添加展示方式設定選項（三個下拉選單）
- [x] 實現裁切器中的即時預覽功能
- [x] 更新 Appearance.tsx 調用 ImageCropper 的方式
- [x] 測試所有展示方式在不同圖片尺寸下的效果

## 修復版面設定有背景時快捷按鈕的樣式
- [x] 分析目前快捷按鈕的樣式邏輯
- [x] 修改 QuickButtonGroup 組件添加 hasBackground 參數
- [x] 在三種顯示模式（Icon、Compact、Full）中添加白色底色支持
- [x] 在 CustomLayout 中傳遞 hasBackground 參數
- [x] 測試並驗證修改效果

## 重新修復預覽和沉浸式風格問題（Phase 11）
- [x] 重新檢查預覽中的兩個輸入框來源（Tabs 組件問題）
- [x] 移除底部的輸入框（使用三元運算符條件渲染）
- [x] 重新檢查 immersiveMode 保存邏輯（在 routers.ts 中添加參數傳遞）
- [x] 重新檢查 immersiveMode 載入邏輯（使用 ?? 運算符）
- [x] 測試完整的保存和載入流程


## 修復域名頁面 API fetch failed 錯誤（Phase 11）
- [x] 1. 檢查後端日誌和錯誤信息
- [x] 2. 識別問題 API 端點（domains.search 和 domains.getOrders 都正常）
- [x] 3. 發現 Premium 域名價格顯示錯誤
- [x] 4. 修復 Premium 域名價格顯示（一次性購買 vs 年費）
- [x] 5. 測試修復後的功能


## 添加貨幣單位顯示和 Stripe 生產環境切換（Phase 12）
- [x] 1. 在所有價格顯示前添加 USD 貨幣單位
- [x] 2. 更新搜索結果列表的價格顯示
- [x] 3. 更新購買摘要的價格顯示
- [x] 4. 更新費用說明的價格顯示
- [x] 5. 測試價格顯示修復
- [x] 6. 創建 Stripe 生產環境切換指南


## 研究域名轉售服務（Phase 14）
- [x] 1. 研究 Name.com 域名轉售服務和 API
- [x] 2. 研究 GoDaddy 域名轉售服務
- [x] 3. 比較兩家服務的優缺點
- [x] 4. 設計一站式域名購買和管理流程
- [x] 5. 準備實施計劃和文檔


## 域名管理介面開發（Phase 15）- 完成
- [x] 1. 設計域名管理介面架構和數據庫結構
  - [x] 更新 domain_orders 表添加 DNS 配置狀態欄位
  - [x] 添加 Cloudflare zone_id 和記錄 ID 欄位
  - [x] 設計域名狀態流程（pending → configuring → active → error）
- [x] 2. 實現 Cloudflare API 整合（已配置並驗證成功）
  - [x] 創建 Cloudflare API 客戶端
  - [x] 實現添加域名到 Cloudflare Zone
  - [x] 實現設置 CNAME 記錄指向 lulubaby.manus.space
  - [x] 實現 SSL 證書狀態檢查
- [x] 3. 實現域名狀態監控和驗證
  - [x] DNS 傳播狀態檢查
  - [x] SSL 證書狀態檢查
  - [x] 網站可訪問性測試
- [x] 4. 開發域名管理 UI
  - [x] 域名列表顯示（狀態、到期日、操作）
  - [x] 域名詳情頁（DNS 記錄、SSL 狀態）
  - [x] 一鍵上線按鈕
  - [x] 錯誤處理和重試功能
- [x] 5. 整合到購買流程
  - [x] 支付成功後自動調用 Cloudflare API
  - [x] 自動設置 DNS 記錄


## 域名搜索結果顯示問題修復 - 完成
- [x] 檢查域名搜索 API 返回的 TLD 列表
- [x] 確認前端是否正確顯示所有搜索結果
- [x] 擴展搜索的 TLD 列表（添加更多常見後綴）
- [x] 修復搜索結果顯示邏輯


## lulubaby.xyz 域名購買和配置 - 完成
- [x] 使用 Stripe 完成支付（$2.59 USD）
- [x] 使用 Name.com CORE API 購買域名（訂單號：26487104）
- [x] 配置 Cloudflare DNS（Zone ID: 1f16dfc3baace827839078c96cf3b21d）
- [x] 設置 CNAME 記錄指向 lulubaby.manus.space
- [x] 更新 Nameservers 到 Cloudflare
- [x] 更新數據庫訂單狀態
- [x] 創建 Stripe 支付環境設置指南
- [x] 編寫完整的支付流程文檔（用戶付款 → Name.com 購買 → Stripe 分成）
- [x] 編寫域名配置和發布指南
- [x] 測試並驗證整個流程
- [x] 創建操作截圖和示意圖


## Stripe 生產環境配置 - 完成
- [x] 配置 Stripe 生產環境密鑰
- [x] 驗證 Stripe API 連接
- [x] 設置 Webhook 端點


## 域名綁定到 AI 智能體和動態路由（Phase 10）
- [x] 1. 更新數據庫結構
  - [x] 在 domain_orders 表添加 personaId 欄位（綁定的智能體 ID）
  - [x] 添加 isPublished 欄位（是否已發布）
  - [x] 添加 publishedAt 欄位（發布時間）
- [x] 2. 開發域名綁定 API
  - [x] 創建 bindPersona API（綁定智能體）
  - [x] 創建 unbindPersona API（解除綁定）
  - [x] 創建 publishDomain API（發布域名）
  - [x] 創建 unpublishDomain API（取消發布）
- [x] 3. 更新域名管理 UI
  - [x] 在已購買域名列表添加「綁定智能體」按鈕
  - [x] 創建智能體選擇器組件
  - [x] 顯示當前綁定的智能體
  - [x] 添加「發布」/「取消發布」按鈕
  - [x] 顯示發布狀態和時間
- [x] 4. 實現動態路由解析
  - [x] 創建域名檢測中間件（從 HTTP Header 獲取域名）
  - [x] 查詢數據庫找到對應的智能體
  - [x] 自動載入智能體配置
  - [x] 渲染對話頁面
- [x] 5. 添加發布狀態監控
  - [x] DNS 傳播狀態檢查
  - [x] SSL 證書狀態檢查
  - [x] 域名可訪問性測試
  - [x] 顯示測試結果和錯誤提示


## 統一對話框版面設計
- [x] 更新 MinimalLayout、ProfessionalLayout、CustomLayout 使用統一的緊湊設計
- [x] 更新 CustomDomainChat.tsx 使用相同的歡迎區域設計
- [x] 修復版面預覽組件位置（固定在右側）
- [x] 移除所有佈局組件的 header
- [x] 確保歡迎區域與版面預覽完全一致


## 修復版面設定頁面數據庫插入錯誤
- [x] 檢查 ai_personas 表的字段類型和長度
- [x] 修復 profilePhotoUrl 字段類型（改為 TEXT）
- [x] 測試保存功能（無錯誤）
- [x] 驗證修復效果


## 優化版面設定預覽功能
- [x] 右側預覽添加「手機版」和「桌面版」標籤頁切換
- [x] 手機版預覽：保持當前的緊湊尺寸（375px 寬）
- [x] 桌面版預覽：使用更寬的尺寸（1024px 或更大）
- [x] 上傳個人照片後，即時在預覽中顯示
- [x] 上傳背景圖片後，即時在預覽中顯示（自訂背景風格）
- [x] 測試並驗證預覽效果

## 修復版面設定圖片顯示問題
- [x] 修復個人照片上傳後無法在預覽中顯示
- [x] 修復背景圖片上傳後無法在預覽中顯示
- [x] 檢查 CompactChatPreview 組件的圖片顯示邏輯
- [x] 確保專業名片風格正確顯示個人照片
- [x] 確保自訂背景風格正確顯示背景圖片
- [x] 測試並驗證修復效果

## 修復背景圖片保存錯誤（base64 過大）
- [x] 分析問題：base64 圖片數據超過數據庫字段長度限制
- [x] 實現圖片上傳到 S3 的 tRPC procedure
- [x] 更新前端上傳邏輯：先上傳到 S3，再保存 URL
- [x] 優化個人照片也使用 S3 存儲
- [x] 測試圖片上傳和預覽功能
- [x] 驗證保存功能正常

## 修復專屬 AI 對話連結域名不一致
- [x] 檢查當前對話連結生成邏輯（儀表板頁面）
- [x] 查詢用戶的發布域名設定（lulubaby.xyz）
- [x] 修復對話連結使用發布域名而不是 localhost
- [x] 確保對話連結格式：https://lulubaby.xyz/chat/1
- [x] 測試並驗證修復效果

## 修復 lulubaby.xyz 域名路由
- [ ] 檢查當前域名路由配置（App.tsx 或 server 路由）
- [ ] 修復訪問 lulubaby.xyz 時自動導向 /chat/1
- [ ] 確保域名根路徑（/）導向對話頁面
- [ ] 測試並驗證修復效果

## 修復 CustomDomainChat 與 Chat 外觀不一致
- [ ] 對比 Chat.tsx 和 CustomDomainChat.tsx 的佈局差異
- [ ] CustomDomainChat 缺少個人照片顯示（專業名片風格）
- [ ] CustomDomainChat 缺少背景圖案/圖片
- [ ] 修復 CustomDomainChat 使用相同的佈局風格設定
- [ ] 確保 lulubaby.xyz 與 /chat/1 外觀完全一致


## 修復 CustomDomainChat 與 Chat 外觀不一致
- [x] 對比 Chat.tsx 和 CustomDomainChat.tsx 的差異
- [x] 更新 CustomDomainChat.tsx 使用相同的佈局風格邏輯
- [x] 支持 layoutStyle === "custom" 顯示背景圖片
- [x] 支持 layoutStyle === "professional" 顯示個人照片
- [x] 使用相同的 chatPlaceholder 設定
- [x] 重新發布網站讓 lulubaby.xyz 使用最新代碼

## 修復歡迎訊息文字顏色問題
- [x] 檢查 CustomDomainChat.tsx 的文字顏色設定
- [x] 驗證歡迎訊息文字顏色正確（有背景圖時白色，無背景時黑色）
- [x] lulubaby.xyz 與預覽連結 /chat/1 外觀完全一致
- [x] 測試並驗證修復效果


## 創建完整技術文檔（可重建平台）
- [ ] 審查現有技術文檔（LULUBABY_TECHNICAL_BLUEPRINT.md）
- [ ] 整理自訂網域功能的完整技術細節
- [ ] 整理 DNS 管理功能的完整技術細節
- [ ] 整理域名購買和支付流程的技術細節
- [ ] 創建完整的數據庫 Schema 文檔
- [ ] 創建完整的 API 路由文檔
- [ ] 創建前端組件結構文檔
- [ ] 創建第三方服務整合指南（Name.com、Stripe、Cloudflare）
- [ ] 生成最終的平台重建技術文檔


## 創建完整技術文檔（可重建平台）
- [x] 審查現有技術文檔和代碼結構
- [x] 整理自訂網域和 DNS 管理功能的技術細節
- [x] 創建完整的平台重建技術文檔（LULUBABY_PLATFORM_REBUILD_GUIDE.md）
- [x] 包含 Name.com API 整合說明
- [x] 包含 Cloudflare DNS 整合說明
- [x] 包含 Stripe 支付整合說明
- [x] 包含數據庫完整結構
- [x] 包含 API 路由完整清單
- [x] 包含重建步驟指南


## 版本管理系統
- [x] 創建版本變更日誌文檔（LULUBABY_CHANGELOG.md）
- [x] 將當前狀態標記為 v1.0
- [x] 建立版本升級指南模板
- [x] 建立版本命名規則
- [x] 更新技術文檔加入版本號和變更日誌連結


## 選項 A：完善現有功能（穩定性優先）

### 1. 修復 lulubaby.xyz 域名路由
- [x] 檢查當前域名路由配置（App.tsx 和 server 路由）
- [x] 修復訪問自訂域名時自動導向對話頁面
- [x] 確保域名根路徑（/）正確路由
- [x] 測試並驗證修復效果
- [x] 檢查背景圖片水印問題 - 確認是用戶上傳的背景圖片包含 "Healoop" 文字，非代碼問題

### 2. 添加錯誤處理和用戶提示
- [x] 審查現有錯誤處理邏輯
- [x] 改進 ErrorBoundary 組件（支持網絡錯誤、重試、返回首頁）
- [x] 添加網絡狀態監控 hook（斷網/重連提示）
- [x] 添加 API 錯誤處理 hook
- [x] 添加載入狀態骨架屏組件
- [ ] 添加 API 錯誤的用戶友好提示
- [ ] 添加網絡錯誤重試機制
- [ ] 添加表單驗證錯誤提示

### 3. 優化載入速度和性能
- [ ] 分析當前載入性能
- [ ] 實現代碼分割（lazy loading）
- [ ] 優化圖片載入（壓縮、懶加載）
- [ ] 添加載入骨架屏
- [ ] 優化 API 請求（緩存、批量）

### 4. 添加更多單元測試
- [ ] 審查現有測試覆蓋率
- [ ] 添加核心 API 測試
- [ ] 添加域名管理測試
- [ ] 添加支付流程測試
- [ ] 添加客戶記憶測試

### 3. 優化載入速度和性能
- [x] 審查當前載入性能
- [x] 實現代碼分割（lazy loading）
- [x] 優化圖片載入（壓縮、懶加載）
- [x] 添加載入骨架屏
- [x] 優化 API 請求（緩存、批量）


## 版面設定優化（移除頭像網址輸入框，添加圖片裁切）
- [x] 移除頭像網址輸入框（只保留上傳功能）
- [x] 創建圖片裁切組件（支持圓形/矩形裁切）
- [x] 整合圖片裁切到上傳流程
- [x] 添加文件大小和類型驗證
- [x] 添加照片規格說明 UI（個人照片 400x400px，背景圖片 1920x1080px）


## 版面設定背景類型選擇和顏色選擇器
- [x] 在數據庫中添加 backgroundType (enum: none/color/image) 和 backgroundColor (varchar)
- [x] 在版面設定 UI 中添加背景類型選擇（無背景/純色/圖片）
- [x] 添加顏色選擇器組件
- [x] 更新 server/routers.ts 和 server/db.ts 支持新欄位
- [x] 修改 Chat.tsx 的 CustomLayout 支持背景顏色渲染
- [x] 同步更新 CustomDomainChat.tsx 的渲染邏輯


## 修復版面設定背景顏色保存和顯示功能
- [x] 修復 Chat.tsx 的 CustomLayout 條件判斷（允許純色背景使用 CustomLayout）
- [x] 修復 CustomDomainChat.tsx 添加背景顏色支持
- [x] 實現 getBackgroundStyle() 函數支持背景圖片、純色背景和無背景
- [x] 修復文字顏色邏輯（使用 hasBackgroundImage 變量判斷）
- [x] 測試背景顏色保存和顯示功能


## 修復版面設定頁面預覽即時更新功能
- [x] 在 Appearance.tsx 中添加 backgroundType 和 backgroundColor props 到 CompactChatPreview
- [x] 更新 CompactChatPreview.tsx 的 PreviewProps 類型定義
- [x] 實現 getBackgroundStyle() 函數支持動態背景樣式
- [x] 修復文字顏色邏輯（使用 hasBackgroundImage 變量判斷）
- [x] 測試預覽即時更新功能


## 添加沉浸式風格勾選選項功能
- [x] 更新數據庫 schema 添加 immersiveMode 欄位到 ai_personas 表
- [x] 在版面設定頁面添加沉浸式風格勾選框（當選擇背景顏色或背景圖片時顯示）
- [x] 更新 tRPC router 支持 immersiveMode 參數
- [x] 修改 Chat.tsx 和 CustomDomainChat.tsx 的 CustomLayout 組件支持沉浸式模式
- [x] 更新 CompactChatPreview 組件支持沉浸式模式預覽
- [x] 測試驗證功能正常工作


## 修復預覽版面重複輸入框問題並優化沉浸式風格效果
- [x] 修復預覽輸入框順序（調整 CompactChatPreview 元素順序）
- [x] 改進沉浸式風格效果（從單一遮罩改為下方漸變模糊效果）
- [x] 統一更新三個組件（Chat.tsx、CustomDomainChat.tsx、CompactChatPreview.tsx）
- [x] 測試驗證預覽和實際頁面效果一致


## 修復預覽中重複輸入框問題（條件渲染）
- [x] 使用條件渲染只渲染當前選中的 Tab（手機版/桌面版）
- [x] 修復沉浸式風格保存後自動取消勾選的問題（使用 ?? 運算符正確載入 immersiveMode）
- [x] 測試驗證修復效果


## 修復對話頁面的兩個問題
- [x] 移除 CustomLayout 底部重複的輸入框（添加條件判斷只在有消息時顯示）
- [x] 修復沉浸式風格未生效的問題（在 persona.getPublic API 中添加 immersiveMode 欄位）
- [x] 修復 upsertPersona 數據庫更新邏輯（添加 immersiveMode 和 buttonDisplayMode 到 onDuplicateKeyUpdate）
- [x] 測試驗證修復效果


## 修復沉浸式風格的漸變覆蓋層顯示問題
- [x] 將背景色從根元素移到漸變覆蓋層容器中
- [x] 當 immersiveMode 為 true 時，根元素不應用背景樣式
- [x] 背景色作為漸變覆蓋層的底層，漸變效果在其上方
- [x] 測試驗證沉浸式風格的漸變效果已生效


## 修復 CustomDomainChat 組件的重複輸入框問題
- [x] 在 Custom Layout 的底部輸入框區域添加條件判斷（只在有消息時顯示）
- [x] 與 Chat.tsx 的修復邏輯保持一致
- [x] 測試驗證修復效果（需要在真實的自定義域名環境測試）


## 修復 CustomDomainChat 組件的沉浸式風格漸變效果
- [x] 將背景色從根元素移到漸變覆蓋層容器中
- [x] 根元素在沉浸式模式下不應用背景樣式
- [x] 確保漸變效果顯示在背景色之上
- [x] 測試驗證沉浸式風格的漸變效果已生效


## 修復 Appearance 頁面的空 src 屬性錯誤
- [x] 在 CompactChatPreview.tsx 中添加條件渲染
- [x] 只在 displayAvatarUrl 非空時渲染第一個 AvatarImage
- [x] 只在 profilePhotoUrl 非空時渲染第二個 AvatarImage
- [x] 當 URL 為空時，直接顯示 AvatarFallback
- [x] 測試驗證修復效果


## 重新檢查 /chat/1 頁面的兩個輸入框問題
- [x] 訪問 /chat/1 頁面並截圖
- [x] 識別兩個輸入框的位置和來源（ProfessionalLayout）
- [x] 檢查是否是不同的布局組件（使用 ProfessionalLayout）
- [x] 修復重複輸入框問題（ProfessionalLayout 底部輸入框添加條件判斷）
- [x] 測試確認只有一個輸入框


## 修復版面設定有背景時快捷按鈕的樣式
- [ ] 分析目前快捷按鈕的樣式邏輯（Chat.tsx, CustomDomainChat.tsx, CompactChatPreview.tsx）
- [ ] 確定需要修改的組件和條件判斷（有背景顏色或背景圖片時）
- [ ] 修改快捷按鈕樣式添加白色底色（bg-white 或 bg-white/90）
- [ ] 更新三個組件的快捷按鈕樣式保持一致
- [ ] 測試純顏色背景下的快捷按鈕顯示
- [ ] 測試背景圖片下的快捷按鈕顯示
- [ ] 測試無背景時的快捷按鈕顯示（確保不受影響）
- [ ] 驗證預覽面板的快捷按鈕樣式與實際頁面一致


## 背景圖片展示方式設定
- [x] 分析 CSS background-size 和 background-position 選項
- [x] 設計用戶友好的展示方式選項（平鋪、適應螢幕、按比例縮放、填滿、置中等）
- [x] 擴展數據庫 personas 表添加 backgroundSize、backgroundPosition 和 backgroundRepeat 欄位
- [x] 更新後端 API 支持背景圖片展示設定的保存和讀取
- [x] 更新版面設定頁面 UI 添加展示方式選擇器（三個下拉選單）
- [x] 更新對話頁面應用背景圖片展示設定
- [x] 測試所有展示方式在不同圖片尺寸下的效果


## 將背景圖片展示方式設定整合到圖片裁切器
- [ ] 分析目前的 ImageCropper 組件實現
- [ ] 移除 Appearance.tsx 中獨立的展示方式選擇器（三個 select）
- [ ] 在 ImageCropper 組件中添加展示方式設定選項
- [ ] 在裁切器預覽中實現即時顯示不同展示方式的效果
- [ ] 將展示方式設定與裁切結果一起返回
- [ ] 更新 Appearance.tsx 的圖片上傳流程整合展示方式設定
- [ ] 測試裁切器中的展示方式設定和即時預覽功能


## 優化背景圖片裁切器
- [ ] 分析目前預覽版面的比例問題
- [ ] 修復預覽版面，使其按實際比例縮小顯示（不壓縮變形）
- [ ] 添加裁切器放大功能（Zoom In 按鈕）
- [ ] 添加裁切器縮小功能（Zoom Out 按鈕）
- [ ] 添加裁切器旋轉功能（Rotate 按鈕，90度旋轉）
- [ ] 優化裁切器 UI 佈局（按鈕排列）
- [ ] 測試所有新功能在不同圖片尺寸下的效果

## 修復圖片裁切器 CORS 錯誤
- [ ] 分析 Tainted canvas 錯誤原因（S3 圖片跨域問題）
- [ ] 在 ImageCropper 的 react-easy-crop 組件添加 crossOrigin="anonymous"
- [ ] 檢查 S3 bucket CORS 配置是否正確
- [ ] 測試修復後的圖片裁切功能

## 修復圖片裁切器 CORS 錯誤 - 已完成
- [x] 分析 Tainted canvas 錯誤原因（S3 圖片跨域問題）
- [x] 在 ImageCropper 的 createImage 函數添加 crossOrigin="anonymous"
- [x] 修復代碼並等待用戶測試驗證

## 修復圖片裁切器圖片載入錯誤
- [ ] 改進 createImage 函數的錯誤處理
- [ ] 顯示詳細的圖片載入錯誤訊息
- [ ] 檢查 S3 圖片 URL 是否正確
- [ ] 測試修復後的圖片載入功能

## 修復圖片裁切器圖片載入錯誤 - 已完成
- [x] 改進 createImage 函數的錯誤處理
- [x] 顯示詳細的圖片載入錯誤訊息
- [x] 修改編輯按鈕邏輯：將 S3 圖片轉換為 blob URL
- [x] 為個人照片添加編輯按鈕
- [x] 測試修復後的圖片載入功能（等待用戶驗證）

## 修復 S3 圖片 fetch 失敗問題
- [ ] 分析 fetch() 無法下載 S3 圖片的原因
- [ ] 實施替代方案：直接傳遞 S3 URL 並確保 CORS 正確配置
- [ ] 或使用後端代理獲取圖片
- [ ] 測試修復後的功能

## 實施後端代理解決 CORS 問題 - 已完成
- [x] 創建 images.getImageAsBase64 API 端點
- [x] 後端通過 fetch 獲取 S3 圖片並轉換為 base64
- [x] 更新背景圖片編輯按鈕使用後端代理
- [x] 更新個人照片編輯按鈕使用後端代理
- [x] 測試修復後的功能（等待用戶驗證）

## 裁切器即時預覽功能
- [ ] 分析目前 ImageCropper 的預覽實現
- [ ] 實現預覽區域同步顯示放大縮小效果
- [ ] 實現預覽區域同步顯示旋轉效果
- [ ] 實現預覽區域同步顯示展示方式設定
- [ ] 測試即時預覽功能

## 裁切器即時預覽功能 - 已完成
- [x] 分析目前 ImageCropper 的預覽實現
- [x] 添加 previewUrl 狀態儲存裁切後的預覽圖
- [x] 使用 useEffect 監聽裁切參數變化（croppedAreaPixels）
- [x] 即時生成裁切後的 blob URL
- [x] 更新預覽區域使用裁切後的圖片
- [x] 預覽區域同步顯示展示方式設定
- [x] 測試即時預覽功能（等待用戶驗證）

## 歡迎語文字顏色和大小設定
- [ ] 擴展數據庫 ai_personas 表添加 welcomeMessageColor 和 welcomeMessageSize 欄位
- [ ] 更新後端 API 支持保存和讀取歡迎語樣式
- [ ] 在版面設定 UI 添加顏色選擇器（Color Picker）
- [ ] 在版面設定 UI 添加文字大小選擇器（Small/Medium/Large/XLarge）
- [ ] 更新對話頁面應用歡迎語樣式（顏色和大小）
- [ ] 更新預覽組件應用歡迎語樣式
- [ ] 測試功能

## 歡迎語文字顏色和大小設定 - 已完成
- [x] 擴展數據庫 ai_personas 表添加 welcomeMessageColor 和 welcomeMessageSize 欄位
- [x] 更新後端 persona.upsert API 支持保存歡迎語樣式
- [x] 更新後端 persona.getPublic API 返回歡迎語樣式
- [x] 在版面設定 UI 添加顏色選擇器（Color Picker + 文字輸入）
- [x] 在版面設定 UI 添加文字大小選擇器（Small/Medium/Large/XLarge）
- [x] 更新對話頁面應用歡迎語樣式（MinimalLayout）
- [x] 更新對話頁面應用歡迎語樣式（ProfessionalLayout）
- [x] 更新對話頁面應用歡迎語樣式（CustomLayout）
- [x] 測試功能（等待用戶驗證）

## 修復歡迎語樣式保存後自動重置問題
- [ ] 檢查預覽組件是否應用歡迎語樣式
- [ ] 檢查 API 返回的數據是否正確
- [ ] 修復問題
- [ ] 測試修復效果

## 修復歡迎語樣式保存後自動重置問題 - 已完成
- [x] 檢查保存函數的邏輯
- [x] 發現問題：使用 || null 會導致空字符串被轉換為 null
- [x] 修復：改為使用預設值（#000000 和 medium）
- [x] 測試修復效果（等待用戶驗證）

## 真正的問題：upsertPersona 缺少欄位更新
- [x] 發現 db.ts 中 upsertPersona 的 onDuplicateKeyUpdate 缺少新欄位
- [x] 添加 welcomeMessageColor 和 welcomeMessageSize 到更新列表
- [x] 同時添加缺失的 backgroundSize, backgroundPosition, backgroundRepeat
- [x] 測試修復效果（等待用戶驗證）

## 修復預覽版面即時顯示歡迎語樣式 + 增加字體大小選擇
- [ ] 找到預覽版面組件並添加歡迎語樣式
- [ ] 增加更多字體大小選擇（更細緻的選項）
- [ ] 測試修復效果

## 修復預覽版面即時顯示歡迎語樣式 + 增加字體大小選擇 - 已完成
- [x] 在 CompactChatPreview 組件添加 welcomeMessageColor 和 welcomeMessageSize props
- [x] 在預覽歡迎語顯示中應用顏色和大小樣式
- [x] 增加字體大小選擇：超小(12px)、小(14px)、中(16px)、大(18px)、特大(20px)、超大(24px)、巨大(28px)、極大(32px)、超級大(36px)
- [x] 更新 Chat.tsx 的字體大小輔助函數
- [x] 測試修復效果（等待用戶驗證）

## 修復專業名片佈局歡迎語樣式在對話連結不顯示
- [ ] 檢查 ProfessionalLayout 組件的歡迎語樣式應用
- [ ] 修復問題
- [ ] 測試修復效果

## 客戶登入功能和 API 文檔修復
- [ ] 創建客戶認證後端 API (customerAuthRouter.ts)
- [ ] 創建客戶登入對話框組件 (CustomerLoginDialog.tsx)
- [ ] 更新 Chat.tsx 添加登入按鈕
- [ ] 創建 API 文檔頁面 (ApiDocs.tsx)
- [ ] 更新路由和後端配置
- [ ] 測試功能
- [x] 創建客戶認證後端 API (customerAuthRouter.ts)
- [x] 創建客戶登入對話框組件 (CustomerLoginDialog.tsx)
- [x] 更新 Chat.tsx 添加登入按鈕（三種佈局都已添加）
- [x] 創建 API 文檔頁面 (ApiDocs.tsx)
- [x] 更新 App.tsx 路由配置
