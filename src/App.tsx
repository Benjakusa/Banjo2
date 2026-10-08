import React from 'react';
import { BanjoProvider, useBanjo, MainNavTab } from './context/BanjoContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MiniPlayer } from './components/common/MiniPlayer';
import { FullPlayerModal } from './components/common/FullPlayerModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { ReportProblemModal } from './components/common/ReportProblemModal';
import { DiffViewerModal } from './components/common/DiffViewerModal';
import { AddDetailModal } from './components/common/AddDetailModal';
import { CreateArticleModal } from './components/common/CreateArticleModal';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Wordmark } from './components/common/Wordmark';

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
import { SignInView } from './components/views/SignInView';
import { isElevated } from './lib/auth';

const AppContent: React.FC = () => {
  const { activeTab, toastMessage, navigateTo, userProfile, isAuthenticated, activeRole, showToast } = useBanjo();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Reading is open to everyone. Contributing and archivist tools are not.
  const PROTECTED_TABS: MainNavTab[] = ['upload', 'admin', 'profile'];
  const requiresAuth = PROTECTED_TABS.includes(activeTab);
  const hasArchivistAccess = isAuthenticated && isElevated(activeRole);

  React.useEffect(() => {
    if (requiresAuth && !isAuthenticated) {
      // Say why the page did not open, then send them to the form that unlocks it.
      showToast(
        activeTab === 'admin'
          ? 'Sign in with an archivist account to open the archivist tools.'
          : 'Sign in or create an account to contribute.'
      );
      navigateTo('signin');
    }
  }, [requiresAuth, isAuthenticated, activeTab, navigateTo, showToast]);

  React.useEffect(() => {
    if (activeTab === 'admin' && !hasArchivistAccess) {
      navigateTo('home');
    }
  }, [activeTab, hasArchivistAccess, navigateTo]);

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
        return hasArchivistAccess ? <AdminDashboardView /> : <HomeView />;
      case 'signin':
        return <SignInView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header onOpenNav={() => setIsSidebarOpen(true)} />

      {activeTab === 'signin' ? (
        // Signing in is a single card, so it gets the page to itself: the card is
        // centered in it rather than sitting in a sidebar layout.
        <main className="flex min-h-[70vh] min-w-0 flex-1 items-center justify-center px-4 py-10 sm:px-6">
          {renderActiveView()}
        </main>
      ) : (
        <div className="mx-auto flex w-full max-w-[1800px]">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="min-w-0 flex-1 pb-40 sm:pb-24 min-[1000px]:pb-8">{renderActiveView()}</main>
        </div>
      )}

      <footer className="border-t border-ink-12 bg-ink-06 px-4 py-8 text-xs text-ink-60 sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="space-y-1.5">
            <Wordmark size="sm" />
            <p className="max-w-md leading-relaxed">
              The free encyclopedia of African music. Every recording, credit,
              lyric, and claim here is community-submitted, sourced, and versioned.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="transition-colors hover:text-ink"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigateTo('explore')}
              className="transition-colors hover:text-ink"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => navigateTo('timeline')}
              className="transition-colors hover:text-ink"
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => navigateTo('upload')}
              className="transition-colors hover:text-ink"
            >
              Contribute
            </button>
            {hasArchivistAccess && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="font-semibold text-ink-60 transition-opacity hover:opacity-80"
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
      <ReportProblemModal />
      <DiffViewerModal />
      <AddDetailModal />
      <CreateArticleModal />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs text-paper sm:bottom-6"
        >
          <span className="h-2 w-2 rounded-full bg-brand" />
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
