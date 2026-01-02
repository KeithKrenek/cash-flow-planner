import type { ProjectionWarning } from '@/types';
import { formatCurrency } from '@/lib/format-utils';
import { formatDisplayDate } from '@/lib/date-utils';

interface WarningBannerProps {
  warnings: ProjectionWarning[];
  maxDisplay?: number;
}

export function WarningBanner({ warnings, maxDisplay = 3 }: WarningBannerProps) {
  if (warnings.length === 0) {
    return null;
  }

  // Group warnings by account and get the first (most urgent) for each
  const warningsByAccount = warnings.reduce<Record<string, ProjectionWarning>>(
    (acc, warning) => {
      if (!acc[warning.accountId]) {
        acc[warning.accountId] = warning;
      }
      return acc;
    },
    {}
  );

  const uniqueWarnings = Object.values(warningsByAccount);
  const displayWarnings = uniqueWarnings.slice(0, maxDisplay);
  const remainingCount = uniqueWarnings.length - displayWarnings.length;

  return (
    <div className="bg-warning-muted border border-warning/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-warning">Low Balance Warning</h3>
          <div className="mt-2 space-y-1">
            {displayWarnings.map((warning, index) => (
              <p key={index} className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">
                  {warning.accountName}
                </span>{' '}
                will drop to{' '}
                <span
                  className={
                    warning.balance < 0 ? 'text-danger font-medium' : 'font-medium'
                  }
                >
                  {formatCurrency(warning.balance)}
                </span>{' '}
                on {formatDisplayDate(warning.date)}
              </p>
            ))}
            {remainingCount > 0 && (
              <p className="text-sm text-text-muted">
                +{remainingCount} more warning{remainingCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
