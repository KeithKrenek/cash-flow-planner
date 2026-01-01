import { describe, it, expect } from 'vitest';
import {
  toDateString,
  fromDateString,
  formatDisplayDate,
  formatChartDate,
  getNthWeekdayOfMonth,
  getDaysOfMonth,
  getLastDayOfMonth,
  isLeapYear,
  safeSetDate,
  normalizeDate,
  isValidDate,
  isDateBefore,
  isDateAfter,
  isSameDayAs,
  addDaysToDate,
  getDateRange,
} from '@/lib/date-utils';

describe('toDateString', () => {
  it('converts date to YYYY-MM-DD format', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(toDateString(date)).toBe('2024-01-15');
  });

  it('pads single digit months and days', () => {
    const date = new Date(2024, 0, 5); // Jan 5, 2024
    expect(toDateString(date)).toBe('2024-01-05');
  });

  it('handles December correctly', () => {
    const date = new Date(2024, 11, 31); // Dec 31, 2024
    expect(toDateString(date)).toBe('2024-12-31');
  });
});

describe('fromDateString', () => {
  it('parses YYYY-MM-DD to date', () => {
    const date = fromDateString('2024-01-15');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });

  it('returns date at midnight', () => {
    const date = fromDateString('2024-01-15');
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });
});

describe('formatDisplayDate', () => {
  it('formats date as "Jan 15, 2024"', () => {
    const date = new Date(2024, 0, 15);
    expect(formatDisplayDate(date)).toBe('Jan 15, 2024');
  });

  it('handles different months', () => {
    const date = new Date(2024, 11, 25);
    expect(formatDisplayDate(date)).toBe('Dec 25, 2024');
  });
});

describe('formatChartDate', () => {
  it('formats date as "Jan 15"', () => {
    const date = new Date(2024, 0, 15);
    expect(formatChartDate(date)).toBe('Jan 15');
  });
});

describe('getNthWeekdayOfMonth', () => {
  it('finds first Friday of January 2024', () => {
    const result = getNthWeekdayOfMonth(2024, 0, 5, 1);
    expect(toDateString(result)).toBe('2024-01-05');
  });

  it('finds second Tuesday of January 2024', () => {
    const result = getNthWeekdayOfMonth(2024, 0, 2, 2);
    expect(toDateString(result)).toBe('2024-01-09');
  });

  it('finds last Monday of February 2024', () => {
    const result = getNthWeekdayOfMonth(2024, 1, 1, -1);
    expect(toDateString(result)).toBe('2024-02-26');
  });

  it('finds last Friday of January 2024', () => {
    const result = getNthWeekdayOfMonth(2024, 0, 5, -1);
    expect(toDateString(result)).toBe('2024-01-26');
  });

  it('throws for impossible dates (5th Friday in Feb)', () => {
    expect(() => getNthWeekdayOfMonth(2024, 1, 5, 5)).toThrow();
  });

  it('throws for invalid weekday', () => {
    expect(() => getNthWeekdayOfMonth(2024, 0, 7, 1)).toThrow();
    expect(() => getNthWeekdayOfMonth(2024, 0, -1, 1)).toThrow();
  });

  it('throws for invalid week of month', () => {
    expect(() => getNthWeekdayOfMonth(2024, 0, 1, 0)).toThrow();
    expect(() => getNthWeekdayOfMonth(2024, 0, 1, 6)).toThrow();
  });

  it('handles months starting on the target weekday', () => {
    // March 2024 starts on Friday
    const result = getNthWeekdayOfMonth(2024, 2, 5, 1);
    expect(toDateString(result)).toBe('2024-03-01');
  });
});

describe('getDaysOfMonth', () => {
  it('returns correct days', () => {
    const result = getDaysOfMonth(2024, 0, [1, 15, 31]);
    expect(result.map((d) => d.getDate())).toEqual([1, 15, 31]);
  });

  it('handles day overflow in February (leap year)', () => {
    const result = getDaysOfMonth(2024, 1, [30, 31]);
    // Both should resolve to Feb 29 (leap year)
    expect(result[0].getDate()).toBe(29);
    expect(result[1].getDate()).toBe(29);
  });

  it('handles day overflow in February (non-leap year)', () => {
    const result = getDaysOfMonth(2023, 1, [29, 30, 31]);
    // All should resolve to Feb 28
    expect(result[0].getDate()).toBe(28);
    expect(result[1].getDate()).toBe(28);
    expect(result[2].getDate()).toBe(28);
  });

  it('handles day overflow in April (30 days)', () => {
    const result = getDaysOfMonth(2024, 3, [31]);
    expect(result[0].getDate()).toBe(30);
  });

  it('returns correct month and year', () => {
    const result = getDaysOfMonth(2024, 5, [15]);
    expect(result[0].getMonth()).toBe(5); // June
    expect(result[0].getFullYear()).toBe(2024);
  });
});

describe('getLastDayOfMonth', () => {
  it('returns last day of January', () => {
    const result = getLastDayOfMonth(2024, 0);
    expect(result.getDate()).toBe(31);
  });

  it('returns last day of February (leap year)', () => {
    const result = getLastDayOfMonth(2024, 1);
    expect(result.getDate()).toBe(29);
  });

  it('returns last day of February (non-leap year)', () => {
    const result = getLastDayOfMonth(2023, 1);
    expect(result.getDate()).toBe(28);
  });

  it('returns last day of April', () => {
    const result = getLastDayOfMonth(2024, 3);
    expect(result.getDate()).toBe(30);
  });
});

describe('isLeapYear', () => {
  it('returns true for leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1600)).toBe(true);
  });

  it('returns false for non-leap years', () => {
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
  });
});

describe('safeSetDate', () => {
  it('sets date normally when valid', () => {
    const date = new Date(2024, 0, 1);
    const result = safeSetDate(date, 15);
    expect(result.getDate()).toBe(15);
  });

  it('clamps to month end when day overflows', () => {
    const date = new Date(2024, 1, 1); // February 2024
    const result = safeSetDate(date, 31);
    expect(result.getDate()).toBe(29);
  });
});

describe('normalizeDate', () => {
  it('sets time to midnight', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45);
    const result = normalizeDate(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it('preserves date', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45);
    const result = normalizeDate(date);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2024);
  });
});

describe('isValidDate', () => {
  it('returns true for valid dates', () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date(2024, 0, 15))).toBe(true);
  });

  it('returns false for invalid dates', () => {
    expect(isValidDate(new Date('invalid'))).toBe(false);
  });

  it('returns false for non-dates', () => {
    expect(isValidDate('2024-01-15')).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate(123)).toBe(false);
  });
});

describe('isDateBefore', () => {
  it('returns true when a is before b', () => {
    const a = new Date(2024, 0, 14);
    const b = new Date(2024, 0, 15);
    expect(isDateBefore(a, b)).toBe(true);
  });

  it('returns false when a equals b', () => {
    const a = new Date(2024, 0, 15);
    const b = new Date(2024, 0, 15);
    expect(isDateBefore(a, b)).toBe(false);
  });

  it('returns false when a is after b', () => {
    const a = new Date(2024, 0, 16);
    const b = new Date(2024, 0, 15);
    expect(isDateBefore(a, b)).toBe(false);
  });

  it('ignores time component', () => {
    const a = new Date(2024, 0, 15, 23, 59);
    const b = new Date(2024, 0, 15, 0, 0);
    expect(isDateBefore(a, b)).toBe(false);
  });
});

describe('isDateAfter', () => {
  it('returns true when a is after b', () => {
    const a = new Date(2024, 0, 16);
    const b = new Date(2024, 0, 15);
    expect(isDateAfter(a, b)).toBe(true);
  });

  it('returns false when a equals b', () => {
    const a = new Date(2024, 0, 15);
    const b = new Date(2024, 0, 15);
    expect(isDateAfter(a, b)).toBe(false);
  });
});

describe('isSameDayAs', () => {
  it('returns true for same day', () => {
    const a = new Date(2024, 0, 15, 10, 30);
    const b = new Date(2024, 0, 15, 14, 45);
    expect(isSameDayAs(a, b)).toBe(true);
  });

  it('returns false for different days', () => {
    const a = new Date(2024, 0, 15);
    const b = new Date(2024, 0, 16);
    expect(isSameDayAs(a, b)).toBe(false);
  });
});

describe('addDaysToDate', () => {
  it('adds days correctly', () => {
    const date = new Date(2024, 0, 15);
    const result = addDaysToDate(date, 5);
    expect(result.getDate()).toBe(20);
  });

  it('handles month boundary', () => {
    const date = new Date(2024, 0, 31);
    const result = addDaysToDate(date, 1);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(1);
  });

  it('handles negative days', () => {
    const date = new Date(2024, 0, 15);
    const result = addDaysToDate(date, -5);
    expect(result.getDate()).toBe(10);
  });
});

describe('getDateRange', () => {
  it('returns inclusive date range', () => {
    const start = new Date(2024, 0, 15);
    const end = new Date(2024, 0, 18);
    const result = getDateRange(start, end);

    expect(result.length).toBe(4);
    expect(result[0].getDate()).toBe(15);
    expect(result[1].getDate()).toBe(16);
    expect(result[2].getDate()).toBe(17);
    expect(result[3].getDate()).toBe(18);
  });

  it('returns single day for same start and end', () => {
    const date = new Date(2024, 0, 15);
    const result = getDateRange(date, date);
    expect(result.length).toBe(1);
    expect(result[0].getDate()).toBe(15);
  });

  it('handles month boundaries', () => {
    const start = new Date(2024, 0, 31);
    const end = new Date(2024, 1, 2);
    const result = getDateRange(start, end);

    expect(result.length).toBe(3);
    expect(toDateString(result[0])).toBe('2024-01-31');
    expect(toDateString(result[1])).toBe('2024-02-01');
    expect(toDateString(result[2])).toBe('2024-02-02');
  });
});
