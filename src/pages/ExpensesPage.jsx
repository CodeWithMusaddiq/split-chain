import Navbar from '../components/layout/Navbar'
import PageContainer from '../components/layout/PageContainer'
import HeaderCard from '../components/common/HeaderCard'
import ContainerLayout from '../components/common/ContainerLayout'
import BillForm from '../components/common/BillForm'
import { useExpenseStore, getProgress } from '../store/expenseStore'
import { useState } from 'react'

function ExpensesPage() {
  const { bills, addBill, groups } = useExpenseStore()
  const [selectedGroup, setSelectedGroup] = useState('')

  const activeBill = bills[0] ?? null
  const progress = activeBill ? getProgress(activeBill) : null

  function handleSubmit(formData) {
    addBill({ ...formData, groupId: selectedGroup || null })
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <Navbar />
      <PageContainer>
        <div className="space-y-6">

          <HeaderCard
            title="Blockchain Expense Settlement"
            subtitle="Create, track, and settle group bills with transparency."
            progress={progress}
          />

          <ContainerLayout>
            <h3 className="mb-1 text-lg font-semibold text-slate-700">New Bill</h3>
            <p className="mb-4 text-sm text-slate-400">
              Fill in the details below. Assign it to a group to track it there.
            </p>

            {/* Group assignment */}
            {groups.length > 0 ? (
              <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">Assign to Group</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGroup('')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      selectedGroup === ''
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    No group
                  </button>
                  {groups.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGroup(g.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        selectedGroup === g.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
                {selectedGroup && (
                  <p className="mt-2 text-xs text-indigo-500">
                    This bill will appear under <span className="font-semibold">{groups.find(g => g.id === selectedGroup)?.name}</span> on the Groups page.
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                No groups yet. You can create a group on the{' '}
                <a href="/groups" className="text-indigo-500 font-medium hover:underline">Groups page</a>{' '}
                and assign this bill to it.
              </div>
            )}

            <BillForm onSubmit={handleSubmit} />
          </ContainerLayout>

          {/* Recent bills summary — view details on Groups page */}
          {bills.length > 0 && (
            <ContainerLayout>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Recent Bills</h3>
                <span className="text-xs text-slate-400">{bills.length} total</span>
              </div>
              <div className="space-y-2">
                {bills.slice(0, 5).map(bill => {
                  const prog = getProgress(bill)
                  const grp = groups.find(g => g.id === bill.groupId)
                  return (
                    <div key={bill.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800">{bill.title}</p>
                          {grp && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600 font-medium">{grp.name}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ₹{bill.totalAmount.toFixed(2)} · {prog.paid}/{prog.total} paid
                        </p>
                        <p className="text-xs font-mono text-slate-300 mt-0.5">TX: {bill.txId.slice(0, 14)}…</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          bill.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {bill.status === 'settled' ? 'Settled' : 'Open'}
                        </span>
                        <div className="w-20 h-1.5 rounded-full bg-slate-200">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${prog.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-slate-400 text-center">
                Full bill details with QR payments are on the{' '}
                <a href="/groups" className="text-indigo-500 font-medium hover:underline">Groups page</a>
              </p>
            </ContainerLayout>
          )}

        </div>
      </PageContainer>
    </div>
  )
}

export default ExpensesPage