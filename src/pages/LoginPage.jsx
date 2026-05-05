import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getClient } from '../config/clients';

export default function LoginPage() {
  const { clientId } = useParams();
  const isAdmin = !clientId;
  const client = clientId ? getClient(clientId) : null;

  const accent = isAdmin ? '#6C00EE' : (client?.color ?? '#6C00EE');
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const [view, setView]         = useState('login'); // 'login' | 'forgot' | 'sent'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, session } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in (e.g. returning visitor with cached session)
  useEffect(() => {
    if (!session.role) return;
    if (session.role === 'admin') navigate('/dashboard', { replace: true });
    else if (session.clientId) navigate(`/client/${session.clientId}`, { replace: true });
  }, [session.role]);

  // Allow login with bare username (e.g. "Zitcomfort") in addition to email.
  // We append @innovagency.nl when the input has no '@'. Real emails are
  // passed through unchanged.
  function normalizeIdentifier(raw) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed.toLowerCase();
    return `${trimmed.toLowerCase()}@innovagency.nl`;
  }

  async function handleForgot(e) {
    e.preventDefault();
    const id = normalizeIdentifier(email);
    if (!id) { setError('Voer je gebruikersnaam of e-mailadres in.'); return; }
    setError('');
    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(id, {
      redirectTo: 'https://app.innovagency.nl/reset-password',
    });
    setSubmitting(false);
    setView('sent');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const id = normalizeIdentifier(email);
    if (!id || !password) { setError('Vul je gebruikersnaam en wachtwoord in.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await signIn(id, password);
      // Navigate immediately — ProtectedRoute will wait for profile to load
      if (!clientId) navigate('/dashboard', { replace: true });
      else navigate(`/client/${clientId}`, { replace: true });
    } catch {
      setError('Onjuiste inloggegevens. Probeer het opnieuw.');
      setSubmitting(false);
    }
  }

  if (clientId && !client) return null;

  const inputStyle = {
    width: '100%',
    padding: '11px 14px 11px 40px',
    background: '#111318',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    color: '#f4f4f5',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const iconStyle = {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#52525b',
    pointerEvents: 'none',
    display: 'flex',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0c10',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
    }}>
      {/* PZNN logo — subtle, top-right */}
      <a
        href="https://pznn.nl"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: 24, right: 24,
          opacity: 0.55,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.55'}
      >
        <img src="/logo-pznn.svg" alt="PZNN" style={{ height: 22, display: 'block' }} />
      </a>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#0d0f14',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: '40px 36px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* ── SENT VIEW ── */}
        {view === 'sent' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            }}>
              <CheckCircle size={22} color="#22c55e" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 8 }}>
              Check je e-mail
            </h1>
            <p style={{ fontSize: 13, color: '#71717a', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
              We hebben een resetlink gestuurd naar <strong style={{ color: '#a1a1aa' }}>{email}</strong>. Klik op de link in de e-mail om je wachtwoord in te stellen.
            </p>
            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#71717a', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
              onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
            >
              <ArrowLeft size={14} /> Terug naar inloggen
            </button>
          </>
        )}

        {/* ── FORGOT VIEW ── */}
        {view === 'forgot' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `rgba(${r},${g},${b},0.1)`, border: `1px solid rgba(${r},${g},${b},0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            }}>
              <Mail size={22} color={accent} strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 8 }}>
              Wachtwoord vergeten
            </h1>
            <p style={{ fontSize: 13, color: '#71717a', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
              Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
            </p>
            <form onSubmit={handleForgot} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Mail size={15} strokeWidth={1.8} /></span>
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Gebruikersnaam of e-mailadres"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.55)`}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  style={inputStyle}
                  autoFocus
                />
              </div>
              {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4, width: '100%', padding: '13px',
                  background: accent, border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: 15, fontWeight: 600,
                  fontFamily: 'inherit', cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1, transition: 'filter 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                    Bezig…
                  </>
                ) : 'Verstuur resetlink'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              style={{
                marginTop: 20, display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#71717a', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
              onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
            >
              <ArrowLeft size={14} /> Terug naar inloggen
            </button>
          </>
        )}

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: '#1a1d24', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}>
              <LogIn size={22} color="#f4f4f5" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f4f4f5', textAlign: 'center', marginBottom: 8, lineHeight: 1.2 }}>
              Inloggen met e-mail
            </h1>
            <p style={{ fontSize: 13, color: '#71717a', textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
              {isAdmin ? 'Toegang tot het Innovagency beheerderspaneel' : `Toegang tot het ${client.name} dashboard`}
            </p>
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Mail size={15} strokeWidth={1.8} /></span>
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Gebruikersnaam of e-mailadres"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.55)`}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  style={inputStyle}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Lock size={15} strokeWidth={1.8} /></span>
                <input
                  type="password"
                  placeholder="Wachtwoord"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.55)`}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
                {error
                  ? <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
                  : <span />}
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); }}
                  style={{
                    fontSize: 12, fontWeight: 500, color: '#52525b',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', padding: 0, transition: 'color 0.15s', marginLeft: 'auto',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = `rgba(${r},${g},${b},1)`}
                  onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
                >
                  Wachtwoord vergeten?
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 6, width: '100%', padding: '13px',
                  background: accent, border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: 15, fontWeight: 600,
                  fontFamily: 'inherit', cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'filter 0.15s, opacity 0.15s', letterSpacing: '0.01em',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                    Bezig met inloggen…
                  </>
                ) : 'Aan de slag'}
              </button>
            </form>
          </>
        )}

      </div>

      {/* Below card branding */}
      <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 24 }}>
        Innovagency — Dashboard Platform
      </p>
    </div>
  );
}
