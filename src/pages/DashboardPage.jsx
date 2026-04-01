import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenseStore, getProgress } from '../store/expenseStore'

// ── Animated counter hook ─────────────────────────────────────
function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(ease * target))
      if (p < 1) requestAnimationFrame(step)
      else setVal(target)
    }
    requestAnimationFrame(step)
  }, [target])
  return val
}

// ── Floating particle background ─────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      // draw faint connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - d / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

// ── Live TX feed item ─────────────────────────────────────────
function TxFeedItem({ tx, bills }) {
  const bill = bills.find(b => b.id === tx.billId)
  const participant = bill?.participants.find(p => p.id === tx.participantId)
  const isPayment = tx.type === 'payment'
  const time = new Date(tx.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 group">
      <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-sm ${
        isPayment ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
      }`}>
        {isPayment ? '↓' : '+'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/80 truncate">
          {isPayment
            ? <><span className="font-semibold text-white">{participant?.name ?? 'Someone'}</span> paid ₹{tx.amount.toFixed(0)}</>
            : <><span className="font-semibold text-white">{bill?.title ?? 'New bill'}</span> created</>
          }
        </p>
        <p className="text-xs text-white/30 font-mono mt-0.5 truncate">{tx.txId.slice(0, 20)}…</p>
      </div>
      <span className="text-xs text-white/30 flex-shrink-0">{time}</span>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, prefix = '', suffix = '', accent, sub, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), delay) }, [])
  const numericVal = typeof value === 'number' ? value : 0
  const counted = useCounter(visible ? numericVal : 0)

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 h-20 w-20 rounded-bl-full opacity-10 ${accent}`} />
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">{label}</p>
      <p className="text-3xl font-black text-white tabular-nums">
        {prefix}{typeof value === 'number' ? counted.toLocaleString('en-IN') : value}{suffix}
      </p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

// ── Mini bill row ─────────────────────────────────────────────
function BillRow({ bill, groups, index }) {
  const [visible, setVisible] = useState(false)
  const prog = getProgress(bill)
  const grp = groups.find(g => g.id === bill.groupId)
  useEffect(() => { setTimeout(() => setVisible(true), 600 + index * 80) }, [])

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:bg-white/10 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-12px)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">{bill.title}</p>
          {grp && <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">{grp.name}</span>}
        </div>
        <p className="text-xs text-white/40 mt-0.5">₹{bill.totalAmount.toFixed(0)} · {prog.paid}/{prog.total} paid</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          bill.status === 'settled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {bill.status === 'settled' ? 'Settled' : 'Open'}
        </span>
        <div className="w-16 h-1 rounded-full bg-white/10">
          <div className="h-1 rounded-full bg-emerald-400 transition-all" style={{ width: `${prog.pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
function DashboardPage() {
  const { bills, transactions, groups, getStats } = useExpenseStore()
  const navigate = useNavigate()
  const stats = getStats()
  const [heroVisible, setHeroVisible] = useState(false)
  const recentTx = transactions.slice(0, 6)

  useEffect(() => { setTimeout(() => setHeroVisible(true), 100) }, [])

  return (
    <div className="min-h-screen bg-[#080b14] text-white font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 border-b border-white/8 bg-[#080b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">S</div>
            <span className="text-lg font-black tracking-tight text-white">SplitChain</span>
            <span className="ml-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">BETA</span>
          </div>
          <div className="flex items-center gap-1">
            {[['/', 'Home'], ['/groups', 'Groups'], ['/expenses', 'Expenses']].map(([path, label]) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pb-20">

        {/* ── Hero section ── */}
        <div className="relative mt-10 mb-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950 via-[#0d1130] to-[#080b14] px-8 py-14 md:px-14">
          <ParticleField />
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl" />

          <div className="relative z-10">
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 transition-all duration-700"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(8px)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Algorand Blockchain Simulation Active
            </div>

            <h1
              className="text-4xl md:text-6xl font-black leading-none tracking-tight transition-all duration-700 delay-100"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)' }}
            >
              Split expenses.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Settle on-chain.
              </span>
            </h1>

            <p
              className="mt-4 max-w-lg text-base text-white/50 leading-relaxed transition-all duration-700 delay-200"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)' }}
            >
              SplitChain brings blockchain transparency to group expense settlement.
              Every payment is logged as an immutable Algorand transaction — no disputes, no excuses.
            </p>

            <div
              className="mt-8 flex flex-wrap gap-3 transition-all duration-700 delay-300"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)' }}
            >
              <button
                onClick={() => navigate('/expenses')}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition hover:scale-105 active:scale-95"
              >
                Create a Bill
              </button>
              <button
                onClick={() => navigate('/groups')}
                className="rounded-xl border border-white/15 bg-white/8 px-6 py-3 text-sm font-bold text-white hover:bg-white/15 transition hover:scale-105 active:scale-95"
              >
                View Groups
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-10">
          <StatCard label="Groups" value={stats.totalGroups} accent="bg-indigo-500" sub="active groups" delay={0} />
          <StatCard label="Total Bills" value={stats.totalBills} accent="bg-violet-500" sub={`${stats.settledBills} settled`} delay={80} />
          <StatCard label="Collected" value={Math.floor(stats.collected)} prefix="₹" accent="bg-emerald-500" sub="received" delay={160} />
          <StatCard label="Pending" value={Math.floor(stats.pending)} prefix="₹" accent="bg-amber-500" sub="outstanding" delay={240} />
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* Recent bills — 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Recent Bills</h2>
              <button onClick={() => navigate('/expenses')} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                + New bill →
              </button>
            </div>
            {bills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <p className="text-white/30 text-sm">No bills yet.</p>
                <button
                  onClick={() => navigate('/expenses')}
                  className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Create your first bill
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {bills.slice(0, 6).map((bill, i) => (
                  <BillRow key={bill.id} bill={bill} groups={groups} index={i} />
                ))}
              </div>
            )}

            {/* Groups summary */}
            {groups.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Your Groups</h2>
                  <button onClick={() => navigate('/groups')} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                    Manage →
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {groups.map(g => {
                    const gBills = bills.filter(b => b.groupId === g.id)
                    const gTotal = gBills.reduce((s, b) => s + b.totalAmount, 0)
                    const gCollected = gBills.reduce((s, b) =>
                      s + b.participants.filter(p => p.paid).reduce((x, p) => x + p.amountOwed, 0), 0)
                    const ICONS = { Trip: '✈️', Roommates: '🏠', Office: '💼', Friends: '🎉', Family: '👨‍👩‍👧', Other: '📦' }
                    return (
                      <div
                        key={g.id}
                        onClick={() => navigate('/groups')}
                        className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{ICONS[g.category] ?? '📦'}</span>
                          <p className="font-bold text-white text-sm">{g.name}</p>
                        </div>
                        <p className="text-xs text-white/40">{g.members.length} members · {gBills.length} bills</p>
                        <div className="mt-2 flex justify-between text-xs">
                          <span className="text-emerald-400">₹{gCollected.toFixed(0)} in</span>
                          <span className="text-amber-400">₹{(gTotal - gCollected).toFixed(0)} out</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TX Feed — 2 cols */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-white">Live Chain Activity</h2>
                </div>
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/40">{transactions.length} TX</span>
              </div>

              <div className="px-5 py-2 max-h-80 overflow-y-auto">
                {recentTx.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-white/20 text-xs">No transactions yet.</p>
                    <p className="text-white/15 text-xs mt-1">Create a bill to see chain activity.</p>
                  </div>
                ) : (
                  recentTx.map(tx => <TxFeedItem key={tx.txId} tx={tx} bills={bills} />)
                )}
              </div>

              {transactions.length > 0 && (
                <div className="border-t border-white/8 px-5 py-3 bg-white/3">
                  <p className="text-xs text-white/20 font-mono">
                    Network: Algorand Testnet (sim) · Block: #{Math.floor(Date.now() / 4000).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-bold text-white mb-4">How SplitChain works</h3>
              <div className="space-y-3">
                {[
                  { step: '01', title: 'Create a group', desc: 'Add members for a trip, flat, or event' },
                  { step: '02', title: 'Add a bill', desc: 'Split equally — amounts calculated instantly' },
                  { step: '03', title: 'Share QR codes', desc: 'Each person scans to pay their share' },
                  { step: '04', title: 'Settle on-chain', desc: 'Every payment logged as an Algorand TX' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 rounded-lg bg-indigo-500/20 px-2 py-1 text-xs font-black text-indigo-400 font-mono">{item.step}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-white/35">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage