import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClient } from '../config/clients';
import { adminCredentials, clientCredentials } from '../config/auth';

export default function LoginPage() {
  const { clientId } = useParams();
  const isAdmin = !clientId;
  const client = clientId ? getClient(clientId) : null;

  const accent = isAdmin ? '#6C00EE' : (client?.color ?? '#6C00EE');
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const { loginAdmin, loginClient } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Vul je e-mailadres en wachtwoord in.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Voer een geldig e-mailadres in.'); return; }

    if (isAdmin) {
      if (email === adminCredentials.email && password === adminCredentials.password) {
        loginAdmin(); navigate('/');
      } else { setError('Onjuiste inloggegevens.'); }
    } else {
      const creds = clientCredentials[clientId];
      if (creds && email === creds.email && password === creds.password) {
        loginClient(clientId); navigate(`/client/${clientId}`);
      } else { setError('Onjuiste inloggegevens.'); }
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
    }}>
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

        {/* Icon */}
        <div style={{
          width: 52, height: 52,
          borderRadius: 14,
          background: '#1a1d24',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          <LogIn size={22} color="#f4f4f5" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          color: '#f4f4f5', textAlign: 'center',
          marginBottom: 8, lineHeight: 1.2,
        }}>
          Inloggen met e-mail
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 13, color: '#71717a',
          textAlign: 'center', lineHeight: 1.6,
          marginBottom: 28, maxWidth: 280,
        }}>
          {isAdmin
            ? 'Toegang tot het InnovaIgency beheerderspaneel'
            : `Toegang tot het ${client.name} dashboard`}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Email input */}
          <div style={{ position: 'relative' }}>
            <span style={iconStyle}><Mail size={15} strokeWidth={1.8} /></span>
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.55)`}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              style={inputStyle}
            />
          </div>

          {/* Password input */}
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

          {/* Error + Forgot password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18 }}>
            {error
              ? <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
              : <span />}
            <button
              type="button"
              style={{
                fontSize: 12, fontWeight: 500,
                color: '#52525b', background: 'none',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', padding: 0,
                transition: 'color 0.15s', marginLeft: 'auto',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#a3a3a3'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            >
              Wachtwoord vergeten?
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            style={{
              marginTop: 6,
              width: '100%',
              padding: '13px',
              background: accent,
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'filter 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            Aan de slag
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center',
          width: '100%', margin: '24px 0 16px',
          gap: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 12, color: '#52525b', whiteSpace: 'nowrap' }}>Of inloggen met</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {[
            { src: 'https://www.svgrepo.com/show/475656/google-color.svg', alt: 'Google' },
            { src: 'https://www.svgrepo.com/show/448224/facebook.svg',     alt: 'Facebook' },
            { src: 'https://www.svgrepo.com/show/511330/apple-173.svg',    alt: 'Apple' },
          ].map(({ src, alt }) => (
            <button
              key={alt}
              type="button"
              style={{
                flex: 1,
                height: 46,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a1d24'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <img src={src} alt={alt} style={{ width: 20, height: 20 }} />
            </button>
          ))}
        </div>

      </div>

      {/* Below card branding */}
      <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 24 }}>
        InnovaIgency — Dashboard Platform
      </p>
    </div>
  );
}
