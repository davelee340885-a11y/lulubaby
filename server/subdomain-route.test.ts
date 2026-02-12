/**
 * Subdomain Route Tests
 * 
 * Validates the /s/:subdomain main-site route as a temporary alternative
 * to xxx.lulubaby.xyz subdomain-based chat access.
 * 
 * Architecture: SubdomainChat.tsx is a lightweight wrapper that resolves
 * subdomain → personaId, then delegates to CustomerChatClient.tsx for
 * all chat functionality (messages, quick buttons, suggested questions, etc.)
 */

import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ==================== Part 1: SubdomainChat Page Component ====================

describe("SubdomainChat page component", () => {
  const filePath = path.resolve(__dirname, "../client/src/pages/SubdomainChat.tsx");

  it("should exist as a page component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should use useParams to extract subdomain from URL", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("useParams");
    expect(content).toContain("subdomain");
  });

  it("should call subdomain.resolve API with the subdomain parameter", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("trpc.subdomain.resolve.useQuery");
    expect(content).toContain("{ subdomain }");
  });

  it("should delegate to CustomerChatClient with resolved personaId", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("CustomerChatClient");
    expect(content).toContain("personaId");
  });

  it("should handle error state when subdomain is not found", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("找不到此智能體");
  });

  it("should handle loading state", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("載入中");
    expect(content).toContain("Loader2");
  });
});

// ==================== Part 1b: CustomerChatClient Unified Component ====================

describe("CustomerChatClient unified component", () => {
  const filePath = path.resolve(__dirname, "../client/src/components/CustomerChatClient.tsx");

  it("should exist as a shared component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should call persona.getPublic API with personaId", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("trpc.persona.getPublic.useQuery");
    expect(content).toContain("personaId");
  });

  it("should call chat.send mutation for sending messages", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("trpc.chat.send.useMutation");
  });

  it("should call chat.history for loading conversation history", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("trpc.chat.history.useQuery");
  });

  it("should not include login components (client UI doesn't need login)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // Login components were intentionally removed from client UI
    expect(content).not.toContain("LoginButton");
    expect(content).not.toContain("LoginIconButton");
    expect(content).not.toContain("CustomerLoginDialog");
  });

  it("should support quick buttons and suggested questions", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("QuickButtonGroup");
    expect(content).toContain("suggestedQuestions");
    expect(content).toContain("handleSuggestedQuestion");
  });

  it("should support multiple layout styles (minimal, professional, custom)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("MinimalLayout");
    expect(content).toContain("ProfessionalLayout");
    expect(content).toContain("CustomLayout");
  });

  it("should support isInternalTraining prop for return-to-dashboard button", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("isInternalTraining");
    expect(content).toContain("ReturnToDashboardButton");
  });
});

// ==================== Part 2: Route Registration ====================

describe("Route registration in App.tsx", () => {
  const filePath = path.resolve(__dirname, "../client/src/App.tsx");

  it("should import SubdomainChat component", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('import SubdomainChat from "./pages/SubdomainChat"');
  });

  it("should register /s/:subdomain route for lulubaby.xyz main domain", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // Check the route exists in the lulubaby main domain section
    expect(content).toContain('path="/s/:subdomain"');
    expect(content).toContain("component={SubdomainChat}");
  });

  it("should register /s/:subdomain route for Manus preview domain", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // After v3.12.0 route refactor, /s/:subdomain appears once in the unified Switch block
    // (serves both lulubaby.xyz and manus preview domains)
    const matches = content.match(/path="\/s\/:subdomain"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(1);
  });
});

// ==================== Part 3: URL Display Updates ====================

describe("URL display updates in Dashboard and Domain pages", () => {
  it("should display /s/subdomain URL in Dashboard", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/Dashboard.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("lulubaby.xyz/s/");
  });

  it("should display /s/subdomain URL in Domain page", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/Domain.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("lulubaby.xyz/s/");
  });

  it("should prioritize published custom domain over /s/ route in Dashboard", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/Dashboard.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    // publishedDomain check should come before subdomain check
    const publishedIdx = content.indexOf("publishedDomain?.url");
    const subdomainIdx = content.indexOf("subdomainData?.subdomain");
    expect(publishedIdx).toBeGreaterThan(-1);
    expect(subdomainIdx).toBeGreaterThan(-1);
    expect(publishedIdx).toBeLessThan(subdomainIdx);
  });

  it("should prioritize published custom domain over /s/ route in Domain page", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/Domain.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const publishedIdx = content.indexOf("publishedDomain?.url");
    const subdomainIdx = content.indexOf("subdomainData?.subdomain");
    expect(publishedIdx).toBeGreaterThan(-1);
    expect(subdomainIdx).toBeGreaterThan(-1);
    expect(publishedIdx).toBeLessThan(subdomainIdx);
  });
});

// ==================== Part 4: Chat Component Consolidation ====================

describe("Chat component consolidation", () => {
  it("Chat.tsx should delegate to CustomerChatClient", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/Chat.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("CustomerChatClient");
    expect(content).toContain("personaId");
  });

  it("CustomDomainChat.tsx should delegate to CustomerChatClient", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/CustomDomainChat.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("CustomerChatClient");
    expect(content).toContain("personaId");
  });

  it("SubdomainChat.tsx should delegate to CustomerChatClient", () => {
    const filePath = path.resolve(__dirname, "../client/src/pages/SubdomainChat.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("CustomerChatClient");
    expect(content).toContain("personaId");
  });
});
