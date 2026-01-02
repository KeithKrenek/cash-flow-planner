import { describe, it, expect } from 'vitest';
import {
  expandRecurringTransaction,
  expandAllTransactions,
  getNextOccurrence,
} from '@/lib/recurrence';
import { toDateString, fromDateString } from '@/lib/date-utils';
import type { DbTransaction, RecurrenceRule } from '@/types/database';

// Helper to create a test transaction
function createTransaction(
  overrides: Partial<DbTransaction> & { recurrence_rule?: RecurrenceRule | null }
): DbTransaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'account-1',
    description: 'Test Transaction',
    amount: -100,
    category: null,
    date: '2024-01-01',
    is_recurring: true,
    recurrence_rule: { frequency: 'daily' },
    end_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('expandRecurringTransaction', () => {
  describe('non-recurring transactions', () => {
    it('returns empty array for non-recurring transactions', () => {
      const tx = createTransaction({ is_recurring: false, recurrence_rule: null });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-31');

      const result = expandRecurringTransaction(tx, start, end);
      expect(result).toEqual([]);
    });

    it('returns empty array if recurrence_rule is null', () => {
      const tx = createTransaction({ is_recurring: true, recurrence_rule: null });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-31');

      const result = expandRecurringTransaction(tx, start, end);
      expect(result).toEqual([]);
    });
  });

  describe('daily frequency', () => {
    it('expands daily transactions', () => {
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'daily' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-05');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(5);
      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-04',
        '2024-01-05',
      ]);
    });

    it('expands daily with interval', () => {
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'daily', interval: 3 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-10');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-01',
        '2024-01-04',
        '2024-01-07',
        '2024-01-10',
      ]);
    });

    it('handles start date after range start', () => {
      const tx = createTransaction({
        date: '2024-01-15',
        recurrence_rule: { frequency: 'daily' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-18');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(4);
      expect(result[0].dateString).toBe('2024-01-15');
    });
  });

  describe('weekly frequency', () => {
    it('expands weekly maintaining day of week', () => {
      // Jan 1, 2024 is a Monday
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'weekly' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-01', // Monday
        '2024-01-08', // Monday
        '2024-01-15', // Monday
        '2024-01-22', // Monday
        '2024-01-29', // Monday
      ]);
    });

    it('expands weekly with interval', () => {
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'weekly', interval: 2 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-02-15');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-01',
        '2024-01-15',
        '2024-01-29',
        '2024-02-12',
      ]);
    });
  });

  describe('biweekly frequency', () => {
    it('expands biweekly from anchor date', () => {
      const tx = createTransaction({
        date: '2024-01-05', // Friday
        recurrence_rule: { frequency: 'biweekly' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-02-28');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-05',
        '2024-01-19',
        '2024-02-02',
        '2024-02-16',
      ]);
    });
  });

  describe('monthly frequency - days of month', () => {
    it('expands monthly on specific day', () => {
      const tx = createTransaction({
        date: '2024-01-15',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [15] },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-04-30');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-15',
        '2024-02-15',
        '2024-03-15',
        '2024-04-15',
      ]);
    });

    it('handles 31st in February (clamps to 28/29)', () => {
      const tx = createTransaction({
        date: '2024-01-31',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [31] },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-04-30');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-31',
        '2024-02-29', // Leap year
        '2024-03-31',
        '2024-04-30', // April only has 30 days
      ]);
    });

    it('handles 30th in February non-leap year', () => {
      const tx = createTransaction({
        date: '2023-01-30',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [30] },
      });
      const start = fromDateString('2023-01-01');
      const end = fromDateString('2023-03-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2023-01-30',
        '2023-02-28', // Non-leap year, clamped to 28
        '2023-03-30',
      ]);
    });

    it('handles multiple days of month', () => {
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [1, 15] },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-03-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-01',
        '2024-01-15',
        '2024-02-01',
        '2024-02-15',
        '2024-03-01',
        '2024-03-15',
      ]);
    });

    it('expands monthly with interval', () => {
      const tx = createTransaction({
        date: '2024-01-15',
        recurrence_rule: { frequency: 'monthly', interval: 2, daysOfMonth: [15] },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-06-30');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-15',
        '2024-03-15',
        '2024-05-15',
      ]);
    });
  });

  describe('monthly frequency - last day of month', () => {
    it('expands last day of month correctly', () => {
      const tx = createTransaction({
        date: '2024-01-31',
        recurrence_rule: { frequency: 'monthly', lastDayOfMonth: true },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-05-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-31',
        '2024-02-29', // Leap year
        '2024-03-31',
        '2024-04-30',
        '2024-05-31',
      ]);
    });
  });

  describe('monthly frequency - nth weekday', () => {
    it('finds 1st Friday of each month', () => {
      const tx = createTransaction({
        date: '2024-01-05', // First Friday of Jan 2024
        recurrence_rule: { frequency: 'monthly', weekday: 5, weekOfMonth: 1 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-04-30');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-05',
        '2024-02-02',
        '2024-03-01',
        '2024-04-05',
      ]);
    });

    it('finds 2nd Tuesday of each month', () => {
      const tx = createTransaction({
        date: '2024-01-09', // Second Tuesday of Jan 2024
        recurrence_rule: { frequency: 'monthly', weekday: 2, weekOfMonth: 2 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-04-30');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-09',
        '2024-02-13',
        '2024-03-12',
        '2024-04-09',
      ]);
    });

    it('finds last Friday of each month', () => {
      const tx = createTransaction({
        date: '2024-01-26', // Last Friday of Jan 2024
        recurrence_rule: { frequency: 'monthly', weekday: 5, weekOfMonth: -1 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-04-30');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-26',
        '2024-02-23',
        '2024-03-29',
        '2024-04-26',
      ]);
    });

    it('finds last Monday of each month', () => {
      const tx = createTransaction({
        date: '2024-01-29', // Last Monday of Jan 2024
        recurrence_rule: { frequency: 'monthly', weekday: 1, weekOfMonth: -1 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-03-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-29',
        '2024-02-26',
        '2024-03-25',
      ]);
    });
  });

  describe('yearly frequency', () => {
    it('expands yearly on same date', () => {
      const tx = createTransaction({
        date: '2024-03-15',
        recurrence_rule: { frequency: 'yearly' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2027-12-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-03-15',
        '2025-03-15',
        '2026-03-15',
        '2027-03-15',
      ]);
    });

    it('handles Feb 29 in non-leap years', () => {
      const tx = createTransaction({
        date: '2024-02-29', // Leap year
        recurrence_rule: { frequency: 'yearly' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2028-12-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-02-29', // Leap year
        '2025-02-28', // Non-leap, clamped to 28
        '2026-02-28', // Non-leap
        '2027-02-28', // Non-leap
        '2028-02-29', // Leap year
      ]);
    });

    it('expands yearly with interval', () => {
      const tx = createTransaction({
        date: '2024-07-04',
        recurrence_rule: { frequency: 'yearly', interval: 2 },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2030-12-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result.map((r) => r.dateString)).toEqual([
        '2024-07-04',
        '2026-07-04',
        '2028-07-04',
        '2030-07-04',
      ]);
    });
  });

  describe('end date handling', () => {
    it('respects end date for daily', () => {
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'daily' },
        end_date: '2024-01-05',
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-01-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(5);
      expect(result[result.length - 1].dateString).toBe('2024-01-05');
    });

    it('respects end date for monthly', () => {
      const tx = createTransaction({
        date: '2024-01-15',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [15] },
        end_date: '2024-03-15',
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-12-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.dateString)).toEqual([
        '2024-01-15',
        '2024-02-15',
        '2024-03-15',
      ]);
    });

    it('returns empty if end date is before range start', () => {
      const tx = createTransaction({
        date: '2024-01-01',
        recurrence_rule: { frequency: 'daily' },
        end_date: '2024-01-15',
      });
      const start = fromDateString('2024-02-01');
      const end = fromDateString('2024-02-28');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty if transaction starts after range ends', () => {
      const tx = createTransaction({
        date: '2024-06-01',
        recurrence_rule: { frequency: 'daily' },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-03-31');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(0);
    });

    it('handles same start and end date', () => {
      const tx = createTransaction({
        date: '2024-01-15',
        recurrence_rule: { frequency: 'daily' },
      });
      const start = fromDateString('2024-01-15');
      const end = fromDateString('2024-01-15');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result).toHaveLength(1);
      expect(result[0].dateString).toBe('2024-01-15');
    });

    it('preserves transaction metadata', () => {
      const tx = createTransaction({
        id: 'tx-special',
        description: 'Monthly Rent',
        amount: -1500,
        category: 'Housing',
        account_id: 'account-checking',
        date: '2024-01-01',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [1] },
      });
      const start = fromDateString('2024-01-01');
      const end = fromDateString('2024-02-01');

      const result = expandRecurringTransaction(tx, start, end);

      expect(result[0]).toMatchObject({
        sourceId: 'tx-special',
        description: 'Monthly Rent',
        amount: -1500,
        category: 'Housing',
        accountId: 'account-checking',
      });
    });
  });
});

describe('expandAllTransactions', () => {
  it('expands multiple recurring transactions', () => {
    const transactions: DbTransaction[] = [
      createTransaction({
        id: 'tx-1',
        date: '2024-01-01',
        recurrence_rule: { frequency: 'weekly' },
      }),
      createTransaction({
        id: 'tx-2',
        date: '2024-01-15',
        recurrence_rule: { frequency: 'monthly', daysOfMonth: [15] },
      }),
    ];

    const start = fromDateString('2024-01-01');
    const end = fromDateString('2024-01-31');

    const result = expandAllTransactions(transactions, start, end);

    // Weekly: Jan 1, 8, 15, 22, 29 (5)
    // Monthly: Jan 15 (1)
    expect(result).toHaveLength(6);
  });

  it('filters out non-recurring transactions', () => {
    const transactions: DbTransaction[] = [
      createTransaction({
        id: 'tx-1',
        is_recurring: true,
        date: '2024-01-01',
        recurrence_rule: { frequency: 'daily' },
      }),
      createTransaction({
        id: 'tx-2',
        is_recurring: false,
        recurrence_rule: null,
      }),
    ];

    const start = fromDateString('2024-01-01');
    const end = fromDateString('2024-01-05');

    const result = expandAllTransactions(transactions, start, end);

    expect(result).toHaveLength(5);
    expect(result.every((r) => r.sourceId === 'tx-1')).toBe(true);
  });

  it('sorts results by date', () => {
    const transactions: DbTransaction[] = [
      createTransaction({
        id: 'tx-1',
        date: '2024-01-05',
        recurrence_rule: { frequency: 'daily' },
      }),
      createTransaction({
        id: 'tx-2',
        date: '2024-01-01',
        recurrence_rule: { frequency: 'daily' },
      }),
    ];

    const start = fromDateString('2024-01-01');
    const end = fromDateString('2024-01-10');

    const result = expandAllTransactions(transactions, start, end);

    // Check that dates are sorted
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date.getTime()).toBeGreaterThanOrEqual(
        result[i - 1].date.getTime()
      );
    }
  });
});

describe('getNextOccurrence', () => {
  it('returns next occurrence for daily', () => {
    const tx = createTransaction({
      date: '2024-01-01',
      recurrence_rule: { frequency: 'daily' },
    });

    const after = fromDateString('2024-01-15');
    const result = getNextOccurrence(tx, after);

    expect(result).not.toBeNull();
    expect(toDateString(result!)).toBe('2024-01-16');
  });

  it('returns next occurrence for monthly', () => {
    const tx = createTransaction({
      date: '2024-01-15',
      recurrence_rule: { frequency: 'monthly', daysOfMonth: [15] },
    });

    const after = fromDateString('2024-01-20');
    const result = getNextOccurrence(tx, after);

    expect(result).not.toBeNull();
    expect(toDateString(result!)).toBe('2024-02-15');
  });

  it('returns null for non-recurring', () => {
    const tx = createTransaction({
      is_recurring: false,
      recurrence_rule: null,
    });

    const after = fromDateString('2024-01-01');
    const result = getNextOccurrence(tx, after);

    expect(result).toBeNull();
  });

  it('returns null if no more occurrences', () => {
    const tx = createTransaction({
      date: '2024-01-01',
      recurrence_rule: { frequency: 'daily' },
      end_date: '2024-01-10',
    });

    const after = fromDateString('2024-01-15');
    const result = getNextOccurrence(tx, after);

    expect(result).toBeNull();
  });
});
