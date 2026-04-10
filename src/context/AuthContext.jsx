import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Read role from localStorage without any network call
function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(`igcy_profile_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedProfile(userId, profile) {
  try {
    localStorage.setItem('igcy_last_user_id', userId);
    localStorage.setItem(`igcy_profile_${userId}`, JSON.stringify(profile));
  } catch {}
}

export function AuthProvider({ children }) {
  const [supaSession, setSupaSession] = useState(null); // raw Supabase session
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    // Safety: never block UI for more than 5 seconds
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSupaSession(session);

      if (session) {
        // Use cached profile immediately — no network call needed
        const cached = getCachedProfile(session.user.id);
        if (cached) setProfile(cached);
        setLoading(false);
        // Refresh profile silently in background
        fetchProfile(session.user.id).then(fresh => {
          if (fresh) { setProfile(fresh); setCachedProfile(session.user.id, fresh); }
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSupaSession(session);
      if (session) {
        // Use cache immediately, refresh in background
        const cached = getCachedProfile(session.user.id);
        if (cached) setProfile(cached);
        fetchProfile(session.user.id).then(fresh => {
          if (fresh) { setProfile(fresh); setCachedProfile(session.user.id, fresh); }
        });
      } else {
        setProfile(null);
        try { localStorage.removeItem('igcy_last_user_id'); } catch {}
      }
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, client_id')
        .eq('id', userId)
        .single();
      return data ?? null;
    } catch { return null; }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    try { localStorage.removeItem('igcy_last_user_id'); } catch {}
    await supabase.auth.signOut();
    setProfile(null);
    setSupaSession(null);
  }

  // ProtectedRoute reads both supaSession (raw) and profile (for role)
  const authSession = {
    role:     profile?.role      ?? null,
    clientId: profile?.client_id ?? null,
  };

  return (
    <AuthContext.Provider value={{ session: authSession, supaSession, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
