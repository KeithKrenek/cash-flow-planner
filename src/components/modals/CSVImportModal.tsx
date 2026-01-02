import { useState, useRef, useCallback } from 'react';
import { Modal, Button, Spinner, Badge } from '@/components/ui';
import {
  useAccounts,
  useTransactions,
  useCreateManyTransactions,
} from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import {
  parseCSV,
  generateCSVTemplate,
  validateFileSize,
  readFileAsText,
} from '@/lib/csv-parser';
import { MAX_CSV_FILE_SIZE } from '@/lib/constants';
import type { CSVParseResult } from '@/types';

export interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'success' | 'error';

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: existingTransactions = [], isLoading: transactionsLoading } = useTransactions();
  const createManyTransactions = useCreateManyTransactions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>('idle');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const resetState = useCallback(() => {
    setState('idle');
    setParseResult(null);
    setError(null);
    setIsDragOver(false);
    setImportCount(0);
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
      const result = parseCSV(text, accounts, user.id, existingTransactions);
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
    const template = generateCSVTemplate();
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
    if (!parseResult || parseResult.valid.length === 0) return;

    setState('importing');

    try {
      // Convert to TransactionInsert format (they're already validated)
      const transactionsToInsert = parseResult.valid.map((tx) => ({
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

      await createManyTransactions.mutateAsync(transactionsToInsert);
      setImportCount(transactionsToInsert.length);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import transactions');
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

  // Render no accounts state
  if (accounts.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Import CSV" size="lg">
        <p className="text-text-muted text-center py-4">
          You need to create at least one account before importing transactions.
        </p>
      </Modal>
    );
  }

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
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-sm text-accent hover:underline"
                onClick={handleDownloadTemplate}
              >
                Download template
              </button>

              <div className="text-sm text-text-muted">
                Available accounts: {accounts.map((a) => a.name).join(', ')}
              </div>
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
              {/* Summary */}
              <div className="flex gap-4 text-sm">
                <Badge variant="success">{parseResult.valid.length} valid</Badge>
                {parseResult.errors.length > 0 && (
                  <Badge variant="danger">{parseResult.errors.length} errors</Badge>
                )}
                {parseResult.duplicateWarnings.length > 0 && (
                  <Badge variant="warning">
                    {parseResult.duplicateWarnings.length} possible duplicates
                  </Badge>
                )}
              </div>

              {/* Valid transactions preview */}
              {parseResult.valid.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-surface-secondary px-3 py-2 border-b border-border">
                    <span className="text-sm font-medium text-text-primary">
                      Valid Transactions
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
                    <span className="text-sm font-medium text-danger">Errors</span>
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
              <Button
                onClick={handleImport}
                disabled={parseResult.valid.length === 0}
              >
                Import {parseResult.valid.length} Transaction
                {parseResult.valid.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}

        {/* Importing state */}
        {state === 'importing' && (
          <div className="flex flex-col items-center py-8">
            <Spinner />
            <p className="mt-4 text-text-muted">Importing transactions...</p>
          </div>
        )}

        {/* Success state */}
        {state === 'success' && (
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
            <p className="mt-4 text-text-primary">
              Successfully imported {importCount} transaction
              {importCount !== 1 ? 's' : ''}!
            </p>
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
