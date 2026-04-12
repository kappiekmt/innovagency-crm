import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#3B82F6', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ProtectedRoute({ children, role, clientId }) {
  const { session, supaSession, loading } = useAuth();

  // Still determining if there's a session at all
  if (loading) return <Spinner />;

  // Internal roles — all have access to admin centre (scoping handled per-page)
  const INTERNAL_ROLES = ['owner', 'account_manager', 'team_member', 'viewer'];

  if (role === 'admin') {
    if (!supaSession) return <Navigate to="/login" replace />;
    if (!session.role) return <Spinner />;
    if (!INTERNAL_ROLES.includes(session.role)) return <Navigate to="/login" replace />;
  }

  if (role === 'client') {
    if (!supaSession) return <Navigate to={`/login/${clientId}`} replace />;
    // Internal users can view any client dashboard
    if (INTERNAL_ROLES.includes(session.role)) return children;
    if (!session.role) return <Spinner />;
    if (!['client', 'client_admin', 'client_member'].includes(session.role) || session.clientId !== clientId) {
      return <Navigate to={`/login/${clientId}`} replace />;
    }
  }

  return children;
}
