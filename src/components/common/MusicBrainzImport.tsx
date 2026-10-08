import React, { useEffect, useState } from 'react';
import { Search, X } from 'react-bootstrap-icons';
import { MusicBrainzArtist, searchAfricanMusicBrainzArtists, toBanjoBand, toBanjoMusician } from '../../lib/musicBrainz';
import type { Band, Musician } from '../../types';

interface Props {
  musicians: Musician[];
  bands: Band[];
  onImport: (artist: MusicBrainzArtist) => void;
}

export const MusicBrainzImport: React.FC<Props> = ({ musicians, bands, onImport }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicBrainzArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setError(''); return; }
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

  return <div className="mb-import" role="region" aria-label="Import African music metadata from MusicBrainz">
    <div className="mb-import-head"><div><strong>Find African artists</strong><small>Search MusicBrainz core metadata</small></div><a href="https://musicbrainz.org" target="_blank" rel="noreferrer">MusicBrainz ↗</a></div>
    <label className="mb-import-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Artist or band name" aria-label="Search MusicBrainz for an African artist" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X /></button>}</label>
    <p className="mb-import-note">Imports names, dates, place, MBID and source link only. No audio, cover art, tags or ratings. Verify locally before publishing.</p>
    {loading && <p className="mb-import-status">Searching MusicBrainz…</p>}
    {error && <p className="mb-import-error" role="alert">{error}</p>}
    {notice && <p className="mb-import-status" role="status">{notice}</p>}
    {results.length > 0 && <ul className="mb-import-results">{results.map((artist) => <li key={artist.id}><div><strong>{artist.name}</strong><small>{[artist.type, artist.country || artist.area?.name, artist['life-span']?.begin].filter(Boolean).join(' · ')}</small>{artist.disambiguation && <small>{artist.disambiguation}</small>}</div><button type="button" onClick={() => importArtist(artist)}>Add lead</button></li>)}</ul>}
    {!loading && query.trim().length >= 2 && !error && results.length === 0 && <p className="mb-import-status">No African matches found.</p>}
  </div>;
};
