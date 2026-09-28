import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  House,
  Compass,
  Search,
  PlusLg,
  Collection,
  X,
  PencilSquare,
  CloudArrowUp,
  FileEarmarkPlus,
} from 'react-bootstrap-icons';

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    navigateTo,
    setIsCreateArticleModalOpen,
    openQuickEdit,
    currentRecording,
    selectedSongId,
    selectedMusicianId,
    selectedBandId,
    searchQuery,
    setSearchQuery,
    recordings,
    musicians,
    bands,
  } = useBanjo();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draft, setDraft] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSheetOpen && !isSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSheetOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSheetOpen, isSearchOpen]);

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const recs = recordings
      .filter((r) =>
        q.length === 0
          ? true
          : `${r.title} ${r.artistOrBand} ${r.genre} ${r.country} ${r.releaseYear}`
              .toLowerCase()
              .includes(q)
      )
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        title: r.title,
        meta: `${r.artistOrBand} · ${r.releaseYear}`,
        seconds: r.duration,
        isRecording: true,
      }));

    if (q.length === 0) return recs;

    const pages = [
      ...musicians.map((m) => ({ id: m.id, title: m.name, meta: m.role, seconds: 0, isRecording: false })),
      ...bands.map((b) => ({ id: b.id, title: b.name, meta: b.genre, seconds: 0, isRecording: false })),
    ]
      .filter((p) => `${p.title} ${p.meta}`.toLowerCase().includes(q))
      .slice(0, 4);

    return [...recs, ...pages];
  }, [draft, recordings, musicians, bands]);

  const handleAddDetail = () => {
    setIsSheetOpen(false);
    const targetId =
      activeTab === 'song_detail'
        ? selectedSongId || currentRecording?.id || 'rec-001'
        : activeTab === 'musician_detail'
          ? selectedMusicianId || 'mus-peter-ochieng'
          : activeTab === 'band_detail'
            ? selectedBandId || 'band-victoria-stars'
            : currentRecording?.id || 'rec-001';
    openQuickEdit(targetId, 'musicians');
  };

  const tabButton = (
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    isActive: boolean,
    onClick: () => void
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
        isActive ? 'text-ink' : 'text-ink-60'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium tracking-tight">{label}</span>
    </button>
  );

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-12 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {tabButton('Home', House, activeTab === 'home', () => navigateTo('home'))}
        {tabButton('Explore', Compass, activeTab === 'explore', () => navigateTo('explore'))}

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-ink-60 transition-colors"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-tight">Search</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          aria-label="Contribute"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-ink-60 transition-opacity hover:opacity-80"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-on-orange">
            <PlusLg className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Add</span>
        </button>

        {tabButton('Library', Collection, activeTab === 'profile', () => navigateTo('profile'))}
      </nav>

      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper sm:hidden">
          <div className="flex h-14 items-center gap-2 border-b border-ink-12 px-2">
            <Search className="ml-1 h-5 w-5 shrink-0 text-ink-60" />
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search Banjo"
              aria-label="Search Banjo"
              className="h-10 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-60"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery(draft);
                setIsSearchOpen(false);
                navigateTo('search');
              }}
              className="shrink-0 rounded-full bg-ink-06 px-3 py-1.5 text-xs font-semibold text-ink"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              aria-label="Close search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 pb-24">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-ink-60">
              {draft.trim() ? 'Results' : 'Recent recordings'}
            </p>
            {suggestions.length === 0 ? (
              <p className="px-1 text-sm text-ink-60">No matches for “{draft}”.</p>
            ) : (
              <ul className="space-y-1">
                {suggestions.map((s) => (
                  <li key={`${s.isRecording ? 'rec' : 'page'}-${s.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(draft);
                        setIsSearchOpen(false);
                        if (s.isRecording) {
                          navigateTo('song_detail', { songId: s.id });
                        } else {
                          navigateTo('search');
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ink-06"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-06 text-ink-60">
                        <Search className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {s.title}
                        </span>
                        <span className="block truncate text-xs text-ink-60">{s.meta}</span>
                      </span>
                      {s.isRecording && (
                        <span className="shrink-0 font-mono text-[11px] text-ink-60">
                          {formatDuration(s.seconds)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/50 sm:hidden">
          <button
            type="button"
            aria-label="Close contribution sheet"
            onClick={() => setIsSheetOpen(false)}
            className="flex-1"
          />
          <div className="rounded-t-2xl border-t border-ink-12 bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-12" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Contribute to Banjo</h2>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-2 pb-2">
              <li>
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="flex w-full items-center gap-3 rounded-xl bg-brand/10 p-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-on-orange">
                    <PencilSquare className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">Add details</span>
                    <span className="block text-xs text-ink-60">
                      Credit a soloist, transcribe lyrics, or cite a source on this page
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setIsSheetOpen(false);
                    navigateTo('upload');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-ink-06 p-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-paper">
                    <CloudArrowUp className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      Upload a recording
                    </span>
                    <span className="block text-xs text-ink-60">
                      Submit a digitized tape, record, or oral interview
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setIsSheetOpen(false);
                    setIsCreateArticleModalOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-ink-06 p-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-paper">
                    <FileEarmarkPlus className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">Create a page</span>
                    <span className="block text-xs text-ink-60">
                      Start a new musician, band, or recording page
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
