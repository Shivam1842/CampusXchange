import { Link, useLocation } from 'react-router-dom'

const pageDetails = {
  '/': ['Learn. Connect. Collaborate. Build.', 'A place for students and businesses to find the right people, projects, and skills.'],
  '/login': ['Welcome back', 'Log in to continue to your CampusXchange workspace.'],
  '/register': ['Join CampusXchange', 'Create an account to start connecting and building together.'],
  '/student/dashboard': ['Student dashboard', 'Your activity, recommendations, and project applications will live here.'],
  '/student/profile': ['My profile', 'Showcase your skills, interests, and portfolio.'],
  '/student/partners': ['Find partners', 'Discover students whose skills complement yours.'],
  '/student/teams': ['Teams', 'Create a team, manage invitations, and collaborate with members.'],
  '/student/projects': ['Browse projects', 'Find projects that match your skills and interests.'],
  '/client/post-project': ['Post a project', 'Share an opportunity and find the right student collaborators.'],
  '/client/applications': ['Applications', 'Review and compare applicants for your projects.'],
  '/admin/dashboard': ['Admin dashboard', 'Monitor platform activity, verification, and reports.'],
}

function getPageDetails(pathname) {
  if (pageDetails[pathname]) return pageDetails[pathname]
  if (/^\/student\/projects\/[^/]+$/.test(pathname)) {
    return ['Project details', 'Review the project and submit an application.']
  }
  if (pathname.startsWith('/workspace/')) {
    return ['Project workspace', 'Coordinate tasks and conversations with your team and client.']
  }
  return ['Page not found', 'The page you requested is not available.']
}

export default function RoutePlaceholder() {
  const { pathname } = useLocation()
  const [title, description] = getPageDetails(pathname)
  const isHome = pathname === '/'

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-700">
          CampusXchange
        </p>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        {isHome && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              I am a Student
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              I am a Business
            </Link>
          </div>
        )}
        <p className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-500">
          This screen is ready for its feature UI.
        </p>
      </div>
    </section>
  )
}
