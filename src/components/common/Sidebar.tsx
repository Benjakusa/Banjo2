import React, { useEffect, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import type { MainNavTab } from '../../context/BanjoContext';
import { isElevated } from '../../lib/auth';
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
  MoonStars,
  Sun,
  X,
} from 'react-bootstrap-icons';

type AccessibilityTextSize = 'standard' | 'large' | 'largest';

const TEXT_SIZE_STEPS: AccessibilityTextSize[] = ['standard', 'large', 'largest'];
const TEXT_SIZE_LABELS: Record<AccessibilityTextSize, string> = {
  standard: 'Standard',
  large: 'Large',
  largest: 'Largest',
};

const readTextSize = (): AccessibilityTextSize => {
  try {
    const saved = window.localStorage.getItem('banjo.accessibility.text-size');
    return TEXT_SIZE_STEPS.includes(saved as AccessibilityTextSize)
      ? (saved as AccessibilityTextSize)
      : 'standard';
  } catch {
    return 'standard';
  }
};

const readHighContrast = (): boolean => {
  try {
    return window.localStorage.getItem('banjo.accessibility.high-contrast') === 'true';
  } catch {
    return false;
  }
};

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
  const { activeTab, navigateTo, isAuthenticated, activeRole, theme, toggleTheme } = useBanjo();
  const [textSize, setTextSize] = useState<AccessibilityTextSize>(readTextSize);
  const [highContrast, setHighContrast] = useState(readHighContrast);

  useEffect(() => {
    document.documentElement.dataset.accessibilityTextSize = textSize;
    try {
      window.localStorage.setItem('banjo.accessibility.text-size', textSize);
    } catch {
      return;
    }
  }, [textSize]);

  useEffect(() => {
    document.documentElement.dataset.highContrast = String(highContrast);
    try {
      window.localStorage.setItem('banjo.accessibility.high-contrast', String(highContrast));
    } catch {
      return;
    }
  }, [highContrast]);

  // Archivist tooling follows the signed-in session, never a profile fixture.
  const isArchivist = isAuthenticated && isElevated(activeRole);

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
        <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-ink-60">
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
                      ? 'bg-ink-06 font-semibold text-ink'
                      : 'text-ink/75 hover:bg-ink-06'
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
          className="fixed inset-0 z-30 bg-ink/40 min-[1000px]:hidden"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] shrink-0 self-start flex-col overflow-y-auto overscroll-contain border-r border-ink-12 bg-paper transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } min-[1000px]:sticky min-[1000px]:top-14 min-[1000px]:z-auto min-[1000px]:inset-y-auto min-[1000px]:h-[calc(100dvh-3.5rem)] min-[1000px]:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-60">
            Browse
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-60 transition-colors hover:bg-ink-06 hover:text-ink min-[1000px]:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => {
              navigateTo('upload');
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-on-orange transition-opacity hover:opacity-90"
          >
            <PlusLg className="h-4 w-4" />
            Record submission
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
          {renderSection('Archive', primaryItems)}
          {renderSection('You', youItems)}
          {renderSection('Community', communityItems)}

          <section aria-labelledby="sidebar-accessibility-heading" className="mx-3 border-t border-ink-12 px-3 py-4">
            <h2 id="sidebar-accessibility-heading" className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-60">
              Appearance & accessibility
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === 'dark'}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink transition-colors hover:bg-ink-06"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? <MoonStars aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />}
                  <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
                </span>
                <span className="text-xs text-ink-60">Change</span>
              </button>

              <div className="space-y-2 rounded-lg px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink">Text size</span>
                  <span aria-live="polite" className="text-xs text-ink-60">{TEXT_SIZE_LABELS[textSize]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease text size"
                    disabled={textSize === 'standard'}
                    onClick={() => setTextSize((current) => TEXT_SIZE_STEPS[Math.max(0, TEXT_SIZE_STEPS.indexOf(current) - 1)])}
                    className="flex h-9 flex-1 items-center justify-center rounded-lg border border-ink-12 text-sm font-semibold text-ink hover:bg-ink-06 disabled:opacity-40"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    aria-label="Increase text size"
                    disabled={textSize === 'largest'}
                    onClick={() => setTextSize((current) => TEXT_SIZE_STEPS[Math.min(TEXT_SIZE_STEPS.length - 1, TEXT_SIZE_STEPS.indexOf(current) + 1)])}
                    className="flex h-9 flex-1 items-center justify-center rounded-lg border border-ink-12 text-lg font-semibold text-ink hover:bg-ink-06 disabled:opacity-40"
                  >
                    A+
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHighContrast((enabled) => !enabled)}
                aria-pressed={highContrast}
                aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast`}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink transition-colors hover:bg-ink-06"
              >
                <span>High contrast</span>
                <span className="text-xs text-ink-60">{highContrast ? 'On' : 'Off'}</span>
              </button>
            </div>
          </section>
        </nav>
      </aside>
    </>
  );
};
