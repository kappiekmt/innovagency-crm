import { useState } from 'react';
import { Lock, Eye, EyeOff, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordModal({ onClose, clientColor = '#6C00EE' }) {
  const { toast } = useToast();
  const [pw, setPw]       = useState({ next: '', confirm: '' });
  const [show, setShow]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (pw.next.length < 8)       { setError('Wachtwoord moet minimaal 8 tekens zijn.'); return; }
    if (pw.next !== pw.confirm)   { setError('Wachtwoorden komen niet overeen.'); return; }
    setError('');
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw.next });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast('Wachtwoord gewijzigd', 'success');
    onClose();
  }

  const INPUT = {
    width: '100%', padding: '11px 40px 11px 40px',
    background: '#111318', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#f4f4f5', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#0d0f14', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '40px 36px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#71717a',
          }}
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${clientColor}1a`, border: `1px solid ${clientColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <Lock size={22} color={clientColor} strokeWidth={1.8} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>
          Wachtwoord wijzigen
        </h1>
        <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, marginBottom: 28 }}>
          Kies een nieuw wachtwoord van minimaal 8 tekens.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'next',    placeholder: 'Nieuw wachtwoord'      },
            { key: 'confirm', placeholder: 'Bevestig wachtwoord'   },
          ].map(({ key, placeholder }) => (
            <div key={key} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#52525b', display: 'flex' }}>
                <Lock size={15} strokeWidth={1.8} />
              </span>
              <input
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                value={pw[key]}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                style={INPUT}
                required
              />
              {key === 'next' && (
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex',
                  }}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            </div>
          ))}

          {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 6, width: '100%', padding: '13px',
              background: clientColor, border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'filter 0.15s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            {saving ? 'Bezig…' : 'Wachtwoord wijzigen'}
          </button>
        </form>
      </div>
    </div>
  );
}
