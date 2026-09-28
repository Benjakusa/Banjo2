import React from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  ArrowLeft,
  People,
  PlayFill,
  CalendarEvent,
  GeoAlt,
  Vinyl,
  ClockHistory,
  PencilSquare
} from 'react-bootstrap-icons';

export const BandDetailView: React.FC = () => {
  const {
    selectedBandId,
    bands,
    recordings,
    albums,
    documents,
    playSong,
    navigateTo,
    goBack,
    canGoBack,
    openQuickEdit,
  } = useBanjo();

  const band = bands.find((b) => b.id === selectedBandId) || bands[0];

  const bandRecordings = recordings.filter(
    (r) => r.bandId === band.id || r.artistOrBand.toLowerCase().includes(band.name.toLowerCase())
  );

  const bandAlbums = albums.filter((a) =>
    a.artistOrBand.toLowerCase().includes(band.name.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      {/* Top back & edit */}
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="flex items-center gap-1.5 text-xs text-black/60 hover:text-black disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </button>

        <button
          onClick={() => openQuickEdit(band.id, 'band_member')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
        >
          <PencilSquare className="w-3.5 h-3.5" />
          <span>Edit Band Article & Lineup</span>
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-black leading-tight">
          {band.name}
        </h1>
        <p className="text-sm font-medium text-orange-700 mt-1">
          {band.genre} ensemble from {band.country} ({band.region})
        </p>
      </div>

      {/* Banjo Infobox */}
      <aside className="border border-black/20 rounded-xl bg-black/5 p-4 space-y-3 sm:float-right sm:w-68 sm:ml-6 sm:mb-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <span className="font-serif font-bold text-black">{band.name}</span>
          <button
            onClick={() => openQuickEdit(band.id, 'band_member')}
            className="text-[10px] text-blue-700 hover:underline cursor-pointer"
          >
            [edit info]
          </button>
        </div>

        <div className="aspect-video sm:aspect-square rounded-lg overflow-hidden border border-black/10 bg-black/10">
          <img
            src={band.photoUrl}
            alt={band.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>

        <dl className="divide-y divide-black/10 text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Formed</dt>
            <dd className="font-mono text-black font-semibold">{band.formationYear}</dd>
          </div>
          {band.disbandYear && (
            <div className="py-1.5 flex justify-between">
              <dt className="text-black/50">Disbanded</dt>
              <dd className="font-mono text-black">{band.disbandYear}</dd>
            </div>
          )}
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Origin</dt>
            <dd className="text-black text-right">{band.region}, {band.country}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Genre</dt>
            <dd className="text-black">{band.genre}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Key Members</dt>
            <dd className="text-black text-right font-medium">
              {band.membersTimeline.slice(0, 3).map((m) => m.musicianName).join(', ')}
            </dd>
          </div>
        </dl>
      </aside>

      {/* History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-black flex items-center gap-2">
            <span>Band History & Origins</span>
            <button
              onClick={() => openQuickEdit(band.id, 'band_member')}
              className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
            >
              [edit]
            </button>
          </h2>
          <button
            onClick={() => openQuickEdit(band.id, 'band_member')}
            className="text-xs text-orange-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <PencilSquare className="w-3.5 h-3.5" />
            <span>Add History / Lineup</span>
          </button>
        </div>

        <div className="prose max-w-none text-sm text-black/80 leading-relaxed space-y-4">
          {band.history.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Historical Membership Timeline (Section 16: 1971-1975 John - Guitar, 1975-1982 Peter - Guitar) */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-black flex items-center gap-2">
            <span>Membership Timeline</span>
            <button
              onClick={() => openQuickEdit(band.id, 'band_member')}
              className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
            >
              [edit lineup]
            </button>
          </h2>
          <button
            onClick={() => openQuickEdit(band.id, 'band_member')}
            className="text-xs text-orange-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <PencilSquare className="w-3.5 h-3.5" />
            <span>Add Band Member</span>
          </button>
        </div>

        <div className="space-y-2">
          {band.membersTimeline.map((mem, idx) => (
            <div
              key={idx}
              onClick={() => navigateTo('musician_detail', { musicianId: mem.musicianId })}
              className="p-3 rounded-xl border border-black/10 bg-white hover:border-orange-600 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-orange-700 w-24">
                  {mem.period}
                </span>
                <span className="font-serif text-sm font-semibold text-black hover:text-orange-700">
                  {mem.musicianName}
                </span>
                {mem.isFounder && (
                  <span className="text-[10px] font-mono text-black bg-black/5 border border-black/20 px-1.5 py-0.5 rounded">
                    Founder
                  </span>
                )}
              </div>
              <span className="font-mono text-black/60 bg-black/5 px-2 py-0.5 rounded border border-black/10">
                {mem.instrument}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Discography */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-black flex items-center gap-2">
            <span>Discography</span>
            <span className="text-xs text-black/50 font-mono">({bandRecordings.length} songs)</span>
          </h2>
        </div>

        <div className="space-y-2">
          {bandRecordings.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl border border-black/10 bg-white hover:border-orange-600 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={rec.coverImage}
                  alt={rec.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded object-cover border border-black/10 shrink-0"
                />
                <div className="min-w-0">
                  <h3
                    onClick={() => navigateTo('song_detail', { songId: rec.id })}
                    className="font-serif text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate"
                  >
                    {rec.title}
                  </h3>
                  <p className="text-black/50 text-[11px]">
                    Released: {rec.releaseYear} · Studio: {rec.studio}
                  </p>
                </div>
              </div>

              <button
                onClick={() => playSong(rec)}
                className="p-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 cursor-pointer shrink-0"
              >
                <PlayFill className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
