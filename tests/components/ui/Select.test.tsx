import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/Select';

const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders all options', () => {
    render(<Select options={options} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select label="Choose an option" options={options} />);

    expect(screen.getByLabelText('Choose an option')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Select options={options} placeholder="Select..." />);

    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select options={options} error="This field is required" />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text', () => {
    render(<Select options={options} helperText="Choose one option" />);

    expect(screen.getByText('Choose one option')).toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    render(
      <Select
        options={options}
        helperText="Choose one option"
        error="This field is required"
      />
    );

    expect(screen.queryByText('Choose one option')).not.toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('handles selection change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select
        options={options}
        value="opt1"
        onChange={onChange}
      />
    );

    await user.selectOptions(screen.getByRole('combobox'), 'opt2');

    expect(onChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Select options={options} disabled />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Select options={options} className="custom-class" />);

    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });
});
