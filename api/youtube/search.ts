interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 200) {
    return res.status(400).json({ error: 'A search query of 2–200 characters is required.' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'YouTube search is not configured.' });

  const upstream = new URL('https://www.googleapis.com/youtube/v3/search');
  upstream.searchParams.set('part', 'snippet');
  upstream.searchParams.set('type', 'video');
  upstream.searchParams.set('maxResults', '6');
  upstream.searchParams.set('q', query);
  upstream.searchParams.set('key', apiKey);

  try {
    const response = await fetch(upstream);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!response.ok) {
      return res.status(response.status === 403 ? 503 : 502).json({
        error: response.status === 403 ? 'YouTube search is temporarily unavailable.' : 'YouTube search failed.',
      });
    }

    const data = await response.json() as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string; channelTitle?: string; description?: string };
      }>;
    };
    const videos = (data.items || []).flatMap((item) => {
      const videoId = item.id?.videoId;
      if (!videoId || !/^[\w-]{11}$/.test(videoId)) return [];
      return [{
        videoId,
        title: item.snippet?.title || 'YouTube video',
        channelTitle: item.snippet?.channelTitle || 'YouTube channel',
        description: item.snippet?.description || '',
      }];
    });
    return res.status(200).json({ videos });
  } catch {
    return res.status(502).json({ error: 'Could not reach YouTube.' });
  }
}
