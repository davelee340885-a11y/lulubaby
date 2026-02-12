/**
 * Admin Router
 * Handles admin-only operations for user management and Spark top-up
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, sparkTransactions } from "../drizzle/schema";
import { eq, desc, like, or, sql, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Admin procedure - only allows users with admin role
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "只有管理員可以執行此操作" 
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Get all users with pagination and search
   */
  getAllUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(["all", "user", "admin"]).default("all"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      const { page, pageSize, search, role } = input;
      const offset = (page - 1) * pageSize;

      // Build where clause
      const conditions: any[] = [];
      if (search) {
        conditions.push(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.subdomain, `%${search}%`)
          )
        );
      }
      if (role !== "all") {
        conditions.push(eq(users.role, role));
      }

      const whereClause = conditions.length > 0
        ? conditions.length === 1 ? conditions[0] : and(...conditions)
        : undefined;

      // Get total count with filters
      const countResult = await (whereClause
        ? db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause)
        : db.select({ count: sql<number>`count(*)` }).from(users));
      const total = Number(countResult[0]?.count || 0);

      // Get users with pagination
      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        sparkBalance: users.sparkBalance,
        subdomain: users.subdomain,
        referralCode: users.referralCode,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users);

      if (whereClause) {
        query = query.where(whereClause) as any;
      }

      const userList = await query
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        users: userList,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Get single user details
   */
  getUserById: adminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      const userResult = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        sparkBalance: users.sparkBalance,
        subdomain: users.subdomain,
        referralCode: users.referralCode,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users).where(eq(users.id, input.userId)).limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用戶不存在" });
      }

      return userResult[0];
    }),

  /**
   * Update user role
   */
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Prevent admin from changing their own role
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "無法更改自己的角色" 
        });
      }

      // Check if user exists
      const userResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (userResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用戶不存在" });
      }

      // Update role
      await db.update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { 
        success: true, 
        message: `用戶角色已更新為 ${input.role === "admin" ? "管理員" : "普通用戶"}` 
      };
    }),

  /**
   * Delete user (hard delete)
   */
  deleteUser: adminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Prevent admin from deleting themselves
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "無法刪除自己的帳戶" 
        });
      }

      // Check if user exists
      const userResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (userResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用戶不存在" });
      }

      // Delete user
      await db.delete(users).where(eq(users.id, input.userId));

      return { success: true, message: "用戶已刪除" };
    }),

  /**
   * Admin manual Spark top-up for any user
   */
  topupSpark: adminProcedure
    .input(z.object({
      userId: z.number(),
      amount: z.number().min(1).max(1000000),
      reason: z.string().min(1).max(255),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Check if target user exists
      const userResult = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        sparkBalance: users.sparkBalance,
      }).from(users).where(eq(users.id, input.userId)).limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用戶不存在" });
      }

      const targetUser = userResult[0];
      const newBalance = targetUser.sparkBalance + input.amount;

      // Update user's spark balance
      await db.update(users)
        .set({ sparkBalance: newBalance, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      // Record transaction
      await db.insert(sparkTransactions).values({
        userId: input.userId,
        type: "admin_topup",
        amount: input.amount,
        balance: newBalance,
        description: `管理員充值: ${input.reason} (by ${ctx.user.name || ctx.user.email})`,
      });

      return { 
        success: true, 
        message: `已為 ${targetUser.name || targetUser.email} 充值 ${input.amount.toLocaleString()} Spark`,
        newBalance,
      };
    }),

  /**
   * Get user's Spark transaction history (admin view)
   */
  getUserSparkHistory: adminProcedure
    .input(z.object({
      userId: z.number(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      const { userId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(sparkTransactions)
        .where(eq(sparkTransactions.userId, userId));
      const total = Number(countResult[0]?.count || 0);

      const transactions = await db.select()
        .from(sparkTransactions)
        .where(eq(sparkTransactions.userId, userId))
        .orderBy(desc(sparkTransactions.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        transactions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Get admin dashboard stats
   */
  getDashboardStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
    }

    // Get total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Get admin count
    const adminCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));
    const adminCount = Number(adminCountResult[0]?.count || 0);

    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsersResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${today}`);
    const todayUsers = Number(todayUsersResult[0]?.count || 0);

    // Get users registered this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekUsersResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${weekAgo}`);
    const weekUsers = Number(weekUsersResult[0]?.count || 0);

    // Get total Spark in circulation
    const totalSparkResult = await db.select({ total: sql<number>`COALESCE(SUM(${users.sparkBalance}), 0)` }).from(users);
    const totalSpark = Number(totalSparkResult[0]?.total || 0);

    return {
      totalUsers,
      adminCount,
      regularUsers: totalUsers - adminCount,
      todayUsers,
      weekUsers,
      totalSpark,
    };
  }),
});
