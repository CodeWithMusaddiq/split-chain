function HeaderCard({ title = 'Blockchain Expense Settlement', subtitle = 'Manage payments with on-chain trust' }) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl px-6 py-7 shadow-lg"
      style={{
        backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 45%, #0ea5e9 100%)',
        color: '#F8FAFC',
      }}
    >
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-100/90">{subtitle}</p>
    </div>
  )
}

export default HeaderCard
