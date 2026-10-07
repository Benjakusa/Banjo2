import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { XLg, ExclamationTriangleFill } from 'react-bootstrap-icons';

export const ReportProblemModal: React.FC = () => {
  const { isReportModalOpen, setIsReportModalOpen, currentRecording, submitProblemReport } = useBanjo();

  const [reason, setReason] = useState('Incorrect information');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  if (!isReportModalOpen || !currentRecording) return null;

  const reasons = [
    'Incorrect information',
    'Copyright concern / Ownership claim',
    'Wrong person attributed',
    'Wrong song / Audio mismatch',
    'Offensive or defamatory content',
    'Privacy concern',
    'Duplicate recording',
    'Fraudulent source citation',
    'Other archival concern',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || !email.trim()) return;

    submitProblemReport({
      targetRecordingId: currentRecording.id,
      targetTitle: currentRecording.title,
      reason,
      notes,
      email,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-ink-12 bg-paper p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-ink-12 pb-3">
          <div className="flex items-center gap-2 text-ink-60">
            <ExclamationTriangleFill className="w-5 h-5" />
            <h2 className="text-base font-serif font-bold text-ink">
              Report Archival Issue or Rights Concern
            </h2>
          </div>
          <button
            onClick={() => setIsReportModalOpen(false)}
            className="p-1 rounded text-ink-60 hover:text-ink-60 cursor-pointer"
          >
            <XLg className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-60">
          Article: <strong className="text-ink">{currentRecording.title}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-ink-60 font-medium mb-1">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-ink-60 font-medium mb-1">Your Email</label>
            <input
              type="email"
              required
              placeholder="e.g. rights@label.com or researcher@archive.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 font-mono"
            />
          </div>

          <div>
            <label className="block text-ink-60 font-medium mb-1">Evidence / Detailed Explanation</label>
            <textarea
              rows={4}
              required
              placeholder="Provide catalog references, contract details, or specific corrections..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-12">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-ink-60 hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-paper bg-ink hover:bg-ink rounded-lg transition-colors cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
