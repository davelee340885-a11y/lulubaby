/**
 * Multi-currency support for domain purchase system
 */

export type Currency = 'USD' | 'HKD';

export const EXCHANGE_RATES = {
  USD_TO_HKD: 7.8,
  HKD_TO_USD: 1 / 7.8,
} as const;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  HKD: 'HK$',
};

export const MANAGEMENT_FEE: Record<Currency, number> = {
  USD: 12.99,
  HKD: 99.00,
};

/**
 * Convert price from USD to target currency
 */
export function convertPrice(
  amountUsd: number,
  targetCurrency: Currency
): number {
  if (targetCurrency === 'USD') {
    return amountUsd;
  }
  
  // Convert to HKD
  return Math.round(amountUsd * EXCHANGE_RATES.USD_TO_HKD * 100) / 100;
}

/**
 * Convert price from any currency to USD
 */
export function convertToUsd(
  amount: number,
  sourceCurrency: Currency
): number {
  if (sourceCurrency === 'USD') {
    return amount;
  }
  
  // Convert from HKD to USD
  return Math.round(amount * EXCHANGE_RATES.HKD_TO_USD * 100) / 100;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Detect currency based on user's region/locale
 * Default to USD for international customers
 */
export function detectCurrency(locale?: string, countryCode?: string): Currency {
  // Hong Kong customers
  if (locale?.startsWith('zh-HK') || countryCode === 'HK') {
    return 'HKD';
  }
  
  // Default to USD for all other regions
  return 'USD';
}
