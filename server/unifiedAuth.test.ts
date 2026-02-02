import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: {
        'x-forwarded-proto': 'https',
      },
      protocol: 'https',
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

function createCaller() {
  const ctx = createTestContext();
  return appRouter.createCaller(ctx);
}

describe('Unified Auth System', () => {
  describe('Customer Authentication (userAuth.customer*)', () => {
    const testEmail = `test-customer-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test Customer';

    it('should signup a new customer', async () => {
      const caller = createCaller();
      
      const result = await caller.userAuth.customerSignup({
        email: testEmail,
        password: testPassword,
        name: testName,
        personaId: 1,
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.name).toBe(testName);
      expect(result.token).toBeDefined();
    });

    it('should login an existing customer', async () => {
      const caller = createCaller();
      
      // First signup
      await caller.userAuth.customerSignup({
        email: `login-test-${Date.now()}@example.com`,
        password: testPassword,
        name: testName,
        personaId: 1,
      });

      // Then login with same credentials
      const loginEmail = `login-test-2-${Date.now()}@example.com`;
      await caller.userAuth.customerSignup({
        email: loginEmail,
        password: testPassword,
        name: testName,
        personaId: 1,
      });

      const result = await caller.userAuth.customerLogin({
        email: loginEmail,
        password: testPassword,
        personaId: 1,
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginEmail);
      expect(result.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const caller = createCaller();
      const wrongPassEmail = `wrong-pass-${Date.now()}@example.com`;
      
      // First signup
      await caller.userAuth.customerSignup({
        email: wrongPassEmail,
        password: testPassword,
        name: testName,
        personaId: 1,
      });

      // Then try login with wrong password
      await expect(
        caller.userAuth.customerLogin({
          email: wrongPassEmail,
          password: 'WrongPassword123!',
          personaId: 1,
        })
      ).rejects.toThrow();
    });

    it('should reject signup with existing email', async () => {
      const caller = createCaller();
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;
      
      // First signup
      await caller.userAuth.customerSignup({
        email: duplicateEmail,
        password: testPassword,
        name: testName,
        personaId: 1,
      });

      // Try to signup again with same email
      await expect(
        caller.userAuth.customerSignup({
          email: duplicateEmail,
          password: testPassword,
          name: 'Another Name',
          personaId: 1,
        })
      ).rejects.toThrow();
    });

    it('should reject signup with weak password', async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.customerSignup({
          email: `weak-pass-${Date.now()}@example.com`,
          password: '123', // Too short
          name: testName,
          personaId: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe('Admin Authentication (userAuth.signup/login)', () => {
    const adminEmail = `admin-${Date.now()}@example.com`;
    const adminPassword = 'AdminPassword123!';
    const adminName = 'Test Admin';

    it('should signup a new admin user', async () => {
      const caller = createCaller();
      
      const result = await caller.userAuth.signup({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(adminEmail);
    });

    it('should login an admin user', async () => {
      const caller = createCaller();
      const loginAdminEmail = `admin-login-${Date.now()}@example.com`;
      
      // First signup
      await caller.userAuth.signup({
        email: loginAdminEmail,
        password: adminPassword,
        name: adminName,
      });

      // Then login
      const result = await caller.userAuth.login({
        email: loginAdminEmail,
        password: adminPassword,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginAdminEmail);
    });

    it('should reject admin login with wrong password', async () => {
      const caller = createCaller();
      const wrongPassAdminEmail = `admin-wrong-${Date.now()}@example.com`;
      
      // First signup
      await caller.userAuth.signup({
        email: wrongPassAdminEmail,
        password: adminPassword,
        name: adminName,
      });

      // Then try login with wrong password
      await expect(
        caller.userAuth.login({
          email: wrongPassAdminEmail,
          password: 'WrongAdminPassword!',
        })
      ).rejects.toThrow();
    });
  });

  describe('Password Requirements', () => {
    it('should enforce minimum password length for customers', async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.customerSignup({
          email: `short-pass-${Date.now()}@example.com`,
          password: 'short',
          name: 'Test',
          personaId: 1,
        })
      ).rejects.toThrow();
    });

    it('should enforce minimum password length for admins', async () => {
      const caller = createCaller();
      
      await expect(
        caller.userAuth.signup({
          email: `admin-short-${Date.now()}@example.com`,
          password: 'short',
          name: 'Test Admin',
        })
      ).rejects.toThrow();
    });
  });
});
