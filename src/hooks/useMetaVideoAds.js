import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useMetaVideoAds(clientId, dateRange) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const reqId = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    const params = new URLSearchParams();
    if (clientId) params.set('client', clientId);
    if (dateRange?.since) params.set('since', dateRange.since);
    if (dateRange?.until) params.set('until', dateRange.until);
    const url = `${BASE}/api/meta-video-ads?${params.toString()}`;
    console.log('[useMetaVideoAds] fetching', url);

    // One retry with a short backoff smooths over Vercel cold starts and
    // transient Meta Graph API hiccups — the dominant cause of intermittent
    // errors here. We only retry on timeout / 5xx, never on 4xx.
    const attempt = async () => axios.get(url, { timeout: 30000 });
    const isTransient = (err) =>
      err?.code === 'ECONNABORTED' || (err?.response?.status >= 500);

    try {
      let res;
      try {
        res = await attempt();
      } catch (err) {
        if (!isTransient(err)) throw err;
        await new Promise((r) => setTimeout(r, 800));
        res = await attempt();
      }
      if (id !== reqId.current) return;
      setData(res.data);
      setIsMock(!!res.data?.isMock);
      setLastUpdated(new Date());
    } catch (err) {
      if (id !== reqId.current) return;
      const detail = err?.response
        ? `HTTP ${err.response.status} ${err.response.statusText}`
        : err?.code === 'ECONNABORTED'
          ? 'request timeout'
          : err?.message ?? 'unknown error';
      console.error('[useMetaVideoAds] fetch failed:', detail, err);
      setIsError(true);
      setErrorMessage(detail);
    } finally {
      if (id === reqId.current) setIsLoading(false);
    }
  }, [clientId, dateRange?.since, dateRange?.until]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, isError, errorMessage, isMock, lastUpdated, refetch: fetchData };
}
