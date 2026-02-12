# 知識庫上傳方式研究

## 可行的知識來源類型

### 1. 文件上傳 (已有)
- **支援格式**: TXT, PDF, DOC, DOCX
- **技術方案**: 已實現
- **狀態**: ✅ 完成

### 2. YouTube 影片字幕
- **技術方案**: 使用 `youtube-transcript` npm 套件
- **安裝**: `npm i youtube-transcript`
- **使用方式**:
```typescript
import { YoutubeTranscript } from 'youtube-transcript';
const transcript = await YoutubeTranscript.fetchTranscript('videoId or URL');
```
- **優點**: 免費、無需API Key、支援自動生成字幕
- **限制**: 使用非官方API，可能不穩定
- **狀態**: 🔄 待實現

### 3. 網頁連結抓取
- **技術方案**: 使用 cheerio + axios 抓取網頁內容
- **安裝**: `npm i cheerio axios`
- **處理**: 提取主要文字內容，過濾導航、廣告等
- **優點**: 可抓取任何公開網頁
- **限制**: 部分網站可能有反爬蟲機制
- **狀態**: 🔄 待實現

### 4. 直接文字輸入
- **技術方案**: 簡單的文字輸入框
- **用途**: 用戶直接輸入產品說明、公司介紹等
- **優點**: 最簡單直接
- **狀態**: 🔄 待實現

### 5. FAQ 問答對
- **技術方案**: 結構化的問答輸入表單
- **格式**: 問題 + 答案 配對
- **優點**: 結構清晰，AI更容易理解和引用
- **用途**: 常見問題、銷售話術
- **狀態**: 🔄 待實現

### 6. 網站地圖爬取 (進階)
- **技術方案**: 輸入網站根URL，自動爬取多個頁面
- **限制**: 需要限制爬取深度和頁面數量
- **狀態**: 📋 未來考慮

## 數據庫設計

### knowledge 表更新
```sql
ALTER TABLE knowledge ADD COLUMN source_type ENUM(
  'file',      -- 文件上傳
  'youtube',   -- YouTube影片
  'webpage',   -- 網頁連結
  'text',      -- 直接文字
  'faq'        -- FAQ問答
) DEFAULT 'file';

ALTER TABLE knowledge ADD COLUMN source_url TEXT;  -- 來源URL
ALTER TABLE knowledge ADD COLUMN source_meta JSON; -- 額外元數據
```

## 前端UI設計

### 知識庫上傳頁面 Tab 結構
1. **文件上傳** - 拖放或選擇文件
2. **YouTube 影片** - 輸入影片連結
3. **網頁連結** - 輸入網頁URL
4. **直接輸入** - 文字編輯器
5. **FAQ 問答** - 問答對表單

## 實現優先級
1. ⭐ 直接文字輸入 (最簡單)
2. ⭐ FAQ 問答對 (高價值)
3. ⭐ YouTube 影片 (用戶需求)
4. 🔶 網頁連結抓取 (中等複雜度)
5. 🔷 網站地圖爬取 (未來版本)
