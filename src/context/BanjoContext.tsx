import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Recording,
  SongComposition,
  Musician,
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
  | 'admin';

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

  // Mobile View Preferences
  isMobileDeviceFrame: boolean;
  setIsMobileDeviceFrame: (val: boolean) => void;

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

  // Actions
  toggleSaveRecording: (recordingId: string) => void;
  submitSongEdit: (recordingId: string, form: { title: string; year: string; composer: string; history: string; sources: string; explanation: string }) => void;
  addMusicianToRecording: (recordingId: string, musicianName: string, role: string, instrument: string) => void;
  addSourceToRecording: (recordingId: string, sourceTitle: string, sourceType: any, notes: string) => void;
  addHistoricalParagraph: (recordingId: string, paragraph: string, sourceCitation: string) => void;
  addLyricsToRecording: (recordingId: string, lyrics: string, translation: string, language?: string) => void;
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
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState(false);

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
  const [activeRole, setActiveRole] = useState<UserRole>('senior_archivist');

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

  // Direct Wikipedia-style addition of Musician credit to recording
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

  // Direct Wikipedia-style addition of Source/Citation to recording
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

  // Direct Wikipedia-style addition of Historical Narrative paragraph
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

  // Direct addition of Lyrics & Translation
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

      showToast(`New article "${data.title}" published to Wikipedia of African Music!`);
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
        },
        sourcesProvided,
      };

      setSubmissions((prev) => [newSubmission, ...prev]);
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

        isMobileDeviceFrame,
        setIsMobileDeviceFrame,

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

        toggleSaveRecording,
        submitSongEdit,
        addMusicianToRecording,
        addSourceToRecording,
        addHistoricalParagraph,
        addLyricsToRecording,
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
