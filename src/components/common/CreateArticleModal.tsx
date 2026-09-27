import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { X, Plus, Sparkles, BookOpen, Music, Users, ShieldAlert } from 'lucide-react';

export const CreateArticleModal: React.FC = () => {
  const { isCreateArticleModalOpen, setIsCreateArticleModalOpen, createArticle } = useBanjo();

  const [articleType, setArticleType] = useState<'song' | 'musician' | 'band'>('song');
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [region, setRegion] = useState('Nyanza');
  const [genre, setGenre] = useState('Benga');
  const [year, setYear] = useState('1978');
  const [story, setStory] = useState('');
  const [composerOrLeader, setComposerOrLeader] = useState('');
  const [instruments, setInstruments] = useState('');
  const [citations, setCitations] = useState('');

  if (!isCreateArticleModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !story.trim()) return;

    createArticle({
      type: articleType,
      title: title.trim(),
      country,
      region,
      genre,
      year: parseInt(year, 10) || 1978,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-stone-900 text-white font-serif font-bold text-xs">
              W
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-amber-800 font-bold block">
                Create Encyclopedia Article
              </span>
              <h2 className="text-base font-serif font-bold text-stone-900">
                New African Music Heritage Article
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsCreateArticleModalOpen(false)}
            aria-label="Close"
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-100 text-xs font-medium text-stone-600 shrink-0">
          <button
            onClick={() => setArticleType('song')}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              articleType === 'song'
                ? 'bg-white text-stone-900 font-bold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-700" />
            <span>Song Article</span>
          </button>
          <button
            onClick={() => setArticleType('musician')}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              articleType === 'musician'
                ? 'bg-white text-stone-900 font-bold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-700" />
            <span>Musician Profile</span>
          </button>
          <button
            onClick={() => setArticleType('band')}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              articleType === 'band'
                ? 'bg-white text-stone-900 font-bold border-b-2 border-amber-700'
                : 'hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Band / Ensemble</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              {articleType === 'song'
                ? 'Song / Composition Title'
                : articleType === 'musician'
                ? 'Musician Name'
                : 'Band / Group Name'}{' '}
              <span className="text-red-600">*</span>
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
              className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 text-sm focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs bg-white focus:border-amber-600 focus:outline-none"
              >
                <option value="Kenya">Kenya</option>
                <option value="DR Congo">DR Congo</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Ghana">Ghana</option>
                <option value="Zimbabwe">Zimbabwe</option>
                <option value="Mali">Mali</option>
                <option value="Senegal">Senegal</option>
                <option value="Ethiopia">Ethiopia</option>
                <option value="Uganda">Uganda</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Region / City</label>
              <input
                type="text"
                placeholder="e.g. Nyanza, Kinshasa, Lagos, Zanzibar"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Musical Tradition / Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs bg-white focus:border-amber-600 focus:outline-none"
              >
                <option value="Benga">Benga</option>
                <option value="Congolese Rhumba">Congolese Rhumba</option>
                <option value="Afrobeat">Afrobeat</option>
                <option value="Highlife">Highlife</option>
                <option value="Kenyan Twist">Kenyan Twist</option>
                <option value="Taarab">Taarab</option>
                <option value="Muziki wa Dansi">Muziki wa Dansi (Zilipendwa)</option>
                <option value="Chimurenga">Chimurenga</option>
                <option value="Jùjú">Jùjú</option>
                <option value="Ohangla">Ohangla</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {articleType === 'song' ? 'Year Released / Composed' : 'Formation / Birth Year'}
              </label>
              <input
                type="number"
                placeholder="e.g. 1976"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs font-mono focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
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
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Instruments (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Electric Lead Guitar, Nyatiti, Bass, Drums, Shakers"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Article Narrative & Historical Biography <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Provide a comprehensive historical overview, origin story, cultural significance, and musical legacy..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              required
              className="w-full rounded-lg border border-stone-300 p-2.5 text-stone-900 text-xs leading-relaxed focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Source Citation / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Original vinyl sleeve, studio ledger, or elder musician interview"
              value={citations}
              onChange={(e) => setCitations(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 text-xs focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsCreateArticleModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Article</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
