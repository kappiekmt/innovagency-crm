import { RefreshCw, Menu } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function getDutchMonth() {
  const months = [
    'januari','februari','maart','april','mei','juni',
    'juli','augustus','september','oktober','november','december',
  ];
  const d = new Date();
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(date) {
  if (!date) return '—';
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export default function Header({ lastUpdated, onRefetch, isLoading, clientName = 'Zitcomfort', isMobile = false, onMenuOpen = () => {} }) {
  return (
    <header
      className="animate-in animate-delay-0"
      style={{
        background: '#0d0f14',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {isMobile && (
            <button onClick={onMenuOpen} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#A1A1AA', display: 'flex', flexShrink: 0 }}>
              <Menu size={18} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? 16 : 28, fontWeight: 600, color: '#f4f4f5', lineHeight: 1.2, marginBottom: isMobile ? 0 : 4, whiteSpace: isMobile ? 'nowrap' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMobile ? clientName : `${getGreeting()}, ${clientName} 👋`}
            </h1>
            {!isMobile && <p style={{ color: '#71717a', fontSize: 13 }}>Prestatierapport — {getDutchMonth()}</p>}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
          {!isMobile && (
            <span style={{ fontSize: 12, color: '#71717a' }}>
              Bijgewerkt: {formatTime(lastUpdated)}
            </span>
          )}

          {/* Refresh */}
          <button onClick={onRefetch} disabled={isLoading} title="Vernieuwen"
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: isLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', transition: 'background 0.15s ease' }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
}
