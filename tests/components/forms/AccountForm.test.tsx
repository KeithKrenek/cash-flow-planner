import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountForm } from '@/components/forms/AccountForm';

describe('AccountForm', () => {
  it('renders the form fields', () => {
    render(<AccountForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Account Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('displays custom submit label', () => {
    render(<AccountForm onSubmit={vi.fn()} submitLabel="Add Account" />);

    expect(screen.getByRole('button', { name: 'Add Account' })).toBeInTheDocument();
  });

  it('shows cancel button when onCancel is provided', () => {
    render(<AccountForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<AccountForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AccountForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Account name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AccountForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Account Name'), 'Chase Checking');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Chase Checking' });
    });
  });

  it('populates initial data', () => {
    render(
      <AccountForm
        onSubmit={vi.fn()}
        initialData={{ name: 'Existing Account' }}
      />
    );

    expect(screen.getByLabelText('Account Name')).toHaveValue('Existing Account');
  });

  it('disables form when loading', () => {
    render(<AccountForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading />);

    expect(screen.getByLabelText('Account Name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
