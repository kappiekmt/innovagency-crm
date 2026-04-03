import { Euro, ShoppingCart, TrendingUp, Percent } from 'lucide-react';

function formatEuro(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}

const PREV = {
  totalSpend: 17200,
  totalConversions: 140,
  avgCpa: 122.86,
  conversionRate: 0.38,
};

function TrendBadge({ current, previous, invertColors = false }) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct >= 0;
  const isGood = invertColors ? !isPositive : isPositive;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '4px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase',
      background: isGood ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
      color: isGood ? '#22c55e' : '#ef4444',
    }}>
      {isPositive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function KPICard({ icon: Icon, label, value, trend, iconColor, accentBg, delay }) {
  return (
    <div
      className="card animate-in"
      style={{ padding: '20px', animationDelay: `${delay}ms`, position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 60,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: '#71717a', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: iconColor }} strokeWidth={1.8} />
        </div>
      </div>
      <p style={{
        fontSize: 36, fontWeight: 700, color: '#f4f4f5',
        lineHeight: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.5px',
      }}>
        {value}
      </p>
      {trend}
    </div>
  );
}

export default function KPICards({ data }) {
  if (!data) return null;
  const { totalSpend, totalConversions, avgCpa, conversionRate } = data.summary;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
      <KPICard
        icon={Euro} label="Totale Uitgaven"
        value={formatEuro(totalSpend)}
        iconColor="#f97316" accentBg="rgba(249,115,22,0.12)" delay={80}
        trend={<TrendBadge current={totalSpend} previous={PREV.totalSpend} />}
      />
      <KPICard
        icon={ShoppingCart} label="Totale Conversies"
        value={formatNumber(totalConversions)}
        iconColor="#22c55e" accentBg="rgba(34,197,94,0.12)" delay={160}
        trend={<TrendBadge current={totalConversions} previous={PREV.totalConversions} />}
      />
      <KPICard
        icon={TrendingUp} label="Gemiddelde CPA"
        value={formatEuro(avgCpa)}
        iconColor="#eab308" accentBg="rgba(234,179,8,0.12)" delay={240}
        trend={<TrendBadge current={avgCpa} previous={PREV.avgCpa} invertColors />}
      />
      <KPICard
        icon={Percent} label="Conversieratio"
        value={`${formatNumber(conversionRate, 2)}%`}
        iconColor="#3b82f6" accentBg="rgba(59,130,246,0.12)" delay={320}
        trend={<TrendBadge current={conversionRate} previous={PREV.conversionRate} />}
      />
    </div>
  );
}
