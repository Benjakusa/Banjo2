/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BanjoProvider, useBanjo } from './context/BanjoContext';
import { Header } from './components/common/Header';
import { MiniPlayer } from './components/common/MiniPlayer';
import { FullPlayerModal } from './components/common/FullPlayerModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { EditSongModal } from './components/common/EditSongModal';
import { ReportProblemModal } from './components/common/ReportProblemModal';
import { DiffViewerModal } from './components/common/DiffViewerModal';
import { AddDetailModal } from './components/common/AddDetailModal';
import { CreateArticleModal } from './components/common/CreateArticleModal';
import { MobileBottomNav } from './components/common/MobileBottomNav';

// Views
import { HomeView } from './components/views/HomeView';
import { SongDetailView } from './components/views/SongDetailView';
import { SearchView } from './components/views/SearchView';
import { ExploreView } from './components/views/ExploreView';
import { TimelineView } from './components/views/TimelineView';
import { MusicianDetailView } from './components/views/MusicianDetailView';
import { BandDetailView } from './components/views/BandDetailView';
import { OralHistoryView } from './components/views/OralHistoryView';
import { DocumentsView } from './components/views/DocumentsView';
import { UploadContributeView } from './components/views/UploadContributeView';
import { ProfileDashboardView } from './components/views/ProfileDashboardView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { Phone, Display } from 'react-bootstrap-icons';

const AppContent: React.FC = () => {
  const { activeTab, toastMessage, navigateTo, isMobileDeviceFrame, setIsMobileDeviceFrame } = useBanjo();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'song_detail':
        return <SongDetailView />;
      case 'search':
        return <SearchView />;
      case 'explore':
        return <ExploreView />;
      case 'timeline':
        return <TimelineView />;
      case 'musician_detail':
        return <MusicianDetailView />;
      case 'band_detail':
        return <BandDetailView />;
      case 'oral_histories':
        return <OralHistoryView />;
      case 'documents':
        return <DocumentsView />;
      case 'upload':
        return <UploadContributeView />;
      case 'profile':
        return <ProfileDashboardView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <HomeView />;
    }
  };

  // If mobile simulator frame is enabled on desktop
  if (isMobileDeviceFrame) {
    return (
      <div className="min-h-screen bg-stone-200 text-stone-900 flex flex-col items-center justify-center p-2 sm:p-6 font-sans selection:bg-orange-100 selection:text-orange-950">
        {/* Simulator controls bar */}
        <div className="w-full max-w-sm mb-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-stone-300 shadow-xs text-xs">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <Phone className="w-4 h-4 text-orange-600" />
            <span>Mobile App View</span>
          </div>
          <button
            onClick={() => setIsMobileDeviceFrame(false)}
            className="flex items-center gap-1 text-[11px] text-orange-700 hover:text-orange-900 font-semibold cursor-pointer"
          >
            <Display className="w-3.5 h-3.5" />
            <span>Switch to Wide View</span>
          </button>
        </div>

        {/* Smartphone Hardware Frame Mockup (Clean flat borders) */}
        <div className="relative w-full max-w-[420px] h-[860px] rounded-[44px] border-[10px] border-stone-900 shadow-xl bg-[#FDFBF7] flex flex-col overflow-hidden">
          {/* Top Status Bar preview */}
          <div className="h-10 bg-white border-b border-stone-100 flex items-center justify-between px-7 text-[11px] font-mono text-stone-700 shrink-0 select-none z-30">
            <span>9:41</span>
            <div className="w-20 h-4 bg-stone-900 rounded-full" />
            <div className="flex items-center gap-1 text-[10px]">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-stone-600 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-stone-700 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* App Header */}
          <Header />

          {/* Scrollable Main Canvas */}
          <main className="flex-1 w-full overflow-y-auto pb-20">
            {renderActiveView()}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav />

          {/* Persistent MiniPlayer */}
          <MiniPlayer />

          {/* Home indicator bar */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-stone-400 rounded-full pointer-events-none z-50" />
        </div>

        {/* Modals & Dialogs */}
        <FullPlayerModal />
        <OnboardingModal />
        <EditSongModal />
        <ReportProblemModal />
        <DiffViewerModal />
        <AddDetailModal />
        <CreateArticleModal />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-stone-900 border border-stone-800 px-4 py-2.5 text-xs text-orange-400 shadow-xl flex items-center gap-2 font-mono"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Full Screen Responsive Web App Layout (Mobile-first with sticky bottom nav on small screens, wide editorial layout on desktop)
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-950">
      {/* Top Header */}
      <Header />

      {/* Main Archival Canvas */}
      <main className="flex-1 w-full pb-20 md:pb-12">
        {renderActiveView()}
      </main>

      {/* Persistent Mini-Player (Screen 14) */}
      <MiniPlayer />

      {/* Mobile-first Bottom Navigation Bar (visible on phone screens) */}
      <MobileBottomNav />

      {/* Modals & Dialogs */}
      <FullPlayerModal />
      <OnboardingModal />
      <EditSongModal />
      <ReportProblemModal />
      <DiffViewerModal />
      <AddDetailModal />
      <CreateArticleModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-stone-900 border border-stone-800 px-4 py-2.5 text-xs text-orange-400 shadow-xl flex items-center gap-2 font-mono"
        >
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Institutional Archival Footer (Desktop) */}
      <footer className="border-t border-stone-200 bg-stone-100 py-10 text-xs text-stone-600 hidden md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-stone-900 text-white font-serif font-bold text-xs">
                  W
                </span>
                <span className="font-display text-lg tracking-widest text-stone-900 font-bold">
                  BANJO
                </span>
              </div>
              <p className="text-stone-500 max-w-md text-xs leading-relaxed">
                African Music Heritage Encyclopedia · A collaborative digital repository documenting sound recordings, master musicians, traditions, and oral histories.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs">
              <button onClick={() => navigateTo('home')} className="hover:text-orange-700 cursor-pointer">
                Encyclopedia Home
              </button>
              <button onClick={() => navigateTo('explore')} className="hover:text-orange-700 cursor-pointer">
                Traditions & Countries
              </button>
              <button onClick={() => navigateTo('timeline')} className="hover:text-orange-700 cursor-pointer">
                Chronology
              </button>
              <button onClick={() => navigateTo('upload')} className="hover:text-orange-700 cursor-pointer">
                Contribute Entry
              </button>
              <button onClick={() => navigateTo('admin')} className="hover:text-orange-700 cursor-pointer font-medium text-orange-700">
                Archivist Console
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-stone-500">
            <span>
              Preserving African Musical Lineage · Open Cultural Encyclopedia
            </span>
            <span>
              Every song is a recording AND a historical story.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BanjoProvider>
      <AppContent />
    </BanjoProvider>
  );
}
