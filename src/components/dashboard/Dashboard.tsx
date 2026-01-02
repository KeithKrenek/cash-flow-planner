import { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  useProjection,
  useSettings,
  useAccounts,
  useTransactions,
  useCheckpoints,
  useUpdateTransaction,
  useUpdateCheckpoint,
  useDeleteTransaction,
  useDeleteCheckpoint,
} from '@/hooks';
import { DEFAULT_TIME_RANGE, DEFAULT_WARNING_THRESHOLD } from '@/lib/constants';
import type { TimeRangeDays, TableEntry, DbTransaction, DbBalanceCheckpoint } from '@/types';
import { CashFlowChart } from './CashFlowChart';
import { TimeRangeSelector } from './TimeRangeSelector';
import { AccountLegend } from './AccountLegend';
import { WarningBanner } from './WarningBanner';
import { Spinner, Button } from '@/components/ui';
import { DataTable } from '@/components/table';
import {
  AddAccountModal,
  AddCheckpointModal,
  AddTransactionModal,
  CSVImportModal,
  ConfirmDeleteModal,
} from '@/components/modals';

type ModalType = 'account' | 'checkpoint' | 'transaction' | 'csv' | 'delete' | null;

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRangeDays>(DEFAULT_TIME_RANGE);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [entryToDelete, setEntryToDelete] = useState<TableEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: settings } = useSettings();
  const warningThreshold = settings?.warning_threshold ?? DEFAULT_WARNING_THRESHOLD;

  // Data fetching for table
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: checkpoints = [], isLoading: checkpointsLoading } = useCheckpoints();

  // Mutations for table
  const updateTransaction = useUpdateTransaction();
  const updateCheckpoint = useUpdateCheckpoint();
  const deleteTransaction = useDeleteTransaction();
  const deleteCheckpoint = useDeleteCheckpoint();

  const {
    projection,
    summary,
    isLoading: projectionLoading,
    isInitialLoading,
    error,
  } = useProjection({
    days: timeRange,
    enabled: true,
  });

  const isLoading = projectionLoading || accountsLoading || transactionsLoading || checkpointsLoading;

  // Build account lookup map
  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  // Transform database records to TableEntry format
  const tableData = useMemo<TableEntry[]>(() => {
    const entries: TableEntry[] = [];

    // Add checkpoints
    checkpoints.forEach((checkpoint) => {
      entries.push({
        id: checkpoint.id,
        type: 'checkpoint',
        accountId: checkpoint.account_id,
        accountName: accountMap.get(checkpoint.account_id) ?? 'Unknown',
        date: new Date(checkpoint.date),
        description: checkpoint.notes || 'Balance Checkpoint',
        amount: checkpoint.amount,
        category: null,
        isRecurring: false,
        recurrenceRule: null,
        endDate: null,
        originalRecord: checkpoint,
        originalType: 'checkpoint',
      });
    });

    // Add transactions
    transactions.forEach((transaction) => {
      entries.push({
        id: transaction.id,
        type: transaction.is_recurring ? 'recurring' : 'transaction',
        accountId: transaction.account_id,
        accountName: accountMap.get(transaction.account_id) ?? 'Unknown',
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        isRecurring: transaction.is_recurring,
        recurrenceRule: transaction.recurrence_rule,
        endDate: transaction.end_date ? new Date(transaction.end_date) : null,
        originalRecord: transaction,
        originalType: 'transaction',
      });
    });

    return entries;
  }, [checkpoints, transactions, accountMap]);

  // Handle entry updates
  const handleUpdateEntry = useCallback(
    async (entry: TableEntry, updates: Partial<TableEntry>) => {
      try {
        if (entry.originalType === 'checkpoint') {
          const checkpointUpdates: Partial<DbBalanceCheckpoint> = {};

          if (updates.date !== undefined) {
            checkpointUpdates.date = updates.date.toISOString().split('T')[0];
          }
          if (updates.description !== undefined) {
            checkpointUpdates.notes = updates.description;
          }
          if (updates.amount !== undefined) {
            checkpointUpdates.amount = updates.amount;
          }
          if (updates.accountId !== undefined) {
            checkpointUpdates.account_id = updates.accountId;
          }

          if (Object.keys(checkpointUpdates).length > 0) {
            await updateCheckpoint.mutateAsync({
              id: entry.id,
              updates: checkpointUpdates,
            });
          }
        } else {
          const transactionUpdates: Partial<DbTransaction> = {};

          if (updates.date !== undefined) {
            transactionUpdates.date = updates.date.toISOString().split('T')[0];
          }
          if (updates.description !== undefined) {
            transactionUpdates.description = updates.description;
          }
          if (updates.amount !== undefined) {
            transactionUpdates.amount = updates.amount;
          }
          if (updates.accountId !== undefined) {
            transactionUpdates.account_id = updates.accountId;
          }
          if (updates.category !== undefined) {
            transactionUpdates.category = updates.category;
          }

          if (Object.keys(transactionUpdates).length > 0) {
            await updateTransaction.mutateAsync({
              id: entry.id,
              updates: transactionUpdates,
            });
          }
        }
      } catch (error) {
        toast.error('Failed to update entry');
        console.error('Update error:', error);
      }
    },
    [updateCheckpoint, updateTransaction]
  );

  // Handle delete request (open confirmation modal)
  const handleDeleteRequest = useCallback((entry: TableEntry) => {
    setEntryToDelete(entry);
    setActiveModal('delete');
  }, []);

  // Handle confirmed delete
  const handleConfirmDelete = useCallback(async () => {
    if (!entryToDelete) return;

    setDeletingId(entryToDelete.id);
    try {
      if (entryToDelete.originalType === 'checkpoint') {
        await deleteCheckpoint.mutateAsync(entryToDelete.id);
        toast.success('Checkpoint deleted');
      } else {
        await deleteTransaction.mutateAsync(entryToDelete.id);
        toast.success('Transaction deleted');
      }
    } catch (error) {
      toast.error('Failed to delete entry');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
      setEntryToDelete(null);
      setActiveModal(null);
    }
  }, [entryToDelete, deleteCheckpoint, deleteTransaction]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center text-danger">
          <p className="font-medium">Failed to load projection data</p>
          <p className="text-sm text-text-secondary mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  const hasAccounts = projection && projection.accounts.length > 0;
  const currentBalances =
    projection?.dataPoints[0]?.balances ?? {};
  const currentTotal = projection?.dataPoints[0]?.total ?? 0;

  const closeModal = () => {
    setActiveModal(null);
    setEntryToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {projection && projection.warnings.length > 0 && (
        <WarningBanner warnings={projection.warnings} />
      )}

      {/* Chart Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Cash Flow Projection
          </h2>
          <div className="flex items-center gap-2">
            {hasAccounts && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModal('checkpoint')}
                >
                  Add Checkpoint
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModal('account')}
                >
                  Add Account
                </Button>
              </>
            )}
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {!hasAccounts ? (
          <EmptyState onAddAccount={() => setActiveModal('account')} />
        ) : (
          <>
            {/* Legend with current balances */}
            <div className="mb-6">
              <AccountLegend
                accounts={projection.accounts}
                balances={currentBalances}
                total={currentTotal}
              />
            </div>

            {/* Chart */}
            <div className={isLoading ? 'opacity-50' : ''}>
              <CashFlowChart
                data={projection.dataPoints}
                accounts={projection.accounts}
                warningThreshold={warningThreshold}
              />
            </div>
          </>
        )}
      </div>

      {/* Summary Cards */}
      {hasAccounts && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Current Balance"
            value={summary.startingTotal}
            type="neutral"
          />
          <SummaryCard
            label="Lowest Point"
            value={summary.lowestTotal}
            type={summary.lowestTotal < warningThreshold ? 'warning' : 'neutral'}
            subtext={
              summary.lowestTotalDate
                ? `on ${summary.lowestTotalDate.toLocaleDateString()}`
                : undefined
            }
          />
          <SummaryCard
            label="End Balance"
            value={summary.endingTotal}
            type={
              summary.endingTotal < 0
                ? 'danger'
                : summary.endingTotal < warningThreshold
                ? 'warning'
                : 'success'
            }
          />
        </div>
      )}

      {/* Transactions Table */}
      {hasAccounts && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Transactions
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Edit dates to see real-time updates in the chart above
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveModal('csv')}
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Import CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveModal('checkpoint')}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Add Checkpoint
              </Button>
              <Button size="sm" onClick={() => setActiveModal('transaction')}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Transaction
              </Button>
            </div>
          </div>

          <DataTable
            data={tableData}
            accounts={accounts}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteRequest}
            isDeleting={deletingId}
          />
        </div>
      )}

      {/* Modals */}
      <AddAccountModal isOpen={activeModal === 'account'} onClose={closeModal} />
      <AddCheckpointModal isOpen={activeModal === 'checkpoint'} onClose={closeModal} />
      <AddTransactionModal
        isOpen={activeModal === 'transaction'}
        onClose={closeModal}
      />
      <CSVImportModal isOpen={activeModal === 'csv'} onClose={closeModal} />
      <ConfirmDeleteModal
        isOpen={activeModal === 'delete'}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title={`Delete ${entryToDelete?.originalType === 'checkpoint' ? 'Checkpoint' : 'Transaction'}`}
        message={
          entryToDelete
            ? `Are you sure you want to delete "${entryToDelete.description}"? This action cannot be undone.`
            : ''
        }
        isLoading={deletingId !== null}
      />
    </div>
  );
}

interface EmptyStateProps {
  onAddAccount: () => void;
}

function EmptyState({ onAddAccount }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-text-primary">No accounts yet</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Create an account and add a balance checkpoint to get started.
      </p>
      <div className="mt-6">
        <Button onClick={onAddAccount}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Your First Account
        </Button>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  type: 'neutral' | 'success' | 'warning' | 'danger';
  subtext?: string;
}

function SummaryCard({ label, value, type, subtext }: SummaryCardProps) {
  const typeClasses = {
    neutral: 'text-text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <div className="card p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`text-2xl font-semibold font-tabular mt-1 ${typeClasses[type]}`}>
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value)}
      </p>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </div>
  );
}
