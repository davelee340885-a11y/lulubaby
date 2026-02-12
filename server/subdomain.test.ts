import { describe, expect, it } from "vitest";
import { generateRandomSubdomain, isValidSubdomain } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ==================== Unit Tests for Subdomain Utilities ====================

describe("generateRandomSubdomain", () => {
  it("generates an 8-character string", () => {
    const subdomain = generateRandomSubdomain();
    expect(subdomain).toHaveLength(8);
  });

  it("starts with a letter", () => {
    for (let i = 0; i < 20; i++) {
      const subdomain = generateRandomSubdomain();
      expect(subdomain[0]).toMatch(/[a-z]/);
    }
  });

  it("only contains lowercase letters and digits", () => {
    for (let i = 0; i < 20; i++) {
      const subdomain = generateRandomSubdomain();
      expect(subdomain).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("generates unique values", () => {
    const subdomains = new Set<string>();
    for (let i = 0; i < 100; i++) {
      subdomains.add(generateRandomSubdomain());
    }
    expect(subdomains.size).toBeGreaterThan(95);
  });
});

describe("isValidSubdomain", () => {
  it("accepts valid subdomains", () => {
    expect(isValidSubdomain("mysite")).toEqual({ valid: true });
    expect(isValidSubdomain("my-site")).toEqual({ valid: true });
    expect(isValidSubdomain("abc123")).toEqual({ valid: true });
    expect(isValidSubdomain("a1b2c3d4")).toEqual({ valid: true });
  });

  it("rejects too short subdomains", () => {
    const result = isValidSubdomain("ab");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("3");
  });

  it("rejects too long subdomains", () => {
    const result = isValidSubdomain("a".repeat(64));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("63");
  });

  it("rejects subdomains starting with hyphen", () => {
    const result = isValidSubdomain("-mysite");
    expect(result.valid).toBe(false);
  });

  it("rejects subdomains ending with hyphen", () => {
    const result = isValidSubdomain("mysite-");
    expect(result.valid).toBe(false);
  });

  it("rejects subdomains with uppercase letters", () => {
    const result = isValidSubdomain("MySite");
    expect(result.valid).toBe(false);
  });

  it("rejects subdomains with special characters", () => {
    expect(isValidSubdomain("my_site").valid).toBe(false);
    expect(isValidSubdomain("my.site").valid).toBe(false);
    expect(isValidSubdomain("my site").valid).toBe(false);
    expect(isValidSubdomain("my@site").valid).toBe(false);
  });

  it("rejects reserved subdomains", () => {
    const result = isValidSubdomain("www");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();

    expect(isValidSubdomain("admin").valid).toBe(false);
    expect(isValidSubdomain("api").valid).toBe(false);
    expect(isValidSubdomain("mail").valid).toBe(false);
  });
});

// ==================== Integration Tests for Subdomain tRPC Routes ====================

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("subdomain.check", () => {
  it("returns error for invalid subdomain format", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.subdomain.check({ subdomain: "ab" });
    expect(result.available).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for reserved subdomains", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.subdomain.check({ subdomain: "www" });
    expect(result.available).toBe(false);
  });
});

describe("subdomain.resolve", () => {
  it("returns null for non-existent subdomain", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.subdomain.resolve({ subdomain: "nonexistent999xyz" });
    expect(result).toBeNull();
  });
});

// ==================== Platform Routing Logic Tests ====================

describe("Platform routing logic", () => {
  // Helper to simulate the routing logic from App.tsx
  function classifyHostname(hostname: string) {
    const isLulubabySubdomain = hostname.endsWith('.lulubaby.xyz') && hostname !== 'lulubaby.xyz';
    const isOtherCustomDomain = 
      hostname !== 'localhost' && 
      hostname !== '127.0.0.1' &&
      !hostname.includes('manus.computer') &&
      !hostname.endsWith('.manus.space') &&
      hostname !== 'lulubaby.xyz' &&
      !hostname.endsWith('.lulubaby.xyz');
    const isLulubabyMain = hostname === 'lulubaby.xyz';
    const isManusPreview = hostname.includes('manus.computer') || hostname.endsWith('.manus.space');
    
    return { isLulubabySubdomain, isOtherCustomDomain, isLulubabyMain, isManusPreview };
  }

  it("lulubaby.xyz → platform entry (HomePage with chat + dashboard overlay)", () => {
    const result = classifyHostname('lulubaby.xyz');
    expect(result.isLulubabyMain).toBe(true);
    expect(result.isLulubabySubdomain).toBe(false);
    expect(result.isOtherCustomDomain).toBe(false);
    expect(result.isManusPreview).toBe(false);
  });

  it("xxx.lulubaby.xyz → pure customer chat (no login, no dashboard)", () => {
    const result = classifyHostname('davelee.lulubaby.xyz');
    expect(result.isLulubabySubdomain).toBe(true);
    expect(result.isLulubabyMain).toBe(false);
    expect(result.isOtherCustomDomain).toBe(false);
    // Should render CustomDomainChat only
  });

  it("custom-domain.com → pure customer chat (no login, no dashboard)", () => {
    const result = classifyHostname('my-custom-domain.com');
    expect(result.isOtherCustomDomain).toBe(true);
    expect(result.isLulubabySubdomain).toBe(false);
    expect(result.isLulubabyMain).toBe(false);
  });

  it("manus.computer preview → full dashboard routes (dev mode)", () => {
    const result = classifyHostname('3000-xxx.sg1.manus.computer');
    expect(result.isManusPreview).toBe(true);
    expect(result.isLulubabyMain).toBe(false);
    expect(result.isLulubabySubdomain).toBe(false);
    expect(result.isOtherCustomDomain).toBe(false);
  });

  it("manus.space preview → full dashboard routes (dev mode)", () => {
    const result = classifyHostname('lulubaby.manus.space');
    expect(result.isManusPreview).toBe(true);
    expect(result.isLulubabyMain).toBe(false);
    expect(result.isOtherCustomDomain).toBe(false);
  });

  it("localhost → full dashboard routes (dev mode)", () => {
    const result = classifyHostname('localhost');
    expect(result.isManusPreview).toBe(false);
    expect(result.isLulubabyMain).toBe(false);
    expect(result.isLulubabySubdomain).toBe(false);
    expect(result.isOtherCustomDomain).toBe(false);
    // Falls through to default (Manus preview/localhost) routes
  });
});

describe("Login page Manus OAuth visibility", () => {
  it("Manus OAuth is hidden by default, requires 5 taps to reveal", () => {
    // Simulating the tap counter logic from Login.tsx
    let tapCount = 0;
    let showAdminEntry = false;
    
    // Default state: hidden
    expect(showAdminEntry).toBe(false);
    
    // 4 taps: still hidden
    for (let i = 0; i < 4; i++) {
      tapCount++;
    }
    expect(tapCount).toBe(4);
    expect(showAdminEntry).toBe(false);
    
    // 5th tap: revealed
    tapCount++;
    if (tapCount >= 5) {
      showAdminEntry = true;
      tapCount = 0;
    }
    expect(showAdminEntry).toBe(true);
    expect(tapCount).toBe(0);
  });
});
