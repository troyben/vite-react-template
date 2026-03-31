/**
 * Global currency configuration.
 * Change these values to switch currency across the entire system.
 */

export interface CurrencyConfig {
  code: string;       // ISO 4217 code (USD, EUR, GBP, ZAR, etc.)
  symbol: string;     // Display symbol ($, €, £, R, etc.)
  locale: string;     // Intl locale for formatting (en-US, en-GB, en-ZA, etc.)
  decimals: number;   // Number of decimal places
}

// ---- Active currency — change this one object to switch currency globally ----
export const CURRENCY: CurrencyConfig = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
  decimals: 2,
};

/**
 * Format a numeric value as currency using the global config.
 * Handles string inputs, NaN, null, undefined gracefully.
 */
export function formatCurrency(amount: unknown): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return `${CURRENCY.symbol}0.${'0'.repeat(CURRENCY.decimals)}`;
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: CURRENCY.decimals,
    maximumFractionDigits: CURRENCY.decimals,
  }).format(num);
}
