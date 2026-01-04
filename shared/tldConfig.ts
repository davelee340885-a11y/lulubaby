/**
 * TLD 最低購買年限配置
 * 根據 Name.com 官方文檔：https://www.name.com/api-docs/domains
 */

export interface TLDConfig {
  /** 最低購買年限 */
  minYears: number;
  /** 是否為高級域名 */
  isPremium?: boolean;
}

/**
 * TLD 配置映射
 * 默認最低購買年限為 1 年
 */
export const TLD_CONFIGS: Record<string, TLDConfig> = {
  // .ai 域名需要最低 2 年註冊
  '.ai': {
    minYears: 2,
    isPremium: true,
  },
  // 其他特殊 TLD 可以在這裡添加
  // '.io': { minYears: 1 },
  // '.com': { minYears: 1 },
};

/**
 * 獲取 TLD 的最低購買年限
 * @param tld TLD（例如：'.ai', '.com'）
 * @returns 最低購買年限（默認 1 年）
 */
export const getMinYears = (tld: string): number => {
  const config = TLD_CONFIGS[tld.toLowerCase()];
  return config?.minYears || 1;
};

/**
 * 從域名中提取 TLD
 * @param domainName 完整域名（例如：'example.ai'）
 * @returns TLD（例如：'.ai'）
 */
export const extractTLD = (domainName: string): string => {
  const parts = domainName.split('.');
  if (parts.length < 2) return '';
  return '.' + parts[parts.length - 1];
};

/**
 * 獲取域名的最低購買年限
 * @param domainName 完整域名
 * @returns 最低購買年限
 */
export const getDomainMinYears = (domainName: string): number => {
  const tld = extractTLD(domainName);
  return getMinYears(tld);
};
