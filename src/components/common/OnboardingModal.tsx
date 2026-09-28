import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { Compass, Book, Archive, People, ArrowRight, CheckLg } from 'react-bootstrap-icons';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, activeRole, setActiveRole } = useBanjo();
  const [step, setStep] = useState(0);

  if (!isOnboardingOpen) return null;

  const screens = [
    {
      icon: Compass,
      title: 'Discover African Music',
      subtitle: 'the free encyclopedia of African music',
      description:
        'Explore decades of recorded sound from the 1950s onward across Kenya, Congo, Tanzania, Nigeria, Ghana, Zimbabwe, and beyond. Every track is connected to its historical cultural origins.',
    },
    {
      icon: Book,
      title: 'Discover the Story',
      subtitle: 'Every Song is a Recording AND a Historical Story',
      description:
        'Learn about the studio sessions, the political climates, the migrations of musicians, the master sound engineers, and the instruments that gave birth to Benga, Rhumba, Afrobeat, and Highlife.',
    },
    {
      icon: Archive,
      title: 'Anyone Can Add Details',
      subtitle: 'Community-Curated · Version-Controlled',
      description:
        'Anyone can edit Banjo: add missing musicians, add documentary citations, suggest revisions, and upload verified master recordings. Every edit is version-controlled and traceable.',
    },
    {
      icon: People,
      title: 'Join Banjo & Choose Your Role',
      subtitle: 'Contribute Knowledge, Verify Evidence, & Safeguard Heritage',
      description:
        'You can browse as a Reader, submit details as a Contributor, or review evidence as an Archivist. Switch your role anytime from the header menu.',
    },
  ];

  const current = screens[step];
  const IconComp = current.icon;

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      setIsOnboardingOpen(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-ink-12 bg-paper p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {screens.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-brand' : 'w-2 bg-ink-06'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="text-xs text-ink-60 hover:text-ink cursor-pointer"
          >
            Skip
          </button>
        </div>

        <div className="space-y-3 pt-1">
          <div className="inline-flex p-3 rounded-xl bg-brand/10 text-ink-60 border border-brand">
            <IconComp className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-widest font-mono text-ink-60 font-bold">
              {current.subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-ink mt-0.5">
              {current.title}
            </h2>
          </div>

          <p className="text-xs text-ink-60 leading-relaxed">
            {current.description}
          </p>

          {step === 3 && (
            <div className="pt-2 border-t border-ink-12 space-y-2">
              <span className="text-[11px] font-mono text-ink-60 block">Select Initial Role:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveRole('contributor')}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                    activeRole === 'contributor'
                      ? 'border-ink bg-ink text-paper font-semibold'
                      : 'border-ink-12 bg-paper text-ink-60'
                  }`}
                >
                  <p className="font-semibold text-ink">Contributor</p>
                  <p className="text-[10px] text-ink-60">Edit & add details</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('senior_archivist')}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                    activeRole === 'senior_archivist'
                      ? 'border-ink bg-ink text-paper font-semibold'
                      : 'border-ink-12 bg-paper text-ink-60'
                  }`}
                >
                  <p className="font-semibold text-ink">Archivist</p>
                  <p className="text-[10px] text-ink-60">Verify & approve</p>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-ink-12">
          <span className="text-xs text-ink-60 font-mono">
            {step + 1} / {screens.length}
          </span>
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-on-orange bg-brand hover:bg-brand rounded-lg transition-colors cursor-pointer"
          >
            <span>{step === screens.length - 1 ? 'Start Browsing' : 'Continue'}</span>
            {step === screens.length - 1 ? <CheckLg className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

