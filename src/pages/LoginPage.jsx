import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClient } from '../config/clients';
import { adminCredentials, clientCredentials } from '../config/auth';

export default function LoginPage() {
  const { clientId } = useParams(); // undefined = admin login
  const isAdmin = !clientId;
  const client = clientId ? getClient(clientId) : null;

  const accentColor = isAdmin ? '#6C00EE' : (client?.color ?? '#6C00EE');
  const r = parseInt(accentColor.slice(1, 3), 16);
  const g = parseInt(accentColor.slice(3, 5), 16);
  const b = parseInt(accentColor.slice(5, 7), 16);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { loginAdmin, loginClient } = useAuth();
  const navigate = useNavigate();

  function handleSignIn(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Vul je e-mailadres en wachtwoord in.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Voer een geldig e-mailadres in.');
      return;
    }

    if (isAdmin) {
      if (email === adminCredentials.email && password === adminCredentials.password) {
        loginAdmin();
        navigate('/');
      } else {
        setError('Onjuiste inloggegevens.');
      }
    } else {
      const creds = clientCredentials[clientId];
      if (creds && email === creds.email && password === creds.password) {
        loginClient(clientId);
        navigate(`/client/${clientId}`);
      } else {
        setError('Onjuiste inloggegevens.');
      }
    }
  }

  // If clientId provided but not found, redirect to admin login
  if (clientId && !client) {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: '#0a0c10' }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center rounded-3xl p-8"
        style={{
          background: '#0d0f14',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{
            background: `rgba(${r},${g},${b},0.12)`,
            border: `1px solid rgba(${r},${g},${b},0.25)`,
          }}
        >
          <LogIn className="w-7 h-7" style={{ color: accentColor }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-2 text-center" style={{ color: '#f4f4f5' }}>
          {isAdmin ? 'Admin inloggen' : `${client.name} inloggen`}
        </h2>
        <p className="text-sm mb-6 text-center" style={{ color: '#71717a' }}>
          {isAdmin
            ? 'Toegang tot het InnovaIgency beheerderspaneel'
            : `Toegang tot het ${client.name} dashboard`}
        </p>

        {/* Form */}
        <form className="w-full flex flex-col gap-3 mb-2" onSubmit={handleSignIn}>
          {/* Email */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }}>
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="E-mailadres"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none transition"
              style={{
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f4f4f5',
              }}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.5)`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }}>
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Wachtwoord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none transition"
              style={{
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f4f4f5',
              }}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.5)`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Error + forgot */}
          <div className="flex items-center justify-between">
            {error
              ? <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
              : <span />}
            <button
              type="button"
              className="text-xs transition"
              style={{ color: '#52525b' }}
              onMouseEnter={e => e.currentTarget.style.color = accentColor}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            >
              Wachtwoord vergeten?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full font-semibold py-2.5 rounded-xl transition mt-1 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, rgba(${r},${g},${b},0.75))`,
              color: '#fff',
              fontSize: 14,
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            Inloggen
          </button>
        </form>

        {/* Branding */}
        <p className="text-xs mt-4" style={{ color: '#3f3f46' }}>
          Aangedreven door InnovaIgency
        </p>
      </div>
    </div>
  );
}
