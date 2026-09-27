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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <ExclamationTriangleFill className="w-5 h-5" />
            <h2 className="text-base font-serif font-bold text-stone-900">
              Report Archival Issue or Rights Concern
            </h2>
          </div>
          <button
            onClick={() => setIsReportModalOpen(false)}
            className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <XLg className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-600">
          Article: <strong className="text-stone-900">{currentRecording.title}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-stone-700 font-medium mb-1">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:border-orange-600 focus:outline-none"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">Your Email</label>
            <input
              type="email"
              required
              placeholder="e.g. rights@label.com or researcher@archive.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:border-orange-600 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">Evidence / Detailed Explanation</label>
            <textarea
              rows={4}
              required
              placeholder="Provide catalog references, contract details, or specific corrections..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:border-orange-600 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
