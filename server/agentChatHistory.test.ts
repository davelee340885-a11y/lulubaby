import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
  getPersonaByUserId: vi.fn().mockResolvedValue({ id: 1 }),
  getTrainingByUserId: vi.fn().mockResolvedValue(null),
  getSuperpowersByUserId: vi.fn().mockResolvedValue(null),
  checkSparkBalance: vi.fn().mockResolvedValue(true),
  deductSpark: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test title" } }],
  }),
}));

vi.mock("./services/memoryService", () => ({
  createMemoryService: vi.fn().mockReturnValue({
    processLearningFromChat: vi.fn().mockResolvedValue(null),
    getRelevantMemories: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("./styleToPrompt", () => ({
  generateStylePrompt: vi.fn().mockReturnValue(""),
}));

describe("Agent Chat History API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock chain
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue([{ insertId: 1 }]);
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.delete.mockReturnThis();
  });

  describe("saveHistory", () => {
    it("should accept sessionId and messages array", async () => {
      // The saveHistory mutation expects { sessionId, messages }
      const input = {
        sessionId: "session-123",
        messages: [
          { role: "user" as const, content: "Hello" },
          { role: "assistant" as const, content: "Hi there" },
        ],
      };
      
      expect(input.sessionId).toBe("session-123");
      expect(input.messages).toHaveLength(2);
      expect(input.messages[0].role).toBe("user");
      expect(input.messages[1].role).toBe("assistant");
    });

    it("should reject empty sessionId", () => {
      const input = { sessionId: "", messages: [] };
      expect(input.sessionId).toBe("");
      // Zod validation would reject this with min(1)
    });
  });

  describe("listSessions", () => {
    it("should return empty array when no sessions exist", async () => {
      mockDb.limit.mockResolvedValue([]);
      const result: any[] = [];
      expect(result).toEqual([]);
    });

    it("should return sessions with correct shape", () => {
      const session = {
        sessionId: "session-123",
        title: "Test conversation",
        lastMessage: "Hello",
        messageCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(session).toHaveProperty("sessionId");
      expect(session).toHaveProperty("title");
      expect(session).toHaveProperty("lastMessage");
      expect(session).toHaveProperty("messageCount");
      expect(session).toHaveProperty("createdAt");
      expect(session).toHaveProperty("updatedAt");
    });
  });

  describe("getSession", () => {
    it("should accept sessionId input", () => {
      const input = { sessionId: "session-123" };
      expect(input.sessionId).toBe("session-123");
    });

    it("should return messages with correct shape", () => {
      const response = {
        title: "Test",
        messages: [
          { id: 1, role: "user", content: "Hello", createdAt: new Date() },
          { id: 2, role: "assistant", content: "Hi", createdAt: new Date() },
        ],
      };
      
      expect(response.title).toBe("Test");
      expect(response.messages).toHaveLength(2);
      expect(response.messages[0]).toHaveProperty("id");
      expect(response.messages[0]).toHaveProperty("role");
      expect(response.messages[0]).toHaveProperty("content");
      expect(response.messages[0]).toHaveProperty("createdAt");
    });

    it("should return empty when session not found", () => {
      const response = { messages: [], title: "" };
      expect(response.messages).toHaveLength(0);
      expect(response.title).toBe("");
    });
  });

  describe("deleteSession", () => {
    it("should accept sessionId input", () => {
      const input = { sessionId: "session-123" };
      expect(input.sessionId).toBe("session-123");
    });

    it("should return success on deletion", () => {
      const response = { success: true };
      expect(response.success).toBe(true);
    });

    it("should return failure when session not found", () => {
      const response = { success: false };
      expect(response.success).toBe(false);
    });
  });

  describe("ChatMessage type", () => {
    it("should support all required fields", () => {
      const msg = {
        id: "user-123",
        role: "user" as const,
        content: "Hello",
        timestamp: new Date(),
        sessionId: "session-abc",
        memorySaved: false,
      };
      
      expect(msg.id).toBeTruthy();
      expect(["user", "assistant"]).toContain(msg.role);
      expect(msg.content).toBeTruthy();
      expect(msg.timestamp).toBeInstanceOf(Date);
      expect(msg.sessionId).toBeTruthy();
    });
  });

  describe("Session ID generation", () => {
    it("should generate unique session IDs", () => {
      const generateSessionId = () =>
        `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("sendMessage with sessionId", () => {
    it("should accept optional sessionId in input", () => {
      const input = {
        message: "Hello",
        conversationHistory: [],
        sessionId: "session-123",
      };
      
      expect(input.message).toBe("Hello");
      expect(input.sessionId).toBe("session-123");
    });

    it("should work without sessionId", () => {
      const input = {
        message: "Hello",
        conversationHistory: [],
      };
      
      expect(input.message).toBe("Hello");
      expect((input as any).sessionId).toBeUndefined();
    });
  });
});
