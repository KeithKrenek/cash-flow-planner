import { supabase } from '@/lib/supabase';
import { handleSupabaseError, AppError, ErrorCodes } from '@/lib/errors';
import type { DbTransaction, TransactionInsert, TransactionUpdate } from '@/types';

/**
 * Transactions API for transaction CRUD operations.
 */
export const transactionsApi = {
  /**
   * Get all transactions for the current user, sorted by date descending.
   */
  async getAll(): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get all transactions for a specific account.
   */
  async getByAccountId(accountId: string): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get a single transaction by ID.
   */
  async getById(id: string): Promise<DbTransaction | null> {
    const { data, error } = await supabase
      .from('transactions')
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
   * Get only recurring transactions.
   * These are used by the projection engine to expand into future dates.
   */
  async getRecurring(): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_recurring', true)
      .order('date', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get one-time (non-recurring) transactions within a date range.
   */
  async getOneTimeInDateRange(
    startDate: string,
    endDate: string
  ): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_recurring', false)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Get all transactions (both recurring and one-time) that could affect
   * a projection from startDate to endDate.
   */
  async getForProjection(
    startDate: string,
    endDate: string
  ): Promise<DbTransaction[]> {
    // We need:
    // 1. All recurring transactions (their start date doesn't limit their effect)
    // 2. One-time transactions within the date range
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(
        `is_recurring.eq.true,and(is_recurring.eq.false,date.gte.${startDate},date.lte.${endDate})`
      )
      .order('date', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Create a new transaction.
   */
  async create(transaction: TransactionInsert): Promise<DbTransaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    if (!data) {
      throw new AppError('Failed to create transaction', ErrorCodes.DB_ERROR, 500);
    }
    return data;
  },

  /**
   * Create multiple transactions at once (for CSV import).
   */
  async createMany(transactions: TransactionInsert[]): Promise<DbTransaction[]> {
    if (transactions.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();

    if (error) throw handleSupabaseError(error);
    return data ?? [];
  },

  /**
   * Update an existing transaction.
   */
  async update(id: string, updates: TransactionUpdate): Promise<DbTransaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    if (!data) {
      throw new AppError('Transaction not found', ErrorCodes.DB_NOT_FOUND, 404);
    }
    return data;
  },

  /**
   * Delete a transaction.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) throw handleSupabaseError(error);
  },

  /**
   * Delete multiple transactions by IDs.
   */
  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) throw handleSupabaseError(error);
  },

  /**
   * Delete all transactions for an account.
   */
  async deleteByAccountId(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('account_id', accountId);

    if (error) throw handleSupabaseError(error);
  },

  /**
   * Check if a similar transaction exists (for duplicate detection in CSV import).
   * Matches on date, description (case-insensitive), amount, and account.
   */
  async findDuplicate(
    date: string,
    description: string,
    amount: number,
    accountId: string
  ): Promise<DbTransaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('date', date)
      .ilike('description', description)
      .eq('amount', amount)
      .eq('account_id', accountId)
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
};
