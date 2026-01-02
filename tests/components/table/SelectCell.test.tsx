import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectCell } from '@/components/table/SelectCell';

const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
];

describe('SelectCell', () => {
  it('renders the selected option label', () => {
    render(<SelectCell value="opt2" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('shows placeholder when value is null', () => {
    render(
      <SelectCell
        value={null}
        options={options}
        onChange={vi.fn()}
        placeholder="Select..."
      />
    );
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('enters edit mode on click', async () => {
    const user = userEvent.setup();
    render(<SelectCell value="opt1" options={options} onChange={vi.fn()} />);

    await user.click(screen.getByText('Option 1'));

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectCell value="opt1" options={options} onChange={onChange} />);

    await user.click(screen.getByText('Option 1'));
    await user.selectOptions(screen.getByRole('combobox'), 'opt2');

    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('calls onChange with null when empty option selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectCell
        value="opt1"
        options={options}
        onChange={onChange}
        allowEmpty
        placeholder="None"
      />
    );

    await user.click(screen.getByText('Option 1'));
    await user.selectOptions(screen.getByRole('combobox'), '');

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not show empty option when allowEmpty is false', async () => {
    const user = userEvent.setup();
    render(
      <SelectCell
        value="opt1"
        options={options}
        onChange={vi.fn()}
        allowEmpty={false}
      />
    );

    await user.click(screen.getByText('Option 1'));
    const select = screen.getByRole('combobox');

    expect(select.querySelectorAll('option').length).toBe(3);
  });

  it('exits edit mode on blur', async () => {
    const user = userEvent.setup();
    render(<SelectCell value="opt1" options={options} onChange={vi.fn()} />);

    await user.click(screen.getByText('Option 1'));
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    await user.tab();

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', async () => {
    const user = userEvent.setup();
    render(
      <SelectCell value="opt1" options={options} onChange={vi.fn()} disabled />
    );

    await user.click(screen.getByText('Option 1'));

    // Should not enter edit mode
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
