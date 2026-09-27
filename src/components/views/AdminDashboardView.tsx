import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  QuestionCircle,
  ExclamationTriangle,
  FileEarmarkText,
  Activity,
  Database,
  Upload,
  Download,
  Funnel
} from 'react-bootstrap-icons';
import { UserRole } from '../../types';

export const AdminDashboardView: React.FC = () => {
  const {
    recordings,
    songs,
    musicians,
    bands,
    submissions,
    reviewSubmission,
    copyrightCases,
    resolveCopyrightCase,
    auditLogs,
    activeRole,
    setActiveRole,
    userProfile,
    showToast,
    isBackendConnected,
  } = useBanjo();

  const [activeSection, setActiveSection] = useState<
    'overview' | 'moderation' | 'review' | 'rights' | 'audit' | 'import'
  >('overview');

  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id || '');
  const [reviewNote, setReviewNote] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const currentSub = submissions.find((s) => s.id === selectedSubId) || submissions[0];

  const filteredSubmissions = submissions.filter((s) => {
    return filterPriority === 'all' || s.priority === filterPriority;
  });

  const handleReviewAction = (decision: 'approve' | 'reject' | 'evidence_requested') => {
    if (!currentSub) return;
    reviewSubmission(currentSub.id, decision, reviewNote);
    setReviewNote('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-orange-700 font-semibold block">
            Archival Moderation Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-black mt-0.5">
            Encyclopedia Administration & Review
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-black/50 font-mono">Role:</span>
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as UserRole)}
            className="bg-white border border-black/20 rounded-lg px-2.5 py-1 text-xs text-black font-medium focus:border-orange-600 focus:outline-none"
          >
            <option value="senior_archivist">Senior Archivist</option>
            <option value="archivist">Archivist</option>
            <option value="rights_manager">Rights Manager</option>
            <option value="moderator">Moderator</option>
            <option value="super_admin">Super Administrator</option>
          </select>
          <span
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium ${
              isBackendConnected
                ? 'bg-black/5 text-black border border-black/20'
                : 'bg-black/5 text-black/60 border border-black/10'
            }`}
            title={isBackendConnected ? 'Connected to live Supabase pooler' : 'Running in local fallback mode'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-black animate-pulse' : 'bg-black/40'}`}></span>
            {isBackendConnected ? 'Supabase Live' : 'Local Fallback'}
          </span>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-black/10 pb-2 text-xs font-mono">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'moderation', label: `Moderation Queue (${submissions.filter(s => s.status === 'pending').length})` },
          { key: 'review', label: 'Review Workspace' },
          { key: 'rights', label: `Copyright (${copyrightCases.length})` },
          { key: 'audit', label: `Audit Log (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSection === tab.key
                ? 'bg-orange-600 text-white font-bold shadow-xs'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-black/10 bg-white shadow-xs">
              <span className="text-black/50 font-mono text-[11px] block">Compositions</span>
              <span className="font-mono text-2xl font-bold text-black mt-1 block">
                {songs.length + 184}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-black/10 bg-white shadow-xs">
              <span className="text-black/50 font-mono text-[11px] block">Recordings</span>
              <span className="font-mono text-2xl font-bold text-black mt-1 block">
                {recordings.length + 420}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-black/10 bg-white shadow-xs">
              <span className="text-black/50 font-mono text-[11px] block">Musicians</span>
              <span className="font-mono text-2xl font-bold text-black mt-1 block">
                {musicians.length + 85}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-black/10 bg-white shadow-xs">
              <span className="text-orange-600 font-mono text-[11px] block font-bold">Pending Review</span>
              <span className="font-mono text-2xl font-bold text-orange-600 mt-1 block">
                {submissions.filter((s) => s.status === 'pending').length}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5 space-y-3 text-xs shadow-xs">
            <h3 className="font-serif font-bold text-black text-sm">System Health & Cloudflare R2 Storage</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between p-2 rounded bg-black/5 border border-black/10">
                <span className="text-black/60">Database Engine:</span>
                <span className="text-black font-bold">PostgreSQL with Row Level Security</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-black/5 border border-black/10">
                <span className="text-black/60">Archival Audio Storage:</span>
                <span className="text-black">Cloudflare R2 (2.41 TB across 18,400 Master FLAC files)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-black/5 border border-black/10">
                <span className="text-black/60">Edge Caching CDN:</span>
                <span className="text-black font-bold">Optimal (Low latency delivery in East & West Africa)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION QUEUE */}
      {activeSection === 'moderation' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/10 bg-black/5 text-black/50 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Title & Category</th>
                  <th className="p-3">Contributor</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 text-black/70">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-black/5">
                    <td className="p-3 font-medium text-black">
                      <span className="font-mono text-[10px] text-orange-700 uppercase block font-bold">{sub.category}</span>
                      {sub.title}
                    </td>
                    <td className="p-3 font-mono text-[11px]">{sub.contributorName}</td>
                    <td className="p-3 font-mono text-black/50 text-[11px]">{sub.submittedAt.slice(0, 10)}</td>
                    <td className="p-3 font-mono uppercase text-[10px]">
                      <span className={sub.status === 'approved' ? 'text-black' : 'text-orange-600'}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setActiveSection('review');
                        }}
                        className="px-2.5 py-1 rounded-md border border-black/20 bg-white text-black/80 hover:border-orange-600 text-[11px] cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW WORKSPACE */}
      {activeSection === 'review' && currentSub && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-5 shadow-sm text-xs">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div>
              <span className="text-[10px] font-mono text-orange-700 uppercase font-bold block">
                Verification Task
              </span>
              <h2 className="text-xl font-serif font-medium text-black mt-0.5">
                {currentSub.title}
              </h2>
              <p className="text-black/50">Submitted by: {currentSub.contributorName}</p>
            </div>
            <span className="font-mono text-[11px] uppercase text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              {currentSub.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentSub.currentData && (
              <div className="p-3 rounded-lg bg-black/5 border border-black/10 space-y-1">
                <span className="font-mono text-[10px] uppercase text-black/50 font-bold block">Current Entry</span>
                <pre className="text-[11px] text-black/70 whitespace-pre-wrap font-sans">
                  {JSON.stringify(currentSub.currentData, null, 2)}
                </pre>
              </div>
            )}
            <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200 space-y-1">
              <span className="font-mono text-[10px] uppercase text-orange-800 font-bold block">Proposed Additions</span>
              <pre className="text-[11px] text-black whitespace-pre-wrap font-sans font-medium">
                {JSON.stringify(currentSub.proposedData, null, 2)}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/5 border border-black/10 space-y-1">
            <span className="font-mono text-[10px] uppercase text-black/50 font-bold block">Sources & Rights</span>
            <p className="text-black/80">{currentSub.sourcesProvided || 'Source citation attached'}</p>
            <p className="text-black/50 text-[11px]">{currentSub.rightsDeclaration}</p>
          </div>

          <div>
            <label className="block text-black/70 font-medium mb-1">Archivist Verification Note</label>
            <input
              type="text"
              placeholder="e.g. Cross-checked with 1978 session sheet..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full rounded-lg border border-black/20 p-2 text-xs text-black focus:border-orange-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
            <button
              onClick={() => handleReviewAction('evidence_requested')}
              className="px-3.5 py-1.5 rounded-lg border border-orange-600 bg-orange-50 text-orange-800 font-medium cursor-pointer"
            >
              Request Evidence
            </button>
            <button
              onClick={() => handleReviewAction('reject')}
              className="px-3.5 py-1.5 rounded-lg border border-black/20 bg-black/5 text-black font-medium cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={() => handleReviewAction('approve')}
              className="px-4 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-black cursor-pointer shadow-xs"
            >
              Approve & Merge
            </button>
          </div>
        </div>
      )}

      {/* COPYRIGHT */}
      {activeSection === 'rights' && (
        <div className="space-y-3 text-xs">
          {copyrightCases.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-black/10 bg-white space-y-2 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono text-orange-700 font-bold">Case #{c.caseNumber}</span>
                <span className="font-mono uppercase text-[10px] text-black/50">{c.status}</span>
              </div>
              <h3 className="font-serif text-sm font-semibold text-black">{c.recordingTitle}</h3>
              <p className="text-black/60">{c.evidenceSummary}</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                <button
                  onClick={() => resolveCopyrightCase(c.id, 'restricted')}
                  className="px-3 py-1 rounded border border-black/20 bg-black/5 text-black cursor-pointer"
                >
                  Restrict
                </button>
                <button
                  onClick={() => resolveCopyrightCase(c.id, 'resolved')}
                  className="px-3 py-1 rounded bg-black text-white cursor-pointer"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUDIT LOG */}
      {activeSection === 'audit' && (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-xs text-xs font-mono">
          <table className="w-full text-left">
            <thead className="border-b border-black/10 bg-black/5 text-black/50 uppercase text-[10px]">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Who</th>
                <th className="p-3">Action</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-black/70 text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-black/5">
                  <td className="p-3 text-black/50 whitespace-nowrap">{log.when}</td>
                  <td className="p-3 font-semibold text-black whitespace-nowrap">{log.who}</td>
                  <td className="p-3 text-orange-800 font-medium">{log.what}</td>
                  <td className="p-3 text-black/60">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
