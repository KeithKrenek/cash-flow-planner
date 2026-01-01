# Cash Flow Tracker — Implementation Order

This document outlines the strategic order for implementing the Cash Flow Tracker application. Each phase builds on the previous, with testing integrated throughout.

---

## Phase Overview

| Phase | Focus | Estimated Complexity |
|-------|-------|---------------------|
| 1 | Project Setup & Infrastructure | Low |
| 2 | Core Utilities & Types | Low |
| 3 | Database & API Layer | Medium |
| 4 | Authentication | Medium |
| 5 | Projection Engine | High |
| 6 | Dashboard & Chart | Medium |
| 7 | Data Table | High |
| 8 | Forms & Modals | Medium |
| 9 | CSV Import | Medium |
| 10 | Polish & Integration Testing | Medium |

---

## Phase 1: Project Setup & Infrastructure

### Goals
- Initialize Vite + React + TypeScript project
- Configure all tooling (Tailwind, ESLint, Vitest)
- Set up project structure
- Verify build and test pipelines work

### Tasks

#### 1.1 Initialize Project
```bash
npm create vite@latest . -- --template react-ts
npm install
```

#### 1.2 Install Dependencies
```bash
# Production dependencies
npm install @supabase/supabase-js @tanstack/react-query @tanstack/react-table \
  date-fns date-fns-tz dompurify react-router-dom recharts react-hot-toast

# Dev dependencies
npm install -D @testing-library/jest-dom @testing-library/react @testing-library/user-event \
  @types/dompurify @vitest/coverage-v8 jsdom vitest \
  tailwindcss postcss autoprefixer @types/node
```

#### 1.3 Configure Tooling
- [ ] `tailwind.config.js` - Custom colors, fonts, spacing
- [ ] `postcss.config.js` - PostCSS with Tailwind
- [ ] `vite.config.ts` - Path aliases, React plugin
- [ ] `vitest.config.ts` - Test configuration
- [ ] `tsconfig.json` - Strict mode, path aliases
- [ ] `.env.example` - Document required env vars

#### 1.4 Create Directory Structure
```
src/
  ├── types/
  ├── lib/
  ├── api/
  ├── hooks/
  ├── context/
  ├── components/
  │   ├── ui/
  │   ├── layout/
  │   ├── auth/
  │   ├── dashboard/
  │   ├── table/
  │   ├── forms/
  │   └── modals/
  └── pages/
tests/
  ├── setup.ts
  ├── lib/
  └── components/
```

#### 1.5 Create Placeholder Files
- [ ] `src/main.tsx` - Entry point
- [ ] `src/App.tsx` - Root component (minimal)
- [ ] `src/router.tsx` - Router config (minimal)
- [ ] `src/styles/globals.css` - Global styles
- [ ] `tests/setup.ts` - Test setup

### Verification
```bash
npm run dev      # Dev server starts
npm run build    # Build succeeds
npm run test     # Test runner works
npm run lint     # Linting passes
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Path alias not resolving | Ensure both `tsconfig.json` and `vite.config.ts` have matching alias config |
| Tailwind not processing | Verify `content` paths in tailwind.config.js include all source files |
| Vitest not finding tests | Check `include` pattern in vitest.config.ts |

---

## Phase 2: Core Utilities & Types

### Goals
- Define all TypeScript types
- Implement utility functions
- Achieve 100% test coverage on utilities

### Tasks

#### 2.1 Type Definitions
- [ ] `src/types/database.ts` - Database row types, RecurrenceRule
- [ ] `src/types/domain.ts` - Application types, TableEntry, ProjectionResult
- [ ] `src/types/forms.ts` - Form data types, CSVParseResult
- [ ] `src/types/index.ts` - Re-exports

#### 2.2 Constants
- [ ] `src/lib/constants.ts` - Categories, time ranges, colors, labels

#### 2.3 Amount Utilities (with tests)
- [ ] `src/lib/amount-utils.ts`
  - `addAmounts(a, b)` - Safe addition
  - `subtractAmounts(a, b)` - Safe subtraction
  - `multiplyAmount(amount, multiplier)` - Safe multiplication
  - `roundAmount(amount)` - Round to 2 decimals
  - `parseAmount(value)` - Parse string to number
  - `sumAmounts(amounts)` - Sum array
- [ ] `tests/lib/amount-utils.test.ts`

#### 2.4 Date Utilities (with tests)
- [ ] `src/lib/date-utils.ts`
  - `toDateString(date)` - Date to YYYY-MM-DD
  - `fromDateString(string)` - YYYY-MM-DD to Date
  - `formatDisplayDate(date)` - "Jan 15, 2024"
  - `formatChartDate(date)` - "Jan 15"
  - `getNthWeekdayOfMonth(year, month, weekday, n)` - Nth weekday
  - `getDaysOfMonth(year, month, days)` - Specific days
- [ ] `tests/lib/date-utils.test.ts`

#### 2.5 Format Utilities
- [ ] `src/lib/format-utils.ts`
  - `formatCurrency(amount)` - "$1,234.56"
  - `formatSignedCurrency(amount)` - "+$100" or "-$100"
  - `formatRecurrence(rule)` - "Monthly on the 15th"

#### 2.6 Sanitization Utilities
- [ ] `src/lib/sanitize.ts`
  - `sanitizeText(input)` - Strip HTML
  - `sanitizeDescription(description)` - For transactions
  - `sanitizeAccountName(name)` - For accounts
  - `sanitizeNotes(notes)` - For checkpoints

#### 2.7 General Utilities
- [ ] `src/lib/utils.ts`
  - `cn(...classes)` - Class name merger (if needed)
  - `generateId()` - UUID generation (if needed client-side)

### Test Cases for Amount Utilities
```typescript
describe('addAmounts', () => {
  it('handles 0.1 + 0.2 without floating point error', () => {
    expect(addAmounts(0.1, 0.2)).toBe(0.3);
  });

  it('adds negative numbers correctly', () => {
    expect(addAmounts(-100.50, 50.25)).toBe(-50.25);
  });

  it('handles large amounts', () => {
    expect(addAmounts(999999.99, 0.01)).toBe(1000000);
  });
});

describe('parseAmount', () => {
  it('parses plain numbers', () => {
    expect(parseAmount('100.50')).toBe(100.5);
  });

  it('strips currency symbols and commas', () => {
    expect(parseAmount('$1,234.56')).toBe(1234.56);
  });

  it('returns null for invalid input', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});
```

### Test Cases for Date Utilities
```typescript
describe('getNthWeekdayOfMonth', () => {
  it('finds first Friday of January 2024', () => {
    const result = getNthWeekdayOfMonth(2024, 0, 5, 1);
    expect(result.toISOString().split('T')[0]).toBe('2024-01-05');
  });

  it('finds last Monday of February 2024', () => {
    const result = getNthWeekdayOfMonth(2024, 1, 1, -1);
    expect(result.toISOString().split('T')[0]).toBe('2024-02-26');
  });

  it('throws for impossible dates', () => {
    // 5th Friday doesn't exist in most months
    expect(() => getNthWeekdayOfMonth(2024, 1, 5, 5)).toThrow();
  });
});

describe('getDaysOfMonth', () => {
  it('handles day overflow in February', () => {
    const result = getDaysOfMonth(2024, 1, [30, 31]);
    // Both should resolve to Feb 29 (leap year)
    expect(result[0].getDate()).toBe(29);
    expect(result[1].getDate()).toBe(29);
  });
});
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| DOMPurify types not found | Install `@types/dompurify` |
| Date timezone inconsistencies | Always use `date.setHours(0,0,0,0)` for date-only comparisons |
| Circular imports in types | Use type-only imports: `import type { X } from './y'` |

---

## Phase 3: Database & API Layer

### Goals
- Set up Supabase client
- Implement all CRUD operations
- Test API functions with mocked Supabase

### Tasks

#### 3.1 Supabase Setup
- [ ] Create Supabase project (manual step)
- [ ] Run SQL schema in Supabase SQL Editor (manual step)
- [ ] Copy project URL and anon key to `.env.local`
- [ ] `src/lib/supabase.ts` - Client initialization

#### 3.2 API Functions
- [ ] `src/api/accounts.ts`
  - `getAll()` - List user's accounts
  - `getById(id)` - Single account
  - `create(account)` - New account
  - `update(id, updates)` - Edit account
  - `delete(id)` - Remove account

- [ ] `src/api/checkpoints.ts`
  - `getAll()` - List all checkpoints
  - `getByAccountId(accountId)` - Checkpoints for account
  - `getMostRecentForAccount(accountId, beforeDate)` - For projection
  - `create(checkpoint)` - New checkpoint
  - `update(id, updates)` - Edit checkpoint
  - `delete(id)` - Remove checkpoint

- [ ] `src/api/transactions.ts`
  - `getAll()` - List all transactions
  - `getByAccountId(accountId)` - Transactions for account
  - `getRecurring()` - Only recurring transactions
  - `create(transaction)` - New transaction
  - `createMany(transactions)` - Bulk insert (for CSV)
  - `update(id, updates)` - Edit transaction
  - `delete(id)` - Remove transaction

- [ ] `src/api/settings.ts`
  - `get()` - Get user settings
  - `update(updates)` - Update settings

#### 3.3 Error Handling
- [ ] `src/lib/errors.ts`
  - `AppError` class
  - `handleSupabaseError(error)` - Convert Supabase errors
  - `getErrorMessage(error)` - User-friendly messages

#### 3.4 Validation
- [ ] `src/lib/validation.ts`
  - `validateAccountForm(data)` - Account validation
  - `validateCheckpointForm(data)` - Checkpoint validation
  - `validateTransactionForm(data)` - Transaction validation
  - `validateSettingsForm(data)` - Settings validation

### Test Strategy
For API tests, mock the Supabase client:

```typescript
// tests/api/accounts.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { accountsApi } from '@/api/accounts';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('accountsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns accounts sorted by name', async () => {
      const mockAccounts = [
        { id: '1', name: 'Checking', user_id: 'user-1' },
        { id: '2', name: 'Savings', user_id: 'user-1' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
        }),
      } as any);

      const result = await accountsApi.getAll();
      expect(result).toEqual(mockAccounts);
    });

    it('throws on error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          }),
        }),
      } as any);

      await expect(accountsApi.getAll()).rejects.toThrow();
    });
  });
});
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| RLS blocking all requests | Ensure user is authenticated before API calls |
| `PGRST116` error on `.single()` | This is "no rows returned" - handle gracefully |
| Supabase types not matching | Generate types with `supabase gen types typescript` |
| Cascade delete not working | Verify ON DELETE CASCADE in foreign keys |

---

## Phase 4: Authentication

### Goals
- Implement auth context and hooks
- Create login/signup pages
- Protect dashboard route

### Tasks

#### 4.1 Auth Context
- [ ] `src/context/AuthContext.tsx`
  - `AuthProvider` component
  - `useAuth()` hook
  - `signUp(email, password)` function
  - `signIn(email, password)` function
  - `signOut()` function
  - Session persistence

#### 4.2 Auth Components
- [ ] `src/components/auth/AuthGuard.tsx` - Route protection
- [ ] `src/components/auth/LoginForm.tsx` - Login form
- [ ] `src/components/auth/SignupForm.tsx` - Registration form

#### 4.3 Auth Pages
- [ ] `src/pages/LoginPage.tsx` - Login page layout
- [ ] `src/pages/SignupPage.tsx` - Signup page layout

#### 4.4 Router Setup
- [ ] `src/router.tsx` - Full router with guards

#### 4.5 UI Components (needed for auth)
- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Input.tsx`
- [ ] `src/components/ui/Spinner.tsx`

### Test Cases
```typescript
describe('AuthContext', () => {
  it('provides null user when not authenticated', () => {
    // Render provider, check user is null
  });

  it('updates user after successful sign in', async () => {
    // Mock successful sign in, verify user updates
  });

  it('clears user after sign out', async () => {
    // Sign in, then sign out, verify user is null
  });

  it('persists session across page refresh', async () => {
    // Mock getSession returning valid session
  });
});

describe('AuthGuard', () => {
  it('redirects to login when not authenticated', () => {
    // Render without user, verify redirect
  });

  it('renders children when authenticated', () => {
    // Render with user, verify children shown
  });
});
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Infinite redirect loop | Check auth state before redirect in AuthGuard |
| Session not persisting | Verify `persistSession: true` in Supabase config |
| Email confirmation required | Disable in Supabase dashboard for development |
| Auth state flickering | Show loading spinner while `isLoading` is true |

---

## Phase 5: Projection Engine

### Goals
- Implement recurrence expansion
- Implement projection calculation
- Achieve 100% test coverage on core logic

### Tasks

#### 5.1 Recurrence Engine (with tests)
- [ ] `src/lib/recurrence.ts`
  - `expandRecurringTransaction(transaction, rangeStart, rangeEnd)`
  - `expandDaily(...)` - Daily expansion
  - `expandWeekly(...)` - Weekly expansion
  - `expandMonthly(...)` - Monthly expansion (complex)
  - `expandYearly(...)` - Yearly expansion (Feb 29 handling)
  - `expandAllTransactions(transactions, rangeStart, rangeEnd)`
- [ ] `tests/lib/recurrence.test.ts` - Comprehensive tests

#### 5.2 Projection Engine (with tests)
- [ ] `src/lib/projection-engine.ts`
  - `calculateProjection(accounts, checkpoints, transactions, days, threshold)`
  - Historical transaction replay
  - Daily balance calculation
  - Warning detection
- [ ] `tests/lib/projection-engine.test.ts` - Comprehensive tests

#### 5.3 Projection Hook
- [ ] `src/hooks/useProjection.ts`
  - Combines data from all sources
  - Memoized calculation
  - Returns `{ projection, isLoading, error }`

### Critical Test Cases for Recurrence
```typescript
describe('expandRecurringTransaction', () => {
  // Daily
  it('expands daily with interval', () => {
    // Every 3 days starting Jan 1 for 10 days = Jan 1, 4, 7, 10
  });

  // Weekly
  it('expands weekly maintaining day of week', () => {
    // Starting Monday Jan 1, weekly = Jan 1, 8, 15, 22, 29
  });

  // Biweekly
  it('expands biweekly from anchor date', () => {
    // Starting Jan 1, biweekly for 2 months
  });

  // Monthly - day of month
  it('handles 31st in February', () => {
    // Monthly on 31st: Jan 31, Feb 28/29, Mar 31
  });

  it('handles multiple days of month', () => {
    // 15th and 30th each month
  });

  // Monthly - last day
  it('expands last day of month correctly', () => {
    // Jan 31, Feb 28/29, Mar 31, Apr 30
  });

  // Monthly - nth weekday
  it('finds 2nd Tuesday of each month', () => {
    // Different dates each month
  });

  it('finds last Friday of each month', () => {
    // Different dates each month
  });

  // Yearly
  it('handles Feb 29 in non-leap years', () => {
    // 2024 Feb 29 -> 2025 Feb 28 -> 2026 Feb 28
  });

  // End date
  it('respects end date', () => {
    // Daily from Jan 1, end Jan 5 = 5 instances
  });

  // Edge cases
  it('handles start date after range start', () => {
    // Transaction starts Jan 15, range is Jan 1-31
  });

  it('returns empty for non-recurring', () => {
    // is_recurring = false
  });
});
```

### Critical Test Cases for Projection Engine
```typescript
describe('calculateProjection', () => {
  // Basic functionality
  it('starts with checkpoint balance', () => {
    // Single checkpoint, no transactions
  });

  it('defaults to 0 without checkpoint', () => {
    // No checkpoint for account
  });

  // Historical replay (CRITICAL)
  it('replays transactions between checkpoint and today', () => {
    // Checkpoint Jan 1 $1000, transaction Jan 5 -$100
    // Today Jan 10, starting balance should be $900
  });

  it('replays recurring transactions in historical period', () => {
    // Checkpoint Jan 1, daily -$10, today Jan 5
    // Should have 4 days of -$10 = $960 starting
  });

  // Checkpoint handling
  it('uses most recent checkpoint before today', () => {
    // Two checkpoints: Dec 1 and Jan 1, today is Jan 15
    // Should use Jan 1 checkpoint
  });

  it('future checkpoints override projections', () => {
    // Checkpoint for next week should reset balance
  });

  // Transaction processing
  it('applies checkpoints before transactions on same day', () => {
    // Checkpoint $500, transaction -$100 same day
    // Result should be $400, not $400 then reset to $500
  });

  // Warnings
  it('generates warnings below threshold', () => {
    // Threshold $500, balance drops to $400
  });

  it('deduplicates warnings per account per day', () => {
    // Only one warning per account per day
  });

  // Multiple accounts
  it('calculates total across accounts', () => {
    // Two accounts, verify total is sum
  });

  it('handles accounts independently', () => {
    // Transaction on one account doesn't affect other
  });
});
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Timezone-shifted dates | Use `date.setHours(0,0,0,0)` consistently |
| Infinite loop in expansion | Add safety limit (max 1000 iterations) |
| Performance with 360 days | Memoize calculation, consider web worker for large datasets |
| Feb 29 not found | Explicitly check month after setting date |

---

## Phase 6: Dashboard & Chart

### Goals
- Implement main dashboard layout
- Create cash flow chart with Recharts
- Add time range selector

### Tasks

#### 6.1 Layout Components
- [ ] `src/components/layout/Header.tsx` - Top nav with user menu
- [ ] `src/components/layout/Container.tsx` - Max-width wrapper
- [ ] `src/components/layout/PageLayout.tsx` - Full page structure

#### 6.2 Dashboard Components
- [ ] `src/components/dashboard/Dashboard.tsx` - Main container
- [ ] `src/components/dashboard/CashFlowChart.tsx` - Recharts implementation
- [ ] `src/components/dashboard/TimeRangeSelector.tsx` - 15/30/90/180/360 days
- [ ] `src/components/dashboard/AccountLegend.tsx` - Color-coded legend
- [ ] `src/components/dashboard/WarningBanner.tsx` - Low balance alerts

#### 6.3 Dashboard Page
- [ ] `src/pages/DashboardPage.tsx` - Combines all dashboard components

#### 6.4 TanStack Query Hooks
- [ ] `src/hooks/useAccounts.ts` - Account queries/mutations
- [ ] `src/hooks/useCheckpoints.ts` - Checkpoint queries/mutations
- [ ] `src/hooks/useTransactions.ts` - Transaction queries/mutations
- [ ] `src/hooks/useSettings.ts` - Settings queries/mutations

### Chart Implementation Notes
```typescript
// CashFlowChart.tsx key structure
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <XAxis dataKey="dateString" />
    <YAxis tickFormatter={formatCurrency} />
    <Tooltip content={<CustomTooltip />} />
    <Legend />

    {/* Warning threshold reference area */}
    <ReferenceArea
      y1={0}
      y2={warningThreshold}
      fill="#ef4444"
      fillOpacity={0.1}
    />

    {/* Account lines */}
    {accounts.map((account, i) => (
      <Line
        key={account.id}
        dataKey={account.id}
        name={account.name}
        stroke={CHART_COLORS[i]}
        dot={false}
      />
    ))}

    {/* Total line (dashed) */}
    <Line
      dataKey="total"
      name="Total"
      stroke={TOTAL_LINE_COLOR}
      strokeDasharray="5 5"
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Chart not responsive | Wrap in `ResponsiveContainer` with explicit parent height |
| Legend overflow | Use `wrapperStyle` to limit legend width |
| Tooltip flickering | Use `isAnimationActive={false}` during development |
| Y-axis labels cut off | Add left margin to chart |

---

## Phase 7: Data Table

### Goals
- Implement TanStack Table
- Add inline editing
- Add sorting and filtering

### Tasks

#### 7.1 Table Infrastructure
- [ ] `src/components/table/DataTable.tsx` - Main table container
- [ ] `src/components/table/TableToolbar.tsx` - Filters and actions

#### 7.2 Editable Cells
- [ ] `src/components/table/EditableCell.tsx` - Generic editable cell
- [ ] `src/components/table/DateCell.tsx` - Date picker cell
- [ ] `src/components/table/AmountCell.tsx` - Currency input cell
- [ ] `src/components/table/SelectCell.tsx` - Dropdown cell

#### 7.3 Supporting Components
- [ ] `src/components/table/RecurrenceBadge.tsx` - Shows recurrence pattern
- [ ] `src/components/table/RowActions.tsx` - Delete, configure buttons

#### 7.4 Debounced Save Hook
- [ ] `src/hooks/useDebounce.ts` - Generic debounce
- [ ] `src/hooks/useDebouncedSave.ts` - Debounced mutation

### Inline Editing Flow
```
1. User clicks cell
2. Cell transforms to input (text, date picker, or select)
3. User types/selects value
4. On blur or Enter:
   a. Validate input
   b. If valid, trigger debounced save
   c. Optimistically update UI
   d. If save fails, rollback and show error
5. On Escape, revert to original value
```

### Table Column Configuration
```typescript
const columns: ColumnDef<TableEntry>[] = [
  {
    id: 'type',
    header: '',
    cell: ({ row }) => <TypeBadge type={row.original.type} />,
    size: 40,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <DateCell
        value={row.original.date}
        onChange={(date) => handleUpdate(row.original, { date })}
      />
    ),
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'accountName',
    header: 'Account',
    cell: ({ row }) => (
      <SelectCell
        value={row.original.accountId}
        options={accountOptions}
        onChange={(accountId) => handleUpdate(row.original, { accountId })}
      />
    ),
  },
  // ... more columns
];
```

### Test Cases for EditableCell
```typescript
describe('EditableCell', () => {
  it('displays value as text by default', () => {
    render(<EditableCell value="Test" onChange={vi.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('transforms to input on click', async () => {
    render(<EditableCell value="Test" onChange={vi.fn()} />);
    await userEvent.click(screen.getByText('Test'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('saves on Enter', async () => {
    const onChange = vi.fn();
    render(<EditableCell value="Test" onChange={onChange} />);
    await userEvent.click(screen.getByText('Test'));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'New Value{enter}');
    expect(onChange).toHaveBeenCalledWith('New Value');
  });

  it('reverts on Escape', async () => {
    const onChange = vi.fn();
    render(<EditableCell value="Test" onChange={onChange} />);
    await userEvent.click(screen.getByText('Test'));
    await userEvent.type(screen.getByRole('textbox'), 'Changed{escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Focus lost on re-render | Use `useRef` to track editing state |
| Table re-renders on every keystroke | Memoize row components, use `useDebouncedSave` |
| Sorting breaks with mixed types | Ensure consistent data types in column accessors |
| Filter state lost on data change | Store filter state in URL or local state |

---

## Phase 8: Forms & Modals

### Goals
- Implement all form components
- Create modal wrappers
- Add form validation

### Tasks

#### 8.1 UI Components
- [ ] `src/components/ui/Modal.tsx` - Modal wrapper
- [ ] `src/components/ui/Select.tsx` - Styled select
- [ ] `src/components/ui/Badge.tsx` - Status badges
- [ ] `src/components/ui/EmptyState.tsx` - No data state
- [ ] `src/components/ui/Toast.tsx` - Toast notifications (if customizing)

#### 8.2 Form Components
- [ ] `src/components/forms/AccountForm.tsx` - Account name
- [ ] `src/components/forms/CheckpointForm.tsx` - Balance checkpoint
- [ ] `src/components/forms/TransactionForm.tsx` - Transaction details
- [ ] `src/components/forms/RecurrenceForm.tsx` - Complex recurrence
- [ ] `src/components/forms/SettingsForm.tsx` - Warning threshold

#### 8.3 Modal Components
- [ ] `src/components/modals/AddAccountModal.tsx`
- [ ] `src/components/modals/AddCheckpointModal.tsx`
- [ ] `src/components/modals/AddTransactionModal.tsx`
- [ ] `src/components/modals/RecurrenceModal.tsx`
- [ ] `src/components/modals/SettingsModal.tsx`
- [ ] `src/components/modals/ConfirmDeleteModal.tsx`

### Modal Pattern
```typescript
// Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-surface border border-border rounded-lg shadow-modal max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### RecurrenceForm Complexity
The recurrence form is the most complex, with conditional UI:

```typescript
// Simplified structure
function RecurrenceForm({ value, onChange }) {
  return (
    <div>
      {/* Frequency selector */}
      <Select
        value={value.frequency}
        options={FREQUENCY_OPTIONS}
        onChange={(freq) => onChange({ ...value, frequency: freq })}
      />

      {/* Interval (hidden for biweekly) */}
      {value.frequency !== 'biweekly' && (
        <Input
          type="number"
          value={value.interval}
          onChange={(e) => onChange({ ...value, interval: e.target.value })}
        />
      )}

      {/* Monthly options */}
      {value.frequency === 'monthly' && (
        <div>
          <RadioGroup value={monthlyType} onChange={setMonthlyType}>
            <Radio value="daysOfMonth">On day(s) of month</Radio>
            <Radio value="nthWeekday">On the Nth weekday</Radio>
            <Radio value="lastDay">Last day of month</Radio>
          </RadioGroup>

          {/* Conditional inputs based on monthlyType */}
        </div>
      )}

      {/* End date */}
      <Input
        type="date"
        value={value.endDate}
        onChange={(e) => onChange({ ...value, endDate: e.target.value })}
      />
    </div>
  );
}
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Modal scrolling body | Add `overflow-hidden` to body when modal open |
| Focus trap not working | Use `@headlessui/react` Dialog or implement manually |
| Form state lost on modal close | Reset form state in `onClose` handler |
| Date input browser inconsistency | Consider react-datepicker for consistency |

---

## Phase 9: CSV Import

### Goals
- Implement CSV parser
- Create import modal with preview
- Handle duplicate detection

### Tasks

#### 9.1 CSV Parser (with tests)
- [ ] `src/lib/csv-parser.ts`
  - `parseCSV(csvText, accounts, userId, existingTransactions)`
  - `parseCSVLine(line)` - Handle quoted values
  - `validateRow(row, accountMap)` - Row validation
  - `convertToTransaction(row, accountMap, userId)` - Convert to insert
  - `createTransactionFingerprint(...)` - Duplicate detection
  - `generateCSVTemplate()` - Sample file generator
- [ ] `tests/lib/csv-parser.test.ts`

#### 9.2 Import Modal
- [ ] `src/components/modals/CSVImportModal.tsx`
  - File upload zone
  - Preview table with valid/invalid rows
  - Error messages per row
  - Duplicate warnings
  - Import button with count

### CSV Parser Test Cases
```typescript
describe('parseCSV', () => {
  // Valid parsing
  it('parses valid rows', () => {
    const csv = 'date,description,...\n2024-01-15,Salary,...';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.valid.length).toBe(1);
  });

  // Header validation
  it('rejects missing columns', () => {
    const csv = 'date,description\n2024-01-15,Test';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.errors[0].errors[0]).toContain('Missing required columns');
  });

  // Case-insensitive account matching
  it('matches accounts case-insensitively', () => {
    // 'chase checking' matches 'Chase Checking'
  });

  // Duplicate detection
  it('warns on duplicate transactions', () => {
    const existing = [{ date: '2024-01-15', description: 'Salary', ... }];
    const csv = '...\n2024-01-15,Salary,...';
    const result = parseCSV(csv, mockAccounts, 'user-1', existing);
    expect(result.duplicateWarnings.length).toBe(1);
  });

  // XSS sanitization
  it('sanitizes description', () => {
    const csv = '...\n2024-01-15,<script>alert(1)</script>Test,...';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.valid[0].description).toBe('Test');
  });

  // Field validation
  it('validates date format', () => {
    const csv = '...\n01-15-2024,Test,...';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.errors[0].errors).toContain('Date must be in YYYY-MM-DD format');
  });

  it('validates amount is number', () => {
    const csv = '...\n2024-01-15,Test,abc,...';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.errors[0].errors).toContain('Amount must be a number');
  });

  it('requires frequency for recurring', () => {
    const csv = '...\n2024-01-15,Test,100,Account,,true,,';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.errors[0].errors).toContain('Frequency is required for recurring');
  });

  // Edge cases
  it('handles quoted values with commas', () => {
    const csv = '...\n2024-01-15,"Description, with comma",100,...';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.valid[0].description).toBe('Description, with comma');
  });

  it('handles empty lines', () => {
    const csv = 'headers...\n\n2024-01-15,Test,...\n\n';
    const result = parseCSV(csv, mockAccounts, 'user-1');
    expect(result.valid.length).toBe(1);
  });
});
```

### Import Modal UX Flow
```
1. User clicks "Import CSV" button
2. Modal opens with file upload zone
3. User drags or selects CSV file
4. Parser runs, results displayed:
   - Green rows: Valid transactions
   - Red rows: Invalid with error messages
   - Yellow rows: Valid but possible duplicate
5. Summary shows "X valid, Y errors, Z warnings"
6. User clicks "Import X Transactions"
7. Batch insert runs with loading state
8. On success: close modal, refresh data, show toast
9. On error: show error, allow retry
```

### Potential Issues & Resolutions

| Issue | Resolution |
|-------|------------|
| Large file crashes browser | Add file size limit (e.g., 1MB) |
| Encoding issues | Parse with `FileReader.readAsText(file, 'UTF-8')` |
| Line ending differences | Normalize with `.replace(/\r\n/g, '\n')` |
| Quoted field edge cases | Use proper CSV parser (or test thoroughly) |

---

## Phase 10: Polish & Integration Testing

### Goals
- Add loading states
- Implement optimistic updates
- End-to-end testing
- Performance optimization
- Bug fixes

### Tasks

#### 10.1 Loading States
- [ ] Skeleton loaders for dashboard
- [ ] Button loading states
- [ ] Table loading state

#### 10.2 Empty States
- [ ] No accounts state
- [ ] No transactions state
- [ ] No checkpoints state

#### 10.3 Optimistic Updates
- [ ] Update hooks for optimistic mutations
- [ ] Rollback on error

#### 10.4 Error Boundary
- [ ] `src/components/ErrorBoundary.tsx` - Catch rendering errors

#### 10.5 Performance
- [ ] Memoize expensive calculations
- [ ] Virtual scrolling for large tables (if needed)
- [ ] Lazy load modals

#### 10.6 Integration Tests
- [ ] Full user workflow: signup → add account → add checkpoint → add transactions → view projection
- [ ] CSV import workflow
- [ ] Edit transaction workflow
- [ ] Delete account cascade

### Integration Test Example
```typescript
// tests/integration/user-workflow.test.ts
describe('User Workflow', () => {
  it('completes initial setup flow', async () => {
    // 1. Sign up
    await signUp('test@example.com', 'password');

    // 2. Add account
    await addAccount('Checking');
    expect(await getAccounts()).toHaveLength(1);

    // 3. Add checkpoint
    await addCheckpoint('Checking', new Date(), 1000);

    // 4. Add recurring transaction
    await addTransaction({
      account: 'Checking',
      description: 'Rent',
      amount: -1500,
      isRecurring: true,
      frequency: 'monthly',
    });

    // 5. Verify projection shows warning
    const projection = await getProjection(30);
    expect(projection.warnings).not.toBeEmpty();
  });
});
```

### Final Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Lighthouse performance score > 90
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Dependency Graph

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Utilities & Types)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Database)   Phase 5 (Projection Engine)
    │                  │
    ▼                  │
Phase 4 (Auth)        │
    │                  │
    ├──────────────────┘
    ▼
Phase 6 (Dashboard & Chart)
    │
    ▼
Phase 7 (Data Table)
    │
    ▼
Phase 8 (Forms & Modals)
    │
    ▼
Phase 9 (CSV Import)
    │
    ▼
Phase 10 (Polish)
```

Note: Phases 3 and 5 can be developed in parallel after Phase 2. Phase 5 (Projection Engine) only depends on types from Phase 2, not on the actual database connection.

---

## Risk Areas & Mitigation

### High Risk
1. **Projection Engine Complexity** - Extensive test coverage, edge case documentation
2. **Inline Table Editing** - Careful state management, optimistic updates
3. **Recurrence Expansion** - Comprehensive tests for all patterns

### Medium Risk
1. **CSV Parsing Edge Cases** - Handle encoding, line endings, quoted fields
2. **Authentication Flow** - Test session persistence, redirect loops
3. **Performance with Large Data** - Monitor and optimize if needed

### Low Risk
1. **Styling** - Tailwind is straightforward
2. **Basic CRUD** - Standard patterns
3. **Chart Rendering** - Recharts handles most complexity

---

This implementation order ensures each phase builds on tested, working code from previous phases. The most complex logic (projection engine, recurrence) is implemented early with comprehensive tests before being integrated into the UI.
