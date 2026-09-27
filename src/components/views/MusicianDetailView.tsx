import React from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  ArrowLeft,
  Play,
  Disc,
  Users,
  Calendar,
  MapPin,
  Edit3,
  Plus,
} from 'lucide-react';

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
          onClick={() => openQuickEdit(musician.id, 'bio')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Biography & Instruments</span>
        </button>
      </div>

      {/* Disambiguation note */}
      <div className="text-[11px] text-stone-500 italic border-l-2 border-amber-600 pl-3 py-0.5">
        This article is about the African recording artist and instrumentalist. For band affiliations, see{' '}
        <span className="text-blue-700 hover:underline cursor-pointer">{musician.bands[0]?.name}</span>.
      </div>

      {/* Title & Role */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 leading-tight">
          {musician.name}
        </h1>
        {musician.nativeSpelling && musician.nativeSpelling !== musician.name && (
          <p className="text-xs font-mono text-stone-500 mt-0.5">
            Luo / Native name: <em>{musician.nativeSpelling}</em>
          </p>
        )}
        <p className="text-sm font-medium text-amber-800 mt-1">
          {musician.role} · {musician.country}
        </p>
      </div>

      {/* Wikipedia Infobox */}
      <aside className="border border-stone-300 rounded-xl bg-stone-50 p-4 space-y-3 sm:float-right sm:w-64 sm:ml-6 sm:mb-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <span className="font-serif font-bold text-stone-900">{musician.name}</span>
          <button
            onClick={() => openQuickEdit(musician.id, 'bio')}
            className="text-[10px] text-blue-700 hover:underline cursor-pointer"
          >
            [edit info]
          </button>
        </div>

        <div className="aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-200">
          <img
            src={musician.photoUrl}
            alt={musician.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>

        <dl className="divide-y divide-stone-200/60 text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Born</dt>
            <dd className="font-mono text-stone-900">{musician.birthYear} ({musician.region})</dd>
          </div>
          {musician.deathYear && (
            <div className="py-1.5 flex justify-between">
              <dt className="text-stone-500">Died</dt>
              <dd className="font-mono text-stone-900">{musician.deathYear}</dd>
            </div>
          )}
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Active Years</dt>
            <dd className="font-mono text-stone-900">{musician.activeYears}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Instruments</dt>
            <dd className="text-stone-900 text-right">{musician.instruments.join(', ')}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-stone-500">Associated acts</dt>
            <dd className="text-stone-900 text-right">
              {musician.bands.map((b) => b.name).join(', ')}
            </dd>
          </div>
        </dl>
      </aside>

      {/* Biography Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
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
            className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Detail / Instrument</span>
          </button>
        </div>

        <div className="prose max-w-none text-sm text-stone-800 leading-relaxed space-y-4">
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
        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
            <span>Recorded Discography</span>
            <span className="text-xs text-stone-500 font-mono">({participatedRecordings.length} entries)</span>
          </h2>
        </div>

        <div className="space-y-2">
          {participatedRecordings.map((rec) => {
            const credit = rec.musicians.find((m) => m.musicianId === musician.id);
            return (
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
                      {rec.releaseYear} · Credit: <strong className="text-stone-700">{credit?.role} ({credit?.instrument})</strong>
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
            );
          })}
        </div>
      </section>

      {/* Oral History Link */}
      {relatedOralHistories.length > 0 && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
            <h2 className="text-xl font-serif font-medium text-stone-900">
              Archival Interviews
            </h2>
          </div>
          <div className="p-4 rounded-xl border border-stone-200 bg-amber-50/50 space-y-1.5 text-xs">
            {relatedOralHistories.map((oral) => (
              <div
                key={oral.id}
                onClick={() => navigateTo('oral_histories', { oralHistoryId: oral.id })}
                className="cursor-pointer hover:underline"
              >
                <h4 className="font-serif text-sm font-semibold text-stone-900">
                  {oral.title} ({oral.date})
                </h4>
                <p className="text-stone-600 line-clamp-1">{oral.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* References */}
      <section className="space-y-2 pt-4 border-t border-stone-200 text-xs">
        <h3 className="font-serif font-bold text-stone-900">References</h3>
        <ol className="list-decimal list-inside space-y-1 text-stone-600">
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
