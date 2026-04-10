import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null);   // Supabase session
  const [profile, setProfile]   = useState(null);   // { role, client_id }
  const [loading, setLoading]   = useState(true);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, client_id')
      .eq('id', userId)
      .single();
    if (error) { console.error('[AuthContext] fetchProfile:', error.message); return null; }
    return data;
  }

  useEffect(() => {
    // getSession() reliably resolves the initial session and unblocks loading.
    // onAuthStateChange handles subsequent sign-in/sign-out events only,
    // skipping INITIAL_SESSION to avoid a double profile fetch.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return; // already handled above
      setSession(session);
      if (session) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Derived auth state (same shape ProtectedRoute expects)
  const authSession = {
    role:     profile?.role     ?? null,
    clientId: profile?.client_id ?? null,
  };

  return (
    <AuthContext.Provider value={{ session: authSession, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
