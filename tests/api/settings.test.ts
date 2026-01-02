import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsApi } from '@/api/settings';
import { supabase } from '@/lib/supabase';
import { mockData } from '../mocks/supabase';
import { AppError, ErrorCodes } from '@/lib/errors';
import { DEFAULT_WARNING_THRESHOLD } from '@/lib/constants';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('settingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns user settings', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.settings,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await settingsApi.get();

      expect(supabase.from).toHaveBeenCalledWith('user_settings');
      expect(result).toEqual(mockData.settings);
    });

    it('returns defaults when no settings exist and user is authenticated', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      const result = await settingsApi.get();

      expect(result.warning_threshold).toBe(DEFAULT_WARNING_THRESHOLD);
      expect(result.user_id).toBe('user-123');
    });

    it('throws when no settings and not authenticated', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(settingsApi.get()).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates existing settings', async () => {
      // Mock getUser
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      // Mock getting existing settings
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'settings-1' },
          error: null,
        }),
      };

      // Mock update
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockData.settings, warning_threshold: 1000 },
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as never)
        .mockReturnValueOnce(mockUpdateQuery as never);

      const result = await settingsApi.update({ warning_threshold: 1000 });

      expect(result.warning_threshold).toBe(1000);
    });

    it('throws when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(settingsApi.update({ warning_threshold: 1000 })).rejects.toThrow(
        AppError
      );
    });

    it('creates settings if they do not exist', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      // Mock no existing settings
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows', details: '', hint: '' },
        }),
      };

      // Mock insert
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockData.settings, warning_threshold: 1000 },
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as never)
        .mockReturnValueOnce(mockInsertQuery as never);

      const result = await settingsApi.update({ warning_threshold: 1000 });

      expect(mockInsertQuery.insert).toHaveBeenCalled();
      expect(result.warning_threshold).toBe(1000);
    });
  });

  describe('getWarningThreshold', () => {
    it('returns warning threshold', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData.settings,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await settingsApi.getWarningThreshold();
      expect(result).toBe(500);
    });
  });

  describe('setWarningThreshold', () => {
    it('updates warning threshold', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'settings-1' },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockData.settings, warning_threshold: 750 },
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as never)
        .mockReturnValueOnce(mockUpdateQuery as never);

      const result = await settingsApi.setWarningThreshold(750);
      expect(result.warning_threshold).toBe(750);
    });
  });
});
