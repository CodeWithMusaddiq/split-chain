function Card({ children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {children}
    </div>
  )
}

export default Card