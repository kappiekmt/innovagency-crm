import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem('dashboard_session');
    return raw ? JSON.parse(raw) : { role: null, clientId: null };
  } catch {
    return { role: null, clientId: null };
  }
}

function saveSession(session) {
  localStorage.setItem('dashboard_session', JSON.stringify(session));
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  function loginAdmin() {
    const s = { role: 'admin', clientId: null };
    setSession(s);
    saveSession(s);
  }

  function loginClient(clientId) {
    const s = { role: 'client', clientId };
    setSession(s);
    saveSession(s);
  }

  function logout() {
    const s = { role: null, clientId: null };
    setSession(s);
    saveSession(s);
  }

  return (
    <AuthContext.Provider value={{ session, loginAdmin, loginClient, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
