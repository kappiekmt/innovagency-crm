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

export default function MetaSummaryCards({ ads, accountSummary, clientColor = '#6C00EE', isMobile }) {
  // Prefer account-level totals (match Meta Ads Manager exactly).
  // Fall back to summing per-ad numbers if account_summary is unavailable.
  const totalImpressions = accountSummary?.impressions ?? ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalResults     = accountSummary?.results     ?? ads.reduce((s, a) => s + (a.results || 0), 0);

  const cards = [
    { label: 'Vertoningen', value: formatNumber(totalImpressions) },
    { label: 'Resultaten',  value: formatNumber(totalResults)    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
      gap: isMobile ? 10 : 14,
    }}>
      {cards.map((c) => (
        <Card key={c.label} label={c.label} value={c.value} accent={clientColor} />
      ))}
    </div>
  );
}
