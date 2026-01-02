import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableCell } from '@/components/table/EditableCell';

describe('EditableCell', () => {
  it('renders the value in display mode', () => {
    render(<EditableCell value="Test value" onChange={vi.fn()} />);
    expect(screen.getByText('Test value')).toBeInTheDocument();
  });

  it('shows placeholder when value is empty', () => {
    render(<EditableCell value="" onChange={vi.fn()} placeholder="Enter text..." />);
    expect(screen.getByText('Enter text...')).toBeInTheDocument();
  });

  it('enters edit mode on click', async () => {
    const user = userEvent.setup();
    render(<EditableCell value="Test" onChange={vi.fn()} />);

    await user.click(screen.getByText('Test'));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Test');
  });

  it('calls onChange on blur with new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableCell value="Original" onChange={onChange} />);

    await user.click(screen.getByText('Original'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'New value');
    await user.tab(); // Blur

    expect(onChange).toHaveBeenCalledWith('New value');
  });

  it('does not call onChange if value unchanged', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableCell value="Same" onChange={onChange} />);

    await user.click(screen.getByText('Same'));
    await user.tab(); // Blur without changing

    expect(onChange).not.toHaveBeenCalled();
  });

  it('reverts on Escape key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableCell value="Original" onChange={onChange} />);

    await user.click(screen.getByText('Original'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'Changed');
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('commits on Enter key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableCell value="Original" onChange={onChange} />);

    await user.click(screen.getByText('Original'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'New{Enter}');

    expect(onChange).toHaveBeenCalledWith('New');
  });

  it('is disabled when disabled prop is true', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableCell value="Test" onChange={onChange} disabled />);

    await user.click(screen.getByText('Test'));

    // Should not enter edit mode
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
