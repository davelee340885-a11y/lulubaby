import { describe, it, expect } from "vitest";

/**
 * BUG-DT-005: processTextInput 參數順序修復
 * BUG-DT-007: Brain 統計數字即時更新（UI 修復，無法用 vitest 測試）
 * BUG-DT-008: detectLearningIntent 改進
 */

// 模擬 detectLearningIntent 函數（從 agentChatRouter.ts 提取）
const LEARNING_KEYWORDS = [
  "請記住", "幫我記住", "你要記得", "這是一條新知識",
  "請記下", "幫我記下", "請記錄", "幫我記錄",
  "請學習", "幫我學習", "請學會",
  "remember this", "note this", "keep in mind", "please remember"
];

const QUERY_PATTERNS = [
  /你記得.+嗎/,
  /你還記得/,
  /記得.+嗎[?？]/,
  /學習過.+嗎/,
  /學到了?什麼/,
  /do you remember/i,
  /have you learned/i,
];

function detectLearningIntent(message: string): { isLearning: boolean; cleanedContent: string } {
  const lowerMessage = message.toLowerCase();
  
  for (const pattern of QUERY_PATTERNS) {
    if (pattern.test(message)) {
      return { isLearning: false, cleanedContent: message };
    }
  }
  
  if (message.includes('？') || message.includes('?')) {
    return { isLearning: false, cleanedContent: message };
  }
  
  for (const keyword of LEARNING_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      let cleanedContent = message;
      const patterns = [
        new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[，,：:、\\s]*`, 'i'),
        new RegExp(`[，,：:、\\s]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[，,：:、\\s]*`, 'gi'),
      ];
      for (const pattern of patterns) {
        cleanedContent = cleanedContent.replace(pattern, '');
      }
      cleanedContent = cleanedContent.trim();
      if (cleanedContent.length < 5) {
        return { isLearning: false, cleanedContent: message };
      }
      return { isLearning: true, cleanedContent };
    }
  }
  
  return { isLearning: false, cleanedContent: message };
}

// 模擬 processTextInput 函數
function processTextInput(text: string, title?: string) {
  if (!text || text.trim().length === 0) {
    return { success: false, error: '請輸入有效的文字內容' };
  }
  const content = text.trim();
  if (content.length > 100000) {
    return { success: false, error: '文字內容過長' };
  }
  return {
    success: true,
    content,
    metadata: { title: title || '直接輸入', contentLength: content.length }
  };
}

describe("BUG-DT-005: processTextInput 參數順序修復", () => {
  it("應該正確處理 content 作為第一個參數，title 作為第二個參數", () => {
    const title = "深度測試產品資料";
    const content = "Lulubaby 公司成立於 2020 年，總部位於香港九龍。主要產品包括星光寶貝智能搖籃，售價 HK$3,888。";
    
    // 修復後的調用順序：processTextInput(content, title)
    const result = processTextInput(content, title);
    
    expect(result.success).toBe(true);
    expect(result.content).toBe(content);
    expect(result.content!.length).toBeGreaterThan(50); // 內容應該比標題長得多
    expect(result.metadata!.title).toBe(title);
  });

  it("修復前的錯誤調用順序會導致內容被截斷", () => {
    const title = "深度測試產品資料";
    const content = "Lulubaby 公司成立於 2020 年，總部位於香港九龍。主要產品包括星光寶貝智能搖籃，售價 HK$3,888。";
    
    // 修復前的錯誤調用順序：processTextInput(title, content) - title 被當作 text
    const buggyResult = processTextInput(title, content);
    
    // 這會導致儲存的是標題（很短），而非實際內容
    expect(buggyResult.content).toBe(title);
    expect(buggyResult.content!.length).toBeLessThan(content.length);
  });
});

describe("BUG-DT-008: detectLearningIntent 改進", () => {
  it("查詢問句不應被識別為學習意圖", () => {
    const queries = [
      "我有一位客戶李太太，她是退休教師。你記得她的情況嗎？她適合什麼產品？",
      "你還記得上次我說的那個客戶嗎？",
      "你記得李太太嗎？",
      "你學習過什麼產品知識？",
      "Do you remember the customer I mentioned?",
    ];
    
    for (const query of queries) {
      const result = detectLearningIntent(query);
      expect(result.isLearning).toBe(false);
    }
  });

  it("含有問號的訊息不應被識別為學習意圖", () => {
    const queries = [
      "記住了嗎？",
      "你學到了什麼？",
      "Can you remember this?",
    ];
    
    for (const query of queries) {
      const result = detectLearningIntent(query);
      expect(result.isLearning).toBe(false);
    }
  });

  it("明確的保存指令應被識別為學習意圖", () => {
    const commands = [
      "請記住，李太太是退休教師，對養生保健產品有興趣",
      "幫我記住：這個客戶偏好高端產品",
      "幫我記錄，今天和王先生的會議重點是討論保險方案",
      "remember this, customer prefers premium products",
    ];
    
    for (const command of commands) {
      const result = detectLearningIntent(command);
      expect(result.isLearning).toBe(true);
      expect(result.cleanedContent.length).toBeGreaterThan(0);
    }
  });

  it("一般對話不應被識別為學習意圖", () => {
    const normalMessages = [
      "你好，請問有什麼服務？",
      "我想了解你們的產品",
      "星光寶貝智能搖籃售價多少？",
      "謝謝你的幫助",
    ];
    
    for (const msg of normalMessages) {
      const result = detectLearningIntent(msg);
      expect(result.isLearning).toBe(false);
    }
  });

  it("內容太短的保存指令不應被識別為學習意圖", () => {
    const shortCommands = [
      "請記住，好",
      "幫我記住 OK",
    ];
    
    for (const cmd of shortCommands) {
      const result = detectLearningIntent(cmd);
      expect(result.isLearning).toBe(false);
    }
  });
});
