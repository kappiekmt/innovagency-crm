import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save, Mail } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useIsMobile } from '../hooks/useIsMobile';

const CARD  = { background: '#161A1F', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: '24px' };
const INPUT = {
  width: '100%', padding: '9px 12px 9px 40px', borderRadius: 8, fontSize: 13,
  background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F4F4F5', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const LABEL = { fontSize: 11, fontWeight: 600, color: '#71717A', marginBottom: 6, display: 'block' };

export default function ProfilePage() {
  const isMobile = useIsMobile();
  const { profile, supaSession } = useAuth();
  const { toast } = useToast();
  const email = supaSession?.user?.email ?? '—';
  const role  = profile?.role ?? '—';

  const [pw, setPw]           = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (pw.next.length < 8)       { setError('Nieuw wachtwoord moet minimaal 8 tekens zijn.'); return; }
    if (pw.next !== pw.confirm)   { setError('Wachtwoorden komen niet overeen.'); return; }
    setError('');
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw.next });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast('Wachtwoord opgeslagen', 'success');
    setPw({ current: '', next: '', confirm: '' });
  }

  function initials(email) {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  }

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Mijn profiel</h1>
          <p style={{ fontSize: 13, color: '#71717A' }}>Bekijk je account en wijzig je wachtwoord</p>
        </div>

        {/* Account info */}
        <div style={{ ...CARD, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5', marginBottom: 20 }}>Account</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#3B82F6', flexShrink: 0,
            }}>
              {initials(email)}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F4F4F5' }}>{email}</p>
              <span style={{
                display: 'inline-block', marginTop: 4,
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: role === 'owner' ? 'rgba(245,158,11,0.1)' : role === 'admin' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                color: role === 'owner' ? '#F59E0B' : role === 'admin' ? '#3B82F6' : '#22C55E',
                border: `1px solid ${role === 'owner' ? 'rgba(245,158,11,0.25)' : role === 'admin' ? 'rgba(59,130,246,0.25)' : 'rgba(34,197,94,0.25)'}`,
              }}>
                {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Klant'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LABEL}>E-mailadres</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525B', display: 'flex' }}>
                  <Mail size={14} />
                </span>
                <input style={{ ...INPUT, color: '#52525B' }} value={email} disabled />
              </div>
            </div>
            <div>
              <label style={LABEL}>Rol</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525B', display: 'flex' }}>
                  <User size={14} />
                </span>
                <input style={{ ...INPUT, color: '#52525B' }} value={role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Klant'} disabled />
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div style={CARD}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Wachtwoord wijzigen</h2>
          <p style={{ fontSize: 12, color: '#71717A', marginBottom: 20 }}>Kies een sterk wachtwoord van minimaal 8 tekens.</p>

          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'next',    label: 'Nieuw wachtwoord'        },
              { key: 'confirm', label: 'Bevestig nieuw wachtwoord' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={LABEL}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525B', display: 'flex' }}>
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    style={INPUT}
                    value={pw[key]}
                    onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                  {key === 'next' && (
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#52525B', display: 'flex',
                    }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}

            <div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
                }}
              >
                <Save size={13} /> {saving ? 'Bezig…' : 'Wachtwoord opslaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
