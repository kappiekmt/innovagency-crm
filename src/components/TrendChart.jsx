import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

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
      <p style={{ fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: entry.color, display: 'inline-block',
            }}
          />
          <span style={{ color: '#71717a' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {payload.map((entry) => (
      <div key={entry.dataKey} className="flex items-center gap-2">
        <span
          style={{
            width: 24, height: 3,
            background: entry.color,
            borderRadius: 2, display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

export default function TrendChart({ data }) {
  if (!data?.weekly) return null;

  return (
    <div
      className="card animate-in animate-delay-4"
      style={{ padding: '20px', flex: '1 1 0' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ fontSize: 13, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Trend over tijd
        </h3>
        <span
          style={{
            fontSize: 11, fontWeight: 600,
            color: '#71717a',
            background: 'rgba(255,255,255,0.06)',
            padding: '3px 10px',
            borderRadius: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Huidige maand
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data.weekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="metaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.20} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gadsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="organicGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717a" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          <Area
            type="monotone"
            dataKey="meta"
            name="Meta Ads"
            stroke="#f97316"
            strokeWidth={2.2}
            fill="url(#metaGrad)"
            dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="googleAds"
            name="Google Ads"
            stroke="#3b82f6"
            strokeWidth={2.2}
            fill="url(#gadsGrad)"
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="organic"
            name="Organisch"
            stroke="#71717a"
            strokeWidth={2}
            fill="url(#organicGrad)"
            dot={{ r: 3.5, fill: '#71717a', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
