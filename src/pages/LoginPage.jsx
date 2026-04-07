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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0c10',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#0d0f14',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
      }}>

        {/* Icon */}
        <div style={{
          width: 44, height: 44,
          borderRadius: 12,
          background: `rgba(${r},${g},${b},0.12)`,
          border: `1px solid rgba(${r},${g},${b},0.22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <LogIn size={20} color={accent} strokeWidth={1.8} />
        </div>

        {/* Title */}
        <p style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5', marginBottom: 4, lineHeight: 1.2 }}>
          {isAdmin ? 'Beheerder inloggen' : `${client.name}`}
        </p>
        <p style={{ fontSize: 13, color: '#71717a', marginBottom: 32, lineHeight: 1.5 }}>
          {isAdmin
            ? 'Inloggen bij InnovaIgency dashboard beheer'
            : `Inloggen bij het ${client.name} dashboard`}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={15} strokeWidth={1.8} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none',
            }} />
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.5)`}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                color: '#f4f4f5',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={15} strokeWidth={1.8} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none',
            }} />
            <input
              type="password"
              placeholder="Wachtwoord"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.5)`}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                color: '#f4f4f5',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Error + forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 }}>
            {error
              ? <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
              : <span />}
            <button
              type="button"
              style={{
                fontSize: 12, color: '#52525b', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                padding: 0, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#a3a3a3'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            >
              Wachtwoord vergeten?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              marginTop: 4,
              width: '100%',
              padding: '11px',
              background: accent,
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            Inloggen
          </button>
        </form>

        {/* Footer */}
        <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 32, textAlign: 'center' }}>
          InnovaIgency — Dashboard Platform
        </p>
      </div>
    </div>
  );
}
