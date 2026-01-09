import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Customer session type
export type CustomerSession = {
  id: string;
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
function verifyCustomerToken(token: string): CustomerSession | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as CustomerSession;
  } catch {
    return null;
  }
}

export const customerAuthRouter = router({
  // Send verification code to email
  sendVerificationCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const code = generateVerificationCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store the code
      verificationCodes.set(`${input.email}:${input.personaId}`, { code, expiresAt });
      
      // In production, send email here using a service like SendGrid, AWS SES, etc.
      // For now, we'll log the code (remove in production!)
      console.log(`[CustomerAuth] Verification code for ${input.email}: ${code}`);
      
      // TODO: Implement actual email sending
      // await sendEmail({
      //   to: input.email,
      //   subject: "Your verification code",
      //   body: `Your verification code is: ${code}`,
      // });
      
      return { success: true, message: "Verification code sent" };
    }),

  // Verify code and login
  verifyCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const key = `${input.email}:${input.personaId}`;
      const stored = verificationCodes.get(key);
      
      if (!stored) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No verification code found. Please request a new one.",
        });
      }
      
      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(key);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification code expired. Please request a new one.",
        });
      }
      
      if (stored.code !== input.code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code.",
        });
      }
      
      // Clear the code after successful verification
      verificationCodes.delete(key);
      
      // Create customer session
      const session: CustomerSession = {
        id: `email:${input.email}`,
        email: input.email,
        provider: "email",
        personaId: input.personaId,
      };
      
      const token = createCustomerToken(session);
      
      return { success: true, token, user: session };
    }),

  // Social login callback handler
  socialLogin: publicProcedure
    .input(z.object({
      provider: z.enum(["google", "apple", "microsoft"]),
      idToken: z.string(),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // In production, verify the ID token with the respective provider
      // For now, we'll decode the token and trust it (NOT SECURE - implement proper verification!)
      
      let email: string;
      let name: string | undefined;
      
      try {
        // Decode JWT without verification (for demo purposes only)
        // In production, use proper verification with provider's public keys
        const payload = JSON.parse(
          Buffer.from(input.idToken.split(".")[1], "base64").toString()
        );
        email = payload.email;
        name = payload.name;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token",
        });
      }
      
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email not found in token",
        });
      }
      
      // Create customer session
      const session: CustomerSession = {
        id: `${input.provider}:${email}`,
        email,
        name,
        provider: input.provider,
        personaId: input.personaId,
      };
      
      const token = createCustomerToken(session);
      
      return { success: true, token, user: session };
    }),

  // Get current customer session
  getSession: publicProcedure
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

  // Logout (client-side only - just clear the token)
  logout: publicProcedure
    .mutation(async () => {
      return { success: true };
    }),
});

export type CustomerAuthRouter = typeof customerAuthRouter;
