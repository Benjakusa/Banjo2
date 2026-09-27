import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  Play,
  Pause,
  Bookmark,
  Share2,
  Edit3,
  AlertTriangle,
  History,
  ShieldCheck,
  Disc,
  Clock,
  MapPin,
  Mic,
  GitCompare,
  ArrowLeft,
  Info,
  Plus,
  BookOpen,
  List,
} from 'lucide-react';

export const SongDetailView: React.FC = () => {
  const {
    selectedSongId,
    recordings,
    songs,
    playSong,
    isPlaying,
    currentRecording,
    togglePlay,
    navigateTo,
    goBack,
    canGoBack,
    setIsEditModalOpen,
    setIsReportModalOpen,
    openDiffViewer,
    openQuickEdit,
    toggleSaveRecording,
    userProfile,
    showToast,
    addTalkComment,
  } = useBanjo();

  const [activeArticleTab, setActiveArticleTab] = useState<'article' | 'talk' | 'history'>('article');
  const [talkTopic, setTalkTopic] = useState('');
  const [talkCommentText, setTalkCommentText] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const recording = recordings.find((r) => r.id === selectedSongId) || recordings[0];
  const songComposition = songs.find((s) => s.id === recording.songId) || songs[0];

  const alternateRecordings = recordings.filter(
    (r) => r.songId === recording.songId && r.id !== recording.id
  );

  const isCurrentActive = currentRecording?.id === recording.id;
  const isPlayingThis = isCurrentActive && isPlaying;
  const isSaved = userProfile.savedRecordingIds.includes(recording.id);

  const handlePlayRecording = () => {
    if (isPlayingThis) {
      togglePlay();
    } else {
      playSong(recording);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      {/* 1. Article Header & Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </button>

        {/* Wikipedia Article / Talk / History Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveArticleTab('article')}
            className={`px-3 py-1 rounded-t border-b-2 font-medium cursor-pointer transition-colors ${
              activeArticleTab === 'article'
                ? 'border-amber-700 text-stone-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Article
          </button>
          <button
            onClick={() => setActiveArticleTab('talk')}
            className={`px-3 py-1 rounded-t border-b-2 font-medium cursor-pointer transition-colors ${
              activeArticleTab === 'talk'
                ? 'border-amber-700 text-stone-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Talk ({recording.disputedClaims?.length ? '1' : '0'})
          </button>
          <button
            onClick={() => setActiveArticleTab('history')}
            className={`px-3 py-1 rounded-t border-b-2 font-medium cursor-pointer transition-colors ${
              activeArticleTab === 'history'
                ? 'border-amber-700 text-stone-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            View History ({recording.revisions.length})
          </button>
        </div>

        {/* Edit Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Entry</span>
          </button>
        </div>
      </div>

      {/* Disambiguation & Archival Notice (Wikipedia style) */}
      <div className="text-[11px] text-stone-500 italic border-l-2 border-amber-600 pl-3 py-0.5 space-y-0.5">
        <p>
          This encyclopedia article documents the <strong>{recording.releaseYear} master recording</strong> released by {recording.artistOrBand}. For the broader songwriting concept, see{' '}
          <span className="text-blue-700 hover:underline cursor-pointer">{songComposition.title} (composition)</span>.
        </p>
      </div>

      {activeArticleTab === 'article' && (
        <div className="space-y-8">
          {/* Article Title & Lead Summary */}
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mb-1">
              <span>{recording.country}</span>
              <span>·</span>
              <span>{recording.region}</span>
              <span>·</span>
              <span className="text-amber-800 font-bold font-mono">{recording.releaseYear}</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">{recording.verificationStatus.replace('_', ' ')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 leading-tight">
              {recording.title}
            </h1>

            <p className="text-sm font-medium text-amber-800 mt-1">
              Performed by{' '}
              <span
                onClick={() => {
                  if (recording.bandId) navigateTo('band_detail', { bandId: recording.bandId });
                  else if (recording.artistId) navigateTo('musician_detail', { musicianId: recording.artistId });
                }}
                className="hover:underline cursor-pointer font-bold"
              >
                {recording.artistOrBand}
              </span>
            </p>
          </div>

          {/* Quick Audio Play CTA Bar */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayRecording}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-700 text-white hover:bg-amber-800 transition-transform active:scale-95 cursor-pointer shadow-sm shrink-0"
              >
                {isPlayingThis ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-semibold text-stone-900">
                  {isPlayingThis ? 'Currently Playing Audio Archive' : 'Play Historical Sound Recording'}
                </p>
                <p className="text-[11px] text-stone-500 font-mono">
                  {recording.audioQuality} · {recording.studio}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => toggleSaveRecording(recording.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isSaved
                    ? 'border-amber-600 bg-amber-100 text-amber-900'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 inline mr-1" />
                {isSaved ? 'Saved' : 'Save Song'}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('Article citation link copied');
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 inline mr-1" />
                Cite
              </button>
            </div>
          </div>

          {/* Wikipedia Infobox (Floated or stacked) */}
          <aside className="border border-stone-300 rounded-xl bg-stone-50 p-4 space-y-3 sm:float-right sm:w-72 sm:ml-6 sm:mb-4 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-serif font-bold text-stone-900">Recording Data</span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] text-blue-700 hover:underline cursor-pointer"
              >
                [edit info]
              </button>
            </div>

            <div className="aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-200">
              <img
                src={recording.coverImage}
                alt={recording.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[10px] text-stone-500 text-center font-mono">
              Label: {recording.label}
            </p>

            <dl className="divide-y divide-stone-200/60 text-[11px]">
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Released</dt>
                <dd className="font-mono text-stone-900 font-semibold">{recording.releaseYear}</dd>
              </div>
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Recorded</dt>
                <dd className="text-stone-900 text-right">{recording.recordingLocation}</dd>
              </div>
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Genre</dt>
                <dd className="text-stone-900 font-medium">{recording.genre}</dd>
              </div>
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Language</dt>
                <dd className="text-stone-900">{recording.language}</dd>
              </div>
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Composer</dt>
                <dd className="text-stone-900 font-medium">{recording.composer}</dd>
              </div>
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Studio</dt>
                <dd className="text-stone-900 text-right">{recording.studio}</dd>
              </div>
              <div className="py-1.5 flex justify-between">
                <dt className="text-stone-500">Rights</dt>
                <dd className="text-amber-800 font-mono text-[10px]">{recording.rightsStatus}</dd>
              </div>
            </dl>
          </aside>

          {/* Table of Contents (Wikipedia style) */}
          <nav className="inline-block p-4 rounded-xl border border-stone-200 bg-stone-50 text-xs space-y-2">
            <span className="font-bold text-stone-900 block font-serif">Contents</span>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li><a href="#history" className="hover:underline">Historical Narrative & Context</a></li>
              <li><a href="#personnel" className="hover:underline">Personnel & Participating Musicians</a></li>
              <li><a href="#recording-history" className="hover:underline">Chronological Studio History</a></li>
              <li><a href="#lyrics" className="hover:underline">Lyrics & Translation</a></li>
              <li><a href="#trivia" className="hover:underline">Cultural Trivia & Origin Lore</a></li>
              <li><a href="#alternate" className="hover:underline">Alternate Recordings & Discography</a></li>
              {recording.disputedClaims && <li><a href="#conflicts" className="hover:underline">Conflicting Accounts</a></li>}
              <li><a href="#citations" className="hover:underline">References & Sources</a></li>
            </ol>
          </nav>

          {/* 1. Historical Narrative Section */}
          <section id="history" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>Historical Narrative</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'history')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [edit]
                </button>
              </h2>
              <button
                onClick={() => openQuickEdit(recording.id, 'history')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Details to Story</span>
              </button>
            </div>

            <div className="prose max-w-none text-sm text-stone-800 leading-relaxed space-y-4">
              {recording.story.split('\n\n').map((para, i) => (
                <p key={i}>
                  {para}
                  {i === 0 && (
                    <sup className="text-blue-700 font-mono text-[11px] font-bold cursor-pointer hover:underline ml-0.5">
                      [1]
                    </sup>
                  )}
                  {i === 1 && (
                    <sup className="text-blue-700 font-mono text-[11px] font-bold cursor-pointer hover:underline ml-0.5">
                      [2]
                    </sup>
                  )}
                </p>
              ))}
            </div>
          </section>

          {/* 2. Musicians & Personnel Section (Wikipedia style) */}
          <section id="personnel" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>Personnel & Musicians</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'musicians')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [edit]
                </button>
              </h2>
              <button
                onClick={() => openQuickEdit(recording.id, 'musicians')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Musician / Contributor</span>
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Musicians who performed on this recording session (click any name to view biography):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recording.musicians.map((m) => (
                <div
                  key={m.musicianId}
                  onClick={() => navigateTo('musician_detail', { musicianId: m.musicianId })}
                  className="p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-600 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-stone-900 hover:text-amber-800">
                      {m.musicianName}
                    </h3>
                    <p className="text-xs text-amber-800 font-medium">{m.role}</p>
                  </div>
                  <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    {m.instrument}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Add Musician Bar */}
            <button
              onClick={() => openQuickEdit(recording.id, 'musicians')}
              className="w-full py-2.5 rounded-xl border border-dashed border-stone-300 hover:border-amber-600 hover:bg-amber-50/50 text-xs text-stone-600 hover:text-amber-800 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>Know who else played on this session? Click here to add their name & instrument</span>
            </button>
          </section>

          {/* 3. Chronological Studio History Section */}
          <section id="recording-history" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>Recording Chronology</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'history')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [edit]
                </button>
              </h2>
            </div>

            <ol className="relative border-l-2 border-stone-200 pl-4 space-y-3 text-xs text-stone-700">
              {recording.recordingHistory.map((hist, i) => (
                <li key={i} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-amber-700" />
                  <p>{hist}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* 4. Lyrics & Meaning Section */}
          <section id="lyrics" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>Lyrics & Translation</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'lyrics')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [edit]
                </button>
              </h2>
              <button
                onClick={() => openQuickEdit(recording.id, 'lyrics')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{recording.lyrics ? 'Update Lyrics / Translation' : 'Add Native Lyrics & Translation'}</span>
              </button>
            </div>

            {recording.lyrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-amber-800 uppercase font-bold block">
                    Original Verses ({recording.language})
                  </span>
                  <div className="font-serif text-xs sm:text-sm text-stone-900 whitespace-pre-line leading-relaxed italic">
                    {recording.lyrics}
                  </div>
                </div>

                <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-bold block">
                    English / Cultural Translation
                  </span>
                  <div className="font-serif text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                    {recording.lyricsTranslation || 'No translation provided yet.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 p-4 text-center space-y-2 bg-stone-50/50">
                <p className="text-xs text-stone-600">
                  Full song lyrics in {recording.language} have not been transcribed yet.
                </p>
                <button
                  onClick={() => openQuickEdit(recording.id, 'lyrics')}
                  className="px-4 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-amber-600 text-stone-800 hover:text-amber-800 text-xs font-medium cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>Transcribe Native Lyrics & Translation</span>
                </button>
              </div>
            )}
          </section>

          {/* 5. Cultural Trivia & Origin Lore */}
          <section id="trivia" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>Cultural Trivia & Lore</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'history')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [add lore]
                </button>
              </h2>
              <button
                onClick={() => openQuickEdit(recording.id, 'history')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Historical Fact</span>
              </button>
            </div>

            <ul className="list-disc list-inside space-y-2 text-xs text-stone-700">
              <li className="leading-relaxed">
                The rhythm guitar pattern is an electric transposition of traditional <em>nyatiti</em> plucked fingerstyle developed by Luo bards along Lake Victoria.
              </li>
              <li className="leading-relaxed">
                Original 45rpm pressings on Polydor featured hand-inked runout matrix markings etched by chief engineer John Gardner at Polygram Nairobi.
              </li>
              {recording.trivia?.map((triv, i) => (
                <li key={i} className="leading-relaxed text-stone-900 font-medium">
                  {triv}
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Alternate Recordings & Discography Lineage */}
          <section id="alternate" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>Alternate Versions & Discography</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'alternate')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [add version]
                </button>
              </h2>
              <button
                onClick={() => openQuickEdit(recording.id, 'alternate')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alternate Recording</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {alternateRecordings.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => navigateTo('song_detail', { songId: alt.id })}
                  className="p-3 rounded-lg border border-stone-200 bg-white hover:border-amber-600 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-serif font-medium text-stone-900 hover:text-amber-800">
                      {alt.title}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      {alt.artistOrBand} · {alt.releaseYear} · {alt.studio}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Switch to Version
                  </span>
                </div>
              ))}

              {recording.alternateVersions?.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-serif font-medium text-stone-900">{v.title}</h3>
                    <p className="text-[11px] text-stone-500">
                      {v.band} · {v.year} · {v.label || 'Archive Pressing'}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded">
                    Community Documented
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Conflicting Accounts (Disputes) Section */}
          {recording.disputedClaims && recording.disputedClaims.length > 0 && (
            <section id="conflicts" className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="font-serif font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  Documented Discrepancy: {recording.disputedClaims[0].title}
                </span>
                <span className="font-mono text-[10px] uppercase text-amber-800">
                  Evidence Comparison
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white border border-amber-200 space-y-1">
                  <span className="font-mono text-[10px] text-stone-500 uppercase font-bold block">
                    Documentation Account A
                  </span>
                  <p className="text-stone-900 font-medium">"{recording.disputedClaims[0].claimA.text}"</p>
                  <span className="text-[10px] text-stone-500 block">
                    Source: {recording.disputedClaims[0].claimA.source}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-amber-200 space-y-1">
                  <span className="font-mono text-[10px] text-stone-500 uppercase font-bold block">
                    Oral Testimony Account B
                  </span>
                  <p className="text-stone-900 font-medium">"{recording.disputedClaims[0].claimB.text}"</p>
                  <span className="text-[10px] text-stone-500 block">
                    Source: {recording.disputedClaims[0].claimB.source}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-amber-900 pt-1">
                <strong>Editorial Note:</strong> {recording.disputedClaims[0].archivistNote}
              </p>
            </section>
          )}

          {/* 5. References & Sources (Wikipedia style) */}
          <section id="citations" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <h2 className="text-xl font-serif font-medium text-stone-900 flex items-center gap-2">
                <span>References</span>
                <button
                  onClick={() => openQuickEdit(recording.id, 'sources')}
                  className="text-xs font-mono text-blue-700 font-normal hover:underline cursor-pointer"
                >
                  [add source]
                </button>
              </h2>
              <button
                onClick={() => openQuickEdit(recording.id, 'sources')}
                className="text-xs text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Citation</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-stone-700">
              {recording.sources.map((src, i) => (
                <li key={src.id} className="leading-relaxed">
                  <span className="font-mono text-stone-500 text-[10px] uppercase font-bold mr-1">
                    [{src.type}]
                  </span>
                  <strong>{src.title}</strong>
                  {src.publisher && ` · Published by ${src.publisher}`}
                  {src.year && ` (${src.year})`}
                  {src.notes && <span className="text-stone-500 block pl-4 italic">"{src.notes}"</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {/* TALK / DISCUSSION TAB */}
      {activeArticleTab === 'talk' && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 text-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900">
                Talk: Discussion on {recording.title}
              </h2>
              <p className="text-stone-500">
                Community archivist discussion forum for debating origins, liner notes, and liner claims.
              </p>
            </div>
            <button
              onClick={() => setIsAddingTopic(!isAddingTopic)}
              className="px-3 py-1.5 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingTopic ? 'Cancel' : 'New Discussion Topic'}</span>
            </button>
          </div>

          {/* New Discussion Topic Form */}
          {isAddingTopic && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!talkTopic.trim() || !talkCommentText.trim()) return;
                addTalkComment(recording.id, talkTopic.trim(), talkCommentText.trim());
                setTalkTopic('');
                setTalkCommentText('');
                setIsAddingTopic(false);
              }}
              className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in duration-150"
            >
              <h3 className="font-serif font-bold text-stone-900 text-sm">Start a New Discussion Thread</h3>
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Discussion Subject / Claim</label>
                <input
                  type="text"
                  placeholder="e.g. Disputed recording date, guitar tuning, or vocal language"
                  value={talkTopic}
                  onChange={(e) => setTalkTopic(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs bg-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Your Archival Notes & Evidence</label>
                <textarea
                  rows={3}
                  placeholder="Describe your reasoning, cite any record sleeves or musician interviews..."
                  value={talkCommentText}
                  onChange={(e) => setTalkCommentText(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs bg-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-700 text-white font-semibold hover:bg-amber-800"
                >
                  Post to Talk Page
                </button>
              </div>
            </form>
          )}

          {/* User-posted talk comments */}
          {recording.talkComments?.map((tc) => (
            <div key={tc.id} className="p-3.5 rounded-lg bg-white border border-stone-200 space-y-2 shadow-2xs">
              <div className="flex justify-between font-mono text-[11px] text-stone-500 border-b border-stone-100 pb-1">
                <span className="font-bold text-amber-900 font-sans text-xs">{tc.topic}</span>
                <span>By {tc.author} · {tc.date}</span>
              </div>
              <p className="text-stone-800 leading-relaxed text-xs">{tc.comment}</p>
            </div>
          ))}

          {/* Baseline discussion topic */}
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex justify-between font-mono text-[11px] text-stone-500">
              <span className="font-bold text-stone-800 font-sans text-xs">Topic: Release Year 1977 vs 1978</span>
              <span>Opened by Mary Otieno</span>
            </div>
            <p className="text-stone-800 leading-relaxed">
              We received testimony that rural Nyanza juke-box copies were played at Kakamega dancehall in December 1977, before the official Polydor AS 1042 release in October 1978. Both accounts are now preserved in the article notes.
            </p>
          </div>
        </div>
      )}

      {/* HISTORY / REVISIONS TAB */}
      {activeArticleTab === 'history' && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 text-xs">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-lg font-serif font-medium text-stone-900">
              Revision History for {recording.title}
            </h2>
            <p className="text-stone-500">
              Every edit is version-controlled and verifiable.
            </p>
          </div>

          <div className="divide-y divide-stone-100">
            {recording.revisions.map((rev) => (
              <div key={rev.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-800 font-bold">Version {rev.version}.0</span>
                    <span className="text-stone-400">·</span>
                    <span className="font-mono text-stone-500">{rev.date}</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-800 font-medium">{rev.authorName}</span>
                  </div>
                  <p className="text-stone-600 mt-1">{rev.summary}</p>
                </div>

                <button
                  onClick={() => openDiffViewer(recording, rev)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:border-amber-600 text-stone-800 hover:text-amber-800 text-xs font-mono cursor-pointer"
                >
                  Compare with Previous
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
