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
    try {
      const params = new URLSearchParams();
      if (clientId) params.set('client', clientId);
      if (dateRange?.since) params.set('since', dateRange.since);
      if (dateRange?.until) params.set('until', dateRange.until);
      const url = `${BASE}/api/meta-video-ads?${params.toString()}`;
      console.log('[useMetaVideoAds] fetching', url);
      const res = await axios.get(url, { timeout: 20000 });
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
