import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function SetPasswordModal({ onDone, isReset = false }) {
  const { toast } = useToast();
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [show, setShow]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Wachtwoord moet minimaal 8 tekens zijn.'); return; }
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen.'); return; }
    setError('');
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast('Wachtwoord ingesteld — welkom!', 'success');
    onDone();
  }

  const INPUT = {
    width: '100%', padding: '11px 40px 11px 40px',
    background: '#111318', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#f4f4f5', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#0d0f14', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '40px 36px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <Lock size={22} color="#3B82F6" strokeWidth={1.8} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>
          {isReset ? 'Nieuw wachtwoord instellen' : 'Stel je wachtwoord in'}
        </h1>
        <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, marginBottom: 28 }}>
          {isReset
            ? 'Kies een nieuw wachtwoord van minimaal 8 tekens.'
            : 'Kies een wachtwoord om in te kunnen blijven loggen op het dashboard.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Password */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#52525b', display: 'flex' }}>
              <Lock size={15} strokeWidth={1.8} />
            </span>
            <input
              type={show ? 'text' : 'password'}
              placeholder="Nieuw wachtwoord"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={INPUT}
              required
            />
            <button type="button" onClick={() => setShow(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex',
            }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Confirm */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#52525b', display: 'flex' }}>
              <Lock size={15} strokeWidth={1.8} />
            </span>
            <input
              type={show ? 'text' : 'password'}
              placeholder="Bevestig wachtwoord"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={INPUT}
              required
            />
          </div>

          {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 6, width: '100%', padding: '13px',
              background: '#3B82F6', border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'filter 0.15s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            {saving ? 'Bezig…' : 'Wachtwoord instellen'}
          </button>
        </form>
      </div>
    </div>
  );
}
