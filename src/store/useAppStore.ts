import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Txn, RecurringSeries, ProjectionParams, CashPoint } from '@/types'

type State = {
  transactions: Txn[]
  recurring: RecurringSeries[]
  projectionParams: ProjectionParams
  cashCurve: CashPoint[]
  reviewOpen: boolean
}

type Actions = {
  setTransactions: (tx: Txn[]) => void
  setRecurring: (r: RecurringSeries[]) => void
  updateRecurring: (key: string, patch: Partial<RecurringSeries>) => void
  setProjectionParams: (p: Partial<ProjectionParams>) => void
  setCashCurve: (c: CashPoint[]) => void
  setReviewOpen: (v: boolean) => void
  reset: () => void
}

const defaultParams: ProjectionParams = {
  startDate: new Date().toISOString().slice(0,10),
  endDate: new Date(Date.now() + 1000*60*60*24*90).toISOString().slice(0,10),
  bucket: '1w',
  startingBalance: 0,
  sensitivity: 'normal'
}

export const useAppStore = create<State & Actions>()(persist(
  (set, get) => ({
    transactions: [],
    recurring: [],
    projectionParams: defaultParams,
    cashCurve: [],
    reviewOpen: false,

    setTransactions: (tx) => set({ transactions: tx }),
    setRecurring: (r) => set({ recurring: r }),
    updateRecurring: (key, patch) => set({
      recurring: get().recurring.map(s => s.key === key ? { ...s, ...patch } : s)
    }),
    setProjectionParams: (p) => set({ projectionParams: { ...get().projectionParams, ...p } }),
    setCashCurve: (c) => set({ cashCurve: c }),
    setReviewOpen: (v) => set({ reviewOpen: v }),
    reset: () => set({ transactions: [], recurring: [], cashCurve: [] })
  }),
  { name: 'cash-flow-show' }
))
