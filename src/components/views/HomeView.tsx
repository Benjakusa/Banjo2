import React from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  Play,
  Search,
  Book,
  ArrowRight,
  Vinyl,
  ClockHistory,
  MicFill,
  FileEarmarkText,
  ShieldCheck,
  Globe2,
  PencilSquare,
  PlusCircle,
  QuestionCircle,
  Stars
} from 'react-bootstrap-icons';

export const HomeView: React.FC = () => {
  const {
    recordings,
    musicians,
    bands,
    oralHistories,
    documents,
    playSong,
    playOralHistory,
    navigateTo,
    setSearchQuery,
    openDiffViewer,
    openQuickEdit,
  } = useBanjo();

  const featuredRecording = recordings[0]; // Kano Ni Nyasaye
  const recentlyUpdatedRecording = recordings.find((r) => r.revisions.length > 0) || recordings[0];

  const handleQuickSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;
    if (query) {
      setSearchQuery(query);
      navigateTo('search');
    }
  };

  const countries = [
    { name: 'Kenya', genre: 'Benga · Twist', count: '1,420 articles' },
    { name: 'DR Congo', genre: 'Rhumba · Soukous', count: '3,890 articles' },
    { name: 'Nigeria', genre: 'Afrobeat · Highlife', count: '2,650 articles' },
    { name: 'Tanzania', genre: 'Zilipendwa · Taarab', count: '890 articles' },
    { name: 'Ghana', genre: 'Highlife · Palm-wine', count: '1,120 articles' },
    { name: 'Zimbabwe', genre: 'Chimurenga · Jit', count: '670 articles' },
  ];

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Banjo Welcome Header Banner */}
      <section className="border-b border-black/10 bg-white py-6 sm:py-8 shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-orange-600 text-white font-serif font-bold text-[10px]">&#9834;</span>
                <span className="text-xs uppercase tracking-widest font-mono text-black/50 font-semibold">
                  the free encyclopedia of African music
                </span>
              </div>
              <span className="text-xs font-mono text-black bg-black/5 border border-black/20 px-2 py-0.5 rounded">
                Open to Community Edits
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-medium text-black leading-tight">
              Welcome to Banjo, the free encyclopedia and archive of African music heritage that anyone can edit.
            </h1>

            <p className="text-xs sm:text-sm text-black/60 leading-relaxed">
              Documenting <strong>{recordings.length + 184} recordings</strong>, <strong>{musicians.length + 80} musician rosters</strong>, studio session logs, and verified primary sources from across Africa.
            </p>

            {/* Fast Mobile Search Input */}
            <form onSubmit={handleQuickSearch} className="relative pt-2">
              <Search className="absolute left-3.5 top-5 w-4 h-4 text-black/40" />
              <input
                type="text"
                name="query"
                placeholder="Search songs, guitarists, bands, composers, studios, years..."
                className="w-full rounded-xl border border-black/20 bg-black/5 pl-10 pr-24 py-3 text-xs sm:text-sm text-black placeholder-black/40 focus:bg-white focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-3.5 bottom-1.5 px-4 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Quick Explore Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-black/40 font-mono text-[11px]">Popular:</span>
              {['Victoria Stars', 'Benga', 'Franco Luambo', 'Tony Allen', '1970s Nairobi'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    navigateTo('search');
                  }}
                  className="px-2.5 py-1 rounded-md bg-black/5 hover:bg-black/10 text-black/70 border border-black/10 text-[11px] transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Feed: Mobile-First Container */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
        {/* 2. Today's Featured Article */}
        <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Stars className="w-4 h-4 text-orange-600" />
              <span className="text-xs uppercase tracking-widest font-mono text-orange-700 font-semibold">
                Today's Featured Recording
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openQuickEdit(featuredRecording.id, 'history')}
                className="text-xs text-orange-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <PencilSquare className="w-3.5 h-3.5" />
                <span>[edit article]</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            <div className="sm:col-span-4 flex flex-col items-center">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-black/10 bg-black/5">
                <img
                  src={featuredRecording.coverImage}
                  alt={featuredRecording.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => playSong(featuredRecording)}
                  className="absolute inset-0 bg-black/30 hover:bg-black/10 flex items-center justify-center transition-colors group cursor-pointer"
                  aria-label="Play featured track"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-600 group-hover:scale-105 text-white flex items-center justify-center shadow-lg transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </button>
              </div>
              <p className="text-[11px] text-black/50 text-center mt-2 font-serif italic">
                Fig 1. Original 1978 7-inch release (Polydor AS 1042)
              </p>
            </div>

            <div className="sm:col-span-8 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-black/50 font-mono">
                <span>{featuredRecording.country}</span>
                <span>·</span>
                <span>{featuredRecording.releaseYear}</span>
                <span>·</span>
                <span className="text-orange-700 font-medium">{featuredRecording.genre}</span>
              </div>

              <h2
                onClick={() => navigateTo('song_detail', { songId: featuredRecording.id })}
                className="text-xl sm:text-2xl font-serif font-medium text-black hover:text-orange-700 transition-colors cursor-pointer"
              >
                {featuredRecording.title}
              </h2>

              <p className="text-xs text-orange-700 font-medium">
                By {featuredRecording.artistOrBand} · Composed by {featuredRecording.composer}
              </p>

              <p className="text-xs sm:text-sm text-black/70 leading-relaxed line-clamp-4">
                {featuredRecording.story}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10 text-xs">
                <button
                  onClick={() => playSong(featuredRecording)}
                  className="flex items-center gap-1.5 font-semibold text-orange-700 hover:text-orange-800 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Listen to Recording</span>
                </button>

                <button
                  onClick={() => navigateTo('song_detail', { songId: featuredRecording.id })}
                  className="text-black/60 hover:text-black font-medium cursor-pointer"
                >
                  Read Full Article & Citations <ArrowRight className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Did You Know & Historical Anecdotes */}
        <section className="rounded-2xl border border-black/10 bg-orange-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
            <span className="text-xs uppercase tracking-widest font-mono text-orange-800 font-semibold flex items-center gap-1.5">
              <QuestionCircle className="w-3.5 h-3.5 text-orange-600" />
              Did You Know...
            </span>
            <button
              onClick={() => navigateTo('upload')}
              className="text-[11px] font-medium text-orange-700 hover:underline cursor-pointer"
            >
              + Submit a Fact
            </button>
          </div>

          <ul className="text-xs text-black/70 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              ...that early Kenyan <strong>Benga guitarists</strong> tuned the first two strings of electric guitars higher to replicate the exact open-plucking timbre of the ancient 8-stringed Luo <em>nyatiti</em>?
            </li>
            <li>
              ...that Congolese ensemble <strong>Super Mazembe</strong> migrated through Tanzania in 1974 and sold over 100,000 copies of "Pole Musa" at Nairobi's Garden Square club?
            </li>
            <li>
              ...that Grand Maître <strong>Franco Luambo Makiadi</strong> recorded more than 1,000 compositions across four decades with Orchestre T.P. OK Jazz?
            </li>
          </ul>
        </section>

        {/* 4. Browse by Tradition & Country (Screen 3 & 12) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <h2 className="text-lg font-serif font-medium text-black">
              Browse by African Music Tradition
            </h2>
            <button
              onClick={() => navigateTo('explore')}
              className="text-xs text-orange-600 hover:underline cursor-pointer font-medium"
            >
              All Regions <ArrowRight className="w-3 h-3 inline" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {countries.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setSearchQuery(c.name);
                  navigateTo('explore');
                }}
                className="p-3.5 rounded-xl border border-black/10 bg-white hover:border-orange-600 hover:shadow-xs text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-semibold text-black group-hover:text-orange-700">
                    {c.name}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-black/50 mt-0.5">{c.genre}</p>
                <span className="text-[10px] font-mono text-black/40 block mt-2">
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 5. Recently Documented Recordings (Banjo Entries Feed) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <div>
              <h2 className="text-lg font-serif font-medium text-black">
                Recently Documented Entries
              </h2>
              <p className="text-xs text-black/50">Every recording can have new details added by readers</p>
            </div>
            <button
              onClick={() => navigateTo('upload')}
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          </div>

          <div className="space-y-3">
            {recordings.map((rec) => (
              <article
                key={rec.id}
                className="rounded-xl border border-black/10 bg-white p-4 shadow-xs hover:border-black/20 transition-all flex flex-col sm:flex-row gap-4 justify-between"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <img
                    src={rec.coverImage}
                    alt={rec.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover border border-black/10 shrink-0 bg-black/5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-black/50 font-mono">
                      <span>{rec.country}</span>
                      <span>·</span>
                      <span>{rec.releaseYear}</span>
                      <span>·</span>
                      <span className="text-orange-700">{rec.genre}</span>
                      <span>·</span>
                      <span className="text-black font-semibold">{rec.verificationStatus.replace('_', ' ')}</span>
                    </div>

                    <h3
                      onClick={() => navigateTo('song_detail', { songId: rec.id })}
                      className="text-base font-serif font-medium text-black hover:text-orange-700 transition-colors cursor-pointer truncate"
                    >
                      {rec.title}
                    </h3>

                    <p className="text-xs text-black/60">
                      {rec.artistOrBand} · Composer: {rec.composer}
                    </p>

                    <p className="text-xs text-black/50 line-clamp-2 leading-relaxed pt-1">
                      {rec.story}
                    </p>
                  </div>
                </div>

                {/* Quick Actions Column */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10 text-xs shrink-0">
                  <button
                    onClick={() => playSong(rec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 font-semibold cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Audio</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openQuickEdit(rec.id, 'musicians')}
                      className="text-orange-600 hover:underline font-medium cursor-pointer"
                    >
                      [+ musician]
                    </button>
                    <button
                      onClick={() => navigateTo('song_detail', { songId: rec.id })}
                      className="text-black/60 hover:text-black cursor-pointer"
                    >
                      Article <ArrowRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Traceable History & Recent Revisions (Banjo Style) */}
        <section className="rounded-2xl border border-black/10 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <div>
              <span className="text-xs uppercase tracking-widest font-mono text-orange-700 font-semibold">
                Revision History
              </span>
              <h2 className="text-base font-serif font-medium text-black">
                Recent Community Edits & Diff Logs
              </h2>
            </div>
            <span className="text-xs font-mono text-black/40">All edits traceable</span>
          </div>

          <div className="divide-y divide-black/10 text-xs">
            {recentlyUpdatedRecording.revisions.map((rev) => (
              <div key={rev.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-orange-700 font-bold">v{rev.version}.0</span>
                    <span className="text-black font-medium">{recentlyUpdatedRecording.title}</span>
                    <span className="text-black/40">({rev.date})</span>
                  </div>
                  <p className="text-black/60 mt-0.5">{rev.summary}</p>
                </div>
                <button
                  onClick={() => openDiffViewer(recentlyUpdatedRecording, rev)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded border border-black/10 hover:border-orange-600 text-black/70 hover:text-orange-700 cursor-pointer"
                >
                  View Diff
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
