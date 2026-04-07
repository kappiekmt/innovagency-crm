import { createClient } from '@supabase/supabase-js';

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase server env vars not set' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { clientId, data } = req.body;

  if (!clientId || !data) return res.status(400).json({ error: 'Missing clientId or data' });

  const weekStart = getWeekStart();

  const { error } = await supabase.from('metric_snapshots').upsert({
    client_id:           clientId,
    week_start:          weekStart,

    // Google Analytics
    ga_sessions:         data.analytics?.sessions         ?? 0,
    ga_conversions:      data.analytics?.conversions      ?? 0,
    ga_conversion_rate:  data.analytics?.conversionRate   ?? 0,
    ga_organic_users:    data.analytics?.organicUsers     ?? 0,

    // Google Ads
    gads_spend:          data.googleAds?.spend            ?? 0,
    gads_conversions:    data.googleAds?.conversions      ?? 0,
    gads_cpa:            data.googleAds?.cpa              ?? 0,
    gads_impressions:    data.googleAds?.impressions      ?? 0,
    gads_clicks:         data.googleAds?.clicks           ?? 0,
    gads_ctr:            data.googleAds?.ctr              ?? 0,

    // Meta
    meta_spend:          data.meta?.spend                 ?? 0,
    meta_conversions:    data.meta?.conversions           ?? 0,
    meta_cpa:            data.meta?.cpa                   ?? 0,
    meta_impressions:    data.meta?.impressions           ?? 0,
    meta_clicks:         data.meta?.clicks                ?? 0,
    meta_ctr:            data.meta?.ctr                   ?? 0,

    // Totals
    total_spend:         data.summary?.totalSpend         ?? 0,
    total_conversions:   data.summary?.totalConversions   ?? 0,
    avg_cpa:             data.summary?.avgCpa             ?? 0,
    conversion_rate:     data.summary?.conversionRate     ?? 0,
  }, { onConflict: 'client_id,week_start' });

  if (error) {
    console.error('[snapshot] Upsert error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, weekStart });
}
