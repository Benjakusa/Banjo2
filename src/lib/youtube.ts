export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
}

interface YouTubeSearchResponse {
  videos?: YouTubeVideo[];
  error?: string;
}

export async function searchYouTubeVideos(query: string, signal?: AbortSignal): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/youtube/search?${params}`, { signal });
  const data = await response.json() as YouTubeSearchResponse;
  if (!response.ok) throw new Error(data.error || `YouTube search returned ${response.status}.`);
  return data.videos || [];
}
