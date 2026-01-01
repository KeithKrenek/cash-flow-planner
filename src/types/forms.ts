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
}
