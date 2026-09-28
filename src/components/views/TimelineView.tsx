import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import { INITIAL_TIMELINE } from '../../data/mockArchiveData';
import { TimelineEvent } from '../../types';
import {
  Calendar,
  Vinyl,
  People,
  GeoAlt,
  ClockHistory,
  ArrowRight,
  PlayFill
} from 'react-bootstrap-icons';

export const TimelineView: React.FC = () => {
  const { navigateTo, recordings, playSong } = useBanjo();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const events: TimelineEvent[] = INITIAL_TIMELINE;

  const filteredEvents = events.filter((ev) => {
    if (selectedFilter === 'all') return true;
    return ev.category === selectedFilter;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">
          Historical Chronology
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">
          African Music History Timeline (1950–2000s)
        </h1>
        <p className="text-xs text-ink-60 mt-1">
          Chronological record of band formations, landmark recording sessions, album releases, and musical migrations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
        {[
          { key: 'all', label: 'All Milestones' },
          { key: 'band_formed', label: 'Band Formations' },
          { key: 'album_released', label: 'Master Recordings' },
          { key: 'lineup_change', label: 'Lineup Changes' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setSelectedFilter(btn.key)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedFilter === btn.key
                ? 'bg-brand text-on-orange font-bold'
                : 'text-ink-60 hover:text-ink hover:bg-ink-06'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline items */}
      <div className="relative pl-6 space-y-6 border-l-2 border-ink-12">
        {filteredEvents.map((ev, idx) => {
          const matchedRec = recordings.find((r) => r.id === ev.relatedRecordingId);

          return (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-paper border-2 border-brand flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
              </div>

              <div className="rounded-2xl border border-ink-12 bg-paper p-4 sm:p-5 space-y-2 hover:border-brand transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-lg font-bold text-ink-60">
                    {ev.year}
                  </span>
                  <span className="text-ink-60 font-mono text-[11px] flex items-center gap-1">
                    <GeoAlt className="w-3.5 h-3.5 text-ink-60" />
                    {ev.country}
                  </span>
                </div>

                <h3 className="font-serif text-base font-semibold text-ink">
                  {ev.title}
                </h3>

                <p className="text-xs text-ink-60 leading-relaxed">
                  {ev.description}
                </p>

                <div className="pt-2 border-t border-ink-12 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {ev.relatedBandId && (
                      <button
                        onClick={() => navigateTo('band_detail', { bandId: ev.relatedBandId })}
                        className="text-link hover:underline cursor-pointer"
                      >
                        Band Article <ArrowRight className="w-3 h-3 inline" />
                      </button>
                    )}
                    {ev.relatedMusicianId && (
                      <button
                        onClick={() => navigateTo('musician_detail', { musicianId: ev.relatedMusicianId })}
                        className="text-link hover:underline cursor-pointer"
                      >
                        Musician Bio <ArrowRight className="w-3 h-3 inline" />
                      </button>
                    )}
                  </div>

                  {matchedRec && (
                    <button
                      onClick={() => playSong(matchedRec)}
                      className="flex items-center gap-1 text-ink-60 hover:text-link font-semibold cursor-pointer"
                    >
                      <PlayFill className="w-3.5 h-3.5 fill-current" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
