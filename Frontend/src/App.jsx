import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import RoutePlaceholder from './pages/RoutePlaceholder.jsx'
import Dashboard from './pages/student/Dashboard.jsx'
import Partners from './pages/student/Partners.jsx'
import Profile from './pages/student/Profile.jsx'
import ProjectDetails from './pages/student/ProjectDetails.jsx'
import Projects from './pages/student/Projects.jsx'
import Teams from './pages/student/Teams.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<RoutePlaceholder />} />
        <Route path="login" element={<RoutePlaceholder />} />
        <Route path="register" element={<RoutePlaceholder />} />

        <Route path="*" element={<RoutePlaceholder />} />
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
        <Route path="post-project" element={<RoutePlaceholder />} />
        <Route path="applications" element={<RoutePlaceholder />} />
      </Route>
      <Route path="admin" element={<AppLayout area="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RoutePlaceholder />} />
      </Route>
      <Route path="workspace/:projectId" element={<AppLayout area="workspace" />}>
        <Route index element={<RoutePlaceholder />} />
      </Route>
    </Routes>
  )
}

export default App
