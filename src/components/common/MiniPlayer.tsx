import React, { useMemo } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  PlayFill,
  PauseFill,
  SkipForwardFill,
  SkipStartFill,
  MusicNoteList,
  VolumeUpFill,
  MusicNoteBeamed,
} from 'react-bootstrap-icons';

const formatSeconds = (sec: number) => {
  const safe = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const MiniPlayer: React.FC = () => {
  const {
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    setIsFullPlayerOpen,
    navigateTo,
    seek,
  } = useBanjo();

  const soloSegments = useMemo(() => {
    if (!currentRecording) return [];
    return currentRecording.musicians
      .filter((m) => m.isSoloist)
      .flatMap((credit) =>
        (credit.solos || [])
          .filter((s) => typeof s.startSec === 'number' && typeof s.endSec === 'number')
          .map((span) => ({
            name: credit.musicianName,
            order: credit.soloOrder,
            start: span.startSec as number,
            end: span.endSec as number,
          }))
      )
      .sort((a, b) => a.start - b.start);
  }, [currentRecording]);

  if (!currentRecording) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const total = duration || currentRecording.duration || 1;
  const hasSoloStrip = soloSegments.length > 0;
  const isOralHistory = currentRecording.songId === 'oral-interview';

  const openRecording = () => {
    if (!isOralHistory) {
      navigateTo('song_detail', { songId: currentRecording.id });
    }
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(Math.max(0, Math.min(total, ratio * total)));
  };

  return (
    <aside
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-ink-12 bg-paper/95 backdrop-blur sm:bottom-0 sm:z-30 min-[1000px]:left-[max(220px,calc((100vw-1800px)/2+220px))]"
    >
      <div
        onClick={handleBarClick}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(currentTime)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(Math.min(total, currentTime + 5));
          if (e.key === 'ArrowLeft') seek(Math.max(0, currentTime - 5));
        }}
        className="relative h-1 w-full cursor-pointer bg-ink-06"
      >
        <div
          className="h-full bg-ink"
          style={{ width: `${progressPercent}%` }}
        />
        {soloSegments.map((seg, i) => (
          <span
            key={i}
            title={`${seg.name} — ${formatSeconds(seg.start)} to ${formatSeconds(seg.end)}`}
            className={`absolute inset-y-0 ${
              currentTime >= seg.start && currentTime <= seg.end
                ? 'bg-brand'
                : 'bg-brand'
            }`}
            style={{
              left: `${(seg.start / total) * 100}%`,
              width: `${Math.max(0.6, ((seg.end - seg.start) / total) * 100)}%`,
            }}
          />
        ))}
      </div>

      <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-2 px-2 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={openRecording}
          disabled={isOralHistory}
          className="flex min-w-0 flex-1 items-center gap-2 text-left sm:flex-none sm:max-w-xs"
        >
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-ink-06">
            <img
              src={currentRecording.coverImage}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            {isPlaying && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
                <MusicNoteBeamed className="h-3.5 w-3.5 text-brand" />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold leading-tight text-ink sm:text-sm">
              {currentRecording.title}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-ink-60">
              {soloSegments.length > 0 ? (
                <span className="text-ink-60">
                  {soloSegments.length} solo{soloSegments.length === 1 ? '' : 's'} credited
                </span>
              ) : (
                currentRecording.artistOrBand
              )}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={prevTrack}
            aria-label="Previous track"
            className="hidden h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06 sm:flex"
          >
            <SkipStartFill className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-85"
          >
            {isPlaying ? <PauseFill className="h-4 w-4" /> : <PlayFill className="ml-0.5 h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={nextTrack}
            aria-label="Next track"
            className="hidden h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06 sm:flex"
          >
            <SkipForwardFill className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={nextTrack}
            aria-label="Queue"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06 sm:hidden"
          >
            <MusicNoteList className="h-4 w-4" />
          </button>

          <span className="ml-1 hidden items-center gap-1.5 sm:flex">
            <VolumeUpFill className="h-4 w-4 text-ink-60" />
            <span
              aria-hidden="true"
              className="h-1 w-14 overflow-hidden rounded-full bg-ink-06"
            >
              <span className="block h-full w-2/3 bg-ink-60" />
            </span>
          </span>

          <span className="ml-1 hidden font-mono text-[11px] tabular-nums text-ink-60 lg:inline">
            {formatSeconds(currentTime)} / {formatSeconds(total)}
          </span>

          <button
            type="button"
            onClick={() => setIsFullPlayerOpen(true)}
            aria-label="Open full player"
            title="Open full player"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06"
          >
            <img
              src={currentRecording.coverImage}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded object-cover"
            />
          </button>
        </div>
      </div>
    </aside>
  );
};
