import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecurrenceBadge } from '@/components/table/RecurrenceBadge';

describe('RecurrenceBadge', () => {
  it('returns null when rule is null', () => {
    const { container } = render(<RecurrenceBadge rule={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders daily recurrence', () => {
    render(<RecurrenceBadge rule={{ frequency: 'daily' }} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('renders weekly recurrence', () => {
    render(<RecurrenceBadge rule={{ frequency: 'weekly' }} />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('renders biweekly recurrence', () => {
    render(<RecurrenceBadge rule={{ frequency: 'biweekly' }} />);
    expect(screen.getByText('Bi-weekly')).toBeInTheDocument();
  });

  it('renders monthly recurrence', () => {
    render(<RecurrenceBadge rule={{ frequency: 'monthly', daysOfMonth: [15] }} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('renders yearly recurrence', () => {
    render(<RecurrenceBadge rule={{ frequency: 'yearly' }} />);
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('shows recurrence icon', () => {
    render(<RecurrenceBadge rule={{ frequency: 'daily' }} />);
    expect(screen.getByText('↻')).toBeInTheDocument();
  });

  it('has success styling', () => {
    render(<RecurrenceBadge rule={{ frequency: 'daily' }} />);
    const badge = screen.getByText('Daily').closest('span');
    expect(badge).toHaveClass('bg-success/10');
    expect(badge).toHaveClass('text-success');
  });

  it('shows indicator when end date is set', () => {
    render(
      <RecurrenceBadge
        rule={{ frequency: 'daily' }}
        endDate={new Date('2024-12-31')}
      />
    );
    expect(screen.getByText('•')).toBeInTheDocument();
  });

  it('includes end date in title when set', () => {
    render(
      <RecurrenceBadge
        rule={{ frequency: 'daily' }}
        endDate={new Date(2024, 11, 31)}
      />
    );
    const badge = screen.getByText('Daily').closest('span');
    expect(badge).toHaveAttribute('title', expect.stringContaining('ends'));
  });
});
