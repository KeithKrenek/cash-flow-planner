import { useAppStore } from '@/store/useAppStore'

export default function RecurringReview() {
  const recurring = useAppStore(s=>s.recurring)
  const update = useAppStore(s=>s.updateRecurring)
  const open = useAppStore(s=>s.reviewOpen)
  const setOpen = useAppStore(s=>s.setReviewOpen)
  if (!open) return null
  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg mb-2">Review Recurring Series</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr><th>Enable</th><th>Description</th><th>Amount</th><th>Interval (days)</th><th>Last seen</th></tr>
            </thead>
            <tbody>
              {recurring.map(r => (
                <tr key={r.key}>
                  <td>
                    <input type="checkbox" className="toggle"
                      checked={r.enabled}
                      onChange={e => update(r.key, { enabled: e.target.checked })}
                    />
                  </td>
                  <td>{r.description}</td>
                  <td>{r.amount.toFixed(2)}</td>
                  <td>{r.intervalDays}</td>
                  <td>{r.dates.slice().sort().pop()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={()=> setOpen(false)}>Done</button>
        </div>
      </div>
    </dialog>
  )
}
