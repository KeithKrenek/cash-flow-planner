# Cash Flow Tracker — Architecture & Implementation Document

---

## Table of Contents

1. [Technical Decisions](#1-technical-decisions)
2. [Project Structure](#2-project-structure)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Implementation](#4-database-implementation)
5. [Type Definitions](#5-type-definitions)
6. [Supabase Client & Authentication](#6-supabase-client--authentication)
7. [API Layer](#7-api-layer)
8. [State Management](#8-state-management)
9. [Projection Engine Implementation](#9-projection-engine-implementation)
10. [Component Specifications](#10-component-specifications)
11. [Styling System](#11-styling-system)
12. [CSV Parser Implementation](#12-csv-parser-implementation)
13. [Error Handling Patterns](#13-error-handling-patterns)
14. [Performance Considerations](#14-performance-considerations)
15. [Deployment Configuration](#15-deployment-configuration)

---

## 1. Technical Decisions

### 1.1 Why React + TypeScript

React provides a component model well-suited for this application's needs: a complex interactive table, real-time chart updates, and modal-driven workflows. TypeScript adds compile-time safety critical for financial calculations where type mismatches could cause incorrect projections.

### 1.2 Why Vite over Create React App

Vite offers significantly faster hot module replacement during development and produces smaller production bundles. CRA is effectively deprecated, and Vite has become the community standard.

### 1.3 Why Supabase

Supabase provides PostgreSQL (robust for financial data), built-in authentication, and row-level security in a single managed service. The free tier supports up to 500MB database storage, 50,000 monthly active users, and unlimited API requests—more than sufficient for personal use. Alternatives considered:

- **Firebase**: NoSQL less suited for relational financial data
- **PlanetScale**: Requires separate auth solution
- **Self-hosted PostgreSQL**: Unnecessary operational overhead for personal app

### 1.4 Why TanStack Table

TanStack Table (formerly React Table) is headless, meaning we control all rendering. This allows custom inline editing, precise styling control, and optimal bundle size (no unused UI components). Alternatives like AG Grid or Material-UI DataGrid include built-in UI that conflicts with our dark theme requirements.

### 1.5 Why Recharts

Recharts is built specifically for React, uses declarative components, and handles responsive resizing automatically. D3 offers more power but requires imperative code that's harder to integrate with React's rendering model. Chart.js requires a wrapper library and doesn't feel as native to React.

### 1.6 Why date-fns over Moment/Luxon

date-fns is tree-shakeable (only import what you use), immutable by default, and uses native Date objects. Moment is deprecated and large. Luxon is excellent but heavier than needed for our use case.

### 1.7 Why TanStack Query

TanStack Query (formerly React Query) provides caching, background refetching, optimistic updates, and automatic retry logic. This eliminates the need to build custom data fetching infrastructure and ensures the UI stays synchronized with database state.

---

## 2. Project Structure

```
cashflow-tracker/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env.local                    # Local environment variables (git-ignored)
├── .env.example                  # Template for required env vars
├── .gitignore
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                  # Application entry point
    ├── App.tsx                   # Root component with providers
    ├── vite-env.d.ts             # Vite type declarations
    │
    ├── types/
    │   ├── index.ts              # Re-exports all types
    │   ├── database.ts           # Database row types (from Supabase)
    │   ├── domain.ts             # Application domain types
    │   └── forms.ts              # Form state types
    │
    ├── lib/
    │   ├── supabase.ts           # Supabase client initialization
    │   ├── constants.ts          # App-wide constants
    │   ├── utils.ts              # General utility functions
    │   ├── date-utils.ts         # Date manipulation helpers
    │   ├── format-utils.ts       # Number/currency formatting
    │   ├── recurrence.ts         # Recurrence expansion logic
    │   ├── projection-engine.ts  # Core projection calculations
    │   └── csv-parser.ts         # CSV import parsing/validation
    │
    ├── api/
    │   ├── accounts.ts           # Account CRUD operations
    │   ├── checkpoints.ts        # Balance checkpoint operations
    │   ├── transactions.ts       # Transaction CRUD operations
    │   └── settings.ts           # User settings operations
    │
    ├── hooks/
    │   ├── useAuth.ts            # Authentication state and methods
    │   ├── useAccounts.ts        # Account data fetching/mutations
    │   ├── useCheckpoints.ts     # Checkpoint data fetching/mutations
    │   ├── useTransactions.ts    # Transaction data fetching/mutations
    │   ├── useSettings.ts        # User settings management
    │   ├── useProjection.ts      # Computed projection from raw data
    │   └── useDebounce.ts        # Input debouncing utility
    │
    ├── context/
    │   └── AuthContext.tsx       # Authentication context provider
    │
    ├── components/
    │   ├── ui/                   # Reusable UI primitives
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Toast.tsx
    │   │   ├── Spinner.tsx
    │   │   ├── Badge.tsx
    │   │   └── EmptyState.tsx
    │   │
    │   ├── layout/
    │   │   ├── Header.tsx        # Top navigation bar
    │   │   ├── Container.tsx     # Max-width centered wrapper
    │   │   └── PageLayout.tsx    # Full page structure
    │   │
    │   ├── auth/
    │   │   ├── AuthGuard.tsx     # Route protection wrapper
    │   │   ├── LoginForm.tsx     # Email/password login
    │   │   └── SignupForm.tsx    # Registration form
    │   │
    │   ├── dashboard/
    │   │   ├── Dashboard.tsx     # Main dashboard container
    │   │   ├── CashFlowChart.tsx # Recharts line chart
    │   │   ├── TimeRangeSelector.tsx
    │   │   ├── AccountLegend.tsx # Chart legend with account colors
    │   │   └── WarningBanner.tsx # Alert for upcoming low balances
    │   │
    │   ├── table/
    │   │   ├── DataTable.tsx     # Main table container
    │   │   ├── TableToolbar.tsx  # Filter/sort controls + actions
    │   │   ├── EditableCell.tsx  # Click-to-edit cell wrapper
    │   │   ├── DateCell.tsx      # Date picker cell
    │   │   ├── AmountCell.tsx    # Currency input cell
    │   │   ├── SelectCell.tsx    # Dropdown cell (account, category)
    │   │   ├── RecurrenceBadge.tsx
    │   │   └── RowActions.tsx    # Delete, configure recurrence
    │   │
    │   ├── forms/
    │   │   ├── AccountForm.tsx   # Add/edit account
    │   │   ├── CheckpointForm.tsx
    │   │   ├── TransactionForm.tsx
    │   │   ├── RecurrenceForm.tsx # Complex schedule configuration
    │   │   └── SettingsForm.tsx  # Warning threshold
    │   │
    │   └── modals/
    │       ├── AddAccountModal.tsx
    │       ├── AddCheckpointModal.tsx
    │       ├── AddTransactionModal.tsx
    │       ├── RecurrenceModal.tsx
    │       ├── CSVImportModal.tsx
    │       ├── SettingsModal.tsx
    │       └── ConfirmDeleteModal.tsx
    │
    └── pages/
        ├── LoginPage.tsx
        ├── SignupPage.tsx
        └── DashboardPage.tsx
```

---

## 3. Environment Configuration

### 3.1 Environment Variables

**.env.example:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**.env.local** (create locally, never commit):
```env
VITE_SUPABASE_URL=https://actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=actual-anon-key
```

### 3.2 Package Dependencies

**package.json:**
```json
{
  "name": "cashflow-tracker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-table": "^8.11.0",
    "date-fns": "^3.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 3.3 TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.4 Vite Configuration

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
});
```

---

## 4. Database Implementation

### 4.1 Complete SQL Schema

Execute this SQL in the Supabase SQL Editor:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT accounts_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT accounts_unique_name_per_user UNIQUE (user_id, name)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- ============================================
-- BALANCE CHECKPOINTS TABLE
-- ============================================
CREATE TABLE balance_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT checkpoints_notes_length CHECK (notes IS NULL OR char_length(notes) <= 500)
);

CREATE INDEX idx_checkpoints_user_id ON balance_checkpoints(user_id);
CREATE INDEX idx_checkpoints_account_id ON balance_checkpoints(account_id);
CREATE INDEX idx_checkpoints_date ON balance_checkpoints(date);
CREATE INDEX idx_checkpoints_account_date ON balance_checkpoints(account_id, date DESC);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    category TEXT,
    date DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule JSONB,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT transactions_description_length 
        CHECK (char_length(description) >= 1 AND char_length(description) <= 200),
    CONSTRAINT transactions_amount_nonzero CHECK (amount != 0),
    CONSTRAINT transactions_category_length 
        CHECK (category IS NULL OR char_length(category) <= 50),
    CONSTRAINT transactions_recurrence_consistency 
        CHECK (
            (is_recurring = FALSE AND recurrence_rule IS NULL) OR
            (is_recurring = TRUE AND recurrence_rule IS NOT NULL)
        ),
    CONSTRAINT transactions_end_date_consistency
        CHECK (
            (is_recurring = FALSE AND end_date IS NULL) OR
            (is_recurring = TRUE)
        )
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_is_recurring ON transactions(is_recurring);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    warning_threshold NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT user_settings_unique_user UNIQUE (user_id),
    CONSTRAINT user_settings_threshold_non_negative CHECK (warning_threshold >= 0)
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoints_updated_at
    BEFORE UPDATE ON balance_checkpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can view their own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Balance checkpoints policies
CREATE POLICY "Users can view their own checkpoints"
    ON balance_checkpoints FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkpoints"
    ON balance_checkpoints FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkpoints"
    ON balance_checkpoints FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkpoints"
    ON balance_checkpoints FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTION: Initialize user settings on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, warning_threshold)
    VALUES (NEW.id, 500.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.2 Recurrence Rule JSON Schema

The `recurrence_rule` JSONB column stores schedule configuration:

```typescript
// Valid recurrence_rule structures:

// Daily: every N days
{ "frequency": "daily", "interval": 1 }
{ "frequency": "daily", "interval": 3 }  // every 3 days

// Weekly: every N weeks (on same weekday as start date)
{ "frequency": "weekly", "interval": 1 }
{ "frequency": "weekly", "interval": 2 }  // every 2 weeks

// Bi-weekly: shorthand for every 2 weeks
{ "frequency": "biweekly" }

// Monthly: specific day(s) of month
{ "frequency": "monthly", "daysOfMonth": [1] }        // 1st of month
{ "frequency": "monthly", "daysOfMonth": [15, 30] }   // 15th and 30th

// Monthly: last day of month
{ "frequency": "monthly", "lastDayOfMonth": true }

// Monthly: Nth weekday (weekday: 0=Sun, 6=Sat; weekOfMonth: 1-4 or -1=last)
{ "frequency": "monthly", "weekday": 5, "weekOfMonth": 1 }   // 1st Friday
{ "frequency": "monthly", "weekday": 1, "weekOfMonth": -1 }  // last Monday

// Yearly: same date each year
{ "frequency": "yearly", "interval": 1 }
```

---

## 5. Type Definitions

### 5.1 Database Types (src/types/database.ts)

```typescript
// Direct mappings to database tables

export interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbBalanceCheckpoint {
  id: string;
  user_id: string;
  account_id: string;
  date: string;           // ISO date string YYYY-MM-DD
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  account_id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;           // ISO date string YYYY-MM-DD
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserSettings {
  id: string;
  user_id: string;
  warning_threshold: number;
  created_at: string;
  updated_at: string;
}

// Recurrence rule structure
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;          // Every N periods (default 1)
  daysOfMonth?: number[];     // [1, 15, 30] etc.
  lastDayOfMonth?: boolean;   // True = last day of each month
  weekday?: number;           // 0-6 (Sunday-Saturday)
  weekOfMonth?: number;       // 1-4 or -1 for last
}

// Insert/Update types (omit auto-generated fields)
export type AccountInsert = Omit<DbAccount, 'id' | 'created_at' | 'updated_at'>;
export type AccountUpdate = Partial<Omit<DbAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CheckpointInsert = Omit<DbBalanceCheckpoint, 'id' | 'created_at' | 'updated_at'>;
export type CheckpointUpdate = Partial<Omit<DbBalanceCheckpoint, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type TransactionInsert = Omit<DbTransaction, 'id' | 'created_at' | 'updated_at'>;
export type TransactionUpdate = Partial<Omit<DbTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type SettingsUpdate = Partial<Omit<DbUserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
```

### 5.2 Domain Types (src/types/domain.ts)

```typescript
import { DbAccount, DbBalanceCheckpoint, DbTransaction, DbUserSettings } from './database';

// Extended types with computed properties and relationships

export interface Account extends DbAccount {
  // No additional fields currently, but allows extension
}

export interface BalanceCheckpoint extends DbBalanceCheckpoint {
  account?: Account;  // Populated via join when needed
}

export interface Transaction extends DbTransaction {
  account?: Account;  // Populated via join when needed
}

export interface UserSettings extends DbUserSettings {}

// Unified table row type (checkpoint, transaction, or recurring template)
export type TableEntryType = 'checkpoint' | 'transaction' | 'recurring';

export interface TableEntry {
  id: string;
  type: TableEntryType;
  accountId: string;
  accountName: string;
  date: Date;
  description: string;
  amount: number;
  category: string | null;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  endDate: Date | null;
  
  // Reference to original record for updates
  originalRecord: BalanceCheckpoint | Transaction;
}

// Projection output types
export interface ProjectionDataPoint {
  date: Date;
  dateString: string;  // For chart x-axis: 'MMM d'
  balances: Record<string, number>;  // accountId -> balance
  total: number;
}

export interface ProjectionWarning {
  date: Date;
  accountId: string;
  accountName: string;
  balance: number;
  threshold: number;
}

export interface ProjectionResult {
  dataPoints: ProjectionDataPoint[];
  warnings: ProjectionWarning[];
  accounts: Account[];  // For legend/reference
}

// Time range options
export type TimeRangeDays = 15 | 30 | 90 | 180 | 360;

// Chart series configuration
export interface ChartSeries {
  id: string;           // accountId or 'total'
  name: string;         // Display name
  color: string;        // Hex color
  dataKey: string;      // Key in data point
  isDashed?: boolean;   // True for total line
}
```

### 5.3 Form Types (src/types/forms.ts)

```typescript
import { RecurrenceRule } from './database';

// Form state types for controlled inputs

export interface AccountFormData {
  name: string;
}

export interface CheckpointFormData {
  accountId: string;
  date: string;         // YYYY-MM-DD for input[type=date]
  amount: string;       // String for input, parse to number on submit
  notes: string;
}

export interface TransactionFormData {
  accountId: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  endDate: string;
}

export interface RecurrenceFormData {
  frequency: RecurrenceRule['frequency'];
  interval: string;
  daysOfMonth: string;          // Comma-separated: "1,15,30"
  lastDayOfMonth: boolean;
  weekday: string;              // "0"-"6" or ""
  weekOfMonth: string;          // "1"-"4" or "-1" or ""
}

export interface SettingsFormData {
  warningThreshold: string;
}

// CSV import types
export interface CSVRow {
  date: string;
  description: string;
  amount: string;
  account: string;
  category: string;
  is_recurring: string;
  frequency: string;
  end_date: string;
}

export interface CSVParseResult {
  valid: TransactionInsert[];
  errors: Array<{
    row: number;
    data: CSVRow;
    errors: string[];
  }>;
}
```

---

## 6. Supabase Client & Authentication

### 6.1 Supabase Client (src/lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### 6.2 Auth Context (src/context/AuthContext.tsx)

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 7. API Layer

### 7.1 Accounts API (src/api/accounts.ts)

```typescript
import { supabase } from '@/lib/supabase';
import { DbAccount, AccountInsert, AccountUpdate } from '@/types/database';

export const accountsApi = {
  async getAll(): Promise<DbAccount[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<DbAccount | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(account: AccountInsert): Promise<DbAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: AccountUpdate): Promise<DbAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

### 7.2 Checkpoints API (src/api/checkpoints.ts)

```typescript
import { supabase } from '@/lib/supabase';
import { DbBalanceCheckpoint, CheckpointInsert, CheckpointUpdate } from '@/types/database';

export const checkpointsApi = {
  async getAll(): Promise<DbBalanceCheckpoint[]> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByAccountId(accountId: string): Promise<DbBalanceCheckpoint[]> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getMostRecentForAccount(
    accountId: string,
    beforeDate: string
  ): Promise<DbBalanceCheckpoint | null> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .select('*')
      .eq('account_id', accountId)
      .lte('date', beforeDate)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(checkpoint: CheckpointInsert): Promise<DbBalanceCheckpoint> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .insert(checkpoint)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: CheckpointUpdate): Promise<DbBalanceCheckpoint> {
    const { data, error } = await supabase
      .from('balance_checkpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('balance_checkpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

### 7.3 Transactions API (src/api/transactions.ts)

```typescript
import { supabase } from '@/lib/supabase';
import { DbTransaction, TransactionInsert, TransactionUpdate } from '@/types/database';

export const transactionsApi = {
  async getAll(): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByAccountId(accountId: string): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getRecurring(): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_recurring', true)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(transaction: TransactionInsert): Promise<DbTransaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createMany(transactions: TransactionInsert[]): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TransactionUpdate): Promise<DbTransaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

### 7.4 Settings API (src/api/settings.ts)

```typescript
import { supabase } from '@/lib/supabase';
import { DbUserSettings, SettingsUpdate } from '@/types/database';

export const settingsApi = {
  async get(): Promise<DbUserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(updates: SettingsUpdate): Promise<DbUserSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

---

## 8. State Management

### 8.1 TanStack Query Setup (in App.tsx)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,         // 1 minute
      gcTime: 1000 * 60 * 5,        // 5 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### 8.2 Accounts Hook (src/hooks/useAccounts.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/api/accounts';
import { AccountInsert, AccountUpdate } from '@/types/database';
import toast from 'react-hot-toast';

const ACCOUNTS_KEY = ['accounts'];

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: accountsApi.getAll,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (account: AccountInsert) => accountsApi.create(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      toast.success('Account created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create account: ${error.message}`);
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AccountUpdate }) =>
      accountsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      toast.success('Account updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update account: ${error.message}`);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Account deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete account: ${error.message}`);
    },
  });
}
```

### 8.3 Checkpoints Hook (src/hooks/useCheckpoints.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkpointsApi } from '@/api/checkpoints';
import { CheckpointInsert, CheckpointUpdate } from '@/types/database';
import toast from 'react-hot-toast';

const CHECKPOINTS_KEY = ['checkpoints'];

export function useCheckpoints() {
  return useQuery({
    queryKey: CHECKPOINTS_KEY,
    queryFn: checkpointsApi.getAll,
  });
}

export function useCreateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkpoint: CheckpointInsert) => checkpointsApi.create(checkpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECKPOINTS_KEY });
      toast.success('Balance checkpoint added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add checkpoint: ${error.message}`);
    },
  });
}

export function useUpdateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CheckpointUpdate }) =>
      checkpointsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECKPOINTS_KEY });
      toast.success('Checkpoint updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update checkpoint: ${error.message}`);
    },
  });
}

export function useDeleteCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => checkpointsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECKPOINTS_KEY });
      toast.success('Checkpoint deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete checkpoint: ${error.message}`);
    },
  });
}
```

### 8.4 Transactions Hook (src/hooks/useTransactions.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions';
import { TransactionInsert, TransactionUpdate } from '@/types/database';
import toast from 'react-hot-toast';

const TRANSACTIONS_KEY = ['transactions'];

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: transactionsApi.getAll,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: TransactionInsert) => transactionsApi.create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      toast.success('Transaction added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add transaction: ${error.message}`);
    },
  });
}

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactions: TransactionInsert[]) => transactionsApi.createMany(transactions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      toast.success(`Imported ${data.length} transactions`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to import transactions: ${error.message}`);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TransactionUpdate }) =>
      transactionsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      // No toast for inline edits to avoid spam
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      toast.success('Transaction deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete transaction: ${error.message}`);
    },
  });
}
```

### 8.5 Settings Hook (src/hooks/useSettings.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { SettingsUpdate } from '@/types/database';
import toast from 'react-hot-toast';

const SETTINGS_KEY = ['settings'];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: SettingsUpdate) => settingsApi.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
      toast.success('Settings saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
}
```

---

## 9. Projection Engine Implementation

### 9.1 Date Utilities (src/lib/date-utils.ts)

```typescript
import {
  format,
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDate,
  lastDayOfMonth,
  getDay,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
} from 'date-fns';

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateString(dateString: string): Date {
  return parseISO(dateString);
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatChartDate(date: Date): string {
  return format(date, 'MMM d');
}

/**
 * Get the Nth occurrence of a weekday in a month
 * @param year - Full year (e.g., 2024)
 * @param month - Month (0-11)
 * @param weekday - Day of week (0=Sunday, 6=Saturday)
 * @param n - Occurrence (1-4 for first-fourth, -1 for last)
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  if (n === -1) {
    // Last occurrence: start from end of month and go backward
    const end = endOfMonth(new Date(year, month, 1));
    let date = end;
    while (getDay(date) !== weekday) {
      date = addDays(date, -1);
    }
    return date;
  }

  // Nth occurrence: start from beginning
  const start = startOfMonth(new Date(year, month, 1));
  let date = start;
  let count = 0;

  // Find first occurrence of weekday
  while (getDay(date) !== weekday) {
    date = addDays(date, 1);
  }
  count = 1;

  // Advance to Nth occurrence
  while (count < n) {
    date = addDays(date, 7);
    count++;
  }

  // Verify we're still in the same month
  if (date.getMonth() !== month) {
    throw new Error(`No ${n}th occurrence of weekday ${weekday} in ${year}-${month + 1}`);
  }

  return date;
}

/**
 * Get all days of month for given month that match specified days array
 * Handles days that don't exist (e.g., Feb 30 → Feb 28/29)
 */
export function getDaysOfMonth(year: number, month: number, days: number[]): Date[] {
  const lastDay = lastDayOfMonth(new Date(year, month, 1)).getDate();
  const result: Date[] = [];

  for (const day of days) {
    const actualDay = Math.min(day, lastDay);
    result.push(new Date(year, month, actualDay));
  }

  return result;
}

export {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDate,
  lastDayOfMonth,
  getDay,
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
};
```

### 9.2 Recurrence Utilities (src/lib/recurrence.ts)

```typescript
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  lastDayOfMonth,
  isBefore,
  isAfter,
  isSameDay,
  getNthWeekdayOfMonth,
  getDaysOfMonth,
  toDateString,
} from './date-utils';
import { RecurrenceRule, DbTransaction } from '@/types/database';

interface ExpandedInstance {
  date: Date;
  transaction: DbTransaction;
}

/**
 * Expand a recurring transaction into individual instances within a date range
 */
export function expandRecurringTransaction(
  transaction: DbTransaction,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedInstance[] {
  if (!transaction.is_recurring || !transaction.recurrence_rule) {
    return [];
  }

  const rule = transaction.recurrence_rule;
  const startDate = new Date(transaction.date);
  const endDate = transaction.end_date ? new Date(transaction.end_date) : rangeEnd;
  const instances: ExpandedInstance[] = [];

  // Determine effective end date (earlier of transaction end or range end)
  const effectiveEnd = isBefore(endDate, rangeEnd) ? endDate : rangeEnd;

  switch (rule.frequency) {
    case 'daily':
      expandDaily(startDate, rangeStart, effectiveEnd, rule.interval || 1, transaction, instances);
      break;

    case 'weekly':
      expandWeekly(startDate, rangeStart, effectiveEnd, rule.interval || 1, transaction, instances);
      break;

    case 'biweekly':
      expandWeekly(startDate, rangeStart, effectiveEnd, 2, transaction, instances);
      break;

    case 'monthly':
      expandMonthly(startDate, rangeStart, effectiveEnd, rule, transaction, instances);
      break;

    case 'yearly':
      expandYearly(startDate, rangeStart, effectiveEnd, rule.interval || 1, transaction, instances);
      break;
  }

  return instances;
}

function expandDaily(
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  interval: number,
  transaction: DbTransaction,
  instances: ExpandedInstance[]
): void {
  let current = startDate;

  // Fast-forward to range start if needed
  if (isBefore(current, rangeStart)) {
    const daysToStart = Math.ceil(
      (rangeStart.getTime() - current.getTime()) / (1000 * 60 * 60 * 24 * interval)
    ) * interval;
    current = addDays(current, daysToStart);
    
    // Adjust if we overshot
    while (isBefore(current, rangeStart)) {
      current = addDays(current, interval);
    }
  }

  while (!isAfter(current, rangeEnd)) {
    instances.push({ date: new Date(current), transaction });
    current = addDays(current, interval);
  }
}

function expandWeekly(
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  interval: number,
  transaction: DbTransaction,
  instances: ExpandedInstance[]
): void {
  let current = startDate;

  // Fast-forward to range start if needed
  if (isBefore(current, rangeStart)) {
    const weeksToStart = Math.ceil(
      (rangeStart.getTime() - current.getTime()) / (1000 * 60 * 60 * 24 * 7 * interval)
    ) * interval;
    current = addWeeks(current, weeksToStart);
    
    while (isBefore(current, rangeStart)) {
      current = addWeeks(current, interval);
    }
  }

  while (!isAfter(current, rangeEnd)) {
    instances.push({ date: new Date(current), transaction });
    current = addWeeks(current, interval);
  }
}

function expandMonthly(
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  rule: RecurrenceRule,
  transaction: DbTransaction,
  instances: ExpandedInstance[]
): void {
  const interval = rule.interval || 1;

  if (rule.lastDayOfMonth) {
    // Last day of each month
    let year = startDate.getFullYear();
    let month = startDate.getMonth();

    // Fast-forward to range start
    while (lastDayOfMonth(new Date(year, month, 1)) < rangeStart) {
      month += interval;
      if (month > 11) {
        year += Math.floor(month / 12);
        month = month % 12;
      }
    }

    while (true) {
      const date = lastDayOfMonth(new Date(year, month, 1));
      if (isAfter(date, rangeEnd)) break;
      if (!isBefore(date, rangeStart)) {
        instances.push({ date, transaction });
      }
      month += interval;
      if (month > 11) {
        year += Math.floor(month / 12);
        month = month % 12;
      }
    }
  } else if (rule.daysOfMonth && rule.daysOfMonth.length > 0) {
    // Specific days of month (e.g., 15th and 30th)
    let year = startDate.getFullYear();
    let month = startDate.getMonth();

    // Fast-forward to range start
    const firstStartDay = new Date(year, month, Math.min(...rule.daysOfMonth));
    while (isBefore(firstStartDay, rangeStart)) {
      month += interval;
      if (month > 11) {
        year += Math.floor(month / 12);
        month = month % 12;
      }
      firstStartDay.setFullYear(year);
      firstStartDay.setMonth(month);
    }

    while (true) {
      const dates = getDaysOfMonth(year, month, rule.daysOfMonth);
      let anyAdded = false;
      
      for (const date of dates) {
        if (isAfter(date, rangeEnd)) break;
        if (!isBefore(date, rangeStart) && !isBefore(date, startDate)) {
          instances.push({ date, transaction });
          anyAdded = true;
        }
      }
      
      // Check if we should continue
      const firstOfNextMonth = new Date(year, month + interval, 1);
      if (isAfter(firstOfNextMonth, rangeEnd)) break;
      
      month += interval;
      if (month > 11) {
        year += Math.floor(month / 12);
        month = month % 12;
      }
    }
  } else if (rule.weekday !== undefined && rule.weekOfMonth !== undefined) {
    // Nth weekday of month (e.g., 2nd Tuesday, last Friday)
    let year = startDate.getFullYear();
    let month = startDate.getMonth();

    while (true) {
      try {
        const date = getNthWeekdayOfMonth(year, month, rule.weekday, rule.weekOfMonth);
        if (isAfter(date, rangeEnd)) break;
        if (!isBefore(date, rangeStart) && !isBefore(date, startDate)) {
          instances.push({ date, transaction });
        }
      } catch (e) {
        // Skip months where the pattern doesn't exist (rare edge case)
      }
      
      month += interval;
      if (month > 11) {
        year += Math.floor(month / 12);
        month = month % 12;
      }
    }
  } else {
    // Default: same day of month as start date
    const dayOfMonth = startDate.getDate();
    let current = startDate;

    while (true) {
      if (isAfter(current, rangeEnd)) break;
      if (!isBefore(current, rangeStart)) {
        instances.push({ date: new Date(current), transaction });
      }
      current = addMonths(current, interval);
      
      // Handle day overflow (e.g., Jan 31 → Feb 28)
      const targetDay = Math.min(dayOfMonth, lastDayOfMonth(current).getDate());
      current.setDate(targetDay);
    }
  }
}

function expandYearly(
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  interval: number,
  transaction: DbTransaction,
  instances: ExpandedInstance[]
): void {
  let current = startDate;

  // Fast-forward to range start
  while (isBefore(current, rangeStart)) {
    current = addYears(current, interval);
  }

  while (!isAfter(current, rangeEnd)) {
    instances.push({ date: new Date(current), transaction });
    current = addYears(current, interval);
  }
}

/**
 * Expand all recurring transactions and merge with one-time transactions
 */
export function expandAllTransactions(
  transactions: DbTransaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ date: Date; transaction: DbTransaction; isExpanded: boolean }> {
  const results: Array<{ date: Date; transaction: DbTransaction; isExpanded: boolean }> = [];

  for (const transaction of transactions) {
    if (transaction.is_recurring) {
      const expanded = expandRecurringTransaction(transaction, rangeStart, rangeEnd);
      for (const instance of expanded) {
        results.push({
          date: instance.date,
          transaction: instance.transaction,
          isExpanded: true,
        });
      }
    } else {
      const txDate = new Date(transaction.date);
      if (!isBefore(txDate, rangeStart) && !isAfter(txDate, rangeEnd)) {
        results.push({
          date: txDate,
          transaction,
          isExpanded: false,
        });
      }
    }
  }

  // Sort by date
  results.sort((a, b) => a.date.getTime() - b.date.getTime());

  return results;
}
```

### 9.3 Projection Engine (src/lib/projection-engine.ts)

```typescript
import {
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  toDateString,
  formatChartDate,
} from './date-utils';
import { expandAllTransactions } from './recurrence';
import {
  DbAccount,
  DbBalanceCheckpoint,
  DbTransaction,
} from '@/types/database';
import {
  ProjectionDataPoint,
  ProjectionWarning,
  ProjectionResult,
  TimeRangeDays,
} from '@/types/domain';

interface AccountState {
  balance: number;
  lastCheckpointDate: Date | null;
}

export function calculateProjection(
  accounts: DbAccount[],
  checkpoints: DbBalanceCheckpoint[],
  transactions: DbTransaction[],
  timeRangeDays: TimeRangeDays,
  warningThreshold: number
): ProjectionResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rangeStart = today;
  const rangeEnd = addDays(today, timeRangeDays);

  // Initialize account states
  const accountStates: Map<string, AccountState> = new Map();
  
  for (const account of accounts) {
    // Find most recent checkpoint at or before today
    const relevantCheckpoints = checkpoints
      .filter(cp => cp.account_id === account.id)
      .filter(cp => !isAfter(new Date(cp.date), today))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latestCheckpoint = relevantCheckpoints[0];

    accountStates.set(account.id, {
      balance: latestCheckpoint ? latestCheckpoint.amount : 0,
      lastCheckpointDate: latestCheckpoint ? new Date(latestCheckpoint.date) : null,
    });
  }

  // Build checkpoint map for quick lookup (date string → account → amount)
  const checkpointMap: Map<string, Map<string, number>> = new Map();
  for (const cp of checkpoints) {
    const dateStr = cp.date;
    if (!checkpointMap.has(dateStr)) {
      checkpointMap.set(dateStr, new Map());
    }
    checkpointMap.get(dateStr)!.set(cp.account_id, cp.amount);
  }

  // Expand recurring transactions
  const expandedTransactions = expandAllTransactions(transactions, rangeStart, rangeEnd);

  // Build transaction map (date string → list of transactions)
  const transactionMap: Map<string, Array<{ accountId: string; amount: number }>> = new Map();
  for (const { date, transaction } of expandedTransactions) {
    const dateStr = toDateString(date);
    if (!transactionMap.has(dateStr)) {
      transactionMap.set(dateStr, []);
    }
    transactionMap.get(dateStr)!.push({
      accountId: transaction.account_id,
      amount: transaction.amount,
    });
  }

  // Calculate daily balances
  const dataPoints: ProjectionDataPoint[] = [];
  const warnings: ProjectionWarning[] = [];
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  let currentDate = rangeStart;
  while (!isAfter(currentDate, rangeEnd)) {
    const dateStr = toDateString(currentDate);

    // Apply checkpoints for this date (resets balance to checkpoint value)
    const dayCheckpoints = checkpointMap.get(dateStr);
    if (dayCheckpoints) {
      for (const [accountId, amount] of dayCheckpoints) {
        const state = accountStates.get(accountId);
        if (state) {
          state.balance = amount;
          state.lastCheckpointDate = new Date(currentDate);
        }
      }
    }

    // Apply transactions for this date
    const dayTransactions = transactionMap.get(dateStr);
    if (dayTransactions) {
      for (const { accountId, amount } of dayTransactions) {
        const state = accountStates.get(accountId);
        if (state) {
          state.balance += amount;
        }
      }
    }

    // Record data point
    const balances: Record<string, number> = {};
    let total = 0;

    for (const [accountId, state] of accountStates) {
      balances[accountId] = Math.round(state.balance * 100) / 100; // Round to 2 decimals
      total += state.balance;

      // Check for warnings
      if (state.balance < warningThreshold) {
        const account = accountMap.get(accountId);
        warnings.push({
          date: new Date(currentDate),
          accountId,
          accountName: account?.name || 'Unknown',
          balance: state.balance,
          threshold: warningThreshold,
        });
      }
    }

    dataPoints.push({
      date: new Date(currentDate),
      dateString: formatChartDate(currentDate),
      balances,
      total: Math.round(total * 100) / 100,
    });

    currentDate = addDays(currentDate, 1);
  }

  // Deduplicate warnings (one per account per day is enough info)
  const uniqueWarnings = deduplicateWarnings(warnings);

  return {
    dataPoints,
    warnings: uniqueWarnings,
    accounts,
  };
}

function deduplicateWarnings(warnings: ProjectionWarning[]): ProjectionWarning[] {
  const seen = new Set<string>();
  return warnings.filter(w => {
    const key = `${toDateString(w.date)}-${w.accountId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get earliest warning for each account (for summary display)
 */
export function getEarliestWarningsPerAccount(
  warnings: ProjectionWarning[]
): ProjectionWarning[] {
  const earliest: Map<string, ProjectionWarning> = new Map();
  
  for (const warning of warnings) {
    const existing = earliest.get(warning.accountId);
    if (!existing || isBefore(warning.date, existing.date)) {
      earliest.set(warning.accountId, warning);
    }
  }

  return Array.from(earliest.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}
```

### 9.4 Projection Hook (src/hooks/useProjection.ts)

```typescript
import { useMemo } from 'react';
import { useAccounts } from './useAccounts';
import { useCheckpoints } from './useCheckpoints';
import { useTransactions } from './useTransactions';
import { useSettings } from './useSettings';
import { calculateProjection } from '@/lib/projection-engine';
import { TimeRangeDays, ProjectionResult } from '@/types/domain';

export function useProjection(timeRangeDays: TimeRangeDays): {
  projection: ProjectionResult | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { data: checkpoints, isLoading: checkpointsLoading, error: checkpointsError } = useCheckpoints();
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions();
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useSettings();

  const isLoading = accountsLoading || checkpointsLoading || transactionsLoading || settingsLoading;
  const error = accountsError || checkpointsError || transactionsError || settingsError;

  const projection = useMemo(() => {
    if (!accounts || !checkpoints || !transactions || !settings) {
      return null;
    }

    return calculateProjection(
      accounts,
      checkpoints,
      transactions,
      timeRangeDays,
      settings.warning_threshold
    );
  }, [accounts, checkpoints, transactions, settings, timeRangeDays]);

  return { projection, isLoading, error };
}
```

---

## 10. Component Specifications

### 10.1 EditableCell Component

The core inline editing experience. Renders as text by default, transforms to input on click.

```typescript
// src/components/table/EditableCell.tsx

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  formatDisplay?: (value: string) => string;
}

// Behavior:
// 1. Displays formatted value as static text
// 2. On click: transforms to <input> with current value selected
// 3. On blur or Enter: calls onChange with new value, reverts to text
// 4. On Escape: reverts to text without saving
// 5. Tab navigates to next editable cell

// Visual states:
// - Idle: text with subtle hover background
// - Editing: input with focus ring
// - Saving: subtle pulse animation (optional)
// - Error: red border (if validation fails)
```

### 10.2 DataTable Component

Main table displaying checkpoints, one-time transactions, and recurring transaction templates.

```typescript
// src/components/table/DataTable.tsx

// Columns:
// 1. Type icon (checkpoint/transaction/recurring badge)
// 2. Date (editable)
// 3. Account (dropdown select)
// 4. Description (editable text, read-only for checkpoints)
// 5. Amount (editable number, formatted as currency)
// 6. Category (dropdown select, hidden for checkpoints)
// 7. Recurrence (badge showing pattern, click opens modal)
// 8. Actions (delete, configure recurrence)

// Features:
// - Column sorting (click header)
// - Column filtering (filter bar above table)
// - Sticky header
// - Virtualized rows for performance (if >100 rows)
// - Row hover highlight
// - Alternating row colors (subtle)
```

### 10.3 CashFlowChart Component

Recharts-based line chart with multiple series.

```typescript
// src/components/dashboard/CashFlowChart.tsx

// Series:
// - One line per account (solid, distinct colors)
// - Total line (dashed, white/gray)

// Features:
// - Responsive width
// - Fixed height (300px)
// - X-axis: dates (formatted "MMM d")
// - Y-axis: currency (auto-scaled)
// - Tooltip: shows all values for hovered date
// - Reference area: red zone below warning threshold
// - Legend: clickable to show/hide series

// Colors (assigned to accounts in order):
const ACCOUNT_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];
```

### 10.4 RecurrenceForm Component

Complex schedule configuration UI.

```typescript
// src/components/forms/RecurrenceForm.tsx

// Layout:
// 1. Frequency dropdown: Daily, Weekly, Bi-weekly, Monthly, Yearly
// 2. Interval input: "Every [N] [periods]" (hidden for bi-weekly)
// 3. Monthly options (shown only when frequency=monthly):
//    a. Radio: "On day(s) of month" → multi-select chips for 1-31
//    b. Radio: "On the [Nth] [weekday]" → two dropdowns
//    c. Radio: "Last day of month" → checkbox
// 4. End date: optional date picker

// Output: RecurrenceRule object

// Validation:
// - At least one monthly option must be selected if frequency=monthly
// - Interval must be >= 1
// - Days of month must be 1-31
```

### 10.5 CSVImportModal Component

CSV file upload and preview interface.

```typescript
// src/components/modals/CSVImportModal.tsx

// Steps:
// 1. File upload zone (drag & drop or click to browse)
// 2. Parse file on selection
// 3. Show preview table with:
//    - Valid rows (green checkmark)
//    - Invalid rows (red X with error message)
// 4. Summary: "X valid, Y invalid"
// 5. Import button (disabled if 0 valid rows)
// 6. Option to download error report

// Error display per row:
// - Missing required field
// - Invalid date format
// - Invalid amount (not a number)
// - Account not found
// - Invalid is_recurring value
// - Missing frequency for recurring
```

---

## 11. Styling System

### 11.1 Tailwind Configuration

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        'surface-hover': '#222222',
        border: '#2a2a2a',
        'border-focus': '#3b82f6',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a0a0a0',
        'text-muted': '#666666',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        success: '#22c55e',
        'success-muted': 'rgba(34, 197, 94, 0.1)',
        danger: '#ef4444',
        'danger-muted': 'rgba(239, 68, 68, 0.1)',
        warning: '#f59e0b',
        'warning-muted': 'rgba(245, 158, 11, 0.1)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        lg: ['16px', '24px'],
        xl: ['18px', '28px'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        'modal': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
```

### 11.2 Global Styles

```css
/* src/styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply bg-background text-text-primary;
    font-feature-settings: 'tnum' on, 'lnum' on; /* Tabular numbers */
  }

  body {
    @apply antialiased;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-background;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-text-muted;
  }

  /* Remove input styling defaults */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium transition-colors duration-150;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background;
  }

  .btn-primary {
    @apply bg-accent text-white hover:bg-accent-hover focus:ring-accent;
  }

  .btn-secondary {
    @apply bg-surface text-text-primary border border-border;
    @apply hover:bg-surface-hover focus:ring-border;
  }

  .btn-danger {
    @apply bg-danger text-white hover:bg-red-600 focus:ring-danger;
  }

  .btn-ghost {
    @apply bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary;
  }

  .input {
    @apply w-full px-3 py-2 bg-surface border border-border rounded;
    @apply text-text-primary placeholder-text-muted;
    @apply focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus;
    @apply transition-colors duration-150;
  }

  .select {
    @apply input appearance-none cursor-pointer;
    @apply bg-no-repeat bg-right pr-10;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a0a0a0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-size: 1.5em 1.5em;
  }

  .label {
    @apply block text-sm font-medium text-text-secondary mb-1;
  }

  .card {
    @apply bg-surface border border-border rounded-lg;
  }

  .table-row {
    @apply border-b border-border hover:bg-surface-hover transition-colors;
  }

  .table-cell {
    @apply px-4 py-3 text-sm;
  }

  .table-header {
    @apply px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide;
    @apply bg-surface sticky top-0;
  }
}

@layer utilities {
  .text-positive {
    @apply text-success;
  }

  .text-negative {
    @apply text-danger;
  }

  .font-tabular {
    font-variant-numeric: tabular-nums;
  }
}
```

---

## 12. CSV Parser Implementation

### 12.1 Parser Module (src/lib/csv-parser.ts)

```typescript
import { CSVRow, CSVParseResult } from '@/types/forms';
import { TransactionInsert, RecurrenceRule } from '@/types/database';
import { DbAccount } from '@/types/database';

const REQUIRED_HEADERS = [
  'date',
  'description',
  'amount',
  'account',
  'category',
  'is_recurring',
  'frequency',
  'end_date',
];

const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export function parseCSV(
  csvText: string,
  accounts: DbAccount[],
  userId: string
): CSVParseResult {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    return {
      valid: [],
      errors: [{
        row: 0,
        data: {} as CSVRow,
        errors: ['File must contain a header row and at least one data row'],
      }],
    };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Validate headers
  const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [{
        row: 0,
        data: {} as CSVRow,
        errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
      }],
    };
  }

  // Build account lookup map
  const accountMap = new Map(accounts.map(a => [a.name.toLowerCase(), a]));

  const valid: TransactionInsert[] = [];
  const errors: CSVParseResult['errors'] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    const row: CSVRow = {
      date: getValue(headers, values, 'date'),
      description: getValue(headers, values, 'description'),
      amount: getValue(headers, values, 'amount'),
      account: getValue(headers, values, 'account'),
      category: getValue(headers, values, 'category'),
      is_recurring: getValue(headers, values, 'is_recurring'),
      frequency: getValue(headers, values, 'frequency'),
      end_date: getValue(headers, values, 'end_date'),
    };

    const rowErrors = validateRow(row, accountMap);

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, data: row, errors: rowErrors });
    } else {
      const transaction = convertToTransaction(row, accountMap, userId);
      valid.push(transaction);
    }
  }

  return { valid, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function getValue(headers: string[], values: string[], key: string): string {
  const index = headers.indexOf(key);
  return index >= 0 && index < values.length ? values[index] : '';
}

function validateRow(row: CSVRow, accountMap: Map<string, DbAccount>): string[] {
  const errors: string[] = [];

  // Date validation
  if (!row.date) {
    errors.push('Date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  } else {
    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date');
    }
  }

  // Description validation
  if (!row.description) {
    errors.push('Description is required');
  } else if (row.description.length > 200) {
    errors.push('Description must be 200 characters or less');
  }

  // Amount validation
  if (!row.amount) {
    errors.push('Amount is required');
  } else {
    const amount = parseFloat(row.amount);
    if (isNaN(amount)) {
      errors.push('Amount must be a number');
    } else if (amount === 0) {
      errors.push('Amount cannot be zero');
    }
  }

  // Account validation
  if (!row.account) {
    errors.push('Account is required');
  } else if (!accountMap.has(row.account.toLowerCase())) {
    errors.push(`Account "${row.account}" not found`);
  }

  // Recurring validation
  const isRecurring = row.is_recurring.toLowerCase() === 'true';
  if (row.is_recurring && !['true', 'false'].includes(row.is_recurring.toLowerCase())) {
    errors.push('is_recurring must be "true" or "false"');
  }

  if (isRecurring) {
    if (!row.frequency) {
      errors.push('Frequency is required for recurring transactions');
    } else if (!VALID_FREQUENCIES.includes(row.frequency.toLowerCase())) {
      errors.push(`Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`);
    }
  }

  // End date validation (optional)
  if (row.end_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.end_date)) {
      errors.push('End date must be in YYYY-MM-DD format');
    } else {
      const endDate = new Date(row.end_date);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date');
      }
    }
  }

  return errors;
}

function convertToTransaction(
  row: CSVRow,
  accountMap: Map<string, DbAccount>,
  userId: string
): TransactionInsert {
  const account = accountMap.get(row.account.toLowerCase())!;
  const isRecurring = row.is_recurring.toLowerCase() === 'true';

  let recurrenceRule: RecurrenceRule | null = null;
  if (isRecurring && row.frequency) {
    recurrenceRule = {
      frequency: row.frequency.toLowerCase() as RecurrenceRule['frequency'],
    };
  }

  return {
    user_id: userId,
    account_id: account.id,
    description: row.description,
    amount: parseFloat(row.amount),
    category: row.category || null,
    date: row.date,
    is_recurring: isRecurring,
    recurrence_rule: recurrenceRule,
    end_date: row.end_date || null,
  };
}

/**
 * Generate a sample CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = REQUIRED_HEADERS.join(',');
  const sampleRows = [
    '2024-01-15,Monthly Salary,5000.00,Chase Checking,Income,true,monthly,',
    '2024-01-01,Rent,-1800.00,Chase Checking,Rent/Mortgage,true,monthly,',
    '2024-01-20,Netflix,-15.99,Chase Checking,Subscriptions,true,monthly,2024-12-31',
    '2024-01-25,Car Repair,-450.00,Chase Checking,Auto,false,,',
  ];

  return [headers, ...sampleRows].join('\n');
}
```

---

## 13. Error Handling Patterns

### 13.1 API Error Handling

```typescript
// src/lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const supaError = error as { code: string; message: string };
    
    switch (supaError.code) {
      case '23505': // unique_violation
        throw new AppError('A record with this value already exists', 'DUPLICATE', 409);
      case '23503': // foreign_key_violation
        throw new AppError('Referenced record does not exist', 'INVALID_REFERENCE', 400);
      case 'PGRST116': // not found
        throw new AppError('Record not found', 'NOT_FOUND', 404);
      default:
        throw new AppError(supaError.message || 'Database error', supaError.code, 500);
    }
  }
  
  throw new AppError('An unexpected error occurred', 'UNKNOWN', 500);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
```

### 13.2 Form Validation

```typescript
// src/lib/validation.ts

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateAccountForm(data: AccountFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Account name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Account name must be 100 characters or less';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTransactionForm(data: TransactionFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.accountId) {
    errors.accountId = 'Account is required';
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length > 200) {
    errors.description = 'Description must be 200 characters or less';
  }

  const amount = parseFloat(data.amount);
  if (!data.amount || isNaN(amount)) {
    errors.amount = 'Valid amount is required';
  } else if (amount === 0) {
    errors.amount = 'Amount cannot be zero';
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  if (data.isRecurring && !data.recurrenceRule) {
    errors.recurrenceRule = 'Recurrence pattern is required for recurring transactions';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCheckpointForm(data: CheckpointFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.accountId) {
    errors.accountId = 'Account is required';
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  const amount = parseFloat(data.amount);
  if (!data.amount || isNaN(amount)) {
    errors.amount = 'Valid amount is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

---

## 14. Performance Considerations

### 14.1 Memoization Strategy

```typescript
// Key computations that should be memoized:

// 1. Projection calculation (expensive)
const projection = useMemo(() => 
  calculateProjection(accounts, checkpoints, transactions, timeRange, threshold),
  [accounts, checkpoints, transactions, timeRange, threshold]
);

// 2. Table data transformation
const tableData = useMemo(() => 
  transformToTableEntries(accounts, checkpoints, transactions),
  [accounts, checkpoints, transactions]
);

// 3. Filtered/sorted table data
const displayData = useMemo(() => {
  let data = tableData;
  if (filters.accountId) {
    data = data.filter(d => d.accountId === filters.accountId);
  }
  if (filters.category) {
    data = data.filter(d => d.category === filters.category);
  }
  return sortBy(data, sortConfig.key, sortConfig.direction);
}, [tableData, filters, sortConfig]);

// 4. Chart data transformation
const chartData = useMemo(() => 
  projection?.dataPoints.map(dp => ({
    date: dp.dateString,
    ...dp.balances,
    total: dp.total,
  })) ?? [],
  [projection]
);
```

### 14.2 Optimistic Updates

```typescript
// Example: Optimistic update for transaction edit
const updateTransaction = useMutation({
  mutationFn: ({ id, updates }) => transactionsApi.update(id, updates),
  
  onMutate: async ({ id, updates }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['transactions'] });
    
    // Snapshot previous value
    const previousTransactions = queryClient.getQueryData(['transactions']);
    
    // Optimistically update
    queryClient.setQueryData(['transactions'], (old: DbTransaction[]) =>
      old.map(t => t.id === id ? { ...t, ...updates } : t)
    );
    
    return { previousTransactions };
  },
  
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['transactions'], context?.previousTransactions);
    toast.error('Failed to update');
  },
  
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});
```

### 14.3 Debounced Inline Editing

```typescript
// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in EditableCell:
// Only trigger save after 300ms of no typing
const debouncedValue = useDebounce(inputValue, 300);

useEffect(() => {
  if (debouncedValue !== originalValue && !isEditing) {
    onSave(debouncedValue);
  }
}, [debouncedValue]);
```

---

## 15. Deployment Configuration

### 15.1 Vercel Configuration

```json
// vercel.json

{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 15.2 Environment Variables in Vercel

Set these in the Vercel dashboard under Project Settings → Environment Variables:

| Variable | Environment | Value |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Production, Preview, Development | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Development | Your Supabase anon key |

### 15.3 Supabase Configuration

In Supabase Dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

2. **Authentication → Email Templates**
   - Customize confirmation and password reset emails if desired

3. **Database → Replication**
   - Enable realtime for tables if live updates are needed (optional)

---

## Appendix: Constants

### src/lib/constants.ts

```typescript
export const CATEGORIES = [
  'Income',
  'Salary',
  'Bills & Utilities',
  'Rent/Mortgage',
  'Insurance',
  'Subscriptions',
  'Groceries',
  'Dining',
  'Transportation',
  'Auto',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Travel',
  'Education',
  'Gifts',
  'Taxes',
  'Transfer',
  'Other',
] as const;

export const TIME_RANGE_OPTIONS: { value: TimeRangeDays; label: string }[] = [
  { value: 15, label: '15 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 180, label: '6 Months' },
  { value: 360, label: '1 Year' },
];

export const DEFAULT_TIME_RANGE: TimeRangeDays = 30;

export const DEFAULT_WARNING_THRESHOLD = 500;

export const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#14b8a6', // teal
];

export const TOTAL_LINE_COLOR = '#6b7280'; // gray

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEK_OF_MONTH_LABELS: Record<number, string> = {
  1: 'First',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  [-1]: 'Last',
};
```

---

This document provides complete technical specifications for implementing the Cash Flow Tracker application. All architectural decisions, data structures, algorithms, and implementation patterns are defined. A developer can use this document as the authoritative technical reference throughout implementation.