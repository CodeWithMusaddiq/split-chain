import { Link } from 'react-router-dom'
import clsx from 'clsx'

function Navbar() {
  const linkClass = clsx(
    'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
  )

  return (
    <nav className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">SplitChain</h1>

        <div className="flex gap-2">
          <Link to="/" className={linkClass}>
            Dashboard
          </Link>
          <Link to="/groups" className={linkClass}>
            Groups
          </Link>
          <Link to="/expenses" className={linkClass}>
            Expenses
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar