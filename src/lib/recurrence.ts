import { addDays, addWeeks, addMonths, addYears, getDaysInMonth } from 'date-fns';
import type { DbTransaction, RecurrenceRule } from '@/types/database';
import {
  fromDateString,
  toDateString,
  startOfDay,
  isDateBefore,
  isDateAfter,
  isSameDayAs,
  getNthWeekdayOfMonth,
  getLastDayOfMonth,
} from './date-utils';

// Import startOfDay from date-fns for internal use
import { startOfDay as dfStartOfDay } from 'date-fns';

/**
 * Represents an expanded instance of a recurring transaction.
 */
export interface ExpandedTransaction {
  /** Reference to the original transaction template */
  sourceId: string;
  /** The specific date this instance occurs */
  date: Date;
  /** Date string in YYYY-MM-DD format */
  dateString: string;
  /** The amount for this transaction */
  amount: number;
  /** Description from the source transaction */
  description: string;
  /** Category from the source transaction */
  category: string | null;
  /** Account ID from the source transaction */
  accountId: string;
}

/**
 * Maximum iterations to prevent infinite loops
 */
const MAX_ITERATIONS = 1000;

/**
 * Expand a recurring transaction into individual date instances
 * within the specified date range.
 *
 * @param transaction - The recurring transaction template
 * @param rangeStart - Start of the date range (inclusive)
 * @param rangeEnd - End of the date range (inclusive)
 * @returns Array of expanded transaction instances
 */
export function expandRecurringTransaction(
  transaction: DbTransaction,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedTransaction[] {
  // Non-recurring transactions don't get expanded
  if (!transaction.is_recurring || !transaction.recurrence_rule) {
    return [];
  }

  const { recurrence_rule: rule, date: startDateStr, end_date: endDateStr } = transaction;
  const startDate = fromDateString(startDateStr);
  const endDate = endDateStr ? fromDateString(endDateStr) : null;

  // Normalize range dates
  const start = dfStartOfDay(rangeStart);
  const end = dfStartOfDay(rangeEnd);

  // If transaction starts after range ends, no instances
  if (isDateAfter(startDate, end)) {
    return [];
  }

  // If transaction ended before range starts, no instances
  if (endDate && isDateBefore(endDate, start)) {
    return [];
  }

  const instances: ExpandedTransaction[] = [];
  const { frequency } = rule;

  switch (frequency) {
    case 'daily':
      expandDaily(transaction, rule, startDate, endDate, start, end, instances);
      break;
    case 'weekly':
      expandWeekly(transaction, rule, startDate, endDate, start, end, instances);
      break;
    case 'biweekly':
      expandBiweekly(transaction, startDate, endDate, start, end, instances);
      break;
    case 'monthly':
      expandMonthly(transaction, rule, startDate, endDate, start, end, instances);
      break;
    case 'yearly':
      expandYearly(transaction, rule, startDate, endDate, start, end, instances);
      break;
  }

  return instances;
}

/**
 * Expand a daily recurring transaction.
 */
function expandDaily(
  tx: DbTransaction,
  rule: RecurrenceRule,
  anchorDate: Date,
  endDate: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
  instances: ExpandedTransaction[]
): void {
  const interval = rule.interval || 1;
  let current = anchorDate;
  let iterations = 0;

  while (!isDateAfter(current, rangeEnd) && iterations < MAX_ITERATIONS) {
    iterations++;

    // Check if within range and not past end date
    if (
      !isDateBefore(current, rangeStart) &&
      (!endDate || !isDateAfter(current, endDate))
    ) {
      instances.push(createInstance(tx, current));
    }

    current = addDays(current, interval);
  }
}

/**
 * Expand a weekly recurring transaction.
 */
function expandWeekly(
  tx: DbTransaction,
  rule: RecurrenceRule,
  anchorDate: Date,
  endDate: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
  instances: ExpandedTransaction[]
): void {
  const interval = rule.interval || 1;
  let current = anchorDate;
  let iterations = 0;

  while (!isDateAfter(current, rangeEnd) && iterations < MAX_ITERATIONS) {
    iterations++;

    if (
      !isDateBefore(current, rangeStart) &&
      (!endDate || !isDateAfter(current, endDate))
    ) {
      instances.push(createInstance(tx, current));
    }

    current = addWeeks(current, interval);
  }
}

/**
 * Expand a biweekly recurring transaction (every 2 weeks).
 */
function expandBiweekly(
  tx: DbTransaction,
  anchorDate: Date,
  endDate: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
  instances: ExpandedTransaction[]
): void {
  let current = anchorDate;
  let iterations = 0;

  while (!isDateAfter(current, rangeEnd) && iterations < MAX_ITERATIONS) {
    iterations++;

    if (
      !isDateBefore(current, rangeStart) &&
      (!endDate || !isDateAfter(current, endDate))
    ) {
      instances.push(createInstance(tx, current));
    }

    current = addWeeks(current, 2);
  }
}

/**
 * Expand a monthly recurring transaction.
 * Handles three modes:
 * 1. daysOfMonth - specific day(s) of the month (1-31)
 * 2. lastDayOfMonth - last day of each month
 * 3. weekday + weekOfMonth - Nth weekday of month (e.g., 2nd Tuesday)
 */
function expandMonthly(
  tx: DbTransaction,
  rule: RecurrenceRule,
  anchorDate: Date,
  endDate: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
  instances: ExpandedTransaction[]
): void {
  const interval = rule.interval || 1;
  const { daysOfMonth, lastDayOfMonth, weekday, weekOfMonth } = rule;

  // Start from the anchor date's month
  let currentYear = anchorDate.getFullYear();
  let currentMonth = anchorDate.getMonth();
  let iterations = 0;

  // Determine which mode we're in
  if (lastDayOfMonth) {
    // Last day of month mode
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const date = getLastDayOfMonth(currentYear, currentMonth);

      if (isDateAfter(date, rangeEnd)) break;

      if (
        !isDateBefore(date, rangeStart) &&
        !isDateBefore(date, anchorDate) &&
        (!endDate || !isDateAfter(date, endDate))
      ) {
        instances.push(createInstance(tx, date));
      }

      // Move to next month
      currentMonth += interval;
      while (currentMonth >= 12) {
        currentMonth -= 12;
        currentYear++;
      }
    }
  } else if (weekday !== undefined && weekOfMonth !== undefined) {
    // Nth weekday mode
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      try {
        const date = getNthWeekdayOfMonth(currentYear, currentMonth, weekday, weekOfMonth);

        if (isDateAfter(date, rangeEnd)) break;

        if (
          !isDateBefore(date, rangeStart) &&
          !isDateBefore(date, anchorDate) &&
          (!endDate || !isDateAfter(date, endDate))
        ) {
          instances.push(createInstance(tx, date));
        }
      } catch {
        // Skip if this weekday doesn't exist in this month (e.g., 5th Friday)
      }

      // Move to next month
      currentMonth += interval;
      while (currentMonth >= 12) {
        currentMonth -= 12;
        currentYear++;
      }
    }
  } else if (daysOfMonth && daysOfMonth.length > 0) {
    // Specific days of month mode
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth, 1));
      const monthStart = new Date(currentYear, currentMonth, 1);

      if (isDateAfter(monthStart, rangeEnd)) break;

      for (const day of daysOfMonth) {
        // Clamp to actual days in month
        const clampedDay = Math.min(day, daysInMonth);
        const date = dfStartOfDay(new Date(currentYear, currentMonth, clampedDay));

        if (
          !isDateBefore(date, rangeStart) &&
          !isDateAfter(date, rangeEnd) &&
          !isDateBefore(date, anchorDate) &&
          (!endDate || !isDateAfter(date, endDate))
        ) {
          instances.push(createInstance(tx, date));
        }
      }

      // Move to next month
      currentMonth += interval;
      while (currentMonth >= 12) {
        currentMonth -= 12;
        currentYear++;
      }
    }
  }
}

/**
 * Expand a yearly recurring transaction.
 * Handles Feb 29 by falling back to Feb 28 in non-leap years.
 */
function expandYearly(
  tx: DbTransaction,
  rule: RecurrenceRule,
  anchorDate: Date,
  endDate: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
  instances: ExpandedTransaction[]
): void {
  const interval = rule.interval || 1;
  const anchorMonth = anchorDate.getMonth();
  const anchorDay = anchorDate.getDate();

  let currentYear = anchorDate.getFullYear();
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Handle Feb 29 in non-leap years
    let day = anchorDay;
    if (anchorMonth === 1 && anchorDay === 29) {
      const daysInFeb = getDaysInMonth(new Date(currentYear, 1, 1));
      day = Math.min(anchorDay, daysInFeb);
    }

    const date = dfStartOfDay(new Date(currentYear, anchorMonth, day));

    if (isDateAfter(date, rangeEnd)) break;

    if (
      !isDateBefore(date, rangeStart) &&
      !isDateBefore(date, anchorDate) &&
      (!endDate || !isDateAfter(date, endDate))
    ) {
      instances.push(createInstance(tx, date));
    }

    currentYear += interval;
  }
}

/**
 * Create an expanded transaction instance.
 */
function createInstance(tx: DbTransaction, date: Date): ExpandedTransaction {
  return {
    sourceId: tx.id,
    date,
    dateString: toDateString(date),
    amount: tx.amount,
    description: tx.description,
    category: tx.category,
    accountId: tx.account_id,
  };
}

/**
 * Expand all recurring transactions in an array.
 *
 * @param transactions - Array of transactions (may include non-recurring)
 * @param rangeStart - Start of the date range
 * @param rangeEnd - End of the date range
 * @returns Array of all expanded instances
 */
export function expandAllTransactions(
  transactions: DbTransaction[],
  rangeStart: Date,
  rangeEnd: Date
): ExpandedTransaction[] {
  const allInstances: ExpandedTransaction[] = [];

  for (const tx of transactions) {
    if (tx.is_recurring && tx.recurrence_rule) {
      const instances = expandRecurringTransaction(tx, rangeStart, rangeEnd);
      allInstances.push(...instances);
    }
  }

  // Sort by date
  allInstances.sort((a, b) => a.date.getTime() - b.date.getTime());

  return allInstances;
}

/**
 * Get the next occurrence date for a recurring transaction.
 * Returns null if there are no more occurrences.
 *
 * @param transaction - The recurring transaction
 * @param afterDate - Find the first occurrence after this date
 * @returns The next occurrence date, or null
 */
export function getNextOccurrence(
  transaction: DbTransaction,
  afterDate: Date
): Date | null {
  if (!transaction.is_recurring || !transaction.recurrence_rule) {
    return null;
  }

  // Look ahead up to 2 years
  const rangeEnd = addYears(afterDate, 2);
  const instances = expandRecurringTransaction(transaction, afterDate, rangeEnd);

  // Find first instance after the given date
  for (const instance of instances) {
    if (isDateAfter(instance.date, afterDate)) {
      return instance.date;
    }
  }

  return null;
}

// Re-export startOfDay for consistency
export { startOfDay };
