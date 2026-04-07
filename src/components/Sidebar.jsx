import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  FileText,
  Image,
  Target,
  Lock,
  Headphones,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',             active: true,  locked: false },
  { icon: BarChart2,       label: 'Campagne Details',      active: false, locked: true  },
  { icon: FileText,        label: 'Maandrapport',          active: false, locked: true  },
  { icon: Image,           label: 'Advertentie Overzicht', active: false, locked: true  },
  { icon: Target,          label: 'Doelen & KPIs',         active: false, locked: true  },
];

export default function Sidebar({ client }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const color = client?.color ?? '#6C00EE';
  const initials = client?.initials ?? '??';
  const name = client?.name ?? '';
  const fullName = client?.fullName ?? '';

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#0d0f14',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo / client name */}
      <div style={{ height: 60, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${color}26`,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color,
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#f4f4f5', lineHeight: 1.2 }}>
            {name}
          </p>
          <p style={{ fontSize: 10, color: '#71717a', marginTop: 1 }}>
            by InnovaIgency
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginInline: 16, marginBottom: 8 }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          color: '#71717a', textTransform: 'uppercase', padding: '8px 8px 4px',
        }}>
          Menu
        </p>
        {navItems.map(({ icon: Icon, label, active, locked }) => (
          <div key={label} className="tooltip-wrapper">
            <button
              disabled={locked}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '0 10px',
                height: 40,
                borderRadius: 8,
                border: 'none',
                borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                cursor: locked ? 'default' : 'pointer',
                background: active ? `${color}1a` : 'transparent',
                color: active ? color : locked ? '#3f3f46' : '#71717a',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                fontFamily: 'inherit',
                transition: 'background 0.15s ease, color 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!locked && !active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#d4d4d8';
                }
              }}
              onMouseLeave={e => {
                if (!locked && !active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#71717a';
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {locked && <Lock size={11} strokeWidth={1.8} style={{ color: '#3f3f46' }} />}
            </button>
            {locked && <span className="tooltip-text">Beschikbaar in volgende update</span>}
          </div>
        ))}
      </nav>

      {/* Back to admin */}
      <div style={{ padding: '0 10px 8px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 10px', height: 36,
            borderRadius: 8, border: 'none',
            background: 'transparent',
            color: '#71717a', fontSize: 12,
            fontFamily: 'inherit', cursor: 'pointer',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ChevronLeft size={14} />
          Alle klanten
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px 18px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `${color}1f`,
            border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: '#71717a', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = color}
                onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
              >
                <Headphones size={10} />
                Support
              </button>
              <button
                onClick={() => { logout(); navigate(`/login/${client?.id ?? ''}`); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: '#71717a', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
              >
                <LogOut size={10} />
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
