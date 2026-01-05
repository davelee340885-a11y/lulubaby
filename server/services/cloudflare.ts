/**
 * Cloudflare API Client for Domain DNS and SSL Management
 * 
 * This service handles:
 * 1. Adding domains to Cloudflare (create zone)
 * 2. Configuring DNS records (CNAME to lulubaby.manus.space)
 * 3. Managing SSL certificates
 * 4. Checking DNS propagation status
 * 
 * Prerequisites:
 * - Cloudflare API Token with Zone:Edit permissions
 * - Cloudflare Account ID
 * 
 * Environment Variables Required:
 * - CLOUDFLARE_API_TOKEN: API token for authentication
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 */

// Configuration - Will be set via environment variables
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';
const TARGET_HOST = 'lulubaby.manus.space';

// Types
export interface CloudflareConfig {
  apiToken: string;
  accountId: string;
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  nameServers: string[];
}

export interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

export interface DomainSetupResult {
  success: boolean;
  zoneId?: string;
  cnameRecordId?: string;
  nameservers?: string[];
  error?: string;
}

export interface DnsCheckResult {
  propagated: boolean;
  currentNameservers?: string[];
  expectedNameservers?: string[];
  error?: string;
}

export interface SslCheckResult {
  status: 'pending' | 'provisioning' | 'active' | 'error';
  certificateStatus?: string;
  error?: string;
}

/**
 * Get Cloudflare configuration from environment variables
 */
function getConfig(): CloudflareConfig | null {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!apiToken || !accountId) {
    console.warn('[Cloudflare] API Token or Account ID not configured');
    return null;
  }
  
  return { apiToken, accountId };
}

/**
 * Make authenticated request to Cloudflare API
 */
async function cloudflareRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; result?: T; errors?: any[] }> {
  const config = getConfig();
  
  if (!config) {
    return { success: false, errors: [{ message: 'Cloudflare not configured' }] };
  }
  
  const url = `${CLOUDFLARE_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Cloudflare] API request failed:', error);
    return { 
      success: false, 
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }] 
    };
  }
}

/**
 * Create a new zone for a domain in Cloudflare
 */
export async function createZone(domain: string): Promise<DomainSetupResult> {
  const config = getConfig();
  
  if (!config) {
    return { 
      success: false, 
      error: 'Cloudflare API Token 和 Account ID 尚未配置。請在設定中添加 CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID。' 
    };
  }
  
  console.log(`[Cloudflare] Creating zone for domain: ${domain}`);
  
  const response = await cloudflareRequest<CloudflareZone>('/zones', {
    method: 'POST',
    body: JSON.stringify({
      name: domain,
      account: { id: config.accountId },
      type: 'full', // Full setup - Cloudflare manages DNS
    }),
  });
  
  if (!response.success || !response.result) {
    const errorMessage = response.errors?.[0]?.message || 'Failed to create zone';
    console.error(`[Cloudflare] Failed to create zone: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
  
  const zone = response.result;
  console.log(`[Cloudflare] Zone created successfully: ${zone.id}`);
  
  return {
    success: true,
    zoneId: zone.id,
    nameservers: zone.nameServers,
  };
}

/**
 * Add CNAME record pointing to target host
 */
export async function addCnameRecord(
  zoneId: string,
  domain: string,
  targetHost: string = TARGET_HOST
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  console.log(`[Cloudflare] Adding CNAME record for ${domain} -> ${targetHost}`);
  
  // Add root domain CNAME (using @ or the domain name)
  const response = await cloudflareRequest<CloudflareDnsRecord>(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'CNAME',
      name: '@', // Root domain
      content: targetHost,
      proxied: true, // Enable Cloudflare proxy for SSL
      ttl: 1, // Auto TTL
    }),
  });
  
  if (!response.success || !response.result) {
    const errorMessage = response.errors?.[0]?.message || 'Failed to create CNAME record';
    console.error(`[Cloudflare] Failed to create CNAME: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
  
  console.log(`[Cloudflare] CNAME record created: ${response.result.id}`);
  
  // Also add www subdomain
  await cloudflareRequest<CloudflareDnsRecord>(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'CNAME',
      name: 'www',
      content: targetHost,
      proxied: true,
      ttl: 1,
    }),
  });
  
  return {
    success: true,
    recordId: response.result.id,
  };
}

/**
 * Check DNS propagation status
 */
export async function checkDnsPropagation(domain: string, expectedNameservers: string[]): Promise<DnsCheckResult> {
  console.log(`[Cloudflare] Checking DNS propagation for ${domain}`);
  
  try {
    // Use DNS lookup to check current nameservers
    const { execSync } = await import('child_process');
    const result = execSync(`dig +short NS ${domain}`, { encoding: 'utf-8' });
    const currentNameservers = result.trim().split('\n').filter(Boolean).map(ns => ns.replace(/\.$/, ''));
    
    // Check if nameservers match Cloudflare's
    const propagated = expectedNameservers.some(expected => 
      currentNameservers.some(current => current.includes(expected.replace(/\.$/, '')))
    );
    
    return {
      propagated,
      currentNameservers,
      expectedNameservers,
    };
  } catch (error) {
    console.error(`[Cloudflare] DNS check failed:`, error);
    return {
      propagated: false,
      error: error instanceof Error ? error.message : 'DNS lookup failed',
    };
  }
}

/**
 * Check SSL certificate status for a zone
 */
export async function checkSslStatus(zoneId: string): Promise<SslCheckResult> {
  console.log(`[Cloudflare] Checking SSL status for zone: ${zoneId}`);
  
  const response = await cloudflareRequest<{ status: string }>(`/zones/${zoneId}/ssl/verification`);
  
  if (!response.success) {
    return { 
      status: 'error', 
      error: response.errors?.[0]?.message || 'Failed to check SSL status' 
    };
  }
  
  // Cloudflare automatically provisions SSL for proxied domains
  // Check the zone's SSL settings
  const sslResponse = await cloudflareRequest<{ value: string }>(`/zones/${zoneId}/settings/ssl`);
  
  if (sslResponse.success && sslResponse.result) {
    const sslMode = sslResponse.result.value;
    
    if (sslMode === 'full' || sslMode === 'strict') {
      return { status: 'active', certificateStatus: sslMode };
    } else if (sslMode === 'flexible') {
      return { status: 'active', certificateStatus: 'flexible' };
    }
  }
  
  return { status: 'provisioning' };
}

/**
 * Enable Full SSL mode for a zone
 */
export async function enableFullSsl(zoneId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[Cloudflare] Enabling Full SSL for zone: ${zoneId}`);
  
  const response = await cloudflareRequest(`/zones/${zoneId}/settings/ssl`, {
    method: 'PATCH',
    body: JSON.stringify({ value: 'full' }),
  });
  
  if (!response.success) {
    return { 
      success: false, 
      error: response.errors?.[0]?.message || 'Failed to enable SSL' 
    };
  }
  
  return { success: true };
}

/**
 * Update nameservers at Name.com for a domain
 * This is called after creating a Cloudflare zone to point the domain to Cloudflare
 */
export async function updateNamecomNameservers(
  domain: string,
  nameservers: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Cloudflare] Updating nameservers at Name.com for ${domain}`);
  
  // Import Name.com API client
  const { setNameservers } = await import('../namecom');
  
  try {
    await setNameservers(domain, nameservers);
    return { success: true };
  } catch (error) {
    console.error(`[Cloudflare] Failed to update nameservers:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update nameservers' 
    };
  }
}

/**
 * Complete domain setup: Create zone, add DNS records, update nameservers
 */
export async function setupDomain(domain: string): Promise<DomainSetupResult> {
  console.log(`[Cloudflare] Starting complete domain setup for: ${domain}`);
  
  // Step 1: Create Cloudflare zone
  const zoneResult = await createZone(domain);
  if (!zoneResult.success) {
    return zoneResult;
  }
  
  // Step 2: Add CNAME record
  const cnameResult = await addCnameRecord(zoneResult.zoneId!, domain);
  if (!cnameResult.success) {
    return { 
      success: false, 
      zoneId: zoneResult.zoneId,
      error: cnameResult.error 
    };
  }
  
  // Step 3: Enable Full SSL
  await enableFullSsl(zoneResult.zoneId!);
  
  // Step 4: Update nameservers at Name.com
  if (zoneResult.nameservers) {
    const nsResult = await updateNamecomNameservers(domain, zoneResult.nameservers);
    if (!nsResult.success) {
      console.warn(`[Cloudflare] Nameserver update failed, manual update may be required: ${nsResult.error}`);
      // Don't fail the whole setup, just warn
    }
  }
  
  return {
    success: true,
    zoneId: zoneResult.zoneId,
    cnameRecordId: cnameResult.recordId,
    nameservers: zoneResult.nameservers,
  };
}

/**
 * Check if Cloudflare is configured
 */
export function isCloudflareConfigured(): boolean {
  const config = getConfig();
  return config !== null;
}

/**
 * Get configuration status for display
 */
export function getConfigurationStatus(): { 
  configured: boolean; 
  message: string;
  requiredEnvVars: string[];
} {
  const config = getConfig();
  
  if (config) {
    return {
      configured: true,
      message: 'Cloudflare API 已配置，可以自動設置 DNS 和 SSL。',
      requiredEnvVars: [],
    };
  }
  
  const missing: string[] = [];
  if (!process.env.CLOUDFLARE_API_TOKEN) missing.push('CLOUDFLARE_API_TOKEN');
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) missing.push('CLOUDFLARE_ACCOUNT_ID');
  
  return {
    configured: false,
    message: '需要配置 Cloudflare API 才能自動設置 DNS 和 SSL。',
    requiredEnvVars: missing,
  };
}
