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

  const accentColor = isAdmin ? '#6C00EE' : (client?.color ?? '#6C00EE');
  const r = parseInt(accentColor.slice(1, 3), 16);
  const g = parseInt(accentColor.slice(3, 5), 16);
  const b = parseInt(accentColor.slice(5, 7), 16);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const { loginAdmin, loginClient } = useAuth();
  const navigate = useNavigate();

  function handleSignIn(e) {
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
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#0a0c10' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center"
        style={{
          background: `linear-gradient(160deg, rgba(${r},${g},${b},0.07) 0%, #0d0f14 40%)`,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{
            background: '#111318',
            boxShadow: `0 4px 24px rgba(${r},${g},${b},0.25)`,
          }}
        >
          <LogIn className="w-7 h-7" style={{ color: accentColor }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-2 text-center" style={{ color: '#f4f4f5' }}>
          Inloggen met e-mail
        </h2>
        <p className="text-sm mb-6 text-center" style={{ color: '#71717a' }}>
          {isAdmin
            ? 'Toegang tot het InnovaIgency beheerderspaneel'
            : `Toegang tot het ${client.name} dashboard`}
        </p>

        {/* Inputs */}
        <div className="w-full flex flex-col gap-3 mb-2">
          {/* Email */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }}>
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="E-mailadres"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.55)`}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              className="w-full pl-10 pr-3 py-2 rounded-xl text-sm focus:outline-none placeholder:text-[#3f3f46] transition"
              style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', color: '#f4f4f5' }}
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
              onChange={e => setPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = `rgba(${r},${g},${b},0.55)`}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              className="w-full pl-10 pr-3 py-2 rounded-xl text-sm focus:outline-none placeholder:text-[#3f3f46] transition"
              style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', color: '#f4f4f5' }}
            />
          </div>

          {/* Error + forgot password */}
          <div className="w-full flex items-center justify-between">
            {error
              ? <span className="text-xs" style={{ color: '#ef4444' }}>{error}</span>
              : <span />}
            <button
              type="button"
              className="text-xs font-medium hover:underline"
              style={{ color: '#52525b' }}
              onMouseEnter={e => e.currentTarget.style.color = accentColor}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            >
              Wachtwoord vergeten?
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSignIn}
          className="w-full font-medium py-2 rounded-xl cursor-pointer transition mb-4 mt-2"
          style={{
            background: `linear-gradient(to bottom, rgba(${r},${g},${b},0.9), rgba(${r},${g},${b},0.65))`,
            color: '#fff',
            fontSize: 14,
            boxShadow: `0 2px 16px rgba(${r},${g},${b},0.3)`,
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.12)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          Inloggen
        </button>

        {/* Divider */}
        <div className="flex items-center w-full my-2">
          <div className="flex-grow border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          <span className="mx-3 text-xs" style={{ color: '#3f3f46' }}>Of inloggen met</span>
          <div className="flex-grow border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3 w-full justify-center mt-2">
          {[
            { src: 'https://www.svgrepo.com/show/475656/google-color.svg', alt: 'Google' },
            { src: 'https://www.svgrepo.com/show/448224/facebook.svg',     alt: 'Facebook' },
            { src: 'https://www.svgrepo.com/show/511330/apple-173.svg',    alt: 'Apple' },
          ].map(({ src, alt }) => (
            <button
              key={alt}
              className="flex items-center justify-center w-12 h-12 rounded-xl transition grow"
              style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = '#111318'}
            >
              <img src={src} alt={alt} className="w-6 h-6" />
            </button>
          ))}
        </div>

        {/* Branding */}
        <p className="text-xs mt-6" style={{ color: '#27272a' }}>
          Aangedreven door InnovaIgency
        </p>
      </div>
    </div>
  );
}
