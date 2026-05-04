import axios from 'axios';

const GRAPH_VERSION = 'v21.0';

function clientEnv(clientId, key) {
  const prefix = clientId ? clientId.toUpperCase().replace(/-/g, '_') + '_' : '';
  return process.env[`${prefix}${key}`] ?? process.env[key];
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}

function buildMockPayload(since, until) {
  const dayCount = Math.max(
    1,
    Math.round((new Date(until) - new Date(since)) / 86400000) + 1
  );

  const ads = [
    {
      ad_id: 'mock_001',
      ad_name: '[ZC] UGC – Rugpijn weg met deze stoel | v3',
      status: 'ACTIVE',
      video_id: 'mock_video_001',
      thumbnail_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=320&h=400&fit=crop',
      preview_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      spend: 1842.34, impressions: 412009, reach: 308122, frequency: 1.34,
      cpm: 4.47, ctr: 1.92, cpc: 0.23, clicks: 7910,
      video_3s_views: 121800, thruplays: 22050,
      results: 71, cost_per_result: 25.95, currency: 'EUR',
      p25: 88200, p50: 51100, p75: 31800, p100: 22050,
    },
    {
      ad_id: 'mock_002',
      ad_name: '[ZC] Voor/Na – Ergonomie | hook v2',
      status: 'ACTIVE',
      video_id: 'mock_video_002',
      thumbnail_url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=320&h=400&fit=crop',
      preview_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      spend: 1204.10, impressions: 268340, reach: 201450, frequency: 1.33,
      cpm: 4.49, ctr: 2.41, cpc: 0.19, clicks: 6470,
      video_3s_views: 95800, thruplays: 18910,
      results: 54, cost_per_result: 22.30, currency: 'EUR',
      p25: 69500, p50: 41200, p75: 26000, p100: 18910,
    },
    {
      ad_id: 'mock_003',
      ad_name: '[ZC] Testimonial Anneke | bureaustoel',
      status: 'ACTIVE',
      video_id: 'mock_video_003',
      thumbnail_url: 'https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=320&h=400&fit=crop',
      preview_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      spend: 968.55, impressions: 198104, reach: 161220, frequency: 1.23,
      cpm: 4.89, ctr: 1.74, cpc: 0.28, clicks: 3450,
      video_3s_views: 41200, thruplays: 5980,
      results: 31, cost_per_result: 31.24, currency: 'EUR',
      p25: 31100, p50: 16800, p75: 9400, p100: 5980,
    },
    {
      ad_id: 'mock_004',
      ad_name: '[ZC] Productdemo – verstelbaar | static fallback',
      status: 'ACTIVE',
      video_id: 'mock_video_004',
      thumbnail_url: 'https://images.unsplash.com/photo-1519219788971-8d9797e0928e?w=320&h=400&fit=crop',
      preview_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      spend: 712.88, impressions: 154200, reach: 132010, frequency: 1.17,
      cpm: 4.62, ctr: 1.21, cpc: 0.38, clicks: 1865,
      video_3s_views: 28000, thruplays: 2410,
      results: 12, cost_per_result: 59.41, currency: 'EUR',
      p25: 19800, p50: 9100, p75: 4200, p100: 2410,
    },
    {
      ad_id: 'mock_005',
      ad_name: '[ZC] Korting weekend – urgency hook',
      status: 'PAUSED',
      video_id: 'mock_video_005',
      thumbnail_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=320&h=400&fit=crop',
      preview_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      spend: 488.20, impressions: 98140, reach: 84210, frequency: 1.17,
      cpm: 4.97, ctr: 2.15, cpc: 0.23, clicks: 2110,
      video_3s_views: 25600, thruplays: 4720,
      results: 18, cost_per_result: 27.12, currency: 'EUR',
      p25: 18000, p50: 10500, p75: 6800, p100: 4720,
    },
  ];

  const totalSpend = ads.reduce((s, a) => s + a.spend, 0);
  const dailyBreakdown = Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(since);
    date.setUTCDate(date.getUTCDate() + i);
    const wave = 0.6 + 0.4 * Math.sin((i / dayCount) * Math.PI * 1.5);
    const spend = (totalSpend / dayCount) * wave;
    return {
      date: date.toISOString().split('T')[0],
      spend: parseFloat(spend.toFixed(2)),
      impressions: Math.round((spend / 4.7) * 1000),
      results: Math.round(spend / 27),
    };
  });

  // Per-ad daily breakdown for the modal detail view
  const perAdDaily = {};
  ads.forEach((a) => {
    perAdDaily[a.ad_id] = Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(since);
      date.setUTCDate(date.getUTCDate() + i);
      const wave = 0.5 + 0.5 * Math.sin((i / dayCount) * Math.PI * 2 + a.ad_id.length);
      return {
        date: date.toISOString().split('T')[0],
        spend: parseFloat(((a.spend / dayCount) * wave).toFixed(2)),
        impressions: Math.round((a.impressions / dayCount) * wave),
      };
    });
  });

  return {
    isMock: true,
    currency: 'EUR',
    date_range: { since, until },
    ads,
    daily: dailyBreakdown,
    per_ad_daily: perAdDaily,
  };
}

async function fetchPaginated(url, params) {
  const all = [];
  let next = url;
  let nextParams = params;
  while (next) {
    const res = await axios.get(next, { params: nextParams, timeout: 15000 });
    all.push(...(res.data?.data ?? []));
    next = res.data?.paging?.next ?? null;
    nextParams = null; // next URL already includes params
  }
  return all;
}

async function fetchLiveData({ token, accountId, since, until }) {
  // Meta requires the `act_` prefix on ad account IDs. Add it if missing.
  const normalizedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const baseUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${normalizedId}`;

  // 1. List ads filtered to active/paused only — keeps response small
  const adsRaw = await fetchPaginated(`${baseUrl}/ads`, {
    access_token: token,
    fields: 'id,name,effective_status,creative{id,video_id,thumbnail_url}',
    filtering: JSON.stringify([
      { field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] },
    ]),
    limit: 50,
  });

  const videoAds = adsRaw.filter((a) => a.creative?.video_id);

  if (videoAds.length === 0) {
    return { isMock: false, currency: 'EUR', date_range: { since, until }, ads: [], daily: [], per_ad_daily: {} };
  }

  // 2. Insights at level=ad — split into two calls to stay under Meta's data budget.
  // Call A: scalar metrics. Call B: video action metrics. We then merge by ad_id.
  const scalarFields = [
    'ad_id', 'ad_name', 'spend', 'impressions', 'reach', 'frequency',
    'cpm', 'ctr', 'cpc', 'clicks', 'actions', 'cost_per_action_type',
    'date_start', 'date_stop', 'account_currency',
  ].join(',');

  const videoFields = [
    'ad_id',
    'video_play_actions',
    'video_thruplay_watched_actions',
    'video_p25_watched_actions',
    'video_p50_watched_actions',
    'video_p75_watched_actions',
    'video_p100_watched_actions',
  ].join(',');

  const insightsParams = {
    access_token: token,
    level: 'ad',
    time_range: JSON.stringify({ since, until }),
    filtering: JSON.stringify([
      { field: 'ad.effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] },
    ]),
    limit: 50,
  };

  const [scalarRaw, videoRaw] = await Promise.all([
    fetchPaginated(`${baseUrl}/insights`, { ...insightsParams, fields: scalarFields }),
    fetchPaginated(`${baseUrl}/insights`, { ...insightsParams, fields: videoFields }),
  ]);

  const insightsRaw = scalarRaw.map((row) => ({
    ...row,
    ...(videoRaw.find((v) => v.ad_id === row.ad_id) ?? {}),
  }));

  const dailyRaw = await fetchPaginated(`${baseUrl}/insights`, {
    access_token: token,
    level: 'account',
    fields: 'spend,impressions,actions',
    time_range: JSON.stringify({ since, until }),
    time_increment: 1,
    limit: 50,
  });

  const insightsIndex = new Map(insightsRaw.map((i) => [i.ad_id, i]));

  // 3. Fetch video sources & thumbnails (one call per unique video_id)
  const videoIds = [...new Set(videoAds.map((a) => a.creative.video_id))];
  const videoMeta = {};
  await Promise.all(
    videoIds.map(async (vid) => {
      try {
        const vRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${vid}`, {
          params: { access_token: token, fields: 'source,picture,thumbnails{uri,is_preferred}' },
          timeout: 8000,
        });
        videoMeta[vid] = {
          source: vRes.data.source,
          picture: vRes.data.picture,
          thumbnails: vRes.data.thumbnails?.data ?? [],
        };
      } catch {
        videoMeta[vid] = { source: null, picture: null, thumbnails: [] };
      }
    })
  );

  const ads = videoAds.map((ad) => {
    const ins = insightsIndex.get(ad.id) ?? {};
    const vid = ad.creative.video_id;
    const vmeta = videoMeta[vid] ?? {};
    const get = (k) => parseFloat(ins[k] ?? 0);
    const actionVal = (arr, type) =>
      parseFloat((arr ?? []).find((a) => a.action_type === type)?.value ?? 0);
    const v3 = actionVal(ins.video_play_actions, 'video_view');
    const tp = actionVal(ins.video_thruplay_watched_actions, 'video_view');
    const purchases = actionVal(ins.actions, 'purchase');
    const leads = actionVal(ins.actions, 'lead');
    const results = purchases || leads;
    const cprArr = ins.cost_per_action_type ?? [];
    const costPerResult =
      parseFloat(cprArr.find((c) => c.action_type === 'purchase')?.value ?? 0) ||
      parseFloat(cprArr.find((c) => c.action_type === 'lead')?.value ?? 0) || 0;

    return {
      ad_id: ad.id,
      ad_name: ad.name,
      status: ad.effective_status,
      video_id: vid,
      thumbnail_url: ad.creative.thumbnail_url || vmeta.picture || vmeta.thumbnails?.[0]?.uri || null,
      preview_url: vmeta.source,
      spend: get('spend'),
      impressions: get('impressions'),
      reach: get('reach'),
      frequency: get('frequency'),
      cpm: get('cpm'),
      ctr: get('ctr'),
      cpc: get('cpc'),
      clicks: get('clicks'),
      video_3s_views: v3,
      thruplays: tp,
      results,
      cost_per_result: costPerResult,
      currency: ins.account_currency ?? 'EUR',
      p25: actionVal(ins.video_p25_watched_actions, 'video_view'),
      p50: actionVal(ins.video_p50_watched_actions, 'video_view'),
      p75: actionVal(ins.video_p75_watched_actions, 'video_view'),
      p100: actionVal(ins.video_p100_watched_actions, 'video_view'),
    };
  });

  const daily = dailyRaw.map((d) => ({
    date: d.date_start,
    spend: parseFloat(d.spend ?? 0),
    impressions: parseInt(d.impressions ?? 0, 10),
    results: parseInt(
      (d.actions ?? []).find((a) => a.action_type === 'purchase' || a.action_type === 'lead')?.value ?? 0,
      10
    ),
  }));

  return {
    isMock: false,
    currency: ads[0]?.currency ?? 'EUR',
    date_range: { since, until },
    ads,
    daily,
    per_ad_daily: {}, // populated lazily by /api/meta-video-ad-detail in v2; modal falls back to mock for now
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = req.query?.client ?? '';
  const since = req.query?.since ?? isoDaysAgo(30);
  const until = req.query?.until ?? isoDaysAgo(0);

  const token = clientEnv(clientId, 'META_ACCESS_TOKEN');
  const accountId = clientEnv(clientId, 'META_AD_ACCOUNT_ID');

  if (!token || !accountId) {
    return res.status(200).json(buildMockPayload(since, until));
  }

  try {
    const live = await fetchLiveData({ token, accountId, since, until });
    return res.status(200).json(live);
  } catch (err) {
    console.error('[meta-video-ads] API error:', err?.response?.data ?? err.message);
    return res.status(200).json({
      ...buildMockPayload(since, until),
      isMock: true,
      error: err?.response?.data?.error?.message ?? err.message,
    });
  }
}
