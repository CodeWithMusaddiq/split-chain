import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import PageContainer from '../components/layout/PageContainer'
import { useExpenseStore, getProgress } from '../store/expenseStore'

// ─── QR visual (deterministic pattern) ───────────────────────
function QRPlaceholder({ text, size = 140 }) {
  const hash = text.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  const cells = 21
  const cell = size / cells
  const grid = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const isEdge = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)
      const bit = isEdge
        ? ((r === 0 || r === 6 || c === 0 || c === 6) && r <= 6 && c <= 6) ||
          ((r === 0 || r === 6 || c === cells - 1 || c === cells - 7) && r <= 6) ||
          ((r === cells - 7 || r === cells - 1 || c === 0 || c === 6) && c <= 6)
        : ((hash * (r + 1) * (c + 1) + r * 31 + c * 17) & 1) === 1
      if (bit) grid.push({ r, c })
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" />
      {grid.map(({ r, c }, i) => (
        <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1e1b4b" />
      ))}
    </svg>
  )
}

// ─── TX Badge ────────────────────────────────────────────────
function TxBadge({ txId }) {
  const [copied, setCopied] = useState(false)
  if (!txId) return null
  const short = txId.slice(0, 8) + '...' + txId.slice(-6)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(txId); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500 hover:bg-slate-200 transition"
      title={txId}
    >
      <span>ALGO TX: {short}</span>
      <span>{copied ? '✓' : '⎘'}</span>
    </button>
  )
}

// ─── QR Payment Modal ────────────────────────────────────────
function QRModal({ participant, bill, onPay, onClose }) {
  const qrText = `upi://pay?pa=splitchain@upi&pn=${participant.name}&am=${participant.amountOwed}&cu=INR&tn=${bill.title}`
  const [scanning, setScanning] = useState(false)

  function simulateScan() {
    setScanning(true)
    setTimeout(() => { setScanning(false); onPay() }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Pay via QR</h3>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-1">{participant.name} owes</p>
          <p className="text-3xl font-bold text-indigo-700 mb-4">₹{participant.amountOwed.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mb-2">For: <span className="font-medium text-slate-600">{bill.title}</span></p>
          <div className="flex justify-center mb-4 rounded-xl overflow-hidden border border-slate-200 p-3 bg-slate-50">
            <QRPlaceholder text={qrText} size={160} />
          </div>
          <p className="text-xs text-slate-400 mb-1">Scan with any UPI app to pay</p>
          <p className="text-xs text-slate-300 font-mono break-all mb-4">{qrText.slice(0, 55)}…</p>
          {participant.paid ? (
            <div className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
              Payment confirmed ✓
              <TxBadge txId={participant.paymentTxId} />
            </div>
          ) : (
            <button
              onClick={simulateScan}
              disabled={scanning}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {scanning ? 'Confirming on blockchain…' : 'Simulate Payment Received'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Bill detail card (inside group) ─────────────────────────
function BillCard({ bill, onPay }) {
  const [expanded, setExpanded] = useState(false)
  const [qrParticipant, setQrParticipant] = useState(null)
  const progress = getProgress(bill)

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Bill header row */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800">{bill.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              bill.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {bill.status === 'settled' ? 'Settled' : 'Open'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ₹{bill.totalAmount.toFixed(2)} · {progress.paid}/{progress.total} paid · {new Date(bill.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span className="ml-3 text-slate-300 text-sm flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${progress.pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span className="text-green-600 font-medium">₹{progress.amountCollected.toFixed(2)} collected</span>
          <span className="text-red-400 font-medium">₹{progress.amountRemaining.toFixed(2)} pending</span>
        </div>
      </div>

      {/* Expanded participant details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Payment Status</p>
          {bill.participants.map(p => (
            <div key={p.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
              p.paid ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'
            }`}>
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">
                  Share: ₹{p.amountOwed.toFixed(2)} ({p.percentage?.toFixed(1)}%)
                </p>
                {p.paid && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Paid on {new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                {p.paid && <TxBadge txId={p.paymentTxId} />}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  p.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {p.paid ? 'Paid' : 'Pending'}
                </span>
                <button
                  onClick={() => setQrParticipant(p)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  QR
                </button>
                {!p.paid && (
                  <button
                    onClick={() => onPay(bill.id, p.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Bill blockchain receipt */}
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Blockchain Receipt</p>
            <p className="text-xs text-slate-400">Bill created on Algorand (simulated)</p>
            <TxBadge txId={bill.txId} />
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrParticipant && (
        <QRModal
          participant={bill.participants.find(p => p.id === qrParticipant.id)}
          bill={bill}
          onPay={() => { onPay(bill.id, qrParticipant.id); setQrParticipant(null) }}
          onClose={() => setQrParticipant(null)}
        />
      )}
    </div>
  )
}

// ─── Category options ─────────────────────────────────────────
const CATEGORIES = [
  { label: 'Trip', icon: '✈️', desc: 'Vacation, travel, hotels' },
  { label: 'Roommates', icon: '🏠', desc: 'Rent, utilities, groceries' },
  { label: 'Office', icon: '💼', desc: 'Team lunch, team events' },
  { label: 'Friends', icon: '🎉', desc: 'Outings, parties, hangouts' },
  { label: 'Family', icon: '👨‍👩‍👧', desc: 'Family expenses, festivals' },
  { label: 'Other', icon: '📦', desc: 'Everything else' },
]

// ─── Create Group Modal (step-by-step) ───────────────────────
function CreateGroupModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1) // 1 = name+desc, 2 = category, 3 = members, 4 = review
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [members, setMembers] = useState([])

  function addMember() {
    const m = memberInput.trim()
    if (m && !members.includes(m)) { setMembers(p => [...p, m]); setMemberInput('') }
  }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); addMember() }
  }

  function submit() {
    onCreate(name.trim(), members, category, desc.trim())
    onClose()
  }

  const canNext1 = name.trim().length > 0
  const canNext2 = category !== ''
  const canNext3 = members.length >= 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Create New Group</h3>
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1 px-6 pt-4">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-indigo-600' : 'bg-slate-100'}`} />
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Step 1 — Name + Description */}
          {step === 1 && (
            <>
              <div>
                <p className="text-base font-semibold text-slate-800 mb-1">Name your group</p>
                <p className="text-xs text-slate-400 mb-4">Give it a clear name so everyone knows what it's for.</p>
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Group Name <span className="text-red-400">*</span></span>
                <input
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. Goa Trip 2025, Flat 4B Expenses"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext1 && setStep(2)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Description <span className="text-slate-300">(optional)</span></span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 h-20 resize-none"
                  placeholder="e.g. Trip to Goa from 10–14 Jan with college friends. Tracking all shared costs."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </label>
            </>
          )}

          {/* Step 2 — Category */}
          {step === 2 && (
            <>
              <div>
                <p className="text-base font-semibold text-slate-800 mb-1">What kind of group is this?</p>
                <p className="text-xs text-slate-400 mb-4">This helps organise your expenses better.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      category === cat.label
                        ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl leading-none mt-0.5">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                      <p className="text-xs text-slate-400 leading-tight">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 3 — Members */}
          {step === 3 && (
            <>
              <div>
                <p className="text-base font-semibold text-slate-800 mb-1">Add group members</p>
                <p className="text-xs text-slate-400 mb-4">Type each person's name and press Enter or click Add.</p>
              </div>
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter name e.g. Riya"
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button
                  type="button"
                  onClick={addMember}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  Add
                </button>
              </div>
              {members.length > 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                  <p className="text-xs text-slate-400 mb-2">{members.length} member{members.length > 1 ? 's' : ''} added</p>
                  {members.map((m, i) => (
                    <div key={m} className="flex items-center justify-between rounded-lg bg-white border border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {m[0].toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-700">{m}</span>
                      </div>
                      <button
                        onClick={() => setMembers(p => p.filter(x => x !== m))}
                        className="text-slate-300 hover:text-red-400 transition text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  No members yet — add at least 1
                </div>
              )}
            </>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <>
              <div>
                <p className="text-base font-semibold text-slate-800 mb-1">Review & create</p>
                <p className="text-xs text-slate-400 mb-4">Everything look good?</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-xs font-medium text-slate-400">Group name</span>
                  <span className="text-sm font-semibold text-slate-800">{name}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-xs font-medium text-slate-400">Category</span>
                  <span className="text-sm text-slate-700">
                    {CATEGORIES.find(c => c.label === category)?.icon} {category}
                  </span>
                </div>
                {desc && (
                  <div className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-400 block mb-1">Description</span>
                    <span className="text-sm text-slate-600">{desc}</span>
                  </div>
                )}
                <div className="px-4 py-3">
                  <span className="text-xs font-medium text-slate-400 block mb-2">Members ({members.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(m => (
                      <span key={m} className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Back
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : !canNext3}
              onClick={() => setStep(s => s + 1)}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={submit}
              className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Create Group
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main GroupsPage ──────────────────────────────────────────
function GroupsPage() {
  const { groups, addGroup, deleteGroup, getBillsByGroup, payParticipant } = useExpenseStore()
  const [showCreate, setShowCreate] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState(null)

  function handleCreate(name, members, category, desc) {
    addGroup(name, members, category, desc)
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <Navbar />
      <PageContainer>
        <div className="space-y-6">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Groups</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {groups.length === 0 ? 'Create a group to start splitting expenses' : `${groups.length} group${groups.length > 1 ? 's' : ''} active`}
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              + New Group
            </button>
          </div>

          {/* Empty state */}
          {groups.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">👥</div>
              <p className="font-semibold text-slate-700 text-lg">No groups yet</p>
              <p className="text-sm text-slate-400 mt-1 mb-5 max-w-xs mx-auto">
                Groups help you track shared expenses for trips, roommates, events and more.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Create your first group
              </button>
            </div>
          )}

          {/* Group cards */}
          <div className="space-y-5">
            {groups.map(group => {
              const groupBills = getBillsByGroup(group.id)
              const isExpanded = expandedGroup === group.id
              const totalAmount = groupBills.reduce((s, b) => s + b.totalAmount, 0)
              const collected = groupBills.reduce((s, b) =>
                s + b.participants.filter(p => p.paid).reduce((x, p) => x + p.amountOwed, 0), 0)
              const pending = totalAmount - collected
              const cat = CATEGORIES.find(c => c.label === group.category)
              const settledCount = groupBills.filter(b => b.status === 'settled').length

              return (
                <div key={group.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">

                  {/* Group header */}
                  <div className="px-6 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                          {cat?.icon ?? '📦'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-slate-800">{group.name}</h2>
                            {group.category && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                                {group.category}
                              </span>
                            )}
                          </div>
                          {group.desc && (
                            <p className="text-sm text-slate-500 mt-0.5 leading-snug">{group.desc}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            Created {new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${group.name}"? All its bills will also be removed.`)) deleteGroup(group.id) }}
                        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 transition flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                        <p className="text-lg font-bold text-slate-800">{groupBills.length}</p>
                        <p className="text-xs text-slate-400">Total Bills</p>
                      </div>
                      <div className="rounded-xl bg-green-50 px-3 py-2.5 text-center">
                        <p className="text-lg font-bold text-green-700">₹{collected.toFixed(0)}</p>
                        <p className="text-xs text-green-500">Collected</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center">
                        <p className="text-lg font-bold text-amber-600">₹{pending.toFixed(0)}</p>
                        <p className="text-xs text-amber-500">Pending</p>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.members.map(m => (
                        <span key={m} className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-200 text-indigo-800 font-bold text-xs leading-none">
                            {m[0].toUpperCase()}
                          </span>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bills toggle */}
                  <button
                    className="w-full flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-500 hover:bg-slate-50 transition"
                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  >
                    <span className="font-medium">
                      {groupBills.length === 0
                        ? 'No bills yet — assign bills from Expenses page'
                        : `${groupBills.length} bill${groupBills.length > 1 ? 's' : ''} · ${settledCount} settled`}
                    </span>
                    <span className="text-slate-300">{isExpanded ? '▲ Hide' : '▼ Show bills'}</span>
                  </button>

                  {/* Bills list */}
                  {isExpanded && groupBills.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-3">
                      {groupBills.map(bill => (
                        <BillCard key={bill.id} bill={bill} onPay={payParticipant} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </PageContainer>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

export default GroupsPage