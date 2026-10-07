import { supabase, isSupabaseConfigured } from './supabase';
import { DEFAULT_ROLE, canSelfAssign } from './auth';
import {
  Album,
  AuditLogEntry,
  Band,
  CopyrightCase,
  HistoricalDocument,
  Musician,
  OralHistory,
  Recording,
  SongComposition,
  Submission,
  UserProfile,
  UserRole,
} from '../types';

/**
 * Repository for everything the archive stores.
 *
 * The React app talks to exactly two places: the `app_*` tables created by
 * SUPABASE_COPY_PASTE.sql, and — when no backend is configured — the browser's
 * own storage. Both live behind this module, so no component builds a row by
 * hand and the offline path cannot drift from the online one.
 *
 * The catalogue is one row per entity in `app_archive_items` (`kind` +
 * `payload`), the profile is one row per account in `app_profiles` (primary key
 * = account id), and nothing is seeded: an empty project starts empty.
 */

export type ArchiveKind =
  | 'recording'
  | 'song'
  | 'musician'
  | 'band'
  | 'album'
  | 'oral_history'
  | 'document';

export const ARCHIVE_KINDS: ArchiveKind[] = [
  'recording',
  'song',
  'musician',
  'band',
  'album',
  'oral_history',
  'document',
];

export interface ArchiveCatalogue {
  recordings: Recording[];
  songs: SongComposition[];
  musicians: Musician[];
  bands: Band[];
  albums: Album[];
  oralHistories: OralHistory[];
  documents: HistoricalDocument[];
}

export const EMPTY_CATALOGUE: ArchiveCatalogue = {
  recordings: [],
  songs: [],
  musicians: [],
  bands: [],
  albums: [],
  oralHistories: [],
  documents: [],
};

/** A profile that represents nobody: the state a signed-out visitor is in. */
export const EMPTY_PROFILE: UserProfile = {
  id: '',
  displayName: '',
  email: '',
  role: DEFAULT_ROLE,
  avatarUrl: '',
  bio: '',
  verifiedStatus: false,
  contributionsCount: 0,
  songsSubmitted: 0,
  editsSubmitted: 0,
  editsApproved: 0,
  pendingReview: 0,
  rejectedEdits: 0,
  savedRecordingIds: [],
  bookmarkedPages: [],
  playlists: [],
};

export interface ModerationSnapshot {
  submissions: Submission[];
  auditLogs: AuditLogEntry[];
  copyrightCases: CopyrightCase[];
}

export const EMPTY_MODERATION: ModerationSnapshot = {
  submissions: [],
  auditLogs: [],
  copyrightCases: [],
};

/** True when the app runs without a backend and stores in the browser instead. */
export const isLocalMode = !isSupabaseConfigured;

/**
 * Whether the backend is actually reachable and set up: a configured project
 * whose tables are missing or unreachable should say so rather than pretend.
 */
export async function probeBackend(): Promise<boolean> {
  if (isLocalMode) return false;

  const { error } = await supabase
    .from('app_archive_items')
    .select('id', { head: true, count: 'exact' });

  if (error) {
    console.warn('The archive backend is not ready:', error.message);
    return false;
  }
  return true;
}

const KNOWN_ROLES: UserRole[] = [
  'super_admin',
  'platform_admin',
  'senior_archivist',
  'archivist',
  'moderator',
  'rights_manager',
  'support_agent',
  'analyst',
  'contributor',
  'listener',
];

const normalizeRole = (role: unknown): UserRole =>
  KNOWN_ROLES.includes(role as UserRole) ? (role as UserRole) : DEFAULT_ROLE;

// ---------------------------------------------------------------------------
// Offline store: the same shapes, kept in the browser. Used only when no
// backend is configured, so every screen still works with no network.
// ---------------------------------------------------------------------------

const LOCAL_KEYS = {
  catalogue: 'banjo.local.catalogue.v1',
  profiles: 'banjo.local.profiles.v1',
  moderation: 'banjo.local.moderation.v1',
};

let localUserScope = 'anonymous';

export function setLocalUserScope(userId: string | null): void {
  localUserScope = userId ? encodeURIComponent(userId) : 'anonymous';
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Local storage is unavailable; the change is session-only.', err);
  }
}

type LocalCatalogue = Partial<Record<ArchiveKind, { id: string }[]>>;

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

function catalogueFromItems(items: { kind: string; payload: any }[]): ArchiveCatalogue {
  const catalogue: ArchiveCatalogue = {
    recordings: [],
    songs: [],
    musicians: [],
    bands: [],
    albums: [],
    oralHistories: [],
    documents: [],
  };

  for (const item of items) {
    const entity = item.payload as { id?: string };
    if (!entity || !entity.id) continue;

    switch (item.kind as ArchiveKind) {
      case 'recording':
        catalogue.recordings.push(entity as Recording);
        break;
      case 'song':
        catalogue.songs.push(entity as SongComposition);
        break;
      case 'musician':
        catalogue.musicians.push(entity as Musician);
        break;
      case 'band':
        catalogue.bands.push(entity as Band);
        break;
      case 'album':
        catalogue.albums.push(entity as Album);
        break;
      case 'oral_history':
        catalogue.oralHistories.push(entity as OralHistory);
        break;
      case 'document':
        catalogue.documents.push(entity as HistoricalDocument);
        break;
      default:
        break;
    }
  }

  return catalogue;
}

/** Everything contributed to the catalogue so far. Never seeded. */
export async function loadCatalogue(): Promise<ArchiveCatalogue> {
  if (isLocalMode) {
    const stored = readLocal<LocalCatalogue>(LOCAL_KEYS.catalogue, {});
    const items = ARCHIVE_KINDS.flatMap((kind) =>
      (stored[kind] || []).map((entity) => ({ kind, payload: entity }))
    );
    return catalogueFromItems(items);
  }

  const { data, error } = await supabase
    .from('app_archive_items')
    .select('kind, payload')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Could not read the archive catalogue:', error.message);
    throw new Error('The archive catalogue could not be loaded.');
  }

  return catalogueFromItems(data || []);
}

/** Inserts or updates one catalogue entity, keyed by its own id. */
export async function saveArchiveItem(kind: ArchiveKind, entity: { id: string }): Promise<boolean> {
  if (isLocalMode) {
    const stored = readLocal<LocalCatalogue>(LOCAL_KEYS.catalogue, {});
    const forKind = (stored[kind] || []).filter((row) => row.id !== entity.id);
    writeLocal(LOCAL_KEYS.catalogue, { ...stored, [kind]: [...forKind, entity] });
    return true;
  }

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return false;

  const { data: updated, error: updateError } = await supabase
    .from('app_archive_items')
    .update({ kind, payload: entity, updated_at: new Date().toISOString() })
    .eq('id', entity.id)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.warn(`Could not save the ${kind} "${entity.id}":`, updateError.message);
    return false;
  }
  if (updated) return true;

  const { error: insertError } = await supabase.from('app_archive_items').insert({
    id: entity.id,
    kind,
    payload: entity,
    created_by: userId,
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    console.warn(`Could not save the ${kind} "${entity.id}":`, insertError.message);
    return false;
  }
  return true;
}

export async function uploadPendingAudio(file: File): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return null;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'audio';
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from('banjo-pending-audio').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    console.warn('Could not upload audio:', error.message);
    return null;
  }
  return path;
}

export async function removePendingAudio(path: string): Promise<void> {
  if (!isSupabaseConfigured || !path) return;
  const { error } = await supabase.storage.from('banjo-pending-audio').remove([path]);
  if (error) console.warn('Could not remove pending audio:', error.message);
}

export async function getPendingAudioPreviewUrl(path: string): Promise<string | null> {
  if (!isSupabaseConfigured || !path) return null;
  const { data, error } = await supabase.storage.from('banjo-pending-audio').createSignedUrl(path, 300);
  if (error) {
    console.warn('Could not create a private audio preview:', error.message);
    return null;
  }
  return data.signedUrl;
}

/** Removes a catalogue entity, for a contribution that is withdrawn. */
export async function deleteArchiveItem(id: string): Promise<boolean> {
  if (isLocalMode) {
    const stored = readLocal<LocalCatalogue>(LOCAL_KEYS.catalogue, {});
    const next: LocalCatalogue = {};
    for (const kind of ARCHIVE_KINDS) {
      next[kind] = (stored[kind] || []).filter((row) => row.id !== id);
    }
    writeLocal(LOCAL_KEYS.catalogue, next);
    return true;
  }

  const { error } = await supabase.from('app_archive_items').delete().eq('id', id);
  if (error) {
    console.warn(`Could not delete catalogue item "${id}":`, error.message);
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Profiles: one row per account, readable and writable only by its owner
// ---------------------------------------------------------------------------

function profileFromRow(row: any): UserProfile {
  return {
    id: row.user_id,
    displayName: row.display_name || '',
    email: row.email || '',
    role: normalizeRole(row.role),
    avatarUrl: row.avatar_url || '',
    bio: row.bio || '',
    verifiedStatus: Boolean(row.verified_status),
    contributionsCount: row.contributions_count ?? 0,
    songsSubmitted: row.songs_submitted ?? 0,
    editsSubmitted: row.edits_submitted ?? 0,
    editsApproved: row.edits_approved ?? 0,
    pendingReview: row.pending_review ?? 0,
    rejectedEdits: row.rejected_edits ?? 0,
    savedRecordingIds: row.saved_recording_ids ?? [],
    bookmarkedPages: row.bookmarked_pages ?? [],
    playlists: row.playlists ?? [],
  };
}

function profileToRow(userId: string, profile: UserProfile) {
  return {
    user_id: userId,
    email: profile.email,
    display_name: profile.displayName,
    role: normalizeRole(profile.role),
    avatar_url: profile.avatarUrl,
    bio: profile.bio,
    verified_status: profile.verifiedStatus,
    saved_recording_ids: profile.savedRecordingIds,
    bookmarked_pages: profile.bookmarkedPages,
    playlists: profile.playlists,
    contributions_count: profile.contributionsCount,
    songs_submitted: profile.songsSubmitted,
    edits_submitted: profile.editsSubmitted,
    edits_approved: profile.editsApproved,
    pending_review: profile.pendingReview,
    rejected_edits: profile.rejectedEdits,
    updated_at: new Date().toISOString(),
  };
}

/** The signed-in account's own profile, or null when it has none yet. */
export async function loadProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  if (isLocalMode) {
    const profiles = readLocal<Record<string, UserProfile>>(LOCAL_KEYS.profiles, {});
    return profiles[userId] ?? null;
  }

  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Could not read the profile:', error.message);
    return null;
  }
  return data ? profileFromRow(data) : null;
}

/**
 * The profile for an account, created the first time we see it.
 *
 * Two accounts can never share one: the row's primary key is the account id and
 * the table's policies only ever expose the caller's own row, so this is the
 * only row the call can reach.
 */
export async function ensureProfile(
  userId: string,
  email: string,
  displayName: string,
  role: UserRole = DEFAULT_ROLE
): Promise<UserProfile | null> {
  const existing = await loadProfile(userId);
  if (existing) return existing;

  const fresh: UserProfile = {
    ...EMPTY_PROFILE,
    id: userId,
    email,
    displayName: displayName.trim() || email.split('@')[0] || 'Contributor',
    role: canSelfAssign(role) ? role : DEFAULT_ROLE,
  };

  if (isLocalMode) {
    const profiles = readLocal<Record<string, UserProfile>>(LOCAL_KEYS.profiles, {});
    writeLocal(LOCAL_KEYS.profiles, { ...profiles, [userId]: fresh });
    return fresh;
  }

  const { error } = await supabase.from('app_profiles').insert(profileToRow(userId, fresh));
  if (error) {
    // A concurrent request (or the database's signup trigger) may have won.
    const retry = await loadProfile(userId);
    if (retry) return retry;
    console.warn('Could not create the profile:', error.message);
    return null;
  }

  return fresh;
}

/** Persists the whole profile row — counters, library and edits alike. */
export async function saveProfile(userId: string, profile: UserProfile): Promise<boolean> {
  if (!userId) return false;

  if (isLocalMode) {
    const profiles = readLocal<Record<string, UserProfile>>(LOCAL_KEYS.profiles, {});
    writeLocal(LOCAL_KEYS.profiles, { ...profiles, [userId]: { ...profile, id: userId } });
    return true;
  }

  const { error } = await supabase
    .from('app_profiles')
    .update({
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      saved_recording_ids: profile.savedRecordingIds,
      bookmarked_pages: profile.bookmarkedPages,
      playlists: profile.playlists,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.warn('Could not save the profile:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Moderation queue, audit trail and rights reports
// ---------------------------------------------------------------------------

function submissionFromRow(row: any): Submission {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    contributorName: row.contributor_name || '',
    contributorEmail: row.contributor_email || '',
    targetId: row.target_id || undefined,
    targetTitle: row.target_title || undefined,
    targetType: row.target_type || undefined,
    category: row.category || 'Archive Import',
    priority: (row.priority as any) || 'normal',
    status: (row.status as any) || 'pending',
    rightsDeclaration: row.rights_declaration || '',
    submittedAt: row.created_at || new Date().toISOString(),
    currentData: row.current_data || {},
    proposedData: row.proposed_data || {},
    sourcesProvided: row.sources_provided || '',
    reviewNotes: row.review_notes || '',
  };
}

function submissionToRow(submission: Submission, contributorId: string) {
  return {
    id: submission.id,
    contributor_id: contributorId,
    type: submission.type,
    title: submission.title,
    contributor_name: submission.contributorName,
    contributor_email: submission.contributorEmail,
    target_id: submission.targetId ?? null,
    target_title: submission.targetTitle ?? null,
    target_type: submission.targetType ?? null,
    priority: submission.priority,
    status: submission.status,
    current_data: submission.currentData ?? {},
    proposed_data: submission.proposedData,
    rights_declaration: submission.rightsDeclaration,
    sources_provided: submission.sourcesProvided,
    review_notes: submission.reviewNotes ?? '',
  };
}

function copyrightFromRow(row: any): CopyrightCase {
  return {
    id: row.id,
    caseNumber: row.case_number || `BANJO-CR-${String(row.id).slice(0, 8).toUpperCase()}`,
    recordingId: row.recording_id || '',
    recordingTitle: row.recording_title || '',
    artistOrBand: row.artist_or_band || '',
    claimantName: row.claimant_name || '',
    claimantEmail: row.claimant_email || '',
    claimType: (row.claim_type as any) || 'ownership',
    status: (row.status as any) || 'open',
    filedDate: row.filed_date || new Date().toISOString().split('T')[0],
    evidenceSummary: row.evidence || row.summary || '',
    assignedTo: row.assigned_to || undefined,
  };
}

function copyrightToRow(entry: CopyrightCase) {
  return {
    id: entry.id,
    case_number: entry.caseNumber,
    recording_id: entry.recordingId || 'unlinked',
    recording_title: entry.recordingTitle,
    artist_or_band: entry.artistOrBand,
    claimant_name: entry.claimantName,
    claimant_email: entry.claimantEmail,
    claim_type: entry.claimType,
    status: entry.status,
    filed_date: entry.filedDate,
    summary: entry.evidenceSummary,
  };
}



/** Submissions, audit entries and rights reports — the moderation workspace. */
export async function loadModeration(): Promise<ModerationSnapshot> {
  if (isLocalMode) {
    return readLocalModeration();
  }

  const [submissionRes, auditRes, copyrightRes, problemRes] = await Promise.all([
    supabase.from('app_submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('app_audit_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('app_copyright_cases').select('*').order('created_at', { ascending: false }),
    supabase.from('app_problem_reports').select('*').order('created_at', { ascending: false }),
  ]);

  if (submissionRes.error) console.warn('Could not read the submission queue:', submissionRes.error.message);
  if (auditRes.error) console.warn('Could not read the audit trail:', auditRes.error.message);
  if (copyrightRes.error) console.warn('Could not read the rights reports:', copyrightRes.error.message);
  if (problemRes.error) console.warn('Could not read the problem reports:', problemRes.error.message);

  return {
    submissions: (submissionRes.data || []).map(submissionFromRow),
    auditLogs: [
      ...(auditRes.data || []).map((row: any) => ({
      id: row.id,
      who: row.who,
      what: row.action,
      where: row.target,
      when: row.timestamp || row.created_at,
      reason: row.notes || '',
      })),
      ...(problemRes.data || []).map((row: any) => ({
        id: row.id,
        who: row.email || 'Anonymous visitor',
        what: `Problem report: ${row.target_title}`,
        where: row.target_title,
        when: row.created_at,
        reason: `${row.reason} — ${row.notes}`,
      })),
    ],
    copyrightCases: (copyrightRes.data || []).map(copyrightFromRow),
  };
}

function readLocalModeration(): ModerationSnapshot {
  return readLocal<ModerationSnapshot>(`${LOCAL_KEYS.moderation}.${localUserScope}`, { ...EMPTY_MODERATION });
}

function writeLocalModeration(snapshot: ModerationSnapshot): void {
  writeLocal(`${LOCAL_KEYS.moderation}.${localUserScope}`, snapshot);
}

export async function insertSubmission(submission: Submission): Promise<boolean> {
  if (isLocalMode) {
    const current = readLocalModeration();
    writeLocalModeration({
      ...current,
      submissions: [submission, ...current.submissions],
    });
    return true;
  }

  const { data: session } = await supabase.auth.getSession();
  const contributorId = session.session?.user?.id;
  if (!contributorId) return false;

  const { error } = await supabase
    .from('app_submissions')
    .insert(submissionToRow(submission, contributorId));
  if (error) {
    console.warn('Could not submit to the review queue:', error.message);
    return false;
  }
  return true;
}

export async function updateSubmission(
  id: string,
  status: Submission['status'],
  reviewNotes: string
): Promise<boolean> {
  if (isLocalMode) {
    const current = readLocalModeration();
    writeLocalModeration({
      ...current,
      submissions: current.submissions.map((entry) =>
        entry.id === id ? { ...entry, status, reviewNotes } : entry
      ),
    });
    return true;
  }

  const { error } = await supabase
    .from('app_submissions')
    .update({ status, review_notes: reviewNotes })
    .eq('id', id);

  if (error) {
    console.warn('Could not record the review decision:', error.message);
    return false;
  }
  return true;
}

export async function insertAuditLog(entry: AuditLogEntry): Promise<boolean> {
  if (isLocalMode) {
    const current = readLocalModeration();
    writeLocalModeration({ ...current, auditLogs: [entry, ...current.auditLogs] });
    return true;
  }

  const { error } = await supabase.from('app_audit_logs').insert({
    id: entry.id,
    who: entry.who,
    action: entry.what,
    target: entry.where,
    timestamp: entry.when,
    notes: entry.reason,
  });

  if (error) {
    console.warn('Could not write the audit entry:', error.message);
    return false;
  }
  return true;
}

export async function insertProblemReport(report: {
  id: string;
  targetTitle: string;
  reason: string;
  notes: string;
  email: string;
}): Promise<boolean> {
  if (isLocalMode) {
    const current = readLocalModeration();
    const entry: AuditLogEntry = {
      id: report.id,
      who: report.email || 'Anonymous visitor',
      what: `Problem report: ${report.targetTitle}`,
      where: report.targetTitle,
      when: new Date().toISOString(),
      reason: `${report.reason} — ${report.notes}`,
    };
    writeLocalModeration({
      ...current,
      auditLogs: [entry, ...current.auditLogs],
    });
    return true;
  }

  const { error } = await supabase.from('app_problem_reports').insert({
    id: report.id,
    target_title: report.targetTitle,
    reason: report.reason,
    notes: report.notes,
    email: report.email,
  });
  if (error) {
    console.warn('Could not file the problem report:', error.message);
    return false;
  }
  return true;
}

export async function insertCopyrightCase(entry: CopyrightCase): Promise<boolean> {
  if (isLocalMode) {
    const current = readLocalModeration();
    writeLocalModeration({
      ...current,
      copyrightCases: [entry, ...current.copyrightCases],
    });
    return true;
  }

  const { error } = await supabase.from('app_copyright_cases').insert(copyrightToRow(entry));
  if (error) {
    console.warn('Could not file the rights report:', error.message);
    return false;
  }
  return true;
}

export async function updateCopyrightCaseStatus(
  id: string,
  status: CopyrightCase['status']
): Promise<boolean> {
  if (isLocalMode) {
    const current = readLocalModeration();
    writeLocalModeration({
      ...current,
      copyrightCases: current.copyrightCases.map((entry) =>
        entry.id === id ? { ...entry, status } : entry
      ),
    });
    return true;
  }

  const { error } = await supabase.from('app_copyright_cases').update({ status }).eq('id', id);
  if (error) {
    console.warn('Could not resolve the rights report:', error.message);
    return false;
  }
  return true;
}
