import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  Book,
  Search,
  PlusLg,
  ClockHistory,
  PersonFill,
  PlusCircleFill,
  FileEarmarkPlusFill,
  MusicNoteBeamed,
  XLg,
} from 'react-bootstrap-icons';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    navigateTo,
    setIsCreateArticleModalOpen,
    openQuickEdit,
    currentRecording,
    selectedSongId,
    selectedMusicianId,
    selectedBandId,
  } = useBanjo();

  const [isQuickActionMenuOpen, setIsQuickActionMenuOpen] = useState(false);

  const handleCenterAddClick = () => {
    setIsQuickActionMenuOpen(!isQuickActionMenuOpen);
  };

  const handleAddDetailToCurrent = () => {
    setIsQuickActionMenuOpen(false);
    const targetId =
      activeTab === 'song_detail'
        ? selectedSongId || currentRecording?.id || 'rec-001'
        : activeTab === 'musician_detail'
        ? selectedMusicianId || 'mus-peter-ochieng'
        : activeTab === 'band_detail'
        ? selectedBandId || 'band-victoria-stars'
        : currentRecording?.id || 'rec-001';

    openQuickEdit(targetId, 'musicians');
  };

  const handleCreateNewArticle = () => {
    setIsQuickActionMenuOpen(false);
    setIsCreateArticleModalOpen(true);
  };

  const handleUploadAudio = () => {
    setIsQuickActionMenuOpen(false);
    navigateTo('upload');
  };

  return (
    <>
      {/* Quick Action Sheet Popover */}
      {isQuickActionMenuOpen && (
        <div
          role="dialog"
          aria-label="Add options"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 p-3 md:hidden animate-in fade-in duration-150"
          onClick={() => setIsQuickActionMenuOpen(false)}
        >
          <div
            className="w-full rounded-2xl bg-white p-4 space-y-3 shadow-xl border border-black/10 animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="text-xs uppercase tracking-wider font-mono text-orange-700 font-bold">
                Wikipedia Contribution Menu
              </span>
              <button
                onClick={() => setIsQuickActionMenuOpen(false)}
                className="p-1 rounded text-black/40 hover:text-black/70 cursor-pointer"
              >
                <XLg className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={handleAddDetailToCurrent}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <PlusCircleFill className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-black">Add Details to Current Article</p>
                  <p className="text-[11px] text-black/60">
                    Add musician credits, historical lore, lyrics, or citations to this page
                  </p>
                </div>
              </button>

              <button
                onClick={handleCreateNewArticle}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/5 hover:bg-black/5 text-black font-medium text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-black/80 text-white flex items-center justify-center shrink-0">
                  <FileEarmarkPlusFill className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-black">Create New Encyclopedia Article</p>
                  <p className="text-[11px] text-black/60">
                    Document a new song, musician biography, or band history
                  </p>
                </div>
              </button>

              <button
                onClick={handleUploadAudio}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/5 hover:bg-black/5 text-black font-medium text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                  <MusicNoteBeamed className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-black">Upload Sound Recording</p>
                  <p className="text-[11px] text-black/60">
                    Submit a digitized tape, 45rpm record, or oral interview
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar for Mobile */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white px-2 py-1 flex items-center justify-around h-16 shadow-sm md:hidden"
      >
        {/* Tab 1: Encyclopedia (Home) */}
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'home' || activeTab === 'explore'
              ? 'text-orange-600 font-bold'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <Book className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Archive</span>
        </button>

        {/* Tab 2: Search */}
        <button
          onClick={() => navigateTo('search')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'search'
              ? 'text-orange-600 font-bold'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </button>

        {/* Center Raised Action Button: Add Details */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-4">
          <button
            onClick={handleCenterAddClick}
            aria-label="Add details or contribute article"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-700 active:scale-95 transition-transform cursor-pointer border-2 border-white"
          >
            <PlusLg className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-orange-700 tracking-tight mt-0.5">
            Add Details
          </span>
        </div>

        {/* Tab 4: Chronology / Timeline */}
        <button
          onClick={() => navigateTo('timeline')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'timeline'
              ? 'text-orange-600 font-bold'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <ClockHistory className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Timeline</span>
        </button>

        {/* Tab 5: Profile / Library */}
        <button
          onClick={() => navigateTo('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'profile'
              ? 'text-orange-600 font-bold'
              : 'text-black/50 hover:text-black'
          }`}
        >
          <PersonFill className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Profile</span>
        </button>
      </nav>
    </>
  );
};
