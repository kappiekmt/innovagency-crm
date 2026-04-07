import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role, clientId }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0c10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#6C00EE', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (role === 'admin') {
    if (session.role !== 'admin') return <Navigate to="/login" replace />;
  }

  if (role === 'client') {
    if (session.role === 'admin') return children;
    if (session.role !== 'client' || session.clientId !== clientId) {
      return <Navigate to={`/login/${clientId}`} replace />;
    }
  }

  return children;
}
