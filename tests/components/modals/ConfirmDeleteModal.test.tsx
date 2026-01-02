import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDeleteModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('shows default message', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Are you sure you want to delete this item/)
    ).toBeInTheDocument();
  });

  it('shows custom message', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        message="This will delete everything!"
      />
    );

    expect(screen.getByText('This will delete everything!')).toBeInTheDocument();
  });

  it('shows item name in message', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        itemName="My Account"
      />
    );

    expect(
      screen.getByText(/Are you sure you want to delete "My Account"/)
    ).toBeInTheDocument();
  });

  it('shows custom title', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Account"
      />
    );

    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm and onClose when delete is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('disables buttons when loading', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isLoading
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('handles async onConfirm', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
