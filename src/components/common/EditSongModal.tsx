import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { XLg, SendFill, ShieldExclamation } from 'react-bootstrap-icons';

export const EditSongModal: React.FC = () => {
  const { isEditModalOpen, setIsEditModalOpen, currentRecording, submitSongEdit } = useBanjo();

  const [title, setTitle] = useState(currentRecording?.title || '');
  const [year, setYear] = useState(String(currentRecording?.releaseYear || ''));
  const [composer, setComposer] = useState(currentRecording?.composer || '');
  const [history, setHistory] = useState(currentRecording?.story || '');
  const [sources, setSources] = useState('');
  const [explanation, setExplanation] = useState('');

  if (!isEditModalOpen || !currentRecording) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !explanation.trim()) return;

    submitSongEdit(currentRecording.id, {
      title,
      year,
      composer,
      history,
      sources,
      explanation,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
    >
      <div className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-ink-12 bg-paper p-4 space-y-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-ink-12 pb-3">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-ink-60 font-bold block">
                Banjo Editor
              </span>
              <h2 className="text-lg font-serif font-medium text-ink">
                Edit page: {currentRecording.title}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="p-1 rounded-md text-ink-60 hover:text-ink-60 hover:bg-ink-06 cursor-pointer"
          >
            <XLg className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-brand/10 border border-brand rounded-xl p-3 text-xs text-ink-60 leading-relaxed flex items-start gap-2">
          <ShieldExclamation className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <span>
            <strong>Traceable Revisions:</strong> Every change creates a versioned revision with your explanation and supporting citations. No historical facts are silently overwritten.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-ink-60 font-medium mb-1">Article / Song Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-60 font-medium mb-1">Release Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 font-mono"
              />
            </div>
            <div>
              <label className="block text-ink-60 font-medium mb-1">Composer / Arranger</label>
              <input
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                required
                className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-60 font-medium mb-1">Historical Narrative (Body Text)</label>
            <textarea
              rows={4}
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 font-serif leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-ink-60 font-medium mb-1">Supporting Sources / Citations</label>
            <input
              type="text"
              placeholder="e.g. Polydor AS 1042 vinyl runout, Voice of Kenya 1983 broadcast"
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div>
            <label className="block text-ink-60 font-medium mb-1">Edit Summary (Briefly describe your changes)</label>
            <input
              type="text"
              required
              placeholder="e.g. Added guitar solo credits and verified 1978 release date from sleeve stamp"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-12">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-ink-60 hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-on-orange bg-brand hover:bg-brand rounded-lg transition-colors cursor-pointer"
            >
              <SendFill className="w-3.5 h-3.5" />
              <span>Publish Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
