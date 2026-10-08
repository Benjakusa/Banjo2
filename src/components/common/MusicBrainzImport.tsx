import React, { useEffect, useState } from 'react';
import { MusicBrainzArtist, searchAfricanMusicBrainzArtists } from '../../lib/musicBrainz';
import type { Band, Musician } from '../../types';

interface Props {
  query: string;
  musicians: Musician[];
  bands: Band[];
  onImport: (artist: MusicBrainzArtist) => void;
}

export const MusicBrainzImport: React.FC<Props> = ({ query, musicians, bands, onImport }) => {
  const [results, setResults] = useState<MusicBrainzArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setResults([]);
    setError('');
    setLoading(query.trim().length >= 2);
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try { setResults(await searchAfricanMusicBrainzArtists(query, controller.signal)); }
      catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not reach MusicBrainz.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 700);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const importArtist = (artist: MusicBrainzArtist) => {
    const isBand = artist.type === 'Group';
    const exists = isBand ? bands.some((item) => item.externalIds?.musicbrainz === artist.id) : musicians.some((item) => item.externalIds?.musicbrainz === artist.id);
    if (exists) { setNotice(`${artist.name} is already in the Banjo catalogue.`); return; }
    onImport(artist);
    setNotice(`${artist.name} added as an unverified ${isBand ? 'band' : 'artist'} lead.`);
  };

  if (!query.trim()) return null;

  return <div className="mb-import" role="region" aria-label="MusicBrainz results">
    <div className="mb-import-head"><div><strong>African MusicBrainz matches</strong><small>External metadata · separate from Banjo catalogue results</small></div><a href="https://musicbrainz.org" target="_blank" rel="noreferrer">MusicBrainz ↗</a></div>
    <p className="mb-import-note">Imported matches are unverified leads. Importing adds metadata and a source link only; it does not add audio or artwork.</p>
    {loading && <p className="mb-import-status">Searching MusicBrainz…</p>}
    {error && <p className="mb-import-error" role="alert">{error}</p>}
    {notice && <p className="mb-import-status" role="status">{notice}</p>}
    {results.length > 0 && <ul className="mb-import-results">{results.map((artist) => {
      const imported = artist.type === 'Group'
        ? bands.some((item) => item.externalIds?.musicbrainz === artist.id)
        : musicians.some((item) => item.externalIds?.musicbrainz === artist.id);
      return <li key={artist.id}><div><strong>{artist.name}</strong><small>{[artist.type, artist.country || artist.area?.name, artist['life-span']?.begin].filter(Boolean).join(' · ')}</small>{artist.disambiguation && <small>{artist.disambiguation}</small>}</div><button type="button" disabled={imported} onClick={() => importArtist(artist)}>{imported ? 'Imported' : 'Import to Banjo'}</button></li>;
    })}</ul>}
    {!loading && query.trim().length >= 2 && !error && results.length === 0 && <p className="mb-import-status">No African MusicBrainz matches found.</p>}
  </div>;
};
