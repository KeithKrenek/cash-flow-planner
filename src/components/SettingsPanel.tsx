import { useAppStore } from '@/store/useAppStore'
import type { ProjectionParams } from '@/types'

const buckets: { label: string, value: ProjectionParams['bucket'] }[] = [
  { label: 'Daily', value: '1d' },
  { label: 'Every 3 days', value: '3d' },
  { label: 'Weekly', value: '1w' },
  { label: 'Biweekly', value: '2w' },
  { label: 'Monthly (30d)', value: '1m' },
]

export default function SettingsPanel() {
  const params = useAppStore(s => s.projectionParams)
  const setParams = useAppStore(s => s.setProjectionParams)
  return (
    <div className="card bg-base-200 p-4">
      <h2 className="text-xl font-semibold mb-2">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="form-control">
          <span className="label-text">Starting balance (USD)</span>
          <input
            type="number"
            className="input input-bordered"
            value={params.startingBalance}
            onChange={(e)=> setParams({ startingBalance: Number(e.target.value) })}
          />
        </label>
        <label className="form-control">
          <span className="label-text">Start date</span>
          <input
            type="date"
            className="input input-bordered"
            value={params.startDate}
            onChange={(e)=> setParams({ startDate: e.target.value })}
          />
        </label>
        <label className="form-control">
          <span className="label-text">End date</span>
          <input
            type="date"
            className="input input-bordered"
            value={params.endDate}
            onChange={(e)=> setParams({ endDate: e.target.value })}
          />
        </label>
        <label className="form-control">
          <span className="label-text">Time bucket</span>
          <select
            className="select select-bordered"
            value={params.bucket}
            onChange={(e)=> setParams({ bucket: e.target.value as any })}
          >
            {buckets.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text">Recurring detection</span>
          <select
            className="select select-bordered"
            value={params.sensitivity}
            onChange={(e)=> setParams({ sensitivity: e.target.value as any })}
          >
            <option value="strict">Strict</option>
            <option value="normal">Normal</option>
            <option value="loose">Loose</option>
          </select>
        </label>
      </div>
    </div>
  )
}
