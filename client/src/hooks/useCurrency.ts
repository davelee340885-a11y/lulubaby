import { useState, useEffect } from 'react';
import type { Currency } from '../../../shared/currency';

/**
 * Hook to detect and manage user's preferred currency
 * Detects based on browser locale and provides currency switching
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('preferred_currency');
    if (saved === 'USD' || saved === 'HKD') {
      return saved;
    }
    
    // Detect from browser locale
    const locale = navigator.language || 'en-US';
    return locale.startsWith('zh-HK') || locale.startsWith('zh-TW') ? 'HKD' : 'USD';
  });

  // Save to localStorage when currency changes
  useEffect(() => {
    localStorage.setItem('preferred_currency', currency);
  }, [currency]);

  return {
    currency,
    setCurrency,
    isHKD: currency === 'HKD',
    isUSD: currency === 'USD',
  };
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  const symbol = currency === 'USD' ? '$' : 'HK$';
  return `${symbol}${amount.toFixed(2)}`;
}
