import React, { useState, useEffect } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  XLg,
  PlusLg,
  People,
  JournalText,
  FileEarmarkText,
  Disc,
  Translate,
  ShieldCheck,
} from 'react-bootstrap-icons';

export const AddDetailModal: React.FC = () => {
  const {
    isAddDetailModalOpen,
    setIsAddDetailModalOpen,
    quickEditTarget,
    closeQuickEdit,
    currentRecording,
    recordings,
    musicians,
    bands,
    selectedSongId,
    selectedMusicianId,
    selectedBandId,
    activeTab,
    addMusicianToRecording,
    addSourceToRecording,
    addHistoricalParagraph,
    addLyricsToRecording,
    addTriviaToRecording,
    addAlternateVersionToRecording,
    updateMusicianBio,
    updateBandHistory,
  } = useBanjo();

  // Determine active target entity
  const targetRecording =
    recordings.find((r) => r.id === quickEditTarget?.recordingId) ||
    recordings.find((r) => r.id === selectedSongId) ||
    currentRecording ||
    recordings[0];

  const targetMusician = musicians.find((m) => m.id === selectedMusicianId) || musicians[0];
  const targetBand = bands.find((b) => b.id === selectedBandId) || bands[0];

  const entityType =
    activeTab === 'musician_detail' ? 'musician' : activeTab === 'band_detail' ? 'band' : 'song';

  type DetailTab = 'musicians' | 'trivia' | 'sources' | 'lyrics' | 'alternate' | 'bio' | 'band_member';

  const [currentTab, setCurrentTab] = useState<DetailTab>('musicians');

  // Set default tab based on quickEditTarget section
  useEffect(() => {
    if (quickEditTarget?.section) {
      if (quickEditTarget.section === 'musicians') setCurrentTab('musicians');
      else if (quickEditTarget.section === 'sources') setCurrentTab('sources');
      else if (quickEditTarget.section === 'history') setCurrentTab('trivia');
      else if (quickEditTarget.section === 'lyrics') setCurrentTab('lyrics');
      else if (quickEditTarget.section === 'alternate') setCurrentTab('alternate');
    } else if (entityType === 'musician') {
      setCurrentTab('bio');
    } else if (entityType === 'band') {
      setCurrentTab('band_member');
    } else {
      setCurrentTab('musicians');
    }
  }, [quickEditTarget, entityType, isAddDetailModalOpen]);

  // Form states
  // 1. Musician credit
  const [musicianName, setMusicianName] = useState('');
  const [musicianRole, setMusicianRole] = useState('Lead Guitarist');
  const [instrument, setInstrument] = useState('');

  // 2. Trivia / Historical Narrative
  const [historyText, setHistoryText] = useState(quickEditTarget?.currentText || '');
  const [historyCitation, setHistoryCitation] = useState('');

  // 3. Citation
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('Original record sleeve');
  const [sourceNotes, setSourceNotes] = useState('');
  const [sourceYear, setSourceYear] = useState('');

  // 4. Lyrics & Translation
  const [lyricsOriginal, setLyricsOriginal] = useState(targetRecording?.lyrics || '');
  const [lyricsTranslation, setLyricsTranslation] = useState(targetRecording?.lyricsTranslation || '');
  const [lyricsLanguage, setLyricsLanguage] = useState(targetRecording?.language || 'Luo');

  // 5. Alternate Version
  const [altTitle, setAltTitle] = useState('');
  const [altBand, setAltBand] = useState('');
  const [altYear, setAltYear] = useState(String(targetRecording?.releaseYear || '1980'));
  const [altLabel, setAltLabel] = useState('');

  // 6. Musician Bio
  const [musicianBio, setMusicianBio] = useState(targetMusician?.biography || '');
  const [newInstrument, setNewInstrument] = useState('');

  // 7. Band Member
  const [bandHistory, setBandHistory] = useState(targetBand?.history || '');
  const [bandMemberName, setBandMemberName] = useState('');
  const [bandMemberRole, setBandMemberRole] = useState('Founding Guitarist');
  const [bandMemberInst, setBandMemberInst] = useState('Rhythm Guitar');

  if (!isAddDetailModalOpen) return null;

  const handleClose = () => {
    closeQuickEdit();
    setIsAddDetailModalOpen(false);
  };

  const handleMusicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicianName.trim()) return;
    addMusicianToRecording(
      targetRecording.id,
      musicianName.trim(),
      musicianRole.trim(),
      instrument.trim() || 'Guitar'
    );
    setMusicianName('');
    setInstrument('');
    handleClose();
  };

  const handleHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyText.trim()) return;
    addHistoricalParagraph(
      targetRecording.id,
      historyText.trim(),
      historyCitation.trim() || 'Oral History Contributor Testimony'
    );
    setHistoryText('');
    setHistoryCitation('');
    handleClose();
  };

  const handleSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim()) return;
    addSourceToRecording(
      targetRecording.id,
      sourceTitle.trim(),
      sourceType,
      sourceNotes.trim()
    );
    setSourceTitle('');
    setSourceNotes('');
    handleClose();
  };

  const handleLyricsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyricsOriginal.trim()) return;
    addLyricsToRecording(
      targetRecording.id,
      lyricsOriginal.trim(),
      lyricsTranslation.trim(),
      lyricsLanguage.trim()
    );
    handleClose();
  };

  const handleAltSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altTitle.trim()) return;
    addAlternateVersionToRecording(
      targetRecording.id,
      altTitle.trim(),
      altBand.trim() || targetRecording.artistOrBand,
      parseInt(altYear, 10) || targetRecording.releaseYear,
      altLabel.trim() || 'Independent Recording'
    );
    setAltTitle('');
    setAltBand('');
    handleClose();
  };

  const handleBioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicianBio.trim()) return;
    updateMusicianBio(targetMusician.id, musicianBio.trim(), newInstrument.trim() || undefined);
    handleClose();
  };

  const handleBandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMemberObj = bandMemberName.trim()
      ? {
          name: bandMemberName.trim(),
          role: bandMemberRole.trim(),
          instrument: bandMemberInst.trim() || 'Instruments',
        }
      : undefined;
    updateBandHistory(targetBand.id, bandHistory.trim(), newMemberObj);
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-ink-12 bg-paper overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-ink-12 px-5 py-3.5 bg-ink-06 shrink-0">
          <div className="flex items-center gap-2.5">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-ink-60 font-bold block">
                Banjo · Community Editor
              </span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-ink truncate max-w-sm sm:max-w-md">
                Add Details to {entityType === 'musician' ? targetMusician.name : entityType === 'band' ? targetBand.name : targetRecording.title}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="p-1 rounded-md text-ink-60 hover:text-ink hover:bg-ink-06 cursor-pointer"
          >
            <XLg className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="bg-brand/10 border-b border-brand px-5 py-2.5 flex items-center justify-between text-xs text-ink-60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>Open Encyclopedia:</strong> Your additions will be saved directly and recorded as a versioned revision.
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] bg-brand/10 px-2 py-0.5 rounded text-ink-60 font-semibold">
            Peer Reviewed
          </span>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-ink-12 px-4 py-2 bg-ink-06 text-xs font-mono shrink-0 scrollbar-none">
          {entityType === 'song' && (
            <>
              <button
                onClick={() => setCurrentTab('musicians')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'musicians'
                    ? 'bg-brand text-on-orange font-bold'
                    : 'text-ink-60 hover:bg-ink-06 hover:text-ink'
                }`}
              >
                <People className="w-3.5 h-3.5" />
                <span>Musician Credit</span>
              </button>

              <button
                onClick={() => setCurrentTab('trivia')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'trivia'
                    ? 'bg-brand text-on-orange font-bold'
                    : 'text-ink-60 hover:bg-ink-06 hover:text-ink'
                }`}
              >
                <JournalText className="w-3.5 h-3.5" />
                <span>History & Lore</span>
              </button>

              <button
                onClick={() => setCurrentTab('sources')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'sources'
                    ? 'bg-brand text-on-orange font-bold'
                    : 'text-ink-60 hover:bg-ink-06 hover:text-ink'
                }`}
              >
                <FileEarmarkText className="w-3.5 h-3.5" />
                <span>Add Citation</span>
              </button>

              <button
                onClick={() => setCurrentTab('lyrics')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'lyrics'
                    ? 'bg-brand text-on-orange font-bold'
                    : 'text-ink-60 hover:bg-ink-06 hover:text-ink'
                }`}
              >
                <Translate className="w-3.5 h-3.5" />
                <span>Lyrics & Meaning</span>
              </button>

              <button
                onClick={() => setCurrentTab('alternate')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'alternate'
                    ? 'bg-brand text-on-orange font-bold'
                    : 'text-ink-60 hover:bg-ink-06 hover:text-ink'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Alternate Version</span>
              </button>
            </>
          )}

          {entityType === 'musician' && (
            <button
              onClick={() => setCurrentTab('bio')}
              className="px-3 py-1.5 rounded-lg font-medium bg-brand text-on-orange font-bold flex items-center gap-1.5"
            >
              <People className="w-3.5 h-3.5" />
              <span>Musician Biography & Instruments</span>
            </button>
          )}

          {entityType === 'band' && (
            <button
              onClick={() => setCurrentTab('band_member')}
              className="px-3 py-1.5 rounded-lg font-medium bg-brand text-on-orange font-bold flex items-center gap-1.5"
            >
              <People className="w-3.5 h-3.5" />
              <span>Band Lineup & History</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: ADD MUSICIAN */}
          {currentTab === 'musicians' && (
            <form onSubmit={handleMusicianSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Credit a Participating Musician
                </h3>
                <p className="text-ink-60 text-xs">
                  Document who played guitar, bass, horns, nyatiti, drums, or sang on this recording.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Musician Name <span className="text-ink-60">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Ochieng, Franco Luambo, Habel Kifoto"
                  value={musicianName}
                  onChange={(e) => setMusicianName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-sm focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-60 font-semibold mb-1">
                    Role in Session
                  </label>
                  <select
                    value={musicianRole}
                    onChange={(e) => setMusicianRole(e.target.value)}
                    className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs bg-paper focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                  >
                    <option value="Lead Guitarist & Soloist">Lead Guitarist & Soloist</option>
                    <option value="Rhythm Guitarist (Seben / Mi-solo)">Rhythm Guitarist (Seben / Mi-solo)</option>
                    <option value="Bass Guitarist (Syncopated Walking Bass)">Bass Guitarist (Walking Bass)</option>
                    <option value="Lead Vocalist">Lead Vocalist</option>
                    <option value="Backing Vocalist & Harmony">Backing Vocalist & Harmony</option>
                    <option value="Nyatiti / Traditional Lyre Master">Nyatiti / Traditional Lyre Master</option>
                    <option value="Talking Drummer / Percussionist">Talking Drummer / Percussionist</option>
                    <option value="Saxophonist / Brass Arranger">Saxophonist / Brass Arranger</option>
                    <option value="Sound Engineer & Producer">Sound Engineer & Producer</option>
                    <option value="Composer & Lyricist">Composer & Lyricist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink-60 font-semibold mb-1">
                    Instrument Played
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Electric Lead Guitar, Fender Precision Bass, Nyatiti"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Publish Musician Credit</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: HISTORICAL NARRATIVE & TRIVIA */}
          {currentTab === 'trivia' && (
            <form onSubmit={handleHistorySubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Add Historical Details or Context
                </h3>
                <p className="text-ink-60 text-xs">
                  Document the backstory of how this song was written, recorded, or received in the community.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Historical Narrative / Fact <span className="text-ink-60">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. During the 1978 studio sessions at Polygram Nairobi, the band recorded late at night after touring western Kenya. The opening guitar motif was adapted from a traditional funeral praise poem..."
                  value={historyText}
                  onChange={(e) => setHistoryText(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs leading-relaxed focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Supporting Citation / Source Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interview with elder band member, Daily Nation 1978 review, or sleeve notes"
                  value={historyCitation}
                  onChange={(e) => setHistoryCitation(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Publish History Details</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADD CITATION */}
          {currentTab === 'sources' && (
            <form onSubmit={handleSourceSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Add a Verifiable Reference Citation
                </h3>
                <p className="text-ink-60 text-xs">
                  Citations protect oral tradition from erasure by tying assertions to physical or spoken evidence.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Source Title / Document Name <span className="text-ink-60">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Polydor AS 1042 7-inch Vinyl Sleeve, Radio Voice of Kenya broadcast ledger"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-sm focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-60 font-semibold mb-1">
                    Source Category
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs bg-paper focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                  >
                    <option value="Original record sleeve">Original record sleeve / liner notes</option>
                    <option value="Studio documentation">Studio log / tape ledger</option>
                    <option value="Artist interview">Musician / producer interview</option>
                    <option value="Band member testimony">Band member oral testimony</option>
                    <option value="Family testimony">Family / estate testimony</option>
                    <option value="Newspaper">Historic newspaper article</option>
                    <option value="Academic publication">Academic / ethnomusicology book</option>
                    <option value="Government archive">National archives / radio ledger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink-60 font-semibold mb-1">
                    Year of Publication / Recording
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1978"
                    value={sourceYear}
                    onChange={(e) => setSourceYear(e.target.value)}
                    className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs font-mono focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Specific Page / Runout Matrix / Archivist Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matrix code stamped AS-1042-A-1 on dead-wax runout"
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Publish Citation</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: LYRICS & TRANSLATION */}
          {currentTab === 'lyrics' && (
            <form onSubmit={handleLyricsSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Document Lyrics & Cultural Translation
                </h3>
                <p className="text-ink-60 text-xs">
                  Preserve indigenous language verses and poetic English or Swahili translations for future generations.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Language of Song
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dholuo, Lingala, Swahili, Yoruba, Shona, Kikuyu"
                  value={lyricsLanguage}
                  onChange={(e) => setLyricsLanguage(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Original Language Lyrics <span className="text-ink-60">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter original native verses..."
                  value={lyricsOriginal}
                  onChange={(e) => setLyricsOriginal(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs font-serif leading-relaxed focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  English / Swahili Translation & Cultural Meaning
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter poetic or literal translation and cultural metaphors..."
                  value={lyricsTranslation}
                  onChange={(e) => setLyricsTranslation(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs font-serif leading-relaxed focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Publish Lyrics</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: ALTERNATE VERSION */}
          {currentTab === 'alternate' && (
            <form onSubmit={handleAltSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Document Alternate Recording / Cover / Live Tape
                </h3>
                <p className="text-ink-60 text-xs">
                  Many classic African songs have multiple recordings across labels and eras. Track the song's lineage here.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Version Title <span className="text-ink-60">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kano Ni Nyasaye (1982 Live at Kisumu Social Hall)"
                  value={altTitle}
                  onChange={(e) => setAltTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-sm focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-60 font-semibold mb-1">
                    Performing Band / Artist
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Victoria Kings International"
                    value={altBand}
                    onChange={(e) => setAltBand(e.target.value)}
                    className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                  />
                </div>

                <div>
                  <label className="block text-ink-60 font-semibold mb-1">
                    Year Recorded / Released
                  </label>
                  <input
                    type="number"
                    value={altYear}
                    onChange={(e) => setAltYear(e.target.value)}
                    className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs font-mono focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Record Label / Tape Format
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chandarana Sound, Cassette Bootleg, Polygram Reissue"
                  value={altLabel}
                  onChange={(e) => setAltLabel(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Publish Alternate Version</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: MUSICIAN BIO */}
          {currentTab === 'bio' && (
            <form onSubmit={handleBioSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Update Musician Biography & Mastery
                </h3>
                <p className="text-ink-60 text-xs">
                  Expand {targetMusician.name}'s biography with historical facts, tours, and instruments played.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Biography Narrative
                </label>
                <textarea
                  rows={6}
                  value={musicianBio}
                  onChange={(e) => setMusicianBio(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs leading-relaxed focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Add New Instrument Played
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metal Shakers, Nyatiti, 12-string acoustic guitar"
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Update Biography</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: BAND LINEUP & HISTORY */}
          {currentTab === 'band_member' && (
            <form onSubmit={handleBandSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-ink text-base">
                  Update Band History & Lineup
                </h3>
                <p className="text-ink-60 text-xs">
                  Document {targetBand.name}'s formation, history, and add band members who played in the group.
                </p>
              </div>

              <div>
                <label className="block text-ink-60 font-semibold mb-1">
                  Band History Narrative
                </label>
                <textarea
                  rows={4}
                  value={bandHistory}
                  onChange={(e) => setBandHistory(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs leading-relaxed focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div className="border-t border-ink-12 pt-3 space-y-3">
                <span className="font-semibold text-ink-60 block">
                  Add Band Member to Lineup:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-ink-60 text-[11px] mb-1">Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. James Ouma"
                      value={bandMemberName}
                      onChange={(e) => setBandMemberName(e.target.value)}
                      className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-60 text-[11px] mb-1">Role / Period</label>
                    <input
                      type="text"
                      placeholder="e.g. Bassist (1975–1983)"
                      value={bandMemberRole}
                      onChange={(e) => setBandMemberRole(e.target.value)}
                      className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-60 text-[11px] mb-1">Instrument</label>
                    <input
                      type="text"
                      placeholder="e.g. Bass Guitar"
                      value={bandMemberInst}
                      onChange={(e) => setBandMemberInst(e.target.value)}
                      className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-12">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <PlusLg className="w-4 h-4" />
                  <span>Update Band Article</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
