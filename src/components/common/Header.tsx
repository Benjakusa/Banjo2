import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
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
      <header className="sticky top-0 z-40 w-full border-b border-[var(--banjo-line)] bg-[var(--banjo-bg)]/90 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-2 sm:gap-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex shrink-0 items-center gap-1.5"
            aria-label="Banjo home"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--banjo-primary)] font-serif text-sm font-bold text-white">
              &#9834;
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-[var(--banjo-text)] sm:inline">Banjo</span>
          </button>

          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open navigation"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-chip)] min-[640px]:flex"
          >
            <List className="h-5 w-5" />
          </button>

          <div className="relative hidden min-w-0 flex-1 justify-center md:flex">
            <form onSubmit={handleSubmit} className="w-full max-w-[640px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--banjo-muted)]" />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 150)}
                placeholder="Search songs, guitarists, bands, studios, years"
                aria-label="Search Banjo"
                className="h-10 w-full rounded-full border border-[var(--banjo-line)] bg-[var(--banjo-surface)] pl-11 pr-24 text-sm text-[var(--banjo-text)] outline-none transition-colors placeholder:text-[var(--banjo-muted)] focus:border-[var(--banjo-link)]"
              />
              <div className="absolute right-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  aria-label="Search by voice"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--banjo-muted)] transition-colors hover:bg-[var(--banjo-hover)] hover:text-[var(--banjo-text)]"
                >
                  <MicFill className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  className="flex h-8 items-center gap-1 rounded-full bg-[var(--banjo-chip)] px-3 text-xs font-semibold text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-hover)]"
                >
                  Search
                </button>
              </div>
            </form>

            {showDesktopSuggestions && (
              <ul className="absolute left-1/2 top-12 z-50 w-full max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--banjo-line)] bg-[var(--banjo-bg)] py-1 shadow-xl">
                {suggestions.length === 0 && (
                  <li className="px-4 py-3 text-sm text-[var(--banjo-muted)]">No matches for “{draft}”</li>
                )}
                {suggestions.map((s) => (
                  <li key={`${s.kind}-${s.id}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(s.id)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-[var(--banjo-chip)]"
                    >
                      <Search className="h-4 w-4 shrink-0 text-[var(--banjo-muted)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[var(--banjo-text)]">{s.title}</span>
                        <span className="block truncate text-xs text-[var(--banjo-muted)]">{s.meta}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--banjo-muted)]">
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
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-chip)] md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleAddDetailsClick}
              className="flex items-center gap-1.5 rounded-full bg-[var(--banjo-primary)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <PlusLg className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              type="button"
              aria-label="Notifications"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-chip)] sm:flex"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--banjo-chip)] sm:h-9 sm:w-9"
              >
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[var(--banjo-text)]">
                    {(userProfile.displayName || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-[var(--banjo-line)] bg-[var(--banjo-bg)] shadow-xl"
                >
                  <div className="border-b border-[var(--banjo-line)] px-4 py-3">
                    <p className="truncate text-sm font-semibold text-[var(--banjo-text)]">
                      {userProfile.displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--banjo-muted)]">
                      {userProfile.contributionsCount} contributions
                    </p>
                  </div>

                  <div className="border-b border-[var(--banjo-line)] px-4 py-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--banjo-muted)]">
                      <Gear className="h-3.5 w-3.5" />
                      Settings
                    </p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-chip)]"
                      >
                        <span className="flex items-center gap-2">
                          {theme === 'dark' ? (
                            <MoonStars className="h-4 w-4" />
                          ) : (
                            <Sun className="h-4 w-4" />
                          )}
                          Appearance
                        </span>
                        <span className="font-mono text-[11px] text-[var(--banjo-muted)]">{theme}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataSaver(!isDataSaver)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-chip)]"
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
                            isDataSaver ? 'text-[var(--banjo-primary)]' : 'text-[var(--banjo-muted)]'
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
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[var(--banjo-text)] transition-colors hover:bg-[var(--banjo-chip)]"
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--banjo-bg)] md:hidden">
          <div className="flex h-14 items-center gap-2 border-b border-[var(--banjo-line)] px-2">
            <Search className="ml-1 h-5 w-5 shrink-0 text-[var(--banjo-muted)]" />
            <form onSubmit={handleSubmit} className="min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search Banjo"
                aria-label="Search Banjo"
                className="h-10 w-full bg-transparent text-base text-[var(--banjo-text)] outline-none placeholder:text-[var(--banjo-muted)]"
              />
            </form>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setDraft('');
              }}
              aria-label="Close search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--banjo-text)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-[var(--banjo-muted)]">
              {draft.trim() ? 'Results' : 'Recent'}
            </p>
            <ul className="space-y-1">
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--banjo-chip)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--banjo-chip)] text-[var(--banjo-muted)]">
                      <Search className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--banjo-text)]">{s.title}</span>
                      <span className="block truncate text-xs text-[var(--banjo-muted)]">{s.meta}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[var(--banjo-muted)]">
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
