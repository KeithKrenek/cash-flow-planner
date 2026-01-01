# Cash Flow Tracker — Project Brief

---

## Overview

Cash Flow Tracker is a personal finance web application that helps users forecast their financial position across multiple bank accounts. By combining manual balance entries, one-time transactions, and recurring payments with configurable schedules, users can visualize their projected cash flow and ensure they maintain sufficient funds at all times.

The application is designed for personal use with a single authenticated user per account. It does not connect to bank APIs; instead, users manually enter balance checkpoints and transactions, giving them full control over their financial data.

---

## Core Concepts

### Accounts
Bank accounts the user wants to track (e.g., "Chase Checking", "Ally Savings", "Credit Union Checking"). Each account maintains its own transaction history and projected balance. Accounts are independent of one another—there is no hierarchical relationship between accounts at the same institution.

### Balance Checkpoints
A snapshot of an account's actual balance on a specific date. Checkpoints anchor the projection calculations. For example, if a user logs in and sees their Chase Checking account has $3,450.23 today, they create a checkpoint for that amount on today's date. All future projections for that account calculate forward from this anchor point.

Users should periodically add new checkpoints to keep projections accurate. The system always uses the most recent checkpoint at or before the projection start date.

### Transactions
Financial events that add or remove money from an account. Transactions can be:

- **One-time**: A single occurrence on a specific date (e.g., "Car repair on Jan 25")
- **Recurring**: Repeating on a schedule until an optional end date (e.g., "Rent on the 1st of every month")

All transactions live in a single unified table. Recurring transactions are marked with a flag and include schedule configuration.

### Projections
The calculated future balance of each account over time. The projection engine takes balance checkpoints, expands recurring transactions into individual instances, merges them with one-time transactions, and computes daily running balances for each account plus a combined total.

### Warning Threshold
A global minimum balance the user sets. When any account's projected balance drops below this threshold, the chart displays a visual warning (red shaded zone), alerting the user to potential cash flow problems.

---

## Features

### Authentication
- Email and password registration
- Email and password login
- Secure session management
- Logout functionality
- All data is private and isolated per user

### Account Management
- Create accounts with a custom name
- Edit account names
- Delete accounts (cascades to related checkpoints and transactions)
- View all accounts in a list

### Balance Checkpoints
- Add a checkpoint: select account, date, and amount
- Edit existing checkpoints
- Delete checkpoints
- View checkpoints in the main transaction table (distinguished visually)

### Transaction Management
- Add one-time transactions: account, date, description, amount, category
- Add recurring transactions: same fields plus recurrence configuration
- Edit any field inline by clicking the cell
- Delete transactions
- Toggle a transaction between one-time and recurring
- Configure complex recurrence schedules via a modal editor

### Recurrence Scheduling
Simple frequencies:
- Daily
- Weekly
- Bi-weekly (every 2 weeks)
- Monthly
- Yearly

Complex patterns:
- Specific days of month (e.g., 15th and 30th)
- Last day of month
- Nth weekday of month (e.g., "2nd Tuesday")
- Last weekday of month (e.g., "last Friday")
- Custom interval (e.g., "every 3 months")

Optional end date for recurring transactions.

### Cash Flow Visualization
- Line chart showing projected balance over time
- Separate line for each account (distinct colors)
- Dashed line for combined total across all accounts
- Time range selector: 15, 30 (default), 90, 180, or 360 days
- Red shaded warning zone below the global threshold
- Interactive tooltips showing exact values on hover

### Transaction Table
Displays three types of entries in a unified view:
1. Balance checkpoints (visual indicator distinguishing them)
2. One-time transactions
3. Recurring transactions (showing the template, not expanded instances)

Table capabilities:
- Inline editing: click any cell to modify its value
- Sorting by any column (date, description, amount, account, category)
- Filtering by account, category, or date range
- Visual indicators for recurring transactions
- Real-time chart updates when data changes

### CSV Import
Bulk import transactions from a CSV file conforming to the required format. The import modal allows users to:
- Upload a CSV file
- Preview parsed data before confirming
- See validation errors for malformed rows
- Import valid rows while skipping invalid ones

### Global Settings
- Warning threshold: minimum balance that triggers visual alerts
- Persisted per user

---

## User Workflows

### Initial Setup
1. User creates an account (email/password registration)
2. User adds their bank accounts (e.g., "Chase Checking", "Ally Savings")
3. User sets the global warning threshold (e.g., $500)
4. For each bank account, user adds a balance checkpoint with today's date and current balance
5. User adds recurring transactions (rent, salary, subscriptions, etc.)
6. User adds any known upcoming one-time transactions

### Regular Use
1. User logs in and views the cash flow chart
2. User scans for any red warning zones in the projection
3. If warnings exist, user adjusts transaction dates or amounts to resolve cash flow issues
4. Periodically (e.g., weekly), user adds new balance checkpoints to keep projections accurate
5. User adds new transactions as they arise

### Editing Transactions
1. User locates the transaction in the table (using sort/filter if needed)
2. User clicks the cell they want to edit
3. Cell transforms into an input field
4. User types the new value
5. User presses Enter or clicks away to save
6. Chart updates immediately to reflect the change

### Importing Transactions
1. User clicks "Import CSV" button
2. User selects a properly formatted CSV file
3. Preview modal shows parsed transactions
4. User reviews and confirms import
5. Transactions are added to the database
6. Chart and table update to include new data

### Adjusting Projections
1. User notices a payment date might cause a low balance
2. User clicks the date cell for that transaction
3. User changes the date to a safer time (e.g., after payday)
4. Chart instantly updates showing the new projection
5. User confirms the warning zone is resolved

---

## Data Models

### Account
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (foreign key to auth.users) |
| name | String | Display name (e.g., "Chase Checking") |
| created_at | Timestamp | Record creation time |
| updated_at | Timestamp | Last modification time |

### Balance Checkpoint
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| account_id | UUID | Associated account |
| date | Date | Date of the balance snapshot |
| amount | Decimal | Account balance on that date |
| notes | String (nullable) | Optional description |
| created_at | Timestamp | Record creation time |
| updated_at | Timestamp | Last modification time |

### Transaction
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| account_id | UUID | Associated account |
| description | String | Transaction description |
| amount | Decimal | Positive = income, negative = expense |
| category | String (nullable) | Category label |
| date | Date | Transaction date (or start date if recurring) |
| is_recurring | Boolean | Whether this repeats |
| recurrence_rule | JSON (nullable) | Schedule configuration (see below) |
| end_date | Date (nullable) | When recurrence stops |
| created_at | Timestamp | Record creation time |
| updated_at | Timestamp | Last modification time |

### User Settings
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (unique) |
| warning_threshold | Decimal | Global minimum balance for warnings |
| created_at | Timestamp | Record creation time |
| updated_at | Timestamp | Last modification time |

### Recurrence Rule Structure
```json
{
  "frequency": "daily" | "weekly" | "biweekly" | "monthly" | "yearly",
  "interval": 1,
  "daysOfMonth": [15, 30],
  "lastDayOfMonth": false,
  "weekday": 0-6,
  "weekOfMonth": 1-4 or -1
}
```

**Field usage by pattern:**

| Pattern | Fields Used |
|---------|-------------|
| Every N days | frequency: "daily", interval: N |
| Every N weeks | frequency: "weekly", interval: N |
| Every 2 weeks | frequency: "biweekly" |
| Monthly on day(s) | frequency: "monthly", daysOfMonth: [1, 15] |
| Last day of month | frequency: "monthly", lastDayOfMonth: true |
| Nth weekday of month | frequency: "monthly", weekday: 0-6, weekOfMonth: 1-4 |
| Last weekday of month | frequency: "monthly", weekday: 0-6, weekOfMonth: -1 |
| Yearly on date | frequency: "yearly" |

---

## Pre-populated Categories

- Income
- Salary
- Bills & Utilities
- Rent/Mortgage
- Insurance
- Subscriptions
- Groceries
- Dining
- Transportation
- Auto
- Healthcare
- Entertainment
- Shopping
- Travel
- Education
- Gifts
- Taxes
- Transfer
- Other

---

## CSV Import Format

**Required columns in exact order:**
```
date,description,amount,account,category,is_recurring,frequency,end_date
```

**Column specifications:**

| Column | Required | Format | Example |
|--------|----------|--------|---------|
| date | Yes | YYYY-MM-DD | 2024-01-15 |
| description | Yes | String | Monthly Salary |
| amount | Yes | Decimal (positive = income, negative = expense) | 5000.00 or -49.99 |
| account | Yes | String (must match existing account name exactly) | Chase Checking |
| category | No | String (from category list or custom) | Income |
| is_recurring | Yes | true or false | true |
| frequency | If recurring | daily, weekly, biweekly, monthly, yearly | monthly |
| end_date | No | YYYY-MM-DD or empty | 2024-12-31 |

**Example file:**
```csv
date,description,amount,account,category,is_recurring,frequency,end_date
2024-01-15,Salary,5000.00,Chase Checking,Income,true,monthly,
2024-01-01,Rent,-1800.00,Chase Checking,Rent/Mortgage,true,monthly,
2024-01-20,Netflix,-15.99,Chase Checking,Subscriptions,true,monthly,
2024-01-25,Car Repair,-450.00,Chase Checking,Auto,false,,
2024-02-01,Tax Refund,2500.00,Ally Savings,Income,false,,
```

**Validation rules:**
- Date must be valid and in correct format
- Amount must be a valid number
- Account must match an existing account name (case-sensitive)
- is_recurring must be exactly "true" or "false"
- If is_recurring is true, frequency is required
- Complex recurrence patterns cannot be imported via CSV; configure them in-app after import

---

## Technical Specifications

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool and dev server |
| Tailwind CSS | 3.x | Styling |
| Recharts | 2.x | Chart visualization |
| TanStack Table | 8.x | Table with sorting/filtering |
| TanStack Query | 5.x | Data fetching and caching |
| date-fns | 3.x | Date manipulation |
| React Hot Toast | 2.x | Toast notifications |

### Backend Stack
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database, authentication, row-level security |

### Hosting
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting and deployment |
| Supabase Cloud | Database hosting |

---

## Database Security

Row-Level Security (RLS) policies ensure users can only access their own data:

```sql
-- Example policy for transactions table
CREATE POLICY "Users can only access their own transactions"
ON transactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

Similar policies apply to all tables: accounts, balance_checkpoints, transactions, user_settings.

---

## UI Specifications

### Color Palette (Dark Theme)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Near black | #0f0f0f |
| Surface (cards, modals) | Dark gray | #1a1a1a |
| Border | Medium gray | #2a2a2a |
| Text Primary | Off-white | #f5f5f5 |
| Text Secondary | Muted gray | #a0a0a0 |
| Accent | Blue | #3b82f6 |
| Income/Positive | Green | #22c55e |
| Expense/Negative | Red | #ef4444 |
| Warning Zone | Red at 10% opacity | #ef444419 |

### Typography
- Font family: System font stack (SF Pro, Segoe UI, Roboto, etc.)
- Base size: 14px
- Headings: 18px (h1), 16px (h2), 14px bold (h3)
- Monospace for amounts: Font with tabular numbers

### Layout
- Single-page application
- Maximum content width: 1400px, centered
- Header: Logo/title, user menu, logout button
- Main content: Chart (top), table (bottom)
- Chart height: 300px
- Table: Fills remaining viewport with internal scroll

### Interactive Elements
- Buttons: Rounded corners (6px), subtle hover state
- Inputs: Dark background (#1a1a1a), border on focus
- Table cells: Hover highlight, click to edit
- Modals: Centered, backdrop blur, escape to close

---

## Projection Engine Algorithm

```
Input:
  - accounts: list of user's accounts
  - checkpoints: list of balance checkpoints
  - transactions: list of all transactions (one-time and recurring)
  - startDate: projection start (typically today)
  - endDate: projection end (based on selected time range)
  - warningThreshold: global minimum balance

Process:

1. INITIALIZE ACCOUNT BALANCES
   For each account:
     Find the most recent checkpoint where checkpoint.date <= startDate
     If found: set account.startingBalance = checkpoint.amount
               set account.startingDate = checkpoint.date
     Else: set account.startingBalance = 0
           set account.startingDate = startDate

2. EXPAND RECURRING TRANSACTIONS
   For each transaction where is_recurring = true:
     Generate all instances between max(transaction.date, startDate) and 
       min(transaction.end_date or endDate, endDate)
     Apply recurrence_rule to calculate each instance date
     Handle edge cases:
       - If day doesn't exist in month (e.g., Feb 30), use last day of month
       - If lastDayOfMonth = true, calculate actual last day for each month
     Add each instance as a temporary transaction object

3. MERGE TRANSACTIONS
   Combine:
     - One-time transactions within date range
     - Expanded recurring transaction instances
     - Balance checkpoints (treated as "set balance to X" operations)
   Sort by date ascending, then by type (checkpoints first, then transactions)

4. CALCULATE DAILY BALANCES
   Create a map: date -> { accountBalances: {}, total: 0, warnings: [] }
   Set currentBalances = { accountId: startingBalance } for each account
   
   For each day from startDate to endDate:
     Apply any checkpoints for this day (reset account balance)
     Apply all transactions for this day (add/subtract from account)
     Record currentBalances snapshot for this day
     Calculate total across all accounts
     If any account balance < warningThreshold:
       Add warning: { date, accountId, balance }

5. RETURN PROJECTION DATA
   {
     dates: [array of dates],
     series: {
       [accountId]: [array of balances],
       total: [array of combined balances]
     },
     warnings: [array of { date, accountId, balance }]
   }
```

---

## Error Handling

### User-Facing Errors
- Toast notifications for transient errors (network issues, save failures)
- Inline validation messages for form inputs
- Modal error states for critical failures

### Validation Rules
- Account name: Required, 1-100 characters, unique per user
- Checkpoint amount: Required, valid decimal
- Checkpoint date: Required, valid date
- Transaction description: Required, 1-200 characters
- Transaction amount: Required, valid decimal, non-zero
- Transaction date: Required, valid date
- Recurrence frequency: Required if is_recurring is true
- CSV import: Skip invalid rows, report errors to user

### Recovery
- Optimistic updates with rollback on failure
- Retry logic for network requests (3 attempts with exponential backoff)
- Clear error messages guiding user to resolution

---

## Accessibility Considerations

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management in modals
- Sufficient color contrast (WCAG AA)
- Screen reader announcements for dynamic updates

---

## Future Considerations (Out of Scope for Initial Build)

The following features are explicitly out of scope but noted for potential future development:

- Multiple currencies
- Bank API integrations
- Mobile native apps
- Data export functionality
- Shared/family accounts
- Budget tracking and goals
- Bill reminders and notifications
- Receipt attachment
- Reporting and analytics

---

This document contains all specifications required to build the Cash Flow Tracker application. A developer should be able to implement the complete system using this brief as the authoritative reference.