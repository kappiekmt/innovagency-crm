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

function MetricRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 13, color: '#71717a' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d8', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

function PlatformCard({ name, dotColor, metrics, badge, badgeBg, badgeColor, delay }) {
  return (
    <div
      className="card animate-in"
      style={{ padding: '20px', animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: dotColor, display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#f4f4f5' }}>{name}</span>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 6, height: 24,
          display: 'inline-flex', alignItems: 'center',
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
          background: badgeBg, color: badgeColor,
        }}>
          {badge}
        </span>
      </div>

      <div>
        {metrics.map((m, i) => (
          <MetricRow key={m.label} label={m.label} value={m.value} last={i === metrics.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function PlatformCards({ data }) {
  if (!data) return null;
  const { meta, googleAds, analytics } = data;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      <PlatformCard
        name="Meta Ads" dotColor="#1877f2" delay={160}
        badge="Beste CPA 🏆"
        badgeBg="rgba(234,179,8,0.10)" badgeColor="#eab308"
        metrics={[
          { label: 'Uitgaven',   value: formatEuro(meta.spend) },
          { label: 'Conversies', value: formatNumber(meta.conversions) },
          { label: 'CPA',        value: formatEuro(meta.cpa) },
          { label: 'CTR',        value: `${formatNumber(meta.ctr, 2)}%` },
        ]}
      />
      <PlatformCard
        name="Google Ads" dotColor="#fbbc04" delay={240}
        badge="Hoogste bereik"
        badgeBg="rgba(255,255,255,0.06)" badgeColor="#71717a"
        metrics={[
          { label: 'Uitgaven',   value: formatEuro(googleAds.spend) },
          { label: 'Conversies', value: formatNumber(googleAds.conversions) },
          { label: 'CPA',        value: formatEuro(googleAds.cpa) },
          { label: 'CTR',        value: `${formatNumber(googleAds.ctr, 2)}%` },
        ]}
      />
      <PlatformCard
        name="Organisch" dotColor="#22c55e" delay={320}
        badge="Geen kosten"
        badgeBg="rgba(34,197,94,0.10)" badgeColor="#22c55e"
        metrics={[
          { label: 'Sessies',               value: formatNumber(analytics.sessions) },
          { label: 'Conversies',            value: formatNumber(analytics.conversions) },
          { label: 'Conversieratio',        value: `${formatNumber(analytics.conversionRate, 2)}%` },
          { label: 'Organische gebruikers', value: formatNumber(analytics.organicUsers) },
        ]}
      />
    </div>
  );
}
