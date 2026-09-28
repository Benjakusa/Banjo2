import React, { useMemo, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={() => setIsFullPlayerOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--banjo-line)] bg-[var(--banjo-bg)] shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--banjo-line)] px-3 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => setIsFullPlayerOpen(false)}
            aria-label="Collapse player"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--banjo-muted)] transition-colors hover:bg-[var(--banjo-chip)] hover:text-[var(--banjo-text)]"
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
                    ? 'bg-[var(--banjo-text)] text-[var(--banjo-bg)]'
                    : 'text-[var(--banjo-muted)] hover:bg-[var(--banjo-chip)] hover:text-[var(--banjo-text)]'
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
                <div className="relative aspect-square w-48 overflow-hidden rounded-xl bg-[var(--banjo-chip)] sm:w-60">
                  <img
                    src={currentRecording.coverImage}
                    alt={currentRecording.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white">
                    {currentRecording.audioQuality}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-center">
                  <p className="text-xs text-[var(--banjo-muted)]">
                    {currentRecording.country} · {currentRecording.releaseYear} ·{' '}
                    {currentRecording.genre}
                  </p>
                  <h2 className="text-xl font-bold leading-tight text-[var(--banjo-text)] sm:text-2xl">
                    {currentRecording.title}
                  </h2>
                  <p className="text-sm font-medium text-[var(--banjo-primary)]">
                    {currentRecording.artistOrBand}
                  </p>
                </div>
              </div>

              {soloSegments.length > 0 && (
                <div className="rounded-xl border border-[var(--banjo-line)] p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--banjo-text)]">
                    <MusicNoteBeamed className="h-4 w-4 text-[var(--banjo-accent)]" />
                    Solo credits
                  </p>
                  <div className="relative h-8 w-full overflow-hidden rounded-full bg-[var(--banjo-chip)]">
                    {soloSegments.map((seg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => seek(seg.start)}
                        title={`${seg.name} — ${formatSeconds(seg.start)} to ${formatSeconds(seg.end)}`}
                        className={`absolute inset-y-0.5 rounded-full ${
                          currentTime >= seg.start && currentTime <= seg.end
                            ? 'bg-[var(--banjo-primary)] ring-2 ring-white'
                            : 'bg-[var(--banjo-primary)]/60 hover:bg-[var(--banjo-primary)]'
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
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--banjo-muted)]">
                    {soloSegments.map((seg, i) => (
                      <li key={i} className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--banjo-primary)]" />
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--banjo-chip)] accent-[var(--banjo-primary)]"
                />
                <div className="flex justify-between font-mono text-[11px] tabular-nums text-[var(--banjo-muted)]">
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
                      isShuffle ? 'text-[var(--banjo-primary)]' : 'text-[var(--banjo-muted)] hover:text-[var(--banjo-text)]'
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
                        ? 'text-[var(--banjo-primary)]'
                        : 'text-[var(--banjo-muted)] hover:text-[var(--banjo-text)]'
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
                    className="p-2 text-[var(--banjo-muted)] transition-colors hover:text-[var(--banjo-text)]"
                  >
                    <SkipBackwardFill className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--banjo-text)] text-[var(--banjo-bg)] transition-opacity hover:opacity-85"
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
                    className="p-2 text-[var(--banjo-muted)] transition-colors hover:text-[var(--banjo-text)]"
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
                          ? 'bg-[var(--banjo-text)] text-[var(--banjo-bg)]'
                          : 'text-[var(--banjo-muted)] hover:bg-[var(--banjo-chip)]'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[var(--banjo-line)] pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveRecording(currentRecording.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isSaved
                        ? 'bg-[var(--banjo-chip)] text-[var(--banjo-text)]'
                        : 'bg-[var(--banjo-chip)] text-[var(--banjo-muted)] hover:text-[var(--banjo-text)]'
                    }`}
                  >
                    {isSaved ? (
                      <BookmarkFill className="h-3.5 w-3.5 text-[var(--banjo-primary)]" />
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
                    className="flex items-center gap-1.5 rounded-full border border-[var(--banjo-line)] px-3 py-1.5 text-xs font-semibold text-[var(--banjo-muted)] transition-colors hover:text-[var(--banjo-text)]"
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
                  className="flex items-center gap-1.5 rounded-full bg-[var(--banjo-primary)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
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
                        ? 'bg-[var(--banjo-text)] text-[var(--banjo-bg)]'
                        : 'bg-[var(--banjo-chip)] text-[var(--banjo-muted)] hover:text-[var(--banjo-text)]'
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
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--banjo-muted)]">
                    <ClockFill className="h-3 w-3" />
                    Time-synced
                  </span>
                )}
              </div>

              {activeLyrics ? (
                activeLyrics.isInstrumental ? (
                  <p className="rounded-xl border border-[var(--banjo-line)] p-4 text-sm text-[var(--banjo-muted)]">
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
                                ? 'bg-[var(--banjo-primary)] font-semibold text-white'
                                : clickable
                                  ? 'text-[var(--banjo-text)]/80 hover:bg-[var(--banjo-chip)]'
                                  : 'cursor-default text-[var(--banjo-text)]/80'
                            }`}
                          >
                            {line.section && (
                              <span className="mr-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--banjo-primary)]">
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
                <p className="text-sm text-[var(--banjo-muted)]">No lyrics available.</p>
              )}
            </div>
          )}

          {activeTab === 'personnel' && (
            <div className="space-y-5">
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--banjo-text)]">
                  <MusicNoteBeamed className="h-4 w-4 text-[var(--banjo-accent)]" />
                  Soloists
                </h3>
                {soloists.length === 0 ? (
                  <p className="text-sm text-[var(--banjo-muted)]">No soloists credited for this recording.</p>
                ) : (
                  <ol className="space-y-2">
                    {soloists.map((credit) => (
                      <li
                        key={`${credit.musicianId}-${credit.instrument}-${credit.soloOrder}`}
                        className="flex items-start gap-3 rounded-xl border border-[var(--banjo-line)] p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--banjo-primary)] font-mono text-[11px] font-bold text-white">
                          {credit.soloOrder ?? '–'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--banjo-text)]">{credit.musicianName}</p>
                          <p className="text-xs text-[var(--banjo-muted)]">
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
                                  className="rounded-full border border-[var(--banjo-line)] px-2 py-0.5 font-mono text-[11px] text-[var(--banjo-muted)] transition-colors hover:border-[var(--banjo-primary)] hover:text-[var(--banjo-primary)]"
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
                <h3 className="mb-2 text-sm font-bold text-[var(--banjo-text)]">Other musicians</h3>
                <ul className="divide-y divide-[var(--banjo-line)] rounded-xl border border-[var(--banjo-line)]">
                  {currentRecording.musicians
                    .filter((m) => !m.isSoloist)
                    .map((credit, i) => (
                      <li
                        key={`${credit.musicianId}-${i}`}
                        className="flex items-center gap-3 p-3 text-sm"
                      >
                        <span className="font-semibold text-[var(--banjo-text)]">{credit.musicianName}</span>
                        <span className="text-xs text-[var(--banjo-muted)]">{credit.instrument}</span>
                        {credit.notes && (
                          <span className="ml-auto text-xs italic text-[var(--banjo-muted)]">{credit.notes}</span>
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
                        ? 'border-[var(--banjo-primary)] bg-[var(--banjo-primary)]/5'
                        : 'border-[var(--banjo-line)] hover:bg-[var(--banjo-chip)]'
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
                          isCurrent ? 'text-[var(--banjo-primary)]' : 'text-[var(--banjo-text)]'
                        }`}
                      >
                        {rec.title}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--banjo-muted)]">
                        {rec.artistOrBand} · {rec.releaseYear}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[var(--banjo-muted)]">
                      {formatSeconds(rec.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="rounded-xl border border-[var(--banjo-line)] p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--banjo-text)]">
                <ShieldCheck className="h-4 w-4 text-[var(--banjo-primary)]" />
                Provenance and rights
              </h3>
              <p className="text-xs leading-relaxed text-[var(--banjo-muted)]">
                {currentRecording.rightsDeclaration}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--banjo-line)] pt-2 font-mono text-[11px]">
                <div>
                  <span className="block text-[var(--banjo-muted)]">Status</span>
                  <span className="text-[var(--banjo-text)]">{currentRecording.rightsStatus}</span>
                </div>
                <div>
                  <span className="block text-[var(--banjo-muted)]">Verification</span>
                  <span className="text-[var(--banjo-text)]">{currentRecording.verificationStatus}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
