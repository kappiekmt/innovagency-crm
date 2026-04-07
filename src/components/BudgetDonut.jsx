import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';

function formatEuro(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value, decimals = 1) {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}

const COLORS = ['#6C00EE', '#3b82f6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: '#1c1f26',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, color: '#f4f4f5', marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: '#71717a' }}>
        {formatEuro(d.value)} · {formatNumber(d.pct)}%
      </p>
    </div>
  );
};

function renderCenterLabel({ viewBox }, totalSpend) {
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-10" fontSize={11} fill="#71717a">
        Totaal
      </tspan>
      <tspan x={cx} dy="22" fontSize={17} fontWeight={700} fill="#f4f4f5">
        {formatEuro(totalSpend)}
      </tspan>
    </text>
  );
}

export default function BudgetDonut({ data }) {
  if (!data) return null;
  const { meta, googleAds } = data;
  const total = meta.spend + googleAds.spend;

  const chartData = [
    { name: 'Meta Ads', value: meta.spend, pct: total > 0 ? (meta.spend / total) * 100 : 0 },
    { name: 'Google Ads', value: googleAds.spend, pct: total > 0 ? (googleAds.spend / total) * 100 : 0 },
  ];

  return (
    <div
      className="card animate-in animate-delay-4"
      style={{ padding: '20px', width: 280, flexShrink: 0 }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 500, color: '#71717a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Budgetverdeling
      </h3>
      <p style={{ fontSize: 11, color: '#52525b', marginBottom: 12 }}>
        Huidige maand
      </p>

      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            dataKey="value"
            animationBegin={200}
            animationDuration={900}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} stroke="none" />
            ))}
            <Label
              position="center"
              content={(props) => renderCenterLabel(props, total)}
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        {chartData.map((entry, i) => (
          <div
            key={entry.name}
            className="flex items-center justify-between"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: COLORS[i], display: 'inline-block', flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#d4d4d8' }}>
                {entry.name}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5' }}>
                {formatEuro(entry.value)}
              </span>
              <span style={{ fontSize: 11, color: '#71717a', marginLeft: 6 }}>
                {formatNumber(entry.pct)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
