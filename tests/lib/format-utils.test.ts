import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatSignedCurrency,
  formatCompactCurrency,
  formatOrdinalDay,
  formatRecurrence,
  formatRecurrenceShort,
  formatPercentage,
  formatNumber,
} from '@/lib/format-utils';
import type { RecurrenceRule } from '@/types';

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(0.5)).toBe('$0.50');
  });

  it('formats large amounts', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('formats to 2 decimal places', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });
});

describe('formatSignedCurrency', () => {
  it('adds + prefix to positive amounts', () => {
    expect(formatSignedCurrency(100)).toBe('+$100.00');
  });

  it('shows negative amounts with -', () => {
    expect(formatSignedCurrency(-100)).toBe('-$100.00');
  });

  it('shows zero without sign', () => {
    expect(formatSignedCurrency(0)).toBe('$0.00');
  });
});

describe('formatCompactCurrency', () => {
  it('formats millions as M', () => {
    expect(formatCompactCurrency(1500000)).toBe('$1.5M');
  });

  it('formats thousands as K', () => {
    expect(formatCompactCurrency(1500)).toBe('$1.5K');
  });

  it('formats small amounts normally', () => {
    expect(formatCompactCurrency(500)).toBe('$500.00');
  });

  it('handles negative amounts', () => {
    expect(formatCompactCurrency(-1500)).toBe('$-1.5K');
  });
});

describe('formatOrdinalDay', () => {
  it('formats 1st correctly', () => {
    expect(formatOrdinalDay(1)).toBe('1st');
    expect(formatOrdinalDay(21)).toBe('21st');
    expect(formatOrdinalDay(31)).toBe('31st');
  });

  it('formats 2nd correctly', () => {
    expect(formatOrdinalDay(2)).toBe('2nd');
    expect(formatOrdinalDay(22)).toBe('22nd');
  });

  it('formats 3rd correctly', () => {
    expect(formatOrdinalDay(3)).toBe('3rd');
    expect(formatOrdinalDay(23)).toBe('23rd');
  });

  it('formats 11th, 12th, 13th correctly', () => {
    expect(formatOrdinalDay(11)).toBe('11th');
    expect(formatOrdinalDay(12)).toBe('12th');
    expect(formatOrdinalDay(13)).toBe('13th');
  });

  it('formats other numbers with th', () => {
    expect(formatOrdinalDay(4)).toBe('4th');
    expect(formatOrdinalDay(15)).toBe('15th');
    expect(formatOrdinalDay(30)).toBe('30th');
  });
});

describe('formatRecurrence', () => {
  it('returns "One-time" for null', () => {
    expect(formatRecurrence(null)).toBe('One-time');
  });

  describe('daily', () => {
    it('formats daily', () => {
      const rule: RecurrenceRule = { frequency: 'daily' };
      expect(formatRecurrence(rule)).toBe('Daily');
    });

    it('formats every N days', () => {
      const rule: RecurrenceRule = { frequency: 'daily', interval: 3 };
      expect(formatRecurrence(rule)).toBe('Every 3 days');
    });
  });

  describe('weekly', () => {
    it('formats weekly', () => {
      const rule: RecurrenceRule = { frequency: 'weekly' };
      expect(formatRecurrence(rule)).toBe('Weekly');
    });

    it('formats every N weeks', () => {
      const rule: RecurrenceRule = { frequency: 'weekly', interval: 2 };
      expect(formatRecurrence(rule)).toBe('Every 2 weeks');
    });
  });

  describe('biweekly', () => {
    it('formats biweekly', () => {
      const rule: RecurrenceRule = { frequency: 'biweekly' };
      expect(formatRecurrence(rule)).toBe('Bi-weekly');
    });
  });

  describe('monthly', () => {
    it('formats monthly on single day', () => {
      const rule: RecurrenceRule = { frequency: 'monthly', daysOfMonth: [15] };
      expect(formatRecurrence(rule)).toBe('Monthly on the 15th');
    });

    it('formats monthly on multiple days', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        daysOfMonth: [1, 15, 30],
      };
      expect(formatRecurrence(rule)).toBe('Monthly on the 1st, 15th and 30th');
    });

    it('formats monthly last day', () => {
      const rule: RecurrenceRule = { frequency: 'monthly', lastDayOfMonth: true };
      expect(formatRecurrence(rule)).toBe('Monthly on the last day');
    });

    it('formats monthly nth weekday (1st Friday)', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        weekday: 5,
        weekOfMonth: 1,
      };
      expect(formatRecurrence(rule)).toBe('Monthly on the 1st Friday');
    });

    it('formats monthly last weekday (last Monday)', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        weekday: 1,
        weekOfMonth: -1,
      };
      expect(formatRecurrence(rule)).toBe('Monthly on the last Monday');
    });

    it('formats every N months', () => {
      const rule: RecurrenceRule = {
        frequency: 'monthly',
        interval: 3,
        daysOfMonth: [1],
      };
      expect(formatRecurrence(rule)).toBe('Every 3 months on the 1st');
    });
  });

  describe('yearly', () => {
    it('formats yearly', () => {
      const rule: RecurrenceRule = { frequency: 'yearly' };
      expect(formatRecurrence(rule)).toBe('Yearly');
    });

    it('formats every N years', () => {
      const rule: RecurrenceRule = { frequency: 'yearly', interval: 2 };
      expect(formatRecurrence(rule)).toBe('Every 2 years');
    });
  });
});

describe('formatRecurrenceShort', () => {
  it('returns "Once" for null', () => {
    expect(formatRecurrenceShort(null)).toBe('Once');
  });

  it('returns frequency label for interval 1', () => {
    expect(formatRecurrenceShort({ frequency: 'daily' })).toBe('Daily');
    expect(formatRecurrenceShort({ frequency: 'weekly' })).toBe('Weekly');
    expect(formatRecurrenceShort({ frequency: 'monthly' })).toBe('Monthly');
    expect(formatRecurrenceShort({ frequency: 'yearly' })).toBe('Yearly');
  });

  it('returns "Bi-weekly" for biweekly', () => {
    expect(formatRecurrenceShort({ frequency: 'biweekly' })).toBe('Bi-weekly');
  });

  it('shows interval for interval > 1', () => {
    expect(formatRecurrenceShort({ frequency: 'daily', interval: 3 })).toBe(
      '3x Daily'
    );
    expect(formatRecurrenceShort({ frequency: 'weekly', interval: 2 })).toBe(
      '2x Weekly'
    );
  });
});

describe('formatPercentage', () => {
  it('formats with default 1 decimal', () => {
    expect(formatPercentage(15.5)).toBe('15.5%');
  });

  it('formats with custom decimals', () => {
    // toFixed uses banker's rounding, so 15.555 rounds to 15.55
    expect(formatPercentage(15.555, 2)).toBe('15.55%');
    expect(formatPercentage(15.556, 2)).toBe('15.56%');
    expect(formatPercentage(15, 0)).toBe('15%');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles small numbers', () => {
    expect(formatNumber(123)).toBe('123');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });

  it('handles decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });
});
