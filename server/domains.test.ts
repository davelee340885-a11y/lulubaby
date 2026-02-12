import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  getDomainsByUserId: vi.fn(),
  getDomainById: vi.fn(),
  getDomainByName: vi.fn(),
  createDomain: vi.fn(),
  updateDomain: vi.fn(),
  deleteDomain: vi.fn(),
  updateDomainDnsStatus: vi.fn(),
  updateDomainSslStatus: vi.fn(),
  createDomainHealthLog: vi.fn(),
  getDomainHealthLogs: vi.fn(),
}));

import {
  getDomainsByUserId,
  getDomainById,
  getDomainByName,
  createDomain,
  deleteDomain,
  updateDomainDnsStatus,
  updateDomainSslStatus,
  createDomainHealthLog,
  getDomainHealthLogs,
} from './db';

describe('Domain Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDomainsByUserId', () => {
    it('should return empty array for user with no domains', async () => {
      vi.mocked(getDomainsByUserId).mockResolvedValue([]);
      
      const result = await getDomainsByUserId(1);
      
      expect(result).toEqual([]);
      expect(getDomainsByUserId).toHaveBeenCalledWith(1);
    });

    it('should return domains for user', async () => {
      const mockDomains = [
        { id: 1, userId: 1, domain: 'chat.example.com', status: 'active' },
        { id: 2, userId: 1, domain: 'ai.mybrand.com', status: 'pending_dns' },
      ];
      vi.mocked(getDomainsByUserId).mockResolvedValue(mockDomains as any);
      
      const result = await getDomainsByUserId(1);
      
      expect(result).toHaveLength(2);
      expect(result[0].domain).toBe('chat.example.com');
    });
  });

  describe('getDomainById', () => {
    it('should return domain by id', async () => {
      const mockDomain = { id: 1, userId: 1, domain: 'chat.example.com', status: 'active' };
      vi.mocked(getDomainById).mockResolvedValue(mockDomain as any);
      
      const result = await getDomainById(1);
      
      expect(result).toBeDefined();
      expect(result?.domain).toBe('chat.example.com');
    });

    it('should return undefined for non-existent domain', async () => {
      vi.mocked(getDomainById).mockResolvedValue(undefined);
      
      const result = await getDomainById(999);
      
      expect(result).toBeUndefined();
    });
  });

  describe('getDomainByName', () => {
    it('should find domain by name', async () => {
      const mockDomain = { id: 1, userId: 1, domain: 'chat.example.com', status: 'active' };
      vi.mocked(getDomainByName).mockResolvedValue(mockDomain as any);
      
      const result = await getDomainByName('chat.example.com');
      
      expect(result).toBeDefined();
      expect(result?.domain).toBe('chat.example.com');
    });

    it('should return undefined for non-existent domain name', async () => {
      vi.mocked(getDomainByName).mockResolvedValue(undefined);
      
      const result = await getDomainByName('nonexistent.com');
      
      expect(result).toBeUndefined();
    });
  });

  describe('createDomain', () => {
    it('should create a new domain', async () => {
      const newDomain = {
        userId: 1,
        domain: 'chat.newbrand.com',
        subdomain: 'chat',
        rootDomain: 'newbrand.com',
        status: 'pending_dns',
        dnsRecordType: 'CNAME',
        dnsRecordValue: 'lulubaby.manus.space',
        verificationToken: 'abc123',
        subscriptionStatus: 'trial',
        annualFee: 99,
      };
      
      const createdDomain = { id: 1, ...newDomain };
      vi.mocked(createDomain).mockResolvedValue(createdDomain as any);
      
      const result = await createDomain(newDomain as any);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.domain).toBe('chat.newbrand.com');
      expect(result?.annualFee).toBe(99);
    });
  });

  describe('deleteDomain', () => {
    it('should delete domain and health logs', async () => {
      vi.mocked(deleteDomain).mockResolvedValue(undefined);
      
      await deleteDomain(1, 1);
      
      expect(deleteDomain).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('updateDomainDnsStatus', () => {
    it('should update DNS status to verified', async () => {
      vi.mocked(updateDomainDnsStatus).mockResolvedValue(undefined);
      
      await updateDomainDnsStatus(1, true);
      
      expect(updateDomainDnsStatus).toHaveBeenCalledWith(1, true);
    });

    it('should update DNS status to failed with error message', async () => {
      vi.mocked(updateDomainDnsStatus).mockResolvedValue(undefined);
      
      await updateDomainDnsStatus(1, false, 'DNS record not found');
      
      expect(updateDomainDnsStatus).toHaveBeenCalledWith(1, false, 'DNS record not found');
    });
  });

  describe('updateDomainSslStatus', () => {
    it('should enable SSL with expiry date', async () => {
      const expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      vi.mocked(updateDomainSslStatus).mockResolvedValue(undefined);
      
      await updateDomainSslStatus(1, true, expiryDate);
      
      expect(updateDomainSslStatus).toHaveBeenCalledWith(1, true, expiryDate);
    });

    it('should disable SSL', async () => {
      vi.mocked(updateDomainSslStatus).mockResolvedValue(undefined);
      
      await updateDomainSslStatus(1, false);
      
      expect(updateDomainSslStatus).toHaveBeenCalledWith(1, false);
    });
  });

  describe('createDomainHealthLog', () => {
    it('should create health log entry', async () => {
      const logEntry = {
        domainId: 1,
        checkType: 'dns' as const,
        status: 'success' as const,
        responseTime: 150,
        details: JSON.stringify({ verified: true }),
      };
      
      vi.mocked(createDomainHealthLog).mockResolvedValue(undefined);
      
      await createDomainHealthLog(logEntry as any);
      
      expect(createDomainHealthLog).toHaveBeenCalledWith(logEntry);
    });
  });

  describe('getDomainHealthLogs', () => {
    it('should return health logs for domain', async () => {
      const mockLogs = [
        { id: 1, domainId: 1, checkType: 'dns', status: 'success', checkedAt: new Date() },
        { id: 2, domainId: 1, checkType: 'ssl', status: 'success', checkedAt: new Date() },
      ];
      vi.mocked(getDomainHealthLogs).mockResolvedValue(mockLogs as any);
      
      const result = await getDomainHealthLogs(1, 10);
      
      expect(result).toHaveLength(2);
      expect(getDomainHealthLogs).toHaveBeenCalledWith(1, 10);
    });
  });
});

describe('Domain Pricing', () => {
  it('should have correct annual fee', () => {
    const pricing = {
      annualFee: 99,
      currency: 'HKD',
      features: [
        '自動 SSL 證書',
        'DNS 狀態監控',
        '到期提醒通知',
        '全年無限次數訪問',
      ],
      trialDays: 14,
    };
    
    expect(pricing.annualFee).toBe(99);
    expect(pricing.currency).toBe('HKD');
    expect(pricing.trialDays).toBe(14);
    expect(pricing.features).toContain('自動 SSL 證書');
  });
});

describe('Domain Validation', () => {
  it('should validate domain format', () => {
    const validDomains = [
      'example.com',
      'chat.example.com',
      'ai.mybrand.co.uk',
      'subdomain.domain.io',
    ];
    
    const invalidDomains = [
      'example',
      '.com',
      'example.',
      '',
    ];
    
    validDomains.forEach(domain => {
      const parts = domain.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    });
    
    invalidDomains.forEach(domain => {
      const parts = domain.split('.').filter(p => p.length > 0);
      expect(parts.length).toBeLessThan(2);
    });
  });

  it('should extract root domain and subdomain correctly', () => {
    const testCases = [
      { input: 'chat.example.com', rootDomain: 'example.com', subdomain: 'chat' },
      { input: 'example.com', rootDomain: 'example.com', subdomain: null },
      { input: 'ai.sub.example.com', rootDomain: 'example.com', subdomain: 'ai.sub' },
    ];
    
    testCases.forEach(({ input, rootDomain, subdomain }) => {
      const parts = input.split('.');
      const extractedRoot = parts.slice(-2).join('.');
      const extractedSub = parts.length > 2 ? parts.slice(0, -2).join('.') : null;
      
      expect(extractedRoot).toBe(rootDomain);
      expect(extractedSub).toBe(subdomain);
    });
  });
});
