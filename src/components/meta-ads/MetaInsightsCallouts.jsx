import { TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { formatEuro, formatPct, hookRate, holdRate } from './format';

function generateCallouts(ads) {
  if (!ads || ads.length === 0) return [];
  const out = [];

  // Top hook rate
  const byHook = [...ads].filter((a) => a.impressions > 1000).sort((a, b) => hookRate(b) - hookRate(a));
  if (byHook[0]) {
    out.push({
      type: 'Top hook rate',
      icon: Award, iconColor: '#22c55e',
      bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.18)',
      title: byHook[0].ad_name,
      detail: `Hook rate van ${formatPct(hookRate(byHook[0]), 1)} — beste opener van deze periode.`,
    });
  }

  // High spend, low hold rate (refresh candidate)
  const refreshCandidate = [...ads]
    .filter((a) => a.spend > 200 && a.video_3s_views > 0)
    .sort((a, b) => holdRate(a) - holdRate(b))[0];
  if (refreshCandidate && holdRate(refreshCandidate) < 12) {
    out.push({
      type: 'Vernieuwen',
      icon: AlertTriangle, iconColor: '#eab308',
      bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.20)',
      title: refreshCandidate.ad_name,
      detail: `Hoge spend (${formatEuro(refreshCandidate.spend)}) maar hold rate slechts ${formatPct(holdRate(refreshCandidate), 1)}. Overweeg een refresh.`,
    });
  }

  // Best cost per result
  const byCpr = [...ads].filter((a) => a.results > 0 && a.cost_per_result > 0).sort((a, b) => a.cost_per_result - b.cost_per_result);
  if (byCpr[0]) {
    out.push({
      type: 'Beste kosten / resultaat',
      icon: TrendingUp, iconColor: '#6C00EE',
      bg: 'rgba(108,0,238,0.08)', border: 'rgba(108,0,238,0.22)',
      title: byCpr[0].ad_name,
      detail: `Slechts ${formatEuro(byCpr[0].cost_per_result)} per resultaat — efficiëntste advertentie nu.`,
    });
  }

  return out.slice(0, 3);
}

export default function MetaInsightsCallouts({ ads, isMobile }) {
  const callouts = generateCallouts(ads);
  if (callouts.length === 0) return null;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : `repeat(${callouts.length}, 1fr)`,
      gap: isMobile ? 10 : 12,
    }}>
      {callouts.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={14} color={c.iconColor} strokeWidth={2.2} />
              <span style={{
                fontSize: 11, fontWeight: 600, color: c.iconColor,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>{c.type}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.title}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: '#a1a1aa' }}>
              {c.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}
