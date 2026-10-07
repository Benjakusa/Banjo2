import React, { useEffect, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { MusicianCredit } from '../../types';
import { XLg, SendFill, ShieldExclamation } from 'react-bootstrap-icons';

const inputClass = 'w-full rounded-lg border border-ink-12 p-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0';

export const EditSongModal: React.FC = () => {
  const { isEditModalOpen, setIsEditModalOpen, currentRecording, submitSongEdit } = useBanjo();
  const [title, setTitle] = useState('');
  const [artistOrBand, setArtistOrBand] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [studio, setStudio] = useState('');
  const [composer, setComposer] = useState('');
  const [history, setHistory] = useState('');
  const [sources, setSources] = useState('');
  const [musicians, setMusicians] = useState<MusicianCredit[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (!currentRecording) return;
    setTitle(currentRecording.title || '');
    setArtistOrBand(currentRecording.artistOrBand || '');
    setAlbumTitle(currentRecording.albumTitle || '');
    setYear(currentRecording.releaseYear == null ? '' : String(currentRecording.releaseYear));
    setCountry(currentRecording.country || '');
    setRegion(currentRecording.region || '');
    setGenre(currentRecording.genre || '');
    setLanguage(currentRecording.language || '');
    setStudio(currentRecording.studio || '');
    setComposer(currentRecording.composer || '');
    setHistory(currentRecording.story || '');
    setSources(currentRecording.sources?.map((source) => source.title).filter(Boolean).join('; ') || '');
    setMusicians(currentRecording.musicians || []);
    setCoverImage(currentRecording.coverImage || '');
    setExplanation('');
  }, [currentRecording]);

  if (!isEditModalOpen || !currentRecording) return null;

  const handleCoverFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCoverImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !explanation.trim()) return;
    if (year && (!Number.isInteger(Number(year)) || Number(year) < 1850 || Number(year) > new Date().getFullYear())) return;
    const updatedMusicians = musicians.filter((credit) => credit.musicianName.trim());
    const composerCredit = updatedMusicians.findIndex((credit) => credit.role.toLowerCase().includes('composer'));
    if (composer.trim() && composerCredit >= 0) updatedMusicians[composerCredit] = { ...updatedMusicians[composerCredit], musicianName: composer.trim() };
    else if (composer.trim()) updatedMusicians.push({ musicianId: `edit-composer-${Date.now()}`, musicianName: composer.trim(), role: 'Composer', instrument: 'Composition' });
    else if (composerCredit >= 0) updatedMusicians.splice(composerCredit, 1);
    submitSongEdit(currentRecording.id, {
      title,
      artistOrBand,
      albumTitle,
      year,
      country,
      region,
      genre,
      language,
      studio,
      composer,
      history,
      musicians: updatedMusicians,
      sources,
      coverImage,
      explanation,
    });
  };

  const updateMusician = (index: number, changes: Partial<MusicianCredit>) => {
    setMusicians((credits) => credits.map((credit, creditIndex) => creditIndex === index ? { ...credit, ...changes } : credit));
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-12 bg-paper p-4 space-y-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-ink-12 pb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-ink-60 font-bold block">Banjo Editor</span>
            <h2 className="text-lg font-serif font-medium text-ink">Edit upload: {currentRecording.title}</h2>
          </div>
          <button type="button" onClick={() => setIsEditModalOpen(false)} aria-label="Close edit form" className="p-1 rounded-md text-ink-60 hover:text-ink hover:bg-ink-06 cursor-pointer">
            <XLg className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-brand/10 border border-brand rounded-xl p-3 text-xs text-ink-60 leading-relaxed flex items-start gap-2">
          <ShieldExclamation className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <span><strong>Reviewed changes:</strong> Upload metadata, credits, history, sources, and cover art can be revised here. Audio and the original rights declaration remain unchanged; each edit is reviewed before it is applied.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <section className="space-y-3">
            <h3 className="font-semibold text-ink">Song & recording metadata</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Song title', title, setTitle], ['Artist or band', artistOrBand, setArtistOrBand],
                ['Album', albumTitle, setAlbumTitle], ['Release year', year, setYear],
                ['Country', country, setCountry], ['Region', region, setRegion],
                ['Genre', genre, setGenre], ['Language', language, setLanguage],
                ['Sound engineer / studio', studio, setStudio], ['Composer', composer, setComposer],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block text-ink-60 font-medium">
                  <span className="mb-1 block">{label as string}</span>
                  <input
                    type={label === 'Release year' ? 'number' : 'text'}
                    value={value as string}
                    onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Musicians & instrument roles</h3>
              <button type="button" onClick={() => setMusicians((credits) => [...credits, { musicianId: `edit-credit-${Date.now()}`, musicianName: '', role: 'Instrumentalist', instrument: '' }])} className="rounded-full border border-ink-12 px-3 py-1.5 font-semibold text-ink hover:bg-ink-06">Add credit</button>
            </div>
            {musicians.map((credit, index) => (
              <div key={`${credit.musicianId}-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-ink-12 p-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
                <input aria-label={`Musician ${index + 1}`} placeholder="Player name" value={credit.musicianName} onChange={(event) => updateMusician(index, { musicianName: event.target.value })} className={inputClass} />
                <input aria-label={`Role ${index + 1}`} placeholder="Role" value={credit.role} onChange={(event) => updateMusician(index, { role: event.target.value })} className={inputClass} />
                <input aria-label={`Instrument ${index + 1}`} placeholder="Instrument" value={credit.instrument} onChange={(event) => updateMusician(index, { instrument: event.target.value })} className={inputClass} />
                <button type="button" aria-label={`Remove musician ${index + 1}`} onClick={() => setMusicians((credits) => credits.filter((_, creditIndex) => creditIndex !== index))} className="rounded-lg border border-ink-12 px-3 text-ink-60 hover:bg-ink-06">Remove</button>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-ink">Historical narrative & sources</h3>
            <label className="block text-ink-60 font-medium">Historical context
              <textarea rows={4} value={history} onChange={(event) => setHistory(event.target.value)} className={`${inputClass} mt-1 font-serif leading-relaxed`} />
            </label>
            <label className="block text-ink-60 font-medium">Primary sources / references
              <input type="text" placeholder="Record sleeve, interview, publication…" value={sources} onChange={(event) => setSources(event.target.value)} className={`${inputClass} mt-1`} />
            </label>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <label className="block text-ink-60 font-medium">Cover art
              <input type="file" accept="image/*" onChange={(event) => handleCoverFile(event.target.files?.[0])} className="mt-1 block w-full text-ink" />
            </label>
            {coverImage && <img src={coverImage} alt="Cover art preview" className="h-20 w-20 rounded-lg border border-ink-12 object-cover" />}
          </section>

          <label className="block text-ink-60 font-medium">Edit summary
            <input type="text" required placeholder="Briefly explain the changes and evidence" value={explanation} onChange={(event) => setExplanation(event.target.value)} className={`${inputClass} mt-1`} />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-12">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs font-medium text-ink-60 hover:text-ink cursor-pointer">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-on-orange bg-brand hover:bg-brand rounded-lg transition-colors cursor-pointer">
              <SendFill className="w-3.5 h-3.5" /><span>Submit Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
