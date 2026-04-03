import { useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';

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

export default function Header({ lastUpdated, onRefetch, isLoading, period, onPeriodChange }) {
  const [toast, setToast] = useState(false);

  function handleExport() {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  return (
    <header
      className="animate-in animate-delay-0"
      style={{
        background: '#0d0f14',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        {/* Left */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', lineHeight: 1.15, marginBottom: 4 }}>
            {getGreeting()}, Zitcomfort 👋
          </h1>
          <p style={{ color: '#71717a', fontSize: 13 }}>
            Prestatierapport — {getDutchMonth()}
          </p>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Last updated */}
          <span style={{ fontSize: 12, color: '#71717a' }}>
            Bijgewerkt: {formatTime(lastUpdated)}
          </span>

          {/* Period toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['Week', 'Maand'].map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: period === p ? '#f97316' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: period === p ? 600 : 400,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  background: period === p ? 'rgba(249,115,22,0.12)' : 'transparent',
                  color: period === p ? '#f97316' : '#71717a',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefetch}
            disabled={isLoading}
            title="Vernieuwen"
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              cursor: isLoading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#71717a',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 16px',
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#f97316',
              color: '#fff',
              fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'filter 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            <Download size={13} />
            Exporteren
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#1c1f26',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#f4f4f5',
          padding: '10px 18px', borderRadius: 9,
          fontSize: 13, fontWeight: 500, zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          Exportfunctie komt binnenkort beschikbaar
        </div>
      )}
    </header>
  );
}
