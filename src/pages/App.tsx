import FileUploader from '@/components/FileUploader'
import SettingsPanel from '@/components/SettingsPanel'
import TransactionsTable from '@/components/TransactionsTable'
import CashChart from '@/components/CashChart'
import RecurringReview from '@/components/RecurringReview'
import { useAppStore } from '@/store/useAppStore'
import { detectRecurringTransactions, generateProjectedTransactions, calculateCashFlow } from '@/utils/cashFlowCalculator'
import type { Txn } from '@/types'

export default function App() {
  const { transactions, projectionParams, recurring, setRecurring, setCashCurve, setReviewOpen } = useAppStore()
  const allTx: Txn[] = transactions.slice()

  const runProjection = () => {
    // detect recurring based on sensitivity
    const detected = detectRecurringTransactions(transactions, projectionParams.sensitivity)
    setRecurring(detected)
    setReviewOpen(true)
  }

  const applyProjection = () => {
    const projected = generateProjectedTransactions(recurring, projectionParams.endDate)
    const combined = allTx.concat(projected).sort((a,b)=> a.date.localeCompare(b.date))
    const curve = calculateCashFlow(combined, projectionParams)
    setCashCurve(curve)
    setReviewOpen(false)
  }

  const projectionStart = projectionParams.startDate

  return (
    <div className="min-h-screen p-6 container mx-auto space-y-4">
      <h1 className="text-3xl font-bold">💸 Cash Flow Show</h1>
      <SettingsPanel />
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="md:w-1/2 space-y-4">
          <FileUploader />
          <div className="card bg-base-200 p-4">
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={runProjection}>Detect Recurring</button>
              <button className="btn" onClick={applyProjection}>Apply Projection</button>
            </div>
          </div>
          <TransactionsTable data={allTx} />
        </div>
        <div className="md:w-1/2 space-y-4">
          <ChartPanel />
        </div>
      </div>
      <RecurringReview />
    </div>
  )
}

function ChartPanel() {
  const curve = useAppStore(s => s.cashCurve)
  const params = useAppStore(s => s.projectionParams)
  return (
    <CashChart data={curve} projectionStart={params.startDate} />
  )
}
