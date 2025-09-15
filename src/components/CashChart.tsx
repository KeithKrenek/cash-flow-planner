import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import type { CashPoint } from '@/types'

export default function CashChart({ data, projectionStart }: { data: CashPoint[], projectionStart?: string }) {
  return (
    <div className="card bg-base-200 p-4">
      <h2 className="text-xl font-semibold mb-2">Cash Balance</h2>
      <div className="w-full h-80">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="balance" name="Balance" strokeDasharray=""
              dot={false}
              strokeWidth={2}
            />
            {projectionStart ? <ReferenceLine x={projectionStart} label="Projection Starts" stroke="#888" /> : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
