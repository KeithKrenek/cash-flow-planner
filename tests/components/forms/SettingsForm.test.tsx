import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsForm } from '@/components/forms/SettingsForm';

describe('SettingsForm', () => {
  it('renders the form fields', () => {
    render(<SettingsForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Low Balance Warning Threshold')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeInTheDocument();
  });

  it('shows helper text', () => {
    render(<SettingsForm onSubmit={vi.fn()} />);

    expect(
      screen.getByText(/You'll be warned when any account balance falls below/)
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SettingsForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Low Balance Warning Threshold');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates non-negative threshold', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SettingsForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Low Balance Warning Threshold');
    await user.clear(input);
    await user.type(input, '-100');
    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByText('Warning threshold cannot be negative')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SettingsForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Low Balance Warning Threshold');
    await user.clear(input);
    await user.type(input, '1000');
    await user.click(screen.getByRole('button', { name: 'Save Settings' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ warning_threshold: 1000 });
    });
  });

  it('populates initial data', () => {
    render(
      <SettingsForm
        onSubmit={vi.fn()}
        initialData={{ warningThreshold: '750' }}
      />
    );

    expect(screen.getByLabelText('Low Balance Warning Threshold')).toHaveValue('750');
  });

  it('shows cancel button when onCancel is provided', () => {
    render(<SettingsForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('disables form when loading', () => {
    render(
      <SettingsForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading
      />
    );

    expect(screen.getByLabelText('Low Balance Warning Threshold')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
