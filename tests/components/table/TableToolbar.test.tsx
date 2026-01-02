import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableToolbar, type TableFilters } from '@/components/table/TableToolbar';

const defaultFilters: TableFilters = {
  search: '',
  type: 'all',
  account: 'all',
  category: 'all',
};

const accounts = [
  { id: 'acc-1', name: 'Checking' },
  { id: 'acc-2', name: 'Savings' },
];

describe('TableToolbar', () => {
  it('renders search input', () => {
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={vi.fn()}
        accounts={accounts}
      />
    );
    expect(screen.getByPlaceholderText('Search descriptions...')).toBeInTheDocument();
  });

  it('renders type filter with all options', () => {
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={vi.fn()}
        accounts={accounts}
      />
    );
    const typeSelect = screen.getByDisplayValue('All types');
    expect(typeSelect).toBeInTheDocument();
  });

  it('renders account filter with provided accounts', () => {
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={vi.fn()}
        accounts={accounts}
      />
    );
    const accountSelect = screen.getByDisplayValue('All accounts');
    expect(accountSelect).toBeInTheDocument();
  });

  it('calls onFiltersChange when search changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        accounts={accounts}
      />
    );

    await user.type(screen.getByPlaceholderText('Search descriptions...'), 'test');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 't',
    });
  });

  it('calls onFiltersChange when type filter changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        accounts={accounts}
      />
    );

    await user.selectOptions(screen.getByDisplayValue('All types'), 'recurring');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      type: 'recurring',
    });
  });

  it('calls onFiltersChange when account filter changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        accounts={accounts}
      />
    );

    await user.selectOptions(screen.getByDisplayValue('All accounts'), 'acc-1');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      account: 'acc-1',
    });
  });

  it('shows clear filters button when filters are active', () => {
    const activeFilters: TableFilters = {
      ...defaultFilters,
      search: 'test',
    };
    render(
      <TableToolbar
        filters={activeFilters}
        onFiltersChange={vi.fn()}
        accounts={accounts}
      />
    );
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('does not show clear filters button when no filters active', () => {
    render(
      <TableToolbar
        filters={defaultFilters}
        onFiltersChange={vi.fn()}
        accounts={accounts}
      />
    );
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button clicked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const activeFilters: TableFilters = {
      search: 'test',
      type: 'recurring',
      account: 'acc-1',
      category: 'Income',
    };
    render(
      <TableToolbar
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
        accounts={accounts}
      />
    );

    await user.click(screen.getByText('Clear filters'));

    expect(onFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('shows clear search button when search has value', async () => {
    const user = userEvent.setup();
    render(
      <TableToolbar
        filters={{ ...defaultFilters, search: 'test' }}
        onFiltersChange={vi.fn()}
        accounts={accounts}
      />
    );

    // There should be a clear button in the search input
    const clearButtons = screen.getAllByRole('button');
    const searchClearButton = clearButtons.find(
      (btn) => btn.closest('.relative')?.querySelector('input')
    );
    expect(searchClearButton).toBeInTheDocument();
  });
});
