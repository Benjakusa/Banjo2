import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  Person,
  ShieldCheck,
  CheckCircle,
  ClockHistory,
  XCircle,
  Bookmark,
  MusicPlayer,
  PlayFill,
  Trash
} from 'react-bootstrap-icons';

export const ProfileDashboardView: React.FC = () => {
  const {
    userProfile,
    recordings,
    submissions,
    playSong,
    navigateTo,
    activeRole,
    setActiveRole,
    toggleSaveRecording,
  } = useBanjo();

  const [activeTab, setActiveTab] = useState<'contributions' | 'saved' | 'playlists' | 'drafts'>('contributions');

  const savedRecordings = recordings.filter((r) =>
    userProfile.savedRecordingIds.includes(r.id)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      {/* Contributor Profile Header */}
      <header className="rounded-2xl border border-ink-12 bg-paper p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand bg-ink-06 shrink-0">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  {userProfile.displayName}
                </h1>
                {userProfile.verifiedStatus && (
                  <span className="text-[10px] font-mono text-ink bg-ink-06 border border-ink-12 px-1.5 py-0.5 rounded font-bold">
                    Verified Archivist
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-60 font-mono">
                {userProfile.email} · Role: {activeRole}
              </p>
              <p className="text-xs text-ink-60 max-w-md pt-0.5 leading-relaxed">
                {userProfile.bio}
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-ink-06 border border-ink-12 rounded-xl text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-ink-60 block">Switch System Role:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="bg-paper border border-ink-12 rounded px-2 py-1 text-xs text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            >
              <option value="senior_archivist">Senior Archivist</option>
              <option value="archivist">Archivist</option>
              <option value="contributor">Contributor</option>
              <option value="rights_manager">Rights Manager</option>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Administrator</option>
            </select>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3.5 rounded-xl border border-ink-12 bg-paper">
          <span className="text-ink-60 text-[11px] block font-mono">Articles Submitted</span>
          <span className="font-mono text-xl font-bold text-ink mt-1 block">
            {userProfile.songsSubmitted}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-ink-12 bg-paper">
          <span className="text-ink-60 text-[11px] block font-mono">Edits Proposed</span>
          <span className="font-mono text-xl font-bold text-ink mt-1 block">
            {userProfile.editsSubmitted}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-ink-12 bg-paper">
          <span className="text-ink text-[11px] block font-mono">Approved Edits</span>
          <span className="font-mono text-xl font-bold text-ink mt-1 block">
            {userProfile.editsApproved}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-ink-12 bg-paper">
          <span className="text-ink-60 text-[11px] block font-mono">Under Review</span>
          <span className="font-mono text-xl font-bold text-ink-60 mt-1 block">
            {userProfile.pendingReview}
          </span>
        </div>
      </section>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
          {[
            { key: 'contributions', label: `My Submissions (${submissions.length})` },
            { key: 'saved', label: `Saved Articles (${savedRecordings.length})` },
            { key: 'playlists', label: `Playlists (${userProfile.playlists.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-brand text-on-orange font-bold'
                  : 'text-ink-60 hover:text-ink hover:bg-ink-06'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        {activeTab === 'contributions' && (
          <div className="space-y-2.5">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl border border-ink-12 bg-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] text-ink-60 uppercase font-bold block">
                    {sub.category} · {sub.submittedAt.slice(0, 10)}
                  </span>
                  <h3 className="font-serif text-sm font-semibold text-ink mt-0.5">{sub.title}</h3>
                  <p className="text-ink-60 text-[11px] mt-0.5">{sub.rightsDeclaration}</p>
                </div>
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border self-start sm:self-auto ${
                    sub.status === 'approved'
                      ? 'text-ink bg-ink-06 border-ink-12'
                      : sub.status === 'rejected'
                      ? 'text-ink bg-ink-06 border-ink-12'
                      : 'text-ink bg-ink-06 border-ink-12'
                  }`}
                >
                  {sub.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Saved Songs */}
        {activeTab === 'saved' && (
          <div className="space-y-2">
            {savedRecordings.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl border border-ink-12 bg-paper hover:border-brand transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={rec.coverImage}
                    alt={rec.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded object-cover border border-ink-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4
                      onClick={() => navigateTo('song_detail', { songId: rec.id })}
                      className="font-serif text-sm font-semibold text-link hover:underline cursor-pointer truncate"
                    >
                      {rec.title}
                    </h4>
                    <p className="text-ink-60 text-[11px]">{rec.artistOrBand} · {rec.releaseYear}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playSong(rec)}
                    className="p-1.5 rounded-full bg-brand text-on-orange hover:bg-brand cursor-pointer"
                  >
                    <PlayFill className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                  <button
                    onClick={() => toggleSaveRecording(rec.id)}
                    className="p-1.5 text-ink-60 hover:text-link cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Playlists */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {userProfile.playlists.map((pl) => (
              <div key={pl.id} className="p-4 rounded-xl border border-ink-12 bg-paper space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-sm font-bold text-ink">{pl.name}</h3>
                  <span className="font-mono text-ink-60 text-[11px]">{pl.songIds.length} tracks</span>
                </div>
                <p className="text-ink-60 text-[11px] leading-relaxed">{pl.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
