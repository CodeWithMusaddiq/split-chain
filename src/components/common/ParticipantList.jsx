import { useState } from 'react'
import StatusBadge from './StatusBadge'

function TxBadge({ txId }) {
  const [copied, setCopied] = useState(false)
  if (!txId) return null
  const short = txId.slice(0, 8) + '...' + txId.slice(-6)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(txId); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="mt-1 flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500 hover:bg-slate-200 transition"
      title={txId}
    >
      <span>TX: {short}</span>
      <span>{copied ? '✓' : '⎘'}</span>
    </button>
  )
}

function ParticipantList({ participants = [], onPay }) {
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <span className="text-sm font-semibold text-slate-700">Participants</span>
        <span className="text-xs text-slate-400">{participants.length} members</span>
      </div>

      {participants.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">No participants yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {participants.map((p) => (
            <li key={p.id} className="flex items-start justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">
                  Owes ₹{p.amountOwed?.toFixed(2) ?? '0.00'}
                </p>
                {p.paid && <TxBadge txId={p.paymentTxId} />}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <StatusBadge status={p.paid ? 'Paid' : 'Pending'} />
                {!p.paid && onPay && (
                  <button
                    type="button"
                    onClick={() => onPay(p.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Pay
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ParticipantList