import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurrenceModal } from '@/components/modals/RecurrenceModal';

describe('RecurrenceModal', () => {
  it('renders nothing when closed', () => {
    render(
      <RecurrenceModal
        isOpen={false}
        onClose={vi.fn()}
        value={null}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <RecurrenceModal
        isOpen={true}
        onClose={vi.fn()}
        value={null}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Configure Recurrence')).toBeInTheDocument();
  });

  it('shows recurrence form', () => {
    render(
      <RecurrenceModal
        isOpen={true}
        onClose={vi.fn()}
        value={null}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <RecurrenceModal
        isOpen={true}
        onClose={onClose}
        value={null}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with rule when save is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <RecurrenceModal
        isOpen={true}
        onClose={onClose}
        value={{ frequency: 'weekly' }}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'weekly' })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('initializes with provided value', () => {
    render(
      <RecurrenceModal
        isOpen={true}
        onClose={vi.fn()}
        value={{ frequency: 'monthly', daysOfMonth: [15] }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Frequency')).toHaveValue('monthly');
  });

  it('shows error for invalid monthly configuration', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <RecurrenceModal
        isOpen={true}
        onClose={vi.fn()}
        value={null}
        onSave={onSave}
      />
    );

    // Select monthly but don't configure it properly
    await user.selectOptions(screen.getByLabelText('Frequency'), 'monthly');

    // Clear the days input to make it invalid
    const daysInput = screen.getByPlaceholderText('e.g., 1, 15, 30');
    await user.clear(daysInput);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/Monthly recurrence requires/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
