import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Recording,
  SongComposition,
  Musician,
  MusicianCredit,
  Band,
  OralHistory,
  HistoricalDocument,
  Album,
  Submission,
  CopyrightCase,
  AuditLogEntry,
  UserProfile,
  UserRole,
  Revision,
  LyricLine,
  LyricsVersion,
} from '../types';
import { audioEngine } from '../utils/audioEngine';
import { generateThumbnail } from '../lib/thumbnail';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_ROLE, canSelfAssign, isElevated } from '../lib/auth';
import {
  ArchiveKind,
  EMPTY_PROFILE,
  ensureProfile,
  insertAuditLog,
  insertCopyrightCase,
  insertProblemReport,
  insertSubmission,
  isLocalMode,
  loadCatalogue,
  loadModeration,
  probeBackend,
  uploadArchiveAudio,
  removeArchiveAudio,
  getArchiveAudioUrl,
  removePendingAudio,
  getPendingAudioPreviewUrl,
  saveArchiveItem,
  saveProfile,
  setLocalUserScope,
  updateCopyrightCaseStatus,
  updateSubmission,
} from '../lib/archiveRepo';

export type MainNavTab =
  | 'home'
  | 'search'
  | 'explore'
  | 'timeline'
  | 'oral_histories'
  | 'documents'
  | 'song_detail'
  | 'musician_detail'
  | 'band_detail'
  | 'upload'
  | 'profile'
  | 'admin'
  | 'signin';

interface NavigationState {
  tab: MainNavTab;
  songId?: string;
  musicianId?: string;
  bandId?: string;
  oralHistoryId?: string;
  documentId?: string;
}

interface BanjoContextType {
  // Navigation
  activeTab: MainNavTab;
  selectedSongId: string | null;
  selectedMusicianId: string | null;
  selectedBandId: string | null;
  selectedOralHistoryId: string | null;
  selectedDocumentId: string | null;
  navigateTo: (tab: MainNavTab, ids?: { songId?: string; musicianId?: string; bandId?: string; oralHistoryId?: string; documentId?: string }) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Audio Player
  isPlaying: boolean;
  currentRecording: Recording | null;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  isDataSaver: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;
  playSong: (recording: Recording, queueList?: Recording[]) => void;
  playOralHistory: (oralHistory: OralHistory) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setSpeed: (speed: number) => void;
  setDataSaver: (enabled: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilter: 'all' | 'songs' | 'artists' | 'bands' | 'musicians' | 'albums' | 'history';
  setSearchFilter: (filter: 'all' | 'songs' | 'artists' | 'bands' | 'musicians' | 'albums' | 'history') => void;

  // Modals & Drawers
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  isDiffViewerOpen: boolean;
  setIsDiffViewerOpen: (open: boolean) => void;
  activeDiffRevision: { recording: Recording; revision: Revision } | null;
  openDiffViewer: (recording: Recording, revision: Revision) => void;
  quickEditTarget: { recordingId: string; section: string; currentText?: string } | null;
  openQuickEdit: (recordingId: string, section: string, currentText?: string) => void;
  closeQuickEdit: () => void;
  isAddDetailModalOpen: boolean;
  setIsAddDetailModalOpen: (open: boolean) => void;
  isCreateArticleModalOpen: boolean;
  setIsCreateArticleModalOpen: (open: boolean) => void;

  // Data Collections
  recordings: Recording[];
  songs: SongComposition[];
  musicians: Musician[];
  bands: Band[];
  oralHistories: OralHistory[];
  documents: HistoricalDocument[];
  albums: Album[];
  submissions: Submission[];
  copyrightCases: CopyrightCase[];
  auditLogs: AuditLogEntry[];
  userProfile: UserProfile;
  /** The signed-in account's own profile row, written back on every change. */
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** Name, bio and avatar — what the "Edit profile" form is allowed to change. */
  saveProfileDetails: (patch: Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl'>) => void;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isBackendConnected: boolean;
  /** True until the first catalogue read finishes, so empty states can wait. */
  isCatalogueLoading: boolean;
  /** True when the archive is stored in this browser instead of a backend. */
  isOfflineMode: boolean;

  // Authentication
  authStatus: 'loading' | 'signed_out' | 'signed_in';
  authEmail: string | null;
  authUserId: string | null;
  authError: string | null;
  isAuthenticated: boolean;
  /** Which form the sign-in view opens with, so "Create account" lands on sign-up. */
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  /** True when signing in/up is only simulated because the backend is absent. */
  isOfflineAuth: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string, requestedRole?: UserRole) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;

  // Actions
  toggleSaveRecording: (recordingId: string) => void;
  submitSongEdit: (recordingId: string, form: { title: string; year: string; composer: string; history: string; sources: string; explanation: string }) => void;
  addMusicianToRecording: (recordingId: string, musicianName: string, role: string, instrument: string) => void;
  addSoloistToRecording: (recordingId: string, musicianName: string, role: string, instrument: string, isSoloist: boolean, soloOrder: number, solos?: { startSec: number; endSec: number; label?: string }[], notes?: string, sourceId?: string) => void;
  updateMusicianCredit: (recordingId: string, musicianId: string, updates: Partial<MusicianCredit>) => void;
  addSourceToRecording: (recordingId: string, sourceTitle: string, sourceType: any, notes: string) => void;
  addHistoricalParagraph: (recordingId: string, paragraph: string, sourceCitation: string) => void;
  addLyricsToRecording: (recordingId: string, lyrics: string, translation: string, language?: string) => void;
  addLyricsVersionToRecording: (recordingId: string, language: string, isOriginal: boolean, isTranslation: boolean, translationOfId?: string, lines?: LyricLine[], lyricist?: string, transcribedBy?: string, sourceId?: string, isInstrumental?: boolean) => void;
  addTriviaToRecording: (recordingId: string, triviaText: string, citation?: string) => void;
  addAlternateVersionToRecording: (recordingId: string, title: string, band: string, year: number, label?: string) => void;
  addTalkComment: (recordingId: string, topic: string, comment: string) => void;
  updateMusicianBio: (musicianId: string, biography: string, instrument?: string) => void;
  updateBandHistory: (bandId: string, history: string, newMember?: { name: string; role: string; instrument: string }) => void;
  createArticle: (article: { type: 'song' | 'musician' | 'band'; title: string; country: string; region: string; genre: string; year: number; story: string; composerOrLeader?: string; instruments?: string; citations?: string }) => void;
  submitNewRecording: (
    data: Partial<Recording>,
    rightsDeclaration: string,
    sources: string,
    audioFile: File | null,
    onStageChange?: (stage: 'uploading_audio' | 'publishing') => void
  ) => Promise<boolean>;
  submitProblemReport: (data: { targetRecordingId: string; targetTitle: string; reason: string; notes: string; email: string }) => void;
  reviewSubmission: (submissionId: string, decision: 'approve' | 'reject' | 'evidence_requested', note?: string) => Promise<void>;
  getSubmissionAudioPreviewUrl: (path: string) => Promise<string | null>;
  resolveCopyrightCase: (caseId: string, action: 'restricted' | 'resolved' | 'dismissed') => void;

  // Toast / System Notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const BanjoContext = createContext<BanjoContextType | null>(null);

function musiciansFromSubmission(serialized: string | undefined, submissionId: string): MusicianCredit[] {
  if (!serialized) return [];
  try {
    const candidates: unknown = JSON.parse(serialized);
    if (!Array.isArray(candidates)) return [];
    return candidates.flatMap((candidate, index) => {
      if (!candidate || typeof candidate !== 'object') return [];
      const credit = candidate as Partial<MusicianCredit>;
      const musicianName = typeof credit.musicianName === 'string' ? credit.musicianName.trim() : '';
      if (!musicianName) return [];
      return [{
        musicianId: `${submissionId}-credit-${index}`,
        musicianName,
        instrument: typeof credit.instrument === 'string' ? credit.instrument : '',
        role: typeof credit.role === 'string' ? credit.role : 'Performer',
      }];
    });
  } catch {
    return [];
  }
}

export const BanjoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation stack
  const [navHistory, setNavHistory] = useState<NavigationState[]>([{ tab: 'home' }]);
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  // Nothing is selected until the catalogue says what exists: the archive ships
  // empty and is filled by the people who contribute to it.
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [selectedOralHistoryId, setSelectedOralHistoryId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isDataSaver, setIsDataSaverState] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [playQueue, setPlayQueue] = useState<Recording[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'songs' | 'artists' | 'bands' | 'musicians' | 'albums' | 'history'>('all');

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);
  const [isAddDetailModalOpen, setIsAddDetailModalOpen] = useState(false);
  const [isCreateArticleModalOpen, setIsCreateArticleModalOpen] = useState(false);
  const [activeDiffRevision, setActiveDiffRevision] = useState<{ recording: Recording; revision: Revision } | null>(null);
  const [quickEditTarget, setQuickEditTarget] = useState<{ recordingId: string; section: string; currentText?: string } | null>(null);

  // Mobile View Preferences (Mobile-First Shell)

  const openQuickEdit = useCallback((recordingId: string, section: string, currentText?: string) => {
    setQuickEditTarget({ recordingId, section, currentText });
    setIsAddDetailModalOpen(true);
  }, []);

  const closeQuickEdit = useCallback(() => {
    setQuickEditTarget(null);
    setIsAddDetailModalOpen(false);
  }, []);

  // Archival Data State — every one of these starts empty and is filled from
  // the backend (or, offline, from this browser's own store). There is no seed.
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [songs, setSongs] = useState<SongComposition[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [oralHistories, setOralHistories] = useState<OralHistory[]>([]);
  const [documents, setDocuments] = useState<HistoricalDocument[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [copyrightCases, setCopyrightCases] = useState<CopyrightCase[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [activeRole, setActiveRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isCatalogueLoading, setIsCatalogueLoading] = useState<boolean>(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ---- Authentication ----------------------------------------------------
  // The session is the real gate. `activeRole` is only ever a *view* of the
  // signed-in account's role: it starts at the least-privileged default and is
  // clamped on every change, so an elevated role cannot be set from the client.
  const [authStatus, setAuthStatus] = useState<'loading' | 'signed_out' | 'signed_in'>('loading');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOfflineAuth, setIsOfflineAuth] = useState<boolean>(!isSupabaseConfigured);

  const isAuthenticated = authStatus === 'signed_in';

  // The last profile we wrote (or read), so the write-back effect below cannot
  // loop and a freshly loaded profile is not immediately re-saved.
  const savedProfileRef = useRef<string>('');
  const authUserIdRef = useRef<string | null>(null);

  const setAuthenticatedIdentity = useCallback((userId: string | null, email: string | null) => {
    if (authUserIdRef.current !== userId) {
      authUserIdRef.current = userId;
      savedProfileRef.current = '';
      setLocalUserScope(userId);
      setUserProfile(EMPTY_PROFILE);
      setActiveRoleState(DEFAULT_ROLE);
      setSubmissions([]);
      setAuditLogs([]);
      setCopyrightCases([]);
    }
    setAuthUserId(userId);
    setAuthEmail(email);
  }, []);

  /** The only way the profile changes: counters, library and edits alike. */
  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  // Every profile change is written back to the account's own row. A signed-out
  // visitor has no row, so nothing is written until they sign in.
  useEffect(() => {
    if (!authUserId || userProfile.id !== authUserId) return;
    const snapshot = JSON.stringify(userProfile);
    if (snapshot === savedProfileRef.current) return;
    savedProfileRef.current = snapshot;
    void saveProfile(authUserId, userProfile);
  }, [authUserId, userProfile]);

  const setActiveRole = useCallback(
    (role: UserRole) => {
      if (isLocalMode && (canSelfAssign(role) || isElevated(activeRole))) {
        setActiveRoleState(role);
        updateProfile({ role });
      }
    },
    [activeRole, updateProfile]
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Restore an existing session on mount, and keep it in sync.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthStatus('signed_out');
      setLocalUserScope(null);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      setAuthenticatedIdentity(user?.id ?? null, user?.email ?? null);
      setAuthStatus(user ? 'signed_in' : 'signed_out');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthenticatedIdentity(user?.id ?? null, user?.email ?? null);
      setAuthStatus(user ? 'signed_in' : 'signed_out');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setAuthenticatedIdentity]);

  // A signed-in account gets its own profile row; a missing one is created on
  // first sight. This is the only place a profile is attached to an account, so
  // two accounts can never end up showing each other's data. A signed-out
  // visitor sees an empty profile, never a stand-in.
  useEffect(() => {
    if (!authUserId) {
      savedProfileRef.current = '';
      setUserProfile(EMPTY_PROFILE);
      setActiveRoleState(DEFAULT_ROLE);
      return;
    }

    let active = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const profile = await ensureProfile(
        authUserId,
        user?.email ?? authEmail ?? '',
        (user?.user_metadata?.display_name as string) || '',
        (user?.user_metadata?.requested_role as UserRole) || DEFAULT_ROLE
      );

      if (!active || !profile) return;
      savedProfileRef.current = JSON.stringify(profile);
      setUserProfile(profile);
      setActiveRoleState(profile.role);
    })();

    return () => {
      active = false;
    };
  }, [authUserId, authEmail]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);

    if (!isSupabaseConfigured) {
      // Offline fallback so the flows stay usable without a backend. This is
      // a local-only session and grants no real access.
      setIsOfflineAuth(true);
      const normalizedEmail = email.trim().toLowerCase();
      setAuthenticatedIdentity(`local:${encodeURIComponent(normalizedEmail)}`, normalizedEmail);
      setAuthStatus('signed_in');
      return true;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setAuthError(
        error.message === 'Invalid login credentials'
          ? 'That email and password do not match an account.'
          : error.message
      );
      return false;
    }

    setAuthenticatedIdentity(data.user?.id ?? null, data.user?.email ?? null);
    setAuthStatus('signed_in');
    return true;
  }, [setAuthenticatedIdentity]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);

    if (!isSupabaseConfigured) {
      setAuthError('Google sign-in requires a configured archive backend.');
      return false;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });

      if (error) {
        setAuthError(error.message);
        return false;
      }

      return true;
    } catch {
      setAuthError('Google sign-in could not be started. Please try again.');
      return false;
    }
  }, []);

  // The role chosen at sign-up travels with the account as metadata and becomes
  // the role on its own profile row — never anybody else's, and never elevated.
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      requestedRole: UserRole = DEFAULT_ROLE
    ) => {
      setAuthError(null);

      const role = canSelfAssign(requestedRole) ? requestedRole : DEFAULT_ROLE;

      if (!isSupabaseConfigured) {
        setIsOfflineAuth(true);
        const normalizedEmail = email.trim().toLowerCase();
        setAuthenticatedIdentity(`local:${encodeURIComponent(normalizedEmail)}`, normalizedEmail);
        setAuthStatus('signed_in');
        return true;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            // Recorded as metadata only. The granted role lives in `user_roles`
            // and is assigned by an administrator, never by the person signing up.
            requested_role: role,
          },
        },
      });

      if (error) {
        setAuthError(
          error.message === 'User already registered'
            ? 'An account already exists for that email. Try signing in.'
            : error.message
        );
        return false;
      }

      // With email confirmation on, there is no session until the link is used.
      if (!data.session) {
        setAuthError('Check your email to confirm the account, then sign in.');
        return false;
      }

      setAuthenticatedIdentity(data.user?.id ?? null, data.user?.email ?? null);
      setAuthStatus('signed_in');
      return true;
    },
    [setAuthenticatedIdentity]
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthenticatedIdentity(null, null);
    setAuthStatus('signed_out');
  }, [setAuthenticatedIdentity]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // Load the archive on mount: the catalogue is public, the moderation
  // workspace needs an account (and simply comes back empty without one).
  useEffect(() => {
    let isMounted = true;

    async function loadArchive() {
      try {
        const [catalogue, backendReady] = await Promise.all([
          loadCatalogue(),
          probeBackend(),
        ]);

        if (!isMounted) return;

        setRecordings(catalogue.recordings);
        setSongs(catalogue.songs);
        setMusicians(catalogue.musicians);
        setBands(catalogue.bands);
        setAlbums(catalogue.albums);
        setOralHistories(catalogue.oralHistories);
        setDocuments(catalogue.documents);
        setIsBackendConnected(backendReady);
      } catch (error) {
        if (!isMounted) return;
        console.error('Could not load the archive catalogue:', error);
        setIsBackendConnected(false);
        showToast('Could not load the archive. Check the Supabase connection and confirm the app SQL setup is applied.');
      } finally {
        if (isMounted) setIsCatalogueLoading(false);
      }
    }

    void loadArchive();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    if (!isLocalMode && !authUserId) {
      setSubmissions([]);
      setAuditLogs([]);
      setCopyrightCases([]);
      return;
    }

    void loadModeration().then((moderation) => {
      if (!isMounted) return;
      setSubmissions(moderation.submissions);
      setAuditLogs(moderation.auditLogs);
      setCopyrightCases(moderation.copyrightCases);
    });

    return () => {
      isMounted = false;
    };
  }, [authUserId]);

  // ---- Catalogue write-through -------------------------------------------
  // Every edit marks the entity it touched; the effect below then writes that
  // entity to the backend (or to this browser's store when running offline), so
  // a contribution survives the next reload. Reads only ever come from the
  // backend — nothing is seeded and nothing lives only in memory.
  const dirtyCatalogue = useRef<Map<ArchiveKind, Set<string>>>(new Map());

  const markCatalogueChanged = useCallback((kind: ArchiveKind, id: string) => {
    const pending = dirtyCatalogue.current.get(kind) ?? new Set<string>();
    pending.add(id);
    dirtyCatalogue.current.set(kind, pending);
  }, []);

  useEffect(() => {
    if (isCatalogueLoading) return;
    const pending = dirtyCatalogue.current;
    if (pending.size === 0) return;

    const lookup: Record<ArchiveKind, { id: string }[]> = {
      recording: recordings,
      song: songs,
      musician: musicians,
      band: bands,
      album: albums,
      oral_history: oralHistories,
      document: documents,
    };

    dirtyCatalogue.current = new Map();
    void (async () => {
      let failed = false;
      for (const [kind, ids] of pending) {
        for (const id of ids) {
          const entity = lookup[kind].find((candidate) => candidate.id === id);
          if (entity && !(await saveArchiveItem(kind, entity))) failed = true;
        }
      }
      if (!failed) return;
      try {
        const catalogue = await loadCatalogue();
        setRecordings(catalogue.recordings);
        setSongs(catalogue.songs);
        setMusicians(catalogue.musicians);
        setBands(catalogue.bands);
        setAlbums(catalogue.albums);
        setOralHistories(catalogue.oralHistories);
        setDocuments(catalogue.documents);
      } catch {
        setToastMessage('A change could not be saved and the archive could not be refreshed.');
        return;
      }
      setToastMessage('A change was not authorized or could not be saved; displayed data was refreshed.');
    })();
  }, [recordings, songs, musicians, bands, albums, oralHistories, documents, isCatalogueLoading]);

  // Name, bio and avatar: the three fields the "Edit profile" form owns. They
  // land on the signed-in account's own row and nowhere else.
  const saveProfileDetails = useCallback(
    (patch: Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl'>) => {
      updateProfile({
        displayName: patch.displayName.trim() || userProfile.displayName,
        bio: patch.bio.trim(),
        avatarUrl: patch.avatarUrl.trim(),
      });
      showToast('Profile updated');
    },
    [showToast]
  );

  // Configure Audio Engine listeners on mount
  useEffect(() => {
    audioEngine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      setDuration(dur);
    });

    audioEngine.onEnded(() => {
      setIsPlaying(false);
      nextTrack();
    });

    return () => {
      audioEngine.stop();
    };
  }, []);

  // Navigation handlers
  const navigateTo = useCallback(
    (tab: MainNavTab, ids?: { songId?: string; musicianId?: string; bandId?: string; oralHistoryId?: string; documentId?: string }) => {
      setNavHistory((prev) => [...prev, { tab, ...ids }]);
      setActiveTab(tab);
      if (ids?.songId) setSelectedSongId(ids.songId);
      if (ids?.musicianId) setSelectedMusicianId(ids.musicianId);
      if (ids?.bandId) setSelectedBandId(ids.bandId);
      if (ids?.oralHistoryId) setSelectedOralHistoryId(ids.oralHistoryId);
      if (ids?.documentId) setSelectedDocumentId(ids.documentId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  // ---- Contribution gate ---------------------------------------------------
  // Reading the archive is open to everyone; writing to it is not (doc 05 §4.1).
  // Every contribution entry point — the header "Add +", the sidebar "Record
  // submission", the inline "Add details" buttons on song/musician/band pages and
  // the mobile contribute sheet — reaches the UI through openQuickEdit or the
  // create-article modal below, so one check here keeps an anonymous visitor out of
  // a form they could never submit. They are sent to the sign-in view instead, which
  // carries the "Create one" path to registration, and the toast says why.
  const requireAccount = useCallback(() => {
    if (isAuthenticated) return true;

    setAuthMode('signin');
    showToast('Sign in or create an account to contribute.');
    navigateTo('signin');
    return false;
  }, [isAuthenticated, navigateTo, showToast]);

  // Exposed as `openQuickEdit`. Registered contributors go straight through.
  const openContributionForm = useCallback(
    (recordingId: string, section: string, currentText?: string) => {
      if (!requireAccount()) return;
      openQuickEdit(recordingId, section, currentText);
    },
    [openQuickEdit, requireAccount]
  );

  // Exposed as `setIsCreateArticleModalOpen`. Closing is never gated — the modal
  // itself calls this with `false`, and so does the publish handler.
  const setCreateArticleModalOpen = useCallback(
    (open: boolean) => {
      if (open && !requireAccount()) return;
      setIsCreateArticleModalOpen(open);
    },
    [requireAccount]
  );

  const goBack = useCallback(() => {
    if (navHistory.length > 1) {
      const newHistory = [...navHistory];
      newHistory.pop();
      const prev = newHistory[newHistory.length - 1];
      setNavHistory(newHistory);
      setActiveTab(prev.tab);
      if (prev.songId) setSelectedSongId(prev.songId);
      if (prev.musicianId) setSelectedMusicianId(prev.musicianId);
      if (prev.bandId) setSelectedBandId(prev.bandId);
      if (prev.oralHistoryId) setSelectedOralHistoryId(prev.oralHistoryId);
      if (prev.documentId) setSelectedDocumentId(prev.documentId);
    }
  }, [navHistory]);

  const canGoBack = navHistory.length > 1;

  // Playback control
  const playSong = useCallback((recording: Recording, queueList?: Recording[]) => {
    if (!recording.audioUrl) {
      audioEngine.stop();
      setIsPlaying(false);
      showToast('Audio is not available for this archive entry.');
      return;
    }
    setCurrentRecording(recording);
    if (queueList) {
      setPlayQueue(queueList);
    }
    void audioEngine.play(recording.audioUrl, recording.duration, 0).then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
      showToast('Playback failed. The audio may be unavailable or unsupported.');
    });
    setCurrentTime(0);
    setDuration(recording.duration);
  }, [showToast]);

  const playOralHistory = useCallback((oralHistory: OralHistory) => {
    // Create transient recording wrapper for oral history so mini-player can play it
    const oralRecording: Recording = {
      id: oralHistory.id,
      songId: 'oral-interview',
      title: oralHistory.title,
      recordingTitle: `${oralHistory.interviewee} (Interviewed by ${oralHistory.interviewer})`,
      artistOrBand: oralHistory.interviewee,
      releaseYear: 2026,
      country: 'East Africa',
      region: oralHistory.location,
      language: 'English & Swahili',
      genre: 'Oral History Archive',
      label: 'Banjo Field Sound Trust',
      composer: oralHistory.interviewee,
      lyricist: 'Spoken Testimony',
      producer: oralHistory.interviewer,
      studio: 'Field Recording Unit',
      recordingLocation: oralHistory.location,
      duration: 360,
      audioQuality: 'Unknown',
      audioSampleType: oralHistory.audioSampleType,
      audioUrl: oralHistory.audioUrl,
      rightsStatus: 'permission_granted',
      rightsDeclaration: 'Recorded with oral interview release agreement for open digital preservation.',
      verificationStatus: 'rights_holder_verified',
      coverImage: oralHistory.photoUrl,
      story: oralHistory.summary,
      recordingHistory: [`Recorded on ${oralHistory.date} in ${oralHistory.location}`],
      musicians: [],
      instruments: ['Microphone', 'Spoken Word'],
      sources: oralHistory.sources,
      revisions: [],
      waveformPoints: [15, 45, 60, 30, 80, 75, 40, 60, 90, 85, 30, 70, 50, 65, 40, 30, 60, 70, 40, 20],
      playsCount: 310,
      createdAt: oralHistory.date,
      updatedAt: oralHistory.date,
    };

    if (!oralHistory.audioUrl) {
      showToast('Audio is not available for this oral history.');
      return;
    }
    setCurrentRecording(oralRecording);
    void audioEngine.play(oralHistory.audioUrl, 360, 0).then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
      showToast('Playback failed. The audio may be unavailable or unsupported.');
    });
    setCurrentTime(0);
    setDuration(360);
  }, [showToast]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (currentRecording) {
        void audioEngine.play(currentRecording.audioUrl || '', currentRecording.duration).then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          showToast('Audio is not available for this archive entry.');
        });
      }
    }
  }, [isPlaying, currentRecording, showToast]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const nextTrack = useCallback(() => {
    if (!currentRecording || playQueue.length === 0) return;
    const currentIndex = playQueue.findIndex((r) => r.id === currentRecording.id);
    const nextIndex = (currentIndex + 1) % playQueue.length;
    playSong(playQueue[nextIndex]);
  }, [currentRecording, playQueue, playSong]);

  const prevTrack = useCallback(() => {
    if (!currentRecording || playQueue.length === 0) return;
    const currentIndex = playQueue.findIndex((r) => r.id === currentRecording.id);
    const prevIndex = (currentIndex - 1 + playQueue.length) % playQueue.length;
    playSong(playQueue[prevIndex]);
  }, [currentRecording, playQueue, playSong]);

  const setSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    audioEngine.setSpeed(speed);
  }, []);

  const setDataSaver = useCallback((enabled: boolean) => {
    setIsDataSaverState(enabled);
    audioEngine.setDataSaver(enabled);
    showToast(enabled ? 'Data Saver Active: Low-bandwidth audio profile enabled.' : 'Standard Quality: High-resolution audio profile active.');
  }, [showToast]);

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = window.localStorage.getItem('banjo-theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('banjo-theme', theme);
    } catch {
      return;
    }
  }, [theme]);

  const setTheme = useCallback((next: 'light' | 'dark') => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    []
  );

  const openDiffViewer = useCallback((recording: Recording, revision: Revision) => {
    setActiveDiffRevision({ recording, revision });
    setIsDiffViewerOpen(true);
  }, []);

  // Save / Bookmark
  const toggleSaveRecording = useCallback((recordingId: string) => {
    const exists = userProfile.savedRecordingIds.includes(recordingId);
    const updated = exists
      ? userProfile.savedRecordingIds.filter((id) => id !== recordingId)
      : [...userProfile.savedRecordingIds, recordingId];
    showToast(exists ? 'Removed from saved collection' : 'Saved to personal archive collection');
    updateProfile({ savedRecordingIds: updated });
  }, [showToast]);

  // Submit edit suggestion
  const submitSongEdit = useCallback(
    (recordingId: string, form: { title: string; year: string; composer: string; history: string; sources: string; explanation: string }) => {
      const targetRecording = recordings.find((r) => r.id === recordingId);
      if (!targetRecording) return;

      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        contributorId: authUserId || undefined,
        type: 'edit',
        title: `Suggested edit for ${targetRecording.title}`,
        targetId: recordingId,
        contributorName: userProfile.displayName,
        contributorEmail: userProfile.email,
        submittedAt: new Date().toISOString(),
        category: 'Metadata & Historical Narrative',
        priority: 'normal',
        status: 'pending',
        rightsDeclaration: 'Historical contributor verification assertion under Banjo Contributor Guidelines.',
        currentData: {
          title: targetRecording.title,
          releaseYear: String(targetRecording.releaseYear),
          composer: targetRecording.composer,
          story: targetRecording.story.slice(0, 150) + '...',
        },
        proposedData: {
          title: form.title,
          releaseYear: form.year,
          composer: form.composer,
          story: form.history,
        },
        sourcesProvided: form.sources,
        reviewNotes: form.explanation,
      };

      setSubmissions((prev) => [newSubmission, ...prev]);
      void insertSubmission(newSubmission);
      updateProfile({
        editsSubmitted: userProfile.editsSubmitted + 1,
        contributionsCount: userProfile.contributionsCount + 1,
        pendingReview: userProfile.pendingReview + 1,
      });

      showToast('Edit submitted! Under review by Banjo Archivists.');
      setIsEditModalOpen(false);
    },
    [recordings, userProfile, showToast]
  );

  /// Banjo-style addition of Musician credit to recording
  const addMusicianToRecording = useCallback(
    (recordingId: string, musicianName: string, role: string, instrument: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const newMusician = {
              musicianId: `mus-${Date.now()}`,
              musicianName,
              role,
              instrument,
            };
            const updatedMusicians = [...rec.musicians, newMusician];
            const updatedInstruments = Array.from(new Set([...rec.instruments, instrument]));

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added musician credit: ${musicianName} on ${instrument}`,
              changes: [
                {
                  field: 'musicians',
                  previous: `${rec.musicians.length} musicians credited`,
                  proposed: `Added ${musicianName} (${role}, ${instrument})`,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              musicians: updatedMusicians,
              instruments: updatedInstruments,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast(`Musician credit added: ${musicianName} (${instrument})`);
    },
    [userProfile, showToast]
  );

  // Add a soloist credit to a recording with solo span info
  const addSoloistToRecording = useCallback(
    (recordingId: string, musicianName: string, role: string, instrument: string, isSoloist: boolean, soloOrder: number, solos?: { startSec: number; endSec: number; label?: string }[], notes?: string, sourceId?: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const newMusician = {
              musicianId: `mus-${Date.now()}`,
              musicianName,
              role,
              instrument,
              isSoloist,
              soloOrder,
              solos: solos || [],
              notes,
              sourceId,
            };
            const updatedMusicians = [...rec.musicians, newMusician];
            const updatedInstruments = Array.from(new Set([...rec.instruments, instrument]));

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added soloist credit: ${musicianName} (${instrument}) ${isSoloist ? 'solo' : ''}`,
              changes: [
                {
                  field: 'musicians',
                  previous: `${rec.musicians.length} musicians credited`,
                  proposed: `Added ${musicianName} (${role}, ${instrument}) ${isSoloist ? 'soloist' : ''}`,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              musicians: updatedMusicians,
              instruments: updatedInstruments,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast(`Soloist credit added: ${musicianName} (${instrument})`);
    },
    [userProfile, showToast]
  );

  // Update an existing musician credit on a recording
  const updateMusicianCredit = useCallback(
    (recordingId: string, musicianId: string, updates: Partial<MusicianCredit>) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const musicianToUpdate = rec.musicians.find((m) => m.musicianId === musicianId);
            const updatedMusicians = rec.musicians.map((m: MusicianCredit) =>
              m.musicianId === musicianId ? { ...m, ...updates } : m
            );

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Updated musician credit for ${updates.musicianName || musicianToUpdate?.musicianName || 'unknown'}`,
              changes: [
                {
                  field: 'musicians',
                  previous: `${rec.musicians.length} musicians credited`,
                  proposed: `Updated credit for ${updates.musicianName || musicianToUpdate?.musicianName || 'unknown'}`,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              musicians: updatedMusicians,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast('Musician credit updated');
    },
    [userProfile]
  );

  // Direct addition of Lyrics & Translation (enhanced with lyricsVersions)
  const addLyricsToRecording = useCallback(
    (recordingId: string, lyrics: string, translation: string, language?: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added lyrics and English translation (${language || rec.language})`,
              changes: [
                {
                  field: 'lyrics',
                  previous: rec.lyrics ? 'Previous lyrics excerpt' : 'No lyrics documented',
                  proposed: 'Added full native lyrics and translation',
                },
                {
                  field: 'lyricsTranslation',
                  previous: rec.lyricsTranslation || 'No translation provided',
                  proposed: translation,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              lyrics,
              lyricsTranslation: translation,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast('Lyrics & translation published to encyclopedia!');
    },
    [userProfile, showToast]
  );

  // Add a full LyricsVersion to a recording (multi-language support)
  const addLyricsVersionToRecording = useCallback(
    (recordingId: string, language: string, isOriginal: boolean, isTranslation: boolean, translationOfId?: string, lines?: LyricLine[], lyricist?: string, transcribedBy?: string, sourceId?: string, isInstrumental?: boolean) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added lyrics version in ${language} ${isTranslation ? '(translation)' : ''}`,
              changes: [
                {
                  field: 'lyricsVersions',
                  previous: rec.lyricsVersions ? `${rec.lyricsVersions.length} version(s) documented` : 'No lyrics versions',
                  proposed: `Added lyrics version in ${language}`,
                },
              ],
              status: 'approved',
            };

            const updatedLyricsVersions = (rec.lyricsVersions || []).concat({
              id: `lyr-${Date.now()}`,
              language,
              isOriginal,
              isTranslation,
              translationOfId,
              lines: lines || [],
              lyricist,
              transcribedBy,
              sourceId,
              isInstrumental,
              updatedAt: new Date().toISOString(),
            });

            return {
              ...rec,
              lyricsVersions: updatedLyricsVersions,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast(`Lyrics version added: ${language}`);
    },
    [userProfile]
  );

  /// Banjo-style addition of Source/Citation to recording
  const addSourceToRecording = useCallback(
    (recordingId: string, sourceTitle: string, sourceType: any, notes: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const newSrc = {
              id: `src-${Date.now()}`,
              type: sourceType || 'Original record sleeve',
              title: sourceTitle,
              notes,
              year: new Date().getFullYear(),
            };

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added documentary citation: ${sourceTitle}`,
              changes: [
                {
                  field: 'sources',
                  previous: `${rec.sources.length} sources`,
                  proposed: `Added citation: ${sourceTitle}`,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              sources: [...rec.sources, newSrc],
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast(`Citation added: "${sourceTitle}"`);
    },
    [userProfile, showToast]
  );

  /// Banjo-style addition of Historical Narrative paragraph
  const addHistoricalParagraph = useCallback(
    (recordingId: string, paragraph: string, sourceCitation: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const updatedStory = `${rec.story}\n\n${paragraph}`;

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added historical paragraph with citation: ${sourceCitation}`,
              changes: [
                {
                  field: 'story',
                  previous: `${rec.story.slice(-60)}...`,
                  proposed: paragraph,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              story: updatedStory,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast('New historical details added to encyclopedia entry!');
    },
    [userProfile, showToast]
  );

  // Direct addition of Trivia / Historical Anecdote
  const addTriviaToRecording = useCallback(
    (recordingId: string, triviaText: string, citation?: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const currentTrivia = rec.trivia || [];
            const newTrivia = [...currentTrivia, citation ? `${triviaText} (Source: ${citation})` : triviaText];

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added cultural trivia / historical anecdote`,
              changes: [
                {
                  field: 'trivia',
                  previous: `${currentTrivia.length} entries`,
                  proposed: triviaText.slice(0, 80) + '...',
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              trivia: newTrivia,
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast('Historical anecdote published!');
    },
    [userProfile, showToast]
  );

  // Add Alternate Version / Lineage
  const addAlternateVersionToRecording = useCallback(
    (recordingId: string, title: string, band: string, year: number, label?: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const currentAlts = rec.alternateVersions || [];
            const newAlt = {
              id: `alt-${Date.now()}`,
              title,
              band,
              year,
              label,
            };

            const newRev: Revision = {
              id: `rev-${Date.now()}`,
              version: rec.revisions.length + 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Community Contributor',
              summary: `Added alternate recording version: "${title}" by ${band} (${year})`,
              changes: [
                {
                  field: 'alternateVersions',
                  previous: `${currentAlts.length} versions documented`,
                  proposed: `Added ${title} (${band}, ${year})`,
                },
              ],
              status: 'approved',
            };

            return {
              ...rec,
              alternateVersions: [...currentAlts, newAlt],
              revisions: [newRev, ...rec.revisions],
              updatedAt: new Date().toISOString(),
            };
          }
          return rec;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast(`Alternate version "${title}" added!`);
    },
    [userProfile, showToast]
  );

  // Add Talk / Discussion Comment
  const addTalkComment = useCallback(
    (recordingId: string, topic: string, comment: string) => {
      markCatalogueChanged('recording', recordingId);
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.id === recordingId) {
            const comments = rec.talkComments || [];
            const newComment = {
              id: `talk-${Date.now()}`,
              author: userProfile.displayName,
              date: new Date().toISOString().split('T')[0],
              topic,
              comment,
            };
            return {
              ...rec,
              talkComments: [newComment, ...comments],
            };
          }
          return rec;
        })
      );

      showToast('Discussion comment posted to Talk page!');
    },
    [userProfile, showToast]
  );

  // Update Musician Biography & Instrument
  const updateMusicianBio = useCallback(
    (musicianId: string, biography: string, instrument?: string) => {
      markCatalogueChanged('musician', musicianId);
      setMusicians((prev) =>
        prev.map((m) => {
          if (m.id === musicianId) {
            const instruments = instrument && !m.instruments.includes(instrument)
              ? [...m.instruments, instrument]
              : m.instruments;
            return {
              ...m,
              biography,
              instruments,
            };
          }
          return m;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast('Musician biography and credits updated!');
    },
    [userProfile, showToast]
  );

  // Update Band History & Lineup
  const updateBandHistory = useCallback(
    (bandId: string, history: string, newMember?: { name: string; role: string; instrument: string }) => {
      markCatalogueChanged('band', bandId);
      setBands((prev) =>
        prev.map((b) => {
          if (b.id === bandId) {
            const updatedTimeline = newMember
              ? [
                  ...b.membersTimeline,
                  {
                    period: `${b.formationYear}–present`,
                    musicianId: `mus-${Date.now()}`,
                    musicianName: newMember.name,
                    instrument: newMember.instrument,
                  },
                ]
              : b.membersTimeline;
            return {
              ...b,
              history,
              membersTimeline: updatedTimeline,
            };
          }
          return b;
        })
      );

      updateProfile({
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast('Band article updated with new history and personnel!');
    },
    [userProfile, showToast]
  );

  // Create brand new encyclopedia article (Song, Musician, or Band)
  const createArticle = useCallback(
    (data: {
      type: 'song' | 'musician' | 'band';
      title: string;
      country: string;
      region: string;
      genre: string;
      year: number;
      story: string;
      composerOrLeader?: string;
      instruments?: string;
      citations?: string;
    }) => {
      const generatedId = `${data.type}-${Date.now()}`;

      if (data.type === 'song') {
        const newSongComp: SongComposition = {
          id: `comp-${Date.now()}`,
          title: data.title,
          composer: data.composerOrLeader || '',
          lyricist: '',
          originYear: data.year,
          country: data.country,
          region: data.region,
          language: '',
          genre: data.genre,
          summary: data.story.slice(0, 180),
          recordingsCount: 1,
          primaryRecordingId: generatedId,
        };

        const instList = data.instruments
          ? data.instruments.split(',').map((s) => s.trim())
          : [];

        const newRec: Recording = {
          id: generatedId,
          songId: newSongComp.id,
          title: data.title,
          recordingTitle: data.title,
          artistOrBand: data.composerOrLeader || '',
          releaseYear: data.year,
          country: data.country,
          region: data.region,
          language: '',
          genre: data.genre,
          label: '',
          composer: data.composerOrLeader || '',
          lyricist: '',
          producer: '',
          studio: '',
          recordingLocation: `${data.region}, ${data.country}`,
          duration: 0,
          audioQuality: 'Unknown',
          audioSampleType: 'benga_fast',
          rightsStatus: 'rights_unknown',
          rightsDeclaration: 'No audio master was attached; rights have not been assessed.',
          verificationStatus: 'community_sourced',
          coverImage: generateThumbnail(data.title),
          story: data.story,
          recordingHistory: [`${data.year}: Metadata article submitted; no audio master attached.`],
          musicians: [],
          instruments: instList,
          sources: [
            {
              id: `src-${Date.now()}`,
              type: 'Community submission',
              title: data.citations || 'Community submission',
              year: data.year,
            },
          ],
          revisions: [
            {
              id: `rev-${Date.now()}`,
              version: 1,
              date: new Date().toISOString().split('T')[0],
              authorName: userProfile.displayName,
              authorRole: 'Article Creator',
              summary: `Created initial encyclopedia article for "${data.title}"`,
              changes: [
                {
                  field: 'article',
                  previous: 'Non-existent',
                  proposed: 'Initial article creation',
                },
              ],
              status: 'approved',
            },
          ],
          waveformPoints: [],
          playsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSongs((prev) => [newSongComp, ...prev]);
        markCatalogueChanged('song', newSongComp.id);
        setRecordings((prev) => [newRec, ...prev]);
        markCatalogueChanged('recording', newRec.id);
        setSelectedSongId(newRec.id);
        setActiveTab('song_detail');
      } else if (data.type === 'musician') {
        const newMusician: Musician = {
          id: generatedId,
          name: data.title,
          role: data.composerOrLeader || '',
          instruments: data.instruments ? data.instruments.split(',').map((s) => s.trim()).filter(Boolean) : [],
          birthYear: data.year,
          activeYears: String(data.year),
          country: data.country,
          region: data.region,
          biography: data.story,
          aliases: [],
          bands: [],
          participatedRecordingsCount: 0,
          photoUrl: generateThumbnail(data.title),
          verificationStatus: 'community_sourced',
          sources: [
            {
              id: `src-${Date.now()}`,
              type: 'Community submission',
              title: data.citations || 'Community submission',
              year: data.year,
            },
          ],
        };
        setMusicians((prev) => [newMusician, ...prev]);
        markCatalogueChanged('musician', newMusician.id);
        setSelectedMusicianId(newMusician.id);
        setActiveTab('musician_detail');
      } else if (data.type === 'band') {
        const newBand: Band = {
          id: generatedId,
          name: data.title,
          formationYear: data.year,
          country: data.country,
          region: data.region,
          genre: data.genre,
          overview: data.story.slice(0, 160) + '...',
          history: data.story,
          membersTimeline: [],
          photoUrl: generateThumbnail(data.title),
          recordingsCount: 0,
          albumsCount: 0,
          verificationStatus: 'community_sourced',
          sources: [
            {
              id: `src-${Date.now()}`,
              type: 'Community submission',
              title: data.citations || 'Field documentation',
              year: data.year,
            },
          ],
        };
        setBands((prev) => [newBand, ...prev]);
        markCatalogueChanged('band', newBand.id);
        setSelectedBandId(newBand.id);
        setActiveTab('band_detail');
      }

      updateProfile({
        songsSubmitted: userProfile.songsSubmitted + 1,
        contributionsCount: userProfile.contributionsCount + 1,
        editsApproved: userProfile.editsApproved + 1,
      });

      showToast(`"${data.title}" published to Banjo!`);
      setIsCreateArticleModalOpen(false);
    },
    [userProfile, showToast]
  );

  // Publish a new recording directly after the contributor declares its rights.
  const submitNewRecording = useCallback(
    async (
      data: Partial<Recording>,
      rightsDeclaration: string,
      sourcesProvided: string,
      audioFile: File | null,
      onStageChange?: (stage: 'uploading_audio' | 'publishing') => void
    ) => {
      if (isLocalMode) {
        showToast('Audio contributions require the configured online archive.');
        return false;
      }
      let audioPath: string | null = null;
      try {
        if (audioFile) {
          onStageChange?.('uploading_audio');
          audioPath = await uploadArchiveAudio(audioFile);
        }
      } catch {
        showToast('Audio upload failed. Check your connection and archive storage setup.');
        return false;
      }
      if (audioFile && !audioPath) {
        showToast('Audio upload failed. Check your connection and archive storage setup.');
        return false;
      }
      onStageChange?.('publishing');
      const recordingId = `rec-${crypto.randomUUID()}`;
      const createdAt = new Date().toISOString();
      const declaration = rightsDeclaration.toLowerCase();
      const rightsStatus: Recording['rightsStatus'] = declaration.includes('public domain')
        ? 'public_domain'
        : declaration.includes('own the recording')
          ? 'rights_holder_uploaded'
          : declaration.includes('represent the rights holder')
            ? 'licensed'
            : declaration.includes('permission')
              ? 'permission_granted'
              : 'rights_unknown';
      const title = data.title?.trim() || 'Untitled Historical Recording';
      const recording: Recording = {
        id: recordingId,
        songId: `song-${recordingId}`,
        title,
        recordingTitle: title,
        artistOrBand: data.artistOrBand?.trim() || '',
        albumTitle: data.albumTitle?.trim() || undefined,
        releaseYear: data.releaseYear ?? null,
        country: data.country?.trim() || '',
        region: data.region?.trim() || '',
        language: data.language?.trim() || '',
        genre: data.genre?.trim() || '',
        label: '',
        composer: data.composer?.trim() || '',
        lyricist: '',
        producer: data.producer?.trim() || '',
        studio: data.studio?.trim() || '',
        recordingLocation: [data.region?.trim(), data.country?.trim()].filter(Boolean).join(', '),
        duration: 0,
        audioQuality: 'Unknown',
        audioSampleType: 'unknown',
        audioUrl: audioPath ? getArchiveAudioUrl(audioPath) || undefined : undefined,
        audioStoragePath: audioPath || undefined,
        audioFileName: data.audioFileName || undefined,
        audioMimeType: data.audioMimeType || undefined,
        audioFileSize: data.audioFileSize || undefined,
        rightsStatus,
        rightsDeclaration,
        verificationStatus: 'community_sourced',
        coverImage: data.coverImage || generateThumbnail(title),
        story: data.story || '',
        recordingHistory: sourcesProvided ? [`Contributor source: ${sourcesProvided}`] : [],
        musicians: data.musicians || [],
        instruments: Array.from(new Set((data.musicians || []).map((credit) => credit.instrument).filter(Boolean))),
        sources: sourcesProvided
          ? [{ id: `src-${recordingId}`, type: 'Community submission', title: sourcesProvided }]
          : [],
        revisions: [],
        waveformPoints: [],
        playsCount: 0,
        createdAt,
        updatedAt: createdAt,
      };
      let saved = false;
      try {
        saved = await saveArchiveItem('recording', recording);
      } catch {
        saved = false;
      }
      if (!saved) {
        if (audioPath) await removeArchiveAudio(audioPath);
        showToast('Recording could not be published. Please try again.');
        return false;
      }
      setRecordings((prev) => [recording, ...prev]);

      updateProfile({
        songsSubmitted: userProfile.songsSubmitted + 1,
        contributionsCount: userProfile.contributionsCount + 1,
      });

      showToast('Recording published to the archive.');
      return true;
    },
    [userProfile, showToast]
  );

  // Submit problem / copyright report (Screen 33)
  const submitProblemReport = useCallback(
    (report: { targetRecordingId: string; targetTitle: string; reason: string; notes: string; email: string }) => {
      const isCopyright = report.reason.toLowerCase().includes('copyright');
      if (isCopyright) {
        const targetRecording = recordings.find((recording) => recording.id === report.targetRecordingId);
        const newCase: CopyrightCase = {
          id: `case-${Date.now()}`,
          caseNumber: `BANJO-CR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          recordingId: report.targetRecordingId,
          recordingTitle: report.targetTitle,
          artistOrBand: targetRecording?.artistOrBand || 'Disputed Entry',
          claimantName: report.email.split('@')[0] || 'Rights Claimant',
          claimantEmail: report.email,
          claimType: 'ownership',
          evidenceSummary: report.notes,
          filedDate: new Date().toISOString().split('T')[0],
          status: 'open',
        };
        setCopyrightCases((prev) => [newCase, ...prev]);
        void insertCopyrightCase(newCase);
      } else {
        // Public reports are stored separately from the trusted audit trail.
        const reportLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          who: report.email || 'Anonymous visitor',
          what: `Problem report: ${report.targetTitle}`,
          where: report.targetTitle,
          when: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          reason: `${report.reason} — ${report.notes}`,
        };
        setAuditLogs((prev) => [reportLog, ...prev]);
        void insertProblemReport({
          id: reportLog.id,
          targetTitle: report.targetTitle,
          reason: report.reason,
          notes: report.notes,
          email: report.email,
        });
      }

      showToast(isCopyright ? 'Rights claim filed for review.' : 'Archive issue report filed for review.');
      setIsReportModalOpen(false);
    },
    [recordings, showToast]
  );

  // Moderation action
  const reviewSubmission = useCallback(
    async (submissionId: string, decision: 'approve' | 'reject' | 'evidence_requested', note?: string) => {
      const sub = submissions.find((s) => s.id === submissionId);
      if (!sub) return;
      const pendingAudioPath = sub.proposedData.audioStoragePath;
      const decidedStatus: Submission['status'] =
        decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'evidence_requested';
      if (!(await updateSubmission(submissionId, decidedStatus, note || sub.reviewNotes || ''))) {
        showToast('Review decision could not be saved. No changes were applied.');
        return;
      }
      if (pendingAudioPath && decision === 'reject') await removePendingAudio(pendingAudioPath);

      const updatedSubmissions = submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'evidence_requested',
              reviewNotes: note || s.reviewNotes,
            }
          : s
      );
      setSubmissions(updatedSubmissions as Submission[]);

      // Append immutable audit log
      const newAuditLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        who: `${userProfile.displayName} (${activeRole})`,
        what: `Archivist Review: ${decision.toUpperCase()} on submission "${sub.title}"`,
        when: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        where: `Moderation Queue / ${sub.type}`,
        before: `status: ${sub.status}`,
        after: `status: ${decision}`,
        reason: note || 'Archivist verified documentary evidence and provenance.',
      };
      setAuditLogs((prev) => [newAuditLog, ...prev]);
      void insertAuditLog(newAuditLog);

      // If approved edit on recording, update live recording state
      if (decision === 'approve' && sub.type === 'edit') {
        const targetId = sub.targetId;
        if (targetId) markCatalogueChanged('recording', targetId);
        setRecordings((prev) =>
          prev.map((rec) => {
            if (targetId ? rec.id === targetId : rec.title === sub.currentData?.title) {
              const newRev: Revision = {
                id: `rev-${Date.now()}`,
                version: rec.revisions.length + 1,
                date: new Date().toISOString().split('T')[0],
                authorName: sub.contributorName,
                authorRole: 'Community Contributor',
                summary: `Approved edit: ${sub.title}`,
                changes: Object.entries(sub.proposedData).map(([field, val]) => ({
                  field,
                  previous: (sub.currentData && sub.currentData[field]) || 'Previous value',
                  proposed: val,
                })),
                status: 'approved',
              };

              return {
                ...rec,
                title: sub.proposedData.title || rec.title,
                composer: sub.proposedData.composer || rec.composer,
                story: sub.proposedData.story || rec.story,
                releaseYear: sub.proposedData.releaseYear && Number.isInteger(Number(sub.proposedData.releaseYear))
                  ? Number(sub.proposedData.releaseYear)
                  : rec.releaseYear,
                revisions: [newRev, ...rec.revisions],
                updatedAt: new Date().toISOString(),
              };
            }
            return rec;
          })
        );
      }

      if (decision === 'approve' && sub.type === 'recording') {
        const data = sub.proposedData;
        const recordingId = `rec-${sub.id}`;
        const createdAt = new Date().toISOString();
        const recording: Recording = {
          id: recordingId,
          songId: `song-${sub.id}`,
          title: data.title || sub.title,
          recordingTitle: data.title || sub.title,
          artistOrBand: data.artistOrBand || '',
          albumTitle: data.albumTitle || undefined,
          releaseYear: Number(data.releaseYear) || null,
          country: data.country || '',
          region: data.region || '',
          language: data.language || '',
          genre: data.genre || '',
          label: 'Community Submission',
          composer: data.composer || '',
          lyricist: '',
          producer: data.producer || '',
          studio: data.studio || '',
          recordingLocation: data.country || 'Kenya',
          duration: 0,
          audioQuality: 'Unknown',
          audioSampleType: 'benga_fast',
          audioStoragePath: data.audioStoragePath,
          audioFileName: data.audioFileName || undefined,
          audioMimeType: data.audioMimeType || undefined,
          audioFileSize: Number(data.audioFileSize) || undefined,
          rightsStatus: 'rights_unknown',
          rightsDeclaration: data.rightsDeclaration || sub.rightsDeclaration,
          verificationStatus: 'reviewed',
          coverImage: data.coverImage || '',
          story: data.story || '',
          recordingHistory: [`Published after review from ${sub.contributorName}`],
          musicians: musiciansFromSubmission(data.musicians, sub.id),
          instruments: Array.from(new Set(musiciansFromSubmission(data.musicians, sub.id).map((credit) => credit.instrument).filter(Boolean))),
          sources: sub.sourcesProvided
            ? [{ id: `src-${sub.id}`, type: 'Community submission', title: sub.sourcesProvided, notes: '' }]
            : [],
          revisions: [],
          waveformPoints: [],
          playsCount: 0,
          createdAt,
          updatedAt: createdAt,
        };
        setRecordings((prev) => [recording, ...prev]);
        markCatalogueChanged('recording', recordingId);
      }

      showToast(`Submission has been marked: ${decision.toUpperCase()}`);
    },
    [submissions, userProfile, activeRole, showToast, markCatalogueChanged]
  );

  const resolveCopyrightCase = useCallback(
    (caseId: string, action: 'restricted' | 'resolved' | 'dismissed') => {
      setCopyrightCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: action } : c))
      );
      void updateCopyrightCaseStatus(caseId, action);
      const caseItem = copyrightCases.find((c) => c.id === caseId);

      const newAuditLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        who: `${userProfile.displayName} (${activeRole})`,
        what: `Copyright Decision: ${action.toUpperCase()} for Case #${caseItem?.caseNumber || caseId}`,
        when: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        where: 'Rights Management Console',
        before: `status: ${caseItem?.status}`,
        after: `status: ${action}`,
        reason: `Legal determination made by Banjo Rights Desk. Recording stream permissions set to ${action}.`,
      };
      setAuditLogs((prev) => [newAuditLog, ...prev]);
      void insertAuditLog(newAuditLog);

      showToast(`Copyright Case #${caseItem?.caseNumber} updated to ${action.toUpperCase()}`);
    },
    [copyrightCases, userProfile, activeRole, showToast]
  );

  return (
    <BanjoContext.Provider
      value={{
        activeTab,
        selectedSongId,
        selectedMusicianId,
        selectedBandId,
        selectedOralHistoryId,
        selectedDocumentId,
        navigateTo,
        goBack,
        canGoBack,

        isPlaying,
        currentRecording,
        currentTime,
        duration,
        playbackSpeed,
        isDataSaver,
        isFullPlayerOpen,
        setIsFullPlayerOpen,
        playSong,
        playOralHistory,
        togglePlay,
        seek,
        nextTrack,
        prevTrack,
        setSpeed,
        setDataSaver,
        theme,
        setTheme,
        toggleTheme,

        searchQuery,
        setSearchQuery,
        searchFilter,
        setSearchFilter,

        isOnboardingOpen,
        setIsOnboardingOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isReportModalOpen,
        setIsReportModalOpen,
        isDiffViewerOpen,
        setIsDiffViewerOpen,
        activeDiffRevision,
        openDiffViewer,
        quickEditTarget,
        // Both are gated by requireAccount: signed-out visitors are routed to the
        // sign-in view rather than into a contribution form (see above).
        openQuickEdit: openContributionForm,
        closeQuickEdit,
        isAddDetailModalOpen,
        setIsAddDetailModalOpen,
        isCreateArticleModalOpen,
        setIsCreateArticleModalOpen: setCreateArticleModalOpen,

        recordings,
        songs,
        musicians,
        bands,
        oralHistories,
        documents,
        albums,
        submissions,
        copyrightCases,
        auditLogs,
        userProfile,
        updateProfile,
        saveProfileDetails,
        isEditProfileOpen,
        setIsEditProfileOpen,
        activeRole,
        setActiveRole,
        authStatus,
        authEmail,
        authUserId,
        authError,
        isAuthenticated,
        authMode,
        setAuthMode,
        isOfflineAuth,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        clearAuthError,

toggleSaveRecording,
         submitSongEdit,
         addMusicianToRecording,
         addSoloistToRecording,
         updateMusicianCredit,
         addSourceToRecording,
         addHistoricalParagraph,
         addLyricsToRecording,
         addLyricsVersionToRecording,
         addTriviaToRecording,
         addAlternateVersionToRecording,
         addTalkComment,
         updateMusicianBio,
         updateBandHistory,
         createArticle,
         submitNewRecording,
         submitProblemReport,
         reviewSubmission,
         getSubmissionAudioPreviewUrl: getPendingAudioPreviewUrl,
         resolveCopyrightCase,

        isBackendConnected,
        isCatalogueLoading,
        isOfflineMode: isLocalMode,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </BanjoContext.Provider>
  );
};

export const useBanjo = () => {
  const ctx = useContext(BanjoContext);
  if (!ctx) throw new Error('useBanjo must be used within a BanjoProvider');
  return ctx;
};
