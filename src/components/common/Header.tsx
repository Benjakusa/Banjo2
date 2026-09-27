import React from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  Search,
  PlusCircleFill,
  ShieldCheck,
  Phone,
  Display,
  Wifi,
  WifiOff,
} from 'react-bootstrap-icons';

export const Header: React.FC = () => {
  const {
    activeTab,
    navigateTo,
    isDataSaver,
    setDataSaver,
    isMobileDeviceFrame,
    setIsMobileDeviceFrame,
    setIsCreateArticleModalOpen,
    openQuickEdit,
    currentRecording,
    selectedSongId,
    selectedMusicianId,
    selectedBandId,
  } = useBanjo();

  const handleAddDetailsClick = () => {
    if (activeTab === 'song_detail') {
      openQuickEdit(selectedSongId || currentRecording?.id || 'rec-001', 'musicians');
    } else if (activeTab === 'musician_detail') {
      openQuickEdit(selectedMusicianId || 'mus-peter-ochieng', 'bio');
    } else if (activeTab === 'band_detail') {
      openQuickEdit(selectedBandId || 'band-victoria-stars', 'band_member');
    } else {
      setIsCreateArticleModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark (Bright editorial logo) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none text-left"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-600 text-white font-serif font-bold text-sm">
              W
            </span>
            <span className="font-display text-xl tracking-[0.18em] font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
              BANJO
            </span>
          </button>
          <span className="hidden sm:inline-block text-[11px] font-serif text-stone-500 italic">
            The African Music Encyclopedia
          </span>
        </div>

        {/* Zone 2: Clean 4–6 nav links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          <button
            onClick={() => navigateTo('home')}
            className={`transition-colors py-1 cursor-pointer ${
              activeTab === 'home'
                ? 'text-orange-600 border-b-2 border-orange-600 font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Encyclopedia
          </button>
          <button
            onClick={() => navigateTo('explore')}
            className={`transition-colors py-1 cursor-pointer ${
              activeTab === 'explore'
                ? 'text-orange-600 border-b-2 border-orange-600 font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Countries & Genres
          </button>
          <button
            onClick={() => navigateTo('timeline')}
            className={`transition-colors py-1 cursor-pointer ${
              activeTab === 'timeline'
                ? 'text-orange-600 border-b-2 border-orange-600 font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => navigateTo('oral_histories')}
            className={`transition-colors py-1 cursor-pointer ${
              activeTab === 'oral_histories'
                ? 'text-orange-600 border-b-2 border-orange-600 font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Oral Histories
          </button>
          <button
            onClick={() => navigateTo('documents')}
            className={`transition-colors py-1 cursor-pointer ${
              activeTab === 'documents'
                ? 'text-orange-600 border-b-2 border-orange-600 font-semibold'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Documents
          </button>
        </nav>

        {/* Zone 3: Actions & Mobile Shell Viewport Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search trigger */}
          <button
            onClick={() => navigateTo('search')}
            title="Search encyclopedia"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md border border-stone-200 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Desktop Phone Frame Toggle */}
          <button
            onClick={() => setIsMobileDeviceFrame(!isMobileDeviceFrame)}
            title={isMobileDeviceFrame ? 'Switch to Full Screen' : 'Toggle Smartphone App Shell'}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
          >
            {isMobileDeviceFrame ? <Display className="w-3.5 h-3.5 text-orange-600" /> : <Phone className="w-3.5 h-3.5 text-orange-600" />}
            <span className="text-[11px]">{isMobileDeviceFrame ? 'Wide View' : 'Mobile App'}</span>
          </button>

          {/* Data Saver Mode indicator */}
          <button
            onClick={() => setDataSaver(!isDataSaver)}
            title={isDataSaver ? 'Low Bandwidth Mode ON' : 'High Fidelity Streaming'}
            className={`hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
              isDataSaver
                ? 'bg-orange-50 border-orange-300 text-orange-900 font-medium'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            {isDataSaver ? <WifiOff className="w-3 h-3 text-orange-600" /> : <Wifi className="w-3 h-3 text-stone-500" />}
            <span className="text-[10px]">{isDataSaver ? 'Saver' : 'Hi-Fi'}</span>
          </button>

          {/* Contribute / Add Details CTA */}
          <button
            onClick={handleAddDetailsClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <PlusCircleFill className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Details</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Admin Portal shortcut */}
          <button
            onClick={() => navigateTo('admin')}
            title="Administrator & Archivist Console"
            className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-orange-50 border-orange-400 text-orange-900 font-semibold'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[11px]">Archivist</span>
          </button>
        </div>
      </div>
    </header>
  );
};
