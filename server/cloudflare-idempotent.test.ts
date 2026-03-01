/**
 * Tests for idempotent Cloudflare operations
 * Verifies that Zone/Route/DNS creation gracefully handles "already exists" errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock fetch globally ────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Helper: build a Cloudflare API response ───────────────────────────────────

function cfSuccess<T>(result: T) {
  return { ok: true, json: async () => ({ success: true, errors: [], messages: [], result }) };
}

function cfError(code: number, message: string) {
  return { ok: false, json: async () => ({ success: false, errors: [{ code, message }], messages: [], result: null }) };
}

// ── Zone fixtures ─────────────────────────────────────────────────────────────

const MOCK_ZONE = {
  id: 'zone-abc123',
  name: 'example.xyz',
  status: 'active',
  paused: false,
  type: 'full',
  name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
  original_name_servers: [],
  activated_on: null,
  created_on: '2026-01-01T00:00:00Z',
  modified_on: '2026-01-01T00:00:00Z',
};

const MOCK_ROUTE = {
  id: 'route-xyz789',
  pattern: 'example.xyz/*',
  script: 'lulubaby-domain-router',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createCloudflareZone', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Reset module so env vars take effect
    vi.resetModules();
    process.env.CLOUDFLARE_API_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
  });

  it('creates a new zone successfully', async () => {
    mockFetch.mockResolvedValueOnce(cfSuccess(MOCK_ZONE));

    const { createCloudflareZone } = await import('./cloudflare');
    const zone = await createCloudflareZone('example.xyz');

    expect(zone.id).toBe('zone-abc123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('reuses existing zone when error code 1061 is returned', async () => {
    // First call: zone already exists
    mockFetch.mockResolvedValueOnce(cfError(1061, 'example.xyz already exists'));
    // Second call: lookup existing zone
    mockFetch.mockResolvedValueOnce(cfSuccess([MOCK_ZONE]));

    const { createCloudflareZone } = await import('./cloudflare');
    const zone = await createCloudflareZone('example.xyz');

    expect(zone.id).toBe('zone-abc123');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws for non-1061 errors', async () => {
    mockFetch.mockResolvedValueOnce(cfError(9999, 'Some other error'));

    const { createCloudflareZone } = await import('./cloudflare');
    await expect(createCloudflareZone('example.xyz')).rejects.toThrow('Some other error');
  });
});

describe('createWorkerRoute', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
    process.env.CLOUDFLARE_API_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
  });

  it('creates a new worker route successfully', async () => {
    mockFetch.mockResolvedValueOnce(cfSuccess(MOCK_ROUTE));

    const { createWorkerRoute } = await import('./cloudflare');
    const route = await createWorkerRoute('zone-abc123', 'example.xyz');

    expect(route.id).toBe('route-xyz789');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('reuses existing route when error code 10020 is returned', async () => {
    // First call: route already exists
    mockFetch.mockResolvedValueOnce(cfError(10020, 'A route with the same pattern already exists'));
    // Second call: list existing routes
    mockFetch.mockResolvedValueOnce(cfSuccess([MOCK_ROUTE]));

    const { createWorkerRoute } = await import('./cloudflare');
    const route = await createWorkerRoute('zone-abc123', 'example.xyz');

    expect(route.id).toBe('route-xyz789');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws for non-10020 errors', async () => {
    mockFetch.mockResolvedValueOnce(cfError(9999, 'Unexpected error'));

    const { createWorkerRoute } = await import('./cloudflare');
    await expect(createWorkerRoute('zone-abc123', 'example.xyz')).rejects.toThrow('Unexpected error');
  });
});

describe('createDnsRecords', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
    process.env.CLOUDFLARE_API_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
  });

  it('creates A and CNAME records when none exist', async () => {
    // 1. List existing records → empty
    mockFetch.mockResolvedValueOnce(cfSuccess([]));
    // 2. Create A record
    mockFetch.mockResolvedValueOnce(cfSuccess({ id: 'a-record-id' }));
    // 3. Create CNAME record
    mockFetch.mockResolvedValueOnce(cfSuccess({ id: 'cname-record-id' }));

    const { createDnsRecords } = await import('./cloudflare');
    const result = await createDnsRecords('zone-abc123', 'example.xyz');

    expect(result.aRecordId).toBe('a-record-id');
    expect(result.cnameRecordId).toBe('cname-record-id');
  });

  it('reuses existing A and CNAME records without creating new ones', async () => {
    const existingRecords = [
      { id: 'existing-a', type: 'A', name: 'example.xyz', content: '1.2.3.4' },
      { id: 'existing-cname', type: 'CNAME', name: 'www.example.xyz', content: 'example.xyz' },
    ];
    // 1. List existing records → both exist
    mockFetch.mockResolvedValueOnce(cfSuccess(existingRecords));

    const { createDnsRecords } = await import('./cloudflare');
    const result = await createDnsRecords('zone-abc123', 'example.xyz');

    expect(result.aRecordId).toBe('existing-a');
    expect(result.cnameRecordId).toBe('existing-cname');
    // Should only call fetch once (to list records), not to create new ones
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('setupCustomDomain (full idempotent flow)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
    process.env.CLOUDFLARE_API_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
    process.env.NAMECOM_USERNAME = 'test-user';
    process.env.NAMECOM_API_TOKEN = 'test-token';
  });

  it('completes full setup for a new domain', async () => {
    // 1. Create zone → success
    mockFetch.mockResolvedValueOnce(cfSuccess(MOCK_ZONE));
    // 2. List DNS records → empty
    mockFetch.mockResolvedValueOnce(cfSuccess([]));
    // 3. Create A record
    mockFetch.mockResolvedValueOnce(cfSuccess({ id: 'a-id' }));
    // 4. Create CNAME record
    mockFetch.mockResolvedValueOnce(cfSuccess({ id: 'cname-id' }));
    // 5. Create worker route → success
    mockFetch.mockResolvedValueOnce(cfSuccess(MOCK_ROUTE));
    // 6. Update Name.com nameservers → success
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { setupCustomDomain } = await import('./cloudflare');
    const result = await setupCustomDomain('example.xyz');

    expect(result.zoneId).toBe('zone-abc123');
    expect(result.routeId).toBe('route-xyz789');
    expect(result.nameservers).toEqual(['ns1.cloudflare.com', 'ns2.cloudflare.com']);
  });

  it('completes full setup even when zone and route already exist (idempotent retry)', async () => {
    // 1. Create zone → already exists (1061)
    mockFetch.mockResolvedValueOnce(cfError(1061, 'example.xyz already exists'));
    // 2. Lookup existing zone
    mockFetch.mockResolvedValueOnce(cfSuccess([MOCK_ZONE]));
    // 3. List DNS records → A and CNAME already exist
    mockFetch.mockResolvedValueOnce(cfSuccess([
      { id: 'existing-a', type: 'A', name: 'example.xyz', content: '1.2.3.4' },
      { id: 'existing-cname', type: 'CNAME', name: 'www.example.xyz', content: 'example.xyz' },
    ]));
    // 4. Create worker route → already exists (10020)
    mockFetch.mockResolvedValueOnce(cfError(10020, 'A route with the same pattern already exists'));
    // 5. List existing routes
    mockFetch.mockResolvedValueOnce(cfSuccess([MOCK_ROUTE]));
    // 6. Update Name.com nameservers → success
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { setupCustomDomain } = await import('./cloudflare');
    const result = await setupCustomDomain('example.xyz');

    expect(result.zoneId).toBe('zone-abc123');
    expect(result.routeId).toBe('route-xyz789');
    // Should NOT throw even though everything already existed
  });
});
