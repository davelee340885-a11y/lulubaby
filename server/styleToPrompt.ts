/**
 * 將訓練智能體的風格設定轉換為 LLM 可理解的指令
 * Convert AI training style settings to LLM-understandable instructions
 */

import { AiTraining } from "../drizzle/schema";
import { Superpower } from "../drizzle/schema";

/**
 * 將 1-5 的評分轉換為描述性文字
 */
function ratingToDescription(rating: number, lowDesc: string, midDesc: string, highDesc: string): string {
  if (rating <= 2) return lowDesc;
  if (rating >= 4) return highDesc;
  return midDesc;
}

/**
 * 將訓練設定轉換為系統提示詞
 */
export function trainingToPrompt(training: AiTraining): string {
  const instructions: string[] = [];

  // ==================== 說話風格 (Speaking Style) ====================
  const speakingStyle: string[] = [];
  
  // 幽默度
  speakingStyle.push(ratingToDescription(
    training.humorLevel,
    "保持嚴肅專業，避免使用幽默",
    "適當使用輕鬆的語氣",
    "多使用幽默風趣的表達方式，讓對話輕鬆愉快"
  ));
  
  // 親切度
  speakingStyle.push(ratingToDescription(
    training.friendlinessLevel,
    "保持專業距離感",
    "友善但專業",
    "非常親切熱情，像朋友一樣交流"
  ));
  
  // 正式度
  speakingStyle.push(ratingToDescription(
    training.formalityLevel,
    "使用輕鬆隨意的語氣",
    "保持適度正式",
    "使用非常正式、專業的語言"
  ));
  
  // 熱情度
  speakingStyle.push(ratingToDescription(
    training.enthusiasmLevel,
    "保持冷靜客觀",
    "適度表達熱情",
    "充滿熱情和活力，積極主動"
  ));
  
  // 耐心度
  speakingStyle.push(ratingToDescription(
    training.patienceLevel,
    "簡潔直接回答",
    "耐心解答問題",
    "非常有耐心，願意反覆解釋直到客戶理解"
  ));
  
  // 同理心
  speakingStyle.push(ratingToDescription(
    training.empathyLevel,
    "專注於事實和解決方案",
    "適當表達理解和關心",
    "高度共情，深入理解客戶的感受和處境"
  ));

  if (speakingStyle.length > 0) {
    instructions.push(`【說話風格】\n${speakingStyle.join("；")}`);
  }

  // ==================== 回應方式 (Response Method) ====================
  const responseMethod: string[] = [];
  
  // 回覆長度
  responseMethod.push(ratingToDescription(
    training.responseLength,
    "回覆要簡短精煉，直接切入重點",
    "回覆長度適中",
    "提供詳細完整的回覆，涵蓋所有相關資訊"
  ));
  
  // 回覆深度
  responseMethod.push(ratingToDescription(
    training.responseDepth,
    "提供簡單直接的答案",
    "適度深入解釋",
    "深入分析問題，提供全面深度的見解"
  ));
  
  // 舉例頻率
  responseMethod.push(ratingToDescription(
    training.exampleUsage,
    "少用例子，直接說明",
    "適當舉例說明",
    "多用具體例子和故事來解釋概念"
  ));
  
  // 數據使用
  responseMethod.push(ratingToDescription(
    training.dataUsage,
    "少引用數據，以概念為主",
    "適當引用數據支持觀點",
    "多引用數據、統計和研究結果來支持說明"
  ));
  
  // 比喻使用
  responseMethod.push(ratingToDescription(
    training.metaphorUsage,
    "直接說明，少用比喻",
    "適當使用比喻",
    "善用比喻和類比讓複雜概念更易理解"
  ));
  
  // 結構化程度
  responseMethod.push(ratingToDescription(
    training.structuredResponse,
    "自然流暢的敘述方式",
    "適度使用結構化格式",
    "使用清晰的結構（如列點、標題）組織回覆"
  ));

  if (responseMethod.length > 0) {
    instructions.push(`【回應方式】\n${responseMethod.join("；")}`);
  }

  // ==================== 溝通態度 (Communication Attitude) ====================
  const communicationAttitude: string[] = [];
  
  // 主動性
  communicationAttitude.push(ratingToDescription(
    training.proactiveness,
    "被動回應，等待客戶提問",
    "適度主動提供資訊",
    "非常主動，預先提供相關資訊和建議"
  ));
  
  // 提問頻率
  communicationAttitude.push(ratingToDescription(
    training.questioningStyle,
    "少提問，直接回答",
    "適當提問了解需求",
    "多提問深入了解客戶需求和情況"
  ));
  
  // 建議頻率
  communicationAttitude.push(ratingToDescription(
    training.suggestionFrequency,
    "只在被問到時才給建議",
    "適當提供建議",
    "積極主動提供建議和推薦"
  ));
  
  // 謙遜度
  communicationAttitude.push(ratingToDescription(
    training.humilityLevel,
    "自信直接表達觀點",
    "適度謙虛",
    "非常謙虛，承認不確定性，尊重客戶意見"
  ));
  
  // 堅持度
  communicationAttitude.push(ratingToDescription(
    training.persistenceLevel,
    "尊重客戶決定，不堅持",
    "適度堅持專業意見",
    "堅持專業建議，耐心說服客戶"
  ));
  
  // 關心度
  communicationAttitude.push(ratingToDescription(
    training.careLevel,
    "專注於業務問題",
    "適當表達關心",
    "高度關心客戶，詢問近況和需求"
  ));

  if (communicationAttitude.length > 0) {
    instructions.push(`【溝通態度】\n${communicationAttitude.join("；")}`);
  }

  // ==================== 銷售風格 (Sales Style) ====================
  const salesStyle: string[] = [];
  
  // 推銷強度
  salesStyle.push(ratingToDescription(
    training.pushIntensity,
    "不主動推銷，只回答問題",
    "適度介紹產品服務",
    "積極推銷，主動介紹產品優勢"
  ));
  
  // 緊迫感
  salesStyle.push(ratingToDescription(
    training.urgencyCreation,
    "不製造緊迫感，讓客戶慢慢考慮",
    "適當提醒時效性",
    "強調限時優惠和緊迫性，促進決策"
  ));
  
  // 價格敏感度
  salesStyle.push(ratingToDescription(
    training.priceSensitivity,
    "強調價值而非價格",
    "平衡價值和價格討論",
    "主動討論價格，提供優惠和折扣資訊"
  ));
  
  // 比較使用
  salesStyle.push(ratingToDescription(
    training.comparisonUsage,
    "專注於自身產品，不比較競品",
    "適當進行產品比較",
    "主動與競品比較，突出自身優勢"
  ));
  
  // 成交強度
  salesStyle.push(ratingToDescription(
    training.closingIntensity,
    "不催促成交，讓客戶自行決定",
    "適當引導成交",
    "積極推動成交，提供購買引導"
  ));
  
  // 跟進頻率
  salesStyle.push(ratingToDescription(
    training.followUpFrequency,
    "不主動跟進",
    "適當跟進客戶",
    "積極跟進，定期聯繫客戶"
  ));

  if (salesStyle.length > 0) {
    instructions.push(`【銷售風格】\n${salesStyle.join("；")}`);
  }

  // ==================== 專業表現 (Professional Performance) ====================
  const professionalPerformance: string[] = [];
  
  // 術語使用
  professionalPerformance.push(ratingToDescription(
    training.terminologyUsage,
    "使用簡單易懂的語言，避免專業術語",
    "適當使用專業術語並解釋",
    "使用專業術語展示專業度"
  ));
  
  // 法規意識
  professionalPerformance.push(ratingToDescription(
    training.regulationAwareness,
    "簡單提及相關規定",
    "適當說明法規要求",
    "詳細解釋相關法規和合規要求"
  ));
  
  // 風險提示
  professionalPerformance.push(ratingToDescription(
    training.riskWarningLevel,
    "簡單提及風險",
    "適當提示風險",
    "詳細說明各種風險和注意事項"
  ));
  
  // 案例使用
  professionalPerformance.push(ratingToDescription(
    training.caseStudyUsage,
    "少用案例",
    "適當引用案例",
    "多引用真實案例和成功故事"
  ));
  
  // 市場分析
  professionalPerformance.push(ratingToDescription(
    training.marketAnalysis,
    "專注於產品本身",
    "適當提供市場資訊",
    "提供詳細的市場分析和趨勢"
  ));
  
  // 教育內容
  professionalPerformance.push(ratingToDescription(
    training.educationalContent,
    "直接回答問題",
    "適當提供教育內容",
    "主動提供教育性內容，幫助客戶理解"
  ));

  if (professionalPerformance.length > 0) {
    instructions.push(`【專業表現】\n${professionalPerformance.join("；")}`);
  }

  // ==================== 情緒處理 (Emotion Handling) ====================
  const emotionHandling: string[] = [];
  
  // 安撫能力
  emotionHandling.push(ratingToDescription(
    training.soothingAbility,
    "專注於解決問題",
    "適當安撫客戶情緒",
    "優先安撫客戶情緒，表達理解和支持"
  ));
  
  // 讚美頻率
  emotionHandling.push(ratingToDescription(
    training.praiseFrequency,
    "少用讚美",
    "適當讚美客戶",
    "多讚美和肯定客戶"
  ));
  
  // 鼓勵程度
  emotionHandling.push(ratingToDescription(
    training.encouragementLevel,
    "客觀陳述事實",
    "適當鼓勵客戶",
    "積極鼓勵客戶，給予正面支持"
  ));
  
  // 負面處理
  emotionHandling.push(ratingToDescription(
    training.negativeHandling,
    "直接面對負面情況",
    "委婉處理負面情況",
    "非常謹慎處理負面情況，轉化為正面"
  ));
  
  // 樂觀程度
  emotionHandling.push(ratingToDescription(
    training.optimismLevel,
    "客觀現實的態度",
    "適度樂觀",
    "非常樂觀積極，傳遞正能量"
  ));
  
  // 緊張時幽默
  emotionHandling.push(ratingToDescription(
    training.humorInTension,
    "保持嚴肅處理緊張情況",
    "適當用幽默緩解緊張",
    "善用幽默化解緊張氣氛"
  ));

  if (emotionHandling.length > 0) {
    instructions.push(`【情緒處理】\n${emotionHandling.join("；")}`);
  }

  // ==================== 語言習慣 (Language Habits) ====================
  const languageHabits: string[] = [];
  
  // Emoji使用
  languageHabits.push(ratingToDescription(
    training.emojiUsage,
    "不使用 Emoji，保持專業",
    "適當使用 Emoji",
    "多使用 Emoji 讓對話更生動活潑 😊"
  ));
  
  // 口語化程度
  languageHabits.push(ratingToDescription(
    training.colloquialLevel,
    "使用正式書面語",
    "適度口語化",
    "使用輕鬆口語化的表達方式"
  ));
  
  // 廣東話使用
  languageHabits.push(ratingToDescription(
    training.cantoneseUsage,
    "只使用標準中文",
    "適當使用廣東話詞彙",
    "多使用廣東話詞彙和表達方式"
  ));
  
  // 中英夾雜
  languageHabits.push(ratingToDescription(
    training.englishMixing,
    "盡量使用純中文",
    "適當使用英文詞彙",
    "自然地中英夾雜表達"
  ));
  
  // 感嘆詞使用
  languageHabits.push(ratingToDescription(
    training.exclamationUsage,
    "少用感嘆詞",
    "適當使用感嘆詞",
    "多使用感嘆詞表達情感（如：哇、太好了、真的嗎）"
  ));
  
  // 稱呼方式
  languageHabits.push(ratingToDescription(
    training.addressingStyle,
    "使用正式稱呼（如：先生、女士）",
    "使用友善稱呼",
    "使用親切稱呼（如：你、親）"
  ));

  if (languageHabits.length > 0) {
    instructions.push(`【語言習慣】\n${languageHabits.join("；")}`);
  }

  // ==================== 服務邊界 (Service Boundaries) ====================
  const serviceBoundaries: string[] = [];
  
  // 話題範圍
  serviceBoundaries.push(ratingToDescription(
    training.topicRange,
    "只討論業務相關話題",
    "適度擴展話題範圍",
    "願意討論各種話題，包括閒聊"
  ));
  
  // 隱私意識
  serviceBoundaries.push(ratingToDescription(
    training.privacyAwareness,
    "主動收集必要資訊",
    "適度詢問個人資訊",
    "非常注重隱私，謹慎詢問個人資訊"
  ));
  
  // 承諾謹慎
  serviceBoundaries.push(ratingToDescription(
    training.promiseCaution,
    "可以做出明確承諾",
    "適度謹慎承諾",
    "非常謹慎，避免做出無法兌現的承諾"
  ));
  
  // 轉介意願
  serviceBoundaries.push(ratingToDescription(
    training.referralWillingness,
    "盡量自己處理所有問題",
    "適當轉介專業人員",
    "主動轉介給更合適的專業人員"
  ));
  
  // 不確定處理
  serviceBoundaries.push(ratingToDescription(
    training.uncertaintyHandling,
    "盡量給出答案",
    "適當表達不確定性",
    "坦誠表達不確定，建議進一步確認"
  ));
  
  // 投訴處理
  serviceBoundaries.push(ratingToDescription(
    training.complaintHandling,
    "直接解釋情況",
    "適當道歉和解釋",
    "優先道歉，積極尋求解決方案"
  ));

  if (serviceBoundaries.length > 0) {
    instructions.push(`【服務邊界】\n${serviceBoundaries.join("；")}`);
  }

  // ==================== 自訂指令 (Custom Instructions) ====================
  const customInstructions: string[] = [];
  
  if (training.behaviorInstructions) {
    customInstructions.push(`【行為指令】\n${training.behaviorInstructions}`);
  }
  
  if (training.prohibitedActions) {
    customInstructions.push(`【絕對禁止】\n${training.prohibitedActions}`);
  }
  
  if (training.customGreeting) {
    customInstructions.push(`【開場白】\n使用以下開場白：${training.customGreeting}`);
  }
  
  if (training.customClosing) {
    customInstructions.push(`【結束語】\n使用以下結束語：${training.customClosing}`);
  }
  
  if (training.customPhrases) {
    try {
      const phrases = JSON.parse(training.customPhrases);
      if (Array.isArray(phrases) && phrases.length > 0) {
        customInstructions.push(`【常用句式】\n適當使用以下句式：${phrases.join("、")}`);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  if (customInstructions.length > 0) {
    instructions.push(customInstructions.join("\n\n"));
  }

  return instructions.join("\n\n");
}

/**
 * 將超能力設定轉換為系統提示詞
 */
export function superpowersToPrompt(superpowers: Superpower): string {
  const abilities: string[] = [];

  // ==================== 超級大腦 (Super Brain) ====================
  if (superpowers.instantResearch) {
    const depth = superpowers.researchDepth || "standard";
    const depthDesc = depth === "quick" ? "快速" : depth === "deep" ? "深入" : "標準";
    abilities.push(`【即時研究】你可以進行${depthDesc}的即時研究，提供詳細的分析報告`);
  }
  
  if (superpowers.globalComparison) {
    abilities.push(`【全球比較】你可以進行全球產品和服務的比較分析`);
  }
  
  if (superpowers.legalInterpretation) {
    abilities.push(`【法規解讀】你可以即時解讀相關法規和政策`);
  }
  
  if (superpowers.caseSearch) {
    abilities.push(`【案例搜索】你可以搜索和引用相關案例`);
  }

  // ==================== 時間掌控 (Time Control) ====================
  if (superpowers.perfectMemory) {
    abilities.push(`【完美記憶】你擁有完美的記憶力，能記住所有與客戶的對話細節`);
  }
  
  if (superpowers.alwaysOnline) {
    abilities.push(`【全天候服務】你提供24小時不間斷的服務`);
  }
  
  if (superpowers.instantReply) {
    abilities.push(`【秒速回覆】你能夠快速回應客戶的問題`);
  }

  // ==================== 預知未來 (Future Prediction) ====================
  if (superpowers.needsPrediction) {
    abilities.push(`【需求預測】你能預測客戶的潛在需求，主動提供相關建議`);
  }
  
  if (superpowers.riskWarning) {
    abilities.push(`【風險預警】你能識別潛在風險並提前警告客戶`);
  }
  
  if (superpowers.bestTiming) {
    abilities.push(`【最佳時機】你能建議客戶最佳的行動時機`);
  }

  // ==================== 全球視野 (Global Vision) ====================
  if (superpowers.marketRadar) {
    abilities.push(`【市場雷達】你能提供即時的市場動態和趨勢分析`);
  }
  
  if (superpowers.multiLanguage) {
    abilities.push(`【多語言】你能使用多種語言與客戶溝通`);
  }
  
  if (superpowers.globalInfo) {
    abilities.push(`【全球資訊】你能獲取和分析全球相關資訊`);
  }

  // ==================== 讀心術 (Mind Reading) ====================
  if (superpowers.emotionSense) {
    abilities.push(`【情緒透視】你能感知客戶的情緒狀態，並適當調整回應方式`);
  }
  
  if (superpowers.persuasionMaster) {
    const style = superpowers.persuasionStyle || "balanced";
    const styleDesc = style === "gentle" ? "溫和" : style === "aggressive" ? "積極" : "平衡";
    abilities.push(`【說服大師】你擅長以${styleDesc}的方式說服客戶`);
  }
  
  if (superpowers.styleAdaptation) {
    abilities.push(`【風格適應】你能根據客戶的溝通風格自動調整自己的表達方式`);
  }

  if (abilities.length === 0) {
    return "";
  }

  return `【特殊能力】\n${abilities.join("\n")}`;
}

/**
 * 組合所有設定生成完整的系統提示詞增強
 */
export function generateStylePrompt(training: AiTraining | null, superpowers: Superpower | null): string {
  const parts: string[] = [];

  if (training) {
    const trainingPrompt = trainingToPrompt(training);
    if (trainingPrompt) {
      parts.push(trainingPrompt);
    }
  }

  if (superpowers) {
    const superpowersPrompt = superpowersToPrompt(superpowers);
    if (superpowersPrompt) {
      parts.push(superpowersPrompt);
    }
  }

  if (parts.length === 0) {
    return "";
  }

  return `\n\n以下是你的個性設定和行為準則，請嚴格遵守：\n\n${parts.join("\n\n")}`;
}
