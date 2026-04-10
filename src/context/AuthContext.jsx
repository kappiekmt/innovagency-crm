import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Optimistically populate from localStorage so the UI never blocks on a network call
  const lastUserId = localStorage.getItem('igcy_last_user_id');
  const lastProfile = lastUserId ? localStorage.getItem(`igcy_profile_${lastUserId}`) : null;

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(lastProfile ? JSON.parse(lastProfile) : null);
  // If we have a cached profile we can render immediately — no spinner
  const [loading, setLoading] = useState(!lastProfile);

  useEffect(() => {
    // Safety valve: never show a spinner for more than 4 seconds
    const timeout = setTimeout(() => setLoading(false), 4000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);

      if (!session) {
        // Logged out — clear cache
        localStorage.removeItem('igcy_last_user_id');
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      localStorage.setItem('igcy_last_user_id', session.user.id);

      const cacheKey = `igcy_profile_${session.user.id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        // Already rendered from cache — just make sure loading is off
        // and quietly refresh the profile in the background
        setProfile(JSON.parse(cached));
        setLoading(false);
        fetchProfile(session.user.id).then(fresh => {
          if (fresh) {
            setProfile(fresh);
            localStorage.setItem(cacheKey, JSON.stringify(fresh));
          }
        });
      } else {
        // First login — fetch, cache, unblock
        const p = await fetchProfile(session.user.id);
        if (p) {
          setProfile(p);
          localStorage.setItem(cacheKey, JSON.stringify(p));
        }
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
          localStorage.setItem('igcy_last_user_id', session.user.id);
          localStorage.setItem(`igcy_profile_${session.user.id}`, JSON.stringify(p));
        }
      } else {
        localStorage.removeItem('igcy_last_user_id');
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, client_id')
      .eq('id', userId)
      .single();
    if (error) { console.error('[AuthContext] fetchProfile:', error.message); return null; }
    return data;
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    localStorage.removeItem('igcy_last_user_id');
    await supabase.auth.signOut();
  }

  const authSession = {
    role:     profile?.role      ?? null,
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
