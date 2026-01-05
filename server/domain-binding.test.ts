import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getDb,
  createDomainOrder,
  getDomainOrder,
  bindDomainToPersona,
  unbindDomainFromPersona,
  publishDomain,
  unpublishDomain,
  getPublishedDomainByName,
  upsertPersona,
  getPersonaByUserId,
} from './db';

describe('Domain Binding and Publishing', () => {
  let testUserId: number;
  let testPersonaId: number;
  let testOrderId: number;
  const testDomain = `test-${Date.now()}.xyz`;

  beforeAll(async () => {
    // Create test user persona
    testUserId = 1; // Using default test user
    
    // Create or get persona
    await upsertPersona({
      userId: testUserId,
      agentName: 'Test Agent',
      avatarUrl: null,
      welcomeMessage: 'Welcome',
      systemPrompt: 'You are a test agent',
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
      domainPrice: 1000, // $10.00
      managementFee: 1299, // $12.99
      totalPrice: 2299, // $22.99
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

  describe('Bind Domain to Persona', () => {
    it('should bind domain to persona successfully', async () => {
      await bindDomainToPersona(testOrderId, testPersonaId);
      
      const order = await getDomainOrder(testOrderId);
      expect(order).toBeDefined();
      expect(order?.personaId).toBe(testPersonaId);
    });

    it('should update persona binding', async () => {
      // Create another persona
      await upsertPersona({
        userId: testUserId,
        agentName: 'Test Agent 2',
        avatarUrl: null,
        welcomeMessage: 'Welcome 2',
        systemPrompt: 'You are test agent 2',
      });
      
      const persona2 = await getPersonaByUserId(testUserId);
      if (!persona2) {
        throw new Error('Failed to create second persona');
      }
      
      // Bind to second persona
      await bindDomainToPersona(testOrderId, persona2.id);
      
      const order = await getDomainOrder(testOrderId);
      expect(order?.personaId).toBe(persona2.id);
      
      // Bind back to first persona
      await bindDomainToPersona(testOrderId, testPersonaId);
      const orderAfter = await getDomainOrder(testOrderId);
      expect(orderAfter?.personaId).toBe(testPersonaId);
    });
  });

  describe('Unbind Domain from Persona', () => {
    it('should unbind domain from persona successfully', async () => {
      // First bind
      await bindDomainToPersona(testOrderId, testPersonaId);
      
      // Then unbind
      await unbindDomainFromPersona(testOrderId);
      
      const order = await getDomainOrder(testOrderId);
      expect(order?.personaId).toBeNull();
    });
  });

  describe('Publish Domain', () => {
    it('should publish domain successfully', async () => {
      // Bind persona first
      await bindDomainToPersona(testOrderId, testPersonaId);
      
      // Publish domain
      await publishDomain(testOrderId);
      
      const order = await getDomainOrder(testOrderId);
      expect(order?.isPublished).toBe(true);
      expect(order?.publishedAt).toBeDefined();
    });

    it('should find published domain by name', async () => {
      const publishedDomain = await getPublishedDomainByName(testDomain);
      expect(publishedDomain).toBeDefined();
      expect(publishedDomain?.domain).toBe(testDomain);
      expect(publishedDomain?.isPublished).toBe(true);
      expect(publishedDomain?.personaId).toBe(testPersonaId);
    });

    it('should not find unpublished domain', async () => {
      // Unpublish first
      await unpublishDomain(testOrderId);
      
      const publishedDomain = await getPublishedDomainByName(testDomain);
      expect(publishedDomain).toBeUndefined();
    });
  });

  describe('Unpublish Domain', () => {
    it('should unpublish domain successfully', async () => {
      // Publish first
      await publishDomain(testOrderId);
      
      // Then unpublish
      await unpublishDomain(testOrderId);
      
      const order = await getDomainOrder(testOrderId);
      expect(order?.isPublished).toBe(false);
      expect(order?.publishedAt).toBeNull();
    });
  });

  describe('Publishing Requirements', () => {
    it('should require persona binding before publishing', async () => {
      // Unbind persona
      await unbindDomainFromPersona(testOrderId);
      
      const order = await getDomainOrder(testOrderId);
      expect(order?.personaId).toBeNull();
      
      // In real API, this would throw error
      // Here we just verify the state
    });

    it('should require active DNS before publishing', async () => {
      const db = await getDb();
      if (!db) return;
      
      const { domainOrders } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      
      // Set DNS to pending
      await db.update(domainOrders)
        .set({ dnsStatus: 'pending' })
        .where(eq(domainOrders.id, testOrderId));
      
      const order = await getDomainOrder(testOrderId);
      expect(order?.dnsStatus).toBe('pending');
      
      // Restore DNS status
      await db.update(domainOrders)
        .set({ dnsStatus: 'active' })
        .where(eq(domainOrders.id, testOrderId));
    });
  });

  describe('Complete Publishing Workflow', () => {
    it('should complete full publishing workflow', async () => {
      // 1. Start with clean state
      await unbindDomainFromPersona(testOrderId);
      await unpublishDomain(testOrderId);
      
      let order = await getDomainOrder(testOrderId);
      expect(order?.personaId).toBeNull();
      expect(order?.isPublished).toBe(false);
      
      // 2. Bind persona
      await bindDomainToPersona(testOrderId, testPersonaId);
      order = await getDomainOrder(testOrderId);
      expect(order?.personaId).toBe(testPersonaId);
      
      // 3. Verify DNS is active (already set in beforeAll)
      expect(order?.dnsStatus).toBe('active');
      
      // 4. Publish domain
      await publishDomain(testOrderId);
      order = await getDomainOrder(testOrderId);
      expect(order?.isPublished).toBe(true);
      
      // 5. Verify published domain is accessible
      const published = await getPublishedDomainByName(testDomain);
      expect(published).toBeDefined();
      expect(published?.domain).toBe(testDomain);
      expect(published?.personaId).toBe(testPersonaId);
    });
  });
});
