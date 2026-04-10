import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

function mergeWeekly(meta, googleAds, analytics) {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  return weeks.map((week, i) => ({
    week,
    meta: meta?.weeklyBreakdown?.[i]?.conversions ?? 0,
    googleAds: googleAds?.weeklyBreakdown?.[i]?.conversions ?? 0,
    organic: analytics?.weeklyBreakdown?.[i]?.organic ?? 0,
  }));
}

export function useDashboardData(clientId = '') {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    const params = clientId ? `?client=${clientId}` : '';
    try {
      const [metaRes, gadsRes, ga4Res] = await Promise.all([
        axios.get(`${BASE}/api/meta${params}`,        { timeout: 10000 }),
        axios.get(`${BASE}/api/google-ads${params}`,  { timeout: 10000 }),
        axios.get(`${BASE}/api/analytics${params}`,   { timeout: 10000 }),
      ]);

      const meta = metaRes.data;
      const googleAds = gadsRes.data;
      const analytics = ga4Res.data;

      const anyMock = meta.isMock || googleAds.isMock || analytics.isMock;

      const totalSpend = (meta.spend ?? 0) + (googleAds.spend ?? 0);
      const totalConversions =
        (meta.conversions ?? 0) + (googleAds.conversions ?? 0) + (analytics.conversions ?? 0);
      const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

      setData({
        meta,
        googleAds,
        analytics,
        summary: {
          totalSpend,
          totalConversions,
          avgCpa: parseFloat(avgCpa.toFixed(2)),
          conversionRate: analytics.conversionRate ?? 0,
        },
        weekly: mergeWeekly(meta, googleAds, analytics),
      });

      setIsMock(anyMock);
      setLastUpdated(new Date());

      // Save snapshot to Supabase for MoM tracking (only real data)
      if (!anyMock && clientId) {
        const summary = {
          totalSpend,
          totalConversions,
          avgCpa: parseFloat(avgCpa.toFixed(2)),
          conversionRate: analytics.conversionRate ?? 0,
        };
        axios.post(`${BASE}/api/snapshot`, { clientId, data: { meta, googleAds, analytics, summary } })
          .catch(err => console.warn('[snapshot] Failed to save:', err.message));
      }
    } catch (err) {
      console.error('[useDashboardData] fetch error:', err.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  return { data, isLoading, isError, isMock, lastUpdated, refetch: fetchAll };
}
