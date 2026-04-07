import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ClientDashboard from './pages/ClientDashboard';

function ClientDashboardRoute() {
  const { clientId } = useParams();
  return (
    <ProtectedRoute role="client" clientId={clientId}>
      <ClientDashboard />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/:clientId" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute role="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="/client/:clientId" element={<ClientDashboardRoute />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
