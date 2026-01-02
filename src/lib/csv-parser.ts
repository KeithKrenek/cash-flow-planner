import { CSV_HEADERS, CSV_OPTIONAL_HEADERS, CATEGORIES } from './constants';
import { sanitizeDescription, sanitizeCategory, sanitizeAccountName } from './sanitize';
import { parseAmount } from './amount-utils';
import type {
  DbAccount,
  DbTransaction,
  RecurrenceRule,
  RecurrenceFrequency,
  CSVRow,
  CSVParseResult,
  ValidatedCSVTransaction,
  CSVAccountToCreate,
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
 * When allowNewAccounts is true, missing accounts are not considered errors.
 */
export function validateRow(
  row: CSVRow,
  accountMap: Map<string, string>,
  _rowNumber: number,
  allowNewAccounts: boolean = false
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

  // Validate account name is provided
  const accountLower = row.account?.toLowerCase()?.trim();
  if (!accountLower) {
    errors.push('Account is required');
  } else if (!allowNewAccounts && !accountMap.has(accountLower)) {
    // Only error if we're not allowing new accounts
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

  // Validate initial_balance if provided
  if (row.initial_balance && row.initial_balance.trim() !== '') {
    const balance = parseAmount(row.initial_balance);
    if (balance === null) {
      errors.push('Initial balance must be a valid number');
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
 * Options for CSV parsing
 */
export interface ParseCSVOptions {
  allowNewAccounts?: boolean; // If true, accounts not in the database will be created
}

/**
 * Main CSV parsing function.
 * Parses CSV text and returns valid transactions, errors, duplicate warnings,
 * and optionally accounts/checkpoints to create.
 */
export function parseCSV(
  csvText: string,
  accounts: DbAccount[],
  userId: string,
  existingTransactions: DbTransaction[] = [],
  options: ParseCSVOptions = {}
): CSVParseResult {
  const { allowNewAccounts = false } = options;

  const result: CSVParseResult = {
    valid: [],
    errors: [],
    duplicateWarnings: [],
    accountsToCreate: [],
    checkpointsToCreate: [],
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

  // Track new accounts discovered in CSV (for auto-creation)
  const newAccountsMap = new Map<string, CSVAccountToCreate>();

  // Build existing transaction fingerprint map
  const existingFingerprints = buildExistingFingerprintMap(existingTransactions);

  // Get column indices for required columns
  const columnIndices: Record<string, number> = {};
  for (const header of CSV_HEADERS) {
    columnIndices[header] = headers.indexOf(header);
  }
  // Also check for optional columns
  for (const header of CSV_OPTIONAL_HEADERS) {
    const idx = headers.indexOf(header);
    if (idx !== -1) {
      columnIndices[header] = idx;
    }
  }

  // First pass: collect all unique account names and their initial balances
  const accountInitialBalances = new Map<string, { balance: number; date: string }>();

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
      initial_balance: columnIndices['initial_balance'] !== undefined
        ? values[columnIndices['initial_balance']] || ''
        : '',
    };

    // Validate row
    const errors = validateRow(row, accountMap, rowNumber, allowNewAccounts);

    if (errors.length > 0) {
      result.errors.push({
        row: rowNumber,
        data: row,
        errors,
      });
      continue;
    }

    // Check if this is a new account
    const accountLower = row.account.toLowerCase().trim();
    const accountName = row.account.trim();

    if (allowNewAccounts && !accountMap.has(accountLower)) {
      // Track this as a new account to create
      if (!newAccountsMap.has(accountLower)) {
        const initialBalance = row.initial_balance
          ? parseAmount(row.initial_balance)
          : null;

        newAccountsMap.set(accountLower, {
          name: sanitizeAccountName(accountName),
          originalKey: accountLower, // Store the key used in __NEW__ placeholders
          initialBalance,
          initialBalanceDate: initialBalance !== null ? row.date : null,
        });

        // Track initial balance for checkpoint creation
        if (initialBalance !== null) {
          // Only use the first occurrence of initial_balance for this account
          if (!accountInitialBalances.has(accountLower)) {
            accountInitialBalances.set(accountLower, {
              balance: initialBalance,
              date: row.date,
            });
          }
        }
      } else if (row.initial_balance) {
        // Update initial balance if provided and not yet set
        const existing = newAccountsMap.get(accountLower)!;
        if (existing.initialBalance === null) {
          const initialBalance = parseAmount(row.initial_balance);
          if (initialBalance !== null) {
            existing.initialBalance = initialBalance;
            existing.initialBalanceDate = row.date;
            accountInitialBalances.set(accountLower, {
              balance: initialBalance,
              date: row.date,
            });
          }
        }
      }
    }

    // For existing accounts, check if initial_balance is provided
    if (accountMap.has(accountLower) && row.initial_balance) {
      const initialBalance = parseAmount(row.initial_balance);
      if (initialBalance !== null && !accountInitialBalances.has(accountLower)) {
        accountInitialBalances.set(accountLower, {
          balance: initialBalance,
          date: row.date,
        });
      }
    }

    // Convert to transaction (use placeholder for new accounts, will be resolved later)
    const accountId = accountMap.get(accountLower) || `__NEW__${accountLower}`;
    const transaction = convertToTransactionWithAccountId(row, accountId, userId);

    // Skip zero-amount transactions (these are typically just initial balance markers)
    // The database has a constraint that amount cannot be zero
    if (transaction.amount === 0) {
      continue;
    }

    // Check for duplicates (only for existing accounts)
    if (accountMap.has(accountLower)) {
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
    }

    result.valid.push(transaction);
  }

  // Add discovered new accounts to result
  result.accountsToCreate = Array.from(newAccountsMap.values());

  // Add checkpoints for accounts with initial balances
  for (const [accountLower, { balance, date }] of accountInitialBalances) {
    // Get the proper account name (either from existing or from new accounts map)
    const existingAccount = accounts.find(a => a.name.toLowerCase() === accountLower);
    const newAccount = newAccountsMap.get(accountLower);
    const accountName = existingAccount?.name || newAccount?.name || accountLower;

    result.checkpointsToCreate.push({
      accountName,
      date,
      amount: balance,
    });
  }

  return result;
}

/**
 * Convert a validated CSV row to a transaction insert object with a known account ID.
 */
function convertToTransactionWithAccountId(
  row: CSVRow,
  accountId: string,
  userId: string
): ValidatedCSVTransaction {
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
 * Generate a CSV template with example data.
 * When includeInitialBalance is true, includes the optional initial_balance column.
 */
export function generateCSVTemplate(includeInitialBalance: boolean = true): string {
  const allHeaders = includeInitialBalance
    ? [...CSV_HEADERS, ...CSV_OPTIONAL_HEADERS]
    : CSV_HEADERS;
  const headers = allHeaders.join(',');

  // Note: initial_balance only needs to be specified once per account (on any row)
  // It creates a checkpoint, not a transaction
  const exampleRows = includeInitialBalance
    ? [
        '2024-01-15,Salary,3000.00,Checking,Income,true,monthly,,5000.00',
        '2024-01-20,Groceries,-150.00,Checking,Food & Dining,false,,,',
        '2024-01-01,Rent,-1500.00,Checking,Housing,true,monthly,2024-12-31,',
        '2024-01-05,"Electric Bill, Gas",-120.00,Checking,Utilities,true,monthly,,',
        '2024-01-10,Transfer to Savings,-500.00,Checking,Savings,false,,,',
        '2024-01-10,Transfer from Checking,500.00,Savings,Savings,false,,,10000.00',
      ]
    : [
        '2024-01-15,Salary,3000.00,Checking,Income,true,monthly,',
        '2024-01-20,Groceries,-150.00,Checking,Food & Dining,false,,',
        '2024-01-01,Rent,-1500.00,Checking,Housing,true,monthly,2024-12-31',
        '2024-01-05,"Electric Bill, Gas",-120.00,Checking,Utilities,true,monthly,',
      ];

  return [headers, ...exampleRows].join('\n');
}

/**
 * Resolve placeholder account IDs in transactions after accounts are created.
 * Returns a new array with resolved account IDs.
 */
export function resolveAccountIds(
  transactions: ValidatedCSVTransaction[],
  accountNameToIdMap: Map<string, string>
): ValidatedCSVTransaction[] {
  return transactions.map((tx) => {
    if (tx.account_id.startsWith('__NEW__')) {
      const accountLower = tx.account_id.replace('__NEW__', '');
      const resolvedId = accountNameToIdMap.get(accountLower);
      if (resolvedId) {
        return { ...tx, account_id: resolvedId };
      }
    }
    return tx;
  });
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
