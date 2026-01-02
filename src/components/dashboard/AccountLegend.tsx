import { CHART_COLORS, TOTAL_LINE_COLOR } from '@/lib/constants';
import { formatCurrency } from '@/lib/format-utils';
import type { DbAccount } from '@/types';

interface AccountLegendProps {
  accounts: DbAccount[];
  balances: Record<string, number>;
  total: number;
  showTotal?: boolean;
}

export function AccountLegend({
  accounts,
  balances,
  total,
  showTotal = true,
}: AccountLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {accounts.map((account, index) => (
        <div key={account.id} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
          />
          <span className="text-text-secondary">{account.name}</span>
          <span className="font-medium font-tabular text-text-primary">
            {formatCurrency(balances[account.id] ?? 0)}
          </span>
        </div>
      ))}

      {showTotal && accounts.length > 1 && (
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div
            className="w-3 h-0.5 flex-shrink-0"
            style={{
              backgroundColor: TOTAL_LINE_COLOR,
              backgroundImage: `repeating-linear-gradient(90deg, ${TOTAL_LINE_COLOR}, ${TOTAL_LINE_COLOR} 4px, transparent 4px, transparent 8px)`,
            }}
          />
          <span className="text-text-secondary">Total</span>
          <span className="font-medium font-tabular text-text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
}
