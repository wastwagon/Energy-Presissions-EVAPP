/**
 * Currency Formatting Utility
 * Shared between web and mobile
 */

export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    currency = 'GHS',
    locale = 'en-GH',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  // For mobile (React Native), use simple formatting
  if (typeof Intl === 'undefined' || !Intl.NumberFormat) {
    return `${currency} ${amount.toFixed(maximumFractionDigits)}`;
  }

  // For web, use Intl.NumberFormat
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Fallback to simple formatting
    return `${currency} ${amount.toFixed(maximumFractionDigits)}`;
  }
}

/**
 * Format currency without symbol (just number)
 */
export function formatCurrencyAmount(
  amount: number,
  decimals: number = 2
): string {
  return amount.toFixed(decimals);
}
