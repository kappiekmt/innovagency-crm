import { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { X } from 'lucide-react';
import {
  formatEuro, formatNumber, formatPct,
  hookRate, holdRate, statusColor, hookRateColor, holdRateColor,
} from './format';

function MetricRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#71717a', fontSize: 12 }}>{label}</span>
      <span style={{ color: color ?? '#f4f4f5', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function VideoPreview({ ad }) {
  // Real Meta data has preview_url (video source). For mock, we get a sample mp4.
  // If neither, fall back to an iframe pointed at Meta's /previews if we have it,
  // or a thumbnail with a "no preview" overlay.
  if (ad.preview_url) {
    return (
      <video
        src={ad.preview_url}
        controls
        autoPlay
        muted
        playsInline
        poster={ad.thumbnail_url}
        style={{
          width: '100%',
          aspectRatio: '4 / 5',
          background: '#000',
          borderRadius: 10,
          objectFit: 'cover',
        }}
      />
    );
  }
  if (ad.preview_iframe) {
    return (
      <iframe
        src={ad.preview_iframe}
        title={ad.ad_name}
        style={{
          width: '100%', aspectRatio: '4 / 5',
          background: '#000', borderRadius: 10, border: 'none',
        }}
        allow="autoplay; encrypted-media"
      />
    );
  }
  return (
    <div style={{
      width: '100%', aspectRatio: '4 / 5',
      background: '#000', borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: ad.thumbnail_url ? `url(${ad.thumbnail_url})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.7)', padding: '10px 16px',
        borderRadius: 8, color: '#d4d4d8', fontSize: 12,
      }}>
        Video preview niet beschikbaar
      </div>
    </div>
  );
}

export default function AdPreviewModal({ ad, perAdDaily, onClose, isMobile }) {
  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!ad) return null;
  const sc = statusColor(ad.status);
  const hr = hookRate(ad);
  const hldr = holdRate(ad);
  const daily = perAdDaily?.[ad.ad_id] ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 12 : 32,
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#15181f',
          borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: 1100, width: '100%',
          maxHeight: '92vh', overflow: 'auto',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 14,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.fg }}>
                {sc.label}
              </span>
              <span style={{ fontSize: 11, color: '#71717a' }}>Ad ID: {ad.ad_id}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
              {ad.ad_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8, padding: 7, cursor: 'pointer',
              color: '#a1a1aa', display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
          gap: 24,
          padding: 22,
        }}>
          {/* Left: video preview */}
          <div>
            <VideoPreview ad={ad} />
          </div>

          {/* Right: metrics + chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Kerncijfers
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', columnGap: 22 }}>
                <MetricRow label="Spend" value={formatEuro(ad.spend)} />
                <MetricRow label="Vertoningen" value={formatNumber(ad.impressions)} />
                <MetricRow label="Bereik" value={formatNumber(ad.reach)} />
                <MetricRow label="Frequentie" value={formatNumber(ad.frequency, 2)} />
                <MetricRow label="CPM" value={formatEuro(ad.cpm)} />
                <MetricRow label="CTR" value={formatPct(ad.ctr, 2)} />
                <MetricRow label="Klikken" value={formatNumber(ad.clicks)} />
                <MetricRow label="CPC" value={formatEuro(ad.cpc)} />
                <MetricRow label="Hook rate" value={formatPct(hr, 1)} color={hookRateColor(hr)} />
                <MetricRow label="Hold rate" value={formatPct(hldr, 1)} color={holdRateColor(hldr)} />
                <MetricRow label="Resultaten" value={formatNumber(ad.results)} />
                <MetricRow label="Kosten / Resultaat" value={formatEuro(ad.cost_per_result)} />
              </div>
            </div>

            {/* Video retention */}
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Kijkretentie
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: '3s', val: ad.video_3s_views },
                  { label: '25%', val: ad.p25 },
                  { label: '50%', val: ad.p50 },
                  { label: '75%', val: ad.p75 },
                  { label: '100%', val: ad.p100 },
                ].map((s) => {
                  const base = ad.video_3s_views || 1;
                  const pct = (s.val / base) * 100;
                  return (
                    <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 6 }}>{s.label}</div>
                      <div style={{
                        height: 70, background: 'rgba(255,255,255,0.04)',
                        borderRadius: 6, overflow: 'hidden',
                        display: 'flex', alignItems: 'flex-end',
                      }}>
                        <div style={{
                          width: '100%',
                          height: `${Math.min(100, Math.max(8, pct))}%`,
                          background: 'linear-gradient(180deg, #6C00EE, #4c00b3)',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#d4d4d8', marginTop: 6, fontWeight: 600 }}>
                        {formatNumber(s.val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-ad daily chart */}
            {daily.length > 0 && (
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Dagelijkse spend & vertoningen
                </h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={daily} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickFormatter={(d) => new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickLine={false}
                      />
                      <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `€${v}`} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : v} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#15181f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(d) => new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                        formatter={(v, name) => name === 'Spend' ? formatEuro(v) : formatNumber(v)}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend" stroke="#6C00EE" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="impressions" name="Vertoningen" stroke="#3B82F6" strokeWidth={1.7} dot={false} strokeDasharray="4 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
