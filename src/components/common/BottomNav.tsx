import React from 'react';
import { useBanjo, MainNavTab } from '../../context/BanjoContext';
import { HouseDoor, Search, Compass, PlusCircle, Person } from 'react-bootstrap-icons';

export const BottomNav: React.FC = () => {
  const { activeTab, navigateTo } = useBanjo();

  const navItems: { tab: MainNavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'home', label: 'Home', icon: HouseDoor },
    { tab: 'search', label: 'Search', icon: Search },
    { tab: 'explore', label: 'Explore', icon: Compass },
    { tab: 'upload', label: 'Contribute', icon: PlusCircle },
    { tab: 'profile', label: 'Library', icon: Person },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-ink-12 bg-paper px-2"
    >
      <div className="mx-auto flex h-full max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.tab ||
            (item.tab === 'explore' && activeTab === 'timeline') ||
            (item.tab === 'home' && (activeTab === 'song_detail' || activeTab === 'musician_detail' || activeTab === 'band_detail'));

          return (
            <button
              key={item.tab}
              onClick={() => navigateTo(item.tab)}
              className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-brand font-semibold' : 'text-ink-60 hover:text-ink'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.tab === 'upload' && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-brand" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

