import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
  getUserById: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

// Mock sdk
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe("userAuth Router", () => {
  const mockRes = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };

  const mockReq = {
    headers: {},
  };

  const createCaller = () => {
    return appRouter.createCaller({
      req: mockReq as any,
      res: mockRes as any,
      user: null,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signup", () => {
    it("should validate email format", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.signup({
          name: "Test User",
          email: "invalid-email",
          password: "Password123",
        })
      ).rejects.toThrow();
    });

    it("should validate password requirements", async () => {
      const caller = createCaller();
      
      // Password too short
      await expect(
        caller.userAuth.signup({
          name: "Test User",
          email: "test@example.com",
          password: "short",
        })
      ).rejects.toThrow();

      // Password without uppercase
      await expect(
        caller.userAuth.signup({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow();

      // Password without lowercase
      await expect(
        caller.userAuth.signup({
          name: "Test User",
          email: "test@example.com",
          password: "PASSWORD123",
        })
      ).rejects.toThrow();

      // Password without number
      await expect(
        caller.userAuth.signup({
          name: "Test User",
          email: "test@example.com",
          password: "PasswordABC",
        })
      ).rejects.toThrow();
    });

    it("should require name", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.signup({
          name: "",
          email: "test@example.com",
          password: "Password123",
        })
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    it("should validate email format", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.login({
          email: "invalid-email",
          password: "Password123",
        })
      ).rejects.toThrow();
    });

    it("should require password", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.login({
          email: "test@example.com",
          password: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("logout", () => {
    it("should clear the session cookie", async () => {
      const caller = createCaller();
      
      const result = await caller.userAuth.logout();
      
      expect(result.success).toBe(true);
      expect(mockRes.clearCookie).toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset", () => {
    it("should validate email format", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.requestPasswordReset({
          email: "invalid-email",
        })
      ).rejects.toThrow();
    });

    it("should always return success to prevent email enumeration", async () => {
      const caller = createCaller();
      
      const result = await caller.userAuth.requestPasswordReset({
        email: "nonexistent@example.com",
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("should validate password requirements", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.resetPassword({
          token: "valid-token",
          password: "weak",
        })
      ).rejects.toThrow();
    });

    it("should require token", async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.resetPassword({
          token: "",
          password: "Password123",
        })
      ).rejects.toThrow();
    });
  });
});

describe("admin Router", () => {
  const mockRes = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };

  const mockReq = {
    headers: {},
  };

  describe("getAllUsers", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller({
        req: mockReq as any,
        res: mockRes as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.admin.getAllUsers({ page: 1, pageSize: 20, role: "all" })
      ).rejects.toThrow(TRPCError);
    });

    it("should reject unauthenticated users", async () => {
      const caller = appRouter.createCaller({
        req: mockReq as any,
        res: mockRes as any,
        user: null,
      });

      await expect(
        caller.admin.getAllUsers({ page: 1, pageSize: 20, role: "all" })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("updateUserRole", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller({
        req: mockReq as any,
        res: mockRes as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.admin.updateUserRole({ userId: 2, role: "admin" })
      ).rejects.toThrow(TRPCError);
    });

    it("should prevent admin from changing their own role", async () => {
      const caller = appRouter.createCaller({
        req: mockReq as any,
        res: mockRes as any,
        user: { id: 1, role: "admin" } as any,
      });

      await expect(
        caller.admin.updateUserRole({ userId: 1, role: "user" })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("deleteUser", () => {
    it("should reject non-admin users", async () => {
      const caller = appRouter.createCaller({
        req: mockReq as any,
        res: mockRes as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: 2 })
      ).rejects.toThrow(TRPCError);
    });

    it("should prevent admin from deleting themselves", async () => {
      const caller = appRouter.createCaller({
        req: mockReq as any,
        res: mockRes as any,
        user: { id: 1, role: "admin" } as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: 1 })
      ).rejects.toThrow(TRPCError);
    });
  });
});
