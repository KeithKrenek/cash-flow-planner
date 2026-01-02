import { describe, it, expect } from 'vitest';
import {
  parseCSVLine,
  validateRow,
  convertToTransaction,
  createTransactionFingerprint,
  buildExistingFingerprintMap,
  parseCSV,
  generateCSVTemplate,
  validateFileSize,
} from '@/lib/csv-parser';
import type { DbAccount, DbTransaction, CSVRow } from '@/types';

// Helper to create mock accounts
function createMockAccounts(): DbAccount[] {
  return [
    {
      id: 'acc-1',
      user_id: 'user-1',
      name: 'Checking',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'acc-2',
      user_id: 'user-1',
      name: 'Savings',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'acc-3',
      user_id: 'user-1',
      name: 'Chase Checking',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];
}

// Helper to create mock transactions
function createMockTransactions(): DbTransaction[] {
  return [
    {
      id: 'tx-1',
      user_id: 'user-1',
      account_id: 'acc-1',
      description: 'Salary',
      amount: 3000,
      category: 'Income',
      date: '2024-01-15',
      is_recurring: true,
      recurrence_rule: { frequency: 'monthly', interval: 1 },
      end_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];
}

describe('parseCSVLine', () => {
  it('parses simple comma-separated values', () => {
    const result = parseCSVLine('one,two,three');
    expect(result).toEqual(['one', 'two', 'three']);
  });

  it('handles quoted values with commas', () => {
    const result = parseCSVLine('2024-01-15,"Description, with comma",100');
    expect(result).toEqual(['2024-01-15', 'Description, with comma', '100']);
  });

  it('handles escaped quotes (double quotes)', () => {
    const result = parseCSVLine('value,"Say ""Hello""",end');
    expect(result).toEqual(['value', 'Say "Hello"', 'end']);
  });

  it('handles empty values', () => {
    const result = parseCSVLine('one,,three,');
    expect(result).toEqual(['one', '', 'three', '']);
  });

  it('trims whitespace from values', () => {
    const result = parseCSVLine('  one  ,  two  ,  three  ');
    expect(result).toEqual(['one', 'two', 'three']);
  });

  it('handles quoted values with leading/trailing spaces (trims them)', () => {
    // Note: Implementation trims all values for cleaner data import
    const result = parseCSVLine('"  spaced value  ",normal');
    expect(result).toEqual(['spaced value', 'normal']);
  });

  it('handles empty string', () => {
    const result = parseCSVLine('');
    expect(result).toEqual(['']);
  });

  it('handles single value', () => {
    const result = parseCSVLine('single');
    expect(result).toEqual(['single']);
  });
});

describe('validateRow', () => {
  const accountMap = new Map<string, string>([
    ['checking', 'acc-1'],
    ['savings', 'acc-2'],
  ]);

  it('returns no errors for valid row', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test Transaction',
      amount: '100.00',
      account: 'Checking',
      category: 'Income',
      is_recurring: 'false',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toEqual([]);
  });

  it('validates date is required', () => {
    const row: CSVRow = {
      date: '',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Date is required');
  });

  it('validates date format', () => {
    const row: CSVRow = {
      date: '01-15-2024',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Date must be in YYYY-MM-DD format');
  });

  it('validates date is real', () => {
    const row: CSVRow = {
      date: '2024-13-45',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors.some((e) => e.includes('Date'))).toBe(true);
  });

  it('validates description is required', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: '',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Description is required');
  });

  it('validates amount must be a number', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: 'abc',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Amount must be a valid number');
  });

  it('validates account is required', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: '',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Account is required');
  });

  it('validates account exists', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'NonExistent',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Account "NonExistent" not found');
  });

  it('validates frequency is required for recurring', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: 'true',
      frequency: '',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('Frequency is required for recurring transactions');
  });

  it('validates frequency value', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: 'true',
      frequency: 'invalid',
      end_date: '',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors.some((e) => e.includes('Frequency must be one of'))).toBe(true);
  });

  it('validates end_date format', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '01-15-2024',
    };
    const errors = validateRow(row, accountMap, 1);
    expect(errors).toContain('End date must be in YYYY-MM-DD format');
  });

  it('accepts various is_recurring values', () => {
    const testCases = ['true', 'TRUE', 'yes', 'YES', '1'];
    for (const value of testCases) {
      const row: CSVRow = {
        date: '2024-01-15',
        description: 'Test',
        amount: '100',
        account: 'Checking',
        category: '',
        is_recurring: value,
        frequency: 'monthly',
        end_date: '',
      };
      const errors = validateRow(row, accountMap, 1);
      expect(errors).toEqual([]);
    }
  });
});

describe('convertToTransaction', () => {
  const accountMap = new Map<string, string>([
    ['checking', 'acc-1'],
    ['savings', 'acc-2'],
  ]);

  it('converts valid row to transaction', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Salary',
      amount: '3000.00',
      account: 'Checking',
      category: 'Income',
      is_recurring: 'true',
      frequency: 'monthly',
      end_date: '2024-12-31',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');

    expect(result).toEqual({
      user_id: 'user-1',
      account_id: 'acc-1',
      description: 'Salary',
      amount: 3000,
      category: 'Income',
      date: '2024-01-15',
      is_recurring: true,
      recurrence_rule: { frequency: 'monthly', interval: 1 },
      end_date: '2024-12-31',
    });
  });

  it('handles non-recurring transaction', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'One-time purchase',
      amount: '-50.00',
      account: 'Checking',
      category: 'Shopping',
      is_recurring: 'false',
      frequency: '',
      end_date: '',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');

    expect(result.is_recurring).toBe(false);
    expect(result.recurrence_rule).toBeNull();
    expect(result.end_date).toBeNull();
  });

  it('sanitizes description', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: '<script>alert(1)</script>Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');
    expect(result.description).toBe('Test');
  });

  it('handles case-insensitive account matching', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'CHECKING',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');
    expect(result.account_id).toBe('acc-1');
  });

  it('handles case-insensitive category matching', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: 'INCOME',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');
    expect(result.category).toBe('Income');
  });

  it('allows custom categories', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: 'Custom Category',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');
    expect(result.category).toBe('Custom Category');
  });

  it('sets null category when empty', () => {
    const row: CSVRow = {
      date: '2024-01-15',
      description: 'Test',
      amount: '100',
      account: 'Checking',
      category: '',
      is_recurring: '',
      frequency: '',
      end_date: '',
    };

    const result = convertToTransaction(row, accountMap, 'user-1');
    expect(result.category).toBeNull();
  });
});

describe('createTransactionFingerprint', () => {
  it('creates consistent fingerprint', () => {
    const fp1 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-1');
    const fp2 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-1');
    expect(fp1).toBe(fp2);
  });

  it('normalizes description to lowercase', () => {
    const fp1 = createTransactionFingerprint('2024-01-15', 'SALARY', 3000, 'acc-1');
    const fp2 = createTransactionFingerprint('2024-01-15', 'salary', 3000, 'acc-1');
    expect(fp1).toBe(fp2);
  });

  it('trims description whitespace', () => {
    const fp1 = createTransactionFingerprint('2024-01-15', '  Salary  ', 3000, 'acc-1');
    const fp2 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-1');
    expect(fp1).toBe(fp2);
  });

  it('different dates produce different fingerprints', () => {
    const fp1 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-1');
    const fp2 = createTransactionFingerprint('2024-01-16', 'Salary', 3000, 'acc-1');
    expect(fp1).not.toBe(fp2);
  });

  it('different amounts produce different fingerprints', () => {
    const fp1 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-1');
    const fp2 = createTransactionFingerprint('2024-01-15', 'Salary', 3001, 'acc-1');
    expect(fp1).not.toBe(fp2);
  });

  it('different accounts produce different fingerprints', () => {
    const fp1 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-1');
    const fp2 = createTransactionFingerprint('2024-01-15', 'Salary', 3000, 'acc-2');
    expect(fp1).not.toBe(fp2);
  });
});

describe('buildExistingFingerprintMap', () => {
  it('builds map from transactions', () => {
    const transactions = createMockTransactions();
    const map = buildExistingFingerprintMap(transactions);

    const expectedFingerprint = createTransactionFingerprint(
      '2024-01-15',
      'Salary',
      3000,
      'acc-1'
    );
    expect(map.get(expectedFingerprint)).toBe('tx-1');
  });

  it('handles empty array', () => {
    const map = buildExistingFingerprintMap([]);
    expect(map.size).toBe(0);
  });
});

describe('parseCSV', () => {
  const accounts = createMockAccounts();

  it('parses valid CSV with single row', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,true,monthly,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(0);
    expect(result.valid[0].description).toBe('Salary');
    expect(result.valid[0].amount).toBe(3000);
  });

  it('parses valid CSV with multiple rows', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,true,monthly,
2024-01-20,Groceries,-150.00,Checking,Food & Dining,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it('rejects missing columns', () => {
    const csv = `date,description
2024-01-15,Test`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].errors[0]).toContain('Missing required columns');
  });

  it('handles empty CSV', () => {
    const csv = '';

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].errors[0]).toContain('Missing required columns');
  });

  it('matches accounts case-insensitively', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Test,100,chase checking,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].account_id).toBe('acc-3');
  });

  it('detects duplicate transactions', () => {
    const existingTransactions = createMockTransactions();
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000,Checking,Income,true,monthly,`;

    const result = parseCSV(csv, accounts, 'user-1', existingTransactions);

    expect(result.valid.length).toBe(1);
    expect(result.duplicateWarnings.length).toBe(1);
    expect(result.duplicateWarnings[0].existingId).toBe('tx-1');
  });

  it('sanitizes XSS in description', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,<script>alert(1)</script>Test,100,Checking,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].description).toBe('Test');
  });

  it('validates date format', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
01-15-2024,Test,100,Checking,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].errors).toContain('Date must be in YYYY-MM-DD format');
  });

  it('validates amount is number', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Test,abc,Checking,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].errors).toContain('Amount must be a valid number');
  });

  it('requires frequency for recurring', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Test,100,Checking,Income,true,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].errors).toContain('Frequency is required for recurring transactions');
  });

  it('handles quoted values with commas', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,"Description, with comma",100,Checking,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].description).toBe('Description, with comma');
  });

  it('handles empty lines', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date

2024-01-15,Test,100,Checking,Income,false,,

`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(0);
  });

  it('handles Windows line endings (CRLF)', () => {
    const csv = 'date,description,amount,account,category,is_recurring,frequency,end_date\r\n2024-01-15,Test,100,Checking,Income,false,,\r\n';

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
  });

  it('handles old Mac line endings (CR)', () => {
    const csv = 'date,description,amount,account,category,is_recurring,frequency,end_date\r2024-01-15,Test,100,Checking,Income,false,,';

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
  });

  it('reports multiple errors per row', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
invalid-date,,abc,NonExistent,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].errors.length).toBeGreaterThan(1);
  });

  it('handles negative amounts', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Expense,-150.00,Checking,Shopping,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].amount).toBe(-150);
  });

  it('handles amounts with currency symbols', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Test,$1000.00,Checking,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].amount).toBe(1000);
  });

  it('validates all frequency values', () => {
    const frequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

    for (const freq of frequencies) {
      const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Test,100,Checking,Income,true,${freq},`;

      const result = parseCSV(csv, accounts, 'user-1');
      expect(result.valid.length).toBe(1);
      expect(result.errors.length).toBe(0);
    }
  });

  it('returns correct row numbers in errors', () => {
    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Valid,100,Checking,Income,false,,
invalid,Invalid,abc,NonExistent,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].row).toBe(3); // Row 3 (1-indexed, header is row 1)
  });

  it('handles columns in different order', () => {
    const csv = `amount,date,account,description,category,is_recurring,frequency,end_date
100,2024-01-15,Checking,Test,Income,false,,`;

    const result = parseCSV(csv, accounts, 'user-1');

    expect(result.valid.length).toBe(1);
    expect(result.valid[0].description).toBe('Test');
    expect(result.valid[0].amount).toBe(100);
  });
});

describe('generateCSVTemplate', () => {
  it('includes all required headers', () => {
    const template = generateCSVTemplate();
    const firstLine = template.split('\n')[0];

    expect(firstLine).toContain('date');
    expect(firstLine).toContain('description');
    expect(firstLine).toContain('amount');
    expect(firstLine).toContain('account');
    expect(firstLine).toContain('category');
    expect(firstLine).toContain('is_recurring');
    expect(firstLine).toContain('frequency');
    expect(firstLine).toContain('end_date');
  });

  it('includes example rows', () => {
    const template = generateCSVTemplate();
    const lines = template.split('\n');

    expect(lines.length).toBeGreaterThan(1);
    expect(template).toContain('Salary');
    expect(template).toContain('Groceries');
  });
});

describe('validateFileSize', () => {
  it('returns true for file under limit', () => {
    const file = { size: 1000 } as File;
    expect(validateFileSize(file, 2000)).toBe(true);
  });

  it('returns true for file at limit', () => {
    const file = { size: 1000 } as File;
    expect(validateFileSize(file, 1000)).toBe(true);
  });

  it('returns false for file over limit', () => {
    const file = { size: 2000 } as File;
    expect(validateFileSize(file, 1000)).toBe(false);
  });
});
