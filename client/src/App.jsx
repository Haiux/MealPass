import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Scanner from './pages/Scanner';
import Dashboard from './pages/admin/Dashboard';
import Cards from './pages/admin/Cards';
import Groups from './pages/admin/Groups';
import Schedules from './pages/admin/Schedules';
import Logs from './pages/admin/Logs';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';
import AuditLog from './pages/admin/AuditLog';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/scanner" element={
            <ProtectedRoute><Scanner /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cards" element={<Cards />} />
            <Route path="groups" element={<Groups />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="logs" element={<Logs />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-log" element={<AuditLog />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
