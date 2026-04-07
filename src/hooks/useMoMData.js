import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function sum(arr, key) {
  return arr.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0);
}

function avg(arr, key) {
  return arr.length ? sum(arr, key) / arr.length : 0;
}

function monthOf(dateStr) {
  const d = new Date(dateStr);
  return { month: d.getMonth(), year: d.getFullYear() };
}

export function useMoMData(clientId) {
  const [momData, setMomData] = useState(null);
  const [momLoading, setMomLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setMomLoading(false); return; }

    async function fetch() {
      const { data, error } = await supabase
        .from('metric_snapshots')
        .select('*')
        .eq('client_id', clientId)
        .order('week_start', { ascending: false })
        .limit(12); // ~3 months of weekly snapshots

      if (error) {
        console.error('[useMoMData]', error.message);
        setMomLoading(false);
        return;
      }

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear  = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

      const current  = data.filter(r => { const m = monthOf(r.week_start); return m.month === thisMonth && m.year === thisYear; });
      const previous = data.filter(r => { const m = monthOf(r.week_start); return m.month === lastMonth && m.year === lastYear; });

      setMomData({
        current: {
          totalSpend:       sum(current,  'total_spend'),
          totalConversions: sum(current,  'total_conversions'),
          avgCpa:           avg(current,  'avg_cpa'),
          conversionRate:   avg(current,  'conversion_rate'),
        },
        previous: {
          totalSpend:       sum(previous, 'total_spend'),
          totalConversions: sum(previous, 'total_conversions'),
          avgCpa:           avg(previous, 'avg_cpa'),
          conversionRate:   avg(previous, 'conversion_rate'),
        },
        weeks: data, // raw weekly rows for charts
      });

      setMomLoading(false);
    }

    fetch();
  }, [clientId]);

  return { momData, momLoading };
}
