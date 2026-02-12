/**
 * Authentication Router
 * Unified authentication for Lulubaby platform
 * Supports both admin users and end customers
 */
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb, createCustomerUser, getCustomerUserByEmail, verifyCustomerPassword, updateCustomerLastLogin, customerEmailExists, generateRandomSubdomain, isSubdomainAvailable, upsertPersona, getUserByReferralCode, generateReferralCode, addSpark } from "./db";
import { users, passwordResetTokens, customerUsers } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { sendPasswordResetEmail } from "./emailService";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_HOURS = 24;

// Password validation schema for admin users (stricter)
const adminPasswordSchema = z.string()
  .min(8, "密碼至少需要 8 個字符")
  .regex(/[A-Z]/, "密碼需要包含至少一個大寫字母")
  .regex(/[a-z]/, "密碼需要包含至少一個小寫字母")
  .regex(/[0-9]/, "密碼需要包含至少一個數字");

// Password validation schema for customers (simpler)
const customerPasswordSchema = z.string().min(8, "密碼至少需要 8 個字符");

// Customer session type
export type CustomerSession = {
  id: number;
  email: string;
  name?: string;
  provider: "email" | "google" | "apple" | "microsoft";
  personaId: number;
};

// Create JWT token for customer
function createCustomerToken(session: CustomerSession): string {
  return jwt.sign(session, ENV.JWT_SECRET, { expiresIn: "7d" });
}

// Verify JWT token
export function verifyCustomerToken(token: string): CustomerSession | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as CustomerSession;
  } catch {
    return null;
  }
}

export const authRouter = router({
  /**
   * User signup with email and password
   */
  signup: publicProcedure
    .input(z.object({
      name: z.string().min(1, "請輸入姓名").max(255),
      email: z.string().email("請輸入有效的電郵地址"),
      password: adminPasswordSchema,
      referralCode: z.string().max(16).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "此電郵已被註冊" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Generate unique subdomain
      let subdomain: string | undefined;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateRandomSubdomain();
        const available = await isSubdomainAvailable(candidate);
        if (available) {
          subdomain = candidate;
          break;
        }
      }

      // Generate unique referral code for the new user
      let newUserReferralCode: string | undefined;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateReferralCode();
        const existing = await getUserByReferralCode(candidate);
        if (!existing) {
          newUserReferralCode = candidate;
          break;
        }
      }

      // Validate referral code if provided
      let referrerId: number | null = null;
      if (input.referralCode && input.referralCode.trim()) {
        const referrer = await getUserByReferralCode(input.referralCode.trim().toUpperCase());
        if (referrer) {
          referrerId = referrer.id;
        }
        // If referral code is invalid, silently ignore (don't block registration)
      }

      // Create user
      const result = await db.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        loginMethod: "email",
        role: "user",
        subdomain,
        referralCode: newUserReferralCode,
        referredById: referrerId,
      });

      const userId = result[0].insertId;

      // Get the created user
      const newUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (newUser.length === 0) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "創建用戶失敗" });
      }

      // Issue referral rewards if applicable
      if (referrerId) {
        // Reward the referrer: +100 Spark
        await addSpark(referrerId, 100, `推薦獎勵：成功推薦新用戶 ${input.name}`, undefined, JSON.stringify({ refereeId: userId }));
        // Reward the referee: +100 Spark
        await addSpark(userId, 100, `推薦獎勵：使用推薦碼 ${input.referralCode} 註冊`, undefined, JSON.stringify({ referrerId }));
      }

      // Create session token using a unique identifier
      const sessionId = `email_${userId}_${Date.now()}`;
      const sessionToken = await sdk.createSessionToken(sessionId, {
        name: input.name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Auto-create default persona for new user
      await upsertPersona({
        userId,
        agentName: `${input.name} 的 AI 助手`,
      });

      // Notify owner of new signup
      const referralInfo = referrerId ? ` (由用戶 #${referrerId} 推薦)` : "";
      await notifyOwner({
        title: "新用戶註冊",
        content: `新用戶 ${input.name} (${input.email}) 已註冊 Lulubaby 平台${referralInfo}。`,
      });

      return {
        success: true,
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
          role: newUser[0].role,
          subdomain: newUser[0].subdomain,
        },
      };
    }),

  /**
   * User login with email and password
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email("請輸入有效的電郵地址"),
      password: z.string().min(1, "請輸入密碼"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (userResult.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "電郵或密碼錯誤" });
      }

      const user = userResult[0];

      // Check if user has password (email login)
      if (!user.passwordHash) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "此帳戶使用 Manus OAuth 登入，請使用 Manus 登入" 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "電郵或密碼錯誤" });
      }

      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Create session token
      const sessionId = user.openId || `email_${user.id}_${Date.now()}`;
      const sessionToken = await sdk.createSessionToken(sessionId, {
        name: user.name || "User",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subdomain: user.subdomain,
        },
      };
    }),

  /**
   * User logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email("請輸入有效的電郵地址"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      // Always return success to prevent email enumeration
      if (userResult.length === 0) {
        return { success: true, message: "如果此電郵已註冊，您將收到密碼重置郵件" };
      }

      const user = userResult[0];

      // Check if user uses email login
      if (!user.passwordHash) {
        return { success: true, message: "如果此電郵已註冊，您將收到密碼重置郵件" };
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

      // Save token to database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Determine base URL for reset link
      const baseUrl = ENV.isProduction
        ? "https://lulubaby.xyz"
        : (process.env.VITE_APP_URL || "http://localhost:3000");

      // Send password reset email to user
      const emailSent = await sendPasswordResetEmail(
        user.email,
        user.name || "",
        token,
        baseUrl
      );

      if (!emailSent) {
        // Fallback: notify owner if email service is unavailable
        await notifyOwner({
          title: "密碼重置請求（郵件發送失敗）",
          content: `用戶 ${user.name} (${user.email}) 請求重置密碼，但郵件發送失敗。\n\n重置連結: ${baseUrl}/reset-password?token=${token}\n\n此連結將在 ${PASSWORD_RESET_EXPIRY_HOURS} 小時後過期。`,
        });
      }

      return { 
        success: true, 
        message: "如果此電郵已註冊，您將收到密碼重置郵件",
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1, "重置令牌無效"),
      password: adminPasswordSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Find valid token
      const tokenResult = await db.select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (tokenResult.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "重置令牌無效或已過期" });
      }

      const resetToken = tokenResult[0];

      // Check if token was already used
      if (resetToken.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "此重置令牌已被使用" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Update user password
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return { success: true, message: "密碼已成功重置，請使用新密碼登入" };
    }),

  /**
   * Get current user info
   */
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    // Never expose passwordHash to the frontend
    const { passwordHash, ...safeUser } = ctx.user;
    return safeUser;
  }),

  /**
   * Change password (for logged in users)
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, "請輸入當前密碼"),
      newPassword: adminPasswordSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      // Get user with password
      const userResult = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (userResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用戶不存在" });
      }

      const user = userResult[0];

      // Check if user has password
      if (!user.passwordHash) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "此帳戶使用 Manus OAuth 登入，無法更改密碼" 
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "當前密碼錯誤" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      // Update password
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: "密碼已成功更改" };
    }),

  /**
   * Update profile (name and/or email)
   */
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "請輸入姓名").max(100).optional(),
      email: z.string().email("請輸入有效的電郵地址").optional(),
    }).refine(data => data.name || data.email, {
      message: "請至少提供一個要更新的欄位",
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "數據庫連接失敗" });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.name) {
        updateData.name = input.name;
      }

      if (input.email) {
        // Check if email is already taken by another user
        const existing = await db.select({ id: users.id })
          .from(users)
          .where(and(eq(users.email, input.email)))
          .limit(1);
        if (existing.length > 0 && existing[0].id !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "此電郵已被其他帳戶使用" });
        }
        updateData.email = input.email;
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id));

      // Return updated user
      const updated = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

      return { success: true, message: "個人資料已更新", user: updated[0] };
    }),

  // ==================== Customer Authentication ====================
  
  /**
   * Customer signup with email and password
   */
  customerSignup: publicProcedure
    .input(z.object({
      name: z.string().min(1, "請輸入姓名").max(100),
      email: z.string().email("請輸入有效的電郵地址"),
      password: customerPasswordSchema,
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if email already exists
        const emailExists = await customerEmailExists(input.email);
        if (emailExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "此電郵已被註冊",
          });
        }

        // Create new customer user
        const user = await createCustomerUser(
          input.email,
          input.name,
          input.password,
          input.personaId,
          "email"
        );

        // Create session
        const session: CustomerSession = {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          provider: "email",
          personaId: user.personaId,
        };

        const token = createCustomerToken(session);

        return { success: true, token, user: session };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[CustomerAuth] Email signup error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "註冊失敗",
        });
      }
    }),

  /**
   * Customer login with email and password
   */
  customerLogin: publicProcedure
    .input(z.object({
      email: z.string().email("請輸入有效的電郵地址"),
      password: z.string().min(1, "請輸入密碼"),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user exists
        const user = await getCustomerUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "電郵或密碼錯誤",
          });
        }

        // Verify password
        const isPasswordValid = await verifyCustomerPassword(
          input.email,
          input.password
        );
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "電郵或密碼錯誤",
          });
        }

        // Check if user is active
        if (!user.isActive) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "此帳戶已被停用",
          });
        }

        // Check if persona ID matches
        if (user.personaId !== input.personaId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "此帳戶不屬於此 AI 助手",
          });
        }

        // Update last login time
        await updateCustomerLastLogin(user.id);

        // Create session
        const session: CustomerSession = {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          provider: user.provider as any,
          personaId: user.personaId,
        };

        const token = createCustomerToken(session);

        return { success: true, token, user: session };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[CustomerAuth] Email login error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "登入失敗",
        });
      }
    }),

  /**
   * Get customer session from token
   */
  customerSession: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const session = verifyCustomerToken(input.token);
      if (!session) {
        return { user: null };
      }
      return { user: session };
    }),

  /**
   * Customer logout (client-side only)
   */
  customerLogout: publicProcedure.mutation(async () => {
    return { success: true };
  }),
});
