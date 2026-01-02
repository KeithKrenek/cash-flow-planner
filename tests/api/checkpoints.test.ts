import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkpointsApi } from '@/api/checkpoints';
import { supabase } from '@/lib/supabase';
import { mockData } from '../mocks/supabase';
import { AppError } from '@/lib/errors';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('checkpointsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns checkpoints sorted by date descending', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.checkpoints,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.getAll();

      expect(supabase.from).toHaveBeenCalledWith('balance_checkpoints');
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toEqual(mockData.checkpoints);
    });
  });

  describe('getByAccountId', () => {
    it('returns checkpoints for specific account', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.checkpoints,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.getByAccountId('account-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('account_id', 'account-1');
      expect(result).toEqual(mockData.checkpoints);
    });
  });

  describe('getById', () => {
    it('returns checkpoint when found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.checkpoints[0],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.getById('checkpoint-1');
      expect(result).toEqual(mockData.checkpoints[0]);
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

      const result = await checkpointsApi.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getMostRecentForAccount', () => {
    it('returns most recent checkpoint before date', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.checkpoints[0],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.getMostRecentForAccount(
        'account-1',
        '2024-01-15'
      );

      expect(mockQuery.eq).toHaveBeenCalledWith('account_id', 'account-1');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-15');
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockData.checkpoints[0]);
    });

    it('returns null when no checkpoint exists', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.getMostRecentForAccount(
        'account-1',
        '2020-01-01'
      );
      expect(result).toBeNull();
    });
  });

  describe('getInDateRange', () => {
    it('returns checkpoints within date range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.checkpoints,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.getInDateRange('2024-01-01', '2024-01-31');

      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31');
      expect(result).toEqual(mockData.checkpoints);
    });
  });

  describe('create', () => {
    it('creates and returns new checkpoint', async () => {
      const newCheckpoint = {
        user_id: 'user-123',
        account_id: 'account-1',
        date: '2024-02-01',
        amount: 1500,
        notes: 'Test checkpoint',
      };
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'checkpoint-new',
            ...newCheckpoint,
            created_at: '2024-02-01',
            updated_at: '2024-02-01',
          },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.create(newCheckpoint);

      expect(mockQuery.insert).toHaveBeenCalledWith(newCheckpoint);
      expect(result.amount).toBe(1500);
    });
  });

  describe('update', () => {
    it('updates and returns checkpoint', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockData.checkpoints[0], amount: 2000 },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await checkpointsApi.update('checkpoint-1', { amount: 2000 });

      expect(mockQuery.update).toHaveBeenCalledWith({ amount: 2000 });
      expect(result.amount).toBe(2000);
    });
  });

  describe('delete', () => {
    it('deletes checkpoint successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(checkpointsApi.delete('checkpoint-1')).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'checkpoint-1');
    });
  });

  describe('deleteByAccountId', () => {
    it('deletes all checkpoints for account', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(checkpointsApi.deleteByAccountId('account-1')).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('account_id', 'account-1');
    });
  });
});
