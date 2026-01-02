# AI 客服智能體平台 - 完整技術文檔

> **文檔用途**：此文檔記錄整個項目的功能規劃、技術架構、業務邏輯和開發進度。可上傳至任何AI平台以重現相同效果。
>
> **版本**：1155af38
> **最後更新**：2026年1月2日

---

## 一、項目概述

### 1.1 項目定位

**項目名稱**：AI 客服智能體平台（ai_agent_ui）

**核心價值**：讓用戶（中小企業主、個人創業者）能夠快速創建專屬的AI客服助手，無需編程知識即可訓練AI回答客戶問題、提供產品資訊、處理常見諮詢。

**目標用戶**：
- 中小企業主（電商、服務業）
- 個人創業者
- 保險/金融銷售人員
- 需要24小時客服的企業

### 1.2 核心功能模組

| 功能模組 | 價值描述 | 實現狀態 |
|---------|---------|---------|
| AI個性化設定 | 自訂AI助手名稱、頭像、歡迎語、System Prompt | ✅ 完成 |
| 訓練智能體 | 8大維度48項評分調整AI說話風格和行為 | ✅ UI+後端完成 |
| 開發超能力 | 17項超能力Toggle開關（如即時研究、情緒透視） | ✅ UI+後端完成 |
| 知識庫管理 | 5種來源：文件、YouTube、網頁、文字、FAQ | ✅ 完成 |
| 客戶記憶 | 識別回訪客戶、記住資料和對話歷史 | ✅ 完成 |
| 對話摘要 | 對話結束自動生成摘要並存入客戶記憶 | ✅ 完成 |
| 數據分析 | 對話統計、趨勢圖表、熱門問題 | ✅ 完成 |
| 團隊管理 | 團隊大腦、成員權限、知識分享控制 | ✅ 完成 |
| Widget嵌入 | 生成嵌入代碼部署AI到外部網站 | ✅ UI完成 |

---

## 二、技術架構

### 2.1 技術棧

| 層級 | 技術 | 版本 | 用途 |
|-----|------|------|------|
| **前端框架** | React | 19 | UI渲染 |
| **樣式** | Tailwind CSS | 4 | 樣式系統 |
| **UI組件** | shadcn/ui | 最新 | 組件庫 |
| **路由** | wouter | - | 客戶端路由 |
| **狀態管理** | tRPC + React Query | 11 | 數據獲取和緩存 |
| **後端框架** | Express | 4 | HTTP服務器 |
| **API層** | tRPC | 11 | 類型安全API |
| **數據庫** | MySQL/TiDB | - | 數據持久化 |
| **ORM** | Drizzle ORM | - | 數據庫操作 |
| **認證** | Manus OAuth | - | 用戶認證 |
| **存儲** | S3 | - | 文件存儲 |
| **LLM** | Manus內置LLM API | gpt-4o-mini | AI對話 |

### 2.2 項目目錄結構

```
/home/ubuntu/ai_agent_ui/
├── client/                          # 前端代碼
│   ├── src/
│   │   ├── App.tsx                  # 路由配置
│   │   ├── main.tsx                 # 應用入口
│   │   ├── index.css                # 全局樣式（Tailwind配置）
│   │   ├── pages/                   # 頁面組件
│   │   │   ├── Dashboard.tsx        # 儀表板（含數據分析）
│   │   │   ├── Appearance.tsx       # 版面設定+AI設定
│   │   │   ├── Training.tsx         # 訓練智能體（48項評分）
│   │   │   ├── Superpowers.tsx      # 開發超能力（17項開關）
│   │   │   ├── Knowledge.tsx        # 知識庫（5種來源）
│   │   │   ├── Customers.tsx        # 客戶記憶管理
│   │   │   ├── Widget.tsx           # Widget嵌入代碼
│   │   │   ├── Domain.tsx           # 專屬網址
│   │   │   ├── Team.tsx             # 團隊管理
│   │   │   ├── Chat.tsx             # 公開對話頁
│   │   │   ├── Pricing.tsx          # 會員計劃
│   │   │   └── Account.tsx          # 帳戶設定
│   │   ├── components/              # 可重用組件
│   │   │   ├── DashboardLayout.tsx  # 側邊欄佈局（5大類別導航）
│   │   │   ├── AIChatBox.tsx        # 聊天組件
│   │   │   └── ui/                  # shadcn/ui組件
│   │   ├── lib/
│   │   │   ├── trpc.ts              # tRPC客戶端配置
│   │   │   └── utils.ts             # 工具函數
│   │   └── hooks/                   # 自定義Hooks
│   └── public/                      # 靜態資源
├── server/                          # 後端代碼
│   ├── routers.ts                   # tRPC路由（所有API）
│   ├── db.ts                        # 數據庫操作函數
│   ├── storage.ts                   # S3存儲操作
│   ├── knowledgeSourceService.ts    # 知識來源處理服務
│   ├── _core/                       # 核心模組
│   │   ├── llm.ts                   # LLM調用封裝
│   │   ├── oauth.ts                 # OAuth認證
│   │   ├── context.ts               # tRPC上下文
│   │   └── env.ts                   # 環境變數
│   └── *.test.ts                    # Vitest測試文件
├── drizzle/                         # 數據庫Schema
│   └── schema.ts                    # 表結構定義
└── shared/                          # 共享類型
    └── types.ts
```

---

## 三、數據庫設計

### 3.1 數據表總覽

平台共有 **13個數據表**：

| 表名 | 用途 | 關聯 |
|-----|------|------|
| users | 用戶基本資料 | - |
| ai_personas | AI智能體設定 | users.id |
| ai_training | 訓練設定（48項評分） | users.id |
| superpowers | 超能力設定（17項開關） | users.id |
| knowledge_bases | 知識庫項目 | users.id |
| quick_buttons | 快捷按鈕 | users.id |
| conversations | 對話記錄 | ai_personas.id |
| customers | 客戶資料 | users.id |
| customer_memories | 客戶記憶 | customers.id |
| customer_conversation_summaries | 對話摘要 | customers.id |
| teams | 團隊 | users.id (owner) |
| team_members | 團隊成員 | teams.id, users.id |
| team_knowledge | 團隊知識庫 | teams.id |

### 3.2 核心表結構

#### 3.2.1 users - 用戶表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE,        -- Manus OAuth ID
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  lastSignedIn TIMESTAMP
);
```

#### 3.2.2 ai_personas - AI人設表

```sql
CREATE TABLE ai_personas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT UNIQUE,                -- 一個用戶一個AI人設
  agentName VARCHAR(100),           -- AI助手名稱
  avatarUrl VARCHAR(512),           -- 頭像URL
  welcomeMessage TEXT,              -- 歡迎語
  systemPrompt TEXT,                -- System Prompt
  primaryColor VARCHAR(20),         -- 主題顏色 (#hex)
  layoutStyle ENUM('minimal','professional','custom'),
  backgroundImageUrl VARCHAR(512),
  profilePhotoUrl VARCHAR(512),
  tagline VARCHAR(255),             -- 標語
  suggestedQuestions TEXT,          -- 建議問題(JSON數組)
  showQuickButtons BOOLEAN DEFAULT true,
  chatPlaceholder VARCHAR(255)      -- 輸入框提示文字
);
```

#### 3.2.3 ai_training - 訓練設定表（48項評分）

包含 **8大維度 × 6項 = 48項評分**（每項1-5分）：

| 維度 | 欄位（6項） |
|-----|---------|
| 💬 說話風格 | humorLevel, friendlinessLevel, formalityLevel, enthusiasmLevel, patienceLevel, empathyLevel |
| 📝 回應方式 | responseLength, responseDepth, exampleUsage, dataUsage, metaphorUsage, structuredResponse |
| 🤝 溝通態度 | proactiveness, questioningStyle, suggestionFrequency, humilityLevel, persistenceLevel, careLevel |
| 💼 銷售風格 | pushIntensity, urgencyCreation, priceSensitivity, comparisonUsage, closingIntensity, followUpFrequency |
| 🎓 專業表現 | terminologyUsage, regulationAwareness, riskWarningLevel, caseStudyUsage, marketAnalysis, educationalContent |
| 😊 情緒處理 | soothingAbility, praiseFrequency, encouragementLevel, negativeHandling, optimismLevel, humorInTension |
| 🗣️ 語言習慣 | emojiUsage, colloquialLevel, cantoneseUsage, englishMixing, exclamationUsage, addressingStyle |
| ⚠️ 服務邊界 | topicRange, privacyAwareness, promiseCaution, referralWillingness, uncertaintyHandling, complaintHandling |

另有5個自訂指令欄位：
- behaviorInstructions（行為指令）
- prohibitedActions（禁止行為）
- customGreeting（自訂問候）
- customClosing（自訂結尾）
- customPhrases（自訂用語）

#### 3.2.4 superpowers - 超能力設定表（17項開關）

包含 **5大類別 × 3-4項 = 17項Boolean開關**：

| 類別 | 欄位 |
|-----|------|
| 🧠 超級大腦 | instantResearch, globalComparison, legalInterpretation, caseSearch |
| ⏰ 時間掌控 | cloneAbility, perfectMemory, alwaysOnline, instantReply |
| 🔮 預知未來 | needsPrediction, riskWarning, bestTiming |
| 🌍 全球視野 | marketRadar, multiLanguage, globalInfo |
| 💬 讀心術 | emotionSense, persuasionMaster, styleAdaptation |

#### 3.2.5 knowledge_bases - 知識庫表

```sql
CREATE TABLE knowledge_bases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  fileName VARCHAR(255),
  fileUrl VARCHAR(512),             -- S3 URL（文件類型）
  fileKey VARCHAR(512),             -- S3 Key
  fileSize INT,
  mimeType VARCHAR(100),
  content TEXT,                     -- 提取的文本內容
  status ENUM('processing','ready','error'),
  category VARCHAR(50),             -- 分類
  sourceType ENUM('file','youtube','webpage','text','faq'),
  sourceUrl VARCHAR(1024),          -- 來源URL
  sourceMeta TEXT,                  -- 來源元數據(JSON)
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 3.2.6 customers - 客戶表

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,                       -- 所屬用戶
  sessionId VARCHAR(64),            -- 會話ID（識別客戶）
  deviceFingerprint VARCHAR(128),   -- 設備指紋
  name VARCHAR(100),
  email VARCHAR(320),
  phone VARCHAR(50),
  company VARCHAR(200),
  notes TEXT,
  tags TEXT,                        -- JSON數組
  sentiment ENUM('positive','neutral','negative'),
  totalConversations INT DEFAULT 0,
  totalMessages INT DEFAULT 0,
  firstSeenAt TIMESTAMP DEFAULT NOW(),
  lastSeenAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

#### 3.2.7 customer_memories - 客戶記憶表

```sql
CREATE TABLE customer_memories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT,
  memoryType ENUM('preference','need','concern','fact','behavior'),
  content TEXT,                     -- 記憶內容
  confidence DECIMAL(3,2),          -- 置信度 0-1
  source ENUM('conversation','manual','system'),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 3.2.8 customer_conversation_summaries - 對話摘要表

```sql
CREATE TABLE customer_conversation_summaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customerId INT,
  sessionId VARCHAR(64),
  summary TEXT,                     -- 對話摘要
  topics TEXT,                      -- 關鍵話題(JSON數組)
  customerQuestions TEXT,           -- 客戶提問(JSON數組)
  outcome ENUM('resolved','converted','followup','abandoned'),
  sentiment ENUM('positive','neutral','negative'),
  messageCount INT,
  duration INT,                     -- 對話時長(秒)
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 3.2.9 teams - 團隊表

```sql
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  description TEXT,
  ownerId INT,                      -- 團隊擁有者
  plan ENUM('basic','pro','enterprise'),
  maxMembers INT DEFAULT 5,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

#### 3.2.10 team_members - 團隊成員表

```sql
CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teamId INT,
  userId INT,
  role ENUM('owner','admin','member'),
  knowledgeAccess ENUM('full','partial','none'),
  joinedAt TIMESTAMP DEFAULT NOW()
);
```

---

## 四、API路由設計

### 4.1 tRPC路由結構

所有API通過tRPC定義，路徑為 `/api/trpc/*`：

```typescript
appRouter = {
  // 系統
  system: {
    notifyOwner: protectedProcedure,  // 通知擁有者
  },
  
  // 認證
  auth: {
    me: publicProcedure,              // 獲取當前用戶
    logout: publicProcedure,          // 登出
  },
  
  // AI人設
  persona: {
    get: protectedProcedure,          // 獲取AI人設
    upsert: protectedProcedure,       // 更新AI人設
    getPublic: publicProcedure,       // 公開獲取（用於Chat頁）
  },
  
  // 知識庫
  knowledge: {
    list: protectedProcedure,         // 列出知識庫
    upload: protectedProcedure,       // 上傳文件
    addFromSource: protectedProcedure,// 從來源添加（YouTube/網頁/文字/FAQ）
    delete: protectedProcedure,       // 刪除
  },
  
  // 快捷按鈕
  quickButtons: {
    list: protectedProcedure,
    create: protectedProcedure,
    update: protectedProcedure,
    delete: protectedProcedure,
  },
  
  // 對話
  chat: {
    send: publicProcedure,            // 發送訊息（調用LLM）
    history: publicProcedure,         // 獲取對話歷史
    endConversation: publicProcedure, // 結束對話（生成摘要）
  },
  
  // 訓練設定
  training: {
    get: protectedProcedure,
    update: protectedProcedure,
  },
  
  // 超能力
  superpowers: {
    get: protectedProcedure,
    update: protectedProcedure,
  },
  
  // 數據分析
  analytics: {
    stats: protectedProcedure,        // 統計數據
    dailyStats: protectedProcedure,   // 每日統計
    popularQuestions: protectedProcedure,
    recentConversations: protectedProcedure,
  },
  
  // 客戶管理
  customer: {
    list: protectedProcedure,         // 客戶列表
    get: protectedProcedure,          // 客戶詳情
    update: protectedProcedure,       // 更新客戶資料
    addMemory: protectedProcedure,    // 添加記憶
    getMemories: protectedProcedure,  // 獲取記憶
    getSummaries: protectedProcedure, // 獲取對話摘要
    stats: protectedProcedure,        // 客戶統計
  },
  
  // 團隊管理
  team: {
    get: protectedProcedure,          // 獲取團隊
    create: protectedProcedure,       // 創建團隊
    update: protectedProcedure,       // 更新團隊
    listMembers: protectedProcedure,  // 成員列表
    addMember: protectedProcedure,    // 添加成員
    updateMember: protectedProcedure, // 更新成員權限
    removeMember: protectedProcedure, // 移除成員
    listKnowledge: protectedProcedure,// 團隊知識庫
    addKnowledge: protectedProcedure, // 添加團隊知識
    stats: protectedProcedure,        // 團隊統計
  },
}
```

### 4.2 認證機制

| 類型 | 說明 | 使用場景 |
|-----|------|---------|
| publicProcedure | 無需登入即可訪問 | chat.send, persona.getPublic |
| protectedProcedure | 需要登入，ctx.user可用 | 所有管理功能 |

**認證流程**：
1. 用戶點擊登入 → 跳轉Manus OAuth
2. OAuth回調 → `/api/oauth/callback`
3. 設置Session Cookie
4. 後續請求自動帶Cookie → tRPC context解析用戶

---

## 五、核心業務邏輯

### 5.1 AI對話流程

```
用戶發送訊息 (chat.send)
    ↓
1. 識別/創建客戶記錄
   - 根據sessionId查找客戶
   - 不存在則創建新客戶
   - 更新lastSeenAt和totalMessages
    ↓
2. 保存用戶訊息到conversations表
    ↓
3. 獲取對話歷史（最近10條）
    ↓
4. 獲取知識庫內容
   - 查詢所有ready狀態的知識項目
   - 拼接內容（前10k字符）
    ↓
5. 獲取客戶記憶和歷史摘要
   - 查詢customer_memories
   - 查詢最近3次對話摘要
    ↓
6. 獲取訓練設定
   - 查詢ai_training表
   - 將48項評分轉換為指令
    ↓
7. 構建System Prompt:
   ```
   你是${persona.agentName}，一個專業的AI助手。
   
   ## 客戶資訊
   ${customerContext}
   
   ## 訓練指令
   ${trainingPrompt}
   
   ## 用戶自訂指令
   ${persona.systemPrompt}
   
   ## 知識庫
   ${knowledgeContent}
   ```
    ↓
8. 調用invokeLLM
    ↓
9. 保存AI回覆到conversations表
    ↓
10. 返回AI訊息給前端
```

### 5.2 對話結束摘要生成流程

```
對話結束觸發 (chat.endConversation)
觸發條件：頁面關閉、標籤頁隱藏、5分鐘無活動
    ↓
1. 獲取該session的所有對話記錄
    ↓
2. 調用LLM生成結構化摘要
   使用JSON Schema強制輸出格式：
   {
     summary: string,           // 對話摘要
     topics: string[],          // 關鍵話題
     customerQuestions: string[],// 客戶提問
     outcome: enum,             // 對話結果
     sentiment: enum,           // 客戶情緒
     extractedInfo: {           // 提取的客戶資料
       name, email, phone, company
     },
     memories: [{               // 提取的記憶
       type, content, confidence
     }]
   }
    ↓
3. 保存對話摘要到customer_conversation_summaries
    ↓
4. 更新客戶資料（如有新資訊）
    ↓
5. 保存客戶記憶到customer_memories
    ↓
6. 更新客戶情緒標籤
```

### 5.3 知識庫處理流程

```
用戶添加知識 (knowledge.upload / knowledge.addFromSource)
    ↓
根據來源類型處理：
    ↓
├── 文件上傳
│   1. Base64解碼文件內容
│   2. 上傳到S3 (storagePut)
│   3. 提取文本內容（前50k字符）
│   4. 保存到knowledge_bases
│
├── YouTube影片
│   1. 解析影片ID
│   2. 調用youtube-transcript獲取字幕
│   3. 拼接字幕文本
│   4. 保存到knowledge_bases
│
├── 網頁內容
│   1. 使用fetch獲取HTML
│   2. 使用cheerio解析
│   3. 提取主要文本內容
│   4. 保存到knowledge_bases
│
├── 直接文字
│   1. 直接保存content
│   2. 保存到knowledge_bases
│
└── FAQ問答對
    1. 解析JSON格式的問答對
    2. 格式化為Q&A文本
    3. 保存到knowledge_bases
    ↓
對話時使用：
    ↓
getKnowledgeContentByUserId獲取所有ready狀態內容
    ↓
拼接到System Prompt
```

### 5.4 訓練設定轉換邏輯

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
  }
  
  // 回應方式
  if (training.responseLength >= 4) {
    instructions.push("提供詳細完整的回答");
  } else if (training.responseLength <= 2) {
    instructions.push("回答簡潔扼要");
  }
  
  // ... 其他47項評分轉換
  
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

---

## 六、前端頁面結構

### 6.1 導航結構（5大類別）

```
儀表板（藍色 #3B82F6）
└── 儀表板 /                    # 統計卡片+趨勢圖+熱門問題

客戶前端（綠色 #10B981）
├── 版面設定 /appearance        # AI設定+版面風格+快捷按鈕
├── 客戶記憶 /customers         # 客戶列表+詳情+記憶管理
└── 專屬網址 /domain            # 自訂域名設定

AI 大腦（紫色 #8B5CF6）
├── 訓練智能體 /training        # 8維度48項評分+模板
├── 開發超能力 /superpowers     # 17項超能力開關
└── 知識庫 /knowledge           # 5種來源知識管理

開發者（青色 #06B6D4）
├── Widget 嵌入 /widget         # 嵌入代碼生成+預覽
└── API 文檔 /api-docs          # API使用說明

設定（橙色 #F59E0B）
├── 團隊管理 /team              # 團隊資料+成員+知識庫
├── 帳戶設定 /account           # 個人資料
└── 會員計劃 /pricing           # 定價+訂閱
```

### 6.2 頁面功能詳解

#### 儀表板 (Dashboard.tsx)
- 4個統計卡片：總對話數、獨立訪客、今日對話、AI狀態
- 專屬AI對話連結（可複製）
- 每日對話趨勢圖（14天）
- 熱門問題排行
- 最近對話記錄

#### 版面設定 (Appearance.tsx)
- **AI設定標籤**：名稱、頭像上傳、主題色、歡迎語、System Prompt
- **版面風格標籤**：極簡/專業/自訂三種風格
- **快捷按鈕標籤**：10種按鈕類型管理
- **進階設定標籤**：建議問題、輸入框提示

#### 訓練智能體 (Training.tsx)
- 6個快速人設模板（親切銷售員、專業顧問等）
- 8大維度評分滑桿（每維度6項）
- 自訂指令輸入區
- 智能指數和訓練進度顯示

#### 開發超能力 (Superpowers.tsx)
- 5大類別17項超能力Toggle
- 人類極限 vs AI能力對比
- 超能力等級和成就徽章
- 使用統計數據

#### 知識庫 (Knowledge.tsx)
- 5種來源標籤：文件、YouTube、網頁、文字、FAQ
- 文件拖放上傳
- YouTube連結輸入
- 網頁URL輸入
- 直接文字輸入
- FAQ問答對輸入

#### 客戶記憶 (Customers.tsx)
- 客戶列表（搜索、篩選）
- 客戶統計卡片
- 客戶詳情側邊欄
- 記憶管理（添加、查看）
- 對話摘要時間線

#### Widget嵌入 (Widget.tsx)
- Widget位置/大小/氣泡設定
- 即時預覽
- 嵌入代碼生成
- 安裝步驟指南

#### 團隊管理 (Team.tsx)
- 團隊資料標籤
- 成員管理標籤（邀請、權限）
- 團隊大腦標籤（知識庫）
- 使用統計標籤

---

## 七、會員計劃定價

### 7.1 個人計劃

| 計劃 | 價格 | 對話次數 | 知識庫 | 客戶記憶 |
|-----|------|---------|-------|---------|
| 免費版 | HK$0 | 250次/月 | 3個文件 | 10位客戶 |
| 基本版 | HK$299 | 5,000次/月 | 20個文件 | 100位客戶 |
| Premium | HK$599 | 50,000次/月 | 無限 | 無限 |

### 7.2 團隊計劃

| 計劃 | 價格 | 對話次數 | 成員數 | 團隊知識庫 |
|-----|------|---------|-------|----------|
| 團隊基礎 | HK$299 | 10,000次/月 | 5人 | 100 MB |
| 團隊專業 | HK$599 | 30,000次/月 | 15人 | 500 MB |
| 企業版 | HK$1,299 | 100,000次/月 | 50人 | 2 GB |

### 7.3 成本分析

| 計劃 | 月費 | 最大成本 | 利潤率 | 風險 |
|-----|------|---------|-------|------|
| 免費版 | HK$0 | HK$1 | N/A | ✅ 低 |
| 基本版 | HK$299 | HK$21 | 93% | ✅ 低 |
| Premium | HK$599 | HK$208 | 65% | ⚠️ 中 |
| 團隊基礎 | HK$299 | HK$17 | 94% | ✅ 低 |
| 團隊專業 | HK$599 | HK$100 | 83% | ✅ 低 |
| 企業版 | HK$1,299 | HK$500 | 61% | ⚠️ 中 |

---

## 八、開發階段規劃

### 第一階段：MVP（最小可行產品）

**目標**：推出免費版和基本版，驗證市場需求

**已完成功能**：
- [x] AI 對話系統
- [x] 智能體訓練（48項評分）
- [x] 知識庫管理（5種來源）
- [x] 版面設定
- [x] 專屬網址
- [x] 用戶認證
- [x] 儀表板和數據分析
- [x] 客戶記憶系統
- [x] 對話摘要自動生成
- [x] 導航列分類整合
- [x] Widget嵌入UI

**待完成任務**：
- [ ] Stripe 支付整合
- [ ] 用量限制檢查
- [ ] widget.js 後端實現

### 第二階段：功能擴展

**新增功能**：
- [ ] Premium 計劃開放
- [ ] 進階數據分析
- [ ] 客戶標籤和分群
- [ ] 批量導入知識庫
- [ ] 對話導出功能

### 第三階段：團隊與企業

**新增功能**：
- [ ] 團隊計劃開放
- [ ] API 存取
- [ ] 自訂域名
- [ ] SSO 整合
- [ ] 進階權限管理

---

## 九、環境變數

| 變數名 | 用途 | 來源 |
|-------|------|------|
| DATABASE_URL | MySQL連接字符串 | 系統注入 |
| JWT_SECRET | Session簽名密鑰 | 系統注入 |
| VITE_APP_ID | Manus OAuth應用ID | 系統注入 |
| OAUTH_SERVER_URL | OAuth後端URL | 系統注入 |
| BUILT_IN_FORGE_API_URL | LLM API URL | 系統注入 |
| BUILT_IN_FORGE_API_KEY | LLM API密鑰 | 系統注入 |
| VITE_FRONTEND_FORGE_API_KEY | 前端LLM密鑰 | 系統注入 |

---

## 十、測試文件

| 文件 | 測試內容 | 測試數 |
|-----|---------|-------|
| auth.logout.test.ts | 登出功能 | 3 |
| persona.test.ts | AI人設CRUD | 8 |
| appearance.test.ts | 版面設定 | 6 |
| analytics.test.ts | 統計功能 | 5 |
| training.test.ts | 訓練設定 | 7 |
| superpowers.test.ts | 超能力設定 | 5 |
| knowledge.test.ts | 知識庫管理 | 22 |
| team.test.ts | 團隊管理 | 26 |
| customer.test.ts | 客戶記憶 | 25 |
| conversationSummary.test.ts | 對話摘要 | 20 |

**總計**：127項測試

---

## 十一、重要決策記錄

| 日期 | 決策 | 原因 |
|-----|------|------|
| 2026-01-02 | 基本版價格改為 HK$299 | 統一定價策略 |
| 2026-01-02 | Premium 價格從 HK$399 調整為 HK$599 | 提高利潤率 |
| 2026-01-02 | 企業版成員上限設為 50 人 | 控制成本風險 |
| 2026-01-02 | 移除 Email 客服支援 | 簡化 MVP 功能 |
| 2026-01-02 | 導航列分為五大類別 | 改善用戶體驗 |
| 2026-01-02 | 添加開發者類別 | 放置Widget和API文檔 |
| 2026-01-02 | 知識庫支援5種來源 | 提升知識獲取靈活性 |
| 2026-01-02 | 對話結束自動生成摘要 | 增強客戶記憶功能 |

---

## 十二、給其他AI平台的審閱提示

如果您將此文檔提交給其他AI平台審閱或繼續開發，建議關注：

### 架構問題
1. tRPC + Drizzle ORM的技術選型是否適合此類SaaS應用？
2. 將48個訓練參數存為單獨欄位是否合理？是否應該用JSON欄位？
3. 知識庫直接存儲文本內容是否有更好方案（如向量搜索）？

### 安全問題
4. `publicProcedure`的`chat.send`是否有被濫用的風險？
5. System Prompt注入攻擊如何防範？
6. Widget跨域嵌入的安全考慮？

### 性能問題
7. 每次對話都讀取全部知識庫內容，有什麼優化方案？
8. 對話歷史無限增長如何處理？
9. 48項訓練參數如何高效轉換為System Prompt？

### 待實現功能
10. widget.js 後端實現
11. Stripe 支付整合
12. 用量限制檢查機制

---

> **提示**：此文檔應在每次重大更新後更新，確保開發團隊始終了解項目全貌。
>
> **版本歷史**：e98e87d8 → ... → 1155af38（當前）
