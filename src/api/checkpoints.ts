import { supabase } from '@/lib/supabase';
import { handleSupabaseError, AppError, ErrorCodes } from '@/lib/errors';
import type { DbBalanceCheckpoint, CheckpointInsert, CheckpointUpdate } from '@/types';

/**
 * Checkpoints API for balance checkpoint CRUD operations.
 */
export const checkpointsApi = {
  /**
   * Get all checkpoints for the current user, sorted by date descending.
   */
  async getAll(): Promise<DbBalanceCheckpoint[]> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get all checkpoints for a specific account.
   */
  async getByAccountId(accountId: string): Promise<DbBalanceCheckpoint[]> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get a single checkpoint by ID.
   */
  async getById(id: string): Promise<DbBalanceCheckpoint | null> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw handleSupabaseError(error);
    }
    return data;
  },

  /**
   * Get the most recent checkpoint for an account on or before a given date.
   * This is the key function for the projection engine.
   */
  async getMostRecentForAccount(
    accountId: string,
    beforeDate: string
  ): Promise<DbBalanceCheckpoint | null> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .eq('account_id', accountId)
      .lte('date', beforeDate)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw handleSupabaseError(error);
    }
    return data;
  },

  /**
   * Get all checkpoints within a date range.
   * Useful for finding future checkpoints that override projections.
   */
  async getInDateRange(
    startDate: string,
    endDate: string
  ): Promise<DbBalanceCheckpoint[]> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Create a new checkpoint.
   */
  async create(checkpoint: CheckpointInsert): Promise<DbBalanceCheckpoint> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .insert(checkpoint)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    if (!data) {
      throw new AppError('Failed to create checkpoint', ErrorCodes.DB_ERROR, 500);
    }
    return data;
  },

  /**
   * Update an existing checkpoint.
   */
  async update(
    id: string,
    updates: CheckpointUpdate
  ): Promise<DbBalanceCheckpoint> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    if (!data) {
      throw new AppError('Checkpoint not found', ErrorCodes.DB_NOT_FOUND, 404);
    }
    return data;
  },

  /**
   * Delete a checkpoint.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('balance_checkpoints')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error);
  },

  /**
   * Delete all checkpoints for an account.
   */
  async deleteByAccountId(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('balance_checkpoints')
      .delete()
      .eq('account_id', accountId);

    if (error) throw handleSupabaseError(error);
  },
};
