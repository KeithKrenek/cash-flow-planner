import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountsApi } from '@/api/accounts';
import { supabase } from '@/lib/supabase';
import { mockData } from '../mocks/supabase';
import { AppError } from '@/lib/errors';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('accountsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns accounts sorted by name', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData.accounts,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.getAll();

      expect(supabase.from).toHaveBeenCalledWith('accounts');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(mockData.accounts);
    });

    it('returns empty array when no accounts', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.getAll();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'DB_ERROR', message: 'Database error', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(accountsApi.getAll()).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('returns account when found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.accounts[0],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.getById('account-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'account-1');
      expect(result).toEqual(mockData.accounts[0]);
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

      const result = await accountsApi.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByName', () => {
    it('returns account when found (case-insensitive)', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.accounts[0],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.getByName('CHECKING');

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', 'CHECKING');
      expect(result).toEqual(mockData.accounts[0]);
    });

    it('returns null when not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.getByName('Nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns new account', async () => {
      const newAccount = { user_id: 'user-123', name: 'New Account' };
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'account-new', ...newAccount, created_at: '2024-01-01', updated_at: '2024-01-01' },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.create(newAccount);

      expect(mockQuery.insert).toHaveBeenCalledWith(newAccount);
      expect(result.name).toBe('New Account');
    });

    it('throws on duplicate name', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key', details: 'Key exists', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(
        accountsApi.create({ user_id: 'user-123', name: 'Checking' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates and returns account', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockData.accounts[0], name: 'Updated Name' },
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.update('account-1', { name: 'Updated Name' });

      expect(mockQuery.update).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('deletes account successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await expect(accountsApi.delete('account-1')).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'account-1');
    });
  });

  describe('nameExists', () => {
    it('returns true when name exists', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'account-1' }],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.nameExists('Checking');
      expect(result).toBe(true);
    });

    it('returns false when name does not exist', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await accountsApi.nameExists('Nonexistent');
      expect(result).toBe(false);
    });

    it('excludes specified ID when checking', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await accountsApi.nameExists('Checking', 'account-1');
      expect(mockQuery.neq).toHaveBeenCalledWith('id', 'account-1');
    });
  });
});
