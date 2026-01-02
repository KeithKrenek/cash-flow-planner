import { addDays } from 'date-fns';
import type {
  DbAccount,
  DbBalanceCheckpoint,
  DbTransaction,
} from '@/types/database';
import type {
  ProjectionDataPoint,
  ProjectionWarning,
  ProjectionResult,
  Account,
} from '@/types/domain';
import {
  fromDateString,
  toDateString,
  formatChartDate,
  isDateBefore,
  isDateAfter,
  isSameDayAs,
  normalizeDate,
  getDateRange,
} from './date-utils';
import { addAmounts, sumAmounts } from './amount-utils';
import { expandRecurringTransaction } from './recurrence';

/**
 * Event types that can occur on a projection day.
 */
type ProjectionEventType = 'checkpoint' | 'transaction' | 'recurring';

interface ProjectionEvent {
  type: ProjectionEventType;
  date: Date;
  accountId: string;
  amount: number;
  description: string;
}

/**
 * Calculate the cash flow projection for a given number of days.
 *
 * The projection:
 * 1. Finds the most recent checkpoint for each account before today
 * 2. Replays all transactions (one-time and recurring) from checkpoint to today
 * 3. Projects forward from today for the specified number of days
 * 4. Generates warnings when balances drop below the threshold
 *
 * @param accounts - All user accounts
 * @param checkpoints - All balance checkpoints
 * @param transactions - All transactions (including recurring templates)
 * @param days - Number of days to project forward
 * @param warningThreshold - Balance threshold for warnings
 * @returns ProjectionResult with data points and warnings
 */
export function calculateProjection(
  accounts: DbAccount[],
  checkpoints: DbBalanceCheckpoint[],
  transactions: DbTransaction[],
  days: number,
  warningThreshold: number
): ProjectionResult {
  const today = normalizeDate(new Date());
  const projectionEnd = addDays(today, days);

  // Initialize account balances
  const accountBalances: Record<string, number> = {};
  const accountMap: Record<string, DbAccount> = {};

  for (const account of accounts) {
    accountBalances[account.id] = 0;
    accountMap[account.id] = account;
  }

  // Find the most recent checkpoint for each account before or on today
  const accountCheckpoints: Record<string, DbBalanceCheckpoint | null> = {};
  const checkpointDates: Record<string, Date> = {};

  for (const account of accounts) {
    const accountCps = checkpoints
      .filter((cp) => cp.account_id === account.id)
      .filter((cp) => {
        const cpDate = fromDateString(cp.date);
        return !isDateAfter(cpDate, today);
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    if (accountCps.length > 0) {
      accountCheckpoints[account.id] = accountCps[0];
      checkpointDates[account.id] = fromDateString(accountCps[0].date);
      accountBalances[account.id] = accountCps[0].amount;
    } else {
      accountCheckpoints[account.id] = null;
    }
  }

  // Determine the earliest checkpoint date to start historical replay
  const checkpointDateValues = Object.values(checkpointDates);
  const earliestCheckpointDate =
    checkpointDateValues.length > 0
      ? checkpointDateValues.reduce((earliest, date) =>
          isDateBefore(date, earliest) ? date : earliest
        )
      : today;

  // Collect all events: checkpoints (for future ones), one-time transactions, recurring expansions
  const events: ProjectionEvent[] = [];

  // Add future checkpoints as events (they reset the balance)
  for (const cp of checkpoints) {
    const cpDate = fromDateString(cp.date);
    if (isDateAfter(cpDate, today) && !isDateAfter(cpDate, projectionEnd)) {
      events.push({
        type: 'checkpoint',
        date: cpDate,
        accountId: cp.account_id,
        amount: cp.amount,
        description: cp.notes || 'Balance checkpoint',
      });
    }
  }

  // Add one-time transactions
  for (const tx of transactions) {
    if (!tx.is_recurring) {
      const txDate = fromDateString(tx.date);
      // Include if it's after the earliest checkpoint and within projection range
      if (
        !isDateBefore(txDate, earliestCheckpointDate) &&
        !isDateAfter(txDate, projectionEnd)
      ) {
        events.push({
          type: 'transaction',
          date: txDate,
          accountId: tx.account_id,
          amount: tx.amount,
          description: tx.description,
        });
      }
    }
  }

  // Expand recurring transactions from earliest checkpoint to projection end
  for (const tx of transactions) {
    if (tx.is_recurring && tx.recurrence_rule) {
      const instances = expandRecurringTransaction(
        tx,
        earliestCheckpointDate,
        projectionEnd
      );

      for (const instance of instances) {
        events.push({
          type: 'recurring',
          date: instance.date,
          accountId: instance.accountId,
          amount: instance.amount,
          description: instance.description,
        });
      }
    }
  }

  // Sort events by date, then by type (checkpoints first to reset before transactions)
  events.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;

    // Checkpoints before transactions on same day
    if (a.type === 'checkpoint' && b.type !== 'checkpoint') return -1;
    if (a.type !== 'checkpoint' && b.type === 'checkpoint') return 1;

    return 0;
  });

  // Process historical events (from checkpoint dates to today) to get accurate starting balances
  for (const event of events) {
    if (isDateBefore(event.date, today) || isSameDayAs(event.date, today)) {
      const checkpointDate = checkpointDates[event.accountId];

      // Skip events before the account's checkpoint
      if (checkpointDate && isDateBefore(event.date, checkpointDate)) {
        continue;
      }

      // For checkpoints, skip the historical ones (we already used them as starting points)
      if (event.type === 'checkpoint') {
        continue;
      }

      // Apply transaction to balance
      if (accountBalances[event.accountId] !== undefined) {
        accountBalances[event.accountId] = addAmounts(
          accountBalances[event.accountId],
          event.amount
        );
      }
    }
  }

  // Now calculate daily projections from today forward
  const dataPoints: ProjectionDataPoint[] = [];
  const warnings: ProjectionWarning[] = [];
  const warningsSet = new Set<string>(); // For deduplication: "accountId:dateString"

  // Create a copy of balances for projection
  const projectionBalances = { ...accountBalances };

  // Get events for each day
  const dateRange = getDateRange(today, projectionEnd);

  for (const date of dateRange) {
    const dateString = toDateString(date);

    // Get events for this day
    const dayEvents = events.filter(
      (e) => toDateString(e.date) === dateString
    );

    // Apply events for this day
    for (const event of dayEvents) {
      if (projectionBalances[event.accountId] === undefined) continue;

      if (event.type === 'checkpoint') {
        // Checkpoint resets the balance
        projectionBalances[event.accountId] = event.amount;
      } else {
        // Transaction adds to balance
        projectionBalances[event.accountId] = addAmounts(
          projectionBalances[event.accountId],
          event.amount
        );
      }
    }

    // Calculate total
    const total = sumAmounts(Object.values(projectionBalances));

    // Create data point
    const balancesCopy: Record<string, number> = {};
    for (const accountId in projectionBalances) {
      balancesCopy[accountId] = projectionBalances[accountId];
    }

    dataPoints.push({
      date,
      dateString: formatChartDate(date),
      balances: balancesCopy,
      total,
    });

    // Check for warnings
    for (const accountId in projectionBalances) {
      const balance = projectionBalances[accountId];
      const warningKey = `${accountId}:${dateString}`;

      if (balance < warningThreshold && !warningsSet.has(warningKey)) {
        warningsSet.add(warningKey);
        const account = accountMap[accountId];

        warnings.push({
          date,
          accountId,
          accountName: account?.name || 'Unknown Account',
          balance,
          threshold: warningThreshold,
        });
      }
    }
  }

  return {
    dataPoints,
    warnings,
    accounts: accounts as Account[],
  };
}

/**
 * Get the starting balance for an account based on the most recent checkpoint
 * and replayed historical transactions.
 *
 * @param accountId - The account to get balance for
 * @param checkpoints - All checkpoints
 * @param transactions - All transactions
 * @param asOfDate - Calculate balance as of this date
 * @returns The account balance
 */
export function getAccountBalance(
  accountId: string,
  checkpoints: DbBalanceCheckpoint[],
  transactions: DbTransaction[],
  asOfDate: Date
): number {
  const normalizedDate = normalizeDate(asOfDate);

  // Find most recent checkpoint before or on asOfDate
  const accountCheckpoints = checkpoints
    .filter((cp) => cp.account_id === accountId)
    .filter((cp) => !isDateAfter(fromDateString(cp.date), normalizedDate))
    .sort((a, b) => b.date.localeCompare(a.date));

  let balance = 0;
  let startDate = new Date(0); // Beginning of time

  if (accountCheckpoints.length > 0) {
    balance = accountCheckpoints[0].amount;
    startDate = fromDateString(accountCheckpoints[0].date);
  }

  // Apply one-time transactions after checkpoint
  for (const tx of transactions) {
    if (tx.account_id !== accountId || tx.is_recurring) continue;

    const txDate = fromDateString(tx.date);
    if (
      isDateAfter(txDate, startDate) &&
      !isDateAfter(txDate, normalizedDate)
    ) {
      balance = addAmounts(balance, tx.amount);
    }
  }

  // Apply expanded recurring transactions
  for (const tx of transactions) {
    if (tx.account_id !== accountId || !tx.is_recurring) continue;

    const instances = expandRecurringTransaction(tx, startDate, normalizedDate);
    for (const instance of instances) {
      if (
        isDateAfter(instance.date, startDate) &&
        !isDateAfter(instance.date, normalizedDate)
      ) {
        balance = addAmounts(balance, instance.amount);
      }
    }
  }

  return balance;
}

/**
 * Get a summary of the projection for display.
 */
export interface ProjectionSummary {
  startingTotal: number;
  endingTotal: number;
  lowestTotal: number;
  lowestTotalDate: Date;
  highestTotal: number;
  highestTotalDate: Date;
  warningCount: number;
  accountsWithWarnings: string[];
}

export function getProjectionSummary(result: ProjectionResult): ProjectionSummary {
  if (result.dataPoints.length === 0) {
    const now = new Date();
    return {
      startingTotal: 0,
      endingTotal: 0,
      lowestTotal: 0,
      lowestTotalDate: now,
      highestTotal: 0,
      highestTotalDate: now,
      warningCount: 0,
      accountsWithWarnings: [],
    };
  }

  const first = result.dataPoints[0];
  const last = result.dataPoints[result.dataPoints.length - 1];

  let lowestTotal = first.total;
  let lowestTotalDate = first.date;
  let highestTotal = first.total;
  let highestTotalDate = first.date;

  for (const point of result.dataPoints) {
    if (point.total < lowestTotal) {
      lowestTotal = point.total;
      lowestTotalDate = point.date;
    }
    if (point.total > highestTotal) {
      highestTotal = point.total;
      highestTotalDate = point.date;
    }
  }

  const accountsWithWarnings = [
    ...new Set(result.warnings.map((w) => w.accountName)),
  ];

  return {
    startingTotal: first.total,
    endingTotal: last.total,
    lowestTotal,
    lowestTotalDate,
    highestTotal,
    highestTotalDate,
    warningCount: result.warnings.length,
    accountsWithWarnings,
  };
}
