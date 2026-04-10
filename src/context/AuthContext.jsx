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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session) {
        const cacheKey = `igcy_profile_${session.user.id}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          // Unblock the UI immediately with cached profile
          setProfile(JSON.parse(cached));
          setLoading(false);
          // Silently refresh in the background
          fetchProfile(session.user.id).then(fresh => {
            if (fresh) {
              setProfile(fresh);
              localStorage.setItem(cacheKey, JSON.stringify(fresh));
            }
          });
        } else {
          // First login — fetch, cache, then unblock
          const p = await fetchProfile(session.user.id);
          if (p) {
            setProfile(p);
            localStorage.setItem(cacheKey, JSON.stringify(p));
          }
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      if (session) {
        const p = await fetchProfile(session.user.id);
        if (p) {
          setProfile(p);
          localStorage.setItem(`igcy_profile_${session.user.id}`, JSON.stringify(p));
        }
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
