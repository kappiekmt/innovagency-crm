import axios from 'axios';

const GRAPH_VERSION = 'v21.0';

// Format priority: try Instagram-first since most video creatives are vertical,
// fall back to mobile feed, then desktop. First successful format wins.
const FORMAT_PRIORITY = [
  'INSTAGRAM_STORY',
  'INSTAGRAM_STANDARD',
  'MOBILE_FEED_STANDARD',
  'DESKTOP_FEED_STANDARD',
];

function clientEnv(clientId, key) {
  const prefix = clientId ? clientId.toUpperCase().replace(/-/g, '_') + '_' : '';
  return process.env[`${prefix}${key}`] ?? process.env[key];
}

// Meta returns iframe HTML like: <iframe src="..." ...>...</iframe>
// We extract just the src so we can render it ourselves with our own sizing.
function extractIframeSrc(html) {
  if (!html) return null;
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1].replace(/&amp;/g, '&') : null;
}

async function fetchPreviewForFormat(adId, token, format) {
  try {
    const res = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${adId}/previews`, {
      params: { access_token: token, ad_format: format },
      timeout: 8000,
    });
    const body = res.data?.data?.[0]?.body;
    const src = extractIframeSrc(body);
    return src ? { format, src } : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = req.query?.client ?? '';
  const adId = req.query?.ad_id ?? '';
  const requestedFormat = req.query?.format ?? null;

  if (!adId) {
    return res.status(400).json({ error: 'ad_id required' });
  }

  const token = clientEnv(clientId, 'META_ACCESS_TOKEN');
  if (!token) {
    return res.status(200).json({ iframeUrl: null, error: 'no_token' });
  }

  const formatsToTry = requestedFormat ? [requestedFormat] : FORMAT_PRIORITY;
  for (const format of formatsToTry) {
    const result = await fetchPreviewForFormat(adId, token, format);
    if (result) {
      return res.status(200).json({
        iframeUrl: result.src,
        format: result.format,
        ad_id: adId,
      });
    }
  }

  return res.status(200).json({
    iframeUrl: null,
    error: 'no_preview_available',
    ad_id: adId,
    ads_manager_url: `https://business.facebook.com/adsmanager/manage/ads?selected_ad_ids=${adId}`,
  });
}
