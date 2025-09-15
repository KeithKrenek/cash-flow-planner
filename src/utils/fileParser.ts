import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { Txn } from '@/types'

function coerceDate(v: any): string | null {
  if (!v) return null
  const tryDate = new Date(v)
  if (!isNaN(+tryDate)) return tryDate.toISOString().slice(0,10)
  // handle dd/mm/yyyy or mm/dd/yyyy ambiguity by replacing
  const s = String(v).trim().replace(/\./g, '/').replace(/-/g, '/')
  const parts = s.split('/').map(p => p.padStart(2,'0'))
  if (parts.length === 3) {
    // naive: if first part > 12, assume dd/mm/yyyy
    const [a,b,c] = parts
    const y = c.length === 2 ? ('20' + c) : c
    const mmFirst = `${y}-${a}-${b}`
    const ddFirst = `${y}-${b}-${a}`
    const dA = new Date(mmFirst)
    const dB = new Date(ddFirst)
    if (!isNaN(+dA) && +a <= 12) return mmFirst
    if (!isNaN(+dB)) return ddFirst
  }
  return null
}

function coerceAmount(v: any): number {
  if (typeof v === 'number') return v
  if (!v) return 0
  const s = String(v).replace(/[^0-9\-\.]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function normalizeRow(row: any, source: string, idx: number): Txn | null {
  const date = coerceDate(row.date || row.Date || row['Transaction Date'] || row['Posted Date'])
  const description = String(row.description || row.Description || row.DESC || row['Payee'] || '').trim()
  let amount = coerceAmount(row.amount ?? row.Amount ?? row['Transaction Amount'] ?? row['Amount (USD)'] ?? row['Credit'] ?? row['Debit'])
  // Some CSVs split credits/debits
  if (row.Debit && !row.Credit) amount = -coerceAmount(row.Debit)
  if (row.Credit && !row.Debit) amount = coerceAmount(row.Credit)
  if (!date || !description || !amount) {
    // allow zero? skip empty rows
    if (!date && !description && !amount) return null
  }
  return {
    id: `${source}-${idx}`,
    date: date ?? new Date().toISOString().slice(0,10),
    description,
    amount: Number(amount),
    source
  }
}

export async function parseFiles(files: File[]): Promise<Txn[]> {
  const out: Txn[] = []
  for (const file of files) {
    const name = file.name.toLowerCase()
    if (name.endsWith('.csv')) {
      const text = await file.text()
      const parsed = Papa.parse<any>(text, { header: true })
      parsed.data.forEach((row, i) => {
        const n = normalizeRow(row, file.name, i)
        if (n) out.push(n)
      })
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      rows.forEach((row, i) => {
        const n = normalizeRow(row, file.name, i)
        if (n) out.push(n)
      })
    } else {
      // try naive CSV parse
      const text = await file.text()
      const parsed = Papa.parse<any>(text, { header: true })
      parsed.data.forEach((row, i) => {
        const n = normalizeRow(row, file.name, i)
        if (n) out.push(n)
      })
    }
  }
  // sort by date asc
  out.sort((a,b) => a.date.localeCompare(b.date))
  return out
}
