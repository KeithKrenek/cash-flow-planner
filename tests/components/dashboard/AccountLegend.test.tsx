import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountLegend } from '@/components/dashboard/AccountLegend';
import type { DbAccount } from '@/types';

const createAccount = (overrides: Partial<DbAccount> = {}): DbAccount => ({
  id: 'account-1',
  user_id: 'user-1',
  name: 'Checking',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('AccountLegend', () => {
  it('renders account names and balances', () => {
    const accounts = [
      createAccount({ id: 'acc-1', name: 'Checking' }),
      createAccount({ id: 'acc-2', name: 'Savings' }),
    ];

    render(
      <AccountLegend
        accounts={accounts}
        balances={{ 'acc-1': 1000, 'acc-2': 5000 }}
        total={6000}
      />
    );

    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('shows total when there are multiple accounts', () => {
    const accounts = [
      createAccount({ id: 'acc-1', name: 'Checking' }),
      createAccount({ id: 'acc-2', name: 'Savings' }),
    ];

    render(
      <AccountLegend
        accounts={accounts}
        balances={{ 'acc-1': 1000, 'acc-2': 5000 }}
        total={6000}
        showTotal={true}
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$6,000.00')).toBeInTheDocument();
  });

  it('hides total when showTotal is false', () => {
    const accounts = [
      createAccount({ id: 'acc-1', name: 'Checking' }),
      createAccount({ id: 'acc-2', name: 'Savings' }),
    ];

    render(
      <AccountLegend
        accounts={accounts}
        balances={{ 'acc-1': 1000, 'acc-2': 5000 }}
        total={6000}
        showTotal={false}
      />
    );

    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });

  it('hides total when there is only one account', () => {
    const accounts = [createAccount({ id: 'acc-1', name: 'Checking' })];

    render(
      <AccountLegend
        accounts={accounts}
        balances={{ 'acc-1': 1000 }}
        total={1000}
        showTotal={true}
      />
    );

    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });

  it('handles missing balance for an account', () => {
    const accounts = [createAccount({ id: 'acc-1', name: 'Checking' })];

    render(
      <AccountLegend
        accounts={accounts}
        balances={{}} // Empty balances
        total={0}
      />
    );

    // Should show $0.00 for the account
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('formats negative balances correctly', () => {
    const accounts = [createAccount({ id: 'acc-1', name: 'Checking' })];

    render(
      <AccountLegend
        accounts={accounts}
        balances={{ 'acc-1': -500 }}
        total={-500}
      />
    );

    expect(screen.getByText('-$500.00')).toBeInTheDocument();
  });
});
