import { describe, it, expect } from 'vitest';
import {
  validateAccountForm,
  validateCheckpointForm,
  validateTransactionForm,
  validateSettingsForm,
  validateRecurrenceRule,
  isValidUUID,
  isValidDateString,
} from '@/lib/validation';
import type { RecurrenceRule } from '@/types';

describe('validateAccountForm', () => {
  it('validates a valid account name', () => {
    const result = validateAccountForm({ name: 'Checking' });
    expect(result.isValid).toBe(true);
    expect(result.data?.name).toBe('Checking');
    expect(result.errors).toEqual({});
  });

  it('rejects empty name', () => {
    const result = validateAccountForm({ name: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('rejects whitespace-only name', () => {
    const result = validateAccountForm({ name: '   ' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('sanitizes HTML in name', () => {
    const result = validateAccountForm({ name: '<script>alert(1)</script>Checking' });
    expect(result.isValid).toBe(true);
    expect(result.data?.name).toBe('Checking');
  });

  it('truncates name to 100 characters', () => {
    // The sanitization function truncates names to 100 chars
    const result = validateAccountForm({ name: 'a'.repeat(150) });
    expect(result.isValid).toBe(true);
    expect(result.data?.name.length).toBe(100);
  });
});

describe('validateCheckpointForm', () => {
  const validData = {
    accountId: 'account-123',
    date: '2024-01-15',
    amount: '1000.00',
    notes: '',
  };

  it('validates a valid checkpoint', () => {
    const result = validateCheckpointForm(validData);
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      account_id: 'account-123',
      date: '2024-01-15',
      amount: 1000,
      notes: null,
    });
  });

  it('rejects missing account ID', () => {
    const result = validateCheckpointForm({ ...validData, accountId: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.accountId).toBeDefined();
  });

  it('rejects missing date', () => {
    const result = validateCheckpointForm({ ...validData, date: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  it('rejects invalid amount', () => {
    const result = validateCheckpointForm({ ...validData, amount: 'abc' });
    expect(result.isValid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  it('accepts zero amount for checkpoints', () => {
    const result = validateCheckpointForm({ ...validData, amount: '0' });
    expect(result.isValid).toBe(true);
    expect(result.data?.amount).toBe(0);
  });

  it('accepts negative amount for checkpoints', () => {
    const result = validateCheckpointForm({ ...validData, amount: '-500' });
    expect(result.isValid).toBe(true);
    expect(result.data?.amount).toBe(-500);
  });

  it('sanitizes notes', () => {
    const result = validateCheckpointForm({
      ...validData,
      notes: '<b>Bold</b> notes',
    });
    expect(result.isValid).toBe(true);
    expect(result.data?.notes).toBe('Bold notes');
  });
});

describe('validateTransactionForm', () => {
  const validData = {
    accountId: 'account-123',
    description: 'Groceries',
    amount: '-50.00',
    category: 'Food',
    date: '2024-01-15',
    isRecurring: false,
    recurrenceRule: null,
    endDate: '',
  };

  it('validates a valid one-time transaction', () => {
    const result = validateTransactionForm(validData);
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      account_id: 'account-123',
      description: 'Groceries',
      amount: -50,
      category: 'Food',
      date: '2024-01-15',
      is_recurring: false,
      recurrence_rule: null,
      end_date: null,
    });
  });

  it('validates a recurring transaction', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', daysOfMonth: [15] };
    const result = validateTransactionForm({
      ...validData,
      isRecurring: true,
      recurrenceRule: rule,
    });
    expect(result.isValid).toBe(true);
    expect(result.data?.is_recurring).toBe(true);
    expect(result.data?.recurrence_rule).toEqual(rule);
  });

  it('rejects missing description', () => {
    const result = validateTransactionForm({ ...validData, description: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.description).toBeDefined();
  });

  it('rejects zero amount', () => {
    const result = validateTransactionForm({ ...validData, amount: '0' });
    expect(result.isValid).toBe(false);
    expect(result.errors.amount).toContain('zero');
  });

  it('rejects recurring without rule', () => {
    const result = validateTransactionForm({
      ...validData,
      isRecurring: true,
      recurrenceRule: null,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.recurrenceRule).toBeDefined();
  });

  it('validates end date after start date', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', daysOfMonth: [15] };
    const result = validateTransactionForm({
      ...validData,
      isRecurring: true,
      recurrenceRule: rule,
      endDate: '2024-01-01', // Before start date
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.endDate).toContain('after');
  });

  it('sanitizes description', () => {
    const result = validateTransactionForm({
      ...validData,
      description: '<script>evil</script>Groceries',
    });
    expect(result.isValid).toBe(true);
    expect(result.data?.description).toBe('Groceries');
  });
});

describe('validateRecurrenceRule', () => {
  it('validates daily frequency', () => {
    const result = validateRecurrenceRule({ frequency: 'daily' });
    expect(result.isValid).toBe(true);
  });

  it('validates daily with interval', () => {
    const result = validateRecurrenceRule({ frequency: 'daily', interval: 3 });
    expect(result.isValid).toBe(true);
  });

  it('validates weekly frequency', () => {
    const result = validateRecurrenceRule({ frequency: 'weekly' });
    expect(result.isValid).toBe(true);
  });

  it('validates biweekly frequency', () => {
    const result = validateRecurrenceRule({ frequency: 'biweekly' });
    expect(result.isValid).toBe(true);
  });

  it('validates monthly with days of month', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      daysOfMonth: [1, 15],
    });
    expect(result.isValid).toBe(true);
  });

  it('validates monthly with last day', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      lastDayOfMonth: true,
    });
    expect(result.isValid).toBe(true);
  });

  it('validates monthly with nth weekday', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      weekday: 5, // Friday
      weekOfMonth: 1, // First
    });
    expect(result.isValid).toBe(true);
  });

  it('validates monthly with last weekday', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      weekday: 1, // Monday
      weekOfMonth: -1, // Last
    });
    expect(result.isValid).toBe(true);
  });

  it('validates yearly frequency', () => {
    const result = validateRecurrenceRule({ frequency: 'yearly' });
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid frequency', () => {
    const result = validateRecurrenceRule({
      frequency: 'invalid' as RecurrenceRule['frequency'],
    });
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid interval', () => {
    const result = validateRecurrenceRule({ frequency: 'daily', interval: 0 });
    expect(result.isValid).toBe(false);
  });

  it('rejects negative interval', () => {
    const result = validateRecurrenceRule({ frequency: 'daily', interval: -1 });
    expect(result.isValid).toBe(false);
  });

  it('rejects too large interval', () => {
    const result = validateRecurrenceRule({ frequency: 'daily', interval: 400 });
    expect(result.isValid).toBe(false);
  });

  it('rejects monthly without specification', () => {
    const result = validateRecurrenceRule({ frequency: 'monthly' });
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid day of month', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      daysOfMonth: [32],
    });
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid weekday', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      weekday: 7,
      weekOfMonth: 1,
    });
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid week of month', () => {
    const result = validateRecurrenceRule({
      frequency: 'monthly',
      weekday: 1,
      weekOfMonth: 5,
    });
    expect(result.isValid).toBe(false);
  });
});

describe('validateSettingsForm', () => {
  it('validates a valid threshold', () => {
    const result = validateSettingsForm({ warningThreshold: '500' });
    expect(result.isValid).toBe(true);
    expect(result.data?.warning_threshold).toBe(500);
  });

  it('accepts zero threshold', () => {
    const result = validateSettingsForm({ warningThreshold: '0' });
    expect(result.isValid).toBe(true);
    expect(result.data?.warning_threshold).toBe(0);
  });

  it('rejects negative threshold', () => {
    const result = validateSettingsForm({ warningThreshold: '-100' });
    expect(result.isValid).toBe(false);
    expect(result.errors.warningThreshold).toContain('negative');
  });

  it('rejects invalid input', () => {
    const result = validateSettingsForm({ warningThreshold: 'abc' });
    expect(result.isValid).toBe(false);
    expect(result.errors.warningThreshold).toBeDefined();
  });
});

describe('isValidUUID', () => {
  it('returns true for valid UUIDs', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('returns false for invalid UUIDs', () => {
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false); // Too short
    expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740001')).toBe(false); // Too long
  });
});

describe('isValidDateString', () => {
  it('returns true for valid date strings', () => {
    expect(isValidDateString('2024-01-15')).toBe(true);
    expect(isValidDateString('2024-12-31')).toBe(true);
  });

  it('returns false for invalid formats', () => {
    expect(isValidDateString('')).toBe(false);
    expect(isValidDateString('01-15-2024')).toBe(false);
    expect(isValidDateString('2024/01/15')).toBe(false);
    expect(isValidDateString('2024-1-15')).toBe(false);
  });

  it('returns false for invalid dates', () => {
    expect(isValidDateString('2024-02-30')).toBe(false);
    expect(isValidDateString('2024-13-01')).toBe(false);
  });
});
