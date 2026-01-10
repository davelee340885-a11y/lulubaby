import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import {
  createCustomerUser,
  getCustomerUserByEmail,
  verifyCustomerPassword,
  updateCustomerLastLogin,
  customerEmailExists,
} from "./db";

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
function verifyCustomerToken(token: string): CustomerSession | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as CustomerSession;
  } catch {
    return null;
  }
}

export const customerAuthRouter = router({
  // Email login with password verification
  emailLogin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        personaId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if user exists
        const user = await getCustomerUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
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
            message: "Invalid email or password",
          });
        }

        // Check if user is active
        if (!user.isActive) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This account has been deactivated",
          });
        }

        // Check if persona ID matches
        if (user.personaId !== input.personaId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This account is not associated with this AI persona",
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
          message: "Login failed",
        });
      }
    }),

  // Email signup with password
  emailSignup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8),
        personaId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if email already exists
        const emailExists = await customerEmailExists(input.email);
        if (emailExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This email is already registered",
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
          message: "Signup failed",
        });
      }
    }),

  // Get current customer session
  getSession: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const session = verifyCustomerToken(input.token);

      if (!session) {
        return { user: null };
      }

      return { user: session };
    }),

  // Logout (client-side only - just clear the token)
  logout: publicProcedure.mutation(async () => {
    return { success: true };
  }),

  // Google OAuth - Get authorization URL
  getGoogleAuthUrl: publicProcedure
    .input(
      z.object({
        personaId: z.number(),
        redirectUri: z.string(),
      })
    )
    .query(async ({ input }) => {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
      if (!GOOGLE_CLIENT_ID) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google OAuth is not configured",
        });
      }

      const state = Buffer.from(
        JSON.stringify({
          personaId: input.personaId,
          redirectUri: input.redirectUri,
        })
      ).toString("base64");

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
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string(),
        personaId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

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
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        );

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

        // Check if customer exists, if not create one
        let customer = await getCustomerUserByEmail(userInfo.email);
        if (!customer) {
          customer = await createCustomerUser(
            userInfo.email,
            userInfo.name || "Google User",
            "", // Empty password for OAuth
            input.personaId,
            "google"
          );
        } else if (customer.personaId !== input.personaId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This account is not associated with this AI persona",
          });
        }

        // Update last login time
        await updateCustomerLastLogin(customer.id);

        // Create session
        const session: CustomerSession = {
          id: customer.id,
          email: customer.email,
          name: customer.name || undefined,
          provider: "google",
          personaId: customer.personaId,
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
    .input(
      z.object({
        provider: z.enum(["google", "apple", "microsoft"]),
        idToken: z.string(),
        personaId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
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

      try {
        // Check if customer exists, if not create one
        let customer = await getCustomerUserByEmail(email);
        if (!customer) {
          customer = await createCustomerUser(
            email,
            name || "Social User",
            "", // Empty password for OAuth
            input.personaId,
            input.provider
          );
        } else if (customer.personaId !== input.personaId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This account is not associated with this AI persona",
          });
        }

        // Update last login time
        await updateCustomerLastLogin(customer.id);

        // Create session
        const session: CustomerSession = {
          id: customer.id,
          email: customer.email,
          name: customer.name || undefined,
          provider: input.provider,
          personaId: customer.personaId,
        };

        const token = createCustomerToken(session);

        return { success: true, token, user: session };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[SocialAuth] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Social authentication failed",
        });
      }
    }),
});

export type CustomerAuthRouter = typeof customerAuthRouter;
