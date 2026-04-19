import axios from 'axios';

const MOCK_DATA = {
  isMock: true,
  spend: 4164,
  conversions: 108,
  cpa: 38.56,
  ctr: 2.1,
  impressions: 198571,
  clicks: 4170,
  weeklyBreakdown: [
    { week: 'Week 1', conversions: 22, spend: 850 },
    { week: 'Week 2', conversions: 31, spend: 1050 },
    { week: 'Week 3', conversions: 28, spend: 1120 },
    { week: 'Week 4', conversions: 27, spend: 1144 },
  ],
};

function clientEnv(clientId, key) {
  if (!clientId) return process.env[key] ?? null;
  return process.env[`${clientId.toUpperCase().replace(/-/g, '_')}_${key}`] ?? null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = req.query?.client ?? '';
  const META_ACCESS_TOKEN = clientEnv(clientId, 'META_ACCESS_TOKEN');
  const META_AD_ACCOUNT_ID = clientEnv(clientId, 'META_AD_ACCOUNT_ID');

  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    return res.status(200).json(MOCK_DATA);
  }

  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/insights`,
      {
        params: {
          access_token: META_ACCESS_TOKEN,
          fields: 'spend,impressions,clicks,actions,cpc,cpm,ctr',
          time_range: JSON.stringify({ since: firstOfMonth, until: todayStr }),
          level: 'account',
        },
      }
    );

    const d = response.data?.data?.[0] ?? {};
    const conversions =
      (d.actions ?? []).find((a) => a.action_type === 'purchase')?.value ?? 0;
    const spend = parseFloat(d.spend ?? 0);
    const clicks = parseInt(d.clicks ?? 0, 10);
    const impressions = parseInt(d.impressions ?? 0, 10);
    const ctr = parseFloat(d.ctr ?? 0);
    const cpa = conversions > 0 ? spend / conversions : 0;

    // Weekly breakdown — fetch time-series
    const seriesRes = await axios.get(
      `https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/insights`,
      {
        params: {
          access_token: META_ACCESS_TOKEN,
          fields: 'spend,actions',
          time_range: JSON.stringify({ since: firstOfMonth, until: todayStr }),
          time_increment: 7,
          level: 'account',
        },
      }
    );

    const weeklyBreakdown = (seriesRes.data?.data ?? []).map((w, i) => ({
      week: `Week ${i + 1}`,
      conversions: parseInt(
        (w.actions ?? []).find((a) => a.action_type === 'purchase')?.value ?? 0,
        10
      ),
      spend: parseFloat(w.spend ?? 0),
    }));

    return res.status(200).json({
      isMock: false,
      spend,
      conversions: parseInt(conversions, 10),
      cpa: parseFloat(cpa.toFixed(2)),
      ctr,
      impressions,
      clicks,
      weeklyBreakdown,
    });
  } catch (err) {
    console.error('[meta.js] API error:', err?.response?.data ?? err.message);
    return res.status(200).json({ ...MOCK_DATA, isMock: true, error: err.message });
  }
}
