import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import SetPasswordModal from './components/SetPasswordModal';
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

// Smart root redirect — works for invite links, direct visits, and all roles
function RootRedirect() {
  const { session, supaSession, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#3B82F6', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!supaSession) return <Navigate to="/login" replace />;
  if (!session.role) return null; // still loading profile — auth state will update

  if (session.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (session.role === 'client' && session.clientId) return <Navigate to={`/client/${session.clientId}`} replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  // Read hash synchronously before Supabase clears it
  const [needsPassword, setNeedsPassword] = useState(
    () => window.location.hash.includes('type=invite')
  );

  return (
    <AuthProvider>
      <ToastProvider>
        {needsPassword && <SetPasswordModal onDone={() => setNeedsPassword(false)} />}
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

            {/* Root: smart redirect for invite links and direct visits */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
