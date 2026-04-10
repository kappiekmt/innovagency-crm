import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ClientDashboard from './pages/ClientDashboard';
import DashboardPage from './pages/DashboardPage';
import ClientsListPage from './pages/ClientsListPage';
import ClientDetailPage from './pages/ClientDetailPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';

function ClientDashboardRoute() {
  const { clientId } = useParams();
  return (
    <ProtectedRoute role="client" clientId={clientId}>
      <ClientDashboard />
    </ProtectedRoute>
  );
}

function AdminRoute({ children }) {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/:clientId" element={<LoginPage />} />

            {/* Legacy admin page (client selection grid) */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* New admin centre */}
            <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
            <Route path="/clients"   element={<AdminRoute><ClientsListPage /></AdminRoute>} />
            <Route path="/clients/:slug" element={<AdminRoute><ClientDetailPage /></AdminRoute>} />
            <Route path="/tasks"     element={<AdminRoute><TasksPage /></AdminRoute>} />
            <Route path="/settings"  element={<AdminRoute><SettingsPage /></AdminRoute>} />

            {/* Client-facing dashboards */}
            <Route path="/client/:clientId" element={<ClientDashboardRoute />} />

            {/* Root: redirect admins to dashboard, clients to their dashboard */}
            <Route path="/" element={<AdminRoute><Navigate to="/dashboard" replace /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
