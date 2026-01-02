import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckpointForm } from '@/components/forms/CheckpointForm';
import type { DbAccount } from '@/types';

const mockAccounts: DbAccount[] = [
  {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'Checking',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'acc-2',
    user_id: 'user-1',
    name: 'Savings',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

describe('CheckpointForm', () => {
  it('renders the form fields', () => {
    render(<CheckpointForm accounts={mockAccounts} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Balance')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders account options', () => {
    render(<CheckpointForm accounts={mockAccounts} onSubmit={vi.fn()} />);

    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CheckpointForm accounts={mockAccounts} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Please select an account')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CheckpointForm accounts={mockAccounts} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Account'), 'acc-1');
    await user.type(screen.getByLabelText('Balance'), '1000.50');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 'acc-1',
          amount: 1000.50,
        })
      );
    });
  });

  it('populates initial data', () => {
    render(
      <CheckpointForm
        accounts={mockAccounts}
        onSubmit={vi.fn()}
        initialData={{
          accountId: 'acc-2',
          amount: '500',
          notes: 'Test note',
        }}
      />
    );

    expect(screen.getByLabelText('Account')).toHaveValue('acc-2');
    expect(screen.getByLabelText('Balance')).toHaveValue('500');
    expect(screen.getByLabelText('Notes (optional)')).toHaveValue('Test note');
  });

  it('disables form when loading', () => {
    render(
      <CheckpointForm
        accounts={mockAccounts}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading
      />
    );

    expect(screen.getByLabelText('Account')).toBeDisabled();
    expect(screen.getByLabelText('Date')).toBeDisabled();
    expect(screen.getByLabelText('Balance')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
