import React from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  ArrowLeft,
  PlayFill,
  Vinyl,
  People,
  CalendarEvent,
  GeoAlt,
  PencilSquare,
  PlusLg
} from 'react-bootstrap-icons';

export const MusicianDetailView: React.FC = () => {
  const {
    selectedMusicianId,
    musicians,
    recordings,
    oralHistories,
    playSong,
    navigateTo,
    goBack,
    canGoBack,
    openQuickEdit,
  } = useBanjo();

  const musician =
    musicians.find((m) => m.id === selectedMusicianId) || musicians[0];

  const participatedRecordings = recordings.filter((r) =>
    r.musicians.some((m) => m.musicianId === musician.id)
  );

  const relatedOralHistories = oralHistories.filter(
    (h) =>
      h.interviewee.toLowerCase().includes(musician.name.toLowerCase()) ||
      h.keyEntities.musicians.some((mName) =>
        mName.toLowerCase().includes(musician.name.toLowerCase())
      )
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
          onClick={() => openQuickEdit(musician.id, 'bio')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
        >
          <PencilSquare className="w-3.5 h-3.5" />
          <span>Edit Biography & Instruments</span>
        </button>
      </div>

      {/* Disambiguation note */}
      <div className="text-[11px] text-black/50 italic border-l-2 border-orange-600 pl-3 py-0.5">
        This article is about the African recording artist and instrumentalist. For band affiliations, see{' '}
        <span className="text-blue-700 hover:underline cursor-pointer">{musician.bands[0]?.name}</span>.
      </div>

      {/* Title & Role */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-black leading-tight">
          {musician.name}
        </h1>
        {musician.nativeSpelling && musician.nativeSpelling !== musician.name && (
          <p className="text-xs font-mono text-black/50 mt-0.5">
            Luo / Native name: <em>{musician.nativeSpelling}</em>
          </p>
        )}
        <p className="text-sm font-medium text-orange-700 mt-1">
          {musician.role} · {musician.country}
        </p>
      </div>

      {/* Wikipedia Infobox */}
      <aside className="border border-black/20 rounded-xl bg-black/5 p-4 space-y-3 sm:float-right sm:w-64 sm:ml-6 sm:mb-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <span className="font-serif font-bold text-black">{musician.name}</span>
          <button
            onClick={() => openQuickEdit(musician.id, 'bio')}
            className="text-[10px] text-blue-700 hover:underline cursor-pointer"
          >
            [edit info]
          </button>
        </div>

        <div className="aspect-square rounded-lg overflow-hidden border border-black/10 bg-black/10">
          <img
            src={musician.photoUrl}
            alt={musician.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>

        <dl className="divide-y divide-black/10 text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Born</dt>
            <dd className="font-mono text-black">{musician.birthYear} ({musician.region})</dd>
          </div>
          {musician.deathYear && (
            <div className="py-1.5 flex justify-between">
              <dt className="text-black/50">Died</dt>
              <dd className="font-mono text-black">{musician.deathYear}</dd>
            </div>
          )}
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Active Years</dt>
            <dd className="font-mono text-black">{musician.activeYears}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Instruments</dt>
            <dd className="text-black text-right">{musician.instruments.join(', ')}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-black/50">Associated acts</dt>
            <dd className="text-black text-right">
              {musician.bands.map((b) => b.name).join(', ')}
            </dd>
          </div>
        </dl>
      </aside>

      {/* Biography Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-black flex items-center gap-2">
            <span>Biography</span>
            <button
              onClick={() => openQuickEdit(musician.id, 'bio')}
              className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
            >
              [edit]
            </button>
          </h2>
          <button
            onClick={() => openQuickEdit(musician.id, 'bio')}
            className="text-xs text-orange-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <PlusLg className="w-3.5 h-3.5" />
            <span>Add Detail / Instrument</span>
          </button>
        </div>

        <div className="prose max-w-none text-sm text-black/80 leading-relaxed space-y-4">
          {musician.biography.split('\n\n').map((p, i) => (
            <p key={i}>
              {p}
              <sup className="text-blue-700 font-mono text-[11px] font-bold cursor-pointer hover:underline ml-0.5">
                [{i + 1}]
              </sup>
            </p>
          ))}
        </div>
      </section>

      {/* Discography & Participated Recordings */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-black flex items-center gap-2">
            <span>Recorded Discography</span>
            <span className="text-xs text-black/50 font-mono">({participatedRecordings.length} entries)</span>
          </h2>
        </div>

        <div className="space-y-2">
          {participatedRecordings.map((rec) => {
            const credit = rec.musicians.find((m) => m.musicianId === musician.id);
            return (
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
                      {rec.releaseYear} · Credit: <strong className="text-black/70">{credit?.role} ({credit?.instrument})</strong>
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
            );
          })}
        </div>
      </section>

      {/* Oral History Link */}
      {relatedOralHistories.length > 0 && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
            <h2 className="text-xl font-serif font-medium text-black">
              Archival Interviews
            </h2>
          </div>
          <div className="p-4 rounded-xl border border-black/10 bg-orange-50/50 space-y-1.5 text-xs">
            {relatedOralHistories.map((oral) => (
              <div
                key={oral.id}
                onClick={() => navigateTo('oral_histories', { oralHistoryId: oral.id })}
                className="cursor-pointer hover:underline"
              >
                <h4 className="font-serif text-sm font-semibold text-black">
                  {oral.title} ({oral.date})
                </h4>
                <p className="text-black/60 line-clamp-1">{oral.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* References */}
      <section className="space-y-2 pt-4 border-t border-black/10 text-xs">
        <h3 className="font-serif font-bold text-black">References</h3>
        <ol className="list-decimal list-inside space-y-1 text-black/60">
          {musician.sources.map((src) => (
            <li key={src.id}>
              {src.title} ({src.year}) · <em>{src.notes}</em>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
