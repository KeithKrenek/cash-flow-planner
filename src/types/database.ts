// Direct mappings to database tables

export interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbBalanceCheckpoint {
  id: string;
  user_id: string;
  account_id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  account_id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string; // ISO date string YYYY-MM-DD
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserSettings {
  id: string;
  user_id: string;
  warning_threshold: number;
  created_at: string;
  updated_at: string;
}

// Recurrence rule structure
export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // Every N periods (default 1)
  daysOfMonth?: number[]; // [1, 15, 30] etc.
  lastDayOfMonth?: boolean; // True = last day of each month
  weekday?: number; // 0-6 (Sunday-Saturday)
  weekOfMonth?: number; // 1-4 or -1 for last
}

// Insert/Update types (omit auto-generated fields)
export type AccountInsert = Omit<
  DbAccount,
  'id' | 'created_at' | 'updated_at'
>;
export type AccountUpdate = Partial<
  Omit<DbAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type CheckpointInsert = Omit<
  DbBalanceCheckpoint,
  'id' | 'created_at' | 'updated_at'
>;
export type CheckpointUpdate = Partial<
  Omit<DbBalanceCheckpoint, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type TransactionInsert = Omit<
  DbTransaction,
  'id' | 'created_at' | 'updated_at'
>;
export type TransactionUpdate = Partial<
  Omit<DbTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type SettingsUpdate = Partial<
  Omit<DbUserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;
