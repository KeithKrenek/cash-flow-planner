import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeRangeSelector } from '@/components/dashboard/TimeRangeSelector';
import { TIME_RANGE_OPTIONS } from '@/lib/constants';

describe('TimeRangeSelector', () => {
  it('renders all time range options', () => {
    render(<TimeRangeSelector value={30} onChange={vi.fn()} />);

    TIME_RANGE_OPTIONS.forEach((option) => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('highlights the selected option', () => {
    render(<TimeRangeSelector value={90} onChange={vi.fn()} />);

    const selectedButton = screen.getByText('90 days');
    expect(selectedButton).toHaveClass('bg-accent');
    expect(selectedButton).toHaveClass('text-white');
  });

  it('calls onChange when an option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector value={30} onChange={onChange} />);

    await user.click(screen.getByText('90 days'));

    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('does not have accent styling on non-selected options', () => {
    render(<TimeRangeSelector value={30} onChange={vi.fn()} />);

    const unselectedButton = screen.getByText('90 days');
    expect(unselectedButton).not.toHaveClass('bg-accent');
  });
});
