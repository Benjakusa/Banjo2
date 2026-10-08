import React, { useState, useMemo } from 'react';
import { MusicBrainzImport } from '../common/MusicBrainzImport';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  Search as SearchIcon,
  Funnel,
  PlayFill,
  Vinyl,
  People,
  Person,
  Book,
  CalendarEvent,
  GeoAlt,
  MusicNoteBeamed,
  XLg,
  PlusCircle
} from 'react-bootstrap-icons';

export const SearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    recordings,
    musicians,
    bands,
    songs,
    albums,
    oralHistories,
    playSong,
    navigateTo,
    openQuickEdit,
    isAuthenticated,
    importMusicBrainzArtist,
  } = useBanjo();

  const [activeCategory, setActiveCategory] = useState<
    'all' | 'songs' | 'artists' | 'bands' | 'musicians' | 'albums' | 'history'
  >('all');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('');
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');

  const countryOptions = Array.from(new Set([
    ...recordings.map((recording) => recording.country),
    ...musicians.map((musician) => musician.country),
    ...bands.map((band) => band.country),
  ].map((value) => value.trim()).filter(Boolean))).sort();
  const genreOptions = Array.from(new Set([
    ...recordings.map((recording) => recording.genre),
    ...bands.map((band) => band.genre),
  ].map((value) => value.trim()).filter(Boolean))).sort();
  const languageOptions = Array.from(new Set(recordings.map((recording) => recording.language.trim()).filter(Boolean))).sort();
  const instrumentOptions = Array.from(new Set([
    ...recordings.flatMap((recording) => recording.instruments),
    ...musicians.flatMap((musician) => musician.instruments),
  ].map((value) => value.trim()).filter(Boolean))).sort();

  const queryClean = searchQuery.toLowerCase().trim();

  const filteredRecordings = useMemo(() => {
    return recordings.filter((r) => {
      const matchBasic =
        !queryClean ||
        r.title.toLowerCase().includes(queryClean) ||
        r.artistOrBand.toLowerCase().includes(queryClean) ||
        r.composer.toLowerCase().includes(queryClean) ||
        r.studio.toLowerCase().includes(queryClean) ||
        r.country.toLowerCase().includes(queryClean) ||
        r.genre.toLowerCase().includes(queryClean) ||
        r.language.toLowerCase().includes(queryClean) ||
        r.recordingLocation.toLowerCase().includes(queryClean) ||
        r.story.toLowerCase().includes(queryClean) ||
        r.musicians.some((m) => m.musicianName.toLowerCase().includes(queryClean)) ||
        r.instruments.some((inst) => inst.toLowerCase().includes(queryClean));

      const matchCountry = !countryFilter || r.country.toLowerCase().includes(countryFilter.toLowerCase());
      const matchGenre = !genreFilter || r.genre.toLowerCase().includes(genreFilter.toLowerCase());
      const matchLang = !languageFilter || r.language.toLowerCase().includes(languageFilter.toLowerCase());
      const matchInst = !instrumentFilter || r.instruments.some((i) => i.toLowerCase().includes(instrumentFilter.toLowerCase()));
      const matchStartYear = !startYear || (typeof r.releaseYear === 'number' && r.releaseYear >= parseInt(startYear, 10));
      const matchEndYear = !endYear || (typeof r.releaseYear === 'number' && r.releaseYear <= parseInt(endYear, 10));

      return matchBasic && matchCountry && matchGenre && matchLang && matchInst && matchStartYear && matchEndYear;
    });
  }, [recordings, queryClean, countryFilter, genreFilter, languageFilter, instrumentFilter, startYear, endYear]);

  const filteredMusicians = useMemo(() => {
    return musicians.filter((m) => {
      const matchBasic =
        !queryClean ||
        m.name.toLowerCase().includes(queryClean) ||
        m.aliases.some((alias) => alias.toLowerCase().includes(queryClean)) ||
        m.instruments.some((inst) => inst.toLowerCase().includes(queryClean)) ||
        m.role.toLowerCase().includes(queryClean) ||
        m.country.toLowerCase().includes(queryClean) ||
        m.biography.toLowerCase().includes(queryClean);

      const matchCountry = !countryFilter || m.country.toLowerCase().includes(countryFilter.toLowerCase());
      const matchInst = !instrumentFilter || m.instruments.some((i) => i.toLowerCase().includes(instrumentFilter.toLowerCase()));

      return matchBasic && matchCountry && matchInst;
    });
  }, [musicians, queryClean, countryFilter, instrumentFilter]);

  const filteredBands = useMemo(() => {
    return bands.filter((b) => {
      const matchBasic =
        !queryClean ||
        b.name.toLowerCase().includes(queryClean) ||
        b.overview.toLowerCase().includes(queryClean) ||
        b.history.toLowerCase().includes(queryClean) ||
        b.country.toLowerCase().includes(queryClean) ||
        b.membersTimeline.some((mem) => mem.musicianName.toLowerCase().includes(queryClean));

      const matchCountry = !countryFilter || b.country.toLowerCase().includes(countryFilter.toLowerCase());
      const matchGenre = !genreFilter || b.genre.toLowerCase().includes(genreFilter.toLowerCase());

      return matchBasic && matchCountry && matchGenre;
    });
  }, [bands, queryClean, countryFilter, genreFilter]);

  const filteredOralHistories = useMemo(() => {
    return oralHistories.filter((h) => {
      return (
        !queryClean ||
        h.title.toLowerCase().includes(queryClean) ||
        h.interviewee.toLowerCase().includes(queryClean) ||
        h.summary.toLowerCase().includes(queryClean) ||
        h.transcriptEn.toLowerCase().includes(queryClean) ||
        h.transcriptSw.toLowerCase().includes(queryClean)
      );
    });
  }, [oralHistories, queryClean]);

  const totalResultsCount =
    filteredRecordings.length +
    filteredMusicians.length +
    filteredBands.length +
    filteredOralHistories.length;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      {/* Search Header */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">
          Banjo Search
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink">
          Search the African Music Knowledge Base
        </h1>

        {/* Input Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search (e.g. Ochieng, Franco, Benga, Nyatiti, Polygram, 1978)..."
              className="w-full rounded-xl border border-ink-12 bg-paper pl-10 pr-10 py-2.5 text-sm text-ink placeholder-ink-60 focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 focus:ring-1 focus:ring-2 focus:ring-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-ink-60 hover:text-ink-60 cursor-pointer"
              >
                <XLg className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
              showAdvanced || countryFilter || genreFilter || languageFilter
                ? 'border-ink bg-ink text-paper'
                : 'border-ink-12 bg-paper text-ink-60 hover:bg-ink-06'
            }`}
          >
            <Funnel className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="p-4 rounded-xl border border-ink-12 bg-ink-06 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-ink-60 font-medium mb-1">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 bg-paper p-2 text-xs text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                >
                  <option value="">All Countries</option>
                  {countryOptions.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Genre</label>
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 bg-paper p-2 text-xs text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                >
                  <option value="">All Genres</option>
                  {genreOptions.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Language</label>
                <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} className="w-full rounded-lg border border-ink-12 bg-paper p-2 text-xs text-ink">
                  <option value="">All Languages</option>
                  {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Instrument</label>
                <select value={instrumentFilter} onChange={(event) => setInstrumentFilter(event.target.value)} className="w-full rounded-lg border border-ink-12 bg-paper p-2 text-xs text-ink">
                  <option value="">All Instruments</option>
                  {instrumentOptions.map((instrument) => <option key={instrument} value={instrument}>{instrument}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">From Year</label>
                <input
                  type="number"
                  placeholder="e.g. 1970"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 bg-paper p-2 text-xs text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">To Year</label>
                <input
                  type="number"
                  placeholder="e.g. 1985"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 bg-paper p-2 text-xs text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && <MusicBrainzImport musicians={musicians} bands={bands} onImport={importMusicBrainzArtist} />}

        {/* Banjo Categorized Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
          {[
            { key: 'all', label: `All (${totalResultsCount})` },
            { key: 'songs', label: `Songs (${filteredRecordings.length})` },
            { key: 'musicians', label: `Musicians (${filteredMusicians.length})` },
            { key: 'bands', label: `Bands (${filteredBands.length})` },
            { key: 'history', label: `Oral Histories (${filteredOralHistories.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeCategory === tab.key
                  ? 'bg-brand text-on-orange font-bold'
                  : 'text-ink-60 hover:text-ink hover:bg-ink-06'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {totalResultsCount === 0 && (
          <div className="p-8 text-center border border-dashed border-ink-12 rounded-2xl bg-paper space-y-3">
            <h3 className="font-serif text-lg text-ink-60">
              The page "{searchQuery}" does not exist in the encyclopedia yet.
            </h3>
            <p className="text-xs text-ink-60 max-w-sm mx-auto">
              You can create this article now and add verifiable details about this recording, artist, or music tradition.
            </p>
            <button
              onClick={() => navigateTo('upload')}
              className="px-4 py-2 rounded-lg bg-brand text-on-orange text-xs font-semibold hover:bg-brand cursor-pointer"
            >
              Create New Article
            </button>
          </div>
        )}

        {/* Songs */}
        {(activeCategory === 'all' || activeCategory === 'songs') && filteredRecordings.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-bold block">
              Song Articles ({filteredRecordings.length})
            </span>
            <div className="space-y-2">
              {filteredRecordings.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-ink-12 bg-paper hover:border-brand hover: transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={rec.coverImage}
                      alt={rec.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded object-cover border border-ink-12 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3
                        onClick={() => navigateTo('song_detail', { songId: rec.id })}
                        className="font-serif text-sm font-semibold text-link hover:underline cursor-pointer truncate"
                      >
                        {rec.title}
                      </h3>
                      <p className="text-ink-60">
                        {rec.artistOrBand} · {rec.releaseYear ?? 'Year unknown'} · {rec.country} ({rec.genre})
                      </p>
                      <p className="text-ink-60 text-[11px] line-clamp-1 mt-0.5">
                        {rec.story}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openQuickEdit(rec.id, 'musicians')}
                      className="text-ink-60 hover:text-link text-[11px] px-2 py-1 hover:bg-ink-06 rounded cursor-pointer"
                    >
                      [edit]
                    </button>
                    <button
                      onClick={() => playSong(rec)}
                      className="p-1.5 rounded-full bg-brand text-on-orange hover:bg-brand cursor-pointer"
                    >
                      <PlayFill className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Musicians */}
        {(activeCategory === 'all' || activeCategory === 'musicians') && filteredMusicians.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-bold block">
              Musician Biographies ({filteredMusicians.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredMusicians.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigateTo('musician_detail', { musicianId: m.id })}
                  className="p-3 rounded-xl border border-ink-12 bg-paper hover:border-brand hover: transition-all cursor-pointer flex items-center gap-3 text-xs"
                >
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-ink-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif text-sm font-semibold text-link hover:underline">
                      {m.name}
                    </h4>
                    <p className="text-ink-60 font-medium">{m.role}</p>
                    <span className="text-[10px] text-ink-60">{m.country} · {m.activeYears}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bands */}
        {(activeCategory === 'all' || activeCategory === 'bands') && filteredBands.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-bold block">
              Bands & Orchestras ({filteredBands.length})
            </span>
            <div className="space-y-2">
              {filteredBands.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigateTo('band_detail', { bandId: b.id })}
                  className="p-3.5 rounded-xl border border-ink-12 bg-paper hover:border-brand hover: transition-all cursor-pointer text-xs space-y-1"
                >
                  <div className="flex justify-between">
                    <h3 className="font-serif text-sm font-semibold text-link hover:underline">
                      {b.name}
                    </h3>
                    <span className="font-mono text-ink-60">{b.country} · Formed {b.formationYear}</span>
                  </div>
                  <p className="text-ink-60 line-clamp-2">{b.overview}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
