/**
 * Name.com API 服務模組
 * 提供域名搜索、價格查詢、域名購買等功能
 */

const NAMECOM_API_URL = "https://api.name.com/v4";

// 從環境變數獲取憑證
const getCredentials = () => {
  const username = process.env.NAMECOM_USERNAME;
  const token = process.env.NAMECOM_API_TOKEN;
  
  if (!username || !token) {
    throw new Error("Name.com API 憑證未設置");
  }
  
  return { username, token };
};

// 生成 Basic Auth Header
const getAuthHeader = () => {
  const { username, token } = getCredentials();
  return `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`;
};

// 通用 API 請求函數
const apiRequest = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: object
): Promise<T> => {
  const response = await fetch(`${NAMECOM_API_URL}${endpoint}`, {
    method,
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Name.com API 錯誤: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
};

// ============ 類型定義 ============

export interface DomainAvailability {
  domainName: string;
  purchasable: boolean;
  premium: boolean;
  purchasePrice?: number;
  purchaseType?: string;
  renewalPrice?: number;
}

export interface DomainSearchResult {
  results: DomainAvailability[];
}

export interface TldPricing {
  tld: string;
  retail: number;
  registration: number;
  renewal: number;
  transfer: number;
}

export interface DomainPurchaseRequest {
  domain: {
    domainName: string;
    nameservers?: string[];
  };
  purchasePrice: number;
  purchaseType?: string;
  years?: number;
  tldRequirements?: Record<string, string>;
  contacts?: {
    registrant: ContactInfo;
    admin: ContactInfo;
    tech: ContactInfo;
    billing: ContactInfo;
  };
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  companyName?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

export interface DomainInfo {
  domainName: string;
  nameservers: string[];
  contacts: {
    registrant: ContactInfo;
    admin: ContactInfo;
    tech: ContactInfo;
    billing: ContactInfo;
  };
  locked: boolean;
  autorenewEnabled: boolean;
  expireDate: string;
  createDate: string;
}

// ============ API 函數 ============

/**
 * 檢查域名可用性
 * @param domainNames 要檢查的域名列表
 * @returns 域名可用性結果
 */
export const checkDomainAvailability = async (
  domainNames: string[]
): Promise<DomainSearchResult> => {
  return apiRequest<DomainSearchResult>("/domains:checkAvailability", "POST", {
    domainNames,
  });
};

/**
 * 搜索域名（根據關鍵字生成建議）
 * @param keyword 搜索關鍵字
 * @param tlds 要搜索的 TLD 列表（如 ['com', 'net', 'io']）
 * @returns 域名可用性結果
 */
export const searchDomains = async (
  keyword: string,
  tlds: string[] = ["com", "net", "org", "io", "co", "ai"]
): Promise<DomainSearchResult> => {
  // 生成要檢查的域名列表
  const domainNames = tlds.map((tld) => `${keyword}.${tld}`);
  return checkDomainAvailability(domainNames);
};

/**
 * 獲取域名詳細資訊（包括價格）
 * @param domainName 域名
 * @returns 域名資訊
 */
export const getDomainInfo = async (domainName: string): Promise<DomainInfo> => {
  return apiRequest<DomainInfo>(`/domains/${domainName}`);
};

/**
 * 購買域名
 * @param request 購買請求
 * @returns 購買結果
 */
export const purchaseDomain = async (
  request: DomainPurchaseRequest
): Promise<DomainInfo> => {
  return apiRequest<DomainInfo>("/domains", "POST", request);
};

/**
 * 設置域名 DNS 記錄
 * @param domainName 域名
 * @param records DNS 記錄列表
 */
export const setDnsRecords = async (
  domainName: string,
  records: Array<{
    host: string;
    type: string;
    answer: string;
    ttl?: number;
  }>
): Promise<void> => {
  // 先刪除現有記錄，再添加新記錄
  for (const record of records) {
    await apiRequest(`/domains/${domainName}/records`, "POST", {
      ...record,
      ttl: record.ttl || 300,
    });
  }
};

/**
 * 獲取域名 DNS 記錄
 * @param domainName 域名
 * @returns DNS 記錄列表
 */
export const getDnsRecords = async (
  domainName: string
): Promise<Array<{
  id: number;
  domainName: string;
  host: string;
  type: string;
  answer: string;
  ttl: number;
}>> => {
  const result = await apiRequest<{ records: any[] }>(
    `/domains/${domainName}/records`
  );
  return result.records || [];
};

/**
 * 設置域名 Nameservers
 * @param domainName 域名
 * @param nameservers Nameserver 列表
 */
export const setNameservers = async (
  domainName: string,
  nameservers: string[]
): Promise<void> => {
  await apiRequest(`/domains/${domainName}:setNameservers`, "POST", {
    nameservers,
  });
};

/**
 * 驗證 API 連接
 * @returns 用戶名（如果連接成功）
 */
export const verifyConnection = async (): Promise<string> => {
  const result = await apiRequest<{ username: string }>("/hello");
  return result.username;
};

// ============ 價格計算 ============

// Lulubaby 加價比例（30%）
const MARKUP_PERCENTAGE = 0.30;

// USD 到 HKD 匯率（約 7.8）
const USD_TO_HKD_RATE = 7.8;

/**
 * 計算 Lulubaby 售價（含 30% 加價）
 * @param usdPrice Name.com 原價（USD）
 * @returns Lulubaby 售價（HKD）
 */
export const calculateSellingPrice = (usdPrice: number): number => {
  const hkdPrice = usdPrice * USD_TO_HKD_RATE;
  const markedUpPrice = hkdPrice * (1 + MARKUP_PERCENTAGE);
  // 四捨五入到整數
  return Math.round(markedUpPrice);
};

/**
 * 獲取域名價格（含 Lulubaby 加價）
 * @param domainName 域名
 * @returns 價格資訊
 */
export const getDomainPricing = async (
  domainName: string
): Promise<{
  domainName: string;
  available: boolean;
  premium: boolean;
  originalPriceUsd: number;
  sellingPriceHkd: number;
  renewalPriceUsd: number;
  renewalPriceHkd: number;
}> => {
  const result = await checkDomainAvailability([domainName]);
  const domain = result.results[0];

  if (!domain) {
    throw new Error(`無法獲取域名 ${domainName} 的資訊`);
  }

  const originalPriceUsd = domain.purchasePrice || 0;
  const renewalPriceUsd = domain.renewalPrice || originalPriceUsd;

  return {
    domainName: domain.domainName,
    available: domain.purchasable,
    premium: domain.premium,
    originalPriceUsd,
    sellingPriceHkd: calculateSellingPrice(originalPriceUsd),
    renewalPriceUsd,
    renewalPriceHkd: calculateSellingPrice(renewalPriceUsd),
  };
};

/**
 * 批量獲取域名價格
 * @param keyword 搜索關鍵字
 * @param tlds TLD 列表
 * @returns 價格資訊列表
 */
export const searchDomainsWithPricing = async (
  keyword: string,
  tlds: string[] = ["com", "net", "org", "io", "co", "ai"]
): Promise<Array<{
  domainName: string;
  available: boolean;
  premium: boolean;
  originalPriceUsd: number;
  sellingPriceHkd: number;
  renewalPriceHkd: number;
}>> => {
  const result = await searchDomains(keyword, tlds);

  return result.results.map((domain) => {
    const originalPriceUsd = domain.purchasePrice || 0;
    const renewalPriceUsd = domain.renewalPrice || originalPriceUsd;

    return {
      domainName: domain.domainName,
      available: domain.purchasable,
      premium: domain.premium,
      originalPriceUsd,
      sellingPriceHkd: calculateSellingPrice(originalPriceUsd),
      renewalPriceHkd: calculateSellingPrice(renewalPriceUsd),
    };
  });
};
