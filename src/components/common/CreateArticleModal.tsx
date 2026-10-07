import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import { X,
  PlusLg,
  Stars,
  Book,
  MusicNoteBeamed,
  People,
  ShieldExclamation
} from 'react-bootstrap-icons';

export const CreateArticleModal: React.FC = () => {
  const { isCreateArticleModalOpen, setIsCreateArticleModalOpen, createArticle, showToast } = useBanjo();

  const [articleType, setArticleType] = useState<'song' | 'musician' | 'band'>('song');
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [story, setStory] = useState('');
  const [composerOrLeader, setComposerOrLeader] = useState('');
  const [instruments, setInstruments] = useState('');
  const [citations, setCitations] = useState('');

  if (!isCreateArticleModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedYear = Number(year);
    if (!title.trim() || !story.trim() || !country.trim() || !Number.isInteger(parsedYear) || parsedYear < 1850 || parsedYear > new Date().getFullYear()) {
      showToast('Enter an article title, country, narrative, and valid year.');
      return;
    }

    createArticle({
      type: articleType,
      title: title.trim(),
      country,
      region,
      genre,
      year: parsedYear,
      story: story.trim(),
      composerOrLeader: composerOrLeader.trim() || undefined,
      instruments: instruments.trim() || undefined,
      citations: citations.trim() || undefined,
    });

    // Reset
    setTitle('');
    setStory('');
    setComposerOrLeader('');
    setInstruments('');
    setCitations('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-ink-12 bg-paper">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-12 bg-ink-06 px-3 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-ink-60 font-bold block">
                Create Encyclopedia Article
              </span>
              <h2 className="break-words text-sm font-serif font-bold text-ink sm:text-base">
                New African Music Heritage Article
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsCreateArticleModalOpen(false)}
            aria-label="Close"
            className="p-1 rounded-md text-ink-60 hover:text-ink-60 hover:bg-ink-06 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-ink-12 bg-ink-06 text-xs font-medium text-ink-60 shrink-0">
          <button
            onClick={() => setArticleType('song')}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              articleType === 'song'
                ? 'bg-paper text-ink font-bold border-b-2 border-brand'
                : 'hover:text-ink'
            }`}
          >
            <MusicNoteBeamed className="w-3.5 h-3.5 text-brand" />
            <span>Song Article</span>
          </button>
          <button
            onClick={() => setArticleType('musician')}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              articleType === 'musician'
                ? 'bg-paper text-ink font-bold border-b-2 border-brand'
                : 'hover:text-ink'
            }`}
          >
            <People className="w-3.5 h-3.5 text-brand" />
            <span>Musician Profile</span>
          </button>
          <button
            onClick={() => setArticleType('band')}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              articleType === 'band'
                ? 'bg-paper text-ink font-bold border-b-2 border-brand'
                : 'hover:text-ink'
            }`}
          >
            <Book className="w-3.5 h-3.5 text-brand" />
            <span>Band / Ensemble</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 space-y-3.5 text-xs">
          <div>
            <label className="block text-ink-60 font-semibold mb-1">
              {articleType === 'song'
                ? 'Song / Composition Title'
                : articleType === 'musician'
                ? 'Musician Name'
                : 'Band / Group Name'}{' '}
              <span className="text-ink-60">*</span>
            </label>
            <input
              type="text"
              placeholder={
                articleType === 'song'
                  ? 'e.g. Sawa Sawa, Afrodisiac, Pole Musa'
                  : articleType === 'musician'
                  ? 'e.g. Sukuma Bin Ongaro, Franco Luambo'
                  : 'e.g. T.P. OK Jazz, Maroon Commandos'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-sm focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-60 font-semibold mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                required
                className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs bg-paper focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
              />
            </div>

            <div>
              <label className="block text-ink-60 font-semibold mb-1">Region / City</label>
              <input
                type="text"
                placeholder="e.g. Nyanza, Kinshasa, Lagos, Zanzibar"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-60 font-semibold mb-1">Musical Tradition / Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Genre or tradition"
                className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs bg-paper focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
              />
            </div>

            <div>
              <label className="block text-ink-60 font-semibold mb-1">
                {articleType === 'song' ? 'Year Released / Composed' : 'Formation / Birth Year'}
              </label>
              <input
                type="number"
                placeholder="e.g. 1976"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs font-mono focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-60 font-semibold mb-1">
              {articleType === 'song'
                ? 'Composer / Band'
                : articleType === 'musician'
                ? 'Primary Role / Title'
                : 'Founding Leader / Bandleader'}
            </label>
            <input
              type="text"
              placeholder={
                articleType === 'song'
                  ? 'e.g. John Ochieng / Victoria Stars'
                  : articleType === 'musician'
                  ? 'e.g. Benga Lead Guitarist & Composer'
                  : 'e.g. Franco Luambo Makiadi'
              }
              value={composerOrLeader}
              onChange={(e) => setComposerOrLeader(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div>
            <label className="block text-ink-60 font-semibold mb-1">
              Instruments (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Electric Lead Guitar, Nyatiti, Bass, Drums, Shakers"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div>
            <label className="block text-ink-60 font-semibold mb-1">
              Article Narrative & Historical Biography <span className="text-ink-60">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Provide a comprehensive historical overview, origin story, cultural significance, and musical legacy..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-12 p-2.5 text-ink text-xs leading-relaxed focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div>
            <label className="block text-ink-60 font-semibold mb-1">
              Source Citation / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Original vinyl sleeve, studio ledger, or elder musician interview"
              value={citations}
              onChange={(e) => setCitations(e.target.value)}
              className="w-full rounded-lg border border-ink-12 p-2 text-ink text-xs focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink-12">
            <button
              type="button"
              onClick={() => setIsCreateArticleModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-ink-12 text-ink-60 hover:bg-ink-06 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <PlusLg className="w-4 h-4" />
              <span>Create Article</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
