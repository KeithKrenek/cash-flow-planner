import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionsApi } from '@/api/transactions';
import { supabase } from '@/lib/supabase';
import { mockData } from '../mocks/supabase';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('transactionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns transactions sorted by date descending', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.transactions,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.getAll();

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toEqual(mockData.transactions);
    });
  });

  describe('getByAccountId', () => {
    it('returns transactions for specific account', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.transactions,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.getByAccountId('account-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('account_id', 'account-1');
      expect(result).toEqual(mockData.transactions);
    });
  });

  describe('getById', () => {
    it('returns transaction when found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.transactions[0],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.getById('transaction-1');
      expect(result).toEqual(mockData.transactions[0]);
    });

    it('returns null when not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getRecurring', () => {
    it('returns only recurring transactions', async () => {
      const recurringOnly = mockData.transactions.filter((t) => t.is_recurring);
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: recurringOnly,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.getRecurring();

      expect(mockQuery.eq).toHaveBeenCalledWith('is_recurring', true);
      expect(result.every((t) => t.is_recurring)).toBe(true);
    });
  });

  describe('getOneTimeInDateRange', () => {
    it('returns one-time transactions in date range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await transactionsApi.getOneTimeInDateRange('2024-01-01', '2024-01-31');

      expect(mockQuery.eq).toHaveBeenCalledWith('is_recurring', false);
      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31');
    });
  });

  describe('getForProjection', () => {
    it('returns transactions for projection', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.transactions,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.getForProjection('2024-01-01', '2024-01-31');

      expect(mockQuery.or).toHaveBeenCalled();
      expect(result).toEqual(mockData.transactions);
    });
  });

  describe('create', () => {
    it('creates and returns new transaction', async () => {
      const newTransaction = {
        user_id: 'user-123',
        account_id: 'account-1',
        description: 'Coffee',
        amount: -5.5,
        category: 'Food',
        date: '2024-01-15',
        is_recurring: false,
        recurrence_rule: null,
        end_date: null,
      };
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'transaction-new',
            ...newTransaction,
            created_at: '2024-01-15',
            updated_at: '2024-01-15',
          },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.create(newTransaction);

      expect(mockQuery.insert).toHaveBeenCalledWith(newTransaction);
      expect(result.description).toBe('Coffee');
    });
  });

  describe('createMany', () => {
    it('creates multiple transactions', async () => {
      const newTransactions = [
        {
          user_id: 'user-123',
          account_id: 'account-1',
          description: 'Coffee',
          amount: -5.5,
          category: 'Food',
          date: '2024-01-15',
          is_recurring: false,
          recurrence_rule: null,
          end_date: null,
        },
        {
          user_id: 'user-123',
          account_id: 'account-1',
          description: 'Lunch',
          amount: -15,
          category: 'Food',
          date: '2024-01-15',
          is_recurring: false,
          recurrence_rule: null,
          end_date: null,
        },
      ];
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: newTransactions.map((t, i) => ({
            id: `transaction-${i}`,
            ...t,
            created_at: '2024-01-15',
            updated_at: '2024-01-15',
          })),
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.createMany(newTransactions);

      expect(mockQuery.insert).toHaveBeenCalledWith(newTransactions);
      expect(result.length).toBe(2);
    });

    it('returns empty array for empty input', async () => {
      const result = await transactionsApi.createMany([]);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates and returns transaction', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockData.transactions[0], description: 'Updated' },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.update('transaction-1', {
        description: 'Updated',
      });

      expect(mockQuery.update).toHaveBeenCalledWith({ description: 'Updated' });
      expect(result.description).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes transaction successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(transactionsApi.delete('transaction-1')).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'transaction-1');
    });
  });

  describe('deleteMany', () => {
    it('deletes multiple transactions', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(
        transactionsApi.deleteMany(['transaction-1', 'transaction-2'])
      ).resolves.not.toThrow();
      expect(mockQuery.in).toHaveBeenCalledWith('id', [
        'transaction-1',
        'transaction-2',
      ]);
    });

    it('does nothing for empty array', async () => {
      await expect(transactionsApi.deleteMany([])).resolves.not.toThrow();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteByAccountId', () => {
    it('deletes all transactions for account', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(
        transactionsApi.deleteByAccountId('account-1')
      ).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('account_id', 'account-1');
    });
  });

  describe('findDuplicate', () => {
    it('returns transaction when duplicate found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.transactions[0],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.findDuplicate(
        '2024-01-15',
        'Paycheck',
        3000,
        'account-1'
      );

      expect(mockQuery.eq).toHaveBeenCalledWith('date', '2024-01-15');
      expect(mockQuery.ilike).toHaveBeenCalledWith('description', 'Paycheck');
      expect(result).toEqual(mockData.transactions[0]);
    });

    it('returns null when no duplicate found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await transactionsApi.findDuplicate(
        '2024-01-15',
        'Unique',
        100,
        'account-1'
      );
      expect(result).toBeNull();
    });
  });
});
