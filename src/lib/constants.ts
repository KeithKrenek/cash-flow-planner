import type { TimeRangeDays } from '@/types';

// Default categories for transactions
export const CATEGORIES = [
  'Income',
  'Housing',
  'Utilities',
  'Food & Dining',
  'Transportation',
  'Healthcare',
  'Insurance',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Education',
  'Savings',
  'Investments',
  'Debt Payment',
  'Gifts & Donations',
  'Travel',
  'Subscriptions',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Time range options for projection
export const TIME_RANGE_OPTIONS: {
  value: TimeRangeDays;
  label: string;
}[] = [
  { value: 15, label: '15 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 360, label: '1 year' },
];

export const DEFAULT_TIME_RANGE: TimeRangeDays = 30;

// Chart colors for accounts (colorblind-friendly palette)
export const CHART_COLORS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6366f1', // Indigo
] as const;

// Total line color (distinct from account colors)
export const TOTAL_LINE_COLOR = '#a855f7'; // Purple

// Recurrence frequency labels
export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

// Weekday labels (0 = Sunday)
export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAY_SHORT_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

// Week of month labels
export const WEEK_OF_MONTH_LABELS: Record<string, string> = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '4': '4th',
  '-1': 'Last',
};

// Ordinal suffixes for day of month
export const ORDINAL_SUFFIXES: Record<number, string> = {
  1: 'st',
  2: 'nd',
  3: 'rd',
  21: 'st',
  22: 'nd',
  23: 'rd',
  31: 'st',
};

// Default warning threshold for new users
export const DEFAULT_WARNING_THRESHOLD = 500;

// Debounce delay for inline editing (ms)
export const DEBOUNCE_DELAY = 500;

// Maximum iterations for recurrence expansion (safety limit)
export const MAX_RECURRENCE_ITERATIONS = 1000;

// CSV column headers
export const CSV_HEADERS = [
  'date',
  'description',
  'amount',
  'account',
  'category',
  'is_recurring',
  'frequency',
  'end_date',
] as const;

// Max file size for CSV import (1MB)
export const MAX_CSV_FILE_SIZE = 1024 * 1024;
