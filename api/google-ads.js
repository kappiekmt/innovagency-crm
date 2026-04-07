import { GoogleAdsApi } from 'google-ads-api';

const MOCK_DATA = {
  isMock: true,
  spend: 14152,
  conversions: 45,
  cpa: 314.49,
  ctr: 1.3,
  impressions: 346341,
  clicks: 4502,
  weeklyBreakdown: [
    { week: 'Week 1', conversions: 10, spend: 3200 },
    { week: 'Week 2', conversions: 12, spend: 3600 },
    { week: 'Week 3', conversions: 11, spend: 3700 },
    { week: 'Week 4', conversions: 12, spend: 3652 },
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
  const GOOGLE_ADS_CLIENT_ID = clientEnv(clientId, 'GOOGLE_ADS_CLIENT_ID');
  const GOOGLE_ADS_CLIENT_SECRET = clientEnv(clientId, 'GOOGLE_ADS_CLIENT_SECRET');
  const GOOGLE_ADS_REFRESH_TOKEN = clientEnv(clientId, 'GOOGLE_ADS_REFRESH_TOKEN');
  const GOOGLE_ADS_DEVELOPER_TOKEN = clientEnv(clientId, 'GOOGLE_ADS_DEVELOPER_TOKEN');
  const GOOGLE_ADS_CUSTOMER_ID = clientEnv(clientId, 'GOOGLE_ADS_CUSTOMER_ID');

  if (
    !GOOGLE_ADS_CLIENT_ID ||
    !GOOGLE_ADS_CLIENT_SECRET ||
    !GOOGLE_ADS_REFRESH_TOKEN ||
    !GOOGLE_ADS_DEVELOPER_TOKEN ||
    !GOOGLE_ADS_CUSTOMER_ID
  ) {
    return res.status(200).json(MOCK_DATA);
  }

  try {
    const client = new GoogleAdsApi({
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      developer_token: GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    const customer = client.Customer({
      customer_id: GOOGLE_ADS_CUSTOMER_ID,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
    });

    const today = new Date();
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const todayStr = today.toISOString().split('T')[0];

    const rows = await customer.query(`
      SELECT
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        metrics.average_cpc,
        metrics.ctr
      FROM customer
      WHERE segments.date BETWEEN '${firstOfMonth}' AND '${todayStr}'
    `);

    let spend = 0, conversions = 0, clicks = 0, impressions = 0, ctr = 0;

    for (const row of rows) {
      spend += (row.metrics.cost_micros ?? 0) / 1_000_000;
      conversions += row.metrics.conversions ?? 0;
      clicks += row.metrics.clicks ?? 0;
      impressions += row.metrics.impressions ?? 0;
    }

    ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;

    // Weekly breakdown
    const weekRows = await customer.query(`
      SELECT
        segments.week,
        metrics.cost_micros,
        metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${firstOfMonth}' AND '${todayStr}'
    `);

    const weekMap = new Map();
    for (const row of weekRows) {
      const w = row.segments?.week ?? 'Unknown';
      if (!weekMap.has(w)) weekMap.set(w, { spend: 0, conversions: 0 });
      const entry = weekMap.get(w);
      entry.spend += (row.metrics.cost_micros ?? 0) / 1_000_000;
      entry.conversions += row.metrics.conversions ?? 0;
    }

    const weeklyBreakdown = Array.from(weekMap.entries()).map(([_, v], i) => ({
      week: `Week ${i + 1}`,
      conversions: Math.round(v.conversions),
      spend: parseFloat(v.spend.toFixed(2)),
    }));

    return res.status(200).json({
      isMock: false,
      spend: parseFloat(spend.toFixed(2)),
      conversions: Math.round(conversions),
      cpa: parseFloat(cpa.toFixed(2)),
      ctr: parseFloat(ctr.toFixed(2)),
      impressions,
      clicks,
      weeklyBreakdown,
    });
  } catch (err) {
    console.error('[google-ads.js] API error:', err.message);
    return res.status(200).json({ ...MOCK_DATA, isMock: true, error: err.message });
  }
}
