import type {
  DbAccount,
  DbBalanceCheckpoint,
  DbTransaction,
  DbUserSettings,
  RecurrenceRule,
} from './database';

// Extended types with computed properties and relationships

export interface Account extends DbAccount {
  // No additional fields currently, but allows extension
}

export interface BalanceCheckpoint extends DbBalanceCheckpoint {
  account?: Account; // Populated via join when needed
}

export interface Transaction extends DbTransaction {
  account?: Account; // Populated via join when needed
}

export interface UserSettings extends DbUserSettings {}

// Unified table row type (checkpoint, transaction, or recurring template)
export type TableEntryType = 'checkpoint' | 'transaction' | 'recurring';

export interface TableEntry {
  id: string;
  type: TableEntryType;
  accountId: string;
  accountName: string;
  date: Date;
  description: string;
  amount: number;
  category: string | null;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  endDate: Date | null;

  // Reference to original database record for updates
  originalRecord: DbBalanceCheckpoint | DbTransaction;
  originalType: 'checkpoint' | 'transaction';
}

// Projection output types
export interface ProjectionDataPoint {
  date: Date;
  dateString: string; // For chart x-axis: 'MMM d'
  balances: Record<string, number>; // accountId -> balance
  total: number;
}

export interface ProjectionWarning {
  date: Date;
  accountId: string;
  accountName: string;
  balance: number;
  threshold: number;
}

export interface ProjectionResult {
  dataPoints: ProjectionDataPoint[];
  warnings: ProjectionWarning[];
  accounts: Account[]; // For legend/reference
}

// Time range options
export type TimeRangeDays = 15 | 30 | 90 | 180 | 360;

// Chart series configuration
export interface ChartSeries {
  id: string; // accountId or 'total'
  name: string; // Display name
  color: string; // Hex color
  dataKey: string; // Key in data point
  isDashed?: boolean; // True for total line
}
