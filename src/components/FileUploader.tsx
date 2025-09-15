import { parseFiles } from '@/utils/fileParser'
import { useAppStore } from '@/store/useAppStore'

export default function FileUploader() {
  const setTransactions = useAppStore(s => s.setTransactions)
  return (
    <div className="card bg-base-200 p-4">
      <h2 className="text-xl font-semibold mb-2">Upload Transactions (CSV/XLSX)</h2>
      <input
        type="file"
        multiple
        accept=".csv, .xlsx, .xls"
        className="file-input file-input-bordered w-full"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          const tx = await parseFiles(files as File[])
          setTransactions(tx)
        }}
      />
    </div>
  )
}
