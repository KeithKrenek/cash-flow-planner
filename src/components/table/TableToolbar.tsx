import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import type { TableEntryType } from '@/types';

export interface TableFilters {
  search: string;
  type: TableEntryType | 'all';
  account: string | 'all';
  category: string | 'all';
}

export interface TableToolbarProps {
  filters: TableFilters;
  onFiltersChange: (filters: TableFilters) => void;
  accounts: Array<{ id: string; name: string }>;
  className?: string;
}

export function TableToolbar({
  filters,
  onFiltersChange,
  accounts,
  className,
}: TableToolbarProps) {
  const updateFilter = <K extends keyof TableFilters>(
    key: K,
    value: TableFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search descriptions..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-surface border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
            placeholder:text-text-muted"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Type Filter */}
      <select
        value={filters.type}
        onChange={(e) => updateFilter('type', e.target.value as TableFilters['type'])}
        className="px-3 py-2 text-sm bg-surface border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      >
        <option value="all">All types</option>
        <option value="checkpoint">Checkpoints</option>
        <option value="transaction">One-time</option>
        <option value="recurring">Recurring</option>
      </select>

      {/* Account Filter */}
      <select
        value={filters.account}
        onChange={(e) => updateFilter('account', e.target.value)}
        className="px-3 py-2 text-sm bg-surface border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      >
        <option value="all">All accounts</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>

      {/* Category Filter */}
      <select
        value={filters.category}
        onChange={(e) => updateFilter('category', e.target.value)}
        className="px-3 py-2 text-sm bg-surface border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      >
        <option value="all">All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {(filters.search || filters.type !== 'all' || filters.account !== 'all' || filters.category !== 'all') && (
        <button
          onClick={() =>
            onFiltersChange({
              search: '',
              type: 'all',
              account: 'all',
              category: 'all',
            })
          }
          className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary
            hover:bg-surface-hover rounded-lg transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
