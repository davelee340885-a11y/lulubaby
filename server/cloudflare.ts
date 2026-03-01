/**
 * Cloudflare API Helper Functions
 * 
 * Provides functions to interact with Cloudflare API for Zone and Worker management.
 * All operations are idempotent: if a resource already exists, it is reused instead of failing.
 */

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.warn("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in environment variables");
}

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

interface Zone {
  id: string;
  name: string;
  status: "pending" | "active" | "moved" | "deleted";
  paused: boolean;
  type: "full" | "partial";
  name_servers: string[];
  original_name_servers: string[];
  activated_on: string | null;
  created_on: string;
  modified_on: string;
}

interface WorkerRoute {
  id: string;
  pattern: string;
  script: string;
}

/**
 * Look up an existing Cloudflare Zone by domain name.
 * Returns null if not found.
 */
async function findExistingZone(domain: string): Promise<Zone | null> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones?name=${encodeURIComponent(domain)}`, {
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
  });
  const data: CloudflareResponse<Zone[]> = await response.json();
  if (data.success && data.result && data.result.length > 0) {
    return data.result[0];
  }
  return null;
}

/**
 * Create a new Zone in Cloudflare, or reuse the existing one if it already exists.
 * This makes the operation idempotent.
 */
export async function createCloudflareZone(domain: string): Promise<Zone> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: domain,
      account: {
        id: CLOUDFLARE_ACCOUNT_ID,
      },
      jump_start: true,
      type: "full",
    }),
  });

  const data: CloudflareResponse<Zone> = await response.json();

  if (data.success) {
    console.log(`[cloudflare] Zone created for ${domain}: ${data.result.id}`);
    return data.result;
  }

  // Error code 1061 = zone already exists — reuse it
  const alreadyExists = data.errors.some(e => e.code === 1061);
  if (alreadyExists) {
    console.log(`[cloudflare] Zone already exists for ${domain}, looking up existing zone...`);
    const existing = await findExistingZone(domain);
    if (existing) {
      console.log(`[cloudflare] Reusing existing zone ${existing.id} for ${domain}`);
      return existing;
    }
    throw new Error(`Zone already exists for ${domain} but could not be retrieved`);
  }

  throw new Error(`Failed to create Cloudflare Zone: ${data.errors.map(e => e.message).join(", ")}`);
}

/**
 * Get Zone information by Zone ID
 */
export async function getCloudflareZone(zoneId: string): Promise<Zone> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
  });

  const data: CloudflareResponse<Zone> = await response.json();

  if (!data.success) {
    throw new Error(`Failed to get Cloudflare Zone: ${data.errors.map(e => e.message).join(", ")}`);
  }

  return data.result;
}

/**
 * List existing Worker Routes for a Zone.
 */
async function listWorkerRoutes(zoneId: string): Promise<WorkerRoute[]> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/workers/routes`, {
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
  });
  const data: CloudflareResponse<WorkerRoute[]> = await response.json();
  return data.success ? data.result : [];
}

/**
 * Create a Worker Route for a Zone, or reuse the existing one if the pattern already exists.
 * This makes the operation idempotent.
 */
export async function createWorkerRoute(
  zoneId: string,
  domain: string,
  workerScript: string = "lulubaby-domain-router"
): Promise<WorkerRoute> {
  const pattern = `${domain}/*`;

  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/workers/routes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pattern,
      script: workerScript,
    }),
  });

  const data: CloudflareResponse<WorkerRoute> = await response.json();

  if (data.success) {
    console.log(`[cloudflare] Worker route created for ${pattern}: ${data.result.id}`);
    return data.result;
  }

  // Error code 10020 = route with same pattern already exists — reuse it
  const alreadyExists = data.errors.some(e => e.code === 10020);
  if (alreadyExists) {
    console.log(`[cloudflare] Worker route already exists for ${pattern}, looking up existing route...`);
    const routes = await listWorkerRoutes(zoneId);
    const existing = routes.find(r => r.pattern === pattern);
    if (existing) {
      console.log(`[cloudflare] Reusing existing worker route ${existing.id} for ${pattern}`);
      return existing;
    }
    throw new Error(`Worker route already exists for ${pattern} but could not be retrieved`);
  }

  throw new Error(`Failed to create Worker Route: ${data.errors.map(e => e.message).join(", ")}`);
}

/**
 * Update Nameservers at Name.com to point to Cloudflare
 */
export async function updateNamecomNameservers(domain: string, nameservers: string[]): Promise<void> {
  const NAMECOM_USERNAME = process.env.NAMECOM_USERNAME;
  const NAMECOM_API_TOKEN = process.env.NAMECOM_API_TOKEN;

  if (!NAMECOM_USERNAME || !NAMECOM_API_TOKEN) {
    throw new Error("Missing NAMECOM_USERNAME or NAMECOM_API_TOKEN in environment variables");
  }

  const auth = Buffer.from(`${NAMECOM_USERNAME}:${NAMECOM_API_TOKEN}`).toString("base64");

  const response = await fetch(`https://api.name.com/v4/domains/${domain}:setNameservers`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nameservers,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update Name.com Nameservers: ${error.message || response.statusText}`);
  }

  console.log(`[cloudflare] Updated Name.com nameservers for ${domain}: ${nameservers.join(", ")}`);
}

/**
 * Get existing DNS records for a zone
 */
async function getExistingDnsRecords(zoneId: string): Promise<Array<{ id: string; type: string; name: string; content: string }>> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records`, {
    headers: { "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}` },
  });
  const data: CloudflareResponse<Array<{ id: string; type: string; name: string; content: string }>> = await response.json();
  return data.success ? data.result : [];
}

/**
 * Create required DNS records for a domain zone.
 * Cloudflare Workers Routes require at least one proxied DNS record to work.
 * If records already exist, reuse them instead of failing.
 */
export async function createDnsRecords(zoneId: string, domain: string): Promise<{ aRecordId: string; cnameRecordId: string }> {
  // Fetch existing records first to avoid duplicate errors
  const existing = await getExistingDnsRecords(zoneId);

  // --- A record ---
  let aRecordId: string;
  const existingA = existing.find(r => r.type === "A" && r.name === domain);
  if (existingA) {
    console.log(`[cloudflare] A record already exists for ${domain}, reusing id=${existingA.id}`);
    aRecordId = existingA.id;
  } else {
    const aResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "A",
        name: domain,
        content: "192.0.2.1",  // placeholder IP - proxied traffic goes to Worker
        ttl: 1,
        proxied: true,
      }),
    });
    const aData: CloudflareResponse<{ id: string }> = await aResponse.json();
    if (!aData.success) {
      throw new Error(`Failed to create A record: ${aData.errors.map(e => e.message).join(", ")}`);
    }
    aRecordId = aData.result.id;
    console.log(`[cloudflare] A record created for ${domain}: ${aRecordId}`);
  }

  // --- CNAME record ---
  let cnameRecordId: string;
  const existingCNAME = existing.find(r => r.type === "CNAME" && (r.name === `www.${domain}` || r.name === "www"));
  if (existingCNAME) {
    console.log(`[cloudflare] CNAME record already exists for www.${domain}, reusing id=${existingCNAME.id}`);
    cnameRecordId = existingCNAME.id;
  } else {
    const cnameResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "CNAME",
        name: "www",
        content: domain,
        ttl: 1,
        proxied: true,
      }),
    });
    const cnameData: CloudflareResponse<{ id: string }> = await cnameResponse.json();
    if (!cnameData.success) {
      throw new Error(`Failed to create CNAME record: ${cnameData.errors.map(e => e.message).join(", ")}`);
    }
    cnameRecordId = cnameData.result.id;
    console.log(`[cloudflare] CNAME record created for www.${domain}: ${cnameRecordId}`);
  }

  return { aRecordId, cnameRecordId };
}

/**
 * Complete domain setup: Create Zone (or reuse), Configure DNS Records, Worker Route, Update Nameservers.
 * This entire function is idempotent — safe to call multiple times for the same domain.
 */
export async function setupCustomDomain(domain: string): Promise<{
  zoneId: string;
  nameservers: string[];
  routeId: string;
  aRecordId: string;
  cnameRecordId: string;
}> {
  console.log(`[cloudflare] Starting setup for ${domain}...`);

  // Step 1: Create Cloudflare Zone (or reuse if already exists)
  const zone = await createCloudflareZone(domain);
  console.log(`[cloudflare] Zone ready: ${zone.id} (status: ${zone.status})`);

  // Step 2: Create DNS Records (required for Workers Routes to work)
  const dnsRecords = await createDnsRecords(zone.id, domain);

  // Step 3: Create Worker Route (or reuse if already exists)
  const route = await createWorkerRoute(zone.id, domain);

  // Step 4: Update Nameservers at Name.com to point to Cloudflare
  await updateNamecomNameservers(domain, zone.name_servers);

  console.log(`[cloudflare] Setup complete for ${domain}`);
  return {
    zoneId: zone.id,
    nameservers: zone.name_servers,
    routeId: route.id,
    aRecordId: dnsRecords.aRecordId,
    cnameRecordId: dnsRecords.cnameRecordId,
  };
}
