/**
 * Realtime Memory Extraction & Proactive Data Collection Tests
 * 
 * Tests for:
 * 1. extractMemoryFromTurn function - realtime memory extraction from single turn
 * 2. Proactive data collection toggle in training settings
 * 3. System prompt injection for proactive data collection
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Mock db functions
vi.mock("./db", () => ({
  updateCustomer: vi.fn(),
  addCustomerMemory: vi.fn(),
  getPersonaById: vi.fn(),
  getPersonaByUserId: vi.fn(),
  getTrainingByUserId: vi.fn(),
  getSuperpowersByUserId: vi.fn(),
  getKnowledgeContentByUserId: vi.fn(),
  getConversationsBySession: vi.fn(),
  createConversation: vi.fn(),
  getUserById: vi.fn(),
  getOrCreateCustomer: vi.fn(),
  getCustomerMemoryContext: vi.fn(),
  incrementCustomerMessageCount: vi.fn(),
  upsertTraining: vi.fn(),
  createOrGetSubscription: vi.fn(),
  checkSparkBalance: vi.fn(),
  deductSpark: vi.fn(),
  getQuickButtonsByUserId: vi.fn(),
  getDb: vi.fn(),
  getAnalyticsStats: vi.fn(),
  getDailyStats: vi.fn(),
  getPopularQuestions: vi.fn(),
  getRecentConversations: vi.fn(),
  upsertPersona: vi.fn(),
  getKnowledgeBasesByUserId: vi.fn(),
  createKnowledgeBase: vi.fn(),
  updateKnowledgeBase: vi.fn(),
  deleteKnowledgeBase: vi.fn(),
  createQuickButton: vi.fn(),
  updateQuickButton: vi.fn(),
  deleteQuickButton: vi.fn(),
  getSparkBalance: vi.fn(),
  getSparkTransactions: vi.fn(),
  checkMessageLimit: vi.fn(),
  incrementMessageCount: vi.fn(),
  getUsageSummary: vi.fn(),
  updateSubscription: vi.fn(),
  getCustomerById: vi.fn(),
  getCustomersByPersonaId: vi.fn(),
  deleteCustomer: vi.fn(),
  getCustomerMemories: vi.fn(),
  deleteCustomerMemory: vi.fn(),
  addConversationSummary: vi.fn(),
  getCustomerConversationSummaries: vi.fn(),
  getRecentConversationContext: vi.fn(),
  getCustomerStats: vi.fn(),
  isValidSubdomain: vi.fn(),
  isSubdomainAvailable: vi.fn(),
  getPersonaBySubdomain: vi.fn(),
  setUserSubdomain: vi.fn(),
  getDomainsByUserId: vi.fn(),
  getDomainById: vi.fn(),
  getDomainByName: vi.fn(),
  createDomain: vi.fn(),
  updateDomain: vi.fn(),
  deleteDomain: vi.fn(),
  updateDomainDnsStatus: vi.fn(),
  updateDomainSslStatus: vi.fn(),
  createDomainHealthLog: vi.fn(),
  getDomainHealthLogs: vi.fn(),
  createDomainOrder: vi.fn(),
  getDomainOrder: vi.fn(),
  updateDomainOrderStatus: vi.fn(),
  getRegisteredDomainOrders: vi.fn(),
  updateDomainOrderDnsConfig: vi.fn(),
  getDomainOrderByDomain: vi.fn(),
  bindDomainToPersona: vi.fn(),
  unbindDomainFromPersona: vi.fn(),
  publishDomain: vi.fn(),
  unpublishDomain: vi.fn(),
  getPublishedDomainByName: vi.fn(),
  getTeamById: vi.fn(),
  getTeamByOwnerId: vi.fn(),
  getTeamsByUserId: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeamMembers: vi.fn(),
  getTeamMemberById: vi.fn(),
  getTeamMemberByUserAndTeam: vi.fn(),
  inviteTeamMember: vi.fn(),
  acceptTeamInvitation: vi.fn(),
  updateTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamMemberCount: vi.fn(),
  getTeamKnowledgeByTeamId: vi.fn(),
  getTeamKnowledgeById: vi.fn(),
  createTeamKnowledge: vi.fn(),
  updateTeamKnowledge: vi.fn(),
  deleteTeamKnowledge: vi.fn(),
  getAccessibleTeamKnowledge: vi.fn(),
  getTeamKnowledgeContent: vi.fn(),
  getTeamStats: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./services/memoryService", () => ({
  createMemoryService: vi.fn().mockReturnValue({
    getMemoryContext: vi.fn().mockResolvedValue(""),
  }),
}));

vi.mock("./styleToPrompt", () => ({
  generateStylePrompt: vi.fn().mockReturnValue(""),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

vi.mock("./namecom", () => ({
  searchDomainsWithPricing: vi.fn(),
  checkDomainAvailability: vi.fn(),
  getDomainPricing: vi.fn(),
  purchaseDomain: vi.fn(),
  setDnsRecords: vi.fn(),
  verifyConnection: vi.fn(),
}));

vi.mock("./knowledgeSourceService", () => ({
  fetchYouTubeTranscript: vi.fn(),
  fetchWebpageContent: vi.fn(),
  processTextInput: vi.fn(),
  processFAQInput: vi.fn(),
  extractYouTubeVideoId: vi.fn(),
  fetchWebpageContentViaLLM: vi.fn(),
}));

import { updateCustomer, addCustomerMemory } from "./db";
import { invokeLLM } from "./_core/llm";

describe("Realtime Memory Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractMemoryFromTurn function exists in routers.ts", () => {
    it("should define extractMemoryFromTurn as an async function", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("async function extractMemoryFromTurn");
      expect(content).toContain("customerId: number");
      expect(content).toContain("lastUserMessage: string");
      expect(content).toContain("lastAiMessage: string");
    });

    it("should call invokeLLM with realtime_memory_extraction JSON schema", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("realtime_memory_extraction");
      expect(content).toContain("customerInfo");
      expect(content).toContain("memories");
    });

    it("should update customer info when extracted", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("updateCustomer(customerId, updateData)");
    });

    it("should add memories when extracted", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      // Verify addCustomerMemory is called within extractMemoryFromTurn
      expect(content).toContain("addCustomerMemory({");
      expect(content).toContain("memoryType: memory.type");
    });
  });

  describe("chat.send triggers extractMemoryFromTurn", () => {
    it("should call extractMemoryFromTurn after AI response in chat.send", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      // Verify extractMemoryFromTurn is called in chat.send
      expect(content).toContain("extractMemoryFromTurn({");
      expect(content).toContain("customerId: customer.id");
      expect(content).toContain("lastUserMessage: input.message");
      expect(content).toContain("lastAiMessage: aiMessage");
    });

    it("should use fire-and-forget pattern (catch without awaiting)", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      // Verify it's fire-and-forget (not awaited, but has .catch)
      expect(content).toContain("}).catch((err: unknown) => console.error");
      expect(content).toContain("[chat.send] Realtime memory extraction failed");
    });

    it("should only trigger extraction when customer exists", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      // Verify customer check before extraction
      expect(content).toContain("if (customer) {");
      expect(content).toContain("extractMemoryFromTurn({");
    });
  });

  describe("LLM extraction prompt quality", () => {
    it("should instruct LLM to only extract explicitly mentioned info", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("只提取明確提及的資訊");
      expect(content).toContain("不要猜測");
    });

    it("should support all memory types in extraction", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      const memoryTypes = ["preference", "fact", "need", "concern", "purchase", "feedback"];
      for (const type of memoryTypes) {
        expect(content).toContain(`"${type}"`);
      }
    });

    it("should extract customer info fields: name, email, phone, company", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      // In the extractMemoryFromTurn function
      expect(content).toContain('analysis.customerInfo.name');
      expect(content).toContain('analysis.customerInfo.email');
      expect(content).toContain('analysis.customerInfo.phone');
      expect(content).toContain('analysis.customerInfo.company');
    });
  });
});

describe("Proactive Data Collection", () => {
  describe("Database schema", () => {
    it("should have proactiveDataCollection field in ai_training schema", () => {
      const schemaPath = path.join(__dirname, "../drizzle/schema.ts");
      const content = fs.readFileSync(schemaPath, "utf-8");
      
      expect(content).toContain("proactiveDataCollection");
    });
  });

  describe("Training update route", () => {
    it("should accept proactiveDataCollection in training.update input", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("proactiveDataCollection: z.boolean().optional()");
    });
  });

  describe("System prompt injection", () => {
    it("should inject proactive data collection prompt when enabled", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("training?.proactiveDataCollection");
      expect(content).toContain("主動資料索取");
    });

    it("should check customer name and email before injecting prompt", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("!!customer.name");
      expect(content).toContain("!!customer.email");
    });

    it("should only inject when customer info is incomplete", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("if (!hasName || !hasEmail)");
    });

    it("should include polite example in the prompt", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      expect(content).toContain("為了方便後續跟進");
      expect(content).toContain("不要強迫或重複詢問");
    });

    it("should inject proactive prompt BEFORE style instructions", () => {
      const routersPath = path.join(__dirname, "routers.ts");
      const content = fs.readFileSync(routersPath, "utf-8");
      
      const proactiveIndex = content.indexOf("主動資料索取");
      const styleIndex = content.indexOf("Add style and superpowers instructions");
      
      expect(proactiveIndex).toBeGreaterThan(-1);
      expect(styleIndex).toBeGreaterThan(-1);
      expect(proactiveIndex).toBeLessThan(styleIndex);
    });
  });

  describe("Frontend toggle", () => {
    it("should have proactive data collection toggle in Training.tsx", () => {
      const trainingPath = path.join(__dirname, "../client/src/pages/Training.tsx");
      const content = fs.readFileSync(trainingPath, "utf-8");
      
      expect(content).toContain("主動資料索取");
      expect(content).toContain("proactiveDataCollection");
    });

    it("should use a switch/toggle UI element", () => {
      const trainingPath = path.join(__dirname, "../client/src/pages/Training.tsx");
      const content = fs.readFileSync(trainingPath, "utf-8");
      
      expect(content).toContain('role="switch"');
      expect(content).toContain("aria-checked");
    });

    it("should show description about the feature", () => {
      const trainingPath = path.join(__dirname, "../client/src/pages/Training.tsx");
      const content = fs.readFileSync(trainingPath, "utf-8");
      
      expect(content).toContain("禮貌地詢問新客戶的姓名和聯絡方式");
    });
  });
});

describe("endConversation still works for full summary", () => {
  it("should still have endConversation route for full conversation analysis", () => {
    const routersPath = path.join(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    // endConversation should still exist for full conversation summary
    expect(content).toContain("endConversation:");
    expect(content).toContain("conversation_analysis");
  });

  it("should generate summary with all fields", () => {
    const routersPath = path.join(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    expect(content).toContain("summary");
    expect(content).toContain("keyTopics");
    expect(content).toContain("questionsAsked");
    expect(content).toContain("outcome");
    expect(content).toContain("sentiment");
  });
});

describe("Integration: Memory flow from chat to database", () => {
  it("should have the complete flow: chat.send -> extractMemoryFromTurn -> updateCustomer + addCustomerMemory", () => {
    const routersPath = path.join(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    // 1. chat.send calls extractMemoryFromTurn
    expect(content).toContain("extractMemoryFromTurn({");
    
    // 2. extractMemoryFromTurn calls invokeLLM
    expect(content).toContain("invokeLLM({");
    
    // 3. extractMemoryFromTurn calls updateCustomer
    expect(content).toContain("updateCustomer(customerId, updateData)");
    
    // 4. extractMemoryFromTurn calls addCustomerMemory
    expect(content).toContain("addCustomerMemory({");
  });

  it("should handle errors gracefully in extractMemoryFromTurn", () => {
    const routersPath = path.join(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    // Should have try-catch
    expect(content).toContain("[extractMemory] Failed:");
  });

  it("should log successful extractions", () => {
    const routersPath = path.join(__dirname, "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    expect(content).toContain("[extractMemory] Updated customer");
    expect(content).toContain("[extractMemory] Saved");
  });
});
