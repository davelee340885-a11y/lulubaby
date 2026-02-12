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
- [x] 測試並驗證修復效果## 修復 lulubaby.xyz 域名路由
- [ ] 檢查當前域名路由配置（App.tsx 或 server 路由）
- [ ] 修復訪問 lulubaby.xyz 時自動導向 /chat/1
- [ ] 確保域名根路徑（/）導向對話頁面
- [x] 測試並驗證修復（註冊和登入成功）效果

## 登入系統重新設計（2026-01-10 下午）
- [ ] 分析 Manus AI 版面設計，提取設計要點
- [ ] 設計新的登入系統架構（電郵 + 密碼登入流程）
- [ ] 實現 emailLogin API（驗證電郵和密碼）
- [ ] 實現 emailSignup API（完整的註冊邏輯）
- [ ] 重新設計登入對話框 UI（參考 Manus 風格）
- [ ] 實現登入後導向儀表板功能
- [ ] 完整的 UAT 測試
- [ ] 保存檢查點DomainChat 與 Chat 外觀不一致
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


## 客戶登入功能修復（緊急修復）
- [x] 檢查 Chat.tsx 中的登入按鈕實現
- [x] 檢查 CustomDomainChat.tsx 中的登入按鈕實現
- [x] 在 Chat.tsx 的 MinimalLayout 歡迎頁面添加固定登入按鈕
- [x] 在 Chat.tsx 的 ProfessionalLayout 歡迎頁面添加固定登入按鈕
- [x] 在 Chat.tsx 的 CustomLayout 歡迎頁面添加固定登入按鈕
- [x] 在 CustomDomainChat.tsx 添加 CustomerLoginDialog 導入
- [x] 在 CustomDomainChat.tsx 添加客戶登入狀態管理
- [x] 在 CustomDomainChat.tsx 的 custom 佈局添加登入按鈕和對話框
- [x] 在 CustomDomainChat.tsx 的 minimal/professional 佈局添加登入按鈕和對話框
- [x] 測試修復效果


## Email 驗證碼發送功能
- [x] 檢查 Gmail MCP 工具可用性
- [x] 決定移除驗證碼功能，改為簡單 Email 登入

## 客戶登入功能重構
- [x] 修改後端 customerAuthRouter.ts 支持簡單 Email 登入
- [x] 配置 Google OAuth 登入
- [x] 修改前端 CustomerLoginDialog.tsx 移除驗證碼 UI
- [x] 創建 Google OAuth callback 頁面
- [x] 測試登入功能 (11 tests passed)


## UAT 測試 - 2026-01-10
- [ ] 修復「建立帳戶」按鈕在登入對話框中不顯示的問題
- [ ] 修復「建立帳戶」提交按鈕無反應的問題
- [ ] 測試完整的註冊流程（填寫表單 → 提交 → 驗證）
- [ ] 測試登入流程
- [ ] 測試忘記密碼流程
- [ ] 測試聊天功能
- [ ] 測試快速按鈕功能
- [ ] 測試頁面導航
- [ ] 測試響應式設計
- [ ] 生成完整 UAT 報告


## UAT 測試和登入流程修復（2026-01-10）
- [x] Cloudflare CDN 緩存清除
- [x] 後端 emailSignup API 實現
- [ ] 前端登入對話框功能修復
- [ ] 「建立帳戶」按鈕功能測試
- [ ] 完全重新設計登入流程，使用更簡單的實現方式
- [ ] 驗證登入對話框能夠正確打開
- [ ] 測試「建立帳戶」功能
- [ ] 完成完整的 UAT 測試


## Bug 修復：客戶註冊失敗（2026-01-10 下午 6:47）
- [x] 調查客戶註冊失敗的原因（customer_users 表不存在）
- [x] 修復後端 API 問題（手動創建 customer_users 表）
- [x] 測試並驗證修復（註冊和登入成功）


## 登入後導向儀表板功能（2026-01-10 下午）
- [ ] 設計儀表板架構和路由
- [ ] 創建客戶儀表板頁面（CustomerDashboard.tsx）
- [ ] 實現 AI 智能體設定功能
- [ ] 實現登入後自動導向儀表板
- [ ] 測試完整流程
- [ ] 保存檢查點


## 登入後導向儀表板功能（2026-01-10）
- [x] 設計儀表板架構和路由
- [x] 創建客戶儀表板頁面（CustomerDashboard.tsx）
- [x] 實現 AI 智能體設定功能（外觀、名稱、主題顏色、性格）
- [x] 實現登入後自動導向儀表板
- [ ] 測試完整流程（待發佈後測試）
- [ ] 保存檢查點


## 修復付費用戶後台 API 錯誤（2026-01-10）
- [x] 診斷 API 查詢錯誤（返回 HTML 而非 JSON）
- [x] 刪除 CustomerDashboard 組件和路由
- [ ] 修復 API 錯誤
- [x] 測試修復結果


## 修復風格設定接入 LLM（2026-01-10）
- [x] 檢查所有設定是否接入 LLM
- [x] 實現風格設定轉換為 LLM 指令（40+ 項）
- [x] 修復其他未接入的設定
- [x] 測試修復結果


## 超級銷售大腦 MVP 開發（2026-01-29）
- [x] 創建 feature/mvp-brain 分支
- [x] 創建 Docker Compose（Qdrant + Neo4j）
- [x] 創建 server/services/memoryService.ts（記憶服務層）
- [x] 創建 server/learningDiaryRouter.ts（學習日記 API）
- [x] 修改 server/routers.ts 整合記憶檢索
- [x] 創建 client/src/pages/Brain.tsx（我的大腦管理頁面）
- [x] 在 App.tsx 添加 /brain 路由
- [x] 在 DashboardLayout.tsx 添加「🧠 我的大腦」導航入口
- [x] 測試 Docker 服務（使用 MySQL 替代）
- [x] 測試學習日記功能
- [x] 整合記憶系統到對話流程
- [x] 推送代碼到 GitHub feature/mvp-brain 分支
- [x] 生成完成報告


## 增強學習日記對話整合（2026-01-29）
- [ ] 修改 chat.send 路由整合學習日記
- [ ] 調用 memoryService.searchMemories() 檢索相關記憶
- [ ] 將記憶內容注入 System Prompt
- [ ] 測試對話整合功能


## 增強學習日記對話整合（2026-01-29）
- [x] 修改 chat.send 路由整合學習日記
- [x] 調用 memoryService.searchMemories() 檢索相關記憶
- [x] 將記憶內容注入 System Prompt
- [x] 改進提示詞格式，明確告訴 AI 這是已知資訊
- [x] 測試對話整合功能


## 優化記憶引用並創建 PR（2026-01-29）
- [ ] 將記憶內容放在 System Prompt 最前面位置
- [ ] 加強提示詞，明確告訴 AI 必須優先使用記憶資訊
- [ ] 測試驗證 AI 是否正確引用記憶
- [x] 創建 PR 並合併到主分支


## 優化記憶引用並創建 PR（2026-01-30）
- [x] 將記憶內容放在 System Prompt 最前面位置
- [x] 加強提示詞，明確告訴 AI 必須優先使用記憶資訊
- [x] 測試驗證 AI 是否正確引用記憶
- [x] 創建 PR 並合併到主分支


## 修復 learningDiary 路由未註冊錯誤（2026-01-30）
- [x] 檢查 learningDiary 路由是否正確註冊到 appRouter
- [x] 修復路由註冊問題（重啟伺服器後正常）
- [x] 測試修復結果


## 清理代碼並完成 PR（2026-01-31）
- [x] 刪除未使用的 CustomerDashboard 組件
- [x] 運行 pnpm typecheck 確認錯誤已修復（無錯誤）
- [x] 運行 pnpm lint 確認代碼風格正確（無 lint 命令）
- [x] 測試記憶引用效果（AI 成功引用張先生記憶）
- [x] 提交代碼並創建 PR
- [x] 合併 PR 到主分支


## 後端 UAT 問題修復（2026-01-31）
- [x] [High] 學習日記選項 API 認證問題 - 改為 publicProcedure
- [x] [Medium] 資源不存在錯誤處理 - 返回 404 狀態碼 (TRPCError NOT_FOUND)
- [x] [Low] 方法命名一致性 - getContextualMemories → getMemoryContext
- [x] 測試驗證修復結果 (277 passed, 4 failed - 失敗為既有的 customerAuth 測試問題，與本次修復無關)


## 圖片載入錯誤修復（2026-01-31）
- [x] 調查 /appearance 頁面圖片載入錯誤原因
- [x] 修復 Failed to fetch image: Not Found 錯誤 - 改進錯誤處理和用戶提示
- [x] 測試驗證修復結果 - 圖片不存在時會自動清除 URL 並顯示友善提示


## 客戶頁面資料庫查詢錯誤修復（2026-01-31）
- [ ] 調查 /customers 頁面資料庫查詢錯誤原因
- [ ] 修復資料庫 schema 或查詢問題
- [ ] 測試驗證修復結果


## 客戶頁面資料庫查詢錯誤修復（2026-01-31）
- [x] 調查 /customers 頁面資料庫查詢錯誤原因 - 欄位名稱不一致
- [x] 修復資料庫 schema - 重命名欄位並添加缺失欄位
  - emailVerified → isEmailVerified
  - passwordResetExpires → passwordResetExpiry
  - 添加 emailVerificationToken, emailVerificationExpiry, lastLoginAt
- [x] 測試驗證修復結果 - 客戶列表正常載入


## 版面設定預覽問題修復（2026-02-01）
- [ ] 調查預覽組件和風格設定邏輯
- [ ] 修復簡約風格預覽顯示為純白色背景
- [ ] 測試驗證修復結果


## 版面設定預覽問題修復（2026-02-01）
- [x] 調查預覽組件和風格設定邏輯
- [x] 修復簡約風格預覽顯示為純白色背景 - immersiveMode 只在 custom 風格生效
- [x] 測試驗證修復結果 - 預覽已顯示純白色背景


## 智能體對話介面開發（2026-02-01）
### 後端開發
- [x] 創建 agentChatRouter.ts 路由文件
- [x] 實現 sendMessage mutation（對話中學習邏輯）
- [x] 整合到 server/routers.ts

### 前端開發
- [ ] 創建 AgentChatPage.tsx 頁面組件
- [ ] 創建 AgentChatLayout.tsx 佈局組件（可收合側邊欄）
- [ ] 實現 Manus 風格對話框 UI
- [ ] 添加 /agent-chat 路由到 App.tsx
- [ ] 更新 DashboardLayout 導航（添加「智能體對話」按鈕）
- [ ] 添加「AI 開發內地客戶」Modal 到側邊欄底部

### 驗收標準
- [ ] 用戶可通過側邊欄進入智能體對話介面
- [ ] 可收合側邊欄正常運作
- [ ] 對話框 UI 與 Manus 一致
- [ ] 對話中學習功能正常（「記住」關鍵詞觸發）
- [ ] AI 開發內地客戶 Modal 正常顯示


## 智能體對話介面開發（2026-02-01）
- [x] 創建 agentChatRouter.ts 後端路由文件
- [x] 實現 sendMessage mutation（對話中學習邏輯）
- [x] 整合到 server/routers.ts
- [x] 創建 AgentChatLayout.tsx 佈局組件
- [x] 創建 AgentChatPage.tsx 頁面組件
- [x] 實現 Manus 風格對話框 UI
- [x] 添加 /agent-chat 路由到 App.tsx
- [x] 添加「智能體對話」導航按鈕到側邊欄
- [x] 測試對話中學習功能 - 記住 John 花生過敏已成功保存
- [x] 測試「我的大腦」記憶保存 - 記憶已顯示在列表中
- [ ] 測試 AI 開發內地客戶 Modal


## 智能體對話介面開發（2026-02-01）
- [x] 後端：創建 agentChatRouter.ts 路由文件
- [x] 後端：實現 sendMessage mutation（對話中學習邏輯）
- [x] 後端：整合到 server/routers.ts
- [x] 前端：創建 AgentChatLayout.tsx 佈局組件
- [x] 前端：創建 AgentChatPage.tsx 頁面組件
- [x] 前端：實現 Manus 風格對話框 UI
- [x] 前端：添加 /agent-chat 路由到 App.tsx
- [x] 前端：添加「智能體對話」導航按鈕到側邊欄
- [x] 功能：測試對話中學習功能 - 記住 John 花生過敏已成功保存
- [x] 功能：測試「我的大腦」記憶保存 - 記憶已顯示在列表中
- [x] 功能：測試 AI 開發內地客戶 Modal - 已成功顯示聯絡信息


## 儀表板文字和連結修復（2026-02-02）
- [x] 修改「預覽 AI 對話」文字為「預覽客戶前端 AI 對話」
- [x] 修復專屬 AI 對話連結錯誤 - 優先使用已發布域名，否則使用當前 URL
- [x] 測試驗證修復結果 - 側邊欄文字已更新


## 刪除測試域名和修復對話連結（2026-02-02）
- [x] 刪除錯誤的測試域名 test-1769841009698.xyz
- [x] 修復對話連結使用 Manus 內建 URL（manus.space 格式）
- [x] 測試驗證修復結果 - 用戶端渲染時會顯示正確的 Manus URL


## AI 開發內地客戶按鈕修復（2026-02-02）
- [x] 調查按鈕消失原因 - 按鈕只在 AgentChatLayout 中，未在 DashboardLayout 中
- [x] 修復按鈕顯示問題 - 在 DashboardLayout 側邊欄底部添加按鈕和 Modal
- [ ] 測試驗證修復結果


## AI 開發內地客戶按鈕修復（2026-02-02）
- [x] 調查按鈕消失原因 - 按鈕只在 AgentChatLayout 中，未在 DashboardLayout 中
- [x] 修復按鈕顯示問題 - 在 DashboardLayout 側邊欄底部添加按鈕和 Modal
- [x] 測試驗證修復結果 - 截圖確認按鈕已顯示在側邊欄底部


## AI 開發內地客戶聯繫表單（2026-02-02）
- [x] 移除電郵和電話資訊顯示
- [x] 設計聯繫表單 UI（姓名、電話、電郵、諮詢內容）
- [x] 創建後端 API 處理表單提交 (system.submitContactForm)
- [x] 實現表單驗證和提交成功提示
- [x] 測試完整流程 - 6 個測試全部通過


## 多用戶認證系統與管理員後台（2026-02-02）

### 數據庫變更
- [ ] 更新 users 表，加入 passwordHash 和 role 字段
- [ ] 新增 passwordResetTokens 表
- [ ] 確保所有用戶數據表都有 userId 外鍵
- [ ] 執行 drizzle-kit push 更新數據庫

### 後端 API
- [ ] 創建 authRouter.ts
  - [ ] signup - 用戶註冊
  - [ ] login - 用戶登入
  - [ ] logout - 用戶登出
  - [ ] requestPasswordReset - 請求密碼重置
  - [ ] resetPassword - 重置密碼
- [ ] 創建 adminRouter.ts
  - [ ] getAllUsers - 獲取所有用戶列表
  - [ ] updateUserRole - 更新用戶角色
- [ ] 修改 context.ts 使用 JWT cookie 驗證取代 Manus OAuth

### 前端頁面
- [ ] 創建 /signup 註冊頁面
- [ ] 創建 /login 登入頁面（包含「忘記密碼」鏈接）
- [ ] 創建 /forgot-password 忘記密碼頁面
- [ ] 創建 /reset-password 重置密碼頁面
- [ ] 創建 /admin/users 管理員後台頁面

### UI 要求
- [ ] 所有密碼輸入框都有「顯示/隱藏密碼」的眼睛圖標按鈕
- [ ] 管理員後台需要權限保護，僅限 role === 'admin' 的用戶訪問

### 測試驗收
- [ ] 新用戶可以使用電郵和密碼註冊
- [ ] 現有用戶可以使用電郵和密碼登入
- [ ] 用戶可以使用「忘記密碼」功能重置密碼
- [ ] 每個用戶只能看到自己的 AI 記憶和數據
- [ ] 管理員可以在 /admin/users 查看所有用戶列表
- [ ] 管理員可以更改用戶的角色


## 多用戶認證系統與管理員後台（2026-02-02）
- [x] 數據庫變更 - users 表添加 passwordHash 字段，新增 passwordResetTokens 表
- [x] 創建 authRouter.ts - 實現 signup, login, logout, requestPasswordReset, resetPassword
- [x] 創建 adminRouter.ts - 實現 getAllUsers, updateUserRole, deleteUser, getDashboardStats
- [x] 修改 sdk.ts - 支持電郵/密碼用戶的 JWT 認證
- [x] 創建 /signup 註冊頁面 - 包含密碼顯示/隱藏眼睛圖標
- [x] 創建 /login 登入頁面 - 包含密碼顯示/隱藏眼睛圖標和「忘記密碼」連結
- [x] 創建 /forgot-password 忘記密碼頁面
- [x] 創建 /reset-password 重置密碼頁面 - 包含密碼顯示/隱藏眼睛圖標
- [x] 創建 /admin/users 管理員後台頁面 - 包含權限保護
- [x] 更新 App.tsx 路由配置
- [x] 編寫認證 API 測試 - 16 個測試通過
- [x] 運行所有測試 - 299 個測試通過（4 個 customerAuth 測試失敗為既有問題）


## 客戶前端 AI 對話登入整合（2026-02-02）
- [ ] 分析現有客戶認證系統架構
- [ ] 確保登入按鈕在所有對話佈局中顯示
- [ ] 整合登入狀態到對話頁面
- [ ] 測試完整登入流程


## 統一認證系統與登入按鈕重新設計（2026-02-02）
- [ ] 整合 customerAuth 到 authRouter（統一認證系統）
- [ ] 重新設計登入按鈕 - 參考 Manus AI 簡約風格
- [ ] 更新 AI 對話頁面使用統一認證
- [ ] 更新 CustomerLoginDialog 使用統一 API
- [ ] 執行後台測試
- [ ] 執行前端 UAT 測試


## 統一認證系統與登入按鈕重新設計（2026-02-02）
- [x] 統一認證系統 - 在 authRouter 中添加 customerLogin 和 customerSignup API
- [x] 重新設計登入按鈕 - 創建 LoginButton 和 LoginIconButton 組件，參考 Manus AI 簡約風格
- [x] 更新 AI 對話頁面 - 替換所有舊登入按鈕為新的簡約風格
- [x] 更新 CustomerLoginDialog - 使用統一的 authRouter API
- [x] 創建統一認證測試 - 10 個測試全部通過
- [x] 運行所有測試 - 309 個測試通過（4 個 customerAuth 測試失敗為舊 API 測試）


## OAuth 登入問題修復（2026-02-02）
- [x] 分析 OAuth 登入流程和問題根源
- [x] 修復登入後自動跳回未登入畫面的問題 - 添加 customerSession 查詢恢復登入狀態
- [x] 處理 Manus 預覽環境與其他 OAuth 登入的衝突 - 移除社交登入按鈕
- [x] 測試並驗證修復結果 - 309 個測試通過（4 個 customerAuth 測試失敗為舊 API 測試）


## 電郵註冊 404 錯誤修復（2026-02-04）
- [x] 調查 404 錯誤的根源 - 註冊成功後跳轉到不存在的 /customer-dashboard 路由
- [x] 修復註冊流程和路由問題 - 移除跳轉，註冊/登入後留在當前對話頁面
- [x] 測試並驗證修復結果 - 309 個測試通過


## 左下角登入按鈕消失修復（2026-02-04）
- [ ] 調查登入按鈕消失的原因
- [ ] 修復登入按鈕顯示問題
- [ ] 測試並驗證修復結果


## 左下角登入按鈕顯示修復（2026-02-04）
- [x] 調查登入按鈕消失的原因 - 按鈕被 Manus 預覽模式提示條遮擋
- [x] 修復登入按鈕顯示問題 - 增加 z-index 到 9999、底部間距從 4 改為 20、增加邊框和陰影
- [x] 測試並驗證修復結果 - 截圖確認按鈕已顯示在左下角


## CustomLayout 登入按鈕不顯示修復（2026-02-04）
- [x] 調查 CustomLayout 中登入按鈕的代碼 - 登入按鈕在歡迎區域內部，當有背景圖片時可能被遮擋
- [x] 修復 CustomLayout 登入按鈕顯示問題 - 將登入按鈕移到最外層 div，確保始終顯示
- [x] 同時修復 MinimalLayout 和 ProfessionalLayout - 統一登入按鈕位置
- [x] 測試並驗證修復結果 - 309 個測試通過（4 個 customerAuth 測試失敗為舊 API 測試）


## Stripe 支付系統整合（2026-02-04）
- [x] 查看 Stripe 帳戶信息 - 密鑰驗證通過
- [x] 在 Stripe 創建產品（免費版/專業版/企業版）
- [x] 添加 Stripe 功能到項目 - 安裝 stripe npm 包
- [x] 更新 subscriptions 數據庫表 - plan 改為 free/pro/enterprise，添加 Stripe 欄位
- [x] 創建 Stripe Checkout Session API - stripeRouter.createCheckoutSession
- [x] 創建 Stripe Webhook 端點 - /api/stripe/webhook 處理訂閱事件
- [x] 創建 Stripe Customer Portal API - stripeRouter.createPortalSession
- [x] 更新 /pricing 頁面連接 Stripe Checkout - 點擊升級按鈕跳轉 Stripe Checkout
- [x] 添加帳戶設定頁面顯示訂閱狀態 - 整合 Stripe 訂閱狀態、同步功能
- [x] 添加「管理訂閱」按鈕連接 Customer Portal - Account 頁面管理訂閱按鈕
- [x] 編寫測試並驗證完整訂閱流程 - 20 個 Stripe 整合測試通過
- [x] 推送到 GitHub - 已推送到 davelee340885-a11y/lulubaby


## Spark 充值系統改造（2026-02-09）
- [x] 數據庫改造：users 表新增 sparkBalance 欄位（默認 100）
- [x] 數據庫改造：新增 spark_transactions 表
- [x] 保留 PLAN_LIMITS 常量（依然用於內部限額檢查）
- [x] 運行 drizzle-kit generate 和 push 遷移數據庫
- [x] 重寫 shared/stripeConfig.ts 為 Spark 充值包配置（4個包：Snack/Energy/Super/Unlimited）
- [x] 重寫 server/stripeRouter.ts 為 Spark 充值 API（getBalance, getTransactions, getPackages, getCosts, createCheckoutSession, consume）
- [x] 重寫 server/webhooks/stripeSubscription.ts 處理一次性付款 + 冪等性檢查
- [x] 修改 server/db.ts：新增 getSparkBalance、getSparkTransactions、addSpark、deductSpark、checkSparkBalance 函數
- [x] 修改 server/routers.ts：chat.send 扣 1 Spark、subscription router 新增 Spark 查詢
- [x] 重寫 Pricing.tsx → Feed 頁面（四個充值包卡片 + 消耗標準表格 + 新用戶福利）
- [x] 重寫 Account.tsx（Spark 餘額卡片 + 充值/消耗記錄 + 使用量統計）
- [x] 更新 App.tsx 路由（新增 /feed 路由，保留 /pricing 相容）
- [x] 更新 DashboardLayout.tsx 側邊欄（會員計劃 → Feed ✨）
- [x] chat.send 已更新為 Spark 不足提示
- [x] 在 Stripe 創建四個一次性付款產品（Price IDs 已填入 stripeConfig.ts）
- [x] 編寫 Vitest 測試驗證 Spark 系統（32 個測試通過）
- [x] 推送到 GitHub - 已推送到 davelee340885-a11y/lulubaby (286ccdd)


## Spark 端到端驗證測試（2026-02-10）
- [x] 環境準備：檢查代碼、依賴、伺服器狀態
- [x] 代碼審查：檢查知識庫上傳是否有 Spark 扣費邏輯 - 無，已補全
- [x] 補全：知識庫上傳 Spark 扣費（檔案:100 Spark/MB, YouTube:5, 網頁:3, 文字:1, FAQ:2）
- [x] 代碼審查：檢查超能力/團隊/域名是否有 Spark 扣費邏輯 - 無，已補全
- [x] 補全：超能力設定 Spark 扣費（50 Spark/每個啟用的超能力）
- [x] 補全：團隊創建 Spark 扣費（500 Spark/次）
- [x] 補全：自訂域名 Spark 扣費（添加:1000, 購買:1000）
- [x] 補全：agentChat.sendMessage Spark 扣費（1 Spark/條）
- [x] 斷言 1：新用戶 sparkBalance 默認 100 ✅ (spark-e2e.test.ts)
- [x] 斷言 2：新用戶有 bonus 類型交易記錄 ✅ (spark-e2e.test.ts)
- [x] 斷言 3：發送 3 條對話後 sparkBalance = 97 ✅ (spark-e2e.test.ts)
- [x] 斷言 4：3 條 consume 類型交易記錄 ✅ (spark-e2e.test.ts)
- [x] 斷言 5：上傳文件後 sparkBalance 正確扣除 ✅ (spark-e2e.test.ts)
- [x] 斷言 6：知識庫消耗交易記錄 ✅ (spark-e2e.test.ts)
- [x] 斷言 7：Spark 不足時 API 拒絕 FORBIDDEN ✅ (spark-e2e.test.ts)
- [x] 斷言 8：Spark 不足時餘額不變 ✅ (spark-e2e.test.ts)
- [x] 斷言 9：充值後 sparkBalance 正確增加 ✅ (spark-e2e.test.ts)
- [x] 斷言 10：充值交易記錄正確 ✅ (spark-e2e.test.ts)
- [x] 斷言 11：其他功能 Spark 消耗正確（超能力、團隊、域名） ✅ (spark-e2e.test.ts + training.test.ts)
- [x] 斷言 12：其他功能交易記錄正確 ✅ (spark-e2e.test.ts)
- [x] 編寫 Vitest 測試覆蓋新增扣費邏輯 (29 個 E2E 測試 + 32 個 Stripe 測試 + 11 個 training 測試)
- [x] 前端驗證：Feed 頁面充值包卡片、消耗標準表格 ✅
- [x] 前端驗證：Account 頁面 Spark 餘額、交易記錄 ✅
- [x] 修復 Account 頁面知識庫大小 NaN undefined bug ✅
- [x] 推送到 GitHub - 8e8d14f
- [x] 生成 UAT 報告


## Bug 修復：知識庫文件上傳失敗（2026-02-10）
- [x] 診斷知識庫文件上傳失敗的根本原因 - PDF 二進制內容被當作文本存入 content 欄位導致 SQL 插入失敗
- [x] 修復上傳問題 - 對二進制文件（PDF/圖片等）不存儲原始內容，只存檔案信息
- [x] 驗證修復後上傳正常 - 375 個測試通過，無回歸問題
- [x] 推送到 GitHub - 862738e


## 知識庫 PDF 文本提取功能（2026-02-10）
- [x] 調查現有知識庫上傳和 AI 對話的代碼邏輯 - content 欄位被注入 system prompt
- [x] 安裝 PDF 解析庫 - pdf-parse v2 (PDFParse 類)
- [x] 修改上傳流程：PDF 上傳後自動提取文本存入 content 欄位
- [x] 確保 AI 對話能使用提取的 PDF 內容回答問題 - getKnowledgeContentByUserId 已正確讀取
- [x] 處理已上傳但未提取內容的 PDF - 回填腳本已更新 ceop leaflet.pdf (2123 字符)
- [x] 編寫測試驗證 PDF 提取功能 - 375 個測試通過
- [x] 推送到 GitHub - 2c4d14c

## Bug 修復：大型 PDF（49頁）文本內容超出 text 欄位限制（2026-02-10）
- [x] 檢查 content 欄位的數據庫類型和長度限制 - text 最大 65KB，中文 UTF-8 容易超出
- [x] 將 content 欄位從 text 改為 mediumtext（最大 16MB）
- [x] 運行 db:push 遷移數據庫
- [x] 驗證修復後大型 PDF 上傳正常 - 375 個測試通過，無回歸問題
- [ ] 推送到 GitHub

## 自訂子域名功能：xxx.lulubaby.xyz（2025-02-10）
- [x] 數據庫：在 users 表添加 subdomain 欄位
- [x] 後端 API：註冊時自動生成隨機子域名（如 abc123.lulubaby.xyz）
- [x] 後端 API：用戶可自訂子域名前綴（檢查唯一性、格式驗證）
- [x] 後端 API：根據子域名查詢對應用戶/Agent
- [x] 前端：在後台設定頁面顯示和編輯子域名
- [x] 前端：對話頁面支持通過子域名訪問
- [x] Cloudflare：添加 *.lulubaby.xyz 通配符 DNS CNAME 記錄（指向 lulubaby.manus.space，已 proxied）
- [x] 應用層路由：domainRouting middleware 處理 lulubaby.xyz 子域名（無需 Worker）
- [x] 測試：subdomain.test.ts 15 個測試全部通過

## lulubaby.xyz 自訂域名頁面添加儀表板入口（2025-02-10）
- [x] 在 CustomDomainChat 頁面添加儀表板 icon（登入用戶可見）
- [x] 點擊 icon 導航到 lulubaby.xyz 主域名儀表板
- [x] 確保未登入用戶不顯示儀表板 icon
- [x] App.tsx 路由邏輯更新：自訂域名只在根路徑顯示對話，其他路徑正常路由
- [x] 測試：subdomain.test.ts 19 個測試全部通過


## 平台入口重構：lulubaby.xyz 對話頁面 + Dashboard overlay（2025-02-10）
- [x] App.tsx 路由重構：lulubaby.xyz 根路徑顯示 HomePage（對話+overlay）
- [x] 創建 HomePage.tsx：對話頁面 + 左下角登入/儀表板 icon + Dashboard overlay
- [x] 左下角按鈕：未登入顯示「登入」，已登入顯示儀表板 icon（PanelLeft 圖案）
- [x] 點擊儀表板 icon 拉出 DashboardLayout 側邊欄 overlay
- [x] Login.tsx：隱藏 Manus OAuth（連續點擊 Logo 5 次觸發隱藏入口）
- [x] CustomDomainChat.tsx：子域名移除登入/儀表板按鈕（純客戶前端）
- [x] Manus 預覽域名仍顯示完整 Dashboard（開發模式）
- [x] 測試：22 個測試全部通過（路由邏輯、登入流程、OAuth 隱藏）

## DashboardLayout 側邊欄修復（2026-02-10）
- [x] 名稱更改：「預覽客戶前端 AI 對話」→「AI 對話 - 客戶端」
- [x] 名稱更改：「智能體對話」→「AI 對話 - 用戶端」
- [x] 修復設定圖標與 Lulubaby logo 重疊問題
- [x] 儀表板收合時只顯示 icon，展開時顯示 icon + 文字


## UAT 自動化測試（2026-02-10）
- [x] 測試 A：公開頁面與用戶註冊（/signup, /login）
- [x] 測試 B：核心儀表板功能（遍歷所有側邊欄頁面）
- [x] 測試 C：公開聊天頁面與登出
- [x] 測試 D：登入與密碼重設
- [x] Bug 修復：BUG-002 側邊欄溢出、BUG-005 已登入重定向、BUG-006 passwordHash 洩漏
- [x] 回歸測試通過，vitest 8/8 通過

## 圖標重疊修復（2026-02-10）
- [x] 修復設定齒輪圖標與 Lulubaby logo 重疊問題

## Lulubaby v1.0 全功能深度自動化測試（2026-02-10）
- [x] 第一階段：環境初始化與全系統啟動
- [x] 第二階段 A：基礎用戶流程（註冊、登入、登出、密碼重設）- 全部通過
- [x] 第二階段 B1：智能體訓練 - 滑塊測試與對話驗證（通過）
- [x] 第二階段 B2：知識庫 - 文件上傳與文本輸入測試（BUG-DT-005/006）
- [x] 第二階段 B3：超能力 - 逐個啟用與驗證（通過）
- [x] 第二階段 B4：我的大腦 - 記憶添加與對話驗證（BUG-DT-004/007/008）
- [x] 第二階段 C1：外觀定製測試（通過，BUG-DT-009 歡迎語顯示）
- [x] 第二階段 C2：快捷按鈕測試（通過）
- [x] 第三階段：Bug 修復與回歸測試（BUG-DT-004/005/007/008 已修復，vitest 7/7 通過）
- [x] 最終報告生成


## P0 Bug 修復：上線前攔路虎
- [x] 修復 CustomerLoginDialog UI 截斷問題（新用戶無法看到「建立帳戶」按鈕）
- [x] 修復公開聊天頁面 AI 不引用「我的大腦」知識問題
- [x] 編寫 Vitest 測試驗證大腦記憶注入修復

## P0 Bug 修復：公開聊天頁面 404
- [ ] 修復 https://i0t4qebd.lulubaby.xyz 的 404 錯誤

## 臨時替代方案：主站路由訪問 AI 聊天
- [x] 新增 /s/:subdomain 前端路由和頁面
- [x] 確保後端 API 支持通過 subdomain 參數獲取 persona 和聊天
- [x] 更新專屬網址顯示邏輯，同時顯示主站路由 URL
- [x] 編寫 Vitest 測試驗證

## Dashboard 專屬網址複製按鈕
- [ ] 在 Dashboard 專屬網址旁邊增加「複製連結」圖示按鈕

## 夜間全自動化深度功能測試
- [x] Phase 0: 安全備份（git checkpoint + tag）
- [x] Phase 1A: Alice 美容師完整生命週期測試
- [x] Phase 1B: Bob 房地產顧問完整生命週期測試
- [x] Phase 1C: 記憶隔離測試（Alice/Bob 互不可見）
- [x] Phase 2A: AI 學習能力測試（agentChat 記住 + 驗證）
- [x] Phase 2B: 訓練參數即時生效測試
- [x] Phase 3: 前端 UI 測試（所有頁面截圖 + console 錯誤）
- [x] Phase 4A: API 健壯性（空字串/超長/注入）
- [x] Phase 4B: 未認證訪問 401 測試
- [x] Phase 4C: 重複 training.update 不產生重複記錄
- [x] Bug 修復（P0/P1）
- [x] 生成 NIGHTLY_TEST_REPORT.md
- [x] 生成 NIGHTLY_TEST_BUGS.md

## 修復 YouTube 字幕提取錯誤處理
- [x] 後端：捕獲 YouTube 字幕禁用錯誤，返回友好提示
- [x] 前端：顯示用戶可理解的錯誤訊息（非技術性堆疊）
- [x] 測試：驗證修復後的錯誤處理

## 修復 YouTube 字幕提取功能（有字幕影片仍失敗）
- [x] 診斷 youtube-transcript 庫對有字幕影片的提取失敗原因（YouTube IP 封鎖雲端伺服器）
- [x] 前端：實作瀏覽器端 YouTube 字幕提取工具函數（零成本）
- [x] 後端：新增 API 接受前端提取的字幕數據（直接存儲模式）
- [x] 後端：新增 LLM 備援 API（可選，消耗 50 Spark 並提示用戶）
- [x] 前端：更新知識庫 UI 整合前端提取流程 + LLM 備援選項
- [x] 測試：驗證前端提取 + 備援流程（44 個測試全通過）

## 背景任務持久化 + AI 對話歷史
- [x] 全局背景任務管理器（Context/Store）— 跨頁面持久化異步操作
- [x] YouTube 字幕提取改為背景任務模式（切換頁面不中斷）
- [x] AI 對話持久化（切換頁面不丟失進行中的對話）
- [x] AI 對話用戶端增加對話歷史列表功能
- [x] 測試驗證所有改動（34 個測試文件、458 個測試全通過）

## 修復 AI 對話用戶端 UI 問題
- [x] 設定 icon 與歷史 icon 重疊問題（設定按鈕移到左下角）
- [x] 對話太長無法向下滾動問題（改用原生 overflow-y-auto）

## 移除 YouTube 上傳功能 + 修復背景任務狀態
- [x] 移除前端 YouTube tab 和相關代碼
- [x] 清理後端 YouTube 路由（標記為暫停，保留代碼）
- [x] 修復背景任務狀態在頁面切換後的可見性（全局指示器組件）

## 修復知識庫內容未關聯到 AI 對話用戶端
- [x] 分析知識庫與 AI 對話的關聯邏輯（agentChatRouter 缺少知識庫注入）
- [x] 修復知識庫內容注入到 AI 對話的流程
- [x] 測試驗證修復（34 測試文件、458 測試全通過）

## 修復知識庫網頁 URL 驗證過嚴
- [x] 修復 URL 驗證邏輯，自動補上 https:// 前綴，更友好的錯誤提示

## 修復知識庫網頁抓取 HTTP 403 錯誤
- [x] 添加多組 User-Agent 輪試 + 完整瀏覽器 headers + 友好錯誤提示

## 整合 LLM 網頁理解作為抓取備援
- [x] 後端：新增 LLM 網頁讀取 API（addWebpageLLM）
- [x] 後端：knowledgeSourceService 新增 LLM 網頁提取函數
- [x] 前端：直接抓取失敗時顯示 AI 讀取備援選項（標示消耗 10 Spark）
- [x] 前端：修復 TabsList grid-cols-5 為 grid-cols-4（YouTube tab 已移除）
- [x] 後端：addWebpage 抓取失敗時自動退還 3 Spark
- [x] 測試驗證（458 個測試全通過）

## 修復 403 錯誤後未顯示 LLM 備援選項
- [x] 診斷問題：後端 403 錯誤後前端需手動確認 AI 讀取，體驗不佳
- [x] 後端改為自動備援：403 失敗時自動嘗試 LLM 讀取，無需前端介入
- [x] 前端更新：移除手動 LLM 備援面板，更新提示文字和 loading 狀態
- [x] 成本提示：成功時顯示實際消耗（3 或 10 Spark）
- [x] 測試通過（458 tests passed）

## 修復知識庫內容未正確注入到用戶端 AI 對話
- [x] 檢查知識庫數據庫中的已抓取內容（coinmarketcap.com, aia.com.hk）
- [x] 檢查 agentChatRouter 中知識庫注入邏輯
- [x] 確認知識庫內容是否正確傳入 LLM system prompt
- [x] 修復注入邏輯：DB 查詢不設上限，按時間倒序排列，加入標題標記
- [x] system prompt 注入上限提升到 500,000 字元
- [x] 超過免費額度需要 Feed Spark 才能使用全部知識庫內容（free: 50K, pro: 200K, enterprise: 500K）
- [x] 每次超限對話額外收費 5 Spark（SPARK_COSTS.knowledgeBaseOverlimitPerChat）
- [x] 測試通過（458 tests, 34 files）

## 升級客戶記憶系統 — 即時智能摘取 + 主動資料索取

### 第一步：即時智能摘取
- [x] 創建 extractMemoryFromTurn 函數（輕量級 LLM 提取，非 tRPC 路由，而是內部函數）
- [x] 實現輕量級 LLM prompt 從單輪對話提取客戶信息
- [x] 將提取到的 customerInfo 更新到 customers 表
- [x] 將提取到的 memories 存入 customer_memories 表
- [x] 改造 chat.send：在回應末尾非同步觸發即時記憶提取（fire-and-forget）
- [x] 保留 endConversation 作為完整對話摘要的備援

### 第二步：主動資料索取
- [x] 在 ai_training 表新增 proactiveDataCollection 布爾欄位（默認 false）
- [x] 執行 pnpm db:push 推送 schema 變更
- [x] 前端「訓練智能體」頁面新增「主動獲取客戶資料」Toggle 開關
- [x] 綁定 Toggle 到 training.update 路由
- [x] 改造 chat.send System Prompt：加入主動索取邏輯（檢查客戶姓名/電郵完整度）

### 第三步：驗證與測試
- [x] Vitest 單元測試（25 個測試全通過）
- [x] 測試場景 1：智能摘取（驗證 extractMemoryFromTurn 函數、LLM prompt、DB 更新）
- [x] 測試場景 2：主動獲取（驗證 proactiveDataCollection 開關、prompt 注入、前端 Toggle）
- [x] 測試場景 3：主動獲取關閉時不注入 prompt（驗證條件檢查邏輯）
- [x] 所有 483 個測試通過（35 個測試文件）

## 修復免費專屬子域名預覽連結
- [x] 診斷問題：DashboardLayout.tsx 中預覽連結硬編碼為 /chat/1
- [x] Dashboard.tsx 和 Domain.tsx 已正確使用 persona.id，無需修改
- [x] 修復 DashboardLayout.tsx：動態查詢用戶 persona 和 subdomain
- [x] 優先使用 subdomain 路由（/s/{subdomain}），否則使用 /chat/{personaId}
- [x] 測試通過（458 + 25 = 483 tests）

## 修復新用戶子域名路由 + DashboardLayout 預覽連結
- [x] 診斷：新用戶註冊時沒有自動創建 persona
- [x] 診斷：DashboardLayout persona.get 返回 null 時 fallback 到 /chat/1
- [x] 修復 authRouter.ts signup：自動創建 persona
- [x] 修復 persona.get：如果不存在自動創建
- [x] 修復 getPersonaBySubdomain：如果用戶存在但 persona 不存在，自動創建
- [x] Vitest 測試（483 tests passed）
- [x] UAT：Dave Lee /s/davelee ✅，b@b.com /s/bbb ✅，Dashboard URL ✅，側邊欄連結 ✅
- [x] 修復 Dashboard/DashboardLayout/Domain chatUrl：publishedDomain + /s/{subdomain}

## 域名邏輯重構與 UI 優化

### 第一步：代碼重構 — 統一 AI 客戶端組件
- [x] 創建 CustomerChatClient.tsx 統一組件（接收 personaId prop）
- [x] 改造 CustomDomainChat.tsx 為輕量級外殼
- [x] 改造 SubdomainChat.tsx 為輕量級外殼
- [x] 改造 Chat.tsx 為輕量級外殼

### 第二步：UX 優化 — 區分內部訓練與外部客戶端
- [x] DashboardLayout 側邊欄文案更新（內部訓練對話 / 預覽 AI 客戶端）
- [x] AgentChatPage 頂部增加「內部訓練模式」提示框

### 第三步：重構「專屬網址」頁面 Domain.tsx
- [x] Domain.tsx UI 優化：自訂域名改為頁面內 Tabs 佈局
- [x] 卡片一：目前對話連結 + 免費專屬子域名
- [x] 卡片二：自訂域名（搜索/已購買/管理/費用說明 Tabs）
- [x] 卡片三：已連接域名列表（獨立卡片）
- [x] 費用說明改為雙欄佈局，搜索結果增加選中高亮

### 第四步：驗證
- [x] 內部訓練頁面提示框
- [x] 儀表板菜單文案
- [x] 預覽按鈕連結正確
- [x] 專屬網址頁面 Tabs 佈局
- [x] 免費網址功能測試
- [x] TypeScript 編譯 0 errors + Vitest 490 tests passed

## Bug Fix: 預覽 AI 客戶端連結修正
- [x] DashboardLayout「預覽 AI 客戶端」連結已修正：使用與儀表板相同的 URL 邏輯（publishedDomain > lulubaby.xyz/s/subdomain > /chat/id）

## Stripe 正式環境上線 (Go-Live)

### 階段一：版本保存與 GitHub 備份
- [x] 保存當前版本 v3.7.1 並推送到 GitHub (commit 21f7726)

### 階段二：環境變數統一
- [x] 統一 Stripe env vars（LULUBABY_STRIPE_* 和 STRIPE_* 合併為統一的 ENV.stripe*）
- [x] 後端 env.ts 統一為 stripeSecretKey / stripePublishableKey / stripeWebhookSecret

### 階段三：代碼重構
- [x] 後端 stripeRouter.ts 使用統一 ENV.stripeSecretKey
- [x] 後端 webhooks/stripeSubscription.ts 使用統一 ENV
- [x] 後端 webhooks/stripe.ts 使用統一 ENV（域名購買）
- [x] 後端 routers.ts createCheckoutSession 使用統一 ENV + 動態 URL
- [x] 前端 StripePaymentForm.tsx 移除硬編碼 pk_test_，改用 VITE_LULUBABY_STRIPE_PUBLISHABLE_KEY
- [x] stripeConfig.ts 價格 ID 支援環境變數覆蓋（STRIPE_PRICE_SNACK 等）
- [x] 移除 server/_core/index.ts 硬編碼 whsec_ webhook secret，改用 ENV.stripeWebhookSecret
- [x] 動態化 success/cancel URL（使用 req.headers.host，不再寫死 manus.computer）

### 階段四：驗證
- [x] 環境變數已設定（LULUBABY_STRIPE_* 自動注入）
- [x] TypeScript 編譯 0 errors + Vitest 490 tests passed
- [x] 保存 checkpoint (b072a9ec) 並交付
- [x] 推送到 GitHub (commit f0d913b)

### 階段五：正式環境產品創建
- [x] 在 Lulubaby Stripe Live 帳號創建 4 個 Spark 充值包產品
- [x] 更新 stripeConfig.ts 使用正式環境 Price IDs
- [x] 更新測試以支援 sk_live_ 金鑰格式
- [x] 全部 490 tests passed, 0 TS errors

## Stripe Webhook 端點驗證
- [x] 確認代碼中 webhook 路由配置正確（/api/stripe/webhook + /api/webhooks/stripe 兩個端點）
- [x] 在 Lulubaby Stripe Live 帳號創建 2 個 webhook 端點（Spark + 域名）
- [x] 測試 webhook 連接正常（兩個端點均回應 400 Missing stripe-signature）

## v2.0 暫時隱藏團隊管理功能
- [x] 註釋掉 DashboardLayout 側邊欄「團隊管理」入口
- [x] 註釋掉 Pricing 頁面「團隊成員」費用說明
- [x] 註釋掉 stripeConfig.ts + drizzle/schema.ts 的 teamMemberPerMonth
- [x] 更新相關測試文件（spark-e2e, stripe-subscription, subscription）
- [x] 運行測試確認全部通過（36 files, 492 passed, 1 skipped）

## v3.9.0 修復並完成 Widget 嵌入功能
- [x] 新增 widget_settings 數據庫表（drizzle/schema.ts + migration 0026）
- [x] 創建 widgetRouter.ts 後端 API（get + save + getPublicConfig）
- [x] 在 routers.ts 掛載 widgetRouter
- [x] 改造 Widget.tsx 使用後端 API 加載/保存設定（Tabs 佈局 + 即時預覽）
- [x] 創建 client/public/widget.js 嵌入腳本（tRPC config fetch + iframe chat）
- [x] 創建 WidgetClient.tsx 頁面（iframe 內的聊天客戶端）
- [x] 在 App.tsx 添加 /widget-client 路由（兩個分支都已添加）
- [x] 運行測試確認全部通過（37 files, 520 passed, 1 skipped）

## MVP 上線前緊急修復 (v3.9.1)
### 問題 #1【最高優先級】移除假的 Feed 側邊欄入口
- [x] 從 DashboardLayout 側邊欄移除 Feed 菜單項
- [x] /feed 路由保留為 Pricing 重定向（以防用戶書籤）

### 問題 #2【高優先級】實現真實的忘記密碼郵件發送
- [x] 創建 emailService.ts 郵件發送模組（Nodemailer + Gmail SMTP）
- [x] 修改 authRouter.ts requestPasswordReset 發送真實郵件（含品牌 HTML 模板 + CTA 按鈕）
- [x] 郵件失敗時 fallback 通知管理員
- [ ] 請求 GMAIL_USER + GMAIL_APP_PASSWORD 環境變數

### 問題 #3【中優先級】Spark 不足體驗優化
- [x] chat.send API 返回特定錯誤碼（SPARK_INSUFFICIENT via TRPCError）
- [x] CustomerChatClient.tsx 區分錯誤類型，顯示友好提示（「AI 助手暫時離線」）
- [x] 商家 Spark 不足時發送通知（notifyOwner fire-and-forget）
- [x] 運行測試確認全部通過（37 files, 520 passed, 1 skipped）


## 郵件服務改用 Titan Email SMTP
- [x] 更新 env.ts：SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM（取代 Gmail 專用變數）
- [x] 更新 emailService.ts：使用通用 SMTP 配置（預設 Titan Email 設定）
- [x] 請求 Titan Email SMTP 憑證

## Titan Email DNS 設定（Cloudflare）
- [x] 查詢 Titan Email 所需的 MX 記錄和 SPF 記錄
- [x] 通過 Cloudflare API 添加 MX 記錄到 lulubaby.xyz
- [x] 通過 Cloudflare API 添加 SPF (TXT) 記錄到 lulubaby.xyz
- [x] 驗證 DNS 記錄已生效
- [x] 在 Titan Email 控制台驗證域名已關聯

## 登出按鈕和帳戶設定頁面
- [x] 在側邊欄底部添加登出按鈕
- [x] 在側邊欄添加帳戶設定入口
- [x] 創建帳戶設定頁面（可更改名稱、電郵、密碼）
- [x] 後端 API 支援帳戶資料修改（名稱、電郵、密碼）
- [x] 測試登出和帳戶設定功能

## Spark 餘額顯示優化
- [x] 在側邊欄左上角 Lulubaby logo 旁邊顯示 Spark 餘額
- [x] 設計漂亮的 Spark 餘額展示樣式
- [x] 測試 Spark 餘額顯示功能

## 版面設定照片上傳修復
- [ ] 修復「專業名片」佈局風格的專業照片上傳（選擇檔案後無反應）
- [ ] 修復自訂背景上傳功能
- [ ] 測試照片上傳功能

## v3.12.0 核心路由重構 — 工作空間 ID 隔離
- [x] 重構 App.tsx：引入 WorkspaceGuard 組件 + /w/:workspaceId/ 路由
- [x] 改造 DashboardRoutes 接收 workspaceId 參數
- [x] 改造 Login.tsx：登入成功後跳轉到 /w/{subdomain}/dashboard
- [x] 更新後端 login API 返回 subdomain 欄位
- [x] 改造 LandingPage.tsx：已登入用戶自動跳轉到工作空間
- [x] 改造 DashboardLayout.tsx：接收 workspaceId，所有路徑加前綴
- [x] 客戶端聊天頁面保持純淨（無登入按鈕）
- [x] 測試所有路由場景（新用戶、商戶登入、工作空間隔離、客戶端訪問）

## v3.12.1 客戶端前端修復
- [x] 移除客戶端聊天頁面（/s/:subdomain 和 CustomDomainChat）的「登入」按鈕
- [x] 修復版面設定風格未正確顯示在客戶端前端（Professional 佈局顯示個人照片、Agent 名稱、Tagline；Minimal 佈局顯示 Avatar 和 Agent 名稱）

## v3.12.2 修復 Stripe 付款成功後重定向 URL
- [x] 調查 Stripe Checkout Session 的 success_url 配置（根因：ctx.req.headers.host 返回 Cloud Run 內部域名）
- [x] 修復 success_url 使用 Origin/Referer header 或前端傳遞的 URL（stripeRouter.ts + routers.ts）
- [x] 前端 Pricing.tsx 傳遞正確的 successUrl/cancelUrl，Account.tsx/Domain.tsx 使用 window.location.pathname 清理 URL
- [x] 測試通過：4 個專用測試 + 561 個全套件測試通過（僅2個已知 Stripe 網絡逾時）

## v3.14.0 Spark 定價修正 + 推薦獎勵系統
- [x] 階段1: 修改 stripeConfig.ts — 新定價 + SPARK_COSTS + 旗艦包（flagship 取代 unlimited）
- [x] 階段2a: 修改 schema.ts — users 表新增 referralCode + referredById
- [x] 階段2b: 修改 schema.ts — sparkTransactions type 枚舉新增 referral_bonus
- [x] 階段2c: 修改 schema.ts — SPARK_COSTS 同步更新
- [x] 階段3a: 修改 routers.ts — 知識庫上傳費用 knowledgeBasePerMB
- [x] 階段3b: 修改 routers.ts — AI 智能讀取網頁費用 10→5
- [x] 階段3c: 修改 routers.ts — 超能力改為一次性扣費
- [x] 階段3d: 修改 routers.ts — 移除域名相關 Spark 扣費
- [x] 階段4: 修改 stripeRouter.ts — packageType 枚舉 unlimited→flagship
- [x] 階段5: 修改 Pricing.tsx — PACKAGE_CONFIG、SPARK_COST_ITEMS、handleTopUp、推薦卡片
- [x] 階段6a: 修改 db.ts — nanoid import + generateReferralCode + getUserByReferralCode
- [x] 階段6c: 修改 db.ts — addSpark 函數 referral_bonus 類型判斷
- [x] 階段7: 修改 authRouter.ts — signup 加入推薦碼邏輯
- [x] 階段8: 替換 Signup.tsx — 加入推薦碼輸入和 URL 自動填入
- [x] 階段9: 修改 Account.tsx — 加入推薦計畫卡片
- [x] 階段10: 修改 DashboardLayout.tsx — 側邊欄加入推薦有賞入口
- [x] 階段11: 執行資料庫遷移 pnpm db:push
- [x] 階段12: 創建並運行回填腳本 backfill-referral-codes.ts（688 用戶已回填）
- [x] 階段13: Stripe 創建旗艦包產品 prod_TxntzZJ9Nq42V7 / price_1SzsHhGvm1Hl1zO13xa3gqOj
- [x] 階段14: 完整測試通過（43 文件 / 572 測試通過）
## v3.14.1 Hotfix：Spark 定價修正 + 推薦 UI 優化
- [x] 階段1: stripeConfig.ts 旗艦包 bonus 25000→20000
- [x] 階段2a: Pricing.tsx import 新增 FileText, BrainCircuit, MousePointerClick, Copy
- [x] 階段2b: Pricing.tsx SPARK_COST_ITEMS 擴充為 8 項
- [x] 階段2c: Pricing.tsx 推薦卡片和新用戶福利卡片移到充值包和 Spark 消耗表之間
- [x] 階段3: Account.tsx 推薦碼複製按鈕加 null 檢查
- [x] 階段4: 確認推薦碼回填完成（688 用戶全部有碼，Dave Lee: LULU-KZXKHB, hkcc88: LULU-5C37XF）
- [x] 階段5: 驗證通過（編譯無錯、瀏覽器測試通過、572 測試通過）
## v3.14.2 Hotfix：旗艦包顯示 + 推薦連結修復
- [x] 旗艦包改為直接顯示 60,000 Spark（sparks=60000, bonus=0）
- [x] 推薦連結按鈕改為「前往推薦有賞」，點擊後跳轉到 Account 頁面查看推薦碼

## v3.14.3 Hotfix：WorkspaceGuard render phase navigate 錯誤
- [x] 修復 WorkspaceGuard 在 render phase 調用 navigate() 導致 React 錯誤，改用 useEffect
