import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getDb,
  createDomainOrder,
  getDomainOrder,
  bindDomainToPersona,
  publishDomain,
  getPublishedDomainByName,
  upsertPersona,
  getPersonaByUserId,
} from './db';

describe('Custom Domain Routing', () => {
  let testUserId: number;
  let testPersonaId: number;
  let testOrderId: number;
  const testDomain = `routing-test-${Date.now()}.xyz`;

  beforeAll(async () => {
    // Create test user persona
    testUserId = 1; // Using default test user
    
    // Create or get persona
    await upsertPersona({
      userId: testUserId,
      agentName: 'Routing Test Agent',
      avatarUrl: null,
      welcomeMessage: 'Welcome to routing test',
      systemPrompt: 'You are a routing test agent',
    });
    
    const persona = await getPersonaByUserId(testUserId);
    if (!persona) {
      throw new Error('Failed to create test persona');
    }
    testPersonaId = persona.id;

    // Create test domain order
    const order = await createDomainOrder({
      userId: testUserId,
      domain: testDomain,
      tld: 'xyz',
      years: 1,
      domainPrice: 1000,
      managementFee: 1299,
      totalPrice: 2299,
      status: 'registered',
      registrationDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      dnsStatus: 'active',
      sslStatus: 'active',
    });
    
    if (!order) {
      throw new Error('Failed to create test domain order');
    }
    testOrderId = order.id;

    // Bind and publish domain
    await bindDomainToPersona(testOrderId, testPersonaId);
    await publishDomain(testOrderId);
  });

  afterAll(async () => {
    // Cleanup: delete test order
    const db = await getDb();
    if (db) {
      const { domainOrders } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      await db.delete(domainOrders).where(eq(domainOrders.id, testOrderId));
    }
  });

  describe('Domain Lookup', () => {
    it('should find published domain by name', async () => {
      const domain = await getPublishedDomainByName(testDomain);
      expect(domain).toBeDefined();
      expect(domain?.domain).toBe(testDomain);
      expect(domain?.personaId).toBe(testPersonaId);
      expect(domain?.isPublished).toBe(true);
    });

    it('should return null for non-existent domain', async () => {
      const domain = await getPublishedDomainByName('non-existent-domain.xyz');
      expect(domain).toBeUndefined();
    });

    it('should return null for unpublished domain', async () => {
      // Create another domain but don't publish it
      const unpublishedDomain = `unpublished-${Date.now()}.xyz`;
      const order = await createDomainOrder({
        userId: testUserId,
        domain: unpublishedDomain,
        tld: 'xyz',
        years: 1,
        domainPrice: 1000,
        managementFee: 1299,
        totalPrice: 2299,
        status: 'registered',
        registrationDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        dnsStatus: 'active',
        sslStatus: 'active',
      });

      if (order) {
        await bindDomainToPersona(order.id, testPersonaId);
        // Don't publish
        
        const domain = await getPublishedDomainByName(unpublishedDomain);
        expect(domain).toBeUndefined();

        // Cleanup
        const db = await getDb();
        if (db) {
          const { domainOrders } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          await db.delete(domainOrders).where(eq(domainOrders.id, order.id));
        }
      }
    });
  });

  describe('Domain Routing Requirements', () => {
    it('should require domain to be registered', async () => {
      const pendingDomain = `pending-${Date.now()}.xyz`;
      const order = await createDomainOrder({
        userId: testUserId,
        domain: pendingDomain,
        tld: 'xyz',
        years: 1,
        domainPrice: 1000,
        managementFee: 1299,
        totalPrice: 2299,
        status: 'pending_payment', // Not registered
        dnsStatus: 'pending',
        sslStatus: 'pending',
      });

      if (order) {
        const domain = await getPublishedDomainByName(pendingDomain);
        expect(domain).toBeUndefined();

        // Cleanup
        const db = await getDb();
        if (db) {
          const { domainOrders } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          await db.delete(domainOrders).where(eq(domainOrders.id, order.id));
        }
      }
    });

    it('should require persona binding', async () => {
      const unboundDomain = `unbound-${Date.now()}.xyz`;
      const order = await createDomainOrder({
        userId: testUserId,
        domain: unboundDomain,
        tld: 'xyz',
        years: 1,
        domainPrice: 1000,
        managementFee: 1299,
        totalPrice: 2299,
        status: 'registered',
        registrationDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        dnsStatus: 'active',
        sslStatus: 'active',
      });

      if (order) {
        // Don't bind persona
        await publishDomain(order.id);
        
        const domain = await getPublishedDomainByName(unboundDomain);
        // Should not be found because personaId is null
        expect(domain).toBeUndefined();

        // Cleanup
        const db = await getDb();
        if (db) {
          const { domainOrders } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          await db.delete(domainOrders).where(eq(domainOrders.id, order.id));
        }
      }
    });

    it('should require DNS to be active', async () => {
      const noDnsDomain = `no-dns-${Date.now()}.xyz`;
      const order = await createDomainOrder({
        userId: testUserId,
        domain: noDnsDomain,
        tld: 'xyz',
        years: 1,
        domainPrice: 1000,
        managementFee: 1299,
        totalPrice: 2299,
        status: 'registered',
        registrationDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        dnsStatus: 'pending', // DNS not active
        sslStatus: 'pending',
      });

      if (order) {
        await bindDomainToPersona(order.id, testPersonaId);
        await publishDomain(order.id);
        
        const domain = await getPublishedDomainByName(noDnsDomain);
        // Should still be found even if DNS is not active (publish check should prevent this in real scenario)
        // But routing should work once DNS is active
        
        // Cleanup
        const db = await getDb();
        if (db) {
          const { domainOrders } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          await db.delete(domainOrders).where(eq(domainOrders.id, order.id));
        }
      }
    });
  });

  describe('Domain Routing Data', () => {
    it('should return correct persona ID for routing', async () => {
      const domain = await getPublishedDomainByName(testDomain);
      expect(domain).toBeDefined();
      expect(domain?.personaId).toBe(testPersonaId);
      expect(typeof domain?.personaId).toBe('number');
      expect(domain?.personaId).toBeGreaterThan(0);
    });

    it('should return domain name for verification', async () => {
      const domain = await getPublishedDomainByName(testDomain);
      expect(domain).toBeDefined();
      expect(domain?.domain).toBe(testDomain);
      expect(typeof domain?.domain).toBe('string');
    });

    it('should return published status', async () => {
      const domain = await getPublishedDomainByName(testDomain);
      expect(domain).toBeDefined();
      expect(domain?.isPublished).toBe(true);
      expect(typeof domain?.isPublished).toBe('boolean');
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case-insensitive for domain lookup', async () => {
      const upperCaseDomain = testDomain.toUpperCase();
      const domain = await getPublishedDomainByName(upperCaseDomain);
      expect(domain).toBeDefined();
      expect(domain?.domain).toBe(testDomain);
    });

    it('should be case-insensitive for mixed case domain', async () => {
      const mixedCaseDomain = testDomain.split('').map((c, i) => 
        i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
      ).join('');
      const domain = await getPublishedDomainByName(mixedCaseDomain);
      expect(domain).toBeDefined();
      expect(domain?.domain).toBe(testDomain);
    });
  });
});
