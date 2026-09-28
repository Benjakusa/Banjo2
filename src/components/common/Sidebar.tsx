import React from 'react';
import { useBanjo } from '../../context/BanjoContext';
import type { MainNavTab } from '../../context/BanjoContext';
import {
  House,
  Compass,
  ClockHistory,
  MicFill,
  Folder2Open,
  Bookmarks,
  Person,
  PencilSquare,
  ChatLeftText,
  ArrowRepeat,
  CloudArrowUp,
  ShieldLock,
  PlusLg,
  X,
} from 'react-bootstrap-icons';

const ARCHIVIST_ROLES = [
  'super_admin',
  'platform_admin',
  'senior_archivist',
  'archivist',
  'moderator',
  'rights_manager',
  'support_agent',
  'analyst',
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavEntry {
  label: string;
  tab: MainNavTab;
  Icon: React.ComponentType<{ className?: string }>;
  archivistOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, navigateTo, userProfile, setIsCreateArticleModalOpen } = useBanjo();

  const isArchivist = ARCHIVIST_ROLES.includes(userProfile.role);

  const go = (tab: MainNavTab) => {
    navigateTo(tab);
    onClose();
  };

  const primaryItems: NavEntry[] = [
    { label: 'Home', tab: 'home', Icon: House },
    { label: 'Explore', tab: 'explore', Icon: Compass },
    { label: 'Timeline', tab: 'timeline', Icon: ClockHistory },
    { label: 'Oral Histories', tab: 'oral_histories', Icon: MicFill },
    { label: 'Documents', tab: 'documents', Icon: Folder2Open },
  ];

  const youItems: NavEntry[] = [
    { label: 'Saved', tab: 'profile', Icon: Bookmarks },
    { label: 'My contributions', tab: 'profile', Icon: Person },
    { label: 'Edit history', tab: 'profile', Icon: PencilSquare },
  ];

  const communityItems: NavEntry[] = [
    { label: 'Talk pages', tab: 'song_detail', Icon: ChatLeftText },
    { label: 'Recent changes', tab: 'explore', Icon: ArrowRepeat },
    { label: 'Add recording', tab: 'upload', Icon: CloudArrowUp },
    { label: 'Archivist tools', tab: 'admin', Icon: ShieldLock, archivistOnly: true },
  ];

  const renderSection = (title: string, items: NavEntry[]) => {
    const visible = items.filter((item) => !item.archivistOnly || isArchivist);
    if (visible.length === 0) return null;
    return (
      <div className="px-3 pb-4">
        <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-[var(--banjo-muted)]">
          {title}
        </p>
        <ul className="space-y-0.5">
          {visible.map(({ label, tab, Icon }) => {
            const isActive = activeTab === tab;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => go(tab)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--banjo-chip)] font-semibold text-[var(--banjo-text)]'
                      : 'text-[var(--banjo-text)]/75 hover:bg-[var(--banjo-chip)]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 min-[1000px]:hidden"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-[var(--banjo-line)] bg-[var(--banjo-bg)] transition-transform duration-200 min-[640px]:flex min-[1000px]:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--banjo-muted)]">
            Browse
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--banjo-muted)] transition-colors hover:bg-[var(--banjo-chip)] hover:text-[var(--banjo-text)] min-[1000px]:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => {
              setIsCreateArticleModalOpen(true);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-full bg-[var(--banjo-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusLg className="h-4 w-4" />
            Record submission
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto pb-4">
          {renderSection('Archive', primaryItems)}
          {renderSection('You', youItems)}
          {renderSection('Community', communityItems)}
        </nav>
      </aside>
    </>
  );
};
