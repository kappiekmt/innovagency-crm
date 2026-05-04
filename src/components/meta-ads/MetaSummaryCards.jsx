import { formatEuro, formatNumber } from './format';

function Card({ label, value, accent }) {
  return (
    <div style={{
      background: '#111318',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '20px 22px',
      borderTop: `2px solid ${accent ?? 'rgba(255,255,255,0.06)'}`,
    }}>
      <div style={{ fontSize: 11, color: '#71717a', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#f4f4f5', lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

export default function MetaSummaryCards({ ads, accountReach, clientColor = '#6C00EE', isMobile }) {
  const totalSpend = ads.reduce((s, a) => s + (a.spend || 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalResults = ads.reduce((s, a) => s + (a.results || 0), 0);
  // Account-level reach is deduped (one user counted once across all ads).
  // Falls back to a per-ad sum only if the account-level reach isn't returned.
  const reachToShow = accountReach ?? ads.reduce((s, a) => s + (a.reach || 0), 0);

  const cards = [
    { label: 'Totale Spend', value: formatEuro(totalSpend, 2)     },
    { label: 'Bereik',       value: formatNumber(reachToShow)     },
    { label: 'Vertoningen',  value: formatNumber(totalImpressions) },
    { label: 'Resultaten',   value: formatNumber(totalResults)    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? 10 : 14,
    }}>
      {cards.map((c) => (
        <Card key={c.label} label={c.label} value={c.value} accent={clientColor} />
      ))}
    </div>
  );
}
