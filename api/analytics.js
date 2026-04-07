import { BetaAnalyticsDataClient } from '@google-analytics/data';

const MOCK_DATA = {
  isMock: true,
  sessions: 2430,
  conversions: 10,
  conversionRate: 0.41,
  organicUsers: 1890,
  weeklyBreakdown: [
    { week: 'Week 1', organic: 420 },
    { week: 'Week 2', organic: 510 },
    { week: 'Week 3', organic: 475 },
    { week: 'Week 4', organic: 485 },
  ],
};

function clientEnv(clientId, key) {
  const prefix = clientId ? clientId.toUpperCase().replace(/-/g, '_') + '_' : '';
  return process.env[`${prefix}${key}`] ?? process.env[key];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = req.query?.client ?? '';
  const GA4_PROPERTY_ID = clientEnv(clientId, 'GA4_PROPERTY_ID');
  const GA4_CLIENT_EMAIL = clientEnv(clientId, 'GA4_CLIENT_EMAIL');
  const GA4_PRIVATE_KEY = clientEnv(clientId, 'GA4_PRIVATE_KEY');

  if (!GA4_PROPERTY_ID || !GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    return res.status(200).json(MOCK_DATA);
  }

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GA4_CLIENT_EMAIL,
        private_key: GA4_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    const today = new Date();
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const todayStr = today.toISOString().split('T')[0];

    const [reportResponse] = await analyticsDataClient.runReport({
      property: GA4_PROPERTY_ID,
      dateRanges: [{ startDate: firstOfMonth, endDate: todayStr }],
      metrics: [
        { name: 'sessions' },
        { name: 'conversions' },
        { name: 'sessionConversionRate' },
      ],
    });

    const [organicResponse] = await analyticsDataClient.runReport({
      property: GA4_PROPERTY_ID,
      dateRanges: [{ startDate: firstOfMonth, endDate: todayStr }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'activeUsers' }],
    });

    const row = reportResponse?.rows?.[0]?.metricValues ?? [];
    const sessions = parseInt(row[0]?.value ?? 0, 10);
    const conversions = parseInt(row[1]?.value ?? 0, 10);
    const conversionRate = parseFloat(
      ((parseFloat(row[2]?.value ?? 0)) * 100).toFixed(2)
    );

    let organicUsers = 0;
    for (const r of organicResponse?.rows ?? []) {
      const channel = r.dimensionValues?.[0]?.value ?? '';
      if (channel.toLowerCase().includes('organic')) {
        organicUsers += parseInt(r.metricValues?.[0]?.value ?? 0, 10);
      }
    }

    // Weekly breakdown (organic by week)
    const [weeklyResponse] = await analyticsDataClient.runReport({
      property: GA4_PROPERTY_ID,
      dateRanges: [{ startDate: firstOfMonth, endDate: todayStr }],
      dimensions: [
        { name: 'isoWeek' },
        { name: 'sessionDefaultChannelGroup' },
      ],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'isoWeek' } }],
    });

    const weekMap = new Map();
    for (const r of weeklyResponse?.rows ?? []) {
      const week = r.dimensionValues?.[0]?.value ?? '';
      const channel = r.dimensionValues?.[1]?.value ?? '';
      if (!weekMap.has(week)) weekMap.set(week, 0);
      if (channel.toLowerCase().includes('organic')) {
        weekMap.set(week, weekMap.get(week) + parseInt(r.metricValues?.[0]?.value ?? 0, 10));
      }
    }

    const weeklyBreakdown = Array.from(weekMap.entries()).map(([_, organic], i) => ({
      week: `Week ${i + 1}`,
      organic,
    }));

    return res.status(200).json({
      isMock: false,
      sessions,
      conversions,
      conversionRate,
      organicUsers,
      weeklyBreakdown: weeklyBreakdown.length ? weeklyBreakdown : MOCK_DATA.weeklyBreakdown,
    });
  } catch (err) {
    console.error('[analytics.js] API error:', err.message);
    return res.status(200).json({ ...MOCK_DATA, isMock: true, error: err.message });
  }
}
