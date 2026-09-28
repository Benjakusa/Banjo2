import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  Globe,
  GeoAlt,
  CalendarEvent,
  MusicNoteBeamed,
  ArrowRight,
  Vinyl,
  PlayFill
} from 'react-bootstrap-icons';

export const ExploreView: React.FC = () => {
  const { recordings, bands, musicians, playSong, navigateTo } = useBanjo();

  const [activeTab, setActiveTab] = useState<'country' | 'decade' | 'genre' | 'instruments'>('country');
  const [selectedCountry, setSelectedCountry] = useState<string>('Kenya');

  const countryOverviews: Record<
    string,
    {
      history: string;
      regions: string[];
      keyGenres: string[];
      }
  > = {
    Kenya: {
      history:
        'Kenya served as the vinyl pressing and recording hub of East Africa throughout the 1960s and 1970s. From the traditional Luo nyatiti-inspired electric rhythms of Benga in the Lake Victoria basin to the Luhya-influenced fingerpicking of Kenyan Twist in Nairobi and Coastal Taarab in Mombasa, the country attracted musicians from across the continent to record at Equator, Chandarana, and Polygram facilities.',
      regions: ['Nyanza (Lake Victoria)', 'Western (Kakamega/Bungoma)', 'Central (Highlands)', 'Coast (Mombasa)', 'Rift Valley (Kericho)', 'Nairobi'],
      keyGenres: ['Benga', 'Kenyan Twist', 'Taarab', 'Ohangla', 'Mugithi', 'Chakacha'],
    },
    'DR Congo': {
      history:
        'The Democratic Republic of Congo gave birth to Congolese Rhumba, one of the most influential sonic languages of modern Africa. Originating in Leopoldville with pioneers like Wendo Kolosoy and codified by Franco’s OK Jazz, the sound evolved into the high-velocity, dancing seben of Soukous and Ndombolo.',
      regions: ['Kinshasa', 'Lubumbashi (Katanga)', 'Bas-Congo', 'Kisangani', 'Brazzaville Corridor'],
      keyGenres: ['Congolese Rhumba', 'Soukous', 'Cavacha', 'Ndombolo'],
    },
    Nigeria: {
      history:
        'From Palm-wine guitar music and Highlife orchestras in Ibadan and Lagos to the insurgent socio-political fury of Fela Kuti’s Afrobeat, Nigeria produced landmark musical expressions. In Yoruba traditions, Jùjú guitar maestros like King Sunny Ade created polyphonic conversations between talking drums and Hawaiian pedal steel guitars.',
      regions: ['Lagos (Kalakuta / Island)', 'Ibadan / Osun (Yorubaland)', 'Enugu / Onitsha (Igboland)', 'Kano / Kaduna (North)'],
      keyGenres: ['Afrobeat', 'Highlife', 'Jùjú', 'Fuji', 'Apala'],
    },
    Tanzania: {
      history:
        'Tanzania fostered state-sponsored jazz bands (Muziki wa Dansi) after independence under Julius Nyerere, alongside the poetic Swahili classical traditions of Coastal Taarab centered in Zanzibar. Bands like DDC Mlimani Park combined intricate horn arrangements with reflective social lyrics.',
      regions: ['Dar es Salaam', 'Zanzibar (Unguja & Pemba)', 'Morogoro', 'Tanga', 'Arusha'],
      keyGenres: ['Muziki wa Dansi (Zilipendwa)', 'Taraab', 'Bongo Flava Origins'],
    },
    Ghana: {
      history:
        'The cradle of Highlife music, Ghana blended indigenous Akan rhythms with European brass instruments and acoustic guitars in coastal ports. Pioneers like E.T. Mensah and Ramblers Dance Band established an elegant dance orchestra model that swept across West Africa during the 1957 independence era.',
      regions: ['Accra', 'Kumasi (Ashanti)', 'Cape Coast', 'Sekondi-Takoradi'],
      keyGenres: ['Classic Highlife', 'Guitar-band Highlife', 'Palm-wine'],
    },
    Zimbabwe: {
      history:
        'During the liberation struggle of the 1970s, Thomas Mapfumo and contemporaries transposed the sacred, complex polyrhythms of the Shona mbira (thumb piano) onto electric guitars and drum kits, creating Chimurenga ("struggle music"), which became the soundtrack to national sovereignty.',
      regions: ['Harare', 'Bulawayo', 'Mutare', 'Masvingo'],
      keyGenres: ['Chimurenga', 'Jit', 'Sungura'],
    },
  };

  const currentCountryData = countryOverviews[selectedCountry] || countryOverviews['Kenya'];

  const countryRecordings = recordings.filter((r) =>
    r.country.toLowerCase().includes(selectedCountry.toLowerCase())
  );
  const countryBands = bands.filter((b) =>
    b.country.toLowerCase().includes(selectedCountry.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">
          Banjo Atlas
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">
          Geographic & Genre Exploration
        </h1>
        <p className="text-xs text-ink-60 mt-1">
          Explore regional music traditions, hubs, and historical movements across Africa.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
        {(
          [
            { key: 'country', label: 'BY COUNTRY' },
            { key: 'decade', label: 'BY DECADE' },
            { key: 'genre', label: 'BY GENRE' },
            { key: 'instruments', label: 'BY INSTRUMENTS' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === t.key
                ? 'bg-brand text-on-orange font-bold'
                : 'text-ink-60 hover:text-ink hover:bg-ink-06'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Country */}
      {activeTab === 'country' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(countryOverviews).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                  selectedCountry === c
                    ? 'border-ink bg-ink text-paper font-bold'
                    : 'border-ink-12 bg-paper text-ink-60 hover:bg-ink-06'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-ink-12 bg-paper p-5 sm:p-6 space-y-4">
            <div className="border-b border-ink-12 pb-3">
              <h2 className="text-2xl font-serif font-medium text-ink flex items-center gap-2">
                <span>{selectedCountry}</span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-ink-60 leading-relaxed">
              {currentCountryData.history}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-ink-12 text-xs">
              <div className="space-y-1.5">
                <span className="font-mono text-ink-60 uppercase text-[10px] font-bold">Regional Hubs</span>
                <div className="flex flex-wrap gap-1">
                  {currentCountryData.regions.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-ink-06 border border-ink-12 text-ink-60 text-[11px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-ink-60 uppercase text-[10px] font-bold">Signature Styles</span>
                <div className="flex flex-wrap gap-1">
                  {currentCountryData.keyGenres.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded bg-ink-06 border border-ink-12 text-ink font-medium text-[11px]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recordings from this Country */}
            <div className="pt-3 border-t border-ink-12 space-y-2">
              <span className="font-mono text-ink-60 uppercase text-[10px] font-bold block">
                Cataloged Recordings ({countryRecordings.length})
              </span>
              <div className="space-y-2">
                {countryRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-ink-12 bg-ink-06 hover:bg-paper hover:border-brand transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4
                        onClick={() => navigateTo('song_detail', { songId: rec.id })}
                        className="font-serif text-sm font-semibold text-link hover:underline cursor-pointer"
                      >
                        {rec.title}
                      </h4>
                      <p className="text-ink-60 text-[11px]">{rec.artistOrBand} · {rec.releaseYear}</p>
                    </div>
                    <button
                      onClick={() => playSong(rec)}
                      className="p-1.5 rounded-full bg-brand text-on-orange hover:bg-brand cursor-pointer"
                    >
                      <PlayFill className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Decades */}
      {activeTab === 'decade' && (
        <div className="space-y-3">
          {[
            { decade: '1950s', title: 'The Acoustic Foundations', text: 'Birth of Congolese Rhumba in Leopoldville (Kinshasa) and acoustic palm-wine guitarists.' },
            { decade: '1960s', title: 'Independence & Electrification', text: 'National independence movements across Africa accompanied by electric twist, highlife, and rumba.' },
            { decade: '1970s', title: 'The Golden Age of Benga & Afrobeat', text: 'Twin electric guitars adapting nyatiti lyres in Western Kenya; Fela Kuti revolutionizing Lagos.' },
            { decade: '1980s', title: 'Synthesizers & Soukous Diaspora', text: 'Paris and London migrations; Mario by Franco; continental high-speed guitar dance tracks.' },
          ].map((d) => (
            <div key={d.decade} className="p-4 rounded-xl border border-ink-12 bg-paper space-y-1.5 text-xs">
              <span className="font-mono text-ink-60 font-bold text-sm">{d.decade}</span>
              <h3 className="font-serif text-base font-semibold text-ink">{d.title}</h3>
              <p className="text-ink-60 leading-relaxed">{d.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Genre */}
      {activeTab === 'genre' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { name: 'Benga', origin: 'Kenya', desc: 'Fast, interlocking electric guitars derived from the Luo nyatiti lyre.' },
            { name: 'Congolese Rhumba', origin: 'DR Congo', desc: 'Afro-Cuban rhythm fused with Central African vocal harmonies and guitar seben.' },
            { name: 'Afrobeat', origin: 'Nigeria', desc: 'Complex jazz improvisation with Yoruba percussion and liberation lyrics.' },
            { name: 'Highlife', origin: 'Ghana', desc: 'Acoustic guitar and brass dance band music of the coastal ports.' },
          ].map((g) => (
            <div key={g.name} className="p-4 rounded-xl border border-ink-12 bg-paper space-y-1">
              <span className="font-serif text-base font-bold text-ink">{g.name}</span>
              <span className="text-[11px] font-mono text-ink-60 block">Origin: {g.origin}</span>
              <p className="text-ink-60 pt-1 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Instruments */}
      {activeTab === 'instruments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { name: 'Nyatiti', desc: '8-stringed bowl lyre of the Luo people, played with ankle bells (gara).' },
            { name: 'Electric Hollowbody Guitar', desc: 'Gibson Byrdland & Ibanez models favored by Franco and Peter Ochieng.' },
            { name: 'Talking Drum (Gangan)', desc: 'Hourglass pressure drum capable of mimicking tonal African speech.' },
            { name: 'Kanun & Accordion', desc: 'Zither and reed aerophone supplying microtonal flourishes in Coastal Taarab.' },
          ].map((i) => (
            <div key={i.name} className="p-4 rounded-xl border border-ink-12 bg-paper space-y-1">
              <span className="font-serif text-base font-bold text-ink">{i.name}</span>
              <p className="text-ink-60 pt-1 leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
