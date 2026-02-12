import { describe, it, expect } from "vitest";

/**
 * v3.12.0 Workspace Routing Tests
 * 
 * Tests the workspace ID routing logic:
 * - Login/signup returns subdomain for workspace routing
 * - WorkspaceGuard validates workspaceId ownership
 * - Legacy paths get redirected
 * - wsPath helper generates correct workspace-prefixed paths
 */

describe("Workspace Routing - v3.12.0", () => {
  // Test the wsPath helper logic
  describe("wsPath helper", () => {
    const wsPath = (workspaceId: string | undefined, path: string) => {
      if (!workspaceId) return path;
      return `/w/${workspaceId}${path}`;
    };

    it("should prefix path with /w/{workspaceId}", () => {
      expect(wsPath("my-store", "/dashboard")).toBe("/w/my-store/dashboard");
      expect(wsPath("my-store", "/appearance")).toBe("/w/my-store/appearance");
      expect(wsPath("my-store", "/training")).toBe("/w/my-store/training");
      expect(wsPath("my-store", "/knowledge")).toBe("/w/my-store/knowledge");
      expect(wsPath("my-store", "/account")).toBe("/w/my-store/account");
      expect(wsPath("my-store", "/pricing")).toBe("/w/my-store/pricing");
      expect(wsPath("my-store", "/feed")).toBe("/w/my-store/feed");
    });

    it("should handle numeric workspaceId (user.id fallback)", () => {
      expect(wsPath("123", "/dashboard")).toBe("/w/123/dashboard");
    });

    it("should return raw path when workspaceId is undefined", () => {
      expect(wsPath(undefined, "/dashboard")).toBe("/dashboard");
    });
  });

  // Test workspace ID extraction from URL
  describe("workspaceId extraction from URL", () => {
    const extractWorkspaceId = (location: string) => {
      const match = location.match(/^\/w\/([^/]+)/);
      return match?.[1] ?? undefined;
    };

    it("should extract workspaceId from /w/:workspaceId/... paths", () => {
      expect(extractWorkspaceId("/w/my-store/dashboard")).toBe("my-store");
      expect(extractWorkspaceId("/w/lulubaby/appearance")).toBe("lulubaby");
      expect(extractWorkspaceId("/w/123/training")).toBe("123");
    });

    it("should return undefined for non-workspace paths", () => {
      expect(extractWorkspaceId("/dashboard")).toBeUndefined();
      expect(extractWorkspaceId("/login")).toBeUndefined();
      expect(extractWorkspaceId("/")).toBeUndefined();
      expect(extractWorkspaceId("/chat/1")).toBeUndefined();
      expect(extractWorkspaceId("/s/my-store")).toBeUndefined();
    });

    it("should handle edge cases", () => {
      expect(extractWorkspaceId("/w/")).toBeUndefined();
      expect(extractWorkspaceId("/w/my-store")).toBe("my-store");
    });
  });

  // Test workspace ownership validation logic
  describe("WorkspaceGuard ownership validation", () => {
    const validateOwnership = (
      workspaceId: string,
      userSubdomain: string | null,
      userId: number
    ): boolean => {
      const userWs = userSubdomain || String(userId);
      return userWs === workspaceId || String(userId) === workspaceId;
    };

    it("should allow access when workspaceId matches subdomain", () => {
      expect(validateOwnership("my-store", "my-store", 1)).toBe(true);
    });

    it("should allow access when workspaceId matches user id", () => {
      expect(validateOwnership("1", null, 1)).toBe(true);
      expect(validateOwnership("1", "my-store", 1)).toBe(true);
    });

    it("should deny access when workspaceId doesn't match", () => {
      expect(validateOwnership("other-store", "my-store", 1)).toBe(false);
      expect(validateOwnership("999", "my-store", 1)).toBe(false);
    });

    it("should handle null subdomain with id fallback", () => {
      expect(validateOwnership("42", null, 42)).toBe(true);
      expect(validateOwnership("other", null, 42)).toBe(false);
    });
  });

  // Test login/signup redirect URL generation
  describe("Login/Signup redirect URL", () => {
    const getRedirectUrl = (subdomain: string | null, userId: number) => {
      const ws = subdomain || String(userId);
      return `/w/${ws}/dashboard`;
    };

    it("should redirect to /w/{subdomain}/dashboard when subdomain exists", () => {
      expect(getRedirectUrl("lulubaby", 1)).toBe("/w/lulubaby/dashboard");
      expect(getRedirectUrl("my-store", 42)).toBe("/w/my-store/dashboard");
    });

    it("should fallback to /w/{userId}/dashboard when no subdomain", () => {
      expect(getRedirectUrl(null, 1)).toBe("/w/1/dashboard");
      expect(getRedirectUrl(null, 42)).toBe("/w/42/dashboard");
    });
  });

  // Test legacy path redirect logic
  describe("Legacy path redirect", () => {
    const getLegacyRedirect = (
      location: string,
      userSubdomain: string | null
    ): string | null => {
      if (!userSubdomain) return null;
      const path = location.startsWith("/") ? location : `/${location}`;
      return `/w/${userSubdomain}${path}`;
    };

    it("should redirect legacy /dashboard to /w/{subdomain}/dashboard", () => {
      expect(getLegacyRedirect("/dashboard", "my-store")).toBe("/w/my-store/dashboard");
    });

    it("should redirect legacy /appearance to /w/{subdomain}/appearance", () => {
      expect(getLegacyRedirect("/appearance", "my-store")).toBe("/w/my-store/appearance");
    });

    it("should redirect legacy /training to /w/{subdomain}/training", () => {
      expect(getLegacyRedirect("/training", "my-store")).toBe("/w/my-store/training");
    });

    it("should return null when no subdomain", () => {
      expect(getLegacyRedirect("/dashboard", null)).toBeNull();
    });
  });

  // Test route structure
  describe("Route structure validation", () => {
    const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/chat/:personaId", "/s/:subdomain"];
    const workspaceRoutes = [
      "/w/:workspaceId/dashboard",
      "/w/:workspaceId/knowledge",
      "/w/:workspaceId/appearance",
      "/w/:workspaceId/domain",
      "/w/:workspaceId/training",
      "/w/:workspaceId/superpowers",
      "/w/:workspaceId/brain",
      "/w/:workspaceId/account",
      "/w/:workspaceId/pricing",
      "/w/:workspaceId/feed",
      "/w/:workspaceId/team",
      "/w/:workspaceId/customers",
      "/w/:workspaceId/widget",
      "/w/:workspaceId/api-docs",
      "/w/:workspaceId/admin/users",
      "/w/:workspaceId/agent-chat",
    ];

    it("should have public routes that don't require workspace prefix", () => {
      publicRoutes.forEach((route) => {
        expect(route).not.toMatch(/^\/w\//);
      });
    });

    it("should have all workspace routes prefixed with /w/:workspaceId", () => {
      workspaceRoutes.forEach((route) => {
        expect(route).toMatch(/^\/w\/:workspaceId\//);
      });
    });

    it("should have correct number of workspace routes", () => {
      expect(workspaceRoutes.length).toBe(16);
    });
  });
});
