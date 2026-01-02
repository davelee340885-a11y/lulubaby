# Lulubaby 平台完整技術藍圖

> **文檔用途**：此文檔是 Lulubaby 平台的完整技術藍圖，包含所有技術細節、設計規範、品牌識別、數據庫結構、API設計和業務邏輯。無論在任何情況下（包括代碼丟失、平台故障或遷移），都可以根據此文檔完整重建整個平台。
>
> **版本**：af66bf4b  
> **最後更新**：2026年1月2日  
> **作者**：Manus AI

---

## 第一部分：品牌識別與設計規範

### 1.1 品牌定義

**項目名稱**：Lulubaby（技術代號：ai_agent_ui）

**名稱含義**：
- **Lu** = Lucy（電影《Lucy》中開發大腦100%的超能力角色）
- **Baby** = 可愛的超能力寶貝，成為每一個人的AI助手
- 發音易記好聽，傳達親切友善的品牌形象

**核心價值主張**：讓用戶（中小企業主、個人創業者）能夠快速創建專屬的AI客服助手，無需編程知識即可訓練AI回答客戶問題、提供產品資訊、處理常見諮詢。

**目標用戶群體**：

| 用戶類型 | 使用場景 | 核心需求 |
|---------|---------|---------|
| 中小企業主 | 電商客服、服務業諮詢 | 24小時自動回覆客戶問題 |
| 個人創業者 | 產品推廣、客戶支援 | 低成本建立專業客服形象 |
| 保險/金融銷售 | 產品介紹、客戶跟進 | 個性化銷售話術、客戶記憶 |
| 需要24小時客服的企業 | 跨時區服務、非工作時間支援 | 不間斷服務、降低人力成本 |

### 1.2 Logo 設計規範

**Logo 概念**：眨眼對話氣泡 + 微笑表情

Logo 設計融合了三個核心元素：
1. **對話氣泡**：代表AI對話、溝通、客服功能
2. **眨眼表情**：傳達友善、俏皮、親切的品牌個性
3. **微笑弧線**：表達正面、樂於助人的態度

**Logo 視覺規格**：

| 屬性 | 規格 |
|-----|------|
| 風格 | 空心線條（Outline Style） |
| 主色 | Teal (#14B8A6) |
| 線條粗細 | 中等粗度，確保小尺寸可辨識 |
| 左眼 | 實心圓點 |
| 右眼 | 眨眼弧線 |
| 嘴巴 | 微笑弧線 |
| 尖角 | 對話氣泡指示尖角（右下方） |

**Logo 文件規格**：

| 文件名 | 尺寸 | 用途 |
|-------|------|------|
| logo.png | 256×256 px | 網站導航列、一般顯示 |
| favicon.ico | 16-256 px（多尺寸） | 瀏覽器標籤頁圖標 |
| logo-192.png | 192×192 px | PWA 圖標 |
| logo-512.png | 512×512 px | PWA 啟動畫面 |
| apple-touch-icon.png | 180×180 px | iOS 主屏幕圖標 |

**Logo 使用指南**：
- 最小顯示尺寸：24×24 px
- 周圍需保留至少 Logo 寬度 25% 的留白空間
- 深色背景使用時保持原色（Teal 在深色背景上對比度足夠）
- 禁止拉伸、旋轉或改變顏色

### 1.3 配色方案

**主色調**：Teal（青綠色）

| 色彩角色 | 色碼 | OKLCH | 用途 |
|---------|------|-------|------|
| **品牌主色** | #14B8A6 | oklch(0.7 0.15 180) | Logo、品牌識別、重要按鈕 |
| **主要色** | Blue-700 | var(--color-blue-700) | 主要按鈕、連結、強調元素 |
| **成功色** | #10B981 | - | 成功狀態、客戶前端類別 |
| **紫色** | #8B5CF6 | - | AI大腦類別 |
| **青色** | #06B6D4 | - | 開發者類別 |
| **橙色** | #F59E0B | - | 設定類別 |
| **錯誤色** | #EF4444 | - | 錯誤狀態、刪除操作 |

**導航類別配色**：

| 類別 | 主色 | 用途 |
|-----|------|------|
| 儀表板 | #3B82F6（藍色） | 數據統計、概覽 |
| 客戶前端 | #10B981（綠色） | 版面設定、客戶記憶、專屬網址 |
| AI 大腦 | #8B5CF6（紫色） | 訓練智能體、超能力、知識庫 |
| 開發者 | #06B6D4（青色） | Widget嵌入、API文檔 |
| 設定 | #F59E0B（橙色） | 團隊管理、帳戶、會員計劃 |

**淺色主題 CSS 變數**：

```css
:root {
  --background: oklch(1 0 0);                    /* 純白背景 */
  --foreground: oklch(0.235 0.015 65);           /* 深灰文字 */
  --card: oklch(1 0 0);                          /* 卡片背景 */
  --card-foreground: oklch(0.235 0.015 65);      /* 卡片文字 */
  --primary: var(--color-blue-700);              /* 主要色 */
  --primary-foreground: var(--color-blue-50);    /* 主要色上的文字 */
  --secondary: oklch(0.98 0.001 286.375);        /* 次要背景 */
  --muted: oklch(0.967 0.001 286.375);           /* 柔和背景 */
  --muted-foreground: oklch(0.552 0.016 285.938);/* 柔和文字 */
  --border: oklch(0.92 0.004 286.32);            /* 邊框色 */
  --radius: 0.65rem;                             /* 圓角半徑 */
}
```

**深色主題 CSS 變數**：

```css
.dark {
  --background: oklch(0.141 0.005 285.823);      /* 深色背景 */
  --foreground: oklch(0.85 0.005 65);            /* 淺色文字 */
  --card: oklch(0.21 0.006 285.885);             /* 卡片背景 */
  --card-foreground: oklch(0.85 0.005 65);       /* 卡片文字 */
  --border: oklch(1 0 0 / 10%);                  /* 半透明邊框 */
}
```

### 1.4 字體規範

**主要字體**：系統默認字體堆疊

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

**字體大小層級**：

| 層級 | 大小 | 用途 |
|-----|------|------|
| 標題 H1 | 2rem (32px) | 頁面主標題 |
| 標題 H2 | 1.5rem (24px) | 區塊標題 |
| 標題 H3 | 1.25rem (20px) | 子區塊標題 |
| 正文 | 1rem (16px) | 一般內容 |
| 小字 | 0.875rem (14px) | 輔助說明、標籤 |
| 極小 | 0.75rem (12px) | 時間戳、版權聲明 |

### 1.5 間距與圓角

**間距系統**（基於 4px 網格）：

| 名稱 | 數值 | 用途 |
|-----|------|------|
| xs | 4px | 緊密間距 |
| sm | 8px | 小間距 |
| md | 16px | 標準間距 |
| lg | 24px | 大間距 |
| xl | 32px | 區塊間距 |
| 2xl | 48px | 頁面間距 |

**圓角系統**：

| 名稱 | 數值 | 用途 |
|-----|------|------|
| --radius-sm | 0.45rem | 小按鈕、標籤 |
| --radius-md | 0.55rem | 輸入框、小卡片 |
| --radius-lg | 0.65rem | 卡片、對話框 |
| --radius-xl | 0.85rem | 大卡片、模態框 |

---

## 第二部分：技術架構

### 2.1 技術棧總覽

| 層級 | 技術 | 版本 | 用途 |
|-----|------|------|------|
| **前端框架** | React | 19 | UI 渲染和組件化 |
| **樣式系統** | Tailwind CSS | 4 | 原子化 CSS 樣式 |
| **UI 組件庫** | shadcn/ui | 最新 | 預製 UI 組件 |
| **路由** | wouter | - | 輕量級客戶端路由 |
| **狀態管理** | tRPC + React Query | 11 | 類型安全的數據獲取和緩存 |
| **後端框架** | Express | 4 | HTTP 服務器 |
| **API 層** | tRPC | 11 | 端到端類型安全 API |
| **數據庫** | MySQL / TiDB | - | 關係型數據持久化 |
| **ORM** | Drizzle ORM | - | 類型安全數據庫操作 |
| **認證** | Manus OAuth | - | 用戶身份認證 |
| **文件存儲** | S3 | - | 文件和圖片存儲 |
| **AI 服務** | Manus LLM API | gpt-4o-mini | AI 對話生成 |
| **測試框架** | Vitest | - | 單元測試 |

### 2.2 項目目錄結構

```
/home/ubuntu/ai_agent_ui/
├── client/                              # 前端代碼
│   ├── index.html                       # HTML 入口
│   ├── public/                          # 靜態資源
│   │   ├── logo.png                     # 主 Logo
│   │   ├── favicon.ico                  # 網站圖標
│   │   ├── logo-192.png                 # PWA 圖標
│   │   ├── logo-512.png                 # PWA 大圖標
│   │   └── apple-touch-icon.png         # iOS 圖標
│   └── src/
│       ├── App.tsx                      # 路由配置
│       ├── main.tsx                     # 應用入口
│       ├── index.css                    # 全局樣式（配色方案）
│       ├── pages/                       # 頁面組件
│       │   ├── Dashboard.tsx            # 儀表板
│       │   ├── Appearance.tsx           # 版面設定
│       │   ├── Training.tsx             # 訓練智能體
│       │   ├── Superpowers.tsx          # 開發超能力
│       │   ├── Knowledge.tsx            # 知識庫
│       │   ├── Customers.tsx            # 客戶記憶
│       │   ├── Widget.tsx               # Widget 嵌入
│       │   ├── Domain.tsx               # 專屬網址
│       │   ├── Team.tsx                 # 團隊管理
│       │   ├── Chat.tsx                 # 公開對話頁
│       │   ├── Pricing.tsx              # 會員計劃
│       │   └── Account.tsx              # 帳戶設定
│       ├── components/                  # 可重用組件
│       │   ├── DashboardLayout.tsx      # 側邊欄佈局
│       │   ├── AIChatBox.tsx            # 聊天組件
│       │   └── ui/                      # shadcn/ui 組件
│       ├── lib/
│       │   ├── trpc.ts                  # tRPC 客戶端
│       │   └── utils.ts                 # 工具函數
│       ├── hooks/                       # 自定義 Hooks
│       └── contexts/                    # React Context
├── server/                              # 後端代碼
│   ├── routers.ts                       # tRPC 路由定義
│   ├── db.ts                            # 數據庫操作函數
│   ├── storage.ts                       # S3 存儲操作
│   ├── knowledgeSourceService.ts        # 知識來源處理
│   ├── _core/                           # 核心模組
│   │   ├── llm.ts                       # LLM 調用封裝
│   │   ├── oauth.ts                     # OAuth 認證
│   │   ├── context.ts                   # tRPC 上下文
│   │   ├── env.ts                       # 環境變數
│   │   └── notification.ts              # 通知服務
│   └── *.test.ts                        # Vitest 測試文件
├── drizzle/                             # 數據庫 Schema
│   └── schema.ts                        # 表結構定義
├── shared/                              # 共享類型
│   └── types.ts                         # TypeScript 類型定義
├── package.json                         # 依賴配置
├── todo.md                              # 開發任務追蹤
├── PROJECT_SUMMARY.md                   # 項目摘要
└── LULUBABY_TECHNICAL_BLUEPRINT.md      # 本文檔
```

### 2.3 環境變數配置

| 變數名 | 用途 | 來源 |
|-------|------|------|
| DATABASE_URL | MySQL/TiDB 連接字符串 | 系統注入 |
| JWT_SECRET | Session Cookie 簽名密鑰 | 系統注入 |
| VITE_APP_ID | Manus OAuth 應用 ID | 系統注入 |
| OAUTH_SERVER_URL | OAuth 後端 URL | 系統注入 |
| VITE_OAUTH_PORTAL_URL | OAuth 登入頁面 URL | 系統注入 |
| BUILT_IN_FORGE_API_URL | LLM API URL | 系統注入 |
| BUILT_IN_FORGE_API_KEY | LLM API 密鑰（後端） | 系統注入 |
| VITE_FRONTEND_FORGE_API_KEY | LLM API 密鑰（前端） | 系統注入 |
| OWNER_OPEN_ID | 項目擁有者 ID | 系統注入 |
| OWNER_NAME | 項目擁有者名稱 | 系統注入 |

---

## 第三部分：數據庫設計

### 3.1 數據表總覽

平台共有 **13 個數據表**，分為四大類別：

**用戶與認證**：
- users（用戶基本資料）

**AI 智能體配置**：
- ai_personas（AI 人設）
- ai_training（訓練設定，48項評分）
- superpowers（超能力設定，17項開關）
- knowledge_bases（知識庫）
- quick_buttons（快捷按鈕）

**客戶關係管理**：
- customers（客戶資料）
- customer_memories（客戶記憶）
- customer_conversation_summaries（對話摘要）
- conversations（對話記錄）

**團隊協作**：
- teams（團隊）
- team_members（團隊成員）
- team_knowledge（團隊知識庫）

### 3.2 核心表結構詳解

#### 3.2.1 users - 用戶表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,    -- Manus OAuth 唯一標識
  name TEXT,                              -- 用戶名稱
  email VARCHAR(320),                     -- 電子郵件
  loginMethod VARCHAR(64),                -- 登入方式
  role ENUM('user', 'admin') DEFAULT 'user',  -- 角色
  createdAt TIMESTAMP DEFAULT NOW(),      -- 創建時間
  updatedAt TIMESTAMP,                    -- 更新時間
  lastSignedIn TIMESTAMP                  -- 最後登入時間
);
```

#### 3.2.2 ai_personas - AI 人設表

```sql
CREATE TABLE ai_personas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT UNIQUE NOT NULL,             -- 關聯用戶（一對一）
  agentName VARCHAR(100),                 -- AI 助手名稱
  avatarUrl VARCHAR(512),                 -- 頭像 URL
  welcomeMessage TEXT,                    -- 歡迎語
  systemPrompt TEXT,                      -- System Prompt
  primaryColor VARCHAR(20),               -- 主題顏色 (#hex)
  layoutStyle ENUM('minimal','professional','custom'),  -- 版面風格
  backgroundImageUrl VARCHAR(512),        -- 背景圖片 URL
  profilePhotoUrl VARCHAR(512),           -- 個人照片 URL
  tagline VARCHAR(255),                   -- 標語
  suggestedQuestions TEXT,                -- 建議問題 (JSON 數組)
  showQuickButtons BOOLEAN DEFAULT true,  -- 是否顯示快捷按鈕
  chatPlaceholder VARCHAR(255),           -- 輸入框提示文字
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### 3.2.3 ai_training - 訓練設定表

此表包含 **8 大維度 × 6 項 = 48 項評分**（每項 1-5 分）：

**維度一：💬 說話風格**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| humorLevel | 幽默程度 | 1-5 |
| friendlinessLevel | 友善程度 | 1-5 |
| formalityLevel | 正式程度 | 1-5 |
| enthusiasmLevel | 熱情程度 | 1-5 |
| patienceLevel | 耐心程度 | 1-5 |
| empathyLevel | 同理心程度 | 1-5 |

**維度二：📝 回應方式**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| responseLength | 回應長度 | 1-5 |
| responseDepth | 回應深度 | 1-5 |
| exampleUsage | 舉例頻率 | 1-5 |
| dataUsage | 數據引用 | 1-5 |
| metaphorUsage | 比喻使用 | 1-5 |
| structuredResponse | 結構化回應 | 1-5 |

**維度三：🤝 溝通態度**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| proactiveness | 主動程度 | 1-5 |
| questioningStyle | 提問風格 | 1-5 |
| suggestionFrequency | 建議頻率 | 1-5 |
| humilityLevel | 謙遜程度 | 1-5 |
| persistenceLevel | 堅持程度 | 1-5 |
| careLevel | 關懷程度 | 1-5 |

**維度四：💼 銷售風格**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| pushIntensity | 推銷強度 | 1-5 |
| urgencyCreation | 緊迫感營造 | 1-5 |
| priceSensitivity | 價格敏感度 | 1-5 |
| comparisonUsage | 比較使用 | 1-5 |
| closingIntensity | 成交強度 | 1-5 |
| followUpFrequency | 跟進頻率 | 1-5 |

**維度五：🎓 專業表現**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| terminologyUsage | 術語使用 | 1-5 |
| regulationAwareness | 法規意識 | 1-5 |
| riskWarningLevel | 風險警示 | 1-5 |
| caseStudyUsage | 案例引用 | 1-5 |
| marketAnalysis | 市場分析 | 1-5 |
| educationalContent | 教育內容 | 1-5 |

**維度六：😊 情緒處理**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| soothingAbility | 安撫能力 | 1-5 |
| praiseFrequency | 讚美頻率 | 1-5 |
| encouragementLevel | 鼓勵程度 | 1-5 |
| negativeHandling | 負面處理 | 1-5 |
| optimismLevel | 樂觀程度 | 1-5 |
| humorInTension | 緊張時幽默 | 1-5 |

**維度七：🗣️ 語言習慣**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| emojiUsage | 表情符號使用 | 1-5 |
| colloquialLevel | 口語化程度 | 1-5 |
| cantoneseUsage | 廣東話使用 | 1-5 |
| englishMixing | 中英夾雜 | 1-5 |
| exclamationUsage | 感嘆詞使用 | 1-5 |
| addressingStyle | 稱呼風格 | 1-5 |

**維度八：⚠️ 服務邊界**
| 欄位 | 說明 | 範圍 |
|-----|------|------|
| topicRange | 話題範圍 | 1-5 |
| privacyAwareness | 隱私意識 | 1-5 |
| promiseCaution | 承諾謹慎 | 1-5 |
| referralWillingness | 轉介意願 | 1-5 |
| uncertaintyHandling | 不確定處理 | 1-5 |
| complaintHandling | 投訴處理 | 1-5 |

**自訂指令欄位**：
| 欄位 | 說明 |
|-----|------|
| behaviorInstructions | 行為指令（自由文字） |
| prohibitedActions | 禁止行為（自由文字） |
| customGreeting | 自訂問候語 |
| customClosing | 自訂結尾語 |
| customPhrases | 自訂常用語 |

#### 3.2.4 superpowers - 超能力設定表

此表包含 **5 大類別 × 3-4 項 = 17 項 Boolean 開關**：

| 類別 | 欄位 | 說明 |
|-----|------|------|
| 🧠 超級大腦 | instantResearch | 即時研究 |
| | globalComparison | 全球比較 |
| | legalInterpretation | 法律解讀 |
| | caseSearch | 案例搜索 |
| ⏰ 時間掌控 | cloneAbility | 分身能力 |
| | perfectMemory | 完美記憶 |
| | alwaysOnline | 永遠在線 |
| | instantReply | 即時回覆 |
| 🔮 預知未來 | needsPrediction | 需求預測 |
| | riskWarning | 風險預警 |
| | bestTiming | 最佳時機 |
| 🌍 全球視野 | marketRadar | 市場雷達 |
| | multiLanguage | 多語言 |
| | globalInfo | 全球資訊 |
| 💬 讀心術 | emotionSense | 情緒感知 |
| | persuasionMaster | 說服大師 |
| | styleAdaptation | 風格適應 |

#### 3.2.5 knowledge_bases - 知識庫表

```sql
CREATE TABLE knowledge_bases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,                    -- 所屬用戶
  fileName VARCHAR(255),                  -- 文件名稱
  fileUrl VARCHAR(512),                   -- S3 URL（文件類型）
  fileKey VARCHAR(512),                   -- S3 Key
  fileSize INT,                           -- 文件大小（bytes）
  mimeType VARCHAR(100),                  -- MIME 類型
  content TEXT,                           -- 提取的文本內容
  status ENUM('processing','ready','error'),  -- 處理狀態
  category VARCHAR(50),                   -- 分類標籤
  sourceType ENUM('file','youtube','webpage','text','faq'),  -- 來源類型
  sourceUrl VARCHAR(1024),                -- 來源 URL
  sourceMeta TEXT,                        -- 來源元數據 (JSON)
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**支援的知識來源類型**：

| 類型 | 說明 | 處理方式 |
|-----|------|---------|
| file | 文件上傳 | 上傳到 S3，提取文本內容 |
| youtube | YouTube 影片 | 獲取字幕文本 |
| webpage | 網頁內容 | 爬取並解析 HTML |
| text | 直接文字 | 直接存儲 |
| faq | FAQ 問答對 | 解析 JSON 格式問答 |

#### 3.2.6 customers - 客戶表

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,                    -- 所屬用戶（AI 擁有者）
  sessionId VARCHAR(64),                  -- 會話 ID
  deviceFingerprint VARCHAR(128),         -- 設備指紋
  name VARCHAR(100),                      -- 客戶名稱
  email VARCHAR(320),                     -- 電子郵件
  phone VARCHAR(50),                      -- 電話
  company VARCHAR(200),                   -- 公司名稱
  notes TEXT,                             -- 備註
  tags TEXT,                              -- 標籤 (JSON 數組)
  sentiment ENUM('positive','neutral','negative'),  -- 情緒標籤
  totalConversations INT DEFAULT 0,       -- 總對話數
  totalMessages INT DEFAULT 0,            -- 總訊息數
  firstSeenAt TIMESTAMP DEFAULT NOW(),    -- 首次出現時間
  lastSeenAt TIMESTAMP,                   -- 最後出現時間
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### 3.2.7 customer_memories - 客戶記憶表

```sql
CREATE TABLE customer_memories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT NOT NULL,                -- 關聯客戶
  memoryType ENUM('preference','need','concern','fact','behavior'),  -- 記憶類型
  content TEXT NOT NULL,                  -- 記憶內容
  confidence DECIMAL(3,2),                -- 置信度 (0.00-1.00)
  source ENUM('conversation','manual','system'),  -- 來源
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (customerId) REFERENCES customers(id)
);
```

**記憶類型說明**：

| 類型 | 說明 | 範例 |
|-----|------|------|
| preference | 偏好 | 喜歡簡潔的回答 |
| need | 需求 | 正在尋找保險產品 |
| concern | 顧慮 | 擔心價格太高 |
| fact | 事實 | 已婚，有兩個孩子 |
| behavior | 行為 | 經常在晚上詢問 |

#### 3.2.8 customer_conversation_summaries - 對話摘要表

```sql
CREATE TABLE customer_conversation_summaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT NOT NULL,                -- 關聯客戶
  sessionId VARCHAR(64),                  -- 會話 ID
  summary TEXT,                           -- 對話摘要
  topics TEXT,                            -- 關鍵話題 (JSON 數組)
  customerQuestions TEXT,                 -- 客戶提問 (JSON 數組)
  outcome ENUM('resolved','converted','followup','abandoned'),  -- 對話結果
  sentiment ENUM('positive','neutral','negative'),  -- 情緒
  messageCount INT,                       -- 訊息數量
  duration INT,                           -- 對話時長（秒）
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (customerId) REFERENCES customers(id)
);
```

#### 3.2.9 teams - 團隊表

```sql
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,             -- 團隊名稱
  description TEXT,                       -- 團隊描述
  ownerId INT NOT NULL,                   -- 團隊擁有者
  plan ENUM('basic','pro','enterprise'),  -- 訂閱計劃
  maxMembers INT DEFAULT 5,               -- 最大成員數
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id)
);
```

#### 3.2.10 team_members - 團隊成員表

```sql
CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teamId INT NOT NULL,                    -- 關聯團隊
  userId INT NOT NULL,                    -- 關聯用戶
  role ENUM('owner','admin','member'),    -- 成員角色
  knowledgeAccess ENUM('full','partial','none'),  -- 知識庫存取權限
  joinedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (teamId) REFERENCES teams(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## 第四部分：API 路由設計

### 4.1 tRPC 路由結構

所有 API 通過 tRPC 定義，統一路徑為 `/api/trpc/*`：

```typescript
appRouter = {
  // 系統
  system: {
    notifyOwner: protectedProcedure,      // 通知項目擁有者
  },
  
  // 認證
  auth: {
    me: publicProcedure,                  // 獲取當前用戶資訊
    logout: publicProcedure,              // 登出
  },
  
  // AI 人設
  persona: {
    get: protectedProcedure,              // 獲取 AI 人設
    upsert: protectedProcedure,           // 創建/更新 AI 人設
    getPublic: publicProcedure,           // 公開獲取（用於 Chat 頁）
  },
  
  // 知識庫
  knowledge: {
    list: protectedProcedure,             // 列出知識庫項目
    upload: protectedProcedure,           // 上傳文件
    addFromSource: protectedProcedure,    // 從來源添加
    delete: protectedProcedure,           // 刪除知識
    getContent: protectedProcedure,       // 獲取內容
  },
  
  // 訓練設定
  training: {
    get: protectedProcedure,              // 獲取訓練設定
    upsert: protectedProcedure,           // 更新訓練設定
    applyTemplate: protectedProcedure,    // 套用模板
  },
  
  // 超能力
  superpowers: {
    get: protectedProcedure,              // 獲取超能力設定
    upsert: protectedProcedure,           // 更新超能力設定
  },
  
  // 對話
  chat: {
    send: publicProcedure,                // 發送訊息（公開）
    getHistory: publicProcedure,          // 獲取對話歷史
    endConversation: publicProcedure,     // 結束對話（生成摘要）
  },
  
  // 統計分析
  analytics: {
    getStats: protectedProcedure,         // 獲取統計數據
    getTrends: protectedProcedure,        // 獲取趨勢數據
    getTopQuestions: protectedProcedure,  // 獲取熱門問題
    getRecentConversations: protectedProcedure,  // 獲取最近對話
  },
  
  // 客戶管理
  customer: {
    list: protectedProcedure,             // 列出客戶
    get: protectedProcedure,              // 獲取客戶詳情
    update: protectedProcedure,           // 更新客戶資料
    delete: protectedProcedure,           // 刪除客戶
    addMemory: protectedProcedure,        // 添加記憶
    getMemories: protectedProcedure,      // 獲取記憶
    getSummaries: protectedProcedure,     // 獲取對話摘要
  },
  
  // 團隊管理
  team: {
    get: protectedProcedure,              // 獲取團隊資訊
    create: protectedProcedure,           // 創建團隊
    update: protectedProcedure,           // 更新團隊
    delete: protectedProcedure,           // 刪除團隊
    invite: protectedProcedure,           // 邀請成員
    removeMember: protectedProcedure,     // 移除成員
    updateMemberRole: protectedProcedure, // 更新成員角色
  },
  
  // 快捷按鈕
  quickButtons: {
    list: protectedProcedure,             // 列出快捷按鈕
    upsert: protectedProcedure,           // 創建/更新按鈕
    delete: protectedProcedure,           // 刪除按鈕
    reorder: protectedProcedure,          // 重新排序
  },
};
```

### 4.2 核心 API 詳解

#### 4.2.1 chat.send - 發送對話訊息

**輸入參數**：
```typescript
{
  userId: number,           // AI 擁有者 ID
  sessionId: string,        // 會話 ID
  message: string,          // 用戶訊息
  deviceFingerprint?: string  // 設備指紋（可選）
}
```

**處理流程**：
1. 獲取 AI 人設（persona）
2. 獲取訓練設定（training）
3. 獲取超能力設定（superpowers）
4. 獲取知識庫內容
5. 識別或創建客戶記錄
6. 獲取客戶記憶
7. 構建 System Prompt
8. 調用 LLM API
9. 保存對話記錄
10. 返回 AI 回覆

#### 4.2.2 chat.endConversation - 結束對話

**輸入參數**：
```typescript
{
  userId: number,           // AI 擁有者 ID
  sessionId: string,        // 會話 ID
}
```

**處理流程**：
1. 獲取對話歷史
2. 調用 LLM 分析對話內容
3. 提取：對話摘要、關鍵話題、客戶提問、對話結果
4. 提取客戶資料（姓名、電郵、電話、公司）
5. 提取客戶記憶（偏好、需求、顧慮等）
6. 偵測客戶情緒
7. 保存對話摘要
8. 更新客戶資料
9. 保存客戶記憶

---

## 第五部分：業務邏輯

### 5.1 AI 對話流程

```
用戶發送訊息
    ↓
chat.send API 接收
    ↓
構建 System Prompt：
├── 基礎人設（名稱、歡迎語、自訂 Prompt）
├── 訓練設定（48項評分轉換為指令）
├── 超能力設定（17項開關轉換為能力描述）
├── 知識庫內容（所有 ready 狀態的知識）
└── 客戶記憶（該客戶的歷史記憶）
    ↓
調用 LLM API（gpt-4o-mini）
    ↓
保存對話記錄到 conversations 表
    ↓
返回 AI 回覆給用戶
```

### 5.2 對話摘要生成流程

```
觸發條件（三種）：
├── 用戶關閉頁面（beforeunload）
├── 用戶切換標籤頁（visibilitychange）
└── 5 分鐘無活動
    ↓
chat.endConversation API 接收
    ↓
獲取對話歷史
    ↓
調用 LLM 分析，提取：
├── summary: 對話摘要
├── topics: 關鍵話題 (JSON 數組)
├── customerQuestions: 客戶提問 (JSON 數組)
├── outcome: 對話結果 (resolved/converted/followup/abandoned)
├── sentiment: 情緒 (positive/neutral/negative)
├── extractedInfo: {
│     name, email, phone, company
│   }
└── memories: [{
      type, content, confidence
    }]
    ↓
保存對話摘要到 customer_conversation_summaries
    ↓
更新客戶資料（如有新資訊）
    ↓
保存客戶記憶到 customer_memories
    ↓
更新客戶情緒標籤
```

### 5.3 訓練設定轉換邏輯

訓練設定的 48 項評分會轉換為 System Prompt 中的行為指令：

```typescript
function buildTrainingPrompt(training: Training): string {
  const instructions: string[] = [];
  
  // 說話風格
  if (training.humorLevel >= 4) {
    instructions.push("適當使用幽默，讓對話輕鬆愉快");
  }
  if (training.friendlinessLevel >= 4) {
    instructions.push("保持友善親切的態度");
  }
  if (training.formalityLevel >= 4) {
    instructions.push("使用正式專業的語言");
  } else if (training.formalityLevel <= 2) {
    instructions.push("使用輕鬆隨意的語言");
  }
  
  // 回應方式
  if (training.responseLength >= 4) {
    instructions.push("提供詳細完整的回答");
  } else if (training.responseLength <= 2) {
    instructions.push("回答簡潔扼要");
  }
  
  // 語言習慣
  if (training.emojiUsage >= 4) {
    instructions.push("適當使用表情符號增加親切感");
  }
  if (training.cantoneseUsage >= 4) {
    instructions.push("可以使用廣東話口語表達");
  }
  
  // 自訂指令
  if (training.behaviorInstructions) {
    instructions.push(training.behaviorInstructions);
  }
  if (training.prohibitedActions) {
    instructions.push(`禁止行為：${training.prohibitedActions}`);
  }
  
  return instructions.join('\n');
}
```

### 5.4 知識庫處理流程

```
用戶添加知識 (knowledge.upload / knowledge.addFromSource)
    ↓
根據來源類型處理：
    ↓
├── 文件上傳 (sourceType: 'file')
│   1. Base64 解碼文件內容
│   2. 上傳到 S3 (storagePut)
│   3. 提取文本內容（前 50k 字符）
│   4. 保存到 knowledge_bases
│
├── YouTube 影片 (sourceType: 'youtube')
│   1. 解析影片 ID
│   2. 調用 youtube-transcript 獲取字幕
│   3. 拼接字幕文本
│   4. 保存到 knowledge_bases
│
├── 網頁內容 (sourceType: 'webpage')
│   1. 使用 fetch 獲取 HTML
│   2. 使用 cheerio 解析
│   3. 提取主要文本內容
│   4. 保存到 knowledge_bases
│
├── 直接文字 (sourceType: 'text')
│   1. 直接保存 content
│   2. 保存到 knowledge_bases
│
└── FAQ 問答對 (sourceType: 'faq')
    1. 解析 JSON 格式的問答對
    2. 格式化為 Q&A 文本
    3. 保存到 knowledge_bases
    ↓
對話時使用：
    ↓
getKnowledgeContentByUserId 獲取所有 ready 狀態內容
    ↓
拼接到 System Prompt
```

---

## 第六部分：前端頁面結構

### 6.1 導航結構

```
儀表板（藍色 #3B82F6）
└── 儀表板 /                    # 統計卡片 + 趨勢圖 + 熱門問題

客戶前端（綠色 #10B981）
├── 版面設定 /appearance        # AI 設定 + 版面風格 + 快捷按鈕
├── 客戶記憶 /customers         # 客戶列表 + 詳情 + 記憶管理
└── 專屬網址 /domain            # 自訂域名設定

AI 大腦（紫色 #8B5CF6）
├── 訓練智能體 /training        # 8 維度 48 項評分 + 模板
├── 開發超能力 /superpowers     # 17 項超能力開關
└── 知識庫 /knowledge           # 5 種來源知識管理

開發者（青色 #06B6D4）
├── Widget 嵌入 /widget         # 嵌入代碼生成 + 預覽
└── API 文檔 /api-docs          # API 使用說明

設定（橙色 #F59E0B）
├── 團隊管理 /team              # 團隊資料 + 成員 + 知識庫
├── 帳戶設定 /account           # 個人資料
└── 會員計劃 /pricing           # 定價 + 訂閱
```

### 6.2 頁面功能詳解

| 頁面 | 路徑 | 主要功能 |
|-----|------|---------|
| 儀表板 | / | 4 個統計卡片、專屬連結、趨勢圖、熱門問題、最近對話 |
| 版面設定 | /appearance | AI 設定、版面風格、快捷按鈕、進階設定 |
| 訓練智能體 | /training | 6 個快速模板、8 維度評分滑桿、自訂指令 |
| 開發超能力 | /superpowers | 5 類別 17 項開關、能力對比、成就徽章 |
| 知識庫 | /knowledge | 5 種來源標籤、文件上傳、內容管理 |
| 客戶記憶 | /customers | 客戶列表、詳情側邊欄、記憶管理、摘要時間線 |
| Widget 嵌入 | /widget | 位置/大小設定、即時預覽、嵌入代碼 |
| 專屬網址 | /domain | 自訂域名設定 |
| 團隊管理 | /team | 團隊資料、成員管理、團隊知識庫 |
| 會員計劃 | /pricing | 個人/團隊計劃、定價表 |
| 公開對話 | /chat/:userId | 訪客對話介面 |

---

## 第七部分：會員計劃定價

### 7.1 個人計劃

| 計劃 | 月費 | 對話次數 | 知識庫 | 客戶記憶 |
|-----|------|---------|-------|---------|
| 免費版 | HK$0 | 250 次/月 | 3 個文件 | 10 位客戶 |
| 基本版 | HK$299 | 5,000 次/月 | 20 個文件 | 100 位客戶 |
| Premium | HK$599 | 50,000 次/月 | 無限 | 無限 |

### 7.2 團隊計劃

| 計劃 | 月費 | 對話次數 | 成員數 | 團隊知識庫 |
|-----|------|---------|-------|----------|
| 團隊基礎 | HK$299 | 10,000 次/月 | 5 人 | 100 MB |
| 團隊專業 | HK$599 | 30,000 次/月 | 15 人 | 500 MB |
| 企業版 | HK$1,299 | 100,000 次/月 | 50 人 | 2 GB |

---

## 第八部分：測試覆蓋

| 測試文件 | 測試內容 | 測試數量 |
|---------|---------|---------|
| auth.logout.test.ts | 登出功能 | 3 |
| persona.test.ts | AI 人設 CRUD | 8 |
| appearance.test.ts | 版面設定 | 6 |
| analytics.test.ts | 統計功能 | 5 |
| training.test.ts | 訓練設定 | 7 |
| superpowers.test.ts | 超能力設定 | 5 |
| knowledge.test.ts | 知識庫管理 | 22 |
| team.test.ts | 團隊管理 | 26 |
| customer.test.ts | 客戶記憶 | 25 |
| conversationSummary.test.ts | 對話摘要 | 20 |

**總計**：127 項測試

---

## 第九部分：重建指南

### 9.1 從零開始重建步驟

如果需要在新環境中完全重建此平台，請按照以下步驟操作：

**步驟 1：環境準備**

```bash
# 確保安裝 Node.js 22+ 和 pnpm
node --version  # 應為 22.x
pnpm --version  # 應已安裝

# 創建項目目錄
mkdir ai_agent_ui && cd ai_agent_ui
```

**步驟 2：初始化項目**

使用 Manus webdev 模板初始化：
- 選擇 `web-db-user` 功能（包含數據庫、服務器、用戶認證）
- 項目名稱：ai_agent_ui

**步驟 3：數據庫設置**

1. 複製 `drizzle/schema.ts` 中的所有表定義
2. 運行 `pnpm db:push` 推送數據庫結構

**步驟 4：後端代碼**

1. 複製 `server/routers.ts` 中的所有 tRPC 路由
2. 複製 `server/db.ts` 中的數據庫操作函數
3. 複製 `server/knowledgeSourceService.ts` 知識來源服務

**步驟 5：前端代碼**

1. 複製 `client/src/index.css` 配色方案
2. 複製 `client/src/App.tsx` 路由配置
3. 複製 `client/src/components/DashboardLayout.tsx` 側邊欄
4. 複製所有 `client/src/pages/*.tsx` 頁面組件

**步驟 6：Logo 和資源**

1. 將 Logo 文件放入 `client/public/`
2. 更新 `client/index.html` 中的 favicon 設定

**步驟 7：測試驗證**

```bash
# 運行測試
pnpm test

# 啟動開發服務器
pnpm dev
```

### 9.2 關鍵配置清單

| 配置項 | 文件位置 | 說明 |
|-------|---------|------|
| 配色方案 | client/src/index.css | CSS 變數定義 |
| 路由配置 | client/src/App.tsx | 頁面路由映射 |
| 數據庫結構 | drizzle/schema.ts | 表結構定義 |
| API 路由 | server/routers.ts | tRPC 路由定義 |
| 數據庫操作 | server/db.ts | 查詢函數 |
| Logo | client/public/logo.png | 品牌標識 |
| Favicon | client/public/favicon.ico | 網站圖標 |

### 9.3 版本歷史

| 版本 ID | 日期 | 主要變更 |
|--------|------|---------|
| e98e87d8 | 2026-01-01 | 初始版本 |
| 1155af3 | 2026-01-02 | 定價調整、PROJECT_SUMMARY |
| 689e1da | 2026-01-02 | 開發者導航、完整技術文檔 |
| 8747e89 | 2026-01-02 | 改名 Lulubaby、Logo 設計 |
| af66bf4b | 2026-01-02 | Logo 應用、技術藍圖 |

---

## 第十部分：待實現功能

### 10.1 MVP 待完成

| 功能 | 優先級 | 說明 |
|-----|-------|------|
| Stripe 支付整合 | 高 | 訂閱付款功能 |
| 用量限制檢查 | 高 | 根據計劃限制對話次數 |
| widget.js 後端實現 | 高 | 嵌入式對話組件 |

### 10.2 第二階段功能

| 功能 | 說明 |
|-----|------|
| Premium 計劃開放 | 高級功能解鎖 |
| 進階數據分析 | 更詳細的統計報表 |
| 客戶標籤和分群 | 客戶分類管理 |
| 批量導入知識庫 | 批量上傳文件 |
| 對話導出功能 | 導出對話記錄 |

### 10.3 第三階段功能

| 功能 | 說明 |
|-----|------|
| 團隊計劃開放 | 多人協作功能 |
| API 存取 | 開發者 API |
| 自訂域名 | 綁定自有域名 |
| SSO 整合 | 企業單點登入 |
| 進階權限管理 | 細粒度權限控制 |

---

## 附錄 A：重要決策記錄

| 日期 | 決策 | 原因 |
|-----|------|------|
| 2026-01-02 | 基本版價格改為 HK$299 | 統一定價策略 |
| 2026-01-02 | Premium 價格從 HK$399 調整為 HK$599 | 提高利潤率 |
| 2026-01-02 | 企業版成員上限設為 50 人 | 控制成本風險 |
| 2026-01-02 | 移除 Email 客服支援 | 簡化 MVP 功能 |
| 2026-01-02 | 導航列分為五大類別 | 改善用戶體驗 |
| 2026-01-02 | 添加開發者類別 | 放置 Widget 和 API 文檔 |
| 2026-01-02 | 知識庫支援 5 種來源 | 提升知識獲取靈活性 |
| 2026-01-02 | 對話結束自動生成摘要 | 增強客戶記憶功能 |
| 2026-01-02 | 選定眨眼對話氣泡 Logo | 傳達友善、專業的品牌形象 |

---

## 附錄 B：給其他 AI 平台的審閱提示

如果您將此文檔提交給其他 AI 平台審閱或繼續開發，建議關注：

**架構問題**：
1. tRPC + Drizzle ORM 的技術選型是否適合此類 SaaS 應用？
2. 將 48 個訓練參數存為單獨欄位是否合理？是否應該用 JSON 欄位？
3. 知識庫直接存儲文本內容是否有更好方案（如向量搜索）？

**安全問題**：
4. `publicProcedure` 的 `chat.send` 是否有被濫用的風險？
5. System Prompt 注入攻擊如何防範？
6. Widget 跨域嵌入的安全考慮？

**性能問題**：
7. 每次對話都讀取全部知識庫內容，有什麼優化方案？
8. 對話歷史無限增長如何處理？
9. 48 項訓練參數如何高效轉換為 System Prompt？

---

> **文檔維護提示**：此文檔應在每次重大更新後更新，確保始終反映項目最新狀態。
>
> **版本**：af66bf4b  
> **最後更新**：2026年1月2日
