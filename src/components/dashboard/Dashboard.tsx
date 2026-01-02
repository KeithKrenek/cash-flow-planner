import { useState } from 'react';
import { useProjection, useSettings } from '@/hooks';
import { DEFAULT_TIME_RANGE, DEFAULT_WARNING_THRESHOLD } from '@/lib/constants';
import type { TimeRangeDays } from '@/types';
import { CashFlowChart } from './CashFlowChart';
import { TimeRangeSelector } from './TimeRangeSelector';
import { AccountLegend } from './AccountLegend';
import { WarningBanner } from './WarningBanner';
import { Spinner } from '@/components/ui/Spinner';

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRangeDays>(DEFAULT_TIME_RANGE);
  const { data: settings } = useSettings();
  const warningThreshold = settings?.warning_threshold ?? DEFAULT_WARNING_THRESHOLD;

  const {
    projection,
    summary,
    isLoading,
    isInitialLoading,
    error,
  } = useProjection({
    days: timeRange,
    enabled: true,
  });

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center text-danger">
          <p className="font-medium">Failed to load projection data</p>
          <p className="text-sm text-text-secondary mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  const hasAccounts = projection && projection.accounts.length > 0;
  const currentBalances =
    projection?.dataPoints[0]?.balances ?? {};
  const currentTotal = projection?.dataPoints[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {projection && projection.warnings.length > 0 && (
        <WarningBanner warnings={projection.warnings} />
      )}

      {/* Chart Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Cash Flow Projection
          </h2>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {!hasAccounts ? (
          <EmptyState />
        ) : (
          <>
            {/* Legend with current balances */}
            <div className="mb-6">
              <AccountLegend
                accounts={projection.accounts}
                balances={currentBalances}
                total={currentTotal}
              />
            </div>

            {/* Chart */}
            <div className={isLoading ? 'opacity-50' : ''}>
              <CashFlowChart
                data={projection.dataPoints}
                accounts={projection.accounts}
                warningThreshold={warningThreshold}
              />
            </div>
          </>
        )}
      </div>

      {/* Summary Cards */}
      {hasAccounts && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Current Balance"
            value={summary.startingTotal}
            type="neutral"
          />
          <SummaryCard
            label="Lowest Point"
            value={summary.lowestTotal}
            type={summary.lowestTotal < warningThreshold ? 'warning' : 'neutral'}
            subtext={
              summary.lowestTotalDate
                ? `on ${summary.lowestTotalDate.toLocaleDateString()}`
                : undefined
            }
          />
          <SummaryCard
            label="End Balance"
            value={summary.endingTotal}
            type={
              summary.endingTotal < 0
                ? 'danger'
                : summary.endingTotal < warningThreshold
                ? 'warning'
                : 'success'
            }
          />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-text-primary">No accounts yet</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Create an account and add a balance checkpoint to get started.
      </p>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  type: 'neutral' | 'success' | 'warning' | 'danger';
  subtext?: string;
}

function SummaryCard({ label, value, type, subtext }: SummaryCardProps) {
  const typeClasses = {
    neutral: 'text-text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <div className="card p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`text-2xl font-semibold font-tabular mt-1 ${typeClasses[type]}`}>
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value)}
      </p>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </div>
  );
}
