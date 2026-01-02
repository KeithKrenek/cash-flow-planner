import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CHART_COLORS, TOTAL_LINE_COLOR } from '@/lib/constants';
import { formatCurrency, formatCompactCurrency } from '@/lib/format-utils';
import type { ProjectionDataPoint, DbAccount } from '@/types';

interface CashFlowChartProps {
  data: ProjectionDataPoint[];
  accounts: DbAccount[];
  warningThreshold: number;
  showTotal?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-dropdown p-3 min-w-[180px]">
      <p className="text-sm font-medium text-text-primary mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-text-secondary">{entry.name}</span>
            </div>
            <span
              className={`text-sm font-medium font-tabular ${
                entry.value < 0 ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashFlowChart({
  data,
  accounts,
  warningThreshold,
  showTotal = true,
}: CashFlowChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-text-muted">
        No data to display
      </div>
    );
  }

  // Prepare chart data with account IDs as keys
  const chartData = data.map((point) => ({
    date: point.dateString,
    ...point.balances,
    total: point.total,
  }));

  // Calculate Y-axis domain with some padding
  const allValues = data.flatMap((point) => [
    ...Object.values(point.balances),
    point.total,
  ]);
  const minValue = Math.min(...allValues, warningThreshold);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;
  const yMin = Math.floor((minValue - padding) / 100) * 100;
  const yMax = Math.ceil((maxValue + padding) / 100) * 100;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a0a0a0', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a0a0a0', fontSize: 12 }}
            tickFormatter={formatCompactCurrency}
            domain={[yMin, yMax]}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Warning threshold reference line */}
          <ReferenceLine
            y={warningThreshold}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="#ef4444" strokeOpacity={0.3} />

          {/* Account lines */}
          {accounts.map((account, index) => (
            <Line
              key={account.id}
              type="monotone"
              dataKey={account.id}
              name={account.name}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}

          {/* Total line (dashed) - only show if multiple accounts */}
          {showTotal && accounts.length > 1 && (
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={TOTAL_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
