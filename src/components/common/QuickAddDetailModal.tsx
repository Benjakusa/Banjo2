import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import { X,
  PlusLg,
  Book,
  MusicNoteBeamed,
  Check2,
  Stars
} from 'react-bootstrap-icons';

export const QuickAddDetailModal: React.FC = () => {
  const {
    quickEditTarget,
    closeQuickEdit,
    addMusicianToRecording,
    addSourceToRecording,
    addHistoricalParagraph,
    recordings,
  } = useBanjo();

  const [musicianName, setMusicianName] = useState('');
  const [musicianRole, setMusicianRole] = useState('Soloist / Featured');
  const [instrument, setInstrument] = useState('Lead Guitar');

  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('Original record sleeve');
  const [sourceNotes, setSourceNotes] = useState('');

  const [paragraphText, setParagraphText] = useState('');
  const [paragraphCitation, setParagraphCitation] = useState('');

  if (!quickEditTarget) return null;

  const currentRecording = recordings.find((r) => r.id === quickEditTarget.recordingId);
  if (!currentRecording) return null;

  const handleMusicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicianName.trim()) return;
    addMusicianToRecording(currentRecording.id, musicianName.trim(), musicianRole, instrument);
    closeQuickEdit();
  };

  const handleSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim()) return;
    addSourceToRecording(currentRecording.id, sourceTitle.trim(), sourceType, sourceNotes.trim());
    closeQuickEdit();
  };

  const handleParagraphSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paragraphText.trim()) return;
    addHistoricalParagraph(currentRecording.id, paragraphText.trim(), paragraphCitation.trim() || 'Community testimony');
    closeQuickEdit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-bold text-orange-600 text-lg">W</span>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-orange-600 font-bold block">
                Encyclopedia Contribution
              </span>
              <h2 className="text-lg font-serif font-medium text-black">
                {quickEditTarget.section === 'musicians' && 'Add Musician or Performer'}
                {quickEditTarget.section === 'sources' && 'Add Archival Source / Citation'}
                {quickEditTarget.section === 'history' && 'Add Details to Historical Narrative'}
              </h2>
            </div>
          </div>
          <button
            onClick={closeQuickEdit}
            className="p-1 rounded-md text-black/40 hover:text-black/70 hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-black/50">
          Adding details to: <strong className="text-black/80">{currentRecording.title}</strong>
        </p>

        {/* 1. Add Musician Form */}
        {quickEditTarget.section === 'musicians' && (
          <form onSubmit={handleMusicianSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-black/70 font-medium mb-1">Musician Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Gabriel Omolo, David Amunga, Joseph Kamaru"
                value={musicianName}
                onChange={(e) => setMusicianName(e.target.value)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-black focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-black/70 font-medium mb-1">Instrument Played</label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full rounded-lg border border-black/20 px-2.5 py-2 text-black focus:border-orange-600 focus:outline-none"
                >
                  <option value="Lead Guitar">Lead Guitar</option>
                  <option value="Rhythm Guitar">Rhythm Guitar</option>
                  <option value="Bass Guitar">Bass Guitar</option>
                  <option value="Nyatiti">Nyatiti</option>
                  <option value="Drums">Drums</option>
                  <option value="Vocals">Vocals</option>
                  <option value="Trumpet">Trumpet</option>
                  <option value="Saxophone">Saxophone</option>
                  <option value="Accordion">Accordion</option>
                  <option value="Talking Drum">Talking Drum</option>
                </select>
              </div>

              <div>
                <label className="block text-black/70 font-medium mb-1">Role / Contribution</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Vocals, Mi-Solo"
                  value={musicianRole}
                  onChange={(e) => setMusicianRole(e.target.value)}
                  className="w-full rounded-lg border border-black/20 px-3 py-2 text-black focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={closeQuickEdit}
                className="px-4 py-2 text-xs font-medium text-black/60 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
              >
                <PlusLg className="w-3.5 h-3.5" />
                <span>Publish to Roster</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. Add Source / Citation Form */}
        {quickEditTarget.section === 'sources' && (
          <form onSubmit={handleSourceSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-black/70 font-medium mb-1">Source Title / Evidence Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Polydor AS 1042 vinyl label stamp, Kenya Daily Nation article (1978)"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-black focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-black/70 font-medium mb-1">Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full rounded-lg border border-black/20 px-2.5 py-2 text-black focus:border-orange-600 focus:outline-none"
              >
                <option value="Original record sleeve">Original record sleeve</option>
                <option value="Studio documentation">Studio documentation / Tape log</option>
                <option value="Artist interview">Artist interview</option>
                <option value="Band member testimony">Band member testimony</option>
                <option value="Family testimony">Family testimony</option>
                <option value="Newspaper">Newspaper article</option>
                <option value="Book">Academic book / Ethnomusicology paper</option>
                <option value="Government archive">National Sound Archive</option>
              </select>
            </div>

            <div>
              <label className="block text-black/70 font-medium mb-1">Archival Notes / Catalog Number</label>
              <input
                type="text"
                placeholder="e.g. Matrix runout: AS-1042-B, recorded in Nairobi Industrial Area"
                value={sourceNotes}
                onChange={(e) => setSourceNotes(e.target.value)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-black focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={closeQuickEdit}
                className="px-4 py-2 text-xs font-medium text-black/60 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
              >
                <Book className="w-3.5 h-3.5" />
                <span>Add Citation [Reference]</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. Add Historical Paragraph Form */}
        {quickEditTarget.section === 'history' && (
          <form onSubmit={handleParagraphSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-black/70 font-medium mb-1">
                Add Historical Details or Studio Context
              </label>
              <textarea
                rows={5}
                required
                placeholder="Write verifiable historical facts about the recording, the instruments used, composer background, or social reception..."
                value={paragraphText}
                onChange={(e) => setParagraphText(e.target.value)}
                className="w-full rounded-lg border border-black/20 p-3 text-black focus:border-orange-600 focus:outline-none leading-relaxed font-serif text-sm"
              />
            </div>

            <div>
              <label className="block text-black/70 font-medium mb-1">
                Supporting Citation / Source
              </label>
              <input
                type="text"
                placeholder="e.g. As told by producer David Amunga in Kenya Sound Archives, 1984"
                value={paragraphCitation}
                onChange={(e) => setParagraphCitation(e.target.value)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-black focus:border-orange-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={closeQuickEdit}
                className="px-4 py-2 text-xs font-medium text-black/60 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
              >
                <Stars className="w-3.5 h-3.5" />
                <span>Append to Article</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
