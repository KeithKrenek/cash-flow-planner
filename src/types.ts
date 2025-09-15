export type Txn = {
  id: string
  date: string // ISO date (yyyy-mm-dd)
  description: string
  amount: number // negative = outflow, positive = inflow
  category?: string
  source?: string
  isProjected?: boolean
}

export type RecurringSeries = {
  key: string
  description: string
  amount: number
  sign: 'inflow' | 'outflow'
  dates: string[] // observed dates
  intervalDays: number // modal or average interval
  nextDate?: string
  enabled: boolean
}

export type ProjectionParams = {
  startDate: string
  endDate: string
  bucket: '1d' | '3d' | '1w' | '2w' | '1m'
  startingBalance: number
  sensitivity: 'strict' | 'normal' | 'loose'
}

export type CashPoint = { date: string, balance: number, isProjected: boolean }
