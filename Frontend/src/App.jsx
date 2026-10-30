import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Applications from './pages/client/Applications.jsx'
import ClientProfile from './pages/client/Profile.jsx'
import ClientProjects from './pages/client/Projects.jsx'
import PostProject from './pages/client/PostProject.jsx'
import AuthPage from './pages/AuthPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import NotFound from './pages/NotFound.jsx'
import Dashboard from './pages/student/Dashboard.jsx'
import MyApplications from './pages/student/Applications.jsx'
import Partners from './pages/student/Partners.jsx'
import Profile from './pages/student/Profile.jsx'
import ProjectDetails from './pages/student/ProjectDetails.jsx'
import Projects from './pages/student/Projects.jsx'
import Teams from './pages/student/Teams.jsx'
import SkillRequests from './pages/student/SkillRequests.jsx'
import Workspace from './pages/Workspace.jsx'
import Notifications from './pages/Notifications.jsx'
import Messages from './pages/Messages.jsx'
import Verification from './pages/Verification.jsx'
import AuthAction from './pages/AuthAction.jsx'
import { getStoredUser, hasSession, SESSION_EXPIRED_EVENT } from './api.js'

function ProtectedArea({ roles, children }) {
  const location = useLocation()
  if (!hasSession()) return <Navigate to="/login" replace state={{ from: location }} />
  const user = getStoredUser()
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

function App() {
  const navigate = useNavigate()
  useEffect(() => {
    const handleExpiredSession = () => navigate('/login', { replace: true })
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession)
  }, [navigate])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="verify-email" element={<AuthAction action="verify" />} />
        <Route path="reset-password" element={<AuthAction action="reset" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="student" element={<ProtectedArea roles={['student']}><AppLayout area="student" /></ProtectedArea>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="verification" element={<Verification />} />
        <Route path="profile" element={<Profile />} />
        <Route path="partners" element={<Partners />} />
        <Route path="skill-requests" element={<SkillRequests />} />
        <Route path="teams" element={<Teams />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
      </Route>
      <Route path="client" element={<ProtectedArea roles={['client']}><AppLayout area="client" /></ProtectedArea>}>
        <Route index element={<Navigate to="post-project" replace />} />
        <Route path="post-project" element={<PostProject />} />
        <Route path="applications" element={<Applications />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="projects" element={<ClientProjects />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="verification" element={<Verification />} />
      </Route>
      <Route path="admin" element={<ProtectedArea roles={['admin']}><AppLayout area="admin" /></ProtectedArea>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>
      <Route path="workspace/:projectId" element={<ProtectedArea roles={['student', 'client']}><AppLayout area="workspace" /></ProtectedArea>}>
        <Route index element={<Workspace />} />
      </Route>
    </Routes>
  )
}

export default App
