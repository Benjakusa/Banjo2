import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { CalendarEvent, GeoAlt, MusicNoteBeamed, PlayFill } from 'react-bootstrap-icons';

type ExploreTab = 'country' | 'decade' | 'genre' | 'instruments';

export const ExploreView: React.FC = () => {
  const { recordings, playSong } = useBanjo();
  const [activeTab, setActiveTab] = useState<ExploreTab>('country');
  const [selectedCountry, setSelectedCountry] = useState('');

  const countries = Array.from(new Set(recordings.map((recording) => recording.country.trim()).filter(Boolean))).sort();
  const currentCountry = countries.includes(selectedCountry) ? selectedCountry : countries[0] || '';
  const countryRecordings = recordings.filter((recording) => recording.country.trim() === currentCountry);
  const decades = Array.from(recordings.reduce((groups, recording) => {
    const decade = Math.floor(recording.releaseYear / 10) * 10;
    const entries = groups.get(decade) || [];
    entries.push(recording);
    groups.set(decade, entries);
    return groups;
  }, new Map<number, typeof recordings>()).entries()).sort(([first], [second]) => first - second);
  const genres = Array.from(recordings.reduce((groups, recording) => {
    const genre = recording.genre.trim();
    if (genre) groups.set(genre, (groups.get(genre) || 0) + 1);
    return groups;
  }, new Map<string, number>()).entries()).sort(([first], [second]) => first.localeCompare(second));
  const instruments = Array.from(new Set(recordings.flatMap((recording) => recording.instruments).map((instrument) => instrument.trim()).filter(Boolean))).sort();
  const tabs: { key: ExploreTab; label: string }[] = [
    { key: 'country', label: 'BY COUNTRY' },
    { key: 'decade', label: 'BY DECADE' },
    { key: 'genre', label: 'BY GENRE' },
    { key: 'instruments', label: 'BY INSTRUMENTS' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">Banjo Atlas</span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">Geographic & Genre Exploration</h1>
        <p className="text-xs text-ink-60 mt-1">Explore countries, decades, genres, and instruments represented in published archive recordings.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === tab.key ? 'bg-brand text-on-orange font-bold' : 'text-ink-60 hover:text-ink hover:bg-ink-06'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'country' && (countries.length ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-1.5">
            {countries.map((country) => (
              <button key={country} onClick={() => setSelectedCountry(country)} className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${currentCountry === country ? 'border-ink bg-ink text-paper font-bold' : 'border-ink-12 bg-paper text-ink-60 hover:bg-ink-06'}`}>
                {country}
              </button>
            ))}
          </div>
          <section className="rounded-2xl border border-ink-12 bg-paper p-5 space-y-4">
            <h2 className="font-serif text-xl font-medium"><GeoAlt className="inline mr-2" />{currentCountry}</h2>
            <p className="text-xs text-ink-60">{countryRecordings.length} recording{countryRecordings.length === 1 ? '' : 's'} in this country.</p>
            {countryRecordings.map((recording) => (
              <article key={recording.id} className="flex items-center justify-between gap-3 border-t border-ink-12 pt-3 text-xs">
                <div>
                  <h3 className="font-semibold text-ink">{recording.title}</h3>
                  <p className="text-ink-60">{recording.artistOrBand} · {recording.releaseYear} · {recording.genre}</p>
                </div>
                <button aria-label={`Play ${recording.title}`} onClick={() => playSong(recording)} className="p-2 rounded-full bg-brand text-on-orange cursor-pointer"><PlayFill /></button>
              </article>
            ))}
          </section>
        </div>
      ) : <EmptyExplore />)}

      {activeTab === 'decade' && (decades.length ? (
        <div className="space-y-3">
          {decades.map(([decade, entries]) => (
            <section key={decade} className="p-4 rounded-xl border border-ink-12 bg-paper space-y-2 text-xs">
              <h2 className="font-mono text-ink-60 font-bold text-sm"><CalendarEvent className="inline mr-2" />{decade}s · {entries.length} recording{entries.length === 1 ? '' : 's'}</h2>
              {entries.map((recording) => <p key={recording.id} className="text-ink">{recording.releaseYear} — {recording.title} · {recording.artistOrBand}</p>)}
            </section>
          ))}
        </div>
      ) : <EmptyExplore />)}

      {activeTab === 'genre' && (genres.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {genres.map(([genre, count]) => <section key={genre} className="p-4 rounded-xl border border-ink-12 bg-paper"><h2 className="font-serif text-base font-bold">{genre}</h2><p className="text-ink-60 mt-1">{count} recording{count === 1 ? '' : 's'}</p></section>)}
        </div>
      ) : <EmptyExplore />)}

      {activeTab === 'instruments' && (instruments.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {instruments.map((instrument) => <section key={instrument} className="p-4 rounded-xl border border-ink-12 bg-paper"><h2 className="font-serif text-base font-bold"><MusicNoteBeamed className="inline mr-2" />{instrument}</h2><p className="text-ink-60 mt-1">Credited in {recordings.filter((recording) => recording.instruments.includes(instrument)).length} recording(s).</p></section>)}
        </div>
      ) : <EmptyExplore />)}
    </div>
  );
};

const EmptyExplore: React.FC = () => (
  <p className="rounded-xl border border-ink-12 bg-paper p-6 text-sm text-ink-60">No published recordings are available for this view yet.</p>
);
