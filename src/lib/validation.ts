import type {
  AccountFormData,
  CheckpointFormData,
  TransactionFormData,
  SettingsFormData,
  RecurrenceRule,
} from '@/types';
import { parseAmount } from './amount-utils';
import { fromDateString, isValidDate } from './date-utils';
import {
  sanitizeAccountName,
  sanitizeDescription,
  sanitizeNotes,
  sanitizeCategory,
} from './sanitize';

/**
 * Validation result type.
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: Record<string, string>;
}

/**
 * Validated account data ready for API.
 */
export interface ValidatedAccount {
  name: string;
}

/**
 * Validated checkpoint data ready for API.
 */
export interface ValidatedCheckpoint {
  account_id: string;
  date: string;
  amount: number;
  notes: string | null;
}

/**
 * Validated transaction data ready for API.
 */
export interface ValidatedTransaction {
  account_id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  end_date: string | null;
}

/**
 * Validated settings data ready for API.
 */
export interface ValidatedSettings {
  warning_threshold: number;
}

/**
 * Validate account form data.
 */
export function validateAccountForm(
  data: AccountFormData
): ValidationResult<ValidatedAccount> {
  const errors: Record<string, string> = {};

  const name = sanitizeAccountName(data.name);

  if (!name) {
    errors.name = 'Account name is required';
  } else if (name.length < 1) {
    errors.name = 'Account name must be at least 1 character';
  } else if (name.length > 100) {
    errors.name = 'Account name must be at most 100 characters';
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: { name },
    errors: {},
  };
}

/**
 * Validate checkpoint form data.
 */
export function validateCheckpointForm(
  data: CheckpointFormData
): ValidationResult<ValidatedCheckpoint> {
  const errors: Record<string, string> = {};

  // Account ID
  if (!data.accountId) {
    errors.accountId = 'Please select an account';
  }

  // Date
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const parsedDate = fromDateString(data.date);
    if (!isValidDate(parsedDate)) {
      errors.date = 'Please enter a valid date';
    }
  }

  // Amount
  const amount = parseAmount(data.amount);
  if (amount === null) {
    errors.amount = 'Please enter a valid amount';
  }

  // Notes (optional, but sanitize)
  const notes = data.notes ? sanitizeNotes(data.notes) : null;

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      account_id: data.accountId,
      date: data.date,
      amount: amount!,
      notes,
    },
    errors: {},
  };
}

/**
 * Validate transaction form data.
 */
export function validateTransactionForm(
  data: TransactionFormData
): ValidationResult<ValidatedTransaction> {
  const errors: Record<string, string> = {};

  // Account ID
  if (!data.accountId) {
    errors.accountId = 'Please select an account';
  }

  // Description
  const description = sanitizeDescription(data.description);
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length < 1) {
    errors.description = 'Description must be at least 1 character';
  } else if (description.length > 200) {
    errors.description = 'Description must be at most 200 characters';
  }

  // Amount
  const amount = parseAmount(data.amount);
  if (amount === null) {
    errors.amount = 'Please enter a valid amount';
  } else if (amount === 0) {
    errors.amount = 'Amount cannot be zero';
  }

  // Date
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const parsedDate = fromDateString(data.date);
    if (!isValidDate(parsedDate)) {
      errors.date = 'Please enter a valid date';
    }
  }

  // Category (optional)
  const category = data.category ? sanitizeCategory(data.category) : null;

  // Recurrence validation
  let recurrenceRule: RecurrenceRule | null = null;
  let endDate: string | null = null;

  if (data.isRecurring) {
    if (!data.recurrenceRule) {
      errors.recurrenceRule = 'Please configure the recurrence pattern';
    } else {
      const ruleValidation = validateRecurrenceRule(data.recurrenceRule);
      if (!ruleValidation.isValid) {
        errors.recurrenceRule = ruleValidation.error!;
      } else {
        recurrenceRule = data.recurrenceRule;
      }
    }

    // End date (optional for recurring)
    if (data.endDate) {
      const parsedEndDate = fromDateString(data.endDate);
      if (!isValidDate(parsedEndDate)) {
        errors.endDate = 'Please enter a valid end date';
      } else {
        // End date should be after start date
        const startDate = fromDateString(data.date);
        if (isValidDate(startDate) && parsedEndDate <= startDate) {
          errors.endDate = 'End date must be after start date';
        } else {
          endDate = data.endDate;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      account_id: data.accountId,
      description,
      amount: amount!,
      category,
      date: data.date,
      is_recurring: data.isRecurring,
      recurrence_rule: recurrenceRule,
      end_date: endDate,
    },
    errors: {},
  };
}

/**
 * Validate a recurrence rule.
 */
export function validateRecurrenceRule(rule: RecurrenceRule): {
  isValid: boolean;
  error?: string;
} {
  const { frequency, interval, daysOfMonth, weekday, weekOfMonth } = rule;

  // Validate frequency
  const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
  if (!validFrequencies.includes(frequency)) {
    return { isValid: false, error: 'Invalid frequency' };
  }

  // Validate interval
  if (interval !== undefined) {
    if (!Number.isInteger(interval) || interval < 1) {
      return { isValid: false, error: 'Interval must be a positive integer' };
    }
    if (interval > 365) {
      return { isValid: false, error: 'Interval is too large' };
    }
  }

  // Monthly-specific validation
  if (frequency === 'monthly') {
    // Must have one of: daysOfMonth, lastDayOfMonth, or weekday+weekOfMonth
    const hasDaysOfMonth = daysOfMonth && daysOfMonth.length > 0;
    const hasLastDay = rule.lastDayOfMonth === true;
    const hasNthWeekday = weekday !== undefined && weekOfMonth !== undefined;

    if (!hasDaysOfMonth && !hasLastDay && !hasNthWeekday) {
      return {
        isValid: false,
        error: 'Monthly recurrence requires days of month or nth weekday',
      };
    }

    // Validate days of month
    if (hasDaysOfMonth) {
      for (const day of daysOfMonth!) {
        if (!Number.isInteger(day) || day < 1 || day > 31) {
          return { isValid: false, error: 'Days of month must be between 1 and 31' };
        }
      }
    }

    // Validate nth weekday
    if (hasNthWeekday) {
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        return { isValid: false, error: 'Weekday must be between 0 (Sunday) and 6 (Saturday)' };
      }
      if (
        !Number.isInteger(weekOfMonth) ||
        (weekOfMonth < 1 && weekOfMonth !== -1) ||
        weekOfMonth > 4
      ) {
        return { isValid: false, error: 'Week of month must be 1-4 or -1 (last)' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validate settings form data.
 */
export function validateSettingsForm(
  data: SettingsFormData
): ValidationResult<ValidatedSettings> {
  const errors: Record<string, string> = {};

  const threshold = parseAmount(data.warningThreshold);
  if (threshold === null) {
    errors.warningThreshold = 'Please enter a valid amount';
  } else if (threshold < 0) {
    errors.warningThreshold = 'Warning threshold cannot be negative';
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      warning_threshold: threshold!,
    },
    errors: {},
  };
}

/**
 * Check if a string is a valid UUID.
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a string is a valid date in YYYY-MM-DD format.
 */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = fromDateString(value);
  return isValidDate(date);
}
