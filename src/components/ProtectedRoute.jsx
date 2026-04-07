import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// role: 'admin' | 'client'
// clientId: required when role === 'client'
export default function ProtectedRoute({ children, role, clientId }) {
  const { session } = useAuth();

  if (role === 'admin') {
    if (session.role !== 'admin') return <Navigate to="/login" replace />;
  }

  if (role === 'client') {
    if (session.role !== 'client' || session.clientId !== clientId) {
      return <Navigate to={`/login/${clientId}`} replace />;
    }
  }

  return children;
}
