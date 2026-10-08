import type { Band, Musician, SourceCitation } from '../types';

const AFRICAN_AREAS = [
  'Africa', 'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Côte d’Ivoire',
  'Democratic Republic of the Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea',
  'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya',
  'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
  'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Réunion', 'Rwanda',
  'Saint Helena', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Western Sahara',
  'Zambia', 'Zimbabwe',
];

export interface MusicBrainzArtist {
  id: string;
  name: string;
  type?: string;
  country?: string;
  area?: { name?: string };
  'begin-area'?: { name?: string };
  'life-span'?: { begin?: string; end?: string; ended?: boolean };
  disambiguation?: string;
  score?: number;
}

export async function searchAfricanMusicBrainzArtists(query: string, signal?: AbortSignal): Promise<MusicBrainzArtist[]> {
  if (!query.trim()) return [];
  // Keep the upstream search expression short. African location filtering happens
  // on returned artist metadata; embedding every country in the query exceeds the
  // API handler's input limit and causes every request to be rejected.
  const searchText = query.replace(/[+\-&|!(){}\[\]^"~*?:\\/]/g, ' ').trim();
  if (!searchText) return [];
  const params = new URLSearchParams({ q: searchText });
  const response = await fetch(`/api/musicbrainz/artist?${params}`, { signal });
  const data = await response.json() as { artists?: MusicBrainzArtist[]; error?: string };
  if (!response.ok) throw new Error(data.error || `MusicBrainz returned ${response.status}.`);
  return (data.artists || []).filter(isAfricanArtist);
}

function isAfricanArtist(artist: MusicBrainzArtist): boolean {
  const locations = [artist.country, artist.area?.name, artist['begin-area']?.name].filter(Boolean) as string[];
  return locations.some((place) => AFRICAN_AREAS.some((area) => place.toLowerCase() === area.toLowerCase()));
}

function year(value?: string): number | undefined {
  const parsed = value ? Number(value.slice(0, 4)) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function citation(artist: MusicBrainzArtist): SourceCitation {
  return {
    id: `musicbrainz-${artist.id}`,
    type: 'Community submission',
    title: `MusicBrainz artist: ${artist.name}`,
    publisher: 'MusicBrainz',
    notes: 'Core MusicBrainz metadata (CC0). Imported as an unverified lead; confirm with primary or local sources before publication.',
    urlOrArchiveCode: `https://musicbrainz.org/artist/${artist.id}`,
  };
}

export function toBanjoMusician(artist: MusicBrainzArtist): Musician {
  const source = citation(artist);
  const begin = year(artist['life-span']?.begin);
  const end = year(artist['life-span']?.end);
  const place = artist['begin-area']?.name || artist.area?.name || artist.country || '';
  return {
    id: `mb-${artist.id}`, name: artist.name, aliases: [], role: artist.type || 'Artist', instruments: [],
    birthYear: begin || 0, ...(end ? { deathYear: end } : {}), activeYears: '', country: artist.country || place,
    region: place, biography: artist.disambiguation ? `MusicBrainz note: ${artist.disambiguation}` : '',
    bands: [], participatedRecordingsCount: 0, photoUrl: '', verificationStatus: 'unverified', sources: [source],
    externalIds: { musicbrainz: artist.id },
  };
}

export function toBanjoBand(artist: MusicBrainzArtist): Band {
  const source = citation(artist);
  const place = artist['begin-area']?.name || artist.area?.name || artist.country || '';
  return {
    id: `mb-${artist.id}`, name: artist.name, formationYear: year(artist['life-span']?.begin) || 0,
    ...(year(artist['life-span']?.end) ? { disbandYear: year(artist['life-span']?.end) } : {}),
    country: artist.country || place, region: place, genre: '', overview: '',
    history: artist.disambiguation ? `MusicBrainz note: ${artist.disambiguation}` : '', membersTimeline: [],
    photoUrl: '', recordingsCount: 0, albumsCount: 0, verificationStatus: 'unverified', sources: [source],
    externalIds: { musicbrainz: artist.id },
  };
}
