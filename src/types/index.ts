export type RightsStatus =
  | 'rights_holder_uploaded'
  | 'licensed'
  | 'permission_granted'
  | 'public_domain'
  | 'user_claimed_rights'
  | 'rights_unknown'
  | 'disputed'
  | 'restricted'
  | 'removed';

export type VerificationStatus =
  | 'unverified'
  | 'community_sourced'
  | 'reviewed'
  | 'rights_holder_verified'
  | 'source_verified';

export type UserRole =
  | 'super_admin'
  | 'platform_admin'
  | 'senior_archivist'
  | 'archivist'
  | 'moderator'
  | 'rights_manager'
  | 'support_agent'
  | 'analyst'
  | 'contributor'
  | 'listener';

export interface SoloSpan {
  startSec?: number;
  endSec?: number;
  label?: string; // e.g. "2nd guitar solo"
}

export interface MusicianCredit {
  musicianId: string;
  musicianName: string;
  instrument: string;
  role: string; // e.g. "Lead Guitarist", "Lead Vocals", "Bassist", "Arranger"
  isSoloist?: boolean;
  soloOrder?: number; // 1 = first solo heard, 2 = second, ...
  solos?: SoloSpan[]; // 0..n solo passages for this person
  notes?: string; // e.g. "plays the bridge solo, panned left"
  sourceId?: string; // citation backing this credit
}

export interface SourceCitation {
  id: string;
  type:
    | 'Original record sleeve'
    | 'Studio documentation'
    | 'Artist interview'
    | 'Band member testimony'
    | 'Family testimony'
    | 'Newspaper'
    | 'Magazine'
    | 'Book'
    | 'Academic publication'
    | 'Label documentation'
    | 'Government archive'
    | 'Community submission';
  title: string;
  authorOrWitness?: string;
  publication?: string;
  publisher?: string;
  year?: number;
  notes?: string;
  urlOrArchiveCode?: string;
}

export interface DisputedClaim {
  field: string;
  title: string;
  claimA: { text: string; source: string; year?: number };
  claimB: { text: string; source: string; year?: number };
  archivistNote: string;
}

export interface Revision {
  id: string;
  version: number;
  date: string;
  authorName: string;
  authorRole: string;
  summary: string;
  changes: {
    field: string;
    previous: string;
    proposed: string;
  }[];
  status: 'approved' | 'pending' | 'rejected';
}

export interface Recording {
  id: string;
  songId: string;
  title: string;
  recordingTitle: string;
  artistOrBand: string;
  bandId?: string;
  artistId?: string;
  albumId?: string;
  albumTitle?: string;
  releaseYear: number | null;
  country: string;
  region: string;
  language: string;
  genre: string;
  label: string;
  composer: string;
  lyricist: string;
  producer: string;
  studio: string;
  recordingLocation: string;
  duration: number; // in seconds
  audioQuality: 'FLAC Master' | '320kbps MP3' | '128kbps Stream' | 'Unknown';
  audioSampleType: 'benga_fast' | 'rhumba_slow' | 'highlife' | 'taarab' | 'soukous' | 'unknown';
  /** Playable source for a master stored durably in the media backend. */
  audioUrl?: string;
  audioStoragePath?: string;
  audioFileName?: string;
  audioMimeType?: string;
  audioFileSize?: number;
  rightsStatus: RightsStatus;
  rightsDeclaration: string;
  verificationStatus: VerificationStatus;
  coverImage: string;
  story: string;
  recordingHistory: string[];
  musicians: MusicianCredit[];
  instruments: string[];
  sources: SourceCitation[];
  disputedClaims?: DisputedClaim[];
  lyrics?: string;
  lyricsTranslation?: string;
  trivia?: string[];
  alternateVersions?: { id: string; title: string; band: string; year: number; label?: string }[];
  talkComments?: { id: string; author: string; date: string; topic: string; comment: string }[];
  revisions: Revision[];
  waveformPoints: number[];
  playsCount: number;
  createdAt: string;
  updatedAt: string;
  lyricsVersions?: LyricsVersion[];
}

export interface SongComposition {
  id: string;
  title: string;
  composer: string;
  lyricist: string;
  originYear: number;
  country: string;
  region: string;
  language: string;
  genre: string;
  summary: string;
  recordingsCount: number;
  primaryRecordingId: string;
}

export interface Musician {
  id: string;
  name: string;
  nativeSpelling?: string;
  aliases: string[];
  role: string;
  instruments: string[];
  birthYear: number;
  deathYear?: number;
  activeYears: string;
  country: string;
  region: string;
  biography: string;
  bands: { id: string; name: string; period: string; role: string }[];
  participatedRecordingsCount: number;
  photoUrl: string;
  verificationStatus: VerificationStatus;
  sources: SourceCitation[];
}

export interface BandMemberTimeline {
  period: string;
  musicianId: string;
  musicianName: string;
  instrument: string;
  isFounder?: boolean;
}

export interface Band {
  id: string;
  name: string;
  formationYear: number;
  disbandYear?: number;
  country: string;
  region: string;
  genre: string;
  overview: string;
  history: string;
  membersTimeline: BandMemberTimeline[];
  photoUrl: string;
  recordingsCount: number;
  albumsCount: number;
  verificationStatus: VerificationStatus;
  sources: SourceCitation[];
}

export interface Album {
  id: string;
  title: string;
  artistOrBand: string;
  year: number;
  label: string;
  producer: string;
  recordingLocation: string;
  historicalStory: string;
  coverUrl: string;
  trackList: { trackNumber: number; recordingId: string; title: string; duration: string }[];
  musicians: string[];
  documents: string[];
}

export interface OralHistory {
  id: string;
  title: string;
  interviewee: string;
  intervieweeRole: string;
  interviewer: string;
  date: string;
  location: string;
  duration: string;
  audioSampleType: 'rhumba_slow' | 'benga_fast';
  audioUrl?: string;
  summary: string;
  transcriptEn: string;
  transcriptSw: string;
  photoUrl: string;
  keyEntities: {
    musicians: string[];
    bands: string[];
    places: string[];
    dates: string[];
  };
  sources: SourceCitation[];
}

export interface HistoricalDocument {
  id: string;
  title: string;
  type:
    | 'record_sleeve'
    | 'poster'
    | 'newspaper_article'
    | 'concert_programme'
    | 'contract'
    | 'photograph'
    | 'letter'
    | 'studio_document';
  year: number;
  country: string;
  location: string;
  archivalCode: string;
  description: string;
  imageUrl: string;
  relatedSongIds: string[];
  relatedBandIds: string[];
  sourceAttribution: string;
}

export interface TimelineEvent {
  year: number;
  title: string;
  category: 'band_formed' | 'first_recording' | 'album_released' | 'lineup_change' | 'milestone' | 'historical_event';
  country: string;
  description: string;
  relatedRecordingId?: string;
  relatedBandId?: string;
  relatedMusicianId?: string;
}

export interface Submission {
  id: string;
  contributorId?: string;
  type: 'recording' | 'edit' | 'document' | 'oral_history' | 'correction';
  title: string;
  contributorName: string;
  contributorEmail: string;
  submittedAt: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'evidence_requested';
  rightsDeclaration: string;
  currentData?: Record<string, string>;
  proposedData: Record<string, string>;
  sourcesProvided: string;
  reviewNotes?: string;
  targetId?: string;
  targetTitle?: string;
  targetType?: string;
}

export interface CopyrightCase {
  id: string;
  caseNumber: string;
  recordingId: string;
  recordingTitle: string;
  artistOrBand: string;
  claimantName: string;
  claimantEmail: string;
  claimType: 'ownership' | 'unauthorized_audio' | 'disputed_credit' | 'takedown_request';
  evidenceSummary: string;
  filedDate: string;
  status: 'open' | 'investigating' | 'restricted' | 'resolved' | 'dismissed';
  assignedTo?: string;
}

export interface AuditLogEntry {
  id: string;
  who: string;
  what: string;
  when: string;
  where: string;
  before?: string;
  after?: string;
  reason: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  verifiedStatus: boolean;
  contributionsCount: number;
  songsSubmitted: number;
  editsSubmitted: number;
  editsApproved: number;
  pendingReview: number;
  rejectedEdits: number;
  savedRecordingIds: string[];
  bookmarkedPages: { type: string; id: string; title: string }[];
  playlists: { id: string; name: string; description: string; songIds: string[] }[];
}

export interface LyricLine {
  text: string;
  startSec?: number;
  endSec?: number;
  section?: string; // "Verse 1", "Chorus"
}

export interface LyricsVersion {
  id: string;
  language: string; // "Dholuo", "Lingala", "Kiswahili", "English"...
  isOriginal: boolean;
  isTranslation: boolean;
  translationOfId?: string;
  lines: LyricLine[]; // ordered; startSec optional (synced when present)
  lyricist?: string;
  transcribedBy?: string;
  sourceId?: string; // citation (sleeve, booklet, interview...)
  isInstrumental?: boolean;
  updatedAt: string;
}
