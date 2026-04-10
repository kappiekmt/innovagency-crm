import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches manually-entered weekly stats from Supabase and returns them
 * in the same shape that KPICards, PlatformCards, TrendChart, and
 * BudgetDonut already expect — so no component changes needed.
 */
export function useClientStats(slug) {
  const [data, setData]       = useState(null);
  const [momData, setMomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetch = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    // 1. Resolve client UUID from slug
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!client) { setLoading(false); return; }

    // 2. Fetch last 9 weeks (8 for chart + 1 for MoM comparison)
    const { data: rows } = await supabase
      .from('weekly_stats')
      .select('*')
      .eq('client_id', client.id)
      .order('week_start', { ascending: false })
      .limit(9);

    if (!rows || rows.length === 0) { setLoading(false); setHasData(false); return; }
    setHasData(true);

    // Latest week = current period
    const latest = rows[0];
    const prev   = rows[1] ?? null;

    function kpi(row) {
      if (!row) return null;
      const spend = (row.meta_spend ?? 0) + (row.google_spend ?? 0);
      const conv  = (row.meta_conversions ?? 0) + (row.google_conversions ?? 0) + (row.organic_conversions ?? 0);
      return {
        totalSpend:      parseFloat(spend.toFixed(2)),
        totalConversions: conv,
        avgCpa:          conv > 0 ? parseFloat((spend / conv).toFixed(2)) : 0,
        conversionRate:  0, // not tracked manually
      };
    }

    const current = kpi(latest);
    const previous = kpi(prev);

    const formatted = {
      meta: {
        spend:       latest.meta_spend ?? 0,
        conversions: latest.meta_conversions ?? 0,
        cpa:         (latest.meta_conversions ?? 0) > 0
                       ? parseFloat(((latest.meta_spend ?? 0) / latest.meta_conversions).toFixed(2))
                       : 0,
        ctr:         0,
        impressions: 0,
        clicks:      0,
      },
      googleAds: {
        spend:       latest.google_spend ?? 0,
        conversions: latest.google_conversions ?? 0,
        cpa:         (latest.google_conversions ?? 0) > 0
                       ? parseFloat(((latest.google_spend ?? 0) / latest.google_conversions).toFixed(2))
                       : 0,
        ctr:         0,
        impressions: 0,
        clicks:      0,
      },
      analytics: {
        sessions:        latest.organic_conversions ?? 0,
        conversions:     latest.organic_conversions ?? 0,
        conversionRate:  0,
        organicUsers:    latest.organic_conversions ?? 0,
      },
      summary: current,
      // Chart: oldest → newest
      weekly: [...rows].reverse().map(r => ({
        week: r.week_start.slice(5), // MM-DD label
        meta:      r.meta_conversions ?? 0,
        googleAds: r.google_conversions ?? 0,
        organic:   r.organic_conversions ?? 0,
      })),
    };

    setData(formatted);
    setMomData(previous ? { previous } : null);
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, momData, loading, hasData, refetch: fetch };
}
