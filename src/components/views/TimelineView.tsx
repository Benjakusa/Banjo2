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
        <span className="text-xs uppercase tracking-widest font-mono text-orange-700 font-semibold">
          Historical Chronology
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-black mt-0.5">
          African Music History Timeline (1950–2000s)
        </h1>
        <p className="text-xs text-black/60 mt-1">
          Chronological record of band formations, landmark recording sessions, album releases, and musical migrations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-black/10 pb-2 text-xs font-mono">
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
                ? 'bg-orange-600 text-white font-bold shadow-xs'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline items */}
      <div className="relative pl-6 space-y-6 border-l-2 border-black/10">
        {filteredEvents.map((ev, idx) => {
          const matchedRec = recordings.find((r) => r.id === ev.relatedRecordingId);

          return (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-orange-600 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 space-y-2 shadow-xs hover:border-orange-600 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-lg font-bold text-orange-700">
                    {ev.year}
                  </span>
                  <span className="text-black/50 font-mono text-[11px] flex items-center gap-1">
                    <GeoAlt className="w-3.5 h-3.5 text-black/40" />
                    {ev.country}
                  </span>
                </div>

                <h3 className="font-serif text-base font-semibold text-black">
                  {ev.title}
                </h3>

                <p className="text-xs text-black/70 leading-relaxed">
                  {ev.description}
                </p>

                <div className="pt-2 border-t border-black/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {ev.relatedBandId && (
                      <button
                        onClick={() => navigateTo('band_detail', { bandId: ev.relatedBandId })}
                        className="text-blue-700 hover:underline cursor-pointer"
                      >
                        Band Article <ArrowRight className="w-3 h-3 inline" />
                      </button>
                    )}
                    {ev.relatedMusicianId && (
                      <button
                        onClick={() => navigateTo('musician_detail', { musicianId: ev.relatedMusicianId })}
                        className="text-blue-700 hover:underline cursor-pointer"
                      >
                        Musician Bio <ArrowRight className="w-3 h-3 inline" />
                      </button>
                    )}
                  </div>

                  {matchedRec && (
                    <button
                      onClick={() => playSong(matchedRec)}
                      className="flex items-center gap-1 text-orange-700 hover:text-orange-800 font-semibold cursor-pointer"
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
