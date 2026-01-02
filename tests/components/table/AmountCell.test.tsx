import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmountCell } from '@/components/table/AmountCell';

describe('AmountCell', () => {
  it('renders formatted currency', () => {
    render(<AmountCell value={1234.56} onChange={vi.fn()} />);
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('shows positive amounts with success color', () => {
    render(<AmountCell value={100} onChange={vi.fn()} />);
    expect(screen.getByText('$100.00')).toHaveClass('text-success');
  });

  it('shows negative amounts with danger color', () => {
    render(<AmountCell value={-100} onChange={vi.fn()} />);
    expect(screen.getByText('-$100.00')).toHaveClass('text-danger');
  });

  it('enters edit mode on click', async () => {
    const user = userEvent.setup();
    render(<AmountCell value={100} onChange={vi.fn()} />);

    await user.click(screen.getByText('$100.00'));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('100');
  });

  it('calls onChange with parsed number on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountCell value={100} onChange={onChange} />);

    await user.click(screen.getByText('$100.00'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, '250.50');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(250.50);
  });

  it('handles negative input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountCell value={100} onChange={onChange} />);

    await user.click(screen.getByText('$100.00'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, '-50');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(-50);
  });

  it('handles currency symbols and commas in input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountCell value={100} onChange={onChange} />);

    await user.click(screen.getByText('$100.00'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, '$1,234.56');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(1234.56);
  });

  it('reverts on invalid input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountCell value={100} onChange={onChange} />);

    await user.click(screen.getByText('$100.00'));
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'not a number');
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('reverts on Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountCell value={100} onChange={onChange} />);

    await user.click(screen.getByText('$100.00'));
    await user.keyboard('999{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
});
