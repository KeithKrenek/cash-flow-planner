/**
 * Safe decimal arithmetic for monetary calculations.
 * Avoids floating-point precision errors by working in cents.
 */

const DECIMAL_PLACES = 2;
const MULTIPLIER = 10 ** DECIMAL_PLACES;

/**
 * Convert a number to cents (integer) for safe arithmetic
 */
function toCents(amount: number): number {
  return Math.round(amount * MULTIPLIER);
}

/**
 * Convert cents back to dollars
 */
function fromCents(cents: number): number {
  return cents / MULTIPLIER;
}

/**
 * Add two amounts safely, avoiding floating-point errors.
 * @example addAmounts(0.1, 0.2) // returns 0.3, not 0.30000000000000004
 */
export function addAmounts(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Subtract two amounts safely.
 * @example subtractAmounts(0.3, 0.1) // returns 0.2
 */
export function subtractAmounts(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Multiply an amount by a scalar safely.
 * @example multiplyAmount(10.5, 3) // returns 31.5
 */
export function multiplyAmount(amount: number, multiplier: number): number {
  return fromCents(Math.round(toCents(amount) * multiplier));
}

/**
 * Round an amount to 2 decimal places.
 * @example roundAmount(10.555) // returns 10.56
 */
export function roundAmount(amount: number): number {
  return fromCents(toCents(amount));
}

/**
 * Sum an array of amounts safely.
 * @example sumAmounts([0.1, 0.2, 0.3]) // returns 0.6
 */
export function sumAmounts(amounts: number[]): number {
  const totalCents = amounts.reduce((sum, amount) => sum + toCents(amount), 0);
  return fromCents(totalCents);
}

/**
 * Parse a string to a number amount.
 * Handles currency symbols, commas, and various formats.
 * Returns null for invalid input.
 *
 * @example
 * parseAmount('100.50') // returns 100.5
 * parseAmount('$1,234.56') // returns 1234.56
 * parseAmount('-$50.00') // returns -50
 * parseAmount('abc') // returns null
 * parseAmount('') // returns null
 */
export function parseAmount(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Trim whitespace
  let cleaned = value.trim();

  if (cleaned === '') {
    return null;
  }

  // Check for negative sign at the start or with currency symbol
  let isNegative = false;
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    // Handle accounting format: (100.00) = -100
    isNegative = true;
    cleaned = cleaned.slice(1, -1);
  }

  // Remove currency symbols and thousands separators
  cleaned = cleaned.replace(/[$,]/g, '');

  // Check if it's a negative with symbol after the minus
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1);
  }

  // Try to parse as number
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return null;
  }

  // Apply sign and round to 2 decimal places
  const amount = isNegative ? -parsed : parsed;
  return roundAmount(amount);
}

/**
 * Check if an amount is positive (income).
 */
export function isPositiveAmount(amount: number): boolean {
  return amount > 0;
}

/**
 * Check if an amount is negative (expense).
 */
export function isNegativeAmount(amount: number): boolean {
  return amount < 0;
}

/**
 * Get the absolute value of an amount.
 */
export function absoluteAmount(amount: number): number {
  return Math.abs(amount);
}

/**
 * Compare two amounts for sorting.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareAmounts(a: number, b: number): number {
  return toCents(a) - toCents(b);
}
