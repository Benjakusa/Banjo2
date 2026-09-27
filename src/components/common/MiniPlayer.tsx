import React from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  PlayFill,
  PauseFill,
  SkipForwardFill,
  ChevronUp,
  BroadcastPin,
} from 'react-bootstrap-icons';

export const MiniPlayer: React.FC = () => {
  const {
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    setIsFullPlayerOpen,
    navigateTo,
  } = useBanjo();

  if (!currentRecording) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <aside
      aria-label="Audio Playback Bar"
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white shadow-md transition-all"
    >
      {/* Top progress seek line */}
      <div className="w-full bg-black/5 h-1 relative overflow-hidden">
        <div
          className="h-full bg-orange-600 transition-all duration-150 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-md">
          <div
            onClick={() => {
              if (currentRecording.songId !== 'oral-interview') {
                navigateTo('song_detail', { songId: currentRecording.id });
              }
            }}
            className="group relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-black/10 cursor-pointer bg-black/5"
          >
            <img
              src={currentRecording.coverImage}
              alt={currentRecording.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <BroadcastPin className="w-4 h-4 text-orange-400" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              onClick={() => {
                if (currentRecording.songId !== 'oral-interview') {
                  navigateTo('song_detail', { songId: currentRecording.id });
                }
              }}
              className="truncate text-xs sm:text-sm font-serif font-medium text-black hover:text-orange-700 cursor-pointer"
            >
              {currentRecording.title}
            </p>
            <p className="truncate text-[11px] text-black/50">
              {currentRecording.artistOrBand}
              <span className="mx-1.5 text-black/30">·</span>
              <span className="font-mono text-[10px]">{currentRecording.releaseYear}</span>
              <span className="mx-1.5 text-black/30">·</span>
              <span>{currentRecording.genre}</span>
            </p>
          </div>
        </div>

        {/* Center / Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:inline-block font-mono text-[11px] text-black/50 tabular-nums">
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-transform active:scale-95 cursor-pointer shadow-xs"
          >
            {isPlaying ? <PauseFill className="h-4 w-4" /> : <PlayFill className="h-4 w-4 ml-0.5" />}
          </button>

          <button
            onClick={nextTrack}
            aria-label="Next track"
            title="Next in archive queue"
            className="text-black/50 hover:text-black transition-colors p-1 cursor-pointer"
          >
            <SkipForwardFill className="h-4 w-4" />
          </button>

          {/* Open Full Player */}
          <button
            onClick={() => setIsFullPlayerOpen(true)}
            aria-label="Open full player view"
            title="Open Audio Sheet"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-black/70 hover:text-black bg-black/5 border border-black/10 rounded transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Player</span>
            <ChevronUp className="h-3 w-3 text-orange-600" />
          </button>
        </div>
      </div>
    </aside>
  );
};
