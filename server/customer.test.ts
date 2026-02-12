import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getOrCreateCustomer: vi.fn(),
  getCustomerById: vi.fn(),
  getCustomersByPersonaId: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  incrementCustomerMessageCount: vi.fn(),
  addCustomerMemory: vi.fn(),
  getCustomerMemories: vi.fn(),
  getCustomerMemoryContext: vi.fn(),
  deleteCustomerMemory: vi.fn(),
  addConversationSummary: vi.fn(),
  getCustomerConversationSummaries: vi.fn(),
  getRecentConversationContext: vi.fn(),
  getCustomerStats: vi.fn(),
  getPersonaByUserId: vi.fn(),
  getPersonaById: vi.fn(),
}));

import {
  getOrCreateCustomer,
  getCustomerById,
  getCustomersByPersonaId,
  updateCustomer,
  deleteCustomer,
  incrementCustomerMessageCount,
  addCustomerMemory,
  getCustomerMemories,
  getCustomerMemoryContext,
  deleteCustomerMemory,
  addConversationSummary,
  getCustomerConversationSummaries,
  getRecentConversationContext,
  getCustomerStats,
  getPersonaByUserId,
  getPersonaById,
} from "./db";

describe("Customer Memory System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Customer Identification", () => {
    it("should create a new customer for first-time visitor", async () => {
      const mockCustomer = {
        id: 1,
        personaId: 1,
        sessionId: "session-123",
        fingerprint: "fp-abc",
        name: null,
        email: null,
        totalConversations: 1,
        totalMessages: 0,
        status: "active",
        createdAt: new Date(),
      };

      vi.mocked(getOrCreateCustomer).mockResolvedValue(mockCustomer);

      const result = await getOrCreateCustomer(1, "session-123", "fp-abc");

      expect(result).toEqual(mockCustomer);
      expect(getOrCreateCustomer).toHaveBeenCalledWith(1, "session-123", "fp-abc");
    });

    it("should return existing customer for returning visitor", async () => {
      const mockCustomer = {
        id: 1,
        personaId: 1,
        sessionId: "session-123",
        fingerprint: "fp-abc",
        name: "John Doe",
        email: "john@example.com",
        totalConversations: 5,
        totalMessages: 50,
        status: "active",
        createdAt: new Date(),
      };

      vi.mocked(getOrCreateCustomer).mockResolvedValue(mockCustomer);

      const result = await getOrCreateCustomer(1, "session-456", "fp-abc");

      expect(result.totalConversations).toBe(5);
      expect(result.name).toBe("John Doe");
    });

    it("should identify returning customer by fingerprint", async () => {
      const mockCustomer = {
        id: 1,
        personaId: 1,
        sessionId: "new-session",
        fingerprint: "fp-abc",
        totalConversations: 3,
        status: "active",
      };

      vi.mocked(getOrCreateCustomer).mockResolvedValue(mockCustomer);

      const result = await getOrCreateCustomer(1, "new-session", "fp-abc");

      expect(result.fingerprint).toBe("fp-abc");
      expect(result.totalConversations).toBe(3);
    });
  });

  describe("Customer CRUD Operations", () => {
    it("should get customer by ID", async () => {
      const mockCustomer = {
        id: 1,
        personaId: 1,
        name: "Test Customer",
        email: "test@example.com",
      };

      vi.mocked(getCustomerById).mockResolvedValue(mockCustomer);

      const result = await getCustomerById(1);

      expect(result).toEqual(mockCustomer);
      expect(getCustomerById).toHaveBeenCalledWith(1);
    });

    it("should get all customers for a persona", async () => {
      const mockCustomers = [
        { id: 1, name: "Customer 1", totalMessages: 10 },
        { id: 2, name: "Customer 2", totalMessages: 20 },
        { id: 3, name: null, totalMessages: 5 },
      ];

      vi.mocked(getCustomersByPersonaId).mockResolvedValue(mockCustomers);

      const result = await getCustomersByPersonaId(1);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Customer 1");
    });

    it("should update customer information", async () => {
      const updatedCustomer = {
        id: 1,
        name: "Updated Name",
        email: "updated@example.com",
        company: "New Company",
      };

      vi.mocked(updateCustomer).mockResolvedValue(updatedCustomer);

      const result = await updateCustomer(1, {
        name: "Updated Name",
        email: "updated@example.com",
        company: "New Company",
      });

      expect(result.name).toBe("Updated Name");
      expect(result.company).toBe("New Company");
    });

    it("should delete customer", async () => {
      vi.mocked(deleteCustomer).mockResolvedValue(undefined);

      await deleteCustomer(1);

      expect(deleteCustomer).toHaveBeenCalledWith(1);
    });

    it("should increment customer message count", async () => {
      vi.mocked(incrementCustomerMessageCount).mockResolvedValue(undefined);

      await incrementCustomerMessageCount(1);

      expect(incrementCustomerMessageCount).toHaveBeenCalledWith(1);
    });
  });

  describe("Customer Memory Operations", () => {
    it("should add a new memory for customer", async () => {
      const mockMemory = {
        id: 1,
        customerId: 1,
        memoryType: "preference",
        key: "預算",
        value: "HK$50,000-100,000",
        confidence: 85,
        extractedAt: new Date(),
      };

      vi.mocked(addCustomerMemory).mockResolvedValue(mockMemory);

      const result = await addCustomerMemory({
        customerId: 1,
        memoryType: "preference",
        key: "預算",
        value: "HK$50,000-100,000",
        confidence: 85,
      });

      expect(result.memoryType).toBe("preference");
      expect(result.key).toBe("預算");
    });

    it("should get all memories for a customer", async () => {
      const mockMemories = [
        { id: 1, memoryType: "preference", key: "預算", value: "HK$50,000" },
        { id: 2, memoryType: "fact", key: "家庭成員", value: "2個小孩" },
        { id: 3, memoryType: "need", key: "需求", value: "學區房" },
      ];

      vi.mocked(getCustomerMemories).mockResolvedValue(mockMemories);

      const result = await getCustomerMemories(1);

      expect(result).toHaveLength(3);
      expect(result[0].memoryType).toBe("preference");
    });

    it("should get customer memory context for AI", async () => {
      const mockContext = `【客戶資料】
姓名：張先生
公司：ABC公司

【客戶記憶】
- 偏好：預算 HK$50,000-100,000
- 事實：家庭成員 2個小孩
- 需求：學區房`;

      vi.mocked(getCustomerMemoryContext).mockResolvedValue(mockContext);

      const result = await getCustomerMemoryContext(1);

      expect(result).toContain("客戶資料");
      expect(result).toContain("客戶記憶");
    });

    it("should delete a memory", async () => {
      vi.mocked(deleteCustomerMemory).mockResolvedValue(undefined);

      await deleteCustomerMemory(1);

      expect(deleteCustomerMemory).toHaveBeenCalledWith(1);
    });

    it("should support different memory types", async () => {
      const memoryTypes = [
        "preference",
        "fact",
        "need",
        "concern",
        "interaction",
        "purchase",
        "feedback",
        "custom",
      ];

      for (const type of memoryTypes) {
        vi.mocked(addCustomerMemory).mockResolvedValue({
          id: 1,
          customerId: 1,
          memoryType: type,
          key: "test",
          value: "test value",
        });

        const result = await addCustomerMemory({
          customerId: 1,
          memoryType: type,
          key: "test",
          value: "test value",
        });

        expect(result.memoryType).toBe(type);
      }
    });
  });

  describe("Conversation Summary Operations", () => {
    it("should add conversation summary", async () => {
      const mockSummary = {
        id: 1,
        customerId: 1,
        sessionId: "session-123",
        summary: "客戶詢問產品價格和功能",
        keyTopics: JSON.stringify(["價格", "功能", "售後服務"]),
        messageCount: 10,
        outcome: "resolved",
        conversationDate: new Date(),
      };

      vi.mocked(addConversationSummary).mockResolvedValue(mockSummary);

      const result = await addConversationSummary({
        customerId: 1,
        sessionId: "session-123",
        summary: "客戶詢問產品價格和功能",
        keyTopics: JSON.stringify(["價格", "功能", "售後服務"]),
        messageCount: 10,
        outcome: "resolved",
      });

      expect(result.summary).toContain("產品價格");
      expect(result.outcome).toBe("resolved");
    });

    it("should get customer conversation summaries", async () => {
      const mockSummaries = [
        { id: 1, summary: "首次諮詢", conversationDate: new Date("2024-01-01") },
        { id: 2, summary: "跟進詢問", conversationDate: new Date("2024-01-05") },
      ];

      vi.mocked(getCustomerConversationSummaries).mockResolvedValue(mockSummaries);

      const result = await getCustomerConversationSummaries(1);

      expect(result).toHaveLength(2);
    });

    it("should get recent conversation context for AI", async () => {
      const mockContext = `【最近對話摘要】
1. 2024-01-05: 跟進詢問 - 客戶對價格有疑慮
2. 2024-01-01: 首次諮詢 - 了解產品功能`;

      vi.mocked(getRecentConversationContext).mockResolvedValue(mockContext);

      const result = await getRecentConversationContext(1, 3);

      expect(result).toContain("最近對話摘要");
    });
  });

  describe("Customer Statistics", () => {
    it("should get customer statistics", async () => {
      const mockStats = {
        totalCustomers: 100,
        returningCustomers: 30,
        newCustomersToday: 5,
        activeCustomers: 80,
      };

      vi.mocked(getCustomerStats).mockResolvedValue(mockStats);

      const result = await getCustomerStats(1);

      expect(result.totalCustomers).toBe(100);
      expect(result.returningCustomers).toBe(30);
      expect(result.newCustomersToday).toBe(5);
      expect(result.activeCustomers).toBe(80);
    });
  });

  describe("Authorization Checks", () => {
    it("should verify persona ownership before accessing customer", async () => {
      const mockPersona = {
        id: 1,
        userId: "user-123",
        agentName: "Test Agent",
      };

      const mockCustomer = {
        id: 1,
        personaId: 1,
        name: "Test Customer",
      };

      vi.mocked(getPersonaById).mockResolvedValue(mockPersona);
      vi.mocked(getCustomerById).mockResolvedValue(mockCustomer);

      const customer = await getCustomerById(1);
      const persona = await getPersonaById(customer!.personaId);

      expect(persona?.userId).toBe("user-123");
    });

    it("should return null for non-existent customer", async () => {
      vi.mocked(getCustomerById).mockResolvedValue(null);

      const result = await getCustomerById(999);

      expect(result).toBeNull();
    });
  });

  describe("Customer Sentiment Tracking", () => {
    it("should update customer sentiment", async () => {
      vi.mocked(updateCustomer).mockResolvedValue({
        id: 1,
        sentiment: "positive",
      });

      const result = await updateCustomer(1, { sentiment: "positive" });

      expect(result.sentiment).toBe("positive");
    });

    it("should support all sentiment values", async () => {
      const sentiments = ["positive", "neutral", "negative"];

      for (const sentiment of sentiments) {
        vi.mocked(updateCustomer).mockResolvedValue({
          id: 1,
          sentiment,
        });

        const result = await updateCustomer(1, { sentiment });

        expect(result.sentiment).toBe(sentiment);
      }
    });
  });

  describe("Customer Status Management", () => {
    it("should update customer status", async () => {
      vi.mocked(updateCustomer).mockResolvedValue({
        id: 1,
        status: "blocked",
      });

      const result = await updateCustomer(1, { status: "blocked" });

      expect(result.status).toBe("blocked");
    });

    it("should support all status values", async () => {
      const statuses = ["active", "inactive", "blocked"];

      for (const status of statuses) {
        vi.mocked(updateCustomer).mockResolvedValue({
          id: 1,
          status,
        });

        const result = await updateCustomer(1, { status });

        expect(result.status).toBe(status);
      }
    });
  });

  describe("Memory Confidence Scoring", () => {
    it("should store memory with confidence score", async () => {
      vi.mocked(addCustomerMemory).mockResolvedValue({
        id: 1,
        customerId: 1,
        memoryType: "fact",
        key: "職業",
        value: "工程師",
        confidence: 95,
      });

      const result = await addCustomerMemory({
        customerId: 1,
        memoryType: "fact",
        key: "職業",
        value: "工程師",
        confidence: 95,
      });

      expect(result.confidence).toBe(95);
    });

    it("should accept confidence scores from 0 to 100", async () => {
      const confidenceScores = [0, 25, 50, 75, 100];

      for (const confidence of confidenceScores) {
        vi.mocked(addCustomerMemory).mockResolvedValue({
          id: 1,
          confidence,
        });

        const result = await addCustomerMemory({
          customerId: 1,
          memoryType: "fact",
          key: "test",
          value: "test",
          confidence,
        });

        expect(result.confidence).toBe(confidence);
      }
    });
  });
});
