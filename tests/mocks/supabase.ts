import { vi } from 'vitest';

/**
 * Creates a mock Supabase query builder chain.
 * Each method returns 'this' to allow chaining, with the final method
 * returning a Promise with { data, error }.
 */
export function createMockQueryBuilder<T>(result: {
  data: T | null;
  error: { code: string; message: string; details?: string } | null;
}) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    // Make non-terminal methods also resolve for tests that don't call single()
    then: vi.fn((resolve) => resolve(result)),
  };

  // Make the builder itself thenable for awaiting without .single()
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: typeof result) => void) => {
      Promise.resolve(result).then(resolve);
    },
  });

  return builder;
}

/**
 * Creates a mock Supabase client.
 */
export function createMockSupabase() {
  return {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  };
}

/**
 * Sample mock data for tests.
 */
export const mockData = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
  },

  accounts: [
    {
      id: 'account-1',
      user_id: 'user-123',
      name: 'Checking',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'account-2',
      user_id: 'user-123',
      name: 'Savings',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],

  checkpoints: [
    {
      id: 'checkpoint-1',
      user_id: 'user-123',
      account_id: 'account-1',
      date: '2024-01-01',
      amount: 1000,
      notes: 'Opening balance',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],

  transactions: [
    {
      id: 'transaction-1',
      user_id: 'user-123',
      account_id: 'account-1',
      description: 'Paycheck',
      amount: 3000,
      category: 'Income',
      date: '2024-01-15',
      is_recurring: true,
      recurrence_rule: { frequency: 'biweekly' as const },
      end_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'transaction-2',
      user_id: 'user-123',
      account_id: 'account-1',
      description: 'Rent',
      amount: -1500,
      category: 'Housing',
      date: '2024-01-01',
      is_recurring: true,
      recurrence_rule: { frequency: 'monthly' as const, daysOfMonth: [1] },
      end_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],

  settings: {
    id: 'settings-1',
    user_id: 'user-123',
    warning_threshold: 500,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};
