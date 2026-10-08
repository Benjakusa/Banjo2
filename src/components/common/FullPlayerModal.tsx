import React, { useMemo, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { VerificationBadge } from './VerificationBadge';
import type { LyricsVersion } from '../../types';
import {
  PlayFill,
  PauseFill,
  SkipBackwardFill,
  SkipForwardFill,
  ChevronDown,
  Repeat,
  Shuffle,
  JournalText,
  Share,
  BookmarkFill,
  Bookmark,
  ShieldCheck,
  MusicNoteBeamed,
  Translate,
  ClockFill,
} from 'react-bootstrap-icons';

const formatSeconds = (sec: number) => {
  const safe = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const FullPlayerModal: React.FC = () => {
  const {
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    playbackSpeed,
    setSpeed,
    navigateTo,
    recordings,
    playSong,
    toggleSaveRecording,
    userProfile,
    showToast,
  } = useBanjo();

  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'personnel' | 'queue' | 'provenance'>('player');
  const [activeLyricsId, setActiveLyricsId] = useState<string | null>(null);

  const lyricsVersions = useMemo<LyricsVersion[]>(() => {
    if (!currentRecording) return [];
    if (currentRecording.lyricsVersions && currentRecording.lyricsVersions.length > 0) {
      return currentRecording.lyricsVersions;
    }
    const legacy: LyricsVersion[] = [];
    if (currentRecording.lyrics) {
      legacy.push({
        id: `${currentRecording.id}-original`,
        language: currentRecording.language,
        isOriginal: true,
        isTranslation: false,
        lines: currentRecording.lyrics
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((text) => ({ text })),
        updatedAt: currentRecording.updatedAt,
      });
    }
    if (currentRecording.lyricsTranslation) {
      legacy.push({
        id: `${currentRecording.id}-translation`,
        language: 'English',
        isOriginal: false,
        isTranslation: true,
        translationOfId: `${currentRecording.id}-original`,
        lines: currentRecording.lyricsTranslation
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((text) => ({ text })),
        updatedAt: currentRecording.updatedAt,
      });
    }
    return legacy;
  }, [currentRecording]);

  const soloists = useMemo(() => {
    if (!currentRecording) return [];
    return currentRecording.musicians
      .filter((m) => m.isSoloist)
      .sort((a, b) => (a.soloOrder ?? Number.MAX_SAFE_INTEGER) - (b.soloOrder ?? Number.MAX_SAFE_INTEGER));
  }, [currentRecording]);

  const soloSegments = useMemo(() => {
    if (!currentRecording) return [];
    return soloists
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
  }, [soloists, currentRecording]);

  if (!isFullPlayerOpen || !currentRecording) return null;

  const isSaved = userProfile.savedRecordingIds.includes(currentRecording.id);
  const total = duration || currentRecording.duration;
  const activeLyrics = lyricsVersions.find((v) => v.id === activeLyricsId) || lyricsVersions[0] || null;
  const isSynced = activeLyrics?.lines.some((l) => typeof l.startSec === 'number') ?? false;

  let activeLineIndex = -1;
  if (isSynced && activeLyrics) {
    activeLyrics.lines.forEach((line, i) => {
      if (typeof line.startSec === 'number' && currentTime >= line.startSec) activeLineIndex = i;
    });
  }

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'player', label: 'Player' },
    ...(lyricsVersions.length > 0 ? [{ id: 'lyrics' as const, label: 'Lyrics' }] : []),
    { id: 'personnel', label: 'Personnel' },
    { id: 'queue', label: `Queue (${recordings.length})` },
    { id: 'provenance', label: 'Provenance' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full player"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
      onClick={() => setIsFullPlayerOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-ink-12 bg-paper sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-ink-12 px-3 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => setIsFullPlayerOpen(false)}
            aria-label="Collapse player"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-60 transition-colors hover:bg-ink-06 hover:text-ink"
          >
            <ChevronDown className="h-5 w-5" />
          </button>

          <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'true' : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-ink text-paper'
                    : 'text-ink-60 hover:bg-ink-06 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'player' && (
            <>
              <div className="flex flex-col items-center">
                <div className={`relative overflow-hidden rounded-xl bg-ink-06 ${currentRecording.youtubeVideoId && !currentRecording.audioUrl ? 'aspect-video w-full' : 'aspect-square w-48 sm:w-60'}`}>
                  {currentRecording.youtubeVideoId && !currentRecording.audioUrl ? (
                    <iframe
                      key={`${currentRecording.youtubeVideoId}-${isPlaying ? 'playing' : 'paused'}`}
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/${encodeURIComponent(currentRecording.youtubeVideoId)}?autoplay=${isPlaying ? 1 : 0}&controls=1`}
                      title={currentRecording.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <img
                        src={currentRecording.coverImage}
                        alt={currentRecording.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 rounded bg-ink/80 px-2 py-0.5 font-mono text-[10px] text-paper">
                        {currentRecording.audioQuality}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-1 text-center">
                  <p className="text-xs text-ink-60">
                    {currentRecording.country} · {currentRecording.releaseYear ?? 'Year unknown'} ·{' '}
                    {currentRecording.genre}
                  </p>
                  <h2 className="text-xl font-bold leading-tight text-ink sm:text-2xl">
                    {currentRecording.title}
                  </h2>
                  <p className="text-sm font-medium text-ink-60">
                    {currentRecording.artistOrBand}
                  </p>
                </div>
              </div>

              {soloSegments.length > 0 && (
                <div className="rounded-xl border border-ink-12 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <MusicNoteBeamed className="h-4 w-4 text-brand" />
                    Solo credits
                  </p>
                  <div className="relative h-8 w-full overflow-hidden rounded-full bg-ink-06">
                    {soloSegments.map((seg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => seek(seg.start)}
                        title={`${seg.name} — ${formatSeconds(seg.start)} to ${formatSeconds(seg.end)}`}
                        className={`absolute inset-y-0.5 rounded-full ${
                          currentTime >= seg.start && currentTime <= seg.end
                            ? 'bg-brand ring-2 ring-paper'
                            : 'bg-brand/60 hover:bg-brand'
                        }`}
                        style={{
                          left: `${(seg.start / total) * 100}%`,
                          width: `${Math.max(2, ((seg.end - seg.start) / total) * 100)}%`,
                        }}
                      >
                        <span className="sr-only">
                          Jump to {seg.name} solo at {formatSeconds(seg.start)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-60">
                    {soloSegments.map((seg, i) => (
                      <li key={i} className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        {seg.name}
                        <span className="font-mono">
                          {formatSeconds(seg.start)}–{formatSeconds(seg.end)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={total || 100}
                  step={0.5}
                  value={Math.min(currentTime, total || 100)}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  aria-label="Seek"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-06 accent-brand"
                />
                <div className="flex justify-between font-mono text-[11px] tabular-nums text-ink-60">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(total)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsShuffle(!isShuffle)}
                    title="Shuffle"
                    aria-label="Shuffle"
                    className={`rounded p-2 transition-colors ${
                      isShuffle ? 'text-brand' : 'text-ink-60 hover:text-ink'
                    }`}
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')
                    }
                    title={`Repeat: ${repeatMode}`}
                    aria-label={`Repeat: ${repeatMode}`}
                    className={`rounded p-2 transition-colors ${
                      repeatMode !== 'off'
                        ? 'text-brand'
                        : 'text-ink-60 hover:text-ink'
                    }`}
                  >
                    <Repeat className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={prevTrack}
                    aria-label="Previous track"
                    className="p-2 text-ink-60 transition-colors hover:text-ink"
                  >
                    <SkipBackwardFill className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-85"
                  >
                    {isPlaying ? (
                      <PauseFill className="h-6 w-6" />
                    ) : (
                      <PlayFill className="ml-0.5 h-6 w-6" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={nextTrack}
                    aria-label="Next track"
                    className="p-2 text-ink-60 transition-colors hover:text-ink"
                  >
                    <SkipForwardFill className="h-5 w-5" />
                  </button>
                </div>

                <div className="hidden items-center gap-1 sm:flex">
                  {speedOptions.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setSpeed(spd)}
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-ink text-paper'
                          : 'text-ink-60 hover:bg-ink-06'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-ink-12 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveRecording(currentRecording.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isSaved
                        ? 'bg-ink-06 text-ink'
                        : 'bg-ink-06 text-ink-60 hover:text-ink'
                    }`}
                  >
                    {isSaved ? (
                      <BookmarkFill className="h-3.5 w-3.5 text-brand" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                    {isSaved ? 'Saved' : 'Save'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      showToast('Citation link copied to clipboard');
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-ink-12 px-3 py-1.5 text-xs font-semibold text-ink-60 transition-colors hover:text-ink"
                  >
                    <Share className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsFullPlayerOpen(false);
                    navigateTo('song_detail', { songId: currentRecording.id });
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-on-orange transition-opacity hover:opacity-90"
                >
                  <JournalText className="h-3.5 w-3.5" />
                  Open article
                </button>
              </div>
            </>
          )}

          {activeTab === 'lyrics' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {lyricsVersions.map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => setActiveLyricsId(version.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeLyrics?.id === version.id
                        ? 'bg-ink text-paper'
                        : 'bg-ink-06 text-ink-60 hover:text-ink'
                    }`}
                  >
                    {version.isTranslation ? (
                      <Translate className="h-3.5 w-3.5" />
                    ) : (
                      <JournalText className="h-3.5 w-3.5" />
                    )}
                    {version.language}
                  </button>
                ))}
                {isSynced && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-60">
                    <ClockFill className="h-3 w-3" />
                    Time-synced
                  </span>
                )}
              </div>

              {activeLyrics ? (
                activeLyrics.isInstrumental ? (
                  <p className="rounded-xl border border-ink-12 p-4 text-sm text-ink-60">
                    Instrumental — no sung lyrics were transcribed for this version.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {activeLyrics.lines.map((line, i) => {
                      const active = isSynced && i === activeLineIndex;
                      const clickable = typeof line.startSec === 'number';
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => clickable && seek(line.startSec as number)}
                            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm leading-relaxed transition-colors ${
                              active
                                ? 'bg-brand font-semibold text-on-orange'
                                : clickable
                                  ? 'text-ink/80 hover:bg-ink-06'
                                  : 'cursor-default text-ink/80'
                            }`}
                          >
                            {line.section && (
                              <span className="mr-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-60">
                                {line.section}
                              </span>
                            )}
                            {line.text}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : (
                <p className="text-sm text-ink-60">No lyrics available.</p>
              )}
            </div>
          )}

          {activeTab === 'personnel' && (
            <div className="space-y-5">
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
                  <MusicNoteBeamed className="h-4 w-4 text-brand" />
                  Soloists
                </h3>
                {soloists.length === 0 ? (
                  <p className="text-sm text-ink-60">No soloists credited for this recording.</p>
                ) : (
                  <ol className="space-y-2">
                    {soloists.map((credit) => (
                      <li
                        key={`${credit.musicianId}-${credit.instrument}-${credit.soloOrder}`}
                        className="flex items-start gap-3 rounded-xl border border-ink-12 p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-[11px] font-bold text-on-orange">
                          {credit.soloOrder ?? '–'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">{credit.musicianName}</p>
                          <p className="text-xs text-ink-60">
                            {credit.role} · {credit.instrument}
                          </p>
                          {credit.solos && credit.solos.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {credit.solos.map((span, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  disabled={typeof span.startSec !== 'number'}
                                  onClick={() => seek(span.startSec || 0)}
                                  className="rounded-full border border-ink-12 px-2 py-0.5 font-mono text-[11px] text-ink-60 transition-colors hover:border-brand hover:text-link"
                                >
                                  {span.label || 'Solo'} {formatSeconds(span.startSec || 0)}–
                                  {formatSeconds(span.endSec || 0)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-bold text-ink">Other musicians</h3>
                <ul className="divide-y divide-ink-12 rounded-xl border border-ink-12">
                  {currentRecording.musicians
                    .filter((m) => !m.isSoloist)
                    .map((credit, i) => (
                      <li
                        key={`${credit.musicianId}-${i}`}
                        className="flex items-center gap-3 p-3 text-sm"
                      >
                        <span className="font-semibold text-ink">{credit.musicianName}</span>
                        <span className="text-xs text-ink-60">{credit.instrument}</span>
                        {credit.notes && (
                          <span className="ml-auto text-xs italic text-ink-60">{credit.notes}</span>
                        )}
                      </li>
                    ))}
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="space-y-2">
              {recordings.map((rec) => {
                const isCurrent = rec.id === currentRecording.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => playSong(rec)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isCurrent
                        ? 'border-brand bg-brand/5'
                        : 'border-ink-12 hover:bg-ink-06'
                    }`}
                  >
                    <img
                      src={rec.coverImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs font-semibold ${
                          isCurrent ? 'text-brand' : 'text-ink'
                        }`}
                      >
                        {rec.title}
                      </span>
                      <span className="block truncate text-[11px] text-ink-60">
                        {rec.artistOrBand} · {rec.releaseYear ?? 'Year unknown'}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-ink-60">
                      {formatSeconds(rec.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="rounded-xl border border-ink-12 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
                <ShieldCheck className="h-4 w-4 text-brand" />
                Provenance and rights
              </h3>
              <p className="text-xs leading-relaxed text-ink-60">
                {currentRecording.rightsDeclaration}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-12 pt-2 font-mono text-[11px]">
                <div>
                  <span className="block text-ink-60">Status</span>
                  <span className="text-ink">{currentRecording.rightsStatus}</span>
                </div>
                <div>
                  <span className="block text-ink-60">Verification</span>
                  <VerificationBadge status={currentRecording.verificationStatus} className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
