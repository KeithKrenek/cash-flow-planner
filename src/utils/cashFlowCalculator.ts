import type { Txn, RecurringSeries, ProjectionParams, CashPoint } from '@/types'

function daysBetween(a: string, b: string): number {
  const A = new Date(a).getTime()
  const B = new Date(b).getTime()
  return Math.round((B - A) / (1000*60*60*24))
}
function addDays(d: string, n: number): string {
  const t = new Date(d)
  t.setDate(t.getDate() + n)
  return t.toISOString().slice(0,10)
}
function sanitizeDesc(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
}

export function detectRecurringTransactions(transactions: Txn[], sensitivity: 'strict'|'normal'|'loose'='normal'): RecurringSeries[] {
  // group by (sanitized description, sign, |amount| rounded to 2)
  const groups = new Map<string, Txn[]>()
  for (const tx of transactions) {
    const sign = tx.amount >= 0 ? 'inflow' : 'outflow'
    const key = `${sanitizeDesc(tx.description)}|${sign}|${Math.abs(tx.amount).toFixed(2)}`
    const arr = groups.get(key) ?? []
    arr.push(tx)
    groups.set(key, arr)
  }
  const out: RecurringSeries[] = []
  for (const [key, arr] of groups) {
    if (arr.length < 3) continue
    const dates = arr.map(a => a.date).sort()
    const intervals: number[] = []
    for (let i=1; i<dates.length; i++) intervals.push(daysBetween(dates[i-1], dates[i]))
    const avg = intervals.reduce((a,b)=>a+b,0)/intervals.length
    const variance = intervals.reduce((a,b)=>a + Math.pow(b-avg,2),0)/intervals.length
    const std = Math.sqrt(variance)
    // threshold by sensitivity
    const threshold = sensitivity === 'strict' ? 4 : sensitivity === 'loose' ? 12 : 8
    if (std <= threshold) {
      const sign = arr[0].amount >= 0 ? 'inflow' : 'outflow'
      out.push({
        key,
        description: sanitizeDesc(arr[0].description),
        amount: Math.abs(arr[0].amount) * (sign === 'inflow' ? 1 : -1),
        sign,
        dates,
        intervalDays: Math.round(avg),
        enabled: true
      })
    }
  }
  return out
}

function nextDateAfter(dates: string[], interval: number): string {
  const last = dates.slice().sort().pop()!
  return addDays(last, interval)
}

export function generateProjectedTransactions(series: RecurringSeries[], endDate: string): Txn[] {
  const projected: Txn[] = []
  for (const s of series) {
    if (!s.enabled) continue
    let nd = nextDateAfter(s.dates, s.intervalDays)
    let i = 0
    while (nd <= endDate && i < 1000) {
      projected.push({
        id: `proj-${s.key}-${nd}`,
        date: nd,
        description: s.description,
        amount: s.amount,
        isProjected: true
      })
      nd = addDays(nd, s.intervalDays)
      i++
    }
  }
  return projected
}

function bucketKey(date: string, bucket: ProjectionParams['bucket']): string {
  if (bucket === '1d') return date
  const d = new Date(date)
  const base = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const epoch = base.getTime() / (1000*60*60*24)
  const step = bucket === '3d' ? 3 : bucket === '1w' ? 7 : bucket === '2w' ? 14 : 30
  const bucketStartDays = Math.floor(epoch / step) * step
  const bucketStart = new Date(bucketStartDays * 1000*60*60*24)
  return bucketStart.toISOString().slice(0,10)
}

export function calculateCashFlow(all: Txn[], params: ProjectionParams): CashPoint[] {
  const filtered = all.filter(tx => tx.date >= params.startDate && tx.date <= params.endDate)
  filtered.sort((a,b)=> a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  // aggregate by bucket and compute running balance
  const buckets = new Map<string, { inflow: number, outflow: number, anyProjected: boolean }>()
  for (const tx of filtered) {
    const k = bucketKey(tx.date, params.bucket)
    const cur = buckets.get(k) ?? { inflow: 0, outflow: 0, anyProjected: false }
    if (tx.amount >= 0) cur.inflow += tx.amount
    else cur.outflow += tx.amount
    if (tx.isProjected) cur.anyProjected = true
    buckets.set(k, cur)
  }
  const keys = Array.from(buckets.keys()).sort()
  const out: CashPoint[] = []
  let bal = params.startingBalance
  for (const k of keys) {
    const v = buckets.get(k)!
    bal += v.inflow + v.outflow
    out.push({ date: k, balance: Number(bal.toFixed(2)), isProjected: v.anyProjected })
  }
  return out
}
