import React, { useEffect, useMemo, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  ShieldShaded,
  CheckCircle,
  ExclamationTriangle,
  Diagram3,
  Inbox,
  ClipboardCheck,
  ClockHistory,
  Gear,
  People,
  GraphUp,
  Lock,
  QuestionCircle,
} from 'react-bootstrap-icons';
import { roleLabel } from '../../lib/auth';

/**
 * The super administrator's control room.
 *
 * Separate from AdminDashboardView, which is the moderation desk shared by
 * every elevated role. This view adds what only a platform owner needs:
 * a whole-archive inventory across every entity type the catalogue holds, and
 * a single queue merging every kind of pending request so nothing waits in a
 * tab nobody opened.
 *
 * It never widens access. Row Level Security is still the gate — the client
 * only renders what the signed-in account is already allowed to read, and role
 * changes still go through a trusted database operation (see the repo's setup
 * guide).
 */

type Section = 'monitor' | 'approvals' | 'review' | 'audit' | 'system';

/** One row of the merged approval queue: a submission or a rights case. */
type QueueItem = {
  kind: 'submission' | 'rights';
  id: string;
  title: string;
  who: string;
  when: string;
  detail: string;
  priority: string;
};

const priorityRank: Record<string, number> = { high: 0, normal: 1, low: 2 };

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


export const SuperAdminDashboardView: React.FC = () => {
  const {
    recordings,
    songs,
    musicians,
    bands,
    albums,
    oralHistories,
    documents,
    submissions,
    reviewSubmission,
    getSubmissionAudioPreviewUrl,
    copyrightCases,
    resolveCopyrightCase,
    auditLogs,
    activeRole,
    userProfile,
    authEmail,
    isBackendConnected,
    isCatalogueLoading,
    isOfflineMode,
  } = useBanjo();

  const [activeSection, setActiveSection] = useState<Section>('monitor');
  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id || '');
  const [reviewNote, setReviewNote] = useState('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState('');

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

  // Every request that still wants a decision, most urgent first, with the two
  // different back-ends (submissions, rights cases) merged into one list.
  const approvalQueue = useMemo<QueueItem[]>(() => {
    const pendingSubs: QueueItem[] = submissions
      .filter((s) => s.status === 'pending' || s.status === 'evidence_requested')
      .map((s) => ({
        kind: 'submission',
        id: s.id,
        title: s.title,
        who: s.contributorName || s.contributorEmail || 'Unknown contributor',
        when: s.submittedAt,
        detail: `${s.category} · ${s.type}`,
        priority: s.priority,
      }));

    const openCases: QueueItem[] = copyrightCases
      .filter((c) => c.status === 'open' || c.status === 'investigating')
      .map((c) => ({
        kind: 'rights',
        id: c.id,
        title: c.recordingTitle || `Case #${c.caseNumber}`,
        who: c.claimantName || c.claimantEmail || 'Unknown claimant',
        when: c.filedDate,
        detail: `${c.claimType.replace(/_/g, ' ')} · case #${c.caseNumber}`,
        // A takedown request outranks an ordinary metadata edit.
        priority: c.claimType === 'takedown_request' ? 'high' : 'normal',
      }));

    return [...pendingSubs, ...openCases].sort(
      (a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1)
    );
  }, [submissions, copyrightCases]);

  const catalogueTotal =
    songs.length +
    recordings.length +
    musicians.length +
    bands.length +
    albums.length +
    oralHistories.length +
    documents.length;

  const needsAttention = approvalQueue.length;

  const filteredAuditLogs = useMemo(() => {
    const needle = auditFilter.trim().toLowerCase();
    if (!needle) return auditLogs;
    return auditLogs.filter((log) =>
      [log.who, log.what, log.where, log.reason].some((field) =>
        (field || '').toLowerCase().includes(needle)
      )
    );
  }, [auditLogs, auditFilter]);

  const handleReviewAction = (decision: 'approve' | 'reject' | 'evidence_requested') => {
    if (!currentSub) return;
    void reviewSubmission(currentSub.id, decision, reviewNote);
    setReviewNote('');
  };

  // Approve straight from the queue without leaving the list.
  const approveFromQueue = (submissionId: string) => {
    void reviewSubmission(submissionId, 'approve', reviewNote);
    setReviewNote('');
  };

  const inventory: { label: string; count: number }[] = [
    { label: 'Compositions', count: songs.length },
    { label: 'Recordings', count: recordings.length },
    { label: 'Musicians', count: musicians.length },
    { label: 'Bands', count: bands.length },
    { label: 'Albums', count: albums.length },
    { label: 'Oral histories', count: oralHistories.length },
    { label: 'Documents', count: documents.length },
  ];

  const sectionTabs: { key: Section; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'monitor', label: 'Monitor', Icon: Diagram3 },
    { key: 'approvals', label: `Approvals (${needsAttention})`, Icon: Inbox },
    { key: 'review', label: 'Review', Icon: ClipboardCheck },
    { key: 'audit', label: `Audit (${auditLogs.length})`, Icon: ClockHistory },
    { key: 'system', label: 'System', Icon: Gear },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-12 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold block">
            Platform Owner Control Room
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5 flex items-center gap-2">
            <ShieldShaded className="text-brand" aria-hidden="true" />
            Super Administration
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-60 font-mono">Signed in as:</span>
          <span className="rounded-lg border border-ink-12 px-2.5 py-1 text-xs font-medium text-ink font-mono max-w-[16rem] truncate">
            {authEmail ?? userProfile.email}
          </span>
          <span className="rounded-lg border border-brand bg-brand/10 px-2.5 py-1 text-xs font-medium text-ink">
            {roleLabel(activeRole)}
          </span>
          <span
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium border border-ink-12 bg-ink-06 ${
              isBackendConnected ? 'text-ink' : 'text-ink-60'
            }`}
            title={isBackendConnected ? 'Connected to the live archive' : 'Running in local fallback mode'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-ink animate-pulse' : 'bg-ink/40'}`}></span>
            {isBackendConnected ? 'Live Archive' : 'Local Fallback'}
          </span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
        {sectionTabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSection === key
                ? 'bg-brand text-on-orange font-bold'
                : 'text-ink-60 hover:text-ink hover:bg-ink-06'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* MONITOR — the whole archive at a glance */}
      {activeSection === 'monitor' && (
        <div className="space-y-6">
          {/* Attention banner: the one number a platform owner checks first. */}
          <button
            onClick={() => setActiveSection('approvals')}
            className={`w-full text-left rounded-xl border p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
              needsAttention > 0
                ? 'border-brand bg-brand/10 hover:bg-brand/15'
                : 'border-ink-12 bg-paper'
            }`}
          >
            <span className="flex items-center gap-3">
              {needsAttention > 0 ? (
                <ExclamationTriangle className="text-brand w-5 h-5 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle className="text-ink-60 w-5 h-5 shrink-0" aria-hidden="true" />
              )}
              <span>
                <span className="block font-serif font-semibold text-ink text-sm">
                  {needsAttention > 0
                    ? `${needsAttention} request${needsAttention === 1 ? '' : 's'} awaiting a decision`
                    : 'Nothing is waiting for a decision'}
                </span>
                <span className="block text-xs text-ink-60">
                  {needsAttention > 0
                    ? 'Merges the moderation queue and open rights cases, most urgent first.'
                    : 'The moderation queue and rights console are both clear.'}
                </span>
              </span>
            </span>
            {needsAttention > 0 && (
              <span className="font-mono text-2xl font-bold text-ink shrink-0">{needsAttention}</span>
            )}
          </button>

          {/* Inventory */}
          <div>
            <h2 className="font-serif font-bold text-ink text-sm mb-3 flex items-center gap-2">
              <GraphUp className="text-ink-60" aria-hidden="true" />
              Archive inventory
              {isCatalogueLoading && (
                <span className="text-xs font-mono text-ink-60 font-normal">— loading…</span>
              )}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {inventory.map((row) => (
                <div key={row.label} className="p-4 rounded-xl border border-ink-12 bg-paper">
                  <span className="text-ink-60 font-mono text-[11px] block">{row.label}</span>
                  <span className="font-mono text-2xl font-bold text-ink mt-1 block">{row.count}</span>
                </div>
              ))}
              <div className="p-4 rounded-xl border border-ink-12 bg-ink-06">
                <span className="text-ink-60 font-mono text-[11px] block font-bold">Total entities</span>
                <span className="font-mono text-2xl font-bold text-ink mt-1 block">{catalogueTotal}</span>
              </div>
            </div>
          </div>

          {/* Workload */}
          <div>
            <h2 className="font-serif font-bold text-ink text-sm mb-3 flex items-center gap-2">
              <Inbox className="text-ink-60" aria-hidden="true" />
              Moderation workload
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-ink-12 bg-paper">
                <span className="text-ink-60 font-mono text-[11px] block">Submissions awaiting review</span>
                <span className="font-mono text-2xl font-bold text-ink mt-1 block">
                  {submissions.filter((s) => s.status === 'pending').length}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-ink-12 bg-paper">
                <span className="text-ink-60 font-mono text-[11px] block">Evidence requested</span>
                <span className="font-mono text-2xl font-bold text-ink-60 mt-1 block">
                  {submissions.filter((s) => s.status === 'evidence_requested').length}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-ink-12 bg-paper">
                <span className="text-ink-60 font-mono text-[11px] block">Open rights cases</span>
                <span className="font-mono text-2xl font-bold text-ink mt-1 block">
                  {copyrightCases.filter((c) => c.status === 'open' || c.status === 'investigating').length}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-ink-12 bg-paper">
                <span className="text-ink-60 font-mono text-[11px] block">Rights cases closed</span>
                <span className="font-mono text-2xl font-bold text-ink-60 mt-1 block">
                  {copyrightCases.filter(
                    (c) => c.status === 'resolved' || c.status === 'dismissed' || c.status === 'restricted'
                  ).length}
                </span>
              </div>
            </div>
          </div>

          {/* Throughput */}
          <div className="rounded-xl border border-ink-12 bg-paper p-5 space-y-3 text-xs">
            <h3 className="font-serif font-bold text-ink text-sm">Decision throughput</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Submissions approved</span>
                <span className="text-ink font-bold">{submissions.filter((s) => s.status === 'approved').length}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Submissions rejected</span>
                <span className="text-ink font-bold">{submissions.filter((s) => s.status === 'rejected').length}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Audited actions recorded</span>
                <span className="text-ink font-bold">{auditLogs.length}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Total decisions made</span>
                <span className="text-ink font-bold">
                  {submissions.filter((s) => s.status !== 'pending' && s.status !== 'evidence_requested').length +
                    copyrightCases.filter((c) => c.status !== 'open' && c.status !== 'investigating').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS — every request that wants a decision, in one queue */}
      {activeSection === 'approvals' && (
        <div className="space-y-3">
          {approvalQueue.length === 0 ? (
            <div className="rounded-xl border border-ink-12 bg-paper p-10 text-center space-y-2">
              <CheckCircle className="mx-auto w-8 h-8 text-ink-60" aria-hidden="true" />
              <p className="font-serif text-ink font-semibold">The queue is clear</p>
              <p className="text-xs text-ink-60">
                New contributions and rights reports appear here the moment they are filed.
              </p>
            </div>
          ) : (
            approvalQueue.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="p-4 rounded-xl border border-ink-12 bg-paper space-y-2 text-xs"
              >
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                        item.kind === 'rights'
                          ? 'border-brand bg-brand/10 text-ink'
                          : 'border-ink-12 bg-ink-06 text-ink-60'
                      }`}
                    >
                      {item.kind === 'rights' ? 'Rights case' : 'Submission'}
                    </span>
                    {item.priority === 'high' && (
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border border-brand text-ink flex items-center gap-1">
                        <ExclamationTriangle className="w-3 h-3" aria-hidden="true" />
                        High priority
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-ink-60 text-[11px]">{item.when.slice(0, 10)}</span>
                </div>

                <h3 className="font-serif text-sm font-semibold text-ink">{item.title}</h3>
                <p className="text-ink-60 font-mono text-[11px]">
                  {item.detail} · from {item.who}
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-ink-12">
                  {item.kind === 'rights' ? (
                    <>
                      <button
                        onClick={() => resolveCopyrightCase(item.id, 'dismissed')}
                        className="px-3 py-1 rounded border border-ink-12 bg-ink-06 text-ink-60 cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => resolveCopyrightCase(item.id, 'restricted')}
                        className="px-3 py-1 rounded border border-ink-12 bg-ink-06 text-ink cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                          Restrict
                        </span>
                      </button>
                      <button
                        onClick={() => resolveCopyrightCase(item.id, 'resolved')}
                        className="px-4 py-1.5 rounded-lg bg-ink text-paper font-semibold cursor-pointer"
                      >
                        Resolve
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedSubId(item.id);
                          setActiveSection('review');
                        }}
                        className="px-3 py-1 rounded border border-ink-12 bg-ink-06 text-ink-60 cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => approveFromQueue(item.id)}
                        className="px-4 py-1.5 rounded-lg bg-ink text-paper font-semibold cursor-pointer"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REVIEW — the full verification workspace for one submission */}
      {activeSection === 'review' &&
        (currentSub ? (
          <div className="rounded-2xl border border-ink-12 bg-paper p-3 space-y-5 text-xs sm:p-6">
            {currentSub.proposedData.audioStoragePath && (
              <section className="rounded-xl border border-ink-12 bg-ink-06 p-4 space-y-2">
                <h2 className="font-semibold text-sm">Private submission audio</h2>
                {audioPreviewUrl ? (
                  <audio controls preload="none" src={audioPreviewUrl} className="w-full" />
                ) : (
                  <p className="text-xs text-ink-60">Private preview is unavailable or still loading.</p>
                )}
                <p className="text-xs text-ink-60">
                  Audio stays private until rights clearance is implemented.
                </p>
              </section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-12 pb-3">
              <div>
                <span className="text-[10px] font-mono text-ink-60 uppercase font-bold block">
                  Verification Task
                </span>
                <h2 className="text-xl font-serif font-medium text-ink mt-0.5">{currentSub.title}</h2>
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
                  {currentSub.currentData.coverImage && (
                    <img
                      src={currentSub.currentData.coverImage}
                      alt="Current cover art"
                      className="mt-2 h-24 w-24 rounded-lg border border-ink-12 object-cover"
                    />
                  )}
                </div>
              )}
              <div className="p-3 rounded-lg bg-brand/10 border border-brand space-y-1">
                <span className="font-mono text-[10px] uppercase text-ink-60 font-bold block">Proposed Additions</span>
                <pre className="text-[11px] text-ink whitespace-pre-wrap font-sans font-medium">
                  {formatSubmissionData(currentSub.proposedData)}
                </pre>
                {currentSub.proposedData.coverImage && (
                  <img
                    src={currentSub.proposedData.coverImage}
                    alt="Proposed cover art"
                    className="mt-2 h-24 w-24 rounded-lg border border-ink-12 object-cover"
                  />
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-ink-06 border border-ink-12 space-y-1">
              <span className="font-mono text-[10px] uppercase text-ink-60 font-bold block">Sources & Rights</span>
              <p className="text-ink-60">{currentSub.sourcesProvided || 'Source citation attached'}</p>
              <p className="text-ink-60 text-[11px]">{currentSub.rightsDeclaration}</p>
            </div>

            <div>
              <label htmlFor="sa-review-note" className="block text-ink-60 font-medium mb-1">
                Archivist Verification Note
              </label>
              <input
                id="sa-review-note"
                type="text"
                placeholder="e.g. Cross-checked with 1978 session sheet..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full rounded-lg border border-ink-12 bg-paper px-3 py-2 text-xs text-ink"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-ink-12">
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
                className="px-4 py-1.5 rounded-lg bg-ink text-paper font-semibold cursor-pointer"
              >
                Approve & Merge
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-ink-12 bg-paper p-10 text-center space-y-2">
            <ClipboardCheck className="mx-auto w-8 h-8 text-ink-60" aria-hidden="true" />
            <p className="font-serif text-ink font-semibold">No submission selected</p>
            <p className="text-xs text-ink-60">
              Pick one from the Approvals queue to open its verification task.
            </p>
            <button
              onClick={() => setActiveSection('approvals')}
              className="px-4 py-1.5 rounded-lg bg-ink text-paper font-semibold text-xs cursor-pointer"
            >
              Open the queue
            </button>
          </div>
        ))}

      {/* AUDIT — every recorded decision, searchable */}
      {activeSection === 'audit' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="search"
              placeholder="Filter by who, what, where or reason…"
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="flex-1 min-w-[16rem] rounded-lg border border-ink-12 bg-paper px-3 py-2 text-xs font-mono text-ink"
              aria-label="Filter the audit log"
            />
            <span className="font-mono text-[11px] text-ink-60">
              {filteredAuditLogs.length} of {auditLogs.length} entries
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-ink-12 bg-paper text-xs font-mono">
            <table className="w-full text-left">
              <thead className="border-b border-ink-12 bg-ink-06 text-ink-60 uppercase text-[10px]">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Who</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-12 text-ink-60 text-[11px]">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-ink-60">
                      {auditLogs.length === 0
                        ? 'No decisions have been recorded yet.'
                        : 'No entries match that filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-ink-06">
                      <td className="p-3 text-ink-60 whitespace-nowrap">{log.when}</td>
                      <td className="p-3 font-semibold text-ink whitespace-nowrap">{log.who}</td>
                      <td className="p-3 text-ink-60 font-medium">{log.what}</td>
                      <td className="p-3 text-ink-60">{log.where}</td>
                      <td className="p-3 text-ink-60">{log.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM — health, and the honest limits of what the client may do */}
      {activeSection === 'system' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-12 bg-paper p-5 space-y-3 text-xs">
            <h3 className="font-serif font-bold text-ink text-sm flex items-center gap-2">
              <Gear className="text-ink-60" aria-hidden="true" />
              Archive health
            </h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Database connection</span>
                <span className="text-ink font-bold">{isBackendConnected ? 'Connected' : 'Unavailable'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Storage mode</span>
                <span className="text-ink font-bold">
                  {isOfflineMode ? 'This browser only (no backend)' : 'Shared archive backend'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Catalogue loaded</span>
                <span className="text-ink font-bold">{isCatalogueLoading ? 'Loading…' : 'Complete'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-ink-06 border border-ink-12">
                <span className="text-ink-60">Entities under management</span>
                <span className="text-ink font-bold">{catalogueTotal}</span>
              </div>
            </div>
          </div>

          {/* Be explicit: the browser cannot mint admins, by design. */}
          <div className="rounded-xl border border-ink-12 bg-paper p-5 space-y-3 text-xs">
            <h3 className="font-serif font-bold text-ink text-sm flex items-center gap-2">
              <People className="text-ink-60" aria-hidden="true" />
              Roles & access
            </h3>
            <div className="p-3 rounded-lg bg-ink-06 border border-ink-12 space-y-2">
              <p className="text-ink">
                <span className="font-mono font-bold">Your role:</span> {roleLabel(activeRole)}
              </p>
              <p className="text-ink-60 leading-relaxed">
                Staff roles are provisioned by a trusted database operation, never from the browser. Row
                Level Security hides other accounts from everyone including you, so this screen cannot
                list or create users — that is the security model working, not a missing feature.
              </p>
              <p className="text-ink-60 leading-relaxed">
                To grant a role, run the promotion statement in the project's SQL Editor against{' '}
                <code className="font-mono text-ink">app_profiles.role</code>, then have that person sign
                in again. The snippet is in the repository's database setup guide.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ink-06 border border-ink-12">
              <p className="text-ink-60 leading-relaxed">
                <QuestionCircle className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Elevated roles that unlock this tooling:{' '}
                <span className="font-mono text-ink">
                  Super Admin, Platform Admin, Senior Archivist, Archivist, Moderator, Rights Manager,
                  Support Agent
                </span>
                . Only the SQL Editor can move an account between them.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-ink-12 bg-paper p-5 space-y-3 text-xs">
            <h3 className="font-serif font-bold text-ink text-sm flex items-center gap-2">
              <ExclamationTriangle className="text-ink-60" aria-hidden="true" />
              Standing policy
            </h3>
            <p className="text-ink-60 leading-relaxed">
              Approving a submission publishes its metadata to the public catalogue, and a contributor's
              rights declaration is what makes uploaded audio immediately public. Nothing here is
              irreversible from the database side, but treat every approval as a publication.
            </p>
          </div>
        </div>
      )}









    </div>
  );
};

export default SuperAdminDashboardView;

