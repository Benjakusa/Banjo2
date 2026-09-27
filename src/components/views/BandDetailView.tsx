import React from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  ArrowLeft,
  Users,
  Play,
  Calendar,
  MapPin,
  Disc,
  Clock,
  Edit3,
} from 'lucide-react';

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
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </button>

        <button
          onClick={() => openQuickEdit(band.id, 'band_member')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Band Article & Lineup</span>
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 leading-tight">
          {band.name}
        </h1>
        <p className="text-sm font-medium text-amber-800 mt-1">
          {band.genre} ensemble from {band.country} ({band.region})
        </p>
      </div>

      {/* Wikipedia Infobox */}
      <aside className="border border-stone-300 rounded-xl bg-stone-50 p-4 space-y-3 sm:float-right sm:w-68 sm:ml-6 sm:mb-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <span className="font-serif font-bold text-stone-900">{band.name}</span>
          <button
            onClick={() => openQuickEdit(band.id, 'band_member')}
            className="text-[10px] text-blue-700 hover:underline cursor-pointer"
          >
            [edit info]
          </button>
        </div>

        <div className="aspect-video sm:aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-200">
          <img
            src={band.photoUrl}
            alt={band.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>

        <dl className="divide-y divide-stone-200/60 text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Formed</dt>
            <dd className="font-mono text-stone-900 font-semibold">{band.formationYear}</dd>
          </div>
          {band.disbandYear && (
            <div className="py-1.5 flex justify-between">
              <dt className="text-stone-500">Disbanded</dt>
              <dd className="font-mono text-stone-900">{band.disbandYear}</dd>
            </div>
          )}
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Origin</dt>
            <dd className="text-stone-900 text-right">{band.region}, {band.country}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Genre</dt>
            <dd className="text-stone-900">{band.genre}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Key Members</dt>
            <dd className="text-stone-900 text-right font-medium">
              {band.membersTimeline.slice(0, 3).map((m) => m.musicianName).join(', ')}
            </dd>
          </div>
        </dl>
      </aside>

      {/* History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
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
            className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Add History / Lineup</span>
          </button>
        </div>

        <div className="prose max-w-none text-sm text-stone-800 leading-relaxed space-y-4">
          {band.history.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Historical Membership Timeline (Section 16: 1971-1975 John - Guitar, 1975-1982 Peter - Guitar) */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
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
            className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Add Band Member</span>
          </button>
        </div>

        <div className="space-y-2">
          {band.membersTimeline.map((mem, idx) => (
            <div
              key={idx}
              onClick={() => navigateTo('musician_detail', { musicianId: mem.musicianId })}
              className="p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-600 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-amber-800 w-24">
                  {mem.period}
                </span>
                <span className="font-serif text-sm font-semibold text-stone-900 hover:text-amber-800">
                  {mem.musicianName}
                </span>
                {mem.isFounder && (
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Founder
                  </span>
                )}
              </div>
              <span className="font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                {mem.instrument}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Discography */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
            <span>Discography</span>
            <span className="text-xs text-stone-500 font-mono">({bandRecordings.length} songs)</span>
          </h2>
        </div>

        <div className="space-y-2">
          {bandRecordings.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-600 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={rec.coverImage}
                  alt={rec.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3
                    onClick={() => navigateTo('song_detail', { songId: rec.id })}
                    className="font-serif text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate"
                  >
                    {rec.title}
                  </h3>
                  <p className="text-stone-500 text-[11px]">
                    Released: {rec.releaseYear} · Studio: {rec.studio}
                  </p>
                </div>
              </div>

              <button
                onClick={() => playSong(rec)}
                className="p-2 rounded-full bg-amber-700 text-white hover:bg-amber-800 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
