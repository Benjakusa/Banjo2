import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import {
  INITIAL_RECORDINGS,
  INITIAL_SONGS,
  INITIAL_MUSICIANS,
  INITIAL_BANDS,
  INITIAL_ALBUMS,
  INITIAL_ORAL_HISTORIES,
  INITIAL_DOCUMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_COPYRIGHT_CASES,
  INITIAL_AUDIT_LOGS,
  CURRENT_USER_PROFILE,
} from '../data/mockArchiveData';
import { audioEngine } from '../utils/audioEngine';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_ROLE, canSelfAssign, isElevated } from '../lib/auth';

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
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isBackendConnected: boolean;

  // Authentication
  authStatus: 'loading' | 'signed_out' | 'signed_in';
  authEmail: string | null;
  authError: string | null;
  isAuthenticated: boolean;
  /** Which form the sign-in view opens with, so "Create account" lands on sign-up. */
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  /** True when signing in/up is only simulated because the backend is absent. */
  isOfflineAuth: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
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
  submitNewRecording: (data: Partial<Recording>, rightsDeclaration: string, sources: string) => void;
  submitProblemReport: (data: { targetTitle: string; reason: string; notes: string; email: string }) => void;
  reviewSubmission: (submissionId: string, decision: 'approve' | 'reject' | 'evidence_requested', note?: string) => void;
  resolveCopyrightCase: (caseId: string, action: 'restricted' | 'resolved' | 'dismissed') => void;

  // Toast / System Notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const BanjoContext = createContext<BanjoContextType | null>(null);

export const BanjoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation stack
  const [navHistory, setNavHistory] = useState<NavigationState[]>([{ tab: 'home' }]);
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [selectedSongId, setSelectedSongId] = useState<string | null>('rec-001');
  const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>('mus-peter-ochieng');
  const [selectedBandId, setSelectedBandId] = useState<string | null>('band-victoria-stars');
  const [selectedOralHistoryId, setSelectedOralHistoryId] = useState<string | null>('oral-001');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>('doc-001');

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(INITIAL_RECORDINGS[0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(INITIAL_RECORDINGS[0].duration);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isDataSaver, setIsDataSaverState] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [playQueue, setPlayQueue] = useState<Recording[]>(INITIAL_RECORDINGS);

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

  // Archival Data State
  const [recordings, setRecordings] = useState<Recording[]>(INITIAL_RECORDINGS);
  const [songs, setSongs] = useState<SongComposition[]>(INITIAL_SONGS);
  const [musicians, setMusicians] = useState<Musician[]>(INITIAL_MUSICIANS);
  const [bands, setBands] = useState<Band[]>(INITIAL_BANDS);
  const [oralHistories] = useState<OralHistory[]>(INITIAL_ORAL_HISTORIES);
  const [documents] = useState<HistoricalDocument[]>(INITIAL_DOCUMENTS);
  const [albums] = useState<Album[]>(INITIAL_ALBUMS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [copyrightCases, setCopyrightCases] = useState<CopyrightCase[]>(INITIAL_COPYRIGHT_CASES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(CURRENT_USER_PROFILE);
  const [activeRole, setActiveRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // ---- Authentication ----------------------------------------------------
  // The session is the real gate. `activeRole` is only ever a *view* of the
  // signed-in user's role: it starts at the least-privileged default and is
  // clamped on every change, so an elevated role cannot be set from the client.
  const [authStatus, setAuthStatus] = useState<'loading' | 'signed_out' | 'signed_in'>('loading');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOfflineAuth, setIsOfflineAuth] = useState<boolean>(!isSupabaseConfigured);

  const isAuthenticated = authStatus === 'signed_in';

  const setActiveRole = useCallback((role: UserRole) => {
    if (canSelfAssign(role) || isElevated(activeRole)) {
      setActiveRoleState(role);
    }
  }, [activeRole]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Restore an existing session on mount, and keep it in sync.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthStatus('signed_out');
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const email = data.session?.user?.email ?? null;
      setAuthEmail(email);
      setAuthStatus(email ? 'signed_in' : 'signed_out');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;
      setAuthEmail(email);
      setAuthStatus(email ? 'signed_in' : 'signed_out');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);

    if (!isSupabaseConfigured) {
      // Offline fallback so the flows stay usable without a backend. This is
      // a local-only session and grants no real access.
      setIsOfflineAuth(true);
      setAuthEmail(email.trim().toLowerCase());
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

    setAuthEmail(data.user?.email ?? null);
    setAuthStatus('signed_in');
    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setAuthError(null);

    if (!isSupabaseConfigured) {
      setIsOfflineAuth(true);
      setAuthEmail(email.trim().toLowerCase());
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
          requested_role: DEFAULT_ROLE,
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

    setAuthEmail(data.user?.email ?? null);
    setAuthStatus('signed_in');
    return true;
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthEmail(null);
    setAuthStatus('signed_out');
    setActiveRoleState(DEFAULT_ROLE);
  }, []);

  // Sync with the archive backend on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    async function fetchArchiveData() {
      try {
        const [subRes, auditRes, copyrightRes] = await Promise.all([
          supabase.from('app_submissions').select('*').order('created_at', { ascending: false }),
          supabase.from('app_audit_logs').select('*').order('created_at', { ascending: false }),
          supabase.from('app_copyright_cases').select('*').order('created_at', { ascending: false }),
        ]);

        if (!isMounted) return;

        if (subRes.data && subRes.data.length > 0) {
          const remoteSubs: Submission[] = subRes.data.map((row: any) => ({
            id: row.id,
            type: row.type,
            title: row.title,
            contributorName: row.contributor_name || 'Archivist Contributor',
            contributorEmail: row.contributor_email || '',
            targetId: row.target_id || undefined,
            targetTitle: row.target_title || undefined,
            targetType: row.target_type || undefined,
            category: 'Archive Import',
            priority: (row.priority as any) || 'normal',
            status: (row.status as any) || 'pending',
            rightsDeclaration: '',
            submittedAt: row.created_at || new Date().toISOString(),
            currentData: row.current_data || {},
            proposedData: row.proposed_data || {},
            sourcesProvided: row.sources_provided || '',
            reviewNotes: row.review_notes || '',
          }));
          setSubmissions(remoteSubs);
        }

        if (auditRes.data && auditRes.data.length > 0) {
          const remoteAudit: AuditLogEntry[] = auditRes.data.map((row: any) => ({
            id: row.id,
            who: row.who,
            what: row.action,
            where: row.target,
            when: row.timestamp || row.created_at,
            reason: row.notes || undefined,
          }));
          setAuditLogs(remoteAudit);
        }

        if (copyrightRes.data && copyrightRes.data.length > 0) {
          const remoteCopyright: CopyrightCase[] = copyrightRes.data.map((row: any) => ({
            id: row.id,
            caseNumber: `BANJO-CR-${row.id.slice(0, 8)}`,
            recordingId: row.recording_id || 'rec-001',
            recordingTitle: row.recording_title || 'Disputed Recording',
            artistOrBand: row.artist_or_band || 'Disputed Artist',
            claimantName: row.claimant_name || 'Claimant',
            claimantEmail: row.claimant_email || '',
            claimType: (row.claim_type as any) || 'ownership',
            status: (row.status as any) || 'open',
            filedDate: row.filed_date || new Date().toISOString().split('T')[0],
            evidenceSummary: row.evidence || row.summary || '',
            assignedTo: row.assigned_to || undefined,
          }));
          setCopyrightCases(remoteCopyright);
        }

        setIsBackendConnected(true);
      } catch (err) {
        console.warn('Archive fetch failed, continuing with local state:', err);
      }
    }

    fetchArchiveData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

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
    setCurrentRecording(recording);
    if (queueList) {
      setPlayQueue(queueList);
    }
    audioEngine.play(recording.audioSampleType, recording.duration, 0);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(recording.duration);
  }, []);

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
      audioQuality: 'FLAC Master',
      audioSampleType: oralHistory.audioSampleType,
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

    setCurrentRecording(oralRecording);
    audioEngine.play(oralHistory.audioSampleType, 360, 0);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(360);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (currentRecording) {
        audioEngine.play(currentRecording.audioSampleType, currentRecording.duration);
        setIsPlaying(true);
      }
    }
  }, [isPlaying, currentRecording]);

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
    const stored = window.localStorage.getItem('banjo-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('banjo-theme', theme);
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
    setUserProfile((prev) => {
      const exists = prev.savedRecordingIds.includes(recordingId);
      const updated = exists
        ? prev.savedRecordingIds.filter((id) => id !== recordingId)
        : [...prev.savedRecordingIds, recordingId];
      showToast(exists ? 'Removed from saved collection' : 'Saved to personal archive collection');
      return { ...prev, savedRecordingIds: updated };
    });
  }, [showToast]);

  // Submit edit suggestion
  const submitSongEdit = useCallback(
    (recordingId: string, form: { title: string; year: string; composer: string; history: string; sources: string; explanation: string }) => {
      const targetRecording = recordings.find((r) => r.id === recordingId);
      if (!targetRecording) return;

      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        type: 'edit',
        title: `Suggested edit for ${targetRecording.title}`,
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
      if (isSupabaseConfigured) {
        supabase.from('app_submissions').insert({
          id: newSubmission.id,
          type: newSubmission.type,
          title: newSubmission.title,
          contributor_name: newSubmission.contributorName,
          contributor_email: newSubmission.contributorEmail,
          target_id: newSubmission.targetId,
          target_title: newSubmission.targetTitle,
          target_type: newSubmission.targetType,
          priority: newSubmission.priority,
          status: newSubmission.status,
          current_data: newSubmission.currentData,
          proposed_data: newSubmission.proposedData,
          sources_provided: newSubmission.sourcesProvided,
          review_notes: newSubmission.reviewNotes,
        }).then(({ error }) => {
          if (error) console.error('Error inserting edit submission:', error);
        });
      }
      setUserProfile((prev) => ({
        ...prev,
        editsSubmitted: prev.editsSubmitted + 1,
        contributionsCount: prev.contributionsCount + 1,
        pendingReview: prev.pendingReview + 1,
      }));

      showToast('Edit submitted! Under review by Banjo Archivists.');
      setIsEditModalOpen(false);
    },
    [recordings, userProfile, showToast]
  );

  /// Banjo-style addition of Musician credit to recording
  const addMusicianToRecording = useCallback(
    (recordingId: string, musicianName: string, role: string, instrument: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast(`Musician credit added: ${musicianName} (${instrument})`);
    },
    [userProfile, showToast]
  );

  // Add a soloist credit to a recording with solo span info
  const addSoloistToRecording = useCallback(
    (recordingId: string, musicianName: string, role: string, instrument: string, isSoloist: boolean, soloOrder: number, solos?: { startSec: number; endSec: number; label?: string }[], notes?: string, sourceId?: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast(`Soloist credit added: ${musicianName} (${instrument})`);
    },
    [userProfile, showToast]
  );

  // Update an existing musician credit on a recording
  const updateMusicianCredit = useCallback(
    (recordingId: string, musicianId: string, updates: Partial<MusicianCredit>) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast('Musician credit updated');
    },
    [userProfile]
  );

  // Direct addition of Lyrics & Translation (enhanced with lyricsVersions)
  const addLyricsToRecording = useCallback(
    (recordingId: string, lyrics: string, translation: string, language?: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast('Lyrics & translation published to encyclopedia!');
    },
    [userProfile, showToast]
  );

  // Add a full LyricsVersion to a recording (multi-language support)
  const addLyricsVersionToRecording = useCallback(
    (recordingId: string, language: string, isOriginal: boolean, isTranslation: boolean, translationOfId?: string, lines?: LyricLine[], lyricist?: string, transcribedBy?: string, sourceId?: string, isInstrumental?: boolean) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast(`Lyrics version added: ${language}`);
    },
    [userProfile]
  );

  /// Banjo-style addition of Source/Citation to recording
  const addSourceToRecording = useCallback(
    (recordingId: string, sourceTitle: string, sourceType: any, notes: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast(`Citation added: "${sourceTitle}"`);
    },
    [userProfile, showToast]
  );

  /// Banjo-style addition of Historical Narrative paragraph
  const addHistoricalParagraph = useCallback(
    (recordingId: string, paragraph: string, sourceCitation: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast('New historical details added to encyclopedia entry!');
    },
    [userProfile, showToast]
  );

  // Direct addition of Trivia / Historical Anecdote
  const addTriviaToRecording = useCallback(
    (recordingId: string, triviaText: string, citation?: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast('Historical anecdote published!');
    },
    [userProfile, showToast]
  );

  // Add Alternate Version / Lineage
  const addAlternateVersionToRecording = useCallback(
    (recordingId: string, title: string, band: string, year: number, label?: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast(`Alternate version "${title}" added!`);
    },
    [userProfile, showToast]
  );

  // Add Talk / Discussion Comment
  const addTalkComment = useCallback(
    (recordingId: string, topic: string, comment: string) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast('Musician biography and credits updated!');
    },
    [userProfile, showToast]
  );

  // Update Band History & Lineup
  const updateBandHistory = useCallback(
    (bandId: string, history: string, newMember?: { name: string; role: string; instrument: string }) => {
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

      setUserProfile((prev) => ({
        ...prev,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

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
          composer: data.composerOrLeader || 'Traditional / Community',
          lyricist: data.composerOrLeader || 'Traditional',
          originYear: data.year,
          country: data.country,
          region: data.region,
          language: 'Local African Dialect',
          genre: data.genre,
          summary: data.story.slice(0, 180) + '...',
          recordingsCount: 1,
          primaryRecordingId: generatedId,
        };

        const instList = data.instruments
          ? data.instruments.split(',').map((s) => s.trim())
          : ['Guitar', 'Percussion'];

        const newRec: Recording = {
          id: generatedId,
          songId: newSongComp.id,
          title: `${data.title} (${data.year})`,
          recordingTitle: `${data.title} — Original Recording`,
          artistOrBand: data.composerOrLeader || 'African Master Ensemble',
          releaseYear: data.year,
          country: data.country,
          region: data.region,
          language: 'Local African Dialect',
          genre: data.genre,
          label: 'Independent Cultural Archive Pressing',
          composer: data.composerOrLeader || 'Traditional',
          lyricist: data.composerOrLeader || 'Traditional',
          producer: 'Community Documented',
          studio: `${data.region} Historical Recording Session`,
          recordingLocation: `${data.region}, ${data.country}`,
          duration: 240,
          audioQuality: 'FLAC Master',
          audioSampleType: 'benga_fast',
          rightsStatus: 'public_domain',
          rightsDeclaration: 'Documented under Banjo Open Cultural Heritage Preservation.',
          verificationStatus: 'community_sourced',
          coverImage: '/src/assets/images/vintage_record_sleeve_1790502822184.jpg',
          story: data.story,
          recordingHistory: [`${data.year}: Original sound recording documented and preserved.`],
          musicians: [
            {
              musicianId: `mus-${Date.now()}`,
              musicianName: data.composerOrLeader || 'Lead Artist',
              instrument: instList[0] || 'Guitar',
              role: 'Lead Performer',
            },
          ],
          instruments: instList,
          sources: [
            {
              id: `src-${Date.now()}`,
              type: 'Community submission',
              title: data.citations || 'Banjo Archival Fieldwork Documentation',
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
          waveformPoints: [18, 30, 45, 60, 80, 95, 70, 50, 40, 65, 85, 90, 75, 55, 35, 20],
          playsCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSongs((prev) => [newSongComp, ...prev]);
        setRecordings((prev) => [newRec, ...prev]);
        setSelectedSongId(newRec.id);
        setActiveTab('song_detail');
      } else if (data.type === 'musician') {
        const newMusician: Musician = {
          id: generatedId,
          name: data.title,
          role: data.composerOrLeader || 'Master Musician',
          instruments: data.instruments ? data.instruments.split(',').map((s) => s.trim()) : ['Guitar'],
          birthYear: data.year,
          activeYears: `${data.year}–present`,
          country: data.country,
          region: data.region,
          biography: data.story,
          aliases: [],
          bands: [],
          participatedRecordingsCount: 1,
          photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
          verificationStatus: 'community_sourced',
          sources: [
            {
              id: `src-${Date.now()}`,
              type: 'Community submission',
              title: data.citations || 'Community oral account',
              year: data.year,
            },
          ],
        };
        setMusicians((prev) => [newMusician, ...prev]);
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
          membersTimeline: [
            {
              period: `${data.year}–present`,
              musicianId: `mus-${Date.now()}`,
              musicianName: data.composerOrLeader || 'Founding Musician',
              instrument: data.instruments || 'Lead Instrument',
              isFounder: true,
            },
          ],
          photoUrl: '/src/assets/images/benga_guitarist_vintage_1790502811387.jpg',
          recordingsCount: 1,
          albumsCount: 1,
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
        setSelectedBandId(newBand.id);
        setActiveTab('band_detail');
      }

      setUserProfile((prev) => ({
        ...prev,
        songsSubmitted: prev.songsSubmitted + 1,
        contributionsCount: prev.contributionsCount + 1,
        editsApproved: prev.editsApproved + 1,
      }));

      showToast(`"${data.title}" published to Banjo!`);
      setIsCreateArticleModalOpen(false);
    },
    [userProfile, showToast]
  );

  // Submit new recording (Screen 24-26)
  const submitNewRecording = useCallback(
    (data: Partial<Recording>, rightsDeclaration: string, sourcesProvided: string) => {
      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        type: 'recording',
        title: data.title || 'Untitled Historical Recording',
        contributorName: userProfile.displayName,
        contributorEmail: userProfile.email,
        submittedAt: new Date().toISOString(),
        category: 'New Music Recording',
        priority: 'high',
        status: 'pending',
        rightsDeclaration,
        proposedData: {
          title: data.title || '',
          artistOrBand: data.artistOrBand || '',
          releaseYear: String(data.releaseYear || 1978),
          country: data.country || 'Kenya',
          genre: data.genre || 'Benga',
          studio: data.studio || 'Nairobi Studio',
          composer: data.composer || '',
          // Media attached by the contributor, so a reviewer can see what was
          // actually supplied rather than inferring it from the metadata.
          coverImage: data.coverImage || '',
          audioFileName: data.audioFileName || '',
          audioMimeType: data.audioMimeType || '',
          audioFileSize: String(data.audioFileSize || 0),
          audioAttached: String(Boolean(data.audioUrl || data.audioFileName)),
        },
        sourcesProvided,
      };

      setSubmissions((prev) => [newSubmission, ...prev]);
      if (isSupabaseConfigured) {
        supabase.from('app_submissions').insert({
          id: newSubmission.id,
          type: newSubmission.type,
          title: newSubmission.title,
          contributor_name: newSubmission.contributorName,
          contributor_email: newSubmission.contributorEmail,
          priority: newSubmission.priority,
          status: newSubmission.status,
          proposed_data: newSubmission.proposedData,
          sources_provided: newSubmission.sourcesProvided,
        }).then(({ error }) => {
          if (error) console.error('Error inserting new recording submission:', error);
        });
      }
      // Add the contribution to the archive so it is immediately browsable and
      // playable, with the artwork resolved at submission time.
      const newRecording: Recording = {
        id: `rec-${Date.now()}`,
        songId: `song-${Date.now()}`,
        title: data.title || 'Untitled Historical Recording',
        recordingTitle: data.title || 'Untitled Historical Recording',
        artistOrBand: data.artistOrBand || 'Traditional Ensemble',
        releaseYear: Number(data.releaseYear) || 1978,
        country: data.country || 'Kenya',
        region: data.region || 'Nyanza',
        language: data.language || 'Luo',
        genre: data.genre || 'Benga',
        label: 'Community Submission',
        composer: data.composer || '',
        lyricist: '',
        producer: data.producer || '',
        studio: data.studio || 'Nairobi Studio',
        recordingLocation: data.country || 'Kenya',
        duration: 0,
        audioQuality: '320kbps MP3',
        audioSampleType: 'benga_fast',
        audioUrl: data.audioUrl,
        audioFileName: data.audioFileName,
        audioMimeType: data.audioMimeType,
        audioFileSize: data.audioFileSize,
        rightsStatus: 'permission_granted',
        rightsDeclaration,
        verificationStatus: 'unverified',
        coverImage: data.coverImage || '',
        story: data.story || '',
        recordingHistory: [`Submitted by ${userProfile.displayName}`],
        musicians: [],
        instruments: [],
        sources: sourcesProvided
          ? [{ id: `src-${Date.now()}`, type: 'Community submission', title: sourcesProvided, notes: '' }]
          : [],
        revisions: [],
        waveformPoints: [],
        playsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecordings((prev) => [newRecording, ...prev]);

      setUserProfile((prev) => ({
        ...prev,
        songsSubmitted: prev.songsSubmitted + 1,
        contributionsCount: prev.contributionsCount + 1,
        pendingReview: prev.pendingReview + 1,
      }));

      showToast('Recording uploaded and submitted to Archival Moderation Queue!');
    },
    [userProfile, showToast]
  );

  // Submit problem / copyright report (Screen 33)
  const submitProblemReport = useCallback(
    (report: { targetTitle: string; reason: string; notes: string; email: string }) => {
      const isCopyright = report.reason.toLowerCase().includes('copyright');
      if (isCopyright) {
        const newCase: CopyrightCase = {
          id: `case-${Date.now()}`,
          caseNumber: `BANJO-CR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          recordingId: selectedSongId || 'rec-001',
          recordingTitle: report.targetTitle,
          artistOrBand: 'Disputed Entry',
          claimantName: report.email.split('@')[0] || 'Rights Claimant',
          claimantEmail: report.email,
          claimType: 'ownership',
          evidenceSummary: report.notes,
          filedDate: new Date().toISOString().split('T')[0],
          status: 'open',
        };
        setCopyrightCases((prev) => [newCase, ...prev]);
        if (isSupabaseConfigured) {
          supabase.from('app_copyright_cases').insert({
            id: newCase.id,
            recording_id: newCase.recordingId,
            recording_title: newCase.recordingTitle,
            artist_or_band: newCase.artistOrBand,
            claimant_name: newCase.claimantName,
            claimant_email: newCase.claimantEmail,
            claim_type: newCase.claimType,
            status: newCase.status,
            filed_date: newCase.filedDate,
            summary: newCase.evidenceSummary,
          }).then(({ error }) => {
            if (error) console.error('Error inserting copyright case:', error);
          });
        }
      }

      showToast(`Report filed successfully. Reference Case created for Rights & Moderation review.`);
      setIsReportModalOpen(false);
    },
    [selectedSongId, showToast]
  );

  // Moderation action
  const reviewSubmission = useCallback(
    (submissionId: string, decision: 'approve' | 'reject' | 'evidence_requested', note?: string) => {
      const sub = submissions.find((s) => s.id === submissionId);
      if (!sub) return;

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
      if (isSupabaseConfigured) {
        supabase.from('app_submissions').update({
          status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'evidence_requested',
          review_notes: note || sub.reviewNotes,
        }).eq('id', submissionId).then(({ error }) => {
          if (error) console.error('Error updating submission:', error);
        });
      }

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
      if (isSupabaseConfigured) {
        supabase.from('app_audit_logs').insert({
          id: newAuditLog.id,
          who: newAuditLog.who,
          action: newAuditLog.what,
          target: newAuditLog.where,
          timestamp: newAuditLog.when,
          notes: newAuditLog.reason,
        }).then(({ error }) => {
          if (error) console.error('Error inserting audit log:', error);
        });
      }

      // If approved edit on recording, update live recording state
      if (decision === 'approve' && sub.type === 'edit') {
        setRecordings((prev) =>
          prev.map((rec) => {
            if (rec.title.includes(sub.proposedData.title || 'NOMATCH') || sub.title.includes(rec.title)) {
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
                releaseYear: sub.proposedData.releaseYear ? parseInt(sub.proposedData.releaseYear, 10) : rec.releaseYear,
                revisions: [newRev, ...rec.revisions],
                updatedAt: new Date().toISOString(),
              };
            }
            return rec;
          })
        );
      }

      showToast(`Submission has been marked: ${decision.toUpperCase()}`);
    },
    [submissions, userProfile, activeRole, showToast]
  );

  const resolveCopyrightCase = useCallback(
    (caseId: string, action: 'restricted' | 'resolved' | 'dismissed') => {
      setCopyrightCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: action } : c))
      );
      if (isSupabaseConfigured) {
        supabase.from('app_copyright_cases').update({
          status: action,
        }).eq('id', caseId).then(({ error }) => {
          if (error) console.error('Error updating copyright case:', error);
        });
      }
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
      if (isSupabaseConfigured) {
        supabase.from('app_audit_logs').insert({
          id: newAuditLog.id,
          who: newAuditLog.who,
          action: newAuditLog.what,
          target: newAuditLog.where,
          timestamp: newAuditLog.when,
          notes: newAuditLog.reason,
        }).then(({ error }) => {
          if (error) console.error('Error inserting copyright audit log:', error);
        });
      }

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
        openQuickEdit,
        closeQuickEdit,
        isAddDetailModalOpen,
        setIsAddDetailModalOpen,
        isCreateArticleModalOpen,
        setIsCreateArticleModalOpen,

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
        activeRole,
        setActiveRole,
        authStatus,
        authEmail,
        authError,
        isAuthenticated,
        authMode,
        setAuthMode,
        isOfflineAuth,
        signIn,
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
         resolveCopyrightCase,

        isBackendConnected,
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
