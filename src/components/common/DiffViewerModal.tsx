import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { XLg, CheckCircleFill, XCircleFill, QuestionCircleFill, ArrowsAngleContract } from 'react-bootstrap-icons';

export const DiffViewerModal: React.FC = () => {
  const {
    isDiffViewerOpen,
    setIsDiffViewerOpen,
    activeDiffRevision,
    reviewSubmission,
    activeRole,
  } = useBanjo();

  const [reviewNote, setReviewNote] = useState('');

  if (!isDiffViewerOpen || !activeDiffRevision) return null;

  const { recording, revision } = activeDiffRevision;

  const handleAction = (action: 'approve' | 'reject' | 'evidence_requested') => {
    reviewSubmission(revision.id, action, reviewNote);
    setIsDiffViewerOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-xl space-y-5 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <ArrowsAngleContract className="w-5 h-5 text-orange-600" />
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-orange-700 font-bold block">
                Banjo Diff Viewer
              </span>
              <h2 className="text-xl font-serif font-medium text-black">
                Comparing Version {revision.version}.0 with Previous
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsDiffViewerOpen(false)}
            className="p-1 rounded text-black/40 hover:text-black/70 cursor-pointer"
          >
            <XLg className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/5 border border-black/10 rounded-xl">
          <div>
            <span className="text-black/50 block text-[10px]">Article Target</span>
            <span className="font-semibold text-black">{recording.title}</span>
          </div>
          <div>
            <span className="text-black/50 block text-[10px]">Editor</span>
            <span className="font-mono text-black/80">
              {revision.authorName} ({revision.authorRole})
            </span>
          </div>
          <div>
            <span className="text-black/50 block text-[10px]">Date</span>
            <span className="font-mono text-black/80">{revision.date}</span>
          </div>
          <div>
            <span className="text-black/50 block text-[10px]">Revision Status</span>
            <span className="font-mono uppercase text-black font-bold">
              {revision.status}
            </span>
          </div>
        </div>

        {/* Edit summary */}
        <div>
          <span className="font-mono uppercase tracking-wider text-black/50 text-[10px] block mb-1">
            Editor's Summary:
          </span>
          <p className="text-black/80 bg-orange-50/60 border border-orange-200 p-2.5 rounded-lg leading-relaxed">
            {revision.summary}
          </p>
        </div>

        {/* Side-by-Side Diff */}
        <div className="space-y-3">
          <span className="font-mono uppercase tracking-wider text-black/50 text-[10px] block">
            Line-by-Line Changes:
          </span>

          {revision.changes.map((change, idx) => (
            <div key={idx} className="rounded-xl border border-black/10 overflow-hidden shadow-xs">
              <div className="bg-black/5 px-3 py-1 border-b border-black/10 font-mono text-[11px] font-bold text-black/70">
                Field: {change.field}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/10">
                {/* Previous */}
                <div className="p-3 bg-black/5">
                  <span className="text-[10px] font-mono text-black uppercase block mb-1 font-bold">
                    Previous Text
                  </span>
                  <div className="text-black leading-relaxed line-through decoration-black/40">
                    {change.previous || '(empty)'}
                  </div>
                </div>

                {/* Proposed */}
                <div className="p-3 bg-black/5">
                  <span className="text-[10px] font-mono text-black uppercase block mb-1 font-bold">
                    Proposed Text
                  </span>
                  <div className="text-black leading-relaxed font-medium">
                    {change.proposed}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Review Note */}
        <div>
          <label className="block text-black/70 font-medium mb-1">
            Reviewer Note / Archival Citation:
          </label>
          <input
            type="text"
            placeholder="Add verification note or documentary catalog reference..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="w-full rounded-lg border border-black/20 p-2 text-black focus:border-orange-600 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10">
          <span className="text-black/50 text-[11px]">Role: {activeRole}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('evidence_requested')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-600 bg-orange-50 text-orange-950 font-medium cursor-pointer"
            >
              <QuestionCircleFill className="w-3.5 h-3.5" />
              <span>Request Citation</span>
            </button>
            <button
              onClick={() => handleAction('reject')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-black/20 bg-black/5 text-black font-medium cursor-pointer"
            >
              <XCircleFill className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => handleAction('approve')}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-black cursor-pointer shadow-xs"
            >
              <CheckCircleFill className="w-3.5 h-3.5" />
              <span>Approve Revision</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

