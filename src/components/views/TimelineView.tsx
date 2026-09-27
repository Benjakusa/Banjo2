import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { INITIAL_TIMELINE } from '../../data/mockArchiveData';
import { TimelineEvent } from '../../types';
import {
  Calendar,
  Disc,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Play,
} from 'lucide-react';

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
        <span className="text-xs uppercase tracking-widest font-mono text-amber-800 font-semibold">
          Historical Chronology
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 mt-0.5">
          African Music History Timeline (1950–2000s)
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Chronological record of band formations, landmark recording sessions, album releases, and musical migrations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-stone-200 pb-2 text-xs font-mono">
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
                ? 'bg-amber-700 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline items */}
      <div className="relative pl-6 space-y-6 border-l-2 border-stone-200">
        {filteredEvents.map((ev, idx) => {
          const matchedRec = recordings.find((r) => r.id === ev.relatedRecordingId);

          return (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-amber-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-700" />
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 space-y-2 shadow-xs hover:border-amber-600 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-lg font-bold text-amber-800">
                    {ev.year}
                  </span>
                  <span className="text-stone-500 font-mono text-[11px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {ev.country}
                  </span>
                </div>

                <h3 className="font-serif text-base font-semibold text-stone-900">
                  {ev.title}
                </h3>

                <p className="text-xs text-stone-700 leading-relaxed">
                  {ev.description}
                </p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {ev.relatedBandId && (
                      <button
                        onClick={() => navigateTo('band_detail', { bandId: ev.relatedBandId })}
                        className="text-blue-700 hover:underline cursor-pointer"
                      >
                        Band Article →
                      </button>
                    )}
                    {ev.relatedMusicianId && (
                      <button
                        onClick={() => navigateTo('musician_detail', { musicianId: ev.relatedMusicianId })}
                        className="text-blue-700 hover:underline cursor-pointer"
                      >
                        Musician Bio →
                      </button>
                    )}
                  </div>

                  {matchedRec && (
                    <button
                      onClick={() => playSong(matchedRec)}
                      className="flex items-center gap-1 text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
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
