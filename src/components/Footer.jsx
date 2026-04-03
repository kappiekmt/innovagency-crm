import { ArrowRight, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 24px',
        background: '#0d0f14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
      }}
      className="animate-in animate-delay-6"
    >
      <button
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: '#71717a', fontWeight: 500,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', padding: 0, transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
        onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
      >
        Vragen over dit rapport? Neem contact op
        <ArrowRight size={13} />
      </button>

      <div className="flex items-center gap-2" style={{ color: '#52525b', fontSize: 12 }}>
        <RefreshCw size={12} />
        Dit rapport wordt automatisch bijgewerkt.
      </div>
    </footer>
  );
}
