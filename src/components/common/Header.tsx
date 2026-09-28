import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { Wordmark } from './Wordmark';
import {
  Search,
  MicFill,
  PlusLg,
  List,
  Bell,
  Gear,
  WifiOff,
  Wifi,
  MoonStars,
  Sun,
  X,
  Clock,
} from 'react-bootstrap-icons';

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

export const Header: React.FC<{ onOpenNav?: () => void }> = ({ onOpenNav }) => {
  const {
    activeTab,
    navigateTo,
    isDataSaver,
    setDataSaver,
    theme,
    toggleTheme,
    userProfile,
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [draft, setDraft] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isProfileOpen]);

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (q.length === 0) {
      return recordings.slice(0, 4).map((r) => ({ id: r.id, title: r.title, meta: r.artistOrBand, kind: 'Recording' as const, seconds: r.duration }));
    }
    const matches = recordings
      .filter((r) => `${r.title} ${r.artistOrBand} ${r.genre} ${r.country} ${r.releaseYear}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((r) => ({ id: r.id, title: r.title, meta: r.artistOrBand, kind: 'Recording' as const, seconds: r.duration }));
    const people = [
      ...musicians.map((m) => ({ id: m.id, name: m.name, role: m.role })),
      ...bands.map((b) => ({ id: b.id, name: b.name, role: b.genre })),
    ]
      .filter((p) => `${p.name} ${p.role}`.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({ id: p.id, title: p.name, meta: p.role, kind: 'Archivist page' as const, seconds: 0 }));
    return [...matches, ...people];
  }, [draft, recordings, musicians, bands]);

  const handleAddDetailsClick = () => {
    if (activeTab === 'song_detail') {
      openQuickEdit(selectedSongId || currentRecording?.id || 'rec-001', 'musicians');
    } else if (activeTab === 'musician_detail') {
      openQuickEdit(selectedMusicianId || 'mus-peter-ochieng', 'bio');
    } else if (activeTab === 'band_detail') {
      openQuickEdit(selectedBandId || 'band-victoria-stars', 'band_member');
    } else {
      setIsCreateArticleModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(draft);
    setIsSearchOpen(false);
    navigateTo('search');
  };

  const handleSelectSuggestion = (id: string) => {
    setSearchQuery(draft);
    setIsSearchOpen(false);
    navigateTo('search');
    if (recordings.some((r) => r.id === id)) {
      navigateTo('song_detail', { songId: id });
    }
  };

  const showDesktopSuggestions = isSearchFocused && draft.trim().length > 0;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-ink-12 bg-paper/90 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-2 sm:gap-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex shrink-0 items-center gap-1.5"
            aria-label="Banjo home"
          >
            <Wordmark className="text-[22px] leading-none" />
          </button>

          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open navigation"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06 min-[640px]:flex"
          >
            <List className="h-5 w-5" />
          </button>

          <div className="relative hidden min-w-0 flex-1 justify-center md:flex">
            <form onSubmit={handleSubmit} className="w-full max-w-[640px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-60" />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 150)}
                placeholder="Search songs, guitarists, bands, studios, years"
                aria-label="Search Banjo"
                className="h-10 w-full rounded-full border border-ink-12 bg-ink-06 pl-11 pr-32 text-sm text-ink outline-none transition-colors placeholder:text-ink-60 focus:border-link"
              />
              <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Search by voice"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-60 transition-colors hover:bg-ink-12 hover:text-ink"
                >
                  <MicFill className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-ink-12 bg-paper px-3.5 text-xs font-semibold text-ink transition-colors hover:bg-ink-06"
                >
                  Search
                </button>
              </div>
            </form>

            {showDesktopSuggestions && (
              <ul className="absolute left-1/2 top-12 z-50 w-full max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border border-ink-12 bg-paper py-1">
                {suggestions.length === 0 && (
                  <li className="px-4 py-3 text-sm text-ink-60">No matches for “{draft}”</li>
                )}
                {suggestions.map((s) => (
                  <li key={`${s.kind}-${s.id}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(s.id)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-ink-06"
                    >
                      <Search className="h-4 w-4 shrink-0 text-ink-60" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{s.title}</span>
                        <span className="block truncate text-xs text-ink-60">{s.meta}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-60">
                        {s.kind === 'Recording' ? formatDuration(s.seconds) : s.kind}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06 md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleAddDetailsClick}
              className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-on-orange transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <PlusLg className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              type="button"
              aria-label="Notifications"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink-06 sm:flex"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-ink-06 sm:h-9 sm:w-9"
              >
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-ink">
                    {(userProfile.displayName || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-ink-12 bg-paper"
                >
                  <div className="border-b border-ink-12 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      {userProfile.displayName}
                    </p>
                    <p className="truncate text-xs text-ink-60">
                      {userProfile.contributionsCount} contributions
                    </p>
                  </div>

                  <div className="border-b border-ink-12 px-4 py-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-60">
                      <Gear className="h-3.5 w-3.5" />
                      Settings
                    </p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-ink transition-colors hover:bg-ink-06"
                      >
                        <span className="flex items-center gap-2">
                          {theme === 'dark' ? (
                            <MoonStars className="h-4 w-4" />
                          ) : (
                            <Sun className="h-4 w-4" />
                          )}
                          Appearance
                        </span>
                        <span className="font-mono text-[11px] text-ink-60">{theme}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataSaver(!isDataSaver)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-ink transition-colors hover:bg-ink-06"
                      >
                        <span className="flex items-center gap-2">
                          {isDataSaver ? (
                            <WifiOff className="h-4 w-4" />
                          ) : (
                            <Wifi className="h-4 w-4" />
                          )}
                          Data Saver
                        </span>
                        <span
                          className={`font-mono text-[11px] ${
                            isDataSaver ? 'text-brand' : 'text-ink-60'
                          }`}
                        >
                          {isDataSaver ? 'on' : 'off'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigateTo('profile');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-ink-06"
                  >
                    <Clock className="h-4 w-4" />
                    Your contributions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper md:hidden">
          <div className="flex h-14 items-center gap-2 border-b border-ink-12 px-2">
            <Search className="ml-1 h-5 w-5 shrink-0 text-ink-60" />
            <form onSubmit={handleSubmit} className="min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search Banjo"
                aria-label="Search Banjo"
                className="h-10 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-60"
              />
            </form>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setDraft('');
              }}
              aria-label="Close search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-ink-60">
              {draft.trim() ? 'Results' : 'Recent'}
            </p>
            <ul className="space-y-1">
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ink-06"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-06 text-ink-60">
                      <Search className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{s.title}</span>
                      <span className="block truncate text-xs text-ink-60">{s.meta}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-ink-60">
                      {s.kind === 'Recording' ? formatDuration(s.seconds) : s.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
