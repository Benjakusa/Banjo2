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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-ink-12 bg-paper p-6 space-y-5 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-12 pb-3">
          <div className="flex items-center gap-2">
            <ArrowsAngleContract className="w-5 h-5 text-brand" />
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-ink-60 font-bold block">
                Banjo Diff Viewer
              </span>
              <h2 className="text-xl font-serif font-medium text-ink">
                Comparing Version {revision.version}.0 with Previous
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsDiffViewerOpen(false)}
            className="p-1 rounded text-ink-60 hover:text-ink-60 cursor-pointer"
          >
            <XLg className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-ink-06 border border-ink-12 rounded-xl">
          <div>
            <span className="text-ink-60 block text-[10px]">Article Target</span>
            <span className="font-semibold text-ink">{recording.title}</span>
          </div>
          <div>
            <span className="text-ink-60 block text-[10px]">Editor</span>
            <span className="font-mono text-ink-60">
              {revision.authorName} ({revision.authorRole})
            </span>
          </div>
          <div>
            <span className="text-ink-60 block text-[10px]">Date</span>
            <span className="font-mono text-ink-60">{revision.date}</span>
          </div>
          <div>
            <span className="text-ink-60 block text-[10px]">Revision Status</span>
            <span className="font-mono uppercase text-ink font-bold">
              {revision.status}
            </span>
          </div>
        </div>

        {/* Edit summary */}
        <div>
          <span className="font-mono uppercase tracking-wider text-ink-60 text-[10px] block mb-1">
            Editor's Summary:
          </span>
          <p className="text-ink-60 bg-brand/10 border border-brand p-2.5 rounded-lg leading-relaxed">
            {revision.summary}
          </p>
        </div>

        {/* Side-by-Side Diff */}
        <div className="space-y-3">
          <span className="font-mono uppercase tracking-wider text-ink-60 text-[10px] block">
            Line-by-Line Changes:
          </span>

          {revision.changes.map((change, idx) => (
            <div key={idx} className="rounded-xl border border-ink-12 overflow-hidden">
              <div className="bg-ink-06 px-3 py-1 border-b border-ink-12 font-mono text-[11px] font-bold text-ink-60">
                Field: {change.field}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink-12">
                {/* Previous */}
                <div className="p-3 bg-ink-06 flex gap-2">
                  <span
                    aria-hidden="true"
                    className="font-mono font-bold text-ink-60 select-none"
                  >
                    &#8722;
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-ink uppercase block mb-1 font-bold">
                      Previous Text
                    </span>
                    <div className="text-ink leading-relaxed line-through decoration-ink-12">
                      {change.previous || '(empty)'}
                    </div>
                  </div>
                </div>

                {/* Proposed */}
                <div className="p-3 bg-ink-06 flex gap-2">
                  <span
                    aria-hidden="true"
                    className="font-mono font-bold text-ink-60 select-none"
                  >
                    +
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-ink uppercase block mb-1 font-bold">
                      Proposed Text
                    </span>
                    <div className="text-ink leading-relaxed font-medium">
                      {change.proposed}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Review Note */}
        <div>
          <label className="block text-ink-60 font-medium mb-1">
            Reviewer Note / Archival Citation:
          </label>
          <input
            type="text"
            placeholder="Add verification note or documentary catalog reference..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-ink-12">
          <span className="text-ink-60 text-[11px]">Role: {activeRole}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('evidence_requested')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink bg-ink text-paper font-medium cursor-pointer"
            >
              <QuestionCircleFill className="w-3.5 h-3.5" />
              <span>Request Citation</span>
            </button>
            <button
              onClick={() => handleAction('reject')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink-12 bg-ink-06 text-ink font-medium cursor-pointer"
            >
              <XCircleFill className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => handleAction('approve')}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-ink text-paper font-semibold hover:bg-ink cursor-pointer"
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

