function ContainerLayout({ children, className = '' }) {
  return (
    <section
      className={`w-full rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 ${className}`}
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {children}
    </section>
  )
}

export default ContainerLayout
