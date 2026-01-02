import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RowActions } from '@/components/table/RowActions';

describe('RowActions', () => {
  it('renders delete button by default', () => {
    render(<RowActions onDelete={vi.fn()} />);
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('does not render delete button when showDelete is false', () => {
    render(<RowActions onDelete={vi.fn()} showDelete={false} />);
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('renders edit button when showEdit is true', () => {
    render(<RowActions onEdit={vi.fn()} showEdit />);
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
  });

  it('renders configure button when showConfigure is true', () => {
    render(<RowActions onConfigure={vi.fn()} showConfigure />);
    expect(screen.getByTitle('Configure recurrence')).toBeInTheDocument();
  });

  it('requires confirmation for delete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RowActions onDelete={onDelete} />);

    // First click - should not delete
    await user.click(screen.getByTitle('Delete'));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument();

    // Second click - should delete
    await user.click(screen.getByTitle('Click again to confirm'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<RowActions onEdit={onEdit} showEdit />);

    await user.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onConfigure when configure button clicked', async () => {
    const user = userEvent.setup();
    const onConfigure = vi.fn();
    render(<RowActions onConfigure={onConfigure} showConfigure />);

    await user.click(screen.getByTitle('Configure recurrence'));
    expect(onConfigure).toHaveBeenCalled();
  });

  it('shows loading state when isDeleting', () => {
    render(<RowActions onDelete={vi.fn()} isDeleting />);
    const button = screen.getByTitle('Delete');
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
