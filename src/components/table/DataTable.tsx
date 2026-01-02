import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import type { TableEntry, DbAccount } from '@/types';
import { TypeBadge } from './TypeBadge';
import { RecurrenceBadge } from './RecurrenceBadge';
import { RowActions } from './RowActions';
import { DateCell } from './DateCell';
import { AmountCell } from './AmountCell';
import { EditableCell } from './EditableCell';
import { SelectCell } from './SelectCell';
import { TableToolbar, type TableFilters } from './TableToolbar';

export interface DataTableProps {
  data: TableEntry[];
  accounts: DbAccount[];
  onUpdateEntry: (entry: TableEntry, updates: Partial<TableEntry>) => void;
  onDeleteEntry: (entry: TableEntry) => void;
  isDeleting?: string | null;
  className?: string;
}

export function DataTable({
  data,
  accounts,
  onUpdateEntry,
  onDeleteEntry,
  isDeleting,
  className,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);

  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    type: 'all',
    account: 'all',
    category: 'all',
  });

  // Category options for SelectCell
  const categoryOptions = useMemo(
    () => CATEGORIES.map((cat) => ({ value: cat, label: cat })),
    []
  );

  // Account options for SelectCell
  const accountOptions = useMemo(
    () => accounts.map((acc) => ({ value: acc.id, label: acc.name })),
    [accounts]
  );

  // Filter data based on toolbar filters
  const filteredData = useMemo(() => {
    return data.filter((entry) => {
      // Search filter
      if (
        filters.search &&
        !entry.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && entry.type !== filters.type) {
        return false;
      }

      // Account filter
      if (filters.account !== 'all' && entry.accountId !== filters.account) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && entry.category !== filters.category) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  const columns = useMemo<ColumnDef<TableEntry>[]>(
    () => [
      {
        id: 'type',
        header: '',
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        size: 50,
        enableSorting: false,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <DateCell
            value={row.original.date}
            onChange={(date) => onUpdateEntry(row.original, { date })}
            disabled={row.original.type === 'recurring'}
          />
        ),
        sortingFn: (rowA, rowB) =>
          rowA.original.date.getTime() - rowB.original.date.getTime(),
        size: 130,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <EditableCell
            value={row.original.description}
            onChange={(description) =>
              onUpdateEntry(row.original, { description })
            }
            placeholder="Enter description..."
          />
        ),
        size: 250,
      },
      {
        accessorKey: 'accountName',
        header: 'Account',
        cell: ({ row }) => (
          <SelectCell
            value={row.original.accountId}
            options={accountOptions}
            onChange={(accountId) => {
              if (accountId) {
                const account = accounts.find((a) => a.id === accountId);
                onUpdateEntry(row.original, {
                  accountId,
                  accountName: account?.name ?? '',
                });
              }
            }}
            allowEmpty={false}
          />
        ),
        size: 150,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          if (row.original.type === 'checkpoint') {
            return <span className="text-text-muted text-sm">—</span>;
          }
          return (
            <SelectCell
              value={row.original.category}
              options={categoryOptions}
              onChange={(category) => onUpdateEntry(row.original, { category })}
              placeholder="Select..."
            />
          );
        },
        size: 150,
      },
      {
        accessorKey: 'amount',
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <AmountCell
            value={row.original.amount}
            onChange={(amount) => onUpdateEntry(row.original, { amount })}
          />
        ),
        size: 120,
      },
      {
        id: 'recurrence',
        header: 'Recurrence',
        cell: ({ row }) => {
          if (!row.original.isRecurring) {
            return null;
          }
          return (
            <RecurrenceBadge
              rule={row.original.recurrenceRule}
              endDate={row.original.endDate}
            />
          );
        },
        size: 120,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            onDelete={() => onDeleteEntry(row.original)}
            isDeleting={isDeleting === row.original.id}
            showConfigure={row.original.isRecurring}
          />
        ),
        size: 60,
        enableSorting: false,
      },
    ],
    [accounts, accountOptions, categoryOptions, onUpdateEntry, onDeleteEntry, isDeleting]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className={cn('space-y-4', className)}>
      <TableToolbar
        filters={filters}
        onFiltersChange={setFilters}
        accounts={accounts}
      />

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left text-sm font-medium text-text-secondary',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-text-primary'
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted() && (
                          <span className="text-accent">
                            {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-text-muted"
                  >
                    {data.length === 0
                      ? 'No entries yet. Add a checkpoint or transaction to get started.'
                      : 'No entries match your filters.'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="text-sm text-text-muted">
          Showing {filteredData.length} of {data.length} entries
        </div>
      )}
    </div>
  );
}
