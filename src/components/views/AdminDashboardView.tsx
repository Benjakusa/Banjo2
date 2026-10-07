import React, { useEffect, useState } from 'react';
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
  Funnel,
  Lock
} from 'react-bootstrap-icons';
import { roleLabel } from '../../lib/auth';

const formatSubmissionData = (data: Record<string, string>) => {
  const displayData: Record<string, unknown> = { ...data };
  if (data.coverImage) displayData.coverImage = 'Cover image attached';
  if (data.musicians) {
    try {
      displayData.musicians = JSON.parse(data.musicians);
    } catch {
      displayData.musicians = 'Contributor credits attached';
    }
  }
  return JSON.stringify(displayData, null, 2);
};

export const AdminDashboardView: React.FC = () => {
  const {
    recordings,
    songs,
    musicians,
    bands,
    submissions,
    reviewSubmission,
    getSubmissionAudioPreviewUrl,
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
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const currentSub = submissions.find((s) => s.id === selectedSubId) || submissions[0];

  useEffect(() => {
    let active = true;
    setAudioPreviewUrl(null);
    const path = currentSub?.proposedData.audioStoragePath;
    if (path) {
      void getSubmissionAudioPreviewUrl(path).then((url) => {
        if (active) setAudioPreviewUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [currentSub?.id, currentSub?.proposedData.audioStoragePath, getSubmissionAudioPreviewUrl]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-12 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold block">
            Archival Moderation Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">
            Encyclopedia Administration & Review
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-60 font-mono">Role:</span>
          <span className="rounded-lg border border-ink-12 px-2.5 py-1 text-xs font-medium text-ink">
            {roleLabel(activeRole)}
          </span>
          <span
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium ${
              isBackendConnected
                ? 'bg-ink-06 text-ink border border-ink-12'
                : 'bg-ink-06 text-ink-60 border border-ink-12'
            }`}
            title={isBackendConnected ? 'Connected to the live archive' : 'Running in local fallback mode'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-ink animate-pulse' : 'bg-ink/40'}`}></span>
            {isBackendConnected ? 'Live Archive' : 'Local Fallback'}
          </span>
        </div>
      </div>

      {currentSub?.proposedData.audioStoragePath && (
        <section className="rounded-xl border border-ink-12 bg-paper p-4 space-y-2">
          <h2 className="font-semibold text-sm">Private submission audio</h2>
          {audioPreviewUrl ? (
            <audio controls preload="none" src={audioPreviewUrl} className="w-full" />
          ) : (
            <p className="text-xs text-ink-60">Private preview is unavailable or still loading.</p>
          )}
          <p className="text-xs text-ink-60">Audio remains private after metadata approval until rights clearance is implemented.</p>
        </section>
      )}

      {/* Admin Section Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
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
                ? 'bg-brand text-on-orange font-bold'
                : 'text-ink-60 hover:text-ink hover:bg-ink-06'
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
            <div className="p-4 rounded-xl border border-ink-12 bg-paper">
              <span className="text-ink-60 font-mono text-[11px] block">Compositions</span>
              <span className="font-mono text-2xl font-bold text-ink mt-1 block">
                {songs.length}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-ink-12 bg-paper">
              <span className="text-ink-60 font-mono text-[11px] block">Recordings</span>
              <span className="font-mono text-2xl font-bold text-ink mt-1 block">
                {recordings.length}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-ink-12 bg-paper">
              <span className="text-ink-60 font-mono text-[11px] block">Musicians</span>
              <span className="font-mono text-2xl font-bold text-ink mt-1 block">
                {musicians.length}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-ink-12 bg-paper">
              <span className="text-ink-60 font-mono text-[11px] block font-bold">Pending Review</span>
              <span className="font-mono text-2xl font-bold text-ink-60 mt-1 block">
                {submissions.filter((s) => s.status === 'pending').length}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-ink-12 bg-paper p-5 space-y-3 text-xs">
            <h3 className="font-serif font-bold text-ink text-sm">Configured Service Status</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Database Engine:</span>
                <span className="text-ink font-bold">{isBackendConnected ? 'Connected' : 'Unavailable'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Audio storage:</span>
                <span className="text-ink">Private uploads require the media storage SQL setup.</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">CDN:</span>
                <span className="text-ink font-bold">Not configured by the application.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION QUEUE */}
      {activeSection === 'moderation' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-ink-12 bg-paper">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-12 bg-ink-06 text-ink-60 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Title & Category</th>
                  <th className="p-3">Contributor</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-12 text-ink-60">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-ink-06">
                    <td className="p-3 font-medium text-ink">
                      <span className="font-mono text-[10px] text-ink-60 uppercase block font-bold">{sub.category}</span>
                      {sub.title}
                    </td>
                    <td className="p-3 font-mono text-[11px]">{sub.contributorName}</td>
                    <td className="p-3 font-mono text-ink-60 text-[11px]">{sub.submittedAt.slice(0, 10)}</td>
                    <td className="p-3 font-mono uppercase text-[10px]">
                      <span className="text-ink">
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setActiveSection('review');
                        }}
                        className="px-2.5 py-1 rounded-md border border-ink-12 bg-paper text-ink-60 hover:border-brand text-[11px] cursor-pointer"
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
        <div className="rounded-2xl border border-ink-12 bg-paper p-3 space-y-5 text-xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-12 pb-3">
            <div>
              <span className="text-[10px] font-mono text-ink-60 uppercase font-bold block">
                Verification Task
              </span>
              <h2 className="text-xl font-serif font-medium text-ink mt-0.5">
                {currentSub.title}
              </h2>
              <p className="text-ink-60">Submitted by: {currentSub.contributorName}</p>
            </div>
            <span className="font-mono text-[11px] uppercase text-ink-60 bg-brand/10 px-2 py-0.5 rounded border border-brand">
              {currentSub.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentSub.currentData && (
              <div className="p-3 rounded-lg bg-ink-06 border border-ink-12 space-y-1">
                <span className="font-mono text-[10px] uppercase text-ink-60 font-bold block">Current Entry</span>
                <pre className="text-[11px] text-ink-60 whitespace-pre-wrap font-sans">
                  {formatSubmissionData(currentSub.currentData)}
                </pre>
                {currentSub.currentData.coverImage && <img src={currentSub.currentData.coverImage} alt="Current cover art" className="mt-2 h-24 w-24 rounded-lg border border-ink-12 object-cover" />}
              </div>
            )}
            <div className="p-3 rounded-lg bg-brand/10 border border-brand space-y-1">
              <span className="font-mono text-[10px] uppercase text-ink-60 font-bold block">Proposed Additions</span>
              <pre className="text-[11px] text-ink whitespace-pre-wrap font-sans font-medium">
                {formatSubmissionData(currentSub.proposedData)}
              </pre>
              {currentSub.proposedData.coverImage && <img src={currentSub.proposedData.coverImage} alt="Proposed cover art" className="mt-2 h-24 w-24 rounded-lg border border-ink-12 object-cover" />}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-ink-06 border border-ink-12 space-y-1">
            <span className="font-mono text-[10px] uppercase text-ink-60 font-bold block">Sources & Rights</span>
            <p className="text-ink-60">{currentSub.sourcesProvided || 'Source citation attached'}</p>
            <p className="text-ink-60 text-[11px]">{currentSub.rightsDeclaration}</p>
          </div>

          <div>
            <label className="block text-ink-60 font-medium mb-1">Archivist Verification Note</label>
            <input
              type="text"
              placeholder="e.g. Cross-checked with 1978 session sheet..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-xs text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-12">
            <button
              onClick={() => handleReviewAction('evidence_requested')}
              className="px-3.5 py-1.5 rounded-lg border border-brand bg-brand/10 text-ink-60 font-medium cursor-pointer"
            >
              Request Evidence
            </button>
            <button
              onClick={() => handleReviewAction('reject')}
              className="px-3.5 py-1.5 rounded-lg border border-ink-12 bg-ink-06 text-ink font-medium cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={() => handleReviewAction('approve')}
              className="px-4 py-1.5 rounded-lg bg-ink text-paper font-semibold hover:bg-ink cursor-pointer"
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
            <div key={c.id} className="p-4 rounded-xl border border-ink-12 bg-paper space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-ink-60 font-bold">Case #{c.caseNumber}</span>
                <span className="font-mono uppercase text-[10px] text-ink-60">{c.status}</span>
              </div>
              <h3 className="font-serif text-sm font-semibold text-ink">{c.recordingTitle}</h3>
              <p className="text-ink-60">{c.evidenceSummary}</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-ink-12">
                <button
                  onClick={() => resolveCopyrightCase(c.id, 'restricted')}
                  className="px-3 py-1 rounded border border-ink-12 bg-ink-06 text-ink cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                    Restrict
                  </span>
                </button>
                <button
                  onClick={() => resolveCopyrightCase(c.id, 'resolved')}
                  className="px-3 py-1 rounded bg-ink text-paper cursor-pointer"
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
        <div className="overflow-x-auto rounded-xl border border-ink-12 bg-paper text-xs font-mono">
          <table className="w-full text-left">
            <thead className="border-b border-ink-12 bg-ink-06 text-ink-60 uppercase text-[10px]">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Who</th>
                <th className="p-3">Action</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-12 text-ink-60 text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-ink-06">
                  <td className="p-3 text-ink-60 whitespace-nowrap">{log.when}</td>
                  <td className="p-3 font-semibold text-ink whitespace-nowrap">{log.who}</td>
                  <td className="p-3 text-ink-60 font-medium">{log.what}</td>
                  <td className="p-3 text-ink-60">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
