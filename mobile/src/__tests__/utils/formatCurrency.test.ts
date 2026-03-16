/**
 * Unit Tests for formatCurrency utility
 */

import { formatCurrency, formatCurrencyAmount } from 'shared/utils/formatCurrency';

describe('formatCurrency', () => {
  it('should format currency with default currency (GHS)', () => {
    const result = formatCurrency(100.5);
    // Intl.NumberFormat may return "GH₵" or "GHS" depending on locale
    expect(result).toMatch(/(GHS|GH₵)/);
    expect(result).toContain('100.50');
  });

  it('should format currency with custom currency', () => {
    const result = formatCurrency(100.5, { currency: 'USD' });
    // Intl.NumberFormat may return "$" or "USD" depending on locale
    expect(result).toMatch(/(USD|\$)/);
    expect(result).toContain('100.50');
  });

  it('should format currency with two decimal places', () => {
    const result = formatCurrency(100.567);
    expect(result).toContain('100.57');
  });

  it('should handle zero amount', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-100.5);
    // Negative amounts - verify it formats correctly (may have - before or after currency symbol)
    expect(result).toMatch(/100\.50/);
    // Result should be a valid string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle large amounts', () => {
    const result = formatCurrency(10000.99);
    // May contain currency symbol and thousand separators (e.g., "10,000.99")
    expect(result).toMatch(/10,?000\.99/);
  });
});

describe('formatCurrencyAmount', () => {
  it('should format amount with default 2 decimals', () => {
    const result = formatCurrencyAmount(123.456);
    expect(result).toBe('123.46');
  });

  it('should format amount with custom decimals', () => {
    const result = formatCurrencyAmount(123.456, 3);
    expect(result).toBe('123.456');
  });

  it('should handle zero amount', () => {
    const result = formatCurrencyAmount(0);
    expect(result).toBe('0.00');
  });
});
