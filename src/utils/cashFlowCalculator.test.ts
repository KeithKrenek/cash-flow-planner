import { describe, it, expect } from 'vitest'
import { calculateCashFlow, detectRecurringTransactions, generateProjectedTransactions } from './cashFlowCalculator'
import type { Txn } from '@/types'

const tx: Txn[] = [
  { id:'1', date:'2025-01-01', description:'Salary ACME', amount: 3000 },
  { id:'2', date:'2025-01-02', description:'Rent', amount: -1500 },
  { id:'3', date:'2025-01-15', description:'Internet', amount: -60 },
  { id:'4', date:'2025-02-01', description:'Salary ACME', amount: 3000 },
  { id:'5', date:'2025-02-02', description:'Rent', amount: -1500 },
  { id:'6', date:'2025-02-15', description:'Internet', amount: -60 },
]

describe('recurring', () => {
  it('detects recurring with normal sensitivity', () => {
    const rec = detectRecurringTransactions(tx, 'normal')
    expect(rec.length).toBeGreaterThan(0)
  })
  it('projects forward', () => {
    const rec = detectRecurringTransactions(tx, 'normal')
    const proj = generateProjectedTransactions(rec, '2025-04-01')
    expect(proj.length).toBeGreaterThan(0)
    expect(proj.every(p => p.isProjected)).toBeTruthy()
  })
})

describe('cash curve', () => {
  it('calculates balance over buckets', () => {
    const params = { startDate: '2025-01-01', endDate:'2025-03-01', bucket:'1w', startingBalance: 1000, sensitivity:'normal' as const }
    const curve = calculateCashFlow(tx, params)
    expect(curve.length).toBeGreaterThan(0)
    expect(typeof curve[0].balance).toBe('number')
  })
})
