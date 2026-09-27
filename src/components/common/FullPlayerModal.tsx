import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  PlayFill,
  PauseFill,
  SkipBackwardFill,
  SkipForwardFill,
  ChevronDown,
  Repeat,
  Shuffle,
  JournalText,
  WifiOff,
  Wifi,
  Share,
  BookmarkFill,
  Bookmark,
  ShieldCheck,
} from 'react-bootstrap-icons';

export const FullPlayerModal: React.FC = () => {
  const {
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    playbackSpeed,
    setSpeed,
    navigateTo,
    recordings,
    playSong,
    toggleSaveRecording,
    userProfile,
    showToast,
  } = useBanjo();

  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'queue' | 'provenance'>('player');

  if (!isFullPlayerOpen || !currentRecording) return null;

  const isSaved = userProfile.savedRecordingIds.includes(currentRecording.id);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 transition-all"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5 bg-black/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullPlayerOpen(false)}
              className="p-1 rounded-md text-black/50 hover:text-black hover:bg-black/10 cursor-pointer"
              aria-label="Collapse player"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <span className="text-[11px] uppercase tracking-widest font-mono text-black/60 font-semibold">
              Archive Audio Player
            </span>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/10">
            <button
              onClick={() => setActiveTab('player')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'player' ? 'bg-white text-black shadow-xs' : 'text-black/60 hover:text-black'
              }`}
            >
              Player
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'queue' ? 'bg-white text-black shadow-xs' : 'text-black/60 hover:text-black'
              }`}
            >
              Queue ({recordings.length})
            </button>
            <button
              onClick={() => setActiveTab('provenance')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'provenance' ? 'bg-white text-black shadow-xs' : 'text-black/60 hover:text-black'
              }`}
            >
              Provenance
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'player' && (
            <div className="space-y-6">
              {/* Album Art Showcase */}
              <div className="flex flex-col items-center">
                <div className="relative aspect-square w-52 sm:w-60 overflow-hidden rounded-xl border border-black/10 shadow-sm bg-black/5">
                  <img
                    src={currentRecording.coverImage}
                    alt={currentRecording.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-center">
                    <span className="text-[10px] font-mono text-white bg-black/90 px-2 py-0.5 rounded">
                      {currentRecording.audioQuality} · {currentRecording.recordingLocation}
                    </span>
                  </div>
                </div>

                <div className="text-center mt-4 space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-black/50">
                    <span>{currentRecording.country}</span>
                    <span>·</span>
                    <span>{currentRecording.releaseYear}</span>
                    <span>·</span>
                    <span>{currentRecording.genre}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-medium text-black leading-tight">
                    {currentRecording.title}
                  </h2>
                  <p className="text-sm text-orange-700 font-medium">
                    {currentRecording.artistOrBand}
                  </p>
                </div>
              </div>

              {/* Waveform Display (flat, crisp) */}
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-black/50 mb-2">
                  <span>Archival Sound Waveform</span>
                  <span>15 ips Studio Master</span>
                </div>
                <div className="flex items-end gap-1.5 h-12 px-1">
                  {currentRecording.waveformPoints.map((val, idx) => {
                    const isActiveBar = (idx / currentRecording.waveformPoints.length) * duration <= currentTime;
                    const dynamicHeight = isPlaying ? Math.max(15, (val * (0.8 + Math.sin((currentTime * 4) + idx) * 0.2))) : val;
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-t transition-all duration-75"
                        style={{
                          height: `${dynamicHeight}%`,
                          backgroundColor: isActiveBar ? '#EA580C' : '#D6D3CD',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Seek Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-xs font-mono text-black/50 tabular-nums">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    title="Shuffle"
                    className={`p-2 rounded hover:text-black cursor-pointer ${
                      isShuffle ? 'text-orange-600 font-bold' : 'text-black/40'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
                    title={`Repeat: ${repeatMode}`}
                    className={`p-2 rounded hover:text-black cursor-pointer ${
                      repeatMode !== 'off' ? 'text-orange-600 font-bold' : 'text-black/40'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={prevTrack}
                    className="text-black/60 hover:text-black p-2 transition-colors cursor-pointer"
                  >
                    <SkipBackwardFill className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    {isPlaying ? <PauseFill className="w-6 h-6" /> : <PlayFill className="w-6 h-6 ml-0.5" />}
                  </button>

                  <button
                    onClick={nextTrack}
                    className="text-black/60 hover:text-black p-2 transition-colors cursor-pointer"
                  >
                    <SkipForwardFill className="w-5 h-5" />
                  </button>
                </div>

                {/* Speed buttons */}
                <div className="flex items-center gap-1">
                  {speedOptions.map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-orange-600 text-white font-bold'
                          : 'text-black/60 hover:bg-black/5'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-3 border-t border-black/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSaveRecording(currentRecording.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      isSaved
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-black/10 text-black/60 hover:text-black'
                    }`}
                  >
                    {isSaved ? <BookmarkFill className="w-3.5 h-3.5 text-orange-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      showToast('Citation link copied to clipboard');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-black/60 hover:text-black border border-black/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Share className="w-3.5 h-3.5" />
                    <span>Cite</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsFullPlayerOpen(false);
                    navigateTo('song_detail', { songId: currentRecording.id });
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
                >
                  <JournalText className="w-3.5 h-3.5" />
                  <span>Wikipedia Article</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest font-mono text-black/50 block border-b border-black/10 pb-2">
                Playback Queue ({recordings.length} Recordings)
              </span>
              <div className="space-y-2">
                {recordings.map((rec) => {
                  const isCurrent = rec.id === currentRecording.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => playSong(rec)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={rec.coverImage}
                          alt={rec.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded border border-black/10"
                        />
                        <div>
                          <p className={`text-xs font-medium ${isCurrent ? 'text-orange-950 font-semibold' : 'text-black'}`}>
                            {rec.title}
                          </p>
                          <p className="text-[11px] text-black/50">
                            {rec.artistOrBand} · {rec.releaseYear}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-black/50 tabular-nums">
                        {formatSeconds(rec.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <div className="border border-black/10 rounded-xl p-4 bg-black/5 space-y-2 text-xs">
                <h3 className="font-serif font-medium text-black flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  Archival Provenance & License Rights
                </h3>
                <p className="text-black/60 leading-relaxed">
                  {currentRecording.rightsDeclaration}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/10 font-mono text-[11px]">
                  <div>
                    <span className="text-black/50 block">Status:</span>
                    <span className="text-black font-medium">{currentRecording.rightsStatus}</span>
                  </div>
                  <div>
                    <span className="text-black/50 block">Verification:</span>
                    <span className="text-black font-medium">{currentRecording.verificationStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
