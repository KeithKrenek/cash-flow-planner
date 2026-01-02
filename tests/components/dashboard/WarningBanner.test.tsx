import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WarningBanner } from '@/components/dashboard/WarningBanner';
import type { ProjectionWarning } from '@/types';

const createWarning = (overrides: Partial<ProjectionWarning> = {}): ProjectionWarning => ({
  date: new Date('2024-01-15'),
  accountId: 'acc-1',
  accountName: 'Checking',
  balance: 400,
  threshold: 500,
  ...overrides,
});

describe('WarningBanner', () => {
  it('returns null when there are no warnings', () => {
    const { container } = render(<WarningBanner warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays a single warning', () => {
    const warnings = [createWarning()];

    render(<WarningBanner warnings={warnings} />);

    expect(screen.getByText('Low Balance Warning')).toBeInTheDocument();
    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText(/\$400\.00/)).toBeInTheDocument();
  });

  it('displays multiple warnings for different accounts', () => {
    const warnings = [
      createWarning({ accountId: 'acc-1', accountName: 'Checking', balance: 400 }),
      createWarning({ accountId: 'acc-2', accountName: 'Savings', balance: 200 }),
    ];

    render(<WarningBanner warnings={warnings} />);

    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('groups warnings by account and shows only first occurrence', () => {
    const warnings = [
      createWarning({ accountId: 'acc-1', accountName: 'Checking', balance: 400, date: new Date('2024-01-15') }),
      createWarning({ accountId: 'acc-1', accountName: 'Checking', balance: 300, date: new Date('2024-01-16') }),
      createWarning({ accountId: 'acc-1', accountName: 'Checking', balance: 200, date: new Date('2024-01-17') }),
    ];

    render(<WarningBanner warnings={warnings} />);

    // Should only show one Checking warning (the first one)
    const checkingElements = screen.getAllByText('Checking');
    expect(checkingElements).toHaveLength(1);
  });

  it('limits displayed warnings to maxDisplay', () => {
    const warnings = [
      createWarning({ accountId: 'acc-1', accountName: 'Account 1' }),
      createWarning({ accountId: 'acc-2', accountName: 'Account 2' }),
      createWarning({ accountId: 'acc-3', accountName: 'Account 3' }),
      createWarning({ accountId: 'acc-4', accountName: 'Account 4' }),
      createWarning({ accountId: 'acc-5', accountName: 'Account 5' }),
    ];

    render(<WarningBanner warnings={warnings} maxDisplay={3} />);

    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
    expect(screen.getByText('Account 3')).toBeInTheDocument();
    expect(screen.queryByText('Account 4')).not.toBeInTheDocument();
    expect(screen.getByText('+2 more warnings')).toBeInTheDocument();
  });

  it('shows singular "warning" when only 1 remaining', () => {
    const warnings = [
      createWarning({ accountId: 'acc-1', accountName: 'Account 1' }),
      createWarning({ accountId: 'acc-2', accountName: 'Account 2' }),
    ];

    render(<WarningBanner warnings={warnings} maxDisplay={1} />);

    expect(screen.getByText('+1 more warning')).toBeInTheDocument();
  });

  it('highlights negative balances with danger styling', () => {
    const warnings = [createWarning({ balance: -100 })];

    render(<WarningBanner warnings={warnings} />);

    const balanceText = screen.getByText('-$100.00');
    expect(balanceText).toHaveClass('text-danger');
  });

  it('formats the date correctly', () => {
    // Use a date with time to avoid timezone issues
    const warnings = [createWarning({ date: new Date(2024, 0, 15, 12, 0, 0) })];

    render(<WarningBanner warnings={warnings} />);

    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });
});
