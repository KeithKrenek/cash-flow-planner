import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurrenceForm } from '@/components/forms/RecurrenceForm';

describe('RecurrenceForm', () => {
  it('renders frequency selector', () => {
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
  });

  it('shows all frequency options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    const select = screen.getByLabelText('Frequency');
    await user.click(select);

    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Bi-weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('shows interval input for daily frequency', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Frequency'), 'daily');

    expect(screen.getByLabelText(/Every how many days/)).toBeInTheDocument();
  });

  it('hides interval input for biweekly frequency', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Frequency'), 'biweekly');

    expect(screen.queryByLabelText(/Every how many/)).not.toBeInTheDocument();
  });

  it('shows monthly options when monthly is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Frequency'), 'monthly');

    expect(screen.getByText('Day(s) of month')).toBeInTheDocument();
    expect(screen.getByText('Specific weekday')).toBeInTheDocument();
    expect(screen.getByText('Last day of month')).toBeInTheDocument();
  });

  it('shows day input when days of month is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Frequency'), 'monthly');

    // Days of month is selected by default
    expect(screen.getByPlaceholderText('e.g., 1, 15, 30')).toBeInTheDocument();
  });

  it('shows weekday selectors when nth weekday is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Frequency'), 'monthly');
    await user.click(screen.getByText('Specific weekday'));

    expect(screen.getByText('1st')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
  });

  it('calls onChange when frequency changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Frequency'), 'weekly');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'weekly' })
    );
  });

  it('initializes with provided value', () => {
    const onChange = vi.fn();
    render(
      <RecurrenceForm
        value={{ frequency: 'weekly', interval: 2 }}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText('Frequency')).toHaveValue('weekly');
    expect(screen.getByLabelText(/Every how many weeks/)).toHaveValue(2);
  });

  it('is disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<RecurrenceForm value={null} onChange={onChange} disabled />);

    expect(screen.getByLabelText('Frequency')).toBeDisabled();
  });
});
