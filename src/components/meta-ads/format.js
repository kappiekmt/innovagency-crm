export function formatEuro(value, decimals = 2) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

export function formatPct(value, decimals = 2) {
  return `${formatNumber(value ?? 0, decimals)}%`;
}

export function hookRate(ad) {
  if (!ad?.impressions) return 0;
  return (ad.video_3s_views / ad.impressions) * 100;
}

export function holdRate(ad) {
  if (!ad?.video_3s_views) return 0;
  return (ad.thruplays / ad.video_3s_views) * 100;
}

export function statusColor(status) {
  if (status === 'ACTIVE') return { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e', label: 'Actief' };
  if (status === 'PAUSED') return { bg: 'rgba(234,179,8,0.12)', fg: '#eab308', label: 'Gepauzeerd' };
  return { bg: 'rgba(255,255,255,0.06)', fg: '#a1a1aa', label: status ?? '—' };
}

export function hookRateColor(rate) {
  if (rate >= 25) return '#22c55e';
  if (rate >= 15) return '#eab308';
  return '#ef4444';
}

export function holdRateColor(rate) {
  if (rate >= 15) return '#22c55e';
  if (rate >= 8) return '#eab308';
  return '#ef4444';
}
