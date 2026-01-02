import { supabase } from '@/lib/supabase';
import { handleSupabaseError, AppError, ErrorCodes } from '@/lib/errors';
import type { DbAccount, AccountInsert, AccountUpdate } from '@/types';

/**
 * Accounts API for CRUD operations on user accounts.
 */
export const accountsApi = {
  /**
   * Get all accounts for the current user, sorted by name.
   */
  async getAll(): Promise<DbAccount[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get a single account by ID.
   * Returns null if not found.
   */
  async getById(id: string): Promise<DbAccount | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 means no rows returned - that's okay, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw handleSupabaseError(error);
    }
    return data;
  },

  /**
   * Get an account by name (case-insensitive).
   * Useful for checking duplicates and CSV import matching.
   */
  async getByName(name: string): Promise<DbAccount | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .ilike('name', name)
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
   * Create a new account.
   */
  async create(account: AccountInsert): Promise<DbAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    if (!data) {
      throw new AppError('Failed to create account', ErrorCodes.DB_ERROR, 500);
    }
    return data;
  },

  /**
   * Update an existing account.
   */
  async update(id: string, updates: AccountUpdate): Promise<DbAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    if (!data) {
      throw new AppError('Account not found', ErrorCodes.DB_NOT_FOUND, 404);
    }
    return data;
  },

  /**
   * Delete an account.
   * This will cascade delete all related checkpoints and transactions.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id);

    if (error) throw handleSupabaseError(error);
  },

  /**
   * Check if an account name already exists for the current user.
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('accounts')
      .select('id')
      .ilike('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) throw handleSupabaseError(error);
    return (data?.length ?? 0) > 0;
  },
};
