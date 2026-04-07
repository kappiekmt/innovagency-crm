import { useNavigate } from 'react-router-dom';
import { clients } from '../config/clients';
import { LayoutDashboard, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#0d0f14',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(108,0,238,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutDashboard size={16} color="#6C00EE" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#f4f4f5', lineHeight: 1.2 }}>InnovaIgency</p>
            <p style={{ fontSize: 11, color: '#71717a' }}>Dashboard beheer</p>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#52525b', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            padding: '6px 10px', borderRadius: 8, transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f4f4f5'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={14} />
          Uitloggen
        </button>
      </header>

      {/* Body */}
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f4f4f5', marginBottom: 6 }}>
          Klanten
        </h1>
        <p style={{ fontSize: 13, color: '#71717a', marginBottom: 32 }}>
          Selecteer een klant om het dashboard te openen.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => navigate(`/client/${client.id}`)}
              style={{
                background: '#0d0f14',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${client.color}55`;
                e.currentTarget.style.background = `${client.color}0a`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.background = '#0d0f14';
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: `${client.color}1f`,
                border: `1px solid ${client.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: client.color,
              }}>
                {client.initials}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#f4f4f5', marginBottom: 2 }}>
                  {client.name}
                </p>
                <p style={{ fontSize: 12, color: '#71717a' }}>{client.fullName}</p>
              </div>

              <ArrowRight size={16} color="#3f3f46" />
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '16px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 11, color: '#3f3f46' }}>InnovaIgency — Dashboard Platform</p>
      </footer>
    </div>
  );
}
