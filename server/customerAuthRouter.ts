import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

// Customer session type
export type CustomerSession = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
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

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export const customerAuthRouter = router({
  // Simple email login (no verification code required)
  emailLogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Create customer session directly with email
      const session: CustomerSession = {
        id: `email:${input.email}`,
        email: input.email,
        provider: "email",
        personaId: input.personaId,
      };
      
      const token = createCustomerToken(session);
      
      return { success: true, token, user: session };
    }),

  // Google OAuth - Get authorization URL
  getGoogleAuthUrl: publicProcedure
    .input(z.object({
      personaId: z.number(),
      redirectUri: z.string(),
    }))
    .query(async ({ input }) => {
      if (!GOOGLE_CLIENT_ID) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google OAuth is not configured",
        });
      }
      
      const state = Buffer.from(JSON.stringify({
        personaId: input.personaId,
        redirectUri: input.redirectUri,
      })).toString("base64");
      
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: input.redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        access_type: "offline",
        prompt: "consent",
      });
      
      return {
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      };
    }),

  // Google OAuth - Exchange code for token and login
  googleCallback: publicProcedure
    .input(z.object({
      code: z.string(),
      redirectUri: z.string(),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google OAuth is not configured",
        });
      }
      
      try {
        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code: input.code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: input.redirectUri,
            grant_type: "authorization_code",
          }),
        });
        
        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error("[GoogleAuth] Token exchange failed:", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to exchange authorization code",
          });
        }
        
        const tokens = await tokenResponse.json();
        
        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });
        
        if (!userInfoResponse.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to get user info from Google",
          });
        }
        
        const userInfo = await userInfoResponse.json();
        
        if (!userInfo.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email not found in Google account",
          });
        }
        
        // Create customer session
        const session: CustomerSession = {
          id: `google:${userInfo.id}`,
          email: userInfo.email,
          name: userInfo.name,
          avatarUrl: userInfo.picture,
          provider: "google",
          personaId: input.personaId,
        };
        
        const token = createCustomerToken(session);
        
        return { success: true, token, user: session };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[GoogleAuth] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google authentication failed",
        });
      }
    }),

  // Social login with ID token (for Apple/Microsoft)
  socialLogin: publicProcedure
    .input(z.object({
      provider: z.enum(["google", "apple", "microsoft"]),
      idToken: z.string(),
      personaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      let email: string;
      let name: string | undefined;
      let avatarUrl: string | undefined;
      
      try {
        // Decode JWT without verification (for demo purposes only)
        // In production, use proper verification with provider's public keys
        const payload = JSON.parse(
          Buffer.from(input.idToken.split(".")[1], "base64").toString()
        );
        email = payload.email;
        name = payload.name;
        avatarUrl = payload.picture;
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
        avatarUrl,
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
