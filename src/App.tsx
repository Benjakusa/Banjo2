import React from 'react';
import { BanjoProvider, useBanjo } from './context/BanjoContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MiniPlayer } from './components/common/MiniPlayer';
import { FullPlayerModal } from './components/common/FullPlayerModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { EditSongModal } from './components/common/EditSongModal';
import { ReportProblemModal } from './components/common/ReportProblemModal';
import { DiffViewerModal } from './components/common/DiffViewerModal';
import { AddDetailModal } from './components/common/AddDetailModal';
import { CreateArticleModal } from './components/common/CreateArticleModal';
import { MobileBottomNav } from './components/common/MobileBottomNav';

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

const AppContent: React.FC = () => {
  const { activeTab, toastMessage, navigateTo, userProfile } = useBanjo();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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

  const archivistRoles = [
    'super_admin',
    'platform_admin',
    'senior_archivist',
    'archivist',
    'moderator',
    'rights_manager',
    'support_agent',
    'analyst',
  ];

  return (
    <div className="min-h-screen bg-[var(--banjo-primary)] text-[var(--banjo-text)]">
      <Header onOpenNav={() => setIsSidebarOpen(true)} />

      <div className="mx-auto flex w-full max-w-[1800px]">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="min-w-0 flex-1 pb-40 sm:pb-24 min-[1000px]:pb-8">{renderActiveView()}</main>
      </div>

      <footer className="border-t border-[var(--banjo-line)] bg-[var(--banjo-surface)]-2 px-4 py-8 text-xs text-[var(--banjo-muted)] sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--banjo-primary)] font-serif text-xs font-bold text-white">
                &#9834;
              </span>
              <span className="text-base font-bold tracking-tight text-[var(--banjo-text)]">Banjo</span>
            </div>
            <p className="max-w-md leading-relaxed">
              The free encyclopedia of African music that anyone can edit. Every recording, credit,
              lyric, and claim here is community-submitted, sourced, and versioned.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="transition-colors hover:text-[var(--banjo-text)]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigateTo('explore')}
              className="transition-colors hover:text-[var(--banjo-text)]"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => navigateTo('timeline')}
              className="transition-colors hover:text-[var(--banjo-text)]"
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => navigateTo('upload')}
              className="transition-colors hover:text-[var(--banjo-text)]"
            >
              Contribute
            </button>
            {archivistRoles.includes(userProfile.role) && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="font-semibold text-[var(--banjo-primary)] transition-opacity hover:opacity-80"
              >
                Archivist tools
              </button>
            )}
          </nav>
        </div>
      </footer>

      <MiniPlayer />
      <MobileBottomNav />

      <FullPlayerModal />
      <OnboardingModal />
      <EditSongModal />
      <ReportProblemModal />
      <DiffViewerModal />
      <AddDetailModal />
      <CreateArticleModal />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--banjo-text)] px-4 py-2.5 text-xs text-[var(--banjo-bg)] shadow-xl sm:bottom-6"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--banjo-accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}
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
