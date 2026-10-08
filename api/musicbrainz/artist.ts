interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
}

const USER_AGENT = 'BanjoAfricanMusicArchive/1.0 (https://banjo2.vercel.app/)';
const MIN_INTERVAL_MS = 1_100;
let lastRequestAt = 0;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query || query.length > 500) return res.status(400).json({ error: 'A search query of 1–500 characters is required.' });

  const waitMs = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastRequestAt = Date.now();

  const upstream = new URL('https://musicbrainz.org/ws/2/artist');
  upstream.searchParams.set('query', query);
  upstream.searchParams.set('fmt', 'json');
  upstream.searchParams.set('limit', '20');

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!response.ok) {
      return res.status(response.status === 503 ? 503 : 502).json({ error: response.status === 503 ? 'MusicBrainz is rate limiting requests. Please wait and retry.' : 'MusicBrainz search failed.' });
    }
    return res.status(200).json(await response.json());
  } catch {
    return res.status(502).json({ error: 'Could not reach MusicBrainz.' });
  }
}
