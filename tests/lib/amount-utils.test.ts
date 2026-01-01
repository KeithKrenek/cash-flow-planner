import { describe, it, expect } from 'vitest';
import {
  addAmounts,
  subtractAmounts,
  multiplyAmount,
  roundAmount,
  sumAmounts,
  parseAmount,
  isPositiveAmount,
  isNegativeAmount,
  absoluteAmount,
  compareAmounts,
} from '@/lib/amount-utils';

describe('addAmounts', () => {
  it('handles 0.1 + 0.2 without floating point error', () => {
    expect(addAmounts(0.1, 0.2)).toBe(0.3);
  });

  it('adds positive numbers correctly', () => {
    expect(addAmounts(100.5, 50.25)).toBe(150.75);
  });

  it('adds negative numbers correctly', () => {
    expect(addAmounts(-100.5, 50.25)).toBe(-50.25);
  });

  it('handles large amounts', () => {
    expect(addAmounts(999999.99, 0.01)).toBe(1000000);
  });

  it('handles two negative numbers', () => {
    expect(addAmounts(-100, -50)).toBe(-150);
  });

  it('handles zero', () => {
    expect(addAmounts(100, 0)).toBe(100);
    expect(addAmounts(0, 100)).toBe(100);
    expect(addAmounts(0, 0)).toBe(0);
  });
});

describe('subtractAmounts', () => {
  it('handles 0.3 - 0.1 without floating point error', () => {
    expect(subtractAmounts(0.3, 0.1)).toBe(0.2);
  });

  it('subtracts correctly', () => {
    expect(subtractAmounts(100, 30)).toBe(70);
  });

  it('handles negative result', () => {
    expect(subtractAmounts(30, 100)).toBe(-70);
  });

  it('subtracts negative from positive', () => {
    expect(subtractAmounts(100, -50)).toBe(150);
  });
});

describe('multiplyAmount', () => {
  it('multiplies correctly', () => {
    expect(multiplyAmount(10.5, 3)).toBe(31.5);
  });

  it('handles decimal multipliers', () => {
    expect(multiplyAmount(100, 0.5)).toBe(50);
  });

  it('handles negative multipliers', () => {
    expect(multiplyAmount(100, -2)).toBe(-200);
  });

  it('multiplies by zero', () => {
    expect(multiplyAmount(100, 0)).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    expect(multiplyAmount(10, 0.333)).toBe(3.33);
  });
});

describe('roundAmount', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundAmount(10.555)).toBe(10.56);
    expect(roundAmount(10.554)).toBe(10.55);
  });

  it('handles already rounded amounts', () => {
    expect(roundAmount(10.55)).toBe(10.55);
  });

  it('rounds negative numbers correctly', () => {
    // Note: Math.round(-10555) / 100 = -10.55 due to how JavaScript rounds negative numbers
    expect(roundAmount(-10.555)).toBe(-10.55);
    expect(roundAmount(-10.556)).toBe(-10.56);
  });

  it('handles whole numbers', () => {
    expect(roundAmount(100)).toBe(100);
  });
});

describe('sumAmounts', () => {
  it('sums an array of amounts', () => {
    expect(sumAmounts([0.1, 0.2, 0.3])).toBe(0.6);
  });

  it('handles empty array', () => {
    expect(sumAmounts([])).toBe(0);
  });

  it('handles single element', () => {
    expect(sumAmounts([100.5])).toBe(100.5);
  });

  it('handles mixed positive and negative', () => {
    expect(sumAmounts([100, -30, 50, -20])).toBe(100);
  });

  it('handles many small decimals without error', () => {
    const amounts = Array(100).fill(0.01);
    expect(sumAmounts(amounts)).toBe(1);
  });
});

describe('parseAmount', () => {
  it('parses plain numbers', () => {
    expect(parseAmount('100.50')).toBe(100.5);
    expect(parseAmount('100')).toBe(100);
  });

  it('strips currency symbols', () => {
    expect(parseAmount('$100.50')).toBe(100.5);
  });

  it('strips commas', () => {
    expect(parseAmount('$1,234.56')).toBe(1234.56);
    expect(parseAmount('1,000,000')).toBe(1000000);
  });

  it('handles negative numbers', () => {
    expect(parseAmount('-100.50')).toBe(-100.5);
    expect(parseAmount('-$50.00')).toBe(-50);
  });

  it('handles accounting format with parentheses', () => {
    expect(parseAmount('(100.00)')).toBe(-100);
  });

  it('returns null for invalid input', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
  });

  it('handles null and undefined', () => {
    expect(parseAmount(null as unknown as string)).toBeNull();
    expect(parseAmount(undefined as unknown as string)).toBeNull();
  });

  it('handles whitespace', () => {
    expect(parseAmount('  100.50  ')).toBe(100.5);
  });

  it('rounds to 2 decimal places', () => {
    expect(parseAmount('100.555')).toBe(100.56);
  });
});

describe('isPositiveAmount', () => {
  it('returns true for positive amounts', () => {
    expect(isPositiveAmount(100)).toBe(true);
    expect(isPositiveAmount(0.01)).toBe(true);
  });

  it('returns false for zero and negative', () => {
    expect(isPositiveAmount(0)).toBe(false);
    expect(isPositiveAmount(-100)).toBe(false);
  });
});

describe('isNegativeAmount', () => {
  it('returns true for negative amounts', () => {
    expect(isNegativeAmount(-100)).toBe(true);
    expect(isNegativeAmount(-0.01)).toBe(true);
  });

  it('returns false for zero and positive', () => {
    expect(isNegativeAmount(0)).toBe(false);
    expect(isNegativeAmount(100)).toBe(false);
  });
});

describe('absoluteAmount', () => {
  it('returns absolute value', () => {
    expect(absoluteAmount(-100)).toBe(100);
    expect(absoluteAmount(100)).toBe(100);
    expect(absoluteAmount(0)).toBe(0);
  });
});

describe('compareAmounts', () => {
  it('returns negative when a < b', () => {
    expect(compareAmounts(10, 20)).toBeLessThan(0);
  });

  it('returns positive when a > b', () => {
    expect(compareAmounts(20, 10)).toBeGreaterThan(0);
  });

  it('returns zero when equal', () => {
    expect(compareAmounts(10, 10)).toBe(0);
  });

  it('handles floating point comparison correctly', () => {
    expect(compareAmounts(0.1 + 0.2, 0.3)).toBe(0);
  });
});
