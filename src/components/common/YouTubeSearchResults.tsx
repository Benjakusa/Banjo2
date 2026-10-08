import React, { useEffect, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { searchYouTubeVideos, type YouTubeVideo } from '../../lib/youtube';

interface Props {
  query: string;
}

export const YouTubeSearchResults: React.FC<Props> = ({ query }) => {
  const { importYouTubeVideo, recordings, isAuthenticated, showToast } = useBanjo();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importingVideoId, setImportingVideoId] = useState<string | null>(null);
  const importedVideoIds = new Set(recordings.map((recording) => recording.youtubeVideoId).filter(Boolean));

  const importVideo = async (video: YouTubeVideo) => {
    setImportingVideoId(video.videoId);
    try {
      await importYouTubeVideo(video);
    } finally {
      setImportingVideoId(null);
    }
  };

  useEffect(() => {
    const cleanQuery = query.trim();
    setVideos([]);
    setSelectedVideoId(null);
    setError('');
    if (cleanQuery.length < 2) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        setVideos(await searchYouTubeVideos(cleanQuery, controller.signal));
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'YouTube search failed.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (query.trim().length < 2 || (!loading && !error && videos.length === 0)) return null;

  return (
    <section className="space-y-3 rounded-xl border border-ink-12 bg-ink-06 p-3" aria-label="YouTube song results">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink">YouTube videos</h3>
        <span className="text-[10px] text-ink-60">From YouTube</span>
      </div>
      {loading && <p className="text-xs text-ink-60">Searching YouTube…</p>}
      {error && <p className="text-xs text-ink-60">{error}</p>}
      {selectedVideoId && (
        <div className="aspect-video overflow-hidden rounded-lg bg-ink">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${encodeURIComponent(selectedVideoId)}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
      <div className="space-y-1.5">
        {videos.map((video) => (
          <article
            key={video.videoId}
            className={`rounded-lg border px-3 py-2 transition-colors ${selectedVideoId === video.videoId ? 'border-brand bg-paper' : 'border-ink-12 bg-paper hover:border-brand'}`}
          >
            <button
              type="button"
              onClick={() => setSelectedVideoId(video.videoId)}
              className="block w-full text-left"
            >
              <span className="block truncate text-xs font-semibold text-ink">{video.title}</span>
              <span className="mt-0.5 block truncate text-[10px] text-ink-60">{video.channelTitle} · YouTube</span>
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[10px] font-medium text-link hover:underline"
            >
              Open on YouTube
            </a>
            <button
              type="button"
              disabled={importingVideoId === video.videoId || importedVideoIds.has(video.videoId)}
              onClick={() => {
                if (!isAuthenticated) {
                  showToast('Sign in to import a YouTube video.');
                  return;
                }
                void importVideo(video);
              }}
              className="ml-3 mt-1 text-[10px] font-semibold text-link hover:underline disabled:cursor-default disabled:text-ink-40"
            >
              {importedVideoIds.has(video.videoId) ? 'Added to Banjo' : importingVideoId === video.videoId ? 'Adding…' : 'Add to Banjo'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
