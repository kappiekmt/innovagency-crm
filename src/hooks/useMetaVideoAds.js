import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useMetaVideoAds(clientId, dateRange) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const reqId = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setIsLoading(true);
    setIsError(false);
    try {
      const params = new URLSearchParams();
      if (clientId) params.set('client', clientId);
      if (dateRange?.since) params.set('since', dateRange.since);
      if (dateRange?.until) params.set('until', dateRange.until);
      const res = await axios.get(`${BASE}/api/meta-video-ads?${params.toString()}`, {
        timeout: 20000,
      });
      if (id !== reqId.current) return;
      setData(res.data);
      setIsMock(!!res.data?.isMock);
      setLastUpdated(new Date());
    } catch (err) {
      if (id !== reqId.current) return;
      console.error('[useMetaVideoAds] error:', err.message);
      setIsError(true);
    } finally {
      if (id === reqId.current) setIsLoading(false);
    }
  }, [clientId, dateRange?.since, dateRange?.until]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, isError, isMock, lastUpdated, refetch: fetchData };
}
