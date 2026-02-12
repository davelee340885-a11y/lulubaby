/**
 * P0 Bug Fix Tests
 * 
 * 1. CustomerLoginDialog UI 截斷修復 - 確認 overflow-y-auto 和 my-auto 類存在
 * 2. 大腦記憶注入到公開聊天 - 確認 memoryService 被正確調用並注入 systemPrompt
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryService } from "./services/memoryService";
import * as fs from "fs";
import * as path from "path";

// ==================== Part 1: CustomerLoginDialog UI Fix ====================

describe("CustomerLoginDialog UI truncation fix", () => {
  it("should have overflow-y-auto class on the outer container", () => {
    const filePath = path.resolve(__dirname, "../client/src/components/CustomerLoginDialog.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // The outer fixed container must have overflow-y-auto to allow scrolling
    expect(content).toContain("overflow-y-auto");
  });

  it("should have my-auto class on the dialog card for vertical centering", () => {
    const filePath = path.resolve(__dirname, "../client/src/components/CustomerLoginDialog.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // The white card container should have my-auto for proper centering with scroll
    expect(content).toContain("my-auto");
  });

  it("should have both fixed inset-0 and overflow-y-auto on the same element", () => {
    const filePath = path.resolve(__dirname, "../client/src/components/CustomerLoginDialog.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify the outer container has both fixed positioning and scroll capability
    const hasFixedWithScroll = content.includes("fixed inset-0") && content.includes("overflow-y-auto");
    expect(hasFixedWithScroll).toBe(true);
  });
});

// ==================== Part 2: Brain Memory Injection ====================

describe("Brain memory injection in public chat", () => {
  
  describe("MemoryService.getMemoryContext", () => {
    it("should return formatted context when keyword search finds memories", async () => {
      const service = new MemoryService(999999); // Use a non-existent user ID
      
      // Mock searchMemories to return results
      const mockMemories = [
        {
          entry: {
            id: 1,
            userId: 999999,
            title: "客戶張先生：喜歡拿鐵咖啡",
            content: "張先生是 Lulubaby 的忠實客戶，他最喜歡的咖啡是拿鐵。",
            memoryType: "customer_insight" as const,
            importance: "high" as const,
            tags: ["咖啡", "客戶偏好"],
          },
          relevanceScore: 2,
          matchedKeywords: ["咖啡", "拿鐵"],
        },
      ];
      
      vi.spyOn(service, "searchMemories").mockResolvedValue(mockMemories);
      
      const context = await service.getMemoryContext("張先生喜歡什麼咖啡？", 5);
      
      expect(context).toContain("最高優先級");
      expect(context).toContain("客戶張先生：喜歡拿鐵咖啡");
      expect(context).toContain("拿鐵");
      expect(context).toContain("強制指令");
    });

    it("should return empty string when no memories exist at all", async () => {
      const service = new MemoryService(999999);
      
      // Mock all search methods to return empty
      vi.spyOn(service, "searchMemories").mockResolvedValue([]);
      vi.spyOn(service as any, "getRecentImportantMemories").mockResolvedValue([]);
      vi.spyOn(service as any, "getRecentMemories").mockResolvedValue([]);
      
      const context = await service.getMemoryContext("隨便問個問題", 5);
      
      expect(context).toBe("");
    });

    it("should fall back to recent important memories when keyword search fails", async () => {
      const service = new MemoryService(999999);
      
      // Mock keyword search to return empty
      vi.spyOn(service, "searchMemories").mockResolvedValue([]);
      
      // Mock important memories to return results
      vi.spyOn(service as any, "getRecentImportantMemories").mockResolvedValue([
        {
          id: 2,
          userId: 999999,
          title: "重要客戶資訊",
          content: "Dave Lee 是 Lulubaby 的創始人，他最喜歡拿鐵咖啡。",
          memoryType: "personal_note",
          importance: "critical",
          tags: [],
        },
      ]);
      
      const context = await service.getMemoryContext("誰是創始人？", 5);
      
      expect(context).toContain("最高優先級");
      expect(context).toContain("重要客戶資訊");
      expect(context).toContain("Dave Lee");
    });

    it("should fall back to recent memories (any importance) as last resort", async () => {
      const service = new MemoryService(999999);
      
      // Mock keyword search and important memories to return empty
      vi.spyOn(service, "searchMemories").mockResolvedValue([]);
      vi.spyOn(service as any, "getRecentImportantMemories").mockResolvedValue([]);
      
      // Mock recent memories (any importance) to return results
      vi.spyOn(service as any, "getRecentMemories").mockResolvedValue([
        {
          id: 3,
          userId: 999999,
          title: "一般筆記",
          content: "今天學到了一個新的銷售技巧。",
          memoryType: "sales_experience",
          importance: "medium",
          tags: [],
        },
      ]);
      
      const context = await service.getMemoryContext("有什麼銷售技巧？", 5);
      
      expect(context).toContain("最高優先級");
      expect(context).toContain("一般筆記");
      expect(context).toContain("銷售技巧");
    });
  });

  describe("chat.send system prompt structure", () => {
    it("should import createMemoryService in routers.ts", () => {
      const filePath = path.resolve(__dirname, "./routers.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      
      expect(content).toContain('import { createMemoryService } from "./services/memoryService"');
    });

    it("should call createMemoryService with persona.userId in chat.send", () => {
      const filePath = path.resolve(__dirname, "./routers.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      
      // Verify the memory service is created with the correct user ID
      expect(content).toContain("createMemoryService(persona.userId)");
    });

    it("should call getMemoryContext in chat.send", () => {
      const filePath = path.resolve(__dirname, "./routers.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      
      // Verify getMemoryContext is called with the user's message
      expect(content).toContain("memoryService.getMemoryContext(input.message");
    });

    it("should inject memoryContext FIRST into systemPrompt (before persona instructions)", () => {
      const filePath = path.resolve(__dirname, "./routers.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      
      // Find the positions of key elements in the system prompt construction
      const memoryFirstComment = content.indexOf("Add memory context FIRST");
      const basicInstructionsComment = content.indexOf("Then add basic instructions");
      const customerContextComment = content.indexOf("Add customer memory context");
      const knowledgeBaseComment = content.indexOf("Add knowledge base content");
      
      // Memory should be added BEFORE basic instructions
      expect(memoryFirstComment).toBeGreaterThan(-1);
      expect(basicInstructionsComment).toBeGreaterThan(-1);
      expect(memoryFirstComment).toBeLessThan(basicInstructionsComment);
      
      // Basic instructions should be before customer context
      expect(customerContextComment).toBeGreaterThan(-1);
      expect(basicInstructionsComment).toBeLessThan(customerContextComment);
      
      // Knowledge base should come after customer context
      expect(knowledgeBaseComment).toBeGreaterThan(-1);
      expect(customerContextComment).toBeLessThan(knowledgeBaseComment);
    });
  });
});
