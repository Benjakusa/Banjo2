import React, { useMemo, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { VerificationBadge } from '../common/VerificationBadge';
import type { LyricLine, LyricsVersion, MusicianCredit, Recording } from '../../types';
import {
  Play,
  PauseFill,
  Bookmark,
  Share,
  PencilSquare,
  ExclamationTriangle,
  ClockHistory,
  GeoAlt,
  InfoCircle,
  PlusLg,
  Translate,
  ChatLeftText,
  MusicNoteBeamed,
  Link45deg,
  ArrowLeft,
  PlayCircleFill,
  PeopleFill,
  JournalText,
  ClockFill,
  VolumeUpFill,
} from 'react-bootstrap-icons';

type WatchTab = 'overview' | 'personnel' | 'lyrics' | 'sources' | 'history' | 'talk';

const WATCH_TABS: { id: WatchTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'personnel', label: 'Personnel' },
  { id: 'lyrics', label: 'Lyrics' },
  { id: 'sources', label: 'Sources' },
  { id: 'history', label: 'History' },
  { id: 'talk', label: 'Talk' },
];

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const rightsLabel = (value: string) => value.replace(/_/g, ' ');

const SectionHeader: React.FC<{
  title: string;
  onEdit?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  editLabel?: string;
}> = ({ title, onEdit, onAdd, addLabel, editLabel }) => (
  <div className="mb-3 flex items-center justify-between gap-3 border-b border-current/10 pb-2">
    <h2 className="text-sm font-bold tracking-tight text-current sm:text-base">{title}</h2>
    <div className="flex shrink-0 items-center gap-1.5">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-current/60 transition-colors hover:bg-current/5 hover:text-current"
        >
          <PencilSquare className="h-3.5 w-3.5" />
          {editLabel || 'Edit'}
        </button>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-on-orange transition-opacity hover:opacity-90"
        >
          <PlusLg className="h-3 w-3" />
          {addLabel || 'Add'}
        </button>
      )}
    </div>
  </div>
);

const CompactRecordingCard: React.FC<{
  recording: Recording;
  onSelect: () => void;
}> = ({ recording, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className="group flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-current/5"
  >
    <span className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-ink-06 dark:bg-ink-06">
      <img
        src={recording.coverImage}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-transparent opacity-0 transition-opacity group-hover:bg-ink/35 group-hover:opacity-100">
        <PlayCircleFill className="h-8 w-8 text-paper" />
      </span>
      <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1 py-px font-mono text-[10px] text-paper">
        {formatTime(recording.duration)}
      </span>
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold leading-tight text-current">{recording.title}</span>
      <span className="mt-0.5 block truncate text-xs text-current/60">{recording.artistOrBand}</span>
      <span className="mt-0.5 block truncate font-mono text-[10px] text-current/40">
        {recording.releaseYear ?? 'Year unknown'} · {recording.country}
      </span>
    </span>
  </button>
);

const WaveformPlayer: React.FC<{
  recording: Recording;
  isPlayingThis: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
}> = ({ recording, isPlayingThis, currentTime, onTogglePlay, onSeek }) => {
  const peaks = recording.waveformPoints.length > 0 ? recording.waveformPoints : [0.3, 0.5, 0.4, 0.7, 0.5];
  const max = Math.max(...peaks, 1);
  const progress = recording.duration > 0 ? currentTime / recording.duration : 0;
  const isVideoMedia = recording.audioMimeType?.startsWith('video/')
    || /\.(mp4|webm|ogv)$/i.test(recording.audioFileName || '');

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-none bg-ink sm:rounded-2xl">
      {recording.audioUrl && isVideoMedia ? (
        <video
          className="absolute inset-0 h-full w-full bg-black object-contain"
          src={recording.audioUrl}
          controls
          playsInline
          preload="metadata"
          aria-label={recording.title}
        >
          Your browser cannot play this video format.
        </video>
      ) : recording.youtubeVideoId && !recording.audioUrl ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${encodeURIComponent(recording.youtubeVideoId)}`}
          title={recording.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
      <div className="absolute inset-0">
      <img
        src={recording.coverImage}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-xl"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlayingThis ? 'Pause recording' : 'Play recording'}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-paper/95 text-ink transition-transform hover:scale-105 active:scale-95 sm:h-20 sm:w-20"
        >
          {isPlayingThis ? (
            <PauseFill className="h-8 w-8 fill-current" />
          ) : (
            <Play className="ml-1 h-8 w-8 fill-current" />
          )}
        </button>
        <div className="flex h-16 w-full max-w-2xl items-center gap-[2px] sm:h-20">
          {peaks.map((peak, i) => {
            const played = i / peaks.length <= progress;
            return (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => onSeek(((i + 0.5) / peaks.length) * recording.duration)}
                className={`flex-1 rounded-full transition-colors ${
                  played ? 'bg-paper' : 'bg-paper/30'
                }`}
                style={{ height: `${Math.max(8, (peak / max) * 100)}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink/60 px-2.5 py-1 font-mono text-[11px] text-paper/90">
        <VolumeUpFill className="h-3 w-3" />
        {recording.audioQuality}
      </div>
      {recording.musicians.some((m) => m.isSoloist) && (
        <div className="absolute right-4 top-4 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-on-orange">
          {recording.musicians.filter((m) => m.isSoloist).length} soloist
          {recording.musicians.filter((m) => m.isSoloist).length === 1 ? '' : 's'} credited
        </div>
      )}
      </div>
      )}
    </div>
  );
};

const SoloTimeline: React.FC<{
  recording: Recording;
  soloists: MusicianCredit[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}> = ({ recording, soloists, currentTime, onSeek }) => {
  const segments = soloists
    .flatMap((credit) => (credit.solos || []).map((span) => ({ credit, span })))
    .filter((entry) => typeof entry.span.startSec === 'number' && typeof entry.span.endSec === 'number')
    .sort((a, b) => (a.span.startSec || 0) - (b.span.startSec || 0));

  if (segments.length === 0) return null;

  return (
    <div className="rounded-xl border border-current/10 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-current">
        <MusicNoteBeamed className="h-4 w-4 text-brand" />
        Solo map
      </div>
      <div className="relative h-9 w-full overflow-hidden rounded-full bg-current/5">
        <div
          className="absolute inset-y-0 left-0 bg-brand/25"
          style={{ width: `${Math.min(100, (currentTime / (recording.duration || 1)) * 100)}%` }}
        />
        {segments.map(({ credit, span }, i) => {
          const start = (span.startSec || 0) / (recording.duration || 1);
          const width = ((span.endSec || 0) - (span.startSec || 0)) / (recording.duration || 1);
          const active =
            currentTime >= (span.startSec || 0) && currentTime <= (span.endSec || 0);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSeek(span.startSec || 0)}
              title={`${credit.musicianName} — ${formatTime(span.startSec || 0)} to ${formatTime(span.endSec || 0)}`}
              className={`absolute inset-y-0.5 rounded-full transition-all ${
                active ? 'bg-brand ring-2 ring-paper' : 'bg-brand/70 hover:bg-brand'
              }`}
              style={{ left: `${start * 100}%`, width: `${Math.max(1.5, width * 100)}%` }}
            >
              <span className="sr-only">
                Jump to {credit.musicianName} solo at {formatTime(span.startSec || 0)}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-current/60">
        {segments.map(({ credit, span }, i) => (
          <li key={i} className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {credit.musicianName}
            <span className="font-mono text-current/40">
              {formatTime(span.startSec || 0)}–{formatTime(span.endSec || 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const LyricsBlock: React.FC<{
  version: LyricsVersion;
  isActive: boolean;
  currentTime: number;
  onSeek: (seconds: number) => void;
}> = ({ version, isActive, currentTime, onSeek }) => {
  const sections = useMemo(() => {
    const groups: { name: string; lines: LyricLine[] }[] = [];
    version.lines.forEach((line) => {
      const name = line.section || '';
      const last = groups[groups.length - 1];
      if (last && last.name === name) {
        last.lines.push(line);
      } else {
        groups.push({ name, lines: [line] });
      }
    });
    return groups;
  }, [version.lines]);

  const isSynced = version.lines.some((l) => typeof l.startSec === 'number');
  let activeIndex = -1;
  if (isSynced) {
    version.lines.forEach((line, i) => {
      if (typeof line.startSec === 'number' && currentTime >= line.startSec) activeIndex = i;
    });
  }

  let running = 0;
  return (
    <div className="space-y-4">
      {version.isInstrumental ? (
        <p className="rounded-xl border border-current/10 p-4 text-sm text-current/60">
          Instrumental — no sung lyrics were transcribed for this version.
        </p>
      ) : (
        sections.map((group, gi) => (
          <div key={gi}>
            {group.name && (
              <h4 className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-60">
                {group.name}
              </h4>
            )}
            <div className="space-y-0.5">
              {group.lines.map((line) => {
                const idx = running++;
                const active = isActive && isSynced && idx === activeIndex;
                const clickable = typeof line.startSec === 'number';
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && onSeek(line.startSec as number)}
                    className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm leading-relaxed transition-colors ${
                      active
                        ? 'bg-brand font-semibold text-on-orange'
                        : clickable
                          ? 'text-current/75 hover:bg-current/5'
                          : 'cursor-default text-current/75'
                    }`}
                  >
                    {line.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export const SongDetailView: React.FC = () => {
  const { recordings, selectedSongId, isCatalogueLoading } = useBanjo();
  const recording = recordings.find((entry) => entry.id === selectedSongId) || recordings[0];
  if (!recording) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-ink-60">{isCatalogueLoading ? 'Loading archive…' : 'No recordings are available yet.'}</div>;
  }
  return <SongDetailContent />;
};

const SongDetailContent: React.FC = () => {
  const {
    selectedSongId,
    recordings,
    songs,
    playSong,
    isPlaying,
    currentRecording,
    togglePlay,
    seek,
    currentTime,
    navigateTo,
    goBack,
    canGoBack,
    setIsReportModalOpen,
    openDiffViewer,
    openQuickEdit,
    toggleSaveRecording,
    userProfile,
    showToast,
    addTalkComment,
  } = useBanjo();

  const [activeTab, setActiveTab] = useState<WatchTab>('overview');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeLyricsId, setActiveLyricsId] = useState<string | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareLyricsId, setCompareLyricsId] = useState<string | null>(null);
  const [talkTopic, setTalkTopic] = useState('');
  const [talkCommentText, setTalkCommentText] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const recording = recordings.find((r) => r.id === selectedSongId) || recordings[0];
  const songComposition = songs.find((s) => s.id === recording.songId) || songs[0];

  const isCurrentActive = currentRecording?.id === recording.id;
  const isPlayingThis = isCurrentActive && isPlaying;
  const isSaved = userProfile.savedRecordingIds.includes(recording.id);

  const soloists = useMemo(
    () =>
      recording.musicians
        .filter((m) => m.isSoloist)
        .sort((a, b) => (a.soloOrder ?? Number.MAX_SAFE_INTEGER) - (b.soloOrder ?? Number.MAX_SAFE_INTEGER)),
    [recording.musicians]
  );

  const otherMusicians = useMemo(
    () => recording.musicians.filter((m) => !m.isSoloist),
    [recording.musicians]
  );

  const otherMusiciansByInstrument = useMemo(() => {
    const map = new Map<string, MusicianCredit[]>();
    otherMusicians.forEach((m) => {
      const list = map.get(m.instrument) || [];
      list.push(m);
      map.set(m.instrument, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [otherMusicians]);

  const lyricsVersions = useMemo<LyricsVersion[]>(() => {
    if (recording.lyricsVersions && recording.lyricsVersions.length > 0) {
      return recording.lyricsVersions;
    }
    const legacy: LyricsVersion[] = [];
    if (recording.lyrics) {
      legacy.push({
        id: `${recording.id}-original`,
        language: recording.language,
        isOriginal: true,
        isTranslation: false,
        lines: recording.lyrics
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((text) => ({ text })),
        updatedAt: recording.updatedAt,
      });
    }
    if (recording.lyricsTranslation) {
      legacy.push({
        id: `${recording.id}-translation`,
        language: 'English',
        isOriginal: false,
        isTranslation: true,
        translationOfId: `${recording.id}-original`,
        lines: recording.lyricsTranslation
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((text) => ({ text })),
        updatedAt: recording.updatedAt,
      });
    }
    return legacy;
  }, [recording]);

  const activeLyrics = useMemo(
    () => lyricsVersions.find((v) => v.id === activeLyricsId) || lyricsVersions[0] || null,
    [lyricsVersions, activeLyricsId]
  );

  const compareLyrics = useMemo(
    () => lyricsVersions.find((v) => v.id === compareLyricsId) || null,
    [lyricsVersions, compareLyricsId]
  );

  const alternateRecordings = useMemo(
    () => recordings.filter((r) => r.songId === recording.songId && r.id !== recording.id),
    [recordings, recording]
  );

  const moreFromArtist = useMemo(
    () =>
      recordings
        .filter(
          (r) =>
            r.id !== recording.id &&
            r.songId !== recording.songId &&
            (r.bandId === recording.bandId || r.artistId === recording.artistId) &&
            (recording.bandId !== undefined || recording.artistId !== undefined)
        )
        .slice(0, 6),
    [recordings, recording]
  );

  const relatedByScene = useMemo(
    () =>
      recordings
        .filter(
          (r) =>
            r.id !== recording.id &&
            r.songId !== recording.songId &&
            r.artistOrBand !== recording.artistOrBand &&
            (r.genre === recording.genre || r.country === recording.country)
        )
        .slice(0, 8),
    [recordings, recording]
  );

  const handlePlayRecording = () => {
    if (isPlayingThis) {
      togglePlay();
    } else {
      playSong(recording);
    }
  };

  const handleSeek = (seconds: number) => {
    if (isCurrentActive) {
      seek(seconds);
    } else {
      playSong(recording);
      seek(seconds);
    }
  };

  const handleOpenArtist = () => {
    if (recording.bandId) {
      navigateTo('band_detail', { bandId: recording.bandId });
    } else if (recording.artistId) {
      navigateTo('musician_detail', { musicianId: recording.artistId });
    }
  };

  const handleCite = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Article citation link copied');
  };

  const hasRightRail =
    alternateRecordings.length > 0 || moreFromArtist.length > 0 || relatedByScene.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-0 pb-40 sm:px-4 lg:px-6">
      <div
        className={`grid grid-cols-1 gap-6 ${
          hasRightRail ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 px-4 pt-3 sm:px-0 sm:pt-4">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-current/60 transition-colors hover:bg-current/5 hover:text-current disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </div>

          <div className="mt-2 sm:mt-3">
            <WaveformPlayer
              recording={recording}
              isPlayingThis={isPlayingThis}
              currentTime={isCurrentActive ? currentTime : 0}
              onTogglePlay={handlePlayRecording}
              onSeek={handleSeek}
            />
          </div>

          <div className="px-4 sm:px-0">
            <h1 className="mt-3 text-xl font-bold leading-tight tracking-tight text-current sm:mt-4 sm:text-2xl">
              {recording.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <button
                type="button"
                onClick={handleOpenArtist}
                disabled={!recording.bandId && !recording.artistId}
                className="group inline-flex min-w-0 items-center gap-2 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-06 text-sm font-bold text-ink">
                  {recording.artistOrBand.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold leading-tight text-current group-hover:opacity-70">
                    {recording.artistOrBand}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-current/60">
                    <GeoAlt className="h-3 w-3" />
                    {recording.country} · {recording.genre}
                    <VerificationBadge
                      status={recording.verificationStatus}
                      className="h-3 w-3"
                    />
                  </span>
                </span>
              </button>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayRecording}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-opacity hover:opacity-85 dark:bg-paper dark:text-ink"
                >
                  {isPlayingThis ? (
                    <PauseFill className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  {isPlayingThis ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaveRecording(recording.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isSaved
                      ? 'bg-current/10 text-current'
                      : 'bg-current/5 text-current hover:bg-current/10'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCite}
                  className="inline-flex items-center gap-1.5 rounded-full bg-current/5 px-3.5 py-2 text-sm font-semibold text-current transition-colors hover:bg-current/10"
                >
                  <Share className="h-4 w-4" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('upload', { songId: recording.id })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-on-orange transition-opacity hover:opacity-90"
                >
                  <PencilSquare className="h-4 w-4" />
                  Edit metadata
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  aria-label="Report a problem with this entry"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-current/5 text-current transition-colors hover:bg-current/10"
                >
                  <ExclamationTriangle className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-current/5 p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-current">
                <span>{recording.playsCount.toLocaleString()} plays</span>
                <span className="text-current/30">·</span>
                <span className="font-mono text-[11px] text-current/60">
                  {recording.releaseYear ?? 'Year unknown'} · {recording.label}
                </span>
                <span className="text-current/30">·</span>
                <span className="font-mono text-[11px] text-current/60">{recording.audioQuality}</span>
                <span className="text-current/30">·</span>
                <span className="rounded-full bg-current/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-current/70">
                  {rightsLabel(recording.rightsStatus)}
                </span>
              </div>
              <div
                className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-current/75 ${
                  isDescriptionExpanded ? '' : 'line-clamp-3'
                }`}
              >
                {recording.story}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-current/60 transition-colors hover:bg-current/5 hover:text-current"
                >
                  {isDescriptionExpanded ? '…less' : '…more'}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('upload', { songId: recording.id })}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-current/60 transition-colors hover:bg-current/5 hover:text-current"
                >
                  <PencilSquare className="h-3.5 w-3.5" />
                  Metadata
                </button>
              </div>
            </div>

            {soloists.length > 0 && (
              <div className="mt-3">
                <SoloTimeline
                  recording={recording}
                  soloists={soloists}
                  currentTime={isCurrentActive ? currentTime : 0}
                  onSeek={handleSeek}
                />
              </div>
            )}

            <div className="mt-4 border-b border-current/15">
              <div
                role="tablist"
                aria-label="Recording sections"
                className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
              >
                {WATCH_TABS.map((tab) => {
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-current text-current'
                          : 'border-transparent text-current/55 hover:text-current/85'
                      }`}
                    >
                      {tab.label}
                      {tab.id === 'history' && (
                        <span className="ml-1.5 font-mono text-[10px] text-current/45">
                          {recording.revisions.length}
                        </span>
                      )}
                      {tab.id === 'talk' && (
                        <span className="ml-1.5 font-mono text-[10px] text-current/45">
                          {recording.talkComments?.length || 0}
                        </span>
                      )}
                      {tab.id === 'personnel' && soloists.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-brand px-1.5 py-px font-mono text-[10px] text-on-orange">
                          {soloists.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-5 text-current">
              {activeTab === 'overview' && (
                <div className="space-y-7">
                  <section>
                    <SectionHeader
                      title="About this recording"
                      onEdit={() => openQuickEdit(recording.id, 'history')}
                      onAdd={() => openQuickEdit(recording.id, 'history')}
                      addLabel="Add details"
                    />
                    <div className="prose-sm space-y-3 text-sm leading-relaxed text-current/80">
                      {recording.story.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                      {[
                        { label: 'Released', value: String(recording.releaseYear ?? 'Year unknown') },
                        { label: 'Composition', value: songComposition?.title || '—' },
                        { label: 'Composer', value: recording.composer },
                        { label: 'Lyricist', value: recording.lyricist },
                        { label: 'Producer', value: recording.producer },
                        { label: 'Label', value: recording.label },
                        { label: 'Studio', value: recording.studio },
                        { label: 'Recorded', value: recording.recordingLocation },
                        { label: 'Language', value: recording.language },
                        { label: 'Genre', value: recording.genre },
                        { label: 'Country', value: `${recording.country} · ${recording.region}` },
                        { label: 'Duration', value: formatTime(recording.duration) },
                      ].map((field) => (
                        <div key={field.label}>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-current/45">
                            {field.label}
                          </dt>
                          <dd className="mt-0.5 text-current/80">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section>
                    <SectionHeader
                      title="Recording chronology"
                      onEdit={() => openQuickEdit(recording.id, 'history')}
                      onAdd={() => openQuickEdit(recording.id, 'history')}
                      addLabel="Add event"
                    />
                    <ol className="space-y-3 border-l-2 border-current/10 pl-4 text-sm text-current/75">
                      {recording.recordingHistory.map((entry, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand" />
                          {entry}
                        </li>
                      ))}
                    </ol>
                  </section>

                  {soloists.length > 0 && (
                    <section>
                      <SectionHeader
                        title="Solo credits"
                        onAdd={() => openQuickEdit(recording.id, 'musicians')}
                        addLabel="Add soloist"
                      />
                      <ol className="space-y-2">
                        {soloists.map((credit) => (
                          <li
                            key={`${credit.musicianId}-${credit.instrument}-${credit.soloOrder}`}
                            className="flex items-start gap-3 rounded-xl border border-current/10 p-3"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-[11px] font-bold text-on-orange">
                              {credit.soloOrder ?? '–'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-current">
                                {credit.musicianName}
                              </p>
                              <p className="mt-0.5 text-xs text-current/60">
                                {credit.role} · {credit.instrument}
                              </p>
                              {credit.solos && credit.solos.length > 0 && (
                                <p className="mt-1 font-mono text-[11px] text-current/45">
                                  {credit.solos
                                    .map(
                                      (s) =>
                                        `${s.label || 'Solo'} ${formatTime(s.startSec || 0)}–${formatTime(s.endSec || 0)}`
                                    )
                                    .join(' · ')}
                                </p>
                              )}
                              {credit.notes && (
                                <p className="mt-1 text-xs italic text-current/55">{credit.notes}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {recording.trivia && recording.trivia.length > 0 && (
                    <section>
                      <SectionHeader
                        title="Cultural notes"
                        onEdit={() => openQuickEdit(recording.id, 'history')}
                        onAdd={() => openQuickEdit(recording.id, 'history')}
                        addLabel="Add note"
                      />
                      <ul className="list-disc space-y-1.5 pl-5 text-sm text-current/75">
                        {recording.trivia.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {recording.alternateVersions && recording.alternateVersions.length > 0 && (
                    <section>
                      <SectionHeader
                        title="Other versions and reissues"
                        onAdd={() => openQuickEdit(recording.id, 'alternate')}
                        addLabel="Add version"
                      />
                      <ul className="space-y-2">
                        {recording.alternateVersions.map((v) => (
                          <li
                            key={v.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-current/10 p-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-current">{v.title}</p>
                              <p className="mt-0.5 truncate text-xs text-current/60">
                                {v.band} · {v.year}
                                {v.label ? ` · ${v.label}` : ''}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-current/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-current/55">
                              Documented
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {recording.disputedClaims && recording.disputedClaims.length > 0 && (
                    <section className="rounded-xl border border-brand/30 bg-brand/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-current">
                        <InfoCircle className="h-4 w-4 text-brand" />
                        Disputed claims
                      </div>
                      {recording.disputedClaims.map((claim, i) => (
                        <div key={i} className="space-y-2 text-sm">
                          <p className="font-semibold text-current">{claim.title}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-current/10 bg-paper/50 p-3 dark:bg-paper/5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-current/45">
                                Account A
                              </p>
                              <p className="mt-1 text-current/80">{claim.claimA.text}</p>
                              <p className="mt-1 text-[11px] text-current/50">{claim.claimA.source}</p>
                            </div>
                            <div className="rounded-lg border border-current/10 bg-paper/50 p-3 dark:bg-paper/5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-current/45">
                                Account B
                              </p>
                              <p className="mt-1 text-current/80">{claim.claimB.text}</p>
                              <p className="mt-1 text-[11px] text-current/50">{claim.claimB.source}</p>
                            </div>
                          </div>
                          <p className="text-xs italic text-current/60">{claim.archivistNote}</p>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'personnel' && (
                <div className="space-y-7">
                  <section>
                    <SectionHeader
                      title="Soloists"
                      onEdit={() => openQuickEdit(recording.id, 'musicians')}
                      onAdd={() => openQuickEdit(recording.id, 'musicians')}
                      addLabel="Add soloist"
                    />
                    {soloists.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-current/20 p-6 text-center">
                        <MusicNoteBeamed className="mx-auto h-6 w-6 text-current/30" />
                        <p className="mt-2 text-sm text-current/60">
                          No soloists credited yet. Heard one on this recording?
                        </p>
                        <button
                          type="button"
                          onClick={() => openQuickEdit(recording.id, 'musicians')}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-orange transition-opacity hover:opacity-90"
                        >
                          <PlusLg className="h-4 w-4" />
                          Credit a soloist
                        </button>
                      </div>
                    ) : (
                      <>
                        <SoloTimeline
                          recording={recording}
                          soloists={soloists}
                          currentTime={isCurrentActive ? currentTime : 0}
                          onSeek={(seconds) => {
                            handleSeek(seconds)
                          }}
                        />
                        <ol className="mt-4 space-y-2">
                          {soloists.map((credit) => (
                            <li
                              key={`${credit.musicianId}-${credit.instrument}-${credit.soloOrder}`}
                              className="flex flex-wrap items-center gap-3 rounded-xl border border-current/10 p-3"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-on-orange">
                                {credit.soloOrder ?? '–'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  navigateTo('musician_detail', { musicianId: credit.musicianId })
                                }
                                className="min-w-0 flex-1 text-left text-sm font-semibold text-current hover:opacity-70"
                              >
                                {credit.musicianName}
                              </button>
                              <span className="shrink-0 rounded-full bg-current/5 px-2.5 py-1 font-mono text-[11px] text-current/65">
                                {credit.instrument}
                              </span>
                              {credit.solos && credit.solos.length > 0 && (
                                <div className="flex w-full flex-wrap gap-1.5">
                                  {credit.solos.map((span, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      disabled={typeof span.startSec !== 'number'}
                                      onClick={() => handleSeek(span.startSec || 0)}
                                      className="inline-flex items-center gap-1 rounded-full border border-current/15 px-2.5 py-1 font-mono text-[11px] text-current/70 transition-colors hover:border-brand hover:text-link"
                                    >
                                      <ClockFill className="h-3 w-3" />
                                      {span.label || 'Solo'} {formatTime(span.startSec || 0)}–
                                      {formatTime(span.endSec || 0)}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {credit.notes && (
                                <p className="w-full text-xs italic text-current/55">{credit.notes}</p>
                              )}
                            </li>
                          ))}
                        </ol>
                        <p className="mt-3 text-xs text-current/50">
                          Solo credits are community-submitted and move through the same review and
                          revision history as every other edit.
                        </p>
                      </>
                    )}
                  </section>

                  <section>
                    <SectionHeader
                      title="Other musicians"
                      onEdit={() => openQuickEdit(recording.id, 'musicians')}
                      onAdd={() => openQuickEdit(recording.id, 'musicians')}
                      addLabel="Add musician"
                    />
                    {otherMusiciansByInstrument.length === 0 ? (
                      <p className="text-sm text-current/60">No other credits documented yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {otherMusiciansByInstrument.map(([instrument, members]) => (
                          <div key={instrument}>
                            <h3 className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-current/45">
                              {instrument}
                            </h3>
                            <ul className="divide-y divide-current/10 rounded-xl border border-current/10">
                              {members.map((credit, i) => (
                                <li
                                  key={`${credit.musicianId}-${i}`}
                                  className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigateTo('musician_detail', { musicianId: credit.musicianId })
                                    }
                                    className="font-semibold text-current hover:opacity-70"
                                  >
                                    {credit.musicianName}
                                  </button>
                                  <span className="text-xs text-current/55">{credit.role}</span>
                                  {credit.notes && (
                                    <span className="ml-auto text-xs italic text-current/45">
                                      {credit.notes}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'lyrics' && (
                <div className="space-y-4">
                  <SectionHeader
                    title="Lyrics and translations"
                    onEdit={() => openQuickEdit(recording.id, 'lyrics')}
                    onAdd={() => openQuickEdit(recording.id, 'lyrics')}
                    addLabel="Add language"
                  />

                  {lyricsVersions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-current/20 p-6 text-center">
                      <JournalText className="mx-auto h-6 w-6 text-current/30" />
                      <p className="mt-2 text-sm text-current/60">
                        No lyrics transcribed for {recording.title} yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => openQuickEdit(recording.id, 'lyrics')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-orange transition-opacity hover:opacity-90"
                      >
                        <PlusLg className="h-4 w-4" />
                        Transcribe lyrics
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {lyricsVersions.map((version) => (
                          <button
                            key={version.id}
                            type="button"
                            onClick={() => setActiveLyricsId(version.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                              activeLyrics?.id === version.id
                                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                                : 'bg-current/5 text-current hover:bg-current/10'
                            }`}
                          >
                            {version.isTranslation ? (
                              <Translate className="h-3.5 w-3.5" />
                            ) : (
                              <JournalText className="h-3.5 w-3.5" />
                            )}
                            {version.language}
                            {version.isOriginal && (
                              <span className="font-mono text-[10px] opacity-70">original</span>
                            )}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompareMode((v) => !v);
                            setCompareLyricsId(null);
                          }}
                          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                            isCompareMode
                              ? 'bg-brand text-on-orange'
                              : 'bg-current/5 text-current hover:bg-current/10'
                          }`}
                        >
                          <ArrowLeft className="hidden h-3.5 w-3.5 rotate-180" />
                          Compare
                        </button>
                      </div>

                      {activeLyrics && (
                        <div className="rounded-xl border border-current/10 p-4">
                          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-current/55">
                            {activeLyrics.lyricist && (
                              <span>Lyricist: {activeLyrics.lyricist}</span>
                            )}
                            {activeLyrics.transcribedBy && (
                              <span>Transcribed by: {activeLyrics.transcribedBy}</span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Link45deg className="h-3 w-3" />
                              {activeLyrics.sourceId
                                ? `Source: ${activeLyrics.sourceId}`
                                : 'No source cited'}
                            </span>
                            <button
                              type="button"
                              onClick={() => openQuickEdit(recording.id, 'lyrics')}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium hover:bg-current/5 hover:text-current"
                            >
                              <PencilSquare className="h-3 w-3" />
                              Cite or correct
                            </button>
                          </div>
                          <LyricsBlock
                            version={activeLyrics}
                            isActive={isCurrentActive}
                            currentTime={isCurrentActive ? currentTime : 0}
                            onSeek={handleSeek}
                          />
                        </div>
                      )}

                      {isCompareMode && (
                        <div className="rounded-xl border border-current/10 p-4">
                          <h3 className="mb-3 text-sm font-bold text-current">Side by side</h3>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {lyricsVersions
                              .filter((v) => v.id !== activeLyrics?.id)
                              .map((version) => (
                                <button
                                  key={version.id}
                                  type="button"
                                  onClick={() => setCompareLyricsId(version.id)}
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    compareLyrics?.id === version.id
                                      ? 'bg-brand text-on-orange'
                                      : 'bg-current/5 text-current hover:bg-current/10'
                                  }`}
                                >
                                  Compare with {version.language}
                                </button>
                              ))}
                          </div>
                          {compareLyrics ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <h4 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-current/45">
                                  {activeLyrics?.language}
                                </h4>
                                {activeLyrics && (
                                  <LyricsBlock
                                    version={activeLyrics}
                                    isActive={false}
                                    currentTime={0}
                                    onSeek={() => undefined}
                                  />
                                )}
                              </div>
                              <div className="sm:border-l sm:border-current/10 sm:pl-4">
                                <h4 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-60">
                                  {compareLyrics.language}
                                </h4>
                                <LyricsBlock
                                  version={compareLyrics}
                                  isActive={false}
                                  currentTime={0}
                                  onSeek={() => undefined}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-current/55">
                              Pick a second language to compare line by line.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'sources' && (
                <section>
                  <SectionHeader
                    title="Sources and citations"
                    onEdit={() => openQuickEdit(recording.id, 'sources')}
                    onAdd={() => openQuickEdit(recording.id, 'sources')}
                    addLabel="Add citation"
                  />
                  {recording.sources.length === 0 ? (
                    <p className="text-sm text-current/60">
                      No citations yet. Every claim on this page should trace back to a source.
                    </p>
                  ) : (
                    <ol className="space-y-3">
                      {recording.sources.map((src, i) => (
                        <li
                          key={src.id}
                          className="rounded-xl border border-current/10 p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wide text-current/45">
                              [{i + 1}] {src.type}
                            </span>
                            {src.year && (
                              <span className="font-mono text-[10px] text-current/40">{src.year}</span>
                            )}
                          </div>
                          <p className="mt-1 font-semibold text-current">{src.title}</p>
                          <p className="mt-0.5 text-xs text-current/60">
                            {[src.authorOrWitness, src.publisher, src.urlOrArchiveCode]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {src.notes && (
                            <p className="mt-1 text-xs italic text-current/50">{src.notes}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}

              {activeTab === 'history' && (
                <section>
                  <SectionHeader
                    title="Revision history"
                    onEdit={() => navigateTo('upload', { songId: recording.id })}
                    addLabel="Propose an edit"
                  />
                  <p className="mb-4 text-sm text-current/60">
                    Every change to this page — including soloist credits and lyrics — is versioned and
                    reviewable.
                  </p>
                  <ol className="space-y-3">
                    {recording.revisions.map((rev) => (
                      <li
                        key={rev.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-current/10 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-current/55">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-ink-60">
                              <ClockHistory className="h-3.5 w-3.5" />v{rev.version}.0
                            </span>
                            <span>{rev.date}</span>
                            <span className="font-semibold text-current/75">{rev.authorName}</span>
                            <span className="rounded-full bg-current/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                              {rev.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-current/75">{rev.summary}</p>
                          {rev.changes.length > 0 && (
                            <p className="mt-1 text-xs text-current/50">
                              {rev.changes.length} field{rev.changes.length === 1 ? '' : 's'} changed
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openDiffViewer(recording, rev)}
                          className="shrink-0 rounded-full bg-current/5 px-3.5 py-2 text-xs font-semibold text-current transition-colors hover:bg-current/10"
                        >
                          View changes
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {activeTab === 'talk' && (
                <section>
                  <SectionHeader
                    title="Discussion"
                    onAdd={() => setIsAddingTopic(true)}
                    addLabel="Start a discussion"
                  />

                  {isAddingTopic && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!talkTopic.trim() || !talkCommentText.trim()) return;
                        addTalkComment(recording.id, talkTopic.trim(), talkCommentText.trim());
                        setTalkTopic('');
                        setTalkCommentText('');
                        setIsAddingTopic(false);
                      }}
                      className="mb-4 space-y-3 rounded-xl border border-current/10 p-4"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-current/70">
                          Topic
                        </label>
                        <input
                          type="text"
                          value={talkTopic}
                          onChange={(e) => setTalkTopic(e.target.value)}
                          required
                          placeholder="What should archivists discuss about this recording?"
                          className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm text-current outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-current/70">
                          Comment
                        </label>
                        <textarea
                          rows={3}
                          value={talkCommentText}
                          onChange={(e) => setTalkCommentText(e.target.value)}
                          required
                          placeholder="Share evidence, sources, or corrections."
                          className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm text-current outline-none focus:border-brand"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingTopic(false)}
                          className="rounded-full px-3.5 py-2 text-sm font-semibold text-current/60 transition-colors hover:bg-current/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-orange transition-opacity hover:opacity-90"
                        >
                          Post
                        </button>
                      </div>
                    </form>
                  )}

                  {recording.talkComments && recording.talkComments.length > 0 ? (
                    <ul className="space-y-4">
                      {recording.talkComments.map((tc) => (
                        <li key={tc.id} className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold text-current/70">
                            {tc.author.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-current/60">
                              <span className="font-semibold text-current">{tc.author}</span> ·{' '}
                              {tc.date}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-current">{tc.topic}</p>
                            <p className="mt-1 text-sm leading-relaxed text-current/75">{tc.comment}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-current/60">
                      No discussion yet. Start the first thread.
                    </p>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>

        {hasRightRail && (
          <aside className="min-w-0 px-4 pb-6 sm:px-0">
            <div className="sticky top-[76px] space-y-6">
              {alternateRecordings.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-bold tracking-tight text-current">Up next</h2>
                  <div className="space-y-1">
                    {alternateRecordings.map((alt) => (
                      <CompactRecordingCard
                        key={alt.id}
                        recording={alt}
                        onSelect={() => navigateTo('song_detail', { songId: alt.id })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {moreFromArtist.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-bold tracking-tight text-current">
                    More from {recording.artistOrBand}
                  </h2>
                  <div className="space-y-1">
                    {moreFromArtist.map((alt) => (
                      <CompactRecordingCard
                        key={alt.id}
                        recording={alt}
                        onSelect={() => navigateTo('song_detail', { songId: alt.id })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {relatedByScene.length > 0 && (
                <section>
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold tracking-tight text-current">
                    <PeopleFill className="h-4 w-4 text-current/40" />
                    Related recordings
                  </h2>
                  <div className="space-y-1">
                    {relatedByScene.map((alt) => (
                      <CompactRecordingCard
                        key={alt.id}
                        recording={alt}
                        onSelect={() => navigateTo('song_detail', { songId: alt.id })}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-current/10 p-3 text-xs text-current/60">
                <h2 className="mb-1 text-sm font-bold text-current">About this archive</h2>
                <p>
                  Banjo is the free encyclopedia of African music. Every claim,
                  credit, and lyric here is community-submitted, sourced, and versioned.
                </p>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-current/5 px-3 py-1.5 font-semibold text-current transition-colors hover:bg-current/10"
                >
                  <ChatLeftText className="h-3.5 w-3.5" />
                  Report a problem
                </button>
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
