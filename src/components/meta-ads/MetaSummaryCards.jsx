import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatEuro, formatNumber } from './format';

function Delta({ pct }) {
  if (pct == null || !isFinite(pct)) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#71717a', fontSize: 11 }}>
        <Minus size={12} /> —
      </span>
    );
  }
  const positive = pct >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: 11, fontWeight: 600 }}>
      <Icon size={12} strokeWidth={2.4} />
      {positive ? '+' : ''}{formatNumber(pct, 1)}%
    </span>
  );
}

function Card({ label, value, delta, accent }) {
  return (
    <div style={{
      background: '#111318',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '16px 18px',
      borderTop: `2px solid ${accent ?? 'rgba(255,255,255,0.06)'}`,
    }}>
      <div style={{ fontSize: 11, color: '#71717a', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', lineHeight: 1.1 }}>{value}</div>
      <div style={{ marginTop: 8 }}>
        <Delta pct={delta} />
        <span style={{ fontSize: 11, color: '#71717a', marginLeft: 6 }}>vs. vorige periode</span>
      </div>
    </div>
  );
}

export default function MetaSummaryCards({ ads, prevDaily, clientColor = '#6C00EE', isMobile }) {
  const sum = (arr, key) => (arr ?? []).reduce((s, x) => s + (parseFloat(x[key]) || 0), 0);

  const totalSpend = ads.reduce((s, a) => s + (a.spend || 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalReach = ads.reduce((s, a) => s + (a.reach || 0), 0);
  const avgCpm = totalImpressions ? (totalSpend / totalImpressions) * 1000 : 0;
  const totalResults = ads.reduce((s, a) => s + (a.results || 0), 0);
  const cpr = totalResults ? totalSpend / totalResults : 0;

  // Period-over-period: compare daily totals to prevDaily totals
  const prevSpend = sum(prevDaily, 'spend');
  const prevImpr = sum(prevDaily, 'impressions');
  const prevResults = sum(prevDaily, 'results');
  const prevCpm = prevImpr ? (prevSpend / prevImpr) * 1000 : 0;
  const prevCpr = prevResults ? prevSpend / prevResults : 0;
  const dPct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

  const cards = [
    { label: 'Totale Spend',        value: formatEuro(totalSpend, 2),       delta: dPct(totalSpend, prevSpend) },
    { label: 'Vertoningen',         value: formatNumber(totalImpressions),  delta: dPct(totalImpressions, prevImpr) },
    { label: 'Bereik',              value: formatNumber(totalReach),        delta: null },
    { label: 'Gem. CPM',            value: formatEuro(avgCpm, 2),           delta: dPct(avgCpm, prevCpm) },
    { label: 'Resultaten',          value: formatNumber(totalResults),      delta: dPct(totalResults, prevResults) },
    { label: 'Kosten / Resultaat',  value: formatEuro(cpr, 2),              delta: dPct(cpr, prevCpr) },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
      gap: isMobile ? 10 : 14,
    }}>
      {cards.map((c) => (
        <Card key={c.label} label={c.label} value={c.value} delta={c.delta} accent={clientColor} />
      ))}
    </div>
  );
}
