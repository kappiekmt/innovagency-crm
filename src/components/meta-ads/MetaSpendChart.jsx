import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatEuro, formatNumber } from './format';

const OVERLAY_OPTIONS = [
  { id: 'impressions', label: 'Vertoningen', color: '#3B82F6' },
  { id: 'results',     label: 'Resultaten',  color: '#22c55e' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#15181f', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 8, padding: '10px 12px', fontSize: 12,
    }}>
      <div style={{ color: '#a1a1aa', marginBottom: 6, fontSize: 11 }}>
        {new Date(label).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {p.dataKey === 'spend' ? formatEuro(p.value) : formatNumber(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function MetaSpendChart({ daily, clientColor = '#6C00EE', isMobile }) {
  const [overlay, setOverlay] = useState('impressions');
  const overlayCfg = OVERLAY_OPTIONS.find((o) => o.id === overlay);

  return (
    <div style={{
      background: '#111318',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Spend per dag
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {OVERLAY_OPTIONS.map((o) => {
            const active = o.id === overlay;
            return (
              <button
                key={o.id}
                onClick={() => setOverlay(o.id)}
                style={{
                  padding: '5px 11px', borderRadius: 6,
                  border: '1px solid', borderColor: active ? o.color : 'rgba(255,255,255,0.10)',
                  background: active ? `${o.color}1f` : 'transparent',
                  color: active ? o.color : '#a1a1aa',
                  fontSize: 11, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: '100%', height: isMobile ? 220 : 280 }}>
        <ResponsiveContainer>
          <LineChart data={daily} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(d) => new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(v) => `€${v}`}
              axisLine={false} tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : v}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} iconType="plainline" />
            <Line
              yAxisId="left"
              type="monotone" dataKey="spend" name="Spend"
              stroke={clientColor} strokeWidth={2.2} dot={false}
              activeDot={{ r: 5, fill: clientColor, stroke: '#fff', strokeWidth: 1.5 }}
            />
            <Line
              yAxisId="right"
              type="monotone" dataKey={overlay} name={overlayCfg.label}
              stroke={overlayCfg.color} strokeWidth={1.7} dot={false}
              strokeDasharray="4 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
