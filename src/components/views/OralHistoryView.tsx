import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  Mic,
  Play,
  Pause,
  MapPin,
  Calendar,
  Clock,
  Share2,
} from 'lucide-react';

export const OralHistoryView: React.FC = () => {
  const {
    oralHistories,
    selectedOralHistoryId,
    playOralHistory,
    currentRecording,
    isPlaying,
    togglePlay,
    navigateTo,
    showToast,
  } = useBanjo();

  const [activeInterviewId, setActiveInterviewId] = useState<string>(
    selectedOralHistoryId || oralHistories[0]?.id || 'oral-001'
  );
  const [langTab, setLangTab] = useState<'en' | 'sw'>('en');

  const interview =
    oralHistories.find((h) => h.id === activeInterviewId) || oralHistories[0];

  const isCurrentActive =
    currentRecording?.id === interview.id && isPlaying;

  const handlePlay = () => {
    if (currentRecording?.id === interview.id) {
      togglePlay();
    } else {
      playOralHistory(interview);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-amber-800 font-semibold">
          Wikipedia Audio Archives
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 mt-0.5">
          Master Musician Oral Histories & Transcripts
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          First-hand spoken accounts from studio musicians and recording engineers safeguarding unwritten histories.
        </p>
      </div>

      {/* Interview Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {oralHistories.map((h) => {
          const isSelected = h.id === interview.id;
          return (
            <button
              key={h.id}
              onClick={() => setActiveInterviewId(h.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-700 bg-amber-50 text-amber-900 font-semibold'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>{h.interviewee}</span>
              <span className="font-mono text-[10px] text-stone-400 ml-1.5">({h.duration})</span>
            </button>
          );
        })}
      </div>

      {/* Main Interview Box */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="text-xs font-mono text-stone-500 mb-0.5">
              Recorded in {interview.location} ({interview.date})
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
              {interview.title}
            </h2>
            <p className="text-xs text-amber-800 font-medium">
              Witness: {interview.interviewee} · Interviewer: {interview.interviewer}
            </p>
          </div>

          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
          >
            {isCurrentActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Interview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Listen ({interview.duration})</span>
              </>
            )}
          </button>
        </div>

        {/* Entity tags */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
          <span className="font-mono text-stone-500 text-[10px] uppercase font-bold block">
            Indexed Entities & References
          </span>
          <div className="flex flex-wrap gap-1.5">
            {interview.keyEntities.musicians.map((m) => (
              <span key={m} className="px-2 py-0.5 rounded bg-white border border-stone-200 text-blue-700 text-[11px]">
                {m}
              </span>
            ))}
            {interview.keyEntities.bands.map((b) => (
              <span key={b} className="px-2 py-0.5 rounded bg-white border border-stone-200 text-amber-900 text-[11px]">
                {b}
              </span>
            ))}
            {interview.keyEntities.places.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700 text-[11px]">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="font-serif font-bold text-stone-900 text-sm">Verbatim Transcript</span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 text-xs font-mono">
              <button
                onClick={() => setLangTab('en')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  langTab === 'en' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLangTab('sw')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  langTab === 'sw' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500'
                }`}
              >
                Kiswahili
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 font-serif text-sm leading-relaxed text-stone-800 whitespace-pre-line space-y-3">
            {langTab === 'en' ? interview.transcriptEn : interview.transcriptSw}
          </div>
        </div>
      </div>
    </div>
  );
};
