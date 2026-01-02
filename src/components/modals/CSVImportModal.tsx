import { useState, useRef, useCallback } from 'react';
import { Modal, Button, Spinner, Badge } from '@/components/ui';
import {
  useAccounts,
  useTransactions,
  useCreateManyTransactions,
  useCreateAccount,
  useCreateCheckpoint,
} from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import {
  parseCSV,
  generateCSVTemplate,
  validateFileSize,
  readFileAsText,
  resolveAccountIds,
} from '@/lib/csv-parser';
import { MAX_CSV_FILE_SIZE } from '@/lib/constants';
import type { CSVParseResult, DbAccount } from '@/types';

export interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'success' | 'error';

interface ImportSummary {
  accountsCreated: number;
  checkpointsCreated: number;
  transactionsImported: number;
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { data: existingTransactions = [], isLoading: transactionsLoading } = useTransactions();
  const createManyTransactions = useCreateManyTransactions();
  const createAccount = useCreateAccount();
  const createCheckpoint = useCreateCheckpoint();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>('idle');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importProgress, setImportProgress] = useState<string>('');

  const resetState = useCallback(() => {
    setState('idle');
    setParseResult(null);
    setError(null);
    setIsDragOver(false);
    setImportSummary(null);
    setImportProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    if (!user) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size
    if (!validateFileSize(file, MAX_CSV_FILE_SIZE)) {
      setError(`File is too large. Maximum size is ${MAX_CSV_FILE_SIZE / 1024}KB`);
      return;
    }

    setState('parsing');
    setError(null);

    try {
      const text = await readFileAsText(file);
      // Parse with allowNewAccounts=true to support auto-creation
      const result = parseCSV(text, accounts, user.id, existingTransactions, {
        allowNewAccounts: true,
      });
      setParseResult(result);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setState('error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate(true);
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!parseResult || !user) return;

    // Check if there's anything to import
    const hasAccountsToCreate = parseResult.accountsToCreate.length > 0;
    const hasCheckpointsToCreate = parseResult.checkpointsToCreate.length > 0;
    const hasTransactions = parseResult.valid.length > 0;

    if (!hasAccountsToCreate && !hasCheckpointsToCreate && !hasTransactions) {
      setError('Nothing to import');
      return;
    }

    setState('importing');

    try {
      const summary: ImportSummary = {
        accountsCreated: 0,
        checkpointsCreated: 0,
        transactionsImported: 0,
      };

      // Map to track new account names to their created IDs
      const newAccountNameToId = new Map<string, string>();

      // Step 1: Create new accounts
      if (hasAccountsToCreate) {
        setImportProgress(`Creating ${parseResult.accountsToCreate.length} account(s)...`);

        for (const accountToCreate of parseResult.accountsToCreate) {
          const newAccount = await createAccount.mutateAsync({
            name: accountToCreate.name,
            user_id: user.id,
          });
          // Use originalKey to ensure consistent lookup with __NEW__ placeholders
          newAccountNameToId.set(accountToCreate.originalKey, newAccount.id);
          summary.accountsCreated++;
        }

        // Refetch accounts to get fresh data
        await refetchAccounts();
      }

      // Build complete account map (existing + new)
      const allAccountsMap = new Map<string, string>();
      accounts.forEach((acc: DbAccount) => {
        allAccountsMap.set(acc.name.toLowerCase(), acc.id);
      });
      newAccountNameToId.forEach((id, name) => {
        allAccountsMap.set(name, id);
      });

      // Step 2: Create checkpoints for initial balances
      if (hasCheckpointsToCreate) {
        setImportProgress(`Creating ${parseResult.checkpointsToCreate.length} initial balance(s)...`);

        for (const checkpointToCreate of parseResult.checkpointsToCreate) {
          const accountId = allAccountsMap.get(checkpointToCreate.accountName.toLowerCase());
          if (accountId) {
            await createCheckpoint.mutateAsync({
              account_id: accountId,
              user_id: user.id,
              date: checkpointToCreate.date,
              amount: checkpointToCreate.amount,
              notes: 'Initial balance from CSV import',
            });
            summary.checkpointsCreated++;
          }
        }
      }

      // Step 3: Import transactions
      if (hasTransactions) {
        setImportProgress(`Importing ${parseResult.valid.length} transaction(s)...`);

        // Resolve placeholder account IDs
        const resolvedTransactions = resolveAccountIds(parseResult.valid, allAccountsMap);

        // Filter out any transactions with unresolved accounts (shouldn't happen, but safety check)
        const validTransactions = resolvedTransactions.filter(
          (tx) => !tx.account_id.startsWith('__NEW__')
        );

        if (validTransactions.length > 0) {
          const transactionsToInsert = validTransactions.map((tx) => ({
            user_id: tx.user_id,
            account_id: tx.account_id,
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            is_recurring: tx.is_recurring,
            recurrence_rule: tx.recurrence_rule,
            end_date: tx.end_date,
          }));

          // Debug logging - remove after fixing
          console.log('Transactions to insert:', JSON.stringify(transactionsToInsert, null, 2));
          console.log('Account map:', Object.fromEntries(allAccountsMap));

          await createManyTransactions.mutateAsync(transactionsToInsert);
          summary.transactionsImported = transactionsToInsert.length;
        }
      }

      setImportSummary(summary);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
      setState('error');
    }
  };

  const isLoading = accountsLoading || transactionsLoading;

  // Render loading state
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Import CSV" size="lg">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Modal>
    );
  }

  // Calculate what will be imported (for preview)
  const hasNewAccounts = parseResult && parseResult.accountsToCreate.length > 0;
  const hasCheckpoints = parseResult && parseResult.checkpointsToCreate.length > 0;
  const hasValidTransactions = parseResult && parseResult.valid.length > 0;
  const canImport = hasNewAccounts || hasCheckpoints || hasValidTransactions;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import CSV" size="lg">
      <div className="space-y-4">
        {/* Idle state - File upload zone */}
        {state === 'idle' && (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="csv-file-input"
              />

              <svg
                className="mx-auto h-12 w-12 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <p className="mt-4 text-text-primary">
                Drag and drop a CSV file here, or{' '}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>

              <p className="mt-2 text-sm text-text-muted">
                Maximum file size: {MAX_CSV_FILE_SIZE / 1024}KB
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                New accounts will be created automatically from your CSV
              </p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-sm text-accent hover:underline"
                onClick={handleDownloadTemplate}
              >
                Download template
              </button>

              {accounts.length > 0 && (
                <div className="text-sm text-text-muted">
                  Existing accounts: {accounts.map((a: DbAccount) => a.name).join(', ')}
                </div>
              )}
            </div>
          </>
        )}

        {/* Parsing state */}
        {state === 'parsing' && (
          <div className="flex flex-col items-center py-8">
            <Spinner />
            <p className="mt-4 text-text-muted">Parsing CSV file...</p>
          </div>
        )}

        {/* Preview state */}
        {state === 'preview' && parseResult && (
          <>
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 text-sm">
                {hasNewAccounts && (
                  <Badge variant="info">
                    {parseResult.accountsToCreate.length} new account
                    {parseResult.accountsToCreate.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {hasCheckpoints && (
                  <Badge variant="info">
                    {parseResult.checkpointsToCreate.length} initial balance
                    {parseResult.checkpointsToCreate.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {hasValidTransactions && (
                  <Badge variant="success">
                    {parseResult.valid.length} transaction
                    {parseResult.valid.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {parseResult.errors.length > 0 && (
                  <Badge variant="danger">{parseResult.errors.length} errors</Badge>
                )}
                {parseResult.duplicateWarnings.length > 0 && (
                  <Badge variant="warning">
                    {parseResult.duplicateWarnings.length} possible duplicates
                  </Badge>
                )}
              </div>

              {/* New accounts preview */}
              {hasNewAccounts && (
                <div className="border border-accent/50 rounded-lg overflow-hidden">
                  <div className="bg-accent/10 px-3 py-2 border-b border-accent/50">
                    <span className="text-sm font-medium text-accent">
                      New Accounts to Create
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    {parseResult.accountsToCreate.map((acc, i) => (
                      <div key={i} className="text-sm flex justify-between">
                        <span className="text-text-primary">{acc.name}</span>
                        {acc.initialBalance !== null && (
                          <span className="text-text-secondary">
                            Initial: ${acc.initialBalance.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid transactions preview */}
              {hasValidTransactions && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-surface-secondary px-3 py-2 border-b border-border">
                    <span className="text-sm font-medium text-text-primary">
                      Transactions to Import
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-secondary sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-text-muted">Date</th>
                          <th className="px-3 py-2 text-left text-text-muted">Description</th>
                          <th className="px-3 py-2 text-right text-text-muted">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.valid.slice(0, 10).map((tx, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 text-text-primary">{tx.date}</td>
                            <td className="px-3 py-2 text-text-primary">{tx.description}</td>
                            <td
                              className={`px-3 py-2 text-right ${
                                tx.amount >= 0 ? 'text-success' : 'text-danger'
                              }`}
                            >
                              {tx.amount >= 0 ? '+' : ''}
                              {tx.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {parseResult.valid.length > 10 && (
                          <tr className="border-t border-border">
                            <td colSpan={3} className="px-3 py-2 text-text-muted text-center">
                              ... and {parseResult.valid.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="border border-danger/50 rounded-lg overflow-hidden">
                  <div className="bg-danger/10 px-3 py-2 border-b border-danger/50">
                    <span className="text-sm font-medium text-danger">Errors (rows skipped)</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto p-3 space-y-2">
                    {parseResult.errors.map((err, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-text-muted">Row {err.row}:</span>{' '}
                        <span className="text-danger">{err.errors.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate warnings */}
              {parseResult.duplicateWarnings.length > 0 && (
                <div className="border border-warning/50 rounded-lg overflow-hidden">
                  <div className="bg-warning/10 px-3 py-2 border-b border-warning/50">
                    <span className="text-sm font-medium text-warning">
                      Possible Duplicates (will still import)
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto p-3 space-y-2">
                    {parseResult.duplicateWarnings.map((warn, i) => (
                      <div key={i} className="text-sm text-warning">
                        Row {warn.row}: {warn.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={resetState}>
                Choose Different File
              </Button>
              <Button onClick={handleImport} disabled={!canImport}>
                {hasNewAccounts
                  ? `Create ${parseResult.accountsToCreate.length} Account${parseResult.accountsToCreate.length !== 1 ? 's' : ''} & Import`
                  : `Import ${parseResult.valid.length} Transaction${parseResult.valid.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </>
        )}

        {/* Importing state */}
        {state === 'importing' && (
          <div className="flex flex-col items-center py-8">
            <Spinner />
            <p className="mt-4 text-text-muted">{importProgress || 'Importing...'}</p>
          </div>
        )}

        {/* Success state */}
        {state === 'success' && importSummary && (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="mt-4 text-text-primary font-medium">Import Complete!</p>
            <div className="mt-2 text-sm text-text-secondary space-y-1">
              {importSummary.accountsCreated > 0 && (
                <p>
                  Created {importSummary.accountsCreated} account
                  {importSummary.accountsCreated !== 1 ? 's' : ''}
                </p>
              )}
              {importSummary.checkpointsCreated > 0 && (
                <p>
                  Set {importSummary.checkpointsCreated} initial balance
                  {importSummary.checkpointsCreated !== 1 ? 's' : ''}
                </p>
              )}
              {importSummary.transactionsImported > 0 && (
                <p>
                  Imported {importSummary.transactionsImported} transaction
                  {importSummary.transactionsImported !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="mt-4">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && error && (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <p className="mt-4 text-danger">{error}</p>
            <div className="mt-4">
              <Button variant="secondary" onClick={resetState}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Generic error display for idle state */}
        {state === 'idle' && error && (
          <div className="text-center text-danger text-sm">{error}</div>
        )}
      </div>
    </Modal>
  );
}
