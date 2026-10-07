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
  const { musicians, selectedMusicianId, isCatalogueLoading } = useBanjo();
  const musician = musicians.find((entry) => entry.id === selectedMusicianId) || musicians[0];
  if (!musician) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-ink-60">{isCatalogueLoading ? 'Loading archive…' : 'No musician profiles are available yet.'}</div>;
  }
  return <MusicianDetailContent />;
};

const MusicianDetailContent: React.FC = () => {
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
      <div className="flex items-center justify-between border-b border-ink-12 pb-3">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="flex items-center gap-1.5 text-xs text-ink-60 hover:text-ink disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </button>

        <button
          onClick={() => openQuickEdit(musician.id, 'bio')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-orange bg-brand hover:bg-brand rounded-lg transition-colors cursor-pointer"
        >
          <PencilSquare className="w-3.5 h-3.5" />
          <span>Edit Biography & Instruments</span>
        </button>
      </div>

      {/* Disambiguation note */}
      <div className="text-[11px] text-ink-60 italic border-l-2 border-brand pl-3 py-0.5">
        This article is about the African recording artist and instrumentalist. For band affiliations, see{' '}
        <span className="text-link hover:underline cursor-pointer">{musician.bands[0]?.name}</span>.
      </div>

      {/* Title & Role */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-ink leading-tight">
          {musician.name}
        </h1>
        {musician.nativeSpelling && musician.nativeSpelling !== musician.name && (
          <p className="text-xs font-mono text-ink-60 mt-0.5">
            Luo / Native name: <em>{musician.nativeSpelling}</em>
          </p>
        )}
        <p className="text-sm font-medium text-ink-60 mt-1">
          {musician.role} · {musician.country}
        </p>
      </div>

      {/* Banjo Infobox */}
      <aside className="border border-ink-12 rounded-xl bg-ink-06 p-4 space-y-3 sm:float-right sm:w-64 sm:ml-6 sm:mb-4 text-xs">
        <div className="flex items-center justify-between border-b border-ink-12 pb-1.5">
          <span className="font-serif font-bold text-ink">{musician.name}</span>
          <button
            onClick={() => openQuickEdit(musician.id, 'bio')}
            className="text-[10px] text-link hover:underline cursor-pointer"
          >
            [edit info]
          </button>
        </div>

        <div className="aspect-square rounded-lg overflow-hidden border border-ink-12 bg-ink-06">
          <img
            src={musician.photoUrl}
            alt={musician.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>

        <dl className="divide-y divide-ink-12 text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-ink-60">Born</dt>
            <dd className="font-mono text-ink">{musician.birthYear} ({musician.region})</dd>
          </div>
          {musician.deathYear && (
            <div className="py-1.5 flex justify-between">
              <dt className="text-ink-60">Died</dt>
              <dd className="font-mono text-ink">{musician.deathYear}</dd>
            </div>
          )}
          <div className="py-1.5 flex justify-between">
            <dt className="text-ink-60">Active Years</dt>
            <dd className="font-mono text-ink">{musician.activeYears}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-ink-60">Instruments</dt>
            <dd className="text-ink text-right">{musician.instruments.join(', ')}</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-ink-60">Associated acts</dt>
            <dd className="text-ink text-right">
              {musician.bands.map((b) => b.name).join(', ')}
            </dd>
          </div>
        </dl>
      </aside>

      {/* Biography Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-ink-12 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-ink flex items-center gap-2">
            <span>Biography</span>
            <button
              onClick={() => openQuickEdit(musician.id, 'bio')}
              className="text-xs font-mono text-link font-normal hover:underline cursor-pointer"
            >
              [edit]
            </button>
          </h2>
          <button
            onClick={() => openQuickEdit(musician.id, 'bio')}
            className="text-xs text-ink-60 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <PlusLg className="w-3.5 h-3.5" />
            <span>Add Detail / Instrument</span>
          </button>
        </div>

        <div className="prose max-w-none text-sm text-ink-60 leading-relaxed space-y-4">
          {musician.biography.split('\n\n').map((p, i) => (
            <p key={i}>
              {p}
              <sup className="text-link font-mono text-[11px] font-bold cursor-pointer hover:underline ml-0.5">
                [{i + 1}]
              </sup>
            </p>
          ))}
        </div>
      </section>

      {/* Discography & Participated Recordings */}
      <section className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-ink-12 pb-1.5">
          <h2 className="text-xl font-serif font-medium text-ink flex items-center gap-2">
            <span>Recorded Discography</span>
            <span className="text-xs text-ink-60 font-mono">({participatedRecordings.length} entries)</span>
          </h2>
        </div>

        <div className="space-y-2">
          {participatedRecordings.map((rec) => {
            const credit = rec.musicians.find((m) => m.musicianId === musician.id);
            return (
              <div
                key={rec.id}
                className="p-3 rounded-xl border border-ink-12 bg-paper hover:border-brand hover: transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={rec.coverImage}
                    alt={rec.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded object-cover border border-ink-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3
                      onClick={() => navigateTo('song_detail', { songId: rec.id })}
                      className="font-serif text-sm font-semibold text-link hover:underline cursor-pointer truncate"
                    >
                      {rec.title}
                    </h3>
                    <p className="text-ink-60 text-[11px]">
                      {rec.releaseYear} · Credit: <strong className="text-ink-60">{credit?.role} ({credit?.instrument})</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => playSong(rec)}
                  className="p-2 rounded-full bg-brand text-on-orange hover:bg-brand cursor-pointer shrink-0"
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
          <div className="flex items-center justify-between border-b border-ink-12 pb-1.5">
            <h2 className="text-xl font-serif font-medium text-ink">
              Archival Interviews
            </h2>
          </div>
          <div className="p-4 rounded-xl border border-ink-12 bg-brand/10 space-y-1.5 text-xs">
            {relatedOralHistories.map((oral) => (
              <div
                key={oral.id}
                onClick={() => navigateTo('oral_histories', { oralHistoryId: oral.id })}
                className="cursor-pointer hover:underline"
              >
                <h4 className="font-serif text-sm font-semibold text-ink">
                  {oral.title} ({oral.date})
                </h4>
                <p className="text-ink-60 line-clamp-1">{oral.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* References */}
      <section className="space-y-2 pt-4 border-t border-ink-12 text-xs">
        <h3 className="font-serif font-bold text-ink">References</h3>
        <ol className="list-decimal list-inside space-y-1 text-ink-60">
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
