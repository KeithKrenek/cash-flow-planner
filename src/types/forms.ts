import type { RecurrenceRule } from './database';

// Form state types for controlled inputs

export interface AccountFormData {
  name: string;
}

export interface CheckpointFormData {
  accountId: string;
  date: string; // YYYY-MM-DD for input[type=date]
  amount: string; // String for input, parse to number on submit
  notes: string;
}

export interface TransactionFormData {
  accountId: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  endDate: string;
}

export interface RecurrenceFormData {
  frequency: RecurrenceRule['frequency'];
  interval: string;
  daysOfMonth: string; // Comma-separated: "1,15,30"
  lastDayOfMonth: boolean;
  weekday: string; // "0"-"6" or ""
  weekOfMonth: string; // "1"-"4" or "-1" or ""
}

export interface SettingsFormData {
  warningThreshold: string;
}

// CSV import types
export interface CSVRow {
  date: string;
  description: string;
  amount: string;
  account: string;
  category: string;
  is_recurring: string;
  frequency: string;
  end_date: string;
  initial_balance: string; // Optional: for setting account opening balance
}

// Validated transaction ready for insertion (user_id added by parser)
export interface ValidatedCSVTransaction {
  user_id: string;
  account_id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  end_date: string | null;
}

// Account to be created from CSV
export interface CSVAccountToCreate {
  name: string;
  initialBalance: number | null;
  initialBalanceDate: string | null;
}

// Checkpoint to be created from CSV (for initial balances)
export interface CSVCheckpointToCreate {
  accountName: string; // Resolved to account_id after account creation
  date: string;
  amount: number;
}

export interface CSVParseResult {
  valid: ValidatedCSVTransaction[];
  errors: Array<{
    row: number;
    data: CSVRow;
    errors: string[];
  }>;
  // For user feedback on import
  duplicateWarnings: Array<{
    row: number;
    existingId: string;
    message: string;
  }>;
  // New accounts that need to be created
  accountsToCreate: CSVAccountToCreate[];
  // Checkpoints to create for initial balances
  checkpointsToCreate: CSVCheckpointToCreate[];
}
