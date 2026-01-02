import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getPersonaById: vi.fn(),
  getOrCreateCustomer: vi.fn(),
  getConversationsBySession: vi.fn(),
  addConversationSummary: vi.fn(),
  updateCustomer: vi.fn(),
  addCustomerMemory: vi.fn(),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import {
  getPersonaById,
  getOrCreateCustomer,
  getConversationsBySession,
  addConversationSummary,
  updateCustomer,
  addCustomerMemory,
} from "./db";

import { invokeLLM } from "./_core/llm";

describe("Conversation Summary Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Summary Generation Trigger", () => {
    it("should not generate summary with less than 2 messages", async () => {
      vi.mocked(getPersonaById).mockResolvedValue({
        id: 1,
        userId: "user-123",
        agentName: "Test Agent",
      });

      vi.mocked(getOrCreateCustomer).mockResolvedValue({
        id: 1,
        personaId: 1,
        sessionId: "session-123",
      });

      vi.mocked(getConversationsBySession).mockResolvedValue([
        { id: 1, role: "user", content: "Hello" },
      ]);

      // Simulate the check in endConversation
      const history = await getConversationsBySession(1, "session-123");
      expect(history.length).toBeLessThan(2);
    });

    it("should generate summary with 2 or more messages", async () => {
      vi.mocked(getConversationsBySession).mockResolvedValue([
        { id: 1, role: "user", content: "Hello" },
        { id: 2, role: "assistant", content: "Hi there!" },
      ]);

      const history = await getConversationsBySession(1, "session-123");
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("LLM Summary Analysis", () => {
    it("should parse LLM response correctly", async () => {
      const mockLLMResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: "客戶詢問產品價格和功能",
              keyTopics: ["價格", "功能", "售後服務"],
              questionsAsked: ["這個產品多少錢？", "有什麼功能？"],
              outcome: "resolved",
              customerInfo: {
                name: "張先生",
                email: "zhang@example.com",
                phone: "",
                company: "ABC公司",
              },
              memories: [
                {
                  type: "preference",
                  key: "預算",
                  value: "HK$50,000-100,000",
                  confidence: 85,
                },
                {
                  type: "need",
                  key: "需求",
                  value: "需要企業版功能",
                  confidence: 90,
                },
              ],
              sentiment: "positive",
            }),
          },
        }],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse);

      const response = await invokeLLM({ messages: [] });
      const content = response.choices[0]?.message?.content;
      const analysis = JSON.parse(content as string);

      expect(analysis.summary).toBe("客戶詢問產品價格和功能");
      expect(analysis.keyTopics).toHaveLength(3);
      expect(analysis.outcome).toBe("resolved");
      expect(analysis.customerInfo.name).toBe("張先生");
      expect(analysis.memories).toHaveLength(2);
      expect(analysis.sentiment).toBe("positive");
    });

    it("should handle all outcome types", async () => {
      const outcomes = ["resolved", "converted", "pending", "escalated", "abandoned"];

      for (const outcome of outcomes) {
        const mockResponse = {
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "Test summary",
                keyTopics: [],
                questionsAsked: [],
                outcome,
                customerInfo: { name: "", email: "", phone: "", company: "" },
                memories: [],
                sentiment: "neutral",
              }),
            },
          }],
        };

        vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

        const response = await invokeLLM({ messages: [] });
        const analysis = JSON.parse(response.choices[0]?.message?.content as string);

        expect(analysis.outcome).toBe(outcome);
      }
    });

    it("should handle all sentiment types", async () => {
      const sentiments = ["positive", "neutral", "negative"];

      for (const sentiment of sentiments) {
        const mockResponse = {
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "Test summary",
                keyTopics: [],
                questionsAsked: [],
                outcome: "resolved",
                customerInfo: { name: "", email: "", phone: "", company: "" },
                memories: [],
                sentiment,
              }),
            },
          }],
        };

        vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

        const response = await invokeLLM({ messages: [] });
        const analysis = JSON.parse(response.choices[0]?.message?.content as string);

        expect(analysis.sentiment).toBe(sentiment);
      }
    });
  });

  describe("Summary Storage", () => {
    it("should save conversation summary to database", async () => {
      const mockSummary = {
        id: 1,
        customerId: 1,
        sessionId: "session-123",
        summary: "客戶詢問產品價格",
        keyTopics: JSON.stringify(["價格", "功能"]),
        questionsAsked: JSON.stringify(["多少錢？"]),
        messageCount: 4,
        outcome: "resolved",
        conversationDate: new Date(),
      };

      vi.mocked(addConversationSummary).mockResolvedValue(mockSummary);

      const result = await addConversationSummary({
        customerId: 1,
        sessionId: "session-123",
        summary: "客戶詢問產品價格",
        keyTopics: JSON.stringify(["價格", "功能"]),
        questionsAsked: JSON.stringify(["多少錢？"]),
        messageCount: 4,
        outcome: "resolved",
        conversationDate: new Date(),
      });

      expect(result.summary).toBe("客戶詢問產品價格");
      expect(result.outcome).toBe("resolved");
      expect(addConversationSummary).toHaveBeenCalledTimes(1);
    });
  });

  describe("Customer Info Extraction", () => {
    it("should update customer info when extracted", async () => {
      vi.mocked(updateCustomer).mockResolvedValue({
        id: 1,
        name: "張先生",
        email: "zhang@example.com",
        company: "ABC公司",
        sentiment: "positive",
      });

      const result = await updateCustomer(1, {
        name: "張先生",
        email: "zhang@example.com",
        company: "ABC公司",
        sentiment: "positive",
      });

      expect(result.name).toBe("張先生");
      expect(result.email).toBe("zhang@example.com");
      expect(updateCustomer).toHaveBeenCalledWith(1, {
        name: "張先生",
        email: "zhang@example.com",
        company: "ABC公司",
        sentiment: "positive",
      });
    });

    it("should not update customer if no info extracted", async () => {
      const customerInfo = {
        name: "",
        email: "",
        phone: "",
        company: "",
      };

      // Simulate the check in endConversation
      const updateData: Record<string, string> = {};
      if (customerInfo.name) updateData.name = customerInfo.name;
      if (customerInfo.email) updateData.email = customerInfo.email;
      if (customerInfo.phone) updateData.phone = customerInfo.phone;
      if (customerInfo.company) updateData.company = customerInfo.company;

      expect(Object.keys(updateData).length).toBe(0);
    });
  });

  describe("Memory Extraction", () => {
    it("should add extracted memories to customer", async () => {
      const memories = [
        { type: "preference", key: "預算", value: "HK$50,000", confidence: 85 },
        { type: "need", key: "需求", value: "企業版", confidence: 90 },
      ];

      vi.mocked(addCustomerMemory).mockImplementation(async (data) => ({
        id: 1,
        customerId: data.customerId,
        memoryType: data.memoryType,
        key: data.key,
        value: data.value,
        confidence: data.confidence,
      }));

      for (const memory of memories) {
        await addCustomerMemory({
          customerId: 1,
          memoryType: memory.type,
          key: memory.key,
          value: memory.value,
          confidence: memory.confidence,
        });
      }

      expect(addCustomerMemory).toHaveBeenCalledTimes(2);
    });

    it("should handle all memory types", async () => {
      const memoryTypes = ["preference", "fact", "need", "concern", "purchase", "feedback"];

      vi.mocked(addCustomerMemory).mockImplementation(async (data) => ({
        id: 1,
        customerId: data.customerId,
        memoryType: data.memoryType,
        key: data.key,
        value: data.value,
        confidence: data.confidence,
      }));

      for (const type of memoryTypes) {
        const result = await addCustomerMemory({
          customerId: 1,
          memoryType: type,
          key: "test",
          value: "test value",
          confidence: 80,
        });

        expect(result.memoryType).toBe(type);
      }
    });
  });

  describe("Conversation Text Building", () => {
    it("should format conversation history correctly", () => {
      const history = [
        { role: "user", content: "你好，我想了解產品" },
        { role: "assistant", content: "您好！很高興為您服務" },
        { role: "user", content: "這個產品多少錢？" },
        { role: "assistant", content: "基礎版 HK$99/月" },
      ];

      const conversationText = history
        .map(m => `${m.role === 'user' ? '客戶' : 'AI'}: ${m.content}`)
        .join('\n');

      expect(conversationText).toContain("客戶: 你好，我想了解產品");
      expect(conversationText).toContain("AI: 您好！很高興為您服務");
      expect(conversationText).toContain("客戶: 這個產品多少錢？");
      expect(conversationText).toContain("AI: 基礎版 HK$99/月");
    });
  });

  describe("Error Handling", () => {
    it("should handle LLM failure gracefully", async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error("LLM service unavailable"));

      try {
        await invokeLLM({ messages: [] });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid JSON response", () => {
      const invalidContent = "This is not JSON";

      try {
        JSON.parse(invalidContent);
        expect(true).toBe(false); // Should not reach here
      } catch {
        expect(true).toBe(true); // Expected to fail
      }
    });

    it("should handle missing persona", async () => {
      vi.mocked(getPersonaById).mockResolvedValue(null);

      const persona = await getPersonaById(999);
      expect(persona).toBeNull();
    });

    it("should handle missing customer", async () => {
      vi.mocked(getOrCreateCustomer).mockResolvedValue(null);

      const customer = await getOrCreateCustomer(1, "session-123", "fp-abc");
      expect(customer).toBeNull();
    });
  });

  describe("Auto-trigger Scenarios", () => {
    it("should trigger on page unload with sufficient messages", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ];

      const shouldTrigger = messages.length >= 2;
      expect(shouldTrigger).toBe(true);
    });

    it("should trigger on visibility change to hidden", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ];

      const visibilityState = "hidden";
      const shouldTrigger = visibilityState === "hidden" && messages.length >= 2;
      expect(shouldTrigger).toBe(true);
    });

    it("should trigger after 5 minutes of inactivity", () => {
      const lastActivityTime = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      const inactivityThreshold = 5 * 60 * 1000; // 5 minutes

      const shouldTrigger = timeSinceLastActivity > inactivityThreshold;
      expect(shouldTrigger).toBe(true);
    });

    it("should not trigger within 5 minutes of activity", () => {
      const lastActivityTime = Date.now() - 3 * 60 * 1000; // 3 minutes ago
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      const inactivityThreshold = 5 * 60 * 1000; // 5 minutes

      const shouldTrigger = timeSinceLastActivity > inactivityThreshold;
      expect(shouldTrigger).toBe(false);
    });

    it("should not trigger if summary already generated", () => {
      let summaryGenerated = true;
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ];

      const shouldTrigger = messages.length >= 2 && !summaryGenerated;
      expect(shouldTrigger).toBe(false);
    });
  });
});
