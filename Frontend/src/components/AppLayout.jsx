import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navigation = {
  student: [
    ['Dashboard', '/student/dashboard'],
    ['My profile', '/student/profile'],
    ['Partners', '/student/partners'],
    ['Teams', '/student/teams'],
    ['Projects', '/student/projects'],
  ],
  client: [
    ['Post a project', '/client/post-project'],
    ['Applications', '/client/applications'],
  ],
  admin: [
    ['Users', '/admin/dashboard#users'],
    ['Projects', '/admin/dashboard#projects'],
    ['Reports', '/admin/dashboard#reports'],
    ['Verification', '/admin/dashboard#verification'],
  ],
  workspace: [
    ['Dashboard', '/student/dashboard'],
    ['Projects', '/student/projects'],
  ],
}

function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="CampusXchange home">
      <span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-lg font-bold text-white">
        C
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Campus<span className="text-teal-700">Xchange</span>
      </span>
    </Link>
  )
}

function Navbar({ area }) {
  const publicLinks = [
    ['Home', '/'],
    ['Projects', '/student/projects'],
    ['How it works', '/#how-it-works'],
    ['About', '/#about'],
  ]
  const links = area ? navigation[area] ?? [] : publicLinks

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label={area ? `${area} navigation` : 'Main navigation'}
        >
          {links.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm font-medium transition-colors ${
                  isActive ? 'text-teal-800' : 'text-slate-600 hover:text-teal-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {area ? (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm font-medium capitalize text-slate-700 sm:block">
              {area === 'student' || area === 'workspace' ? 'Alex Morgan' : area === 'client' ? 'BrightPath Labs' : `${area} account`}
            </span>
            <span
              className="grid size-9 place-items-center rounded-full bg-amber-300 text-sm font-bold text-amber-950"
              aria-label="User avatar"
            >
              {area === 'student' || area === 'workspace' ? 'A' : area[0].toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
      {!area && (
        <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden" aria-label="Mobile main navigation">
          {links.map(([label, to]) => (
            <Link key={to} to={to} className="whitespace-nowrap text-sm font-medium text-slate-600">
              {label}
            </Link>
          ))}
        </nav>
      )}
      {area && (
        <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden" aria-label="Mobile account navigation">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className="whitespace-nowrap text-sm font-medium text-slate-600">
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

function Sidebar({ area }) {
  const links = navigation[area]
  if (!links) return null

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {area} workspace
      </p>
      <nav className="space-y-1" aria-label={`${area} sidebar`}>
        {links.map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} CampusXchange · Learn, connect, and build together.
    </footer>
  )
}

export default function AppLayout({ area }) {
  const { pathname } = useLocation()
  const isWorkspace = pathname.startsWith('/workspace/')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar area={area} />
      <div className="flex flex-1">
        <Sidebar area={area} />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      {!isWorkspace && <Footer />}
    </div>
  )
}
