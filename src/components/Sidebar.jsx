import {
  LayoutDashboard,
  BarChart2,
  FileText,
  Image,
  Target,
  Lock,
  Headphones,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',           active: true,  locked: false },
  { icon: BarChart2,       label: 'Campagne Details',    active: false, locked: true  },
  { icon: FileText,        label: 'Maandrapport',        active: false, locked: true  },
  { icon: Image,           label: 'Advertentie Overzicht', active: false, locked: true },
  { icon: Target,          label: 'Doelen & KPIs',       active: false, locked: true  },
];

const ZitcomfortLogo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#f97316" fillOpacity="0.15" />
    <path
      d="M8 22h16M10 22v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6M12 14v-2a4 4 0 0 1 8 0v2"
      stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
    <path d="M16 10V8" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function Sidebar() {
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
      {/* Logo */}
      <div style={{ height: 60, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <ZitcomfortLogo />
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#f4f4f5', lineHeight: 1.2 }}>
            Zitcomfort
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
                border: active ? 'none' : 'none',
                borderLeft: active ? '2px solid #f97316' : '2px solid transparent',
                cursor: locked ? 'default' : 'pointer',
                background: active ? 'rgba(249,115,22,0.10)' : 'transparent',
                color: active ? '#f97316' : locked ? '#3f3f46' : '#71717a',
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

      {/* Footer */}
      <div style={{ padding: '12px 14px 18px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#f97316', flexShrink: 0,
          }}>
            ZC
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5' }}>Zitcomfort B.V.</p>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: '#71717a', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
            >
              <Headphones size={10} />
              Support
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
