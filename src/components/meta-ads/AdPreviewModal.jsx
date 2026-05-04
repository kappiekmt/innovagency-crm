import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { X, ExternalLink } from 'lucide-react';
import {
  formatEuro, formatNumber,
  statusColor,
} from './format';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function MetricRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#71717a', fontSize: 12 }}>{label}</span>
      <span style={{ color: color ?? '#f4f4f5', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function VideoPreview({ ad, clientSlug }) {
  // Strategy:
  // 1. If we have an iframe URL from Meta /previews → embed it (the real ad preview)
  // 2. Else if we have a direct video source URL → HTML5 video player
  // 3. Else show thumbnail + link to Ads Manager
  const [iframeUrl, setIframeUrl] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const [adsManagerUrl, setAdsManagerUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIframeUrl(null);
    setIframeError(false);
    setLoadingPreview(true);

    // Skip fetch for mock data (mock ad_ids start with "mock_")
    if (ad.ad_id?.startsWith('mock_')) {
      setLoadingPreview(false);
      return;
    }

    const params = new URLSearchParams({ ad_id: ad.ad_id });
    if (clientSlug) params.set('client', clientSlug);

    axios
      .get(`${API_BASE}/api/meta-ad-preview?${params.toString()}`, { timeout: 12000 })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.iframeUrl) setIframeUrl(res.data.iframeUrl);
        else setIframeError(true);
        if (res.data?.ads_manager_url) setAdsManagerUrl(res.data.ads_manager_url);
      })
      .catch(() => {
        if (cancelled) return;
        setIframeError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => { cancelled = true; };
  }, [ad.ad_id, clientSlug]);

  if (iframeUrl) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 16', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
        <iframe
          src={iframeUrl}
          title={ad.ad_name}
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
          allow="autoplay; encrypted-media; fullscreen"
        />
      </div>
    );
  }

  if (loadingPreview) {
    return (
      <div style={{
        width: '100%', aspectRatio: '9 / 16', background: '#0d0f14',
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#6C00EE', animation: 'spin 0.7s linear infinite' }} />
        <div style={{ color: '#71717a', fontSize: 12 }}>Preview laden…</div>
      </div>
    );
  }

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
          width: '100%', aspectRatio: '9 / 16',
          background: '#000', borderRadius: 10, objectFit: 'cover',
        }}
      />
    );
  }

  // Final fallback — thumbnail + Ads Manager link
  const fallbackUrl = adsManagerUrl ?? `https://business.facebook.com/adsmanager/manage/ads?selected_ad_ids=${ad.ad_id}`;
  return (
    <div style={{
      position: 'relative',
      width: '100%', aspectRatio: '9 / 16',
      background: '#000', borderRadius: 10, overflow: 'hidden',
      backgroundImage: ad.thumbnail_url ? `url(${ad.thumbnail_url})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85))',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 20,
      }}>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1877F2', color: '#fff',
            padding: '10px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} /> Open in Ads Manager
        </a>
      </div>
      {iframeError && (
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, fontSize: 11, color: '#fca5a5', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, textAlign: 'center' }}>
          Embedded preview niet beschikbaar voor deze advertentie
        </div>
      )}
    </div>
  );
}

export default function AdPreviewModal({ ad, perAdDaily, clientSlug, onClose, isMobile }) {
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
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.fg }}>
                {sc.label}
              </span>
              <span style={{ fontSize: 11, color: '#71717a' }}>Ad ID: {ad.ad_id}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5', margin: '0 0 10px 0' }}>
              {ad.ad_name}
            </h2>
            {!ad.ad_id?.startsWith('mock_') && (ad.preview_url || ad.video_id) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href={ad.preview_url ?? `https://www.facebook.com/watch/?v=${ad.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(24,119,242,0.12)',
                    border: '1px solid rgba(24,119,242,0.30)',
                    color: '#60a5fa',
                    borderRadius: 7, padding: '5px 11px',
                    fontSize: 11.5, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={11} /> Open video
                </a>
              </div>
            )}
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
            <VideoPreview ad={ad} clientSlug={clientSlug} />
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
                <MetricRow label="Resultaten" value={formatNumber(ad.results)} />
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
