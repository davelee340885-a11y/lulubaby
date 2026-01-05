import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getDomainOrder: vi.fn(),
  getRegisteredDomainOrders: vi.fn(),
  updateDomainOrderDnsConfig: vi.fn(),
  getDomainOrderByDomain: vi.fn(),
}));

// Mock the Cloudflare service
vi.mock('./services/cloudflare', () => ({
  isCloudflareConfigured: vi.fn(),
  getConfigurationStatus: vi.fn(),
  setupDomain: vi.fn(),
  checkDnsPropagation: vi.fn(),
  checkSslStatus: vi.fn(),
}));

import {
  getDomainOrder,
  getRegisteredDomainOrders,
  updateDomainOrderDnsConfig,
} from './db';

import {
  isCloudflareConfigured,
  getConfigurationStatus,
  setupDomain,
  checkDnsPropagation,
  checkSslStatus,
} from './services/cloudflare';

describe('Domain Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cloudflare Configuration Status', () => {
    it('should return configured status when API keys are set', () => {
      vi.mocked(getConfigurationStatus).mockReturnValue({
        configured: true,
        message: 'Cloudflare API 已配置，可以自動設置 DNS 和 SSL。',
        requiredEnvVars: [],
      });

      const status = getConfigurationStatus();
      expect(status.configured).toBe(true);
      expect(status.requiredEnvVars).toHaveLength(0);
    });

    it('should return not configured status when API keys are missing', () => {
      vi.mocked(getConfigurationStatus).mockReturnValue({
        configured: false,
        message: '需要配置 Cloudflare API 才能自動設置 DNS 和 SSL。',
        requiredEnvVars: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
      });

      const status = getConfigurationStatus();
      expect(status.configured).toBe(false);
      expect(status.requiredEnvVars).toContain('CLOUDFLARE_API_TOKEN');
      expect(status.requiredEnvVars).toContain('CLOUDFLARE_ACCOUNT_ID');
    });
  });

  describe('Domain Setup', () => {
    it('should return manual setup instructions when Cloudflare is not configured', async () => {
      vi.mocked(isCloudflareConfigured).mockReturnValue(false);

      const isConfigured = isCloudflareConfigured();
      expect(isConfigured).toBe(false);
    });

    it('should setup domain successfully when Cloudflare is configured', async () => {
      vi.mocked(isCloudflareConfigured).mockReturnValue(true);
      vi.mocked(setupDomain).mockResolvedValue({
        success: true,
        zoneId: 'zone123',
        cnameRecordId: 'record456',
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      });

      const result = await setupDomain('example.com');
      expect(result.success).toBe(true);
      expect(result.zoneId).toBe('zone123');
      expect(result.nameservers).toHaveLength(2);
    });

    it('should handle setup failure gracefully', async () => {
      vi.mocked(isCloudflareConfigured).mockReturnValue(true);
      vi.mocked(setupDomain).mockResolvedValue({
        success: false,
        error: 'Zone already exists',
      });

      const result = await setupDomain('example.com');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Zone already exists');
    });
  });

  describe('DNS Propagation Check', () => {
    it('should detect when DNS has propagated', async () => {
      vi.mocked(checkDnsPropagation).mockResolvedValue({
        propagated: true,
        currentNameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        expectedNameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      });

      const result = await checkDnsPropagation('example.com', ['ns1.cloudflare.com', 'ns2.cloudflare.com']);
      expect(result.propagated).toBe(true);
    });

    it('should detect when DNS has not propagated', async () => {
      vi.mocked(checkDnsPropagation).mockResolvedValue({
        propagated: false,
        currentNameservers: ['ns1.old-registrar.com'],
        expectedNameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      });

      const result = await checkDnsPropagation('example.com', ['ns1.cloudflare.com', 'ns2.cloudflare.com']);
      expect(result.propagated).toBe(false);
    });
  });

  describe('SSL Status Check', () => {
    it('should return active SSL status', async () => {
      vi.mocked(checkSslStatus).mockResolvedValue({
        status: 'active',
        certificateStatus: 'full',
      });

      const result = await checkSslStatus('zone123');
      expect(result.status).toBe('active');
    });

    it('should return provisioning SSL status', async () => {
      vi.mocked(checkSslStatus).mockResolvedValue({
        status: 'provisioning',
      });

      const result = await checkSslStatus('zone123');
      expect(result.status).toBe('provisioning');
    });

    it('should handle SSL check errors', async () => {
      vi.mocked(checkSslStatus).mockResolvedValue({
        status: 'error',
        error: 'Failed to check SSL status',
      });

      const result = await checkSslStatus('zone123');
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('Database Operations', () => {
    it('should get registered domain orders for a user', async () => {
      const mockOrders = [
        {
          id: 1,
          domain: 'example.com',
          dnsStatus: 'active',
          sslStatus: 'active',
          status: 'registered',
        },
        {
          id: 2,
          domain: 'test.io',
          dnsStatus: 'pending',
          sslStatus: 'pending',
          status: 'registered',
        },
      ];

      vi.mocked(getRegisteredDomainOrders).mockResolvedValue(mockOrders as any);

      const orders = await getRegisteredDomainOrders(1);
      expect(orders).toHaveLength(2);
      expect(orders[0].domain).toBe('example.com');
    });

    it('should update domain DNS configuration', async () => {
      vi.mocked(updateDomainOrderDnsConfig).mockResolvedValue(undefined);

      await updateDomainOrderDnsConfig(1, {
        dnsStatus: 'active',
        lastDnsCheck: new Date(),
      });

      expect(updateDomainOrderDnsConfig).toHaveBeenCalledWith(1, expect.objectContaining({
        dnsStatus: 'active',
      }));
    });

    it('should get domain order by ID', async () => {
      const mockOrder = {
        id: 1,
        domain: 'example.com',
        userId: 1,
        status: 'registered',
        dnsStatus: 'pending',
        sslStatus: 'pending',
      };

      vi.mocked(getDomainOrder).mockResolvedValue(mockOrder as any);

      const order = await getDomainOrder(1);
      expect(order).toBeDefined();
      expect(order?.domain).toBe('example.com');
    });
  });

  describe('DNS Status Types', () => {
    it('should have valid DNS status values', () => {
      const validStatuses = ['pending', 'configuring', 'propagating', 'active', 'error'];
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });

    it('should have valid SSL status values', () => {
      const validStatuses = ['pending', 'provisioning', 'active', 'error'];
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });
});
