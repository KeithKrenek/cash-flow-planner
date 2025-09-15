import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import { Txn } from '@/types'

const columnHelper = createColumnHelper<Txn>()
const columns = [
  columnHelper.accessor('date', { header: 'Date' }),
  columnHelper.accessor('description', { header: 'Description' }),
  columnHelper.accessor('amount', { header: 'Amount', cell: info => info.getValue().toFixed(2) }),
  columnHelper.accessor('source', { header: 'Source' }),
  columnHelper.accessor('isProjected', { header: 'Projected', cell: info => info.getValue() ? 'Yes' : '' })
]

export default function TransactionsTable({ data }: { data: Txn[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  return (
    <div className="card bg-base-200 p-4">
      <h2 className="text-xl font-semibold mb-2">Transactions ({data.length})</h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(r => (
              <tr key={r.id}>
                {r.getVisibleCells().map(c => (
                  <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
