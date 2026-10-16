import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Applications from './pages/client/Applications.jsx'
import PostProject from './pages/client/PostProject.jsx'
import AuthPage from './pages/AuthPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import NotFound from './pages/NotFound.jsx'
import Dashboard from './pages/student/Dashboard.jsx'
import Partners from './pages/student/Partners.jsx'
import Profile from './pages/student/Profile.jsx'
import ProjectDetails from './pages/student/ProjectDetails.jsx'
import Projects from './pages/student/Projects.jsx'
import Teams from './pages/student/Teams.jsx'
import Workspace from './pages/Workspace.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="student" element={<AppLayout area="student" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="partners" element={<Partners />} />
        <Route path="teams" element={<Teams />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
      </Route>
      <Route path="client" element={<AppLayout area="client" />}>
        <Route index element={<Navigate to="post-project" replace />} />
        <Route path="post-project" element={<PostProject />} />
        <Route path="applications" element={<Applications />} />
      </Route>
      <Route path="admin" element={<AppLayout area="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>
      <Route path="workspace/:projectId" element={<AppLayout area="workspace" />}>
        <Route index element={<Workspace />} />
      </Route>
    </Routes>
  )
}

export default App
