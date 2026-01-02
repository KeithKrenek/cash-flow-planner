import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CSVImportModal } from '@/components/modals/CSVImportModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DbAccount, DbTransaction } from '@/types';

// Mock hooks
const mockAccounts: DbAccount[] = [
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
];

const mockTransactions: DbTransaction[] = [];

const mockCreateManyMutate = vi.fn();

vi.mock('@/hooks', () => ({
  useAccounts: vi.fn(() => ({
    data: mockAccounts,
    isLoading: false,
  })),
  useTransactions: vi.fn(() => ({
    data: mockTransactions,
    isLoading: false,
  })),
  useCreateManyTransactions: vi.fn(() => ({
    mutateAsync: mockCreateManyMutate,
    isPending: false,
  })),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isLoading: false,
  })),
}));

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Helper to create a File object
function createCSVFile(content: string, name = 'test.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('CSVImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateManyMutate.mockResolvedValue([]);
  });

  it('renders nothing when closed', () => {
    render(
      <CSVImportModal isOpen={false} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('shows file upload zone in idle state', () => {
    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Drag and drop a CSV file/)).toBeInTheDocument();
    expect(screen.getByText('browse')).toBeInTheDocument();
    expect(screen.getByText('Download template')).toBeInTheDocument();
  });

  it('shows available accounts', () => {
    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Available accounts:/)).toBeInTheDocument();
    expect(screen.getByText(/Checking, Savings/)).toBeInTheDocument();
  });

  it('shows message when no accounts exist', async () => {
    const { useAccounts } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useAccounts>);

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(/You need to create at least one account/)
    ).toBeInTheDocument();
  });

  it('shows loading state when data is loading', async () => {
    const { useAccounts } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: [],
      isLoading: true,
    } as ReturnType<typeof useAccounts>);

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // Note: Testing non-CSV file rejection is challenging in jsdom because
  // userEvent.upload bypasses the accept attribute. The validation
  // happens in processFile() which checks file.name.endsWith('.csv').
  // This functionality is tested via manual testing.

  it('parses valid CSV and shows preview', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valid')).toBeInTheDocument();
    });

    expect(screen.getByText('Valid Transactions')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('shows errors for invalid rows', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
invalid-date,Test,abc,NonExistent,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 errors')).toBeInTheDocument();
    });

    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText(/Row 2:/)).toBeInTheDocument();
  });

  it('shows duplicate warnings', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);

    const existingTx: DbTransaction = {
      id: 'tx-1',
      user_id: 'user-1',
      account_id: 'acc-1',
      description: 'Salary',
      amount: 3000,
      category: 'Income',
      date: '2024-01-15',
      is_recurring: false,
      recurrence_rule: null,
      end_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(useTransactions).mockReturnValue({
      data: [existingTx],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 possible duplicates')).toBeInTheDocument();
    });
  });

  it('imports valid transactions', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valid')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Import 1 Transaction/ }));

    await waitFor(() => {
      expect(mockCreateManyMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateManyMutate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          description: 'Salary',
          amount: 3000,
          account_id: 'acc-1',
        }),
      ])
    );
  });

  it('shows success state after import', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valid')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Import 1 Transaction/ }));

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 1 transaction/)).toBeInTheDocument();
    });
  });

  it('shows error state on import failure', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    mockCreateManyMutate.mockRejectedValue(new Error('Database error'));

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valid')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Import 1 Transaction/ }));

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  it('allows choosing a different file after preview', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valid')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Choose Different File' }));

    expect(screen.getByText(/Drag and drop a CSV file/)).toBeInTheDocument();
  });

  it('disables import button when no valid rows', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
invalid-date,Test,abc,NonExistent,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 errors')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Import 0 Transaction/ })).toBeDisabled();
  });

  it('calls onClose when Done is clicked after success', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('1 valid')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Import 1 Transaction/ }));

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('handles multiple transactions', async () => {
    const { useAccounts, useTransactions } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);
    vi.mocked(useTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTransactions>);

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const csv = `date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,3000.00,Checking,Income,false,,
2024-01-20,Groceries,-150.00,Checking,Food & Dining,false,,
2024-01-25,Transfer,500.00,Savings,,false,,`;

    const file = createCSVFile(csv);
    const input = screen.getByTestId('csv-file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('3 valid')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Import 3 Transactions/ })).toBeInTheDocument();
  });

  it('downloads template when link is clicked', async () => {
    const { useAccounts } = await import('@/hooks');
    vi.mocked(useAccounts).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
    } as ReturnType<typeof useAccounts>);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn(() => 'blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const user = userEvent.setup();

    render(
      <CSVImportModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Download template'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});
