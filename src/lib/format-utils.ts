import type { RecurrenceRule } from '@/types';
import {
  FREQUENCY_LABELS,
  WEEKDAY_LABELS,
  WEEK_OF_MONTH_LABELS,
  ORDINAL_SUFFIXES,
} from './constants';

/**
 * Format a number as currency: "$1,234.56"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as signed currency: "+$100.00" or "-$100.00"
 * Positive amounts get a + prefix.
 */
export function formatSignedCurrency(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount));

  if (amount > 0) {
    return `+${formatted}`;
  } else if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

/**
 * Format currency for display in a compact form: "$1.2K"
 */
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const abs = Math.abs(n);

  // Check for specific cases
  if (ORDINAL_SUFFIXES[abs]) {
    return ORDINAL_SUFFIXES[abs];
  }

  // Handle 11th, 12th, 13th specially
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return 'th';
  }

  // General rule based on last digit
  const lastDigit = abs % 10;
  if (lastDigit === 1) return 'st';
  if (lastDigit === 2) return 'nd';
  if (lastDigit === 3) return 'rd';
  return 'th';
}

/**
 * Format a day with ordinal: "15th", "1st", "23rd"
 */
export function formatOrdinalDay(day: number): string {
  return `${day}${getOrdinalSuffix(day)}`;
}

/**
 * Format a recurrence rule into a human-readable string.
 *
 * @example
 * formatRecurrence({ frequency: 'monthly', daysOfMonth: [15] })
 * // "Monthly on the 15th"
 *
 * formatRecurrence({ frequency: 'monthly', weekday: 5, weekOfMonth: 1 })
 * // "Monthly on the 1st Friday"
 *
 * formatRecurrence({ frequency: 'weekly', interval: 2 })
 * // "Every 2 weeks"
 */
export function formatRecurrence(rule: RecurrenceRule | null): string {
  if (!rule) {
    return 'One-time';
  }

  const { frequency, interval = 1 } = rule;

  switch (frequency) {
    case 'daily':
      if (interval === 1) {
        return 'Daily';
      }
      return `Every ${interval} days`;

    case 'weekly':
      if (interval === 1) {
        return 'Weekly';
      }
      return `Every ${interval} weeks`;

    case 'biweekly':
      return 'Bi-weekly';

    case 'monthly':
      return formatMonthlyRecurrence(rule);

    case 'yearly':
      if (interval === 1) {
        return 'Yearly';
      }
      return `Every ${interval} years`;

    default:
      return 'Unknown';
  }
}

/**
 * Format a monthly recurrence rule.
 */
function formatMonthlyRecurrence(rule: RecurrenceRule): string {
  const { daysOfMonth, lastDayOfMonth, weekday, weekOfMonth, interval = 1 } = rule;

  const prefix = interval === 1 ? 'Monthly' : `Every ${interval} months`;

  if (lastDayOfMonth) {
    return `${prefix} on the last day`;
  }

  if (daysOfMonth && daysOfMonth.length > 0) {
    if (daysOfMonth.length === 1) {
      return `${prefix} on the ${formatOrdinalDay(daysOfMonth[0])}`;
    }
    const formatted = daysOfMonth.map(formatOrdinalDay);
    const last = formatted.pop();
    return `${prefix} on the ${formatted.join(', ')} and ${last}`;
  }

  if (weekday !== undefined && weekOfMonth !== undefined) {
    const weekdayName = WEEKDAY_LABELS[weekday] || 'Unknown';
    const weekLabel = WEEK_OF_MONTH_LABELS[String(weekOfMonth)] || 'Unknown';
    return `${prefix} on the ${weekLabel.toLowerCase()} ${weekdayName}`;
  }

  return prefix;
}

/**
 * Format a short recurrence label for badges.
 *
 * @example
 * formatRecurrenceShort({ frequency: 'monthly', daysOfMonth: [15] })
 * // "Monthly"
 */
export function formatRecurrenceShort(rule: RecurrenceRule | null): string {
  if (!rule) {
    return 'Once';
  }

  const { frequency, interval = 1 } = rule;

  // For biweekly, show "Bi-weekly"
  if (frequency === 'biweekly') {
    return 'Bi-weekly';
  }

  // For interval > 1, show "Every N [period]s"
  if (interval > 1) {
    const periodLabel = FREQUENCY_LABELS[frequency] || frequency;
    return `${interval}x ${periodLabel}`;
  }

  return FREQUENCY_LABELS[frequency] || frequency;
}

/**
 * Format a number as a percentage: "15.5%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with thousands separators: "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
