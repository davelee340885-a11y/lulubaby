import { describe, it, expect } from "vitest";
import { trainingToPrompt, superpowersToPrompt, generateStylePrompt } from "./styleToPrompt";
import { AiTraining, Superpower } from "../drizzle/schema";

// Mock training data with all default values (3)
const mockDefaultTraining: AiTraining = {
  id: 1,
  userId: 1,
  activePersonaTemplate: null,
  // Speaking Style
  humorLevel: 3,
  friendlinessLevel: 3,
  formalityLevel: 3,
  enthusiasmLevel: 3,
  patienceLevel: 3,
  empathyLevel: 3,
  // Response Method
  responseLength: 3,
  responseDepth: 3,
  exampleUsage: 3,
  dataUsage: 3,
  metaphorUsage: 3,
  structuredResponse: 3,
  // Communication Attitude
  proactiveness: 3,
  questioningStyle: 3,
  suggestionFrequency: 3,
  humilityLevel: 3,
  persistenceLevel: 3,
  careLevel: 3,
  // Sales Style
  pushIntensity: 3,
  urgencyCreation: 3,
  priceSensitivity: 3,
  comparisonUsage: 3,
  closingIntensity: 3,
  followUpFrequency: 3,
  // Professional Performance
  terminologyUsage: 3,
  regulationAwareness: 3,
  riskWarningLevel: 3,
  caseStudyUsage: 3,
  marketAnalysis: 3,
  educationalContent: 3,
  // Emotion Handling
  soothingAbility: 3,
  praiseFrequency: 3,
  encouragementLevel: 3,
  negativeHandling: 3,
  optimismLevel: 3,
  humorInTension: 3,
  // Language Habits
  emojiUsage: 3,
  colloquialLevel: 3,
  cantoneseUsage: 3,
  englishMixing: 3,
  exclamationUsage: 3,
  addressingStyle: 3,
  // Service Boundaries
  topicRange: 3,
  privacyAwareness: 3,
  promiseCaution: 3,
  referralWillingness: 3,
  uncertaintyHandling: 3,
  complaintHandling: 3,
  // Custom Instructions
  behaviorInstructions: null,
  prohibitedActions: null,
  customGreeting: null,
  customClosing: null,
  customPhrases: null,
  // Progress
  trainingProgress: 50,
  intelligenceScore: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock training data with extreme values
const mockExtremeTraining: AiTraining = {
  ...mockDefaultTraining,
  humorLevel: 5,
  friendlinessLevel: 5,
  formalityLevel: 1,
  enthusiasmLevel: 5,
  patienceLevel: 5,
  empathyLevel: 5,
  responseLength: 5,
  emojiUsage: 5,
  pushIntensity: 1,
  behaviorInstructions: "永遠保持積極正面的態度",
  prohibitedActions: "不要討論競爭對手的負面信息",
  customGreeting: "你好！很高興見到你！",
  customClosing: "感謝你的時間，祝你有美好的一天！",
  customPhrases: JSON.stringify(["沒問題", "當然可以", "我很樂意幫忙"]),
};

// Mock superpowers data
const mockDefaultSuperpowers: Superpower = {
  id: 1,
  userId: 1,
  // Super Brain
  instantResearch: false,
  globalComparison: false,
  legalInterpretation: false,
  caseSearch: false,
  // Time Control
  cloneAbility: true,
  perfectMemory: true,
  alwaysOnline: true,
  instantReply: true,
  // Future Prediction
  needsPrediction: false,
  riskWarning: false,
  bestTiming: false,
  // Global Vision
  marketRadar: false,
  multiLanguage: true,
  globalInfo: false,
  // Mind Reading
  emotionSense: false,
  persuasionMaster: false,
  styleAdaptation: false,
  // Settings
  researchDepth: "standard",
  followUpIntensity: 3,
  persuasionStyle: "balanced",
  // Stats
  superpowerLevel: 1,
  totalConversationsHandled: 0,
  customersRemembered: 0,
  afterHoursMessages: 0,
  researchReportsGenerated: 0,
  predictionsAccurate: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockActiveSuperpowers: Superpower = {
  ...mockDefaultSuperpowers,
  instantResearch: true,
  globalComparison: true,
  needsPrediction: true,
  emotionSense: true,
  persuasionMaster: true,
  styleAdaptation: true,
  researchDepth: "deep",
  persuasionStyle: "gentle",
};

describe("styleToPrompt", () => {
  describe("trainingToPrompt", () => {
    it("should generate prompt from default training values", () => {
      const prompt = trainingToPrompt(mockDefaultTraining);
      
      // Should contain all 8 categories
      expect(prompt).toContain("【說話風格】");
      expect(prompt).toContain("【回應方式】");
      expect(prompt).toContain("【溝通態度】");
      expect(prompt).toContain("【銷售風格】");
      expect(prompt).toContain("【專業表現】");
      expect(prompt).toContain("【情緒處理】");
      expect(prompt).toContain("【語言習慣】");
      expect(prompt).toContain("【服務邊界】");
    });

    it("should generate different descriptions for extreme values", () => {
      const prompt = trainingToPrompt(mockExtremeTraining);
      
      // High humor level (5) should mention humor
      expect(prompt).toContain("幽默風趣");
      
      // High friendliness (5) should mention friendly
      expect(prompt).toContain("親切熱情");
      
      // Low formality (1) should mention casual
      expect(prompt).toContain("輕鬆隨意");
      
      // High emoji usage (5) should mention emoji
      expect(prompt).toContain("Emoji");
      
      // Low push intensity (1) should mention not pushing
      expect(prompt).toContain("不主動推銷");
    });

    it("should include custom instructions when provided", () => {
      const prompt = trainingToPrompt(mockExtremeTraining);
      
      expect(prompt).toContain("【行為指令】");
      expect(prompt).toContain("永遠保持積極正面的態度");
      
      expect(prompt).toContain("【絕對禁止】");
      expect(prompt).toContain("不要討論競爭對手的負面信息");
      
      expect(prompt).toContain("【開場白】");
      expect(prompt).toContain("你好！很高興見到你！");
      
      expect(prompt).toContain("【結束語】");
      expect(prompt).toContain("感謝你的時間");
      
      expect(prompt).toContain("【常用句式】");
      expect(prompt).toContain("沒問題");
    });

    it("should not include custom instructions when not provided", () => {
      const prompt = trainingToPrompt(mockDefaultTraining);
      
      expect(prompt).not.toContain("【行為指令】");
      expect(prompt).not.toContain("【絕對禁止】");
      expect(prompt).not.toContain("【開場白】");
      expect(prompt).not.toContain("【結束語】");
      expect(prompt).not.toContain("【常用句式】");
    });
  });

  describe("superpowersToPrompt", () => {
    it("should return empty string when no superpowers are active", () => {
      const minimalSuperpowers: Superpower = {
        ...mockDefaultSuperpowers,
        perfectMemory: false,
        alwaysOnline: false,
        instantReply: false,
        multiLanguage: false,
      };
      
      const prompt = superpowersToPrompt(minimalSuperpowers);
      expect(prompt).toBe("");
    });

    it("should include active superpowers", () => {
      const prompt = superpowersToPrompt(mockActiveSuperpowers);
      
      expect(prompt).toContain("【特殊能力】");
      expect(prompt).toContain("【即時研究】");
      expect(prompt).toContain("深入"); // deep research depth
      expect(prompt).toContain("【全球比較】");
      expect(prompt).toContain("【需求預測】");
      expect(prompt).toContain("【情緒透視】");
      expect(prompt).toContain("【說服大師】");
      expect(prompt).toContain("溫和"); // gentle persuasion style
      expect(prompt).toContain("【風格適應】");
    });

    it("should include time control abilities", () => {
      const prompt = superpowersToPrompt(mockDefaultSuperpowers);
      
      expect(prompt).toContain("【完美記憶】");
      expect(prompt).toContain("【全天候服務】");
      expect(prompt).toContain("【秒速回覆】");
      expect(prompt).toContain("【多語言】");
    });
  });

  describe("generateStylePrompt", () => {
    it("should combine training and superpowers prompts", () => {
      const prompt = generateStylePrompt(mockDefaultTraining, mockActiveSuperpowers);
      
      // Should contain training sections
      expect(prompt).toContain("【說話風格】");
      expect(prompt).toContain("【銷售風格】");
      
      // Should contain superpowers
      expect(prompt).toContain("【特殊能力】");
      expect(prompt).toContain("【即時研究】");
      
      // Should have intro text
      expect(prompt).toContain("以下是你的個性設定和行為準則");
    });

    it("should return empty string when both are null", () => {
      const prompt = generateStylePrompt(null, null);
      expect(prompt).toBe("");
    });

    it("should work with only training", () => {
      const prompt = generateStylePrompt(mockDefaultTraining, null);
      
      expect(prompt).toContain("【說話風格】");
      expect(prompt).not.toContain("【特殊能力】");
    });

    it("should work with only superpowers", () => {
      const prompt = generateStylePrompt(null, mockActiveSuperpowers);
      
      expect(prompt).toContain("【特殊能力】");
      expect(prompt).not.toContain("【說話風格】");
    });
  });

  describe("rating descriptions", () => {
    it("should use low description for rating 1-2", () => {
      const lowTraining: AiTraining = {
        ...mockDefaultTraining,
        humorLevel: 1,
        friendlinessLevel: 2,
      };
      
      const prompt = trainingToPrompt(lowTraining);
      expect(prompt).toContain("保持嚴肅專業");
      expect(prompt).toContain("保持專業距離感");
    });

    it("should use mid description for rating 3", () => {
      const prompt = trainingToPrompt(mockDefaultTraining);
      expect(prompt).toContain("適當使用輕鬆的語氣");
      expect(prompt).toContain("友善但專業");
    });

    it("should use high description for rating 4-5", () => {
      const highTraining: AiTraining = {
        ...mockDefaultTraining,
        humorLevel: 4,
        friendlinessLevel: 5,
      };
      
      const prompt = trainingToPrompt(highTraining);
      expect(prompt).toContain("幽默風趣");
      expect(prompt).toContain("非常親切熱情");
    });
  });
});
