import { CSV_HEADERS, CATEGORIES } from './constants';
import { sanitizeDescription, sanitizeCategory } from './sanitize';
import { parseAmount } from './amount-utils';
import type {
  DbAccount,
  DbTransaction,
  RecurrenceRule,
  RecurrenceFrequency,
  CSVRow,
  CSVParseResult,
  ValidatedCSVTransaction,
} from '@/types';

/**
 * Parse a CSV line, handling quoted values with commas.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quote (double quote)
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

/**
 * Validate a CSV row and return errors.
 */
export function validateRow(
  row: CSVRow,
  accountMap: Map<string, string>,
  rowNumber: number
): string[] {
  const errors: string[] = [];

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!row.date) {
    errors.push('Date is required');
  } else if (!dateRegex.test(row.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  } else {
    // Validate it's a real date
    const parsed = new Date(row.date + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      errors.push('Date is invalid');
    }
  }

  // Validate description
  if (!row.description || row.description.trim() === '') {
    errors.push('Description is required');
  }

  // Validate amount
  const amount = parseAmount(row.amount);
  if (amount === null) {
    errors.push('Amount must be a valid number');
  }

  // Validate account exists (case-insensitive)
  const accountLower = row.account?.toLowerCase()?.trim();
  if (!accountLower) {
    errors.push('Account is required');
  } else if (!accountMap.has(accountLower)) {
    errors.push(`Account "${row.account}" not found`);
  }

  // Validate recurring fields
  const isRecurringStr = row.is_recurring?.toLowerCase()?.trim();
  const isRecurring = isRecurringStr === 'true' || isRecurringStr === 'yes' || isRecurringStr === '1';

  if (isRecurring) {
    const validFrequencies: RecurrenceFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
    const frequency = row.frequency?.toLowerCase()?.trim() as RecurrenceFrequency;

    if (!frequency) {
      errors.push('Frequency is required for recurring transactions');
    } else if (!validFrequencies.includes(frequency)) {
      errors.push(`Frequency must be one of: ${validFrequencies.join(', ')}`);
    }
  }

  // Validate end_date if provided
  if (row.end_date && row.end_date.trim() !== '') {
    if (!dateRegex.test(row.end_date)) {
      errors.push('End date must be in YYYY-MM-DD format');
    } else {
      const parsed = new Date(row.end_date + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        errors.push('End date is invalid');
      }
    }
  }

  // Validate category if provided (warn if not in standard list, but allow it)
  if (row.category && row.category.trim() !== '') {
    const normalizedCategory = row.category.trim();
    const isStandardCategory = CATEGORIES.some(
      (cat) => cat.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (!isStandardCategory) {
      // Not an error, just a custom category - we allow it
    }
  }

  return errors;
}

/**
 * Convert a validated CSV row to a transaction insert object.
 */
export function convertToTransaction(
  row: CSVRow,
  accountMap: Map<string, string>,
  userId: string
): ValidatedCSVTransaction {
  const accountLower = row.account.toLowerCase().trim();
  const accountId = accountMap.get(accountLower)!;

  const isRecurringStr = row.is_recurring?.toLowerCase()?.trim();
  const isRecurring = isRecurringStr === 'true' || isRecurringStr === 'yes' || isRecurringStr === '1';

  let recurrenceRule: RecurrenceRule | null = null;
  if (isRecurring) {
    const frequency = row.frequency.toLowerCase().trim() as RecurrenceFrequency;
    recurrenceRule = {
      frequency,
      interval: 1,
    };
  }

  // Find matching category (case-insensitive) or use sanitized custom
  let category: string | null = null;
  if (row.category && row.category.trim() !== '') {
    const inputCategory = row.category.trim();
    const matchingCategory = CATEGORIES.find(
      (cat) => cat.toLowerCase() === inputCategory.toLowerCase()
    );
    category = matchingCategory || sanitizeCategory(inputCategory);
  }

  return {
    user_id: userId,
    account_id: accountId,
    description: sanitizeDescription(row.description),
    amount: parseAmount(row.amount)!,
    category,
    date: row.date.trim(),
    is_recurring: isRecurring,
    recurrence_rule: recurrenceRule,
    end_date: row.end_date?.trim() || null,
  };
}

/**
 * Create a fingerprint for duplicate detection.
 * Matches on date, description (normalized), amount, and account.
 */
export function createTransactionFingerprint(
  date: string,
  description: string,
  amount: number,
  accountId: string
): string {
  const normalizedDescription = description.toLowerCase().trim();
  return `${date}|${normalizedDescription}|${amount}|${accountId}`;
}

/**
 * Build a map of existing transaction fingerprints for duplicate detection.
 */
export function buildExistingFingerprintMap(
  transactions: DbTransaction[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const tx of transactions) {
    const fingerprint = createTransactionFingerprint(
      tx.date,
      tx.description,
      tx.amount,
      tx.account_id
    );
    map.set(fingerprint, tx.id);
  }
  return map;
}

/**
 * Main CSV parsing function.
 * Parses CSV text and returns valid transactions, errors, and duplicate warnings.
 */
export function parseCSV(
  csvText: string,
  accounts: DbAccount[],
  userId: string,
  existingTransactions: DbTransaction[] = []
): CSVParseResult {
  const result: CSVParseResult = {
    valid: [],
    errors: [],
    duplicateWarnings: [],
  };

  // Normalize line endings
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');

  if (lines.length === 0) {
    result.errors.push({
      row: 0,
      data: {} as CSVRow,
      errors: ['CSV file is empty'],
    });
    return result;
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  // Validate required columns exist
  const missingColumns = CSV_HEADERS.filter(
    (required) => !headers.includes(required)
  );
  if (missingColumns.length > 0) {
    result.errors.push({
      row: 0,
      data: {} as CSVRow,
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
    });
    return result;
  }

  // Build account lookup map (case-insensitive)
  const accountMap = new Map<string, string>();
  for (const account of accounts) {
    accountMap.set(account.name.toLowerCase(), account.id);
  }

  // Build existing transaction fingerprint map
  const existingFingerprints = buildExistingFingerprintMap(existingTransactions);

  // Get column indices
  const columnIndices: Record<string, number> = {};
  for (const header of CSV_HEADERS) {
    columnIndices[header] = headers.indexOf(header);
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (line === '') {
      continue;
    }

    const values = parseCSVLine(line);
    const rowNumber = i + 1; // 1-indexed for user display

    // Build row object
    const row: CSVRow = {
      date: values[columnIndices['date']] || '',
      description: values[columnIndices['description']] || '',
      amount: values[columnIndices['amount']] || '',
      account: values[columnIndices['account']] || '',
      category: values[columnIndices['category']] || '',
      is_recurring: values[columnIndices['is_recurring']] || '',
      frequency: values[columnIndices['frequency']] || '',
      end_date: values[columnIndices['end_date']] || '',
    };

    // Validate row
    const errors = validateRow(row, accountMap, rowNumber);

    if (errors.length > 0) {
      result.errors.push({
        row: rowNumber,
        data: row,
        errors,
      });
      continue;
    }

    // Convert to transaction
    const transaction = convertToTransaction(row, accountMap, userId);

    // Check for duplicates
    const fingerprint = createTransactionFingerprint(
      transaction.date,
      transaction.description,
      transaction.amount,
      transaction.account_id
    );

    const existingId = existingFingerprints.get(fingerprint);
    if (existingId) {
      result.duplicateWarnings.push({
        row: rowNumber,
        existingId,
        message: `Possible duplicate of existing transaction`,
      });
    }

    result.valid.push(transaction);
  }

  return result;
}

/**
 * Generate a CSV template with example data.
 */
export function generateCSVTemplate(): string {
  const headers = CSV_HEADERS.join(',');
  const exampleRows = [
    '2024-01-15,Salary,3000.00,Checking,Income,true,monthly,',
    '2024-01-20,Groceries,-150.00,Checking,Food & Dining,false,,',
    '2024-01-01,Rent,-1500.00,Checking,Housing,true,monthly,2024-12-31',
    '2024-01-05,"Electric Bill, Gas",-120.00,Checking,Utilities,true,monthly,',
  ];

  return [headers, ...exampleRows].join('\n');
}

/**
 * Validate file size before parsing.
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Read a file as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}
