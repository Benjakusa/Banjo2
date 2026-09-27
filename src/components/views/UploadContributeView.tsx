import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  UploadCloud,
  CheckCircle2,
  FileMusic,
  FileText,
  Mic,
  Camera,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const UploadContributeView: React.FC = () => {
  const { submitNewRecording, navigateTo } = useBanjo();

  const [submissionCategory, setSubmissionCategory] = useState<
    'music_recording' | 'photograph' | 'document' | 'interview' | 'artist_band'
  >('music_recording');

  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [artistOrBand, setArtistOrBand] = useState('');
  const [releaseYear, setReleaseYear] = useState('1978');
  const [country, setCountry] = useState('Kenya');
  const [region, setRegion] = useState('Nyanza');
  const [genre, setGenre] = useState('Benga');
  const [language, setLanguage] = useState('Luo');
  const [studio, setStudio] = useState('Polygram Studios Nairobi');

  // Step 2 Contributors
  const [composer, setComposer] = useState('');
  const [leadGuitarist, setLeadGuitarist] = useState('');
  const [leadVocalist, setLeadVocalist] = useState('');
  const [bassist, setBassist] = useState('');
  const [drummer, setDrummer] = useState('');
  const [producer, setProducer] = useState('');

  // Step 3 History & Sources
  const [historyNarrative, setHistoryNarrative] = useState('');
  const [sourcesProvided, setSourcesProvided] = useState('');

  // Step 4 Rights Declaration
  const [rightsDeclaration, setRightsDeclaration] = useState(
    'I have permission to submit this recording.'
  );

  // Upload simulation & resilience state
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'scanning' | 'uploading' | 'verifying_hash' | 'completed'
  >('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const rightsOptions = [
    {
      value: 'I own the recording.',
      desc: 'You are the original recording artist, producer, or master rights owner.',
    },
    {
      value: 'I represent the rights holder.',
      desc: 'You represent the artist, estate, publishing company, or licensed record label.',
    },
    {
      value: 'I have permission to submit this recording.',
      desc: 'You hold written permission or oral family authorization for educational archiving.',
    },
    {
      value: 'This recording is believed to be public domain.',
      desc: 'The original sound recording has surpassed its copyright term (50+ years).',
    },
    {
      value: 'I am submitting historical information only; Banjo should not host the audio.',
      desc: 'Metadata and historical documentation only; no copyrighted audio file will be served.',
    },
  ];

  const handleSimulatedUpload = () => {
    setUploadStatus('scanning');
    setUploadProgress(20);

    setTimeout(() => {
      setUploadStatus('uploading');
      setUploadProgress(55);
    }, 600);

    setTimeout(() => {
      setUploadStatus('verifying_hash');
      setUploadProgress(85);
    }, 1200);

    setTimeout(() => {
      setUploadStatus('completed');
      setUploadProgress(100);

      submitNewRecording(
        {
          title: title || 'New Historical Archive Entry',
          artistOrBand: artistOrBand || 'Traditional Ensemble',
          releaseYear: parseInt(releaseYear, 10) || 1978,
          country,
          region,
          genre,
          language,
          studio,
          composer,
          producer,
          story: historyNarrative || 'Historical details submitted by community contributor.',
        },
        rightsDeclaration,
        sourcesProvided
      );
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-amber-800 font-semibold">
          Community Contribution
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 mt-0.5">
          Contribute Knowledge & Recordings
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Add missing details, upload digitized master recordings, or submit documentary evidence to the encyclopedia.
        </p>
      </div>

      {/* Category Selection Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        {[
          { key: 'music_recording', label: 'Music Track', icon: FileMusic },
          { key: 'photograph', label: 'Photograph', icon: Camera },
          { key: 'document', label: 'Record Sleeve', icon: FileText },
          { key: 'interview', label: 'Oral History', icon: Mic },
          { key: 'artist_band', label: 'Musician Bio', icon: Shield },
        ].map((item) => {
          const IconC = item.icon;
          const isSelected = submissionCategory === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSubmissionCategory(item.key as any)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-xs'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <IconC className={`w-4 h-4 ${isSelected ? 'text-amber-700' : 'text-stone-400'}`} />
              <span className="font-semibold text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Wizard Container */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-bold transition-all ${
                  s === step
                    ? 'bg-amber-700 text-white'
                    : s < step
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
            ))}
          </div>

          <span className="text-xs font-mono text-amber-800 font-bold uppercase">
            Step {step} of 5
          </span>
        </div>

        {/* STEP 1: Metadata */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900">
                Step 1: Song & Recording Metadata
              </h2>
              <p className="text-stone-500">Provide title, artist, year, and studio information.</p>
            </div>

            <div className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-xl p-6 text-center bg-stone-50 transition-colors cursor-pointer space-y-1.5">
              <UploadCloud className="w-7 h-7 text-amber-700 mx-auto" />
              <p className="font-medium text-stone-900 text-sm">
                Attach Audio File (FLAC, WAV, MP3)
              </p>
              <p className="text-[11px] text-stone-500">
                Automatic audio validation will verify bit depth and generate waveform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Song Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sawa Sawa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Artist or Band</label>
                <input
                  type="text"
                  placeholder="e.g. Shirati Jazz Band"
                  value={artistOrBand}
                  onChange={(e) => setArtistOrBand(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Release Year</label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Contributors */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900">
                Step 2: Musicians & Instrument Roles
              </h2>
              <p className="text-stone-500">Credit every instrumentalist and vocalist who performed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Composer</label>
                <input
                  type="text"
                  placeholder="e.g. D.O. Misiani"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Lead Guitarist</label>
                <input
                  type="text"
                  placeholder="e.g. Peter Ochieng"
                  value={leadGuitarist}
                  onChange={(e) => setLeadGuitarist(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Vocalist</label>
                <input
                  type="text"
                  placeholder="e.g. Mary Achieng"
                  value={leadVocalist}
                  onChange={(e) => setLeadVocalist(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Sound Engineer / Studio</label>
                <input
                  type="text"
                  placeholder="e.g. Polygram Industrial Area"
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Historical Narrative */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900">
                Step 3: Historical Narrative & Citations
              </h2>
              <p className="text-stone-500">Provide the story behind the recording and primary evidence sources.</p>
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Historical Context</label>
              <textarea
                rows={5}
                placeholder="Describe how the song was composed, the studio session context, social meaning of lyrics..."
                value={historyNarrative}
                onChange={(e) => setHistoryNarrative(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-3 text-stone-900 focus:border-amber-600 focus:outline-none leading-relaxed font-serif"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Primary Sources / References</label>
              <input
                type="text"
                placeholder="e.g. Vinyl record runout stamp, Kenya Daily Nation article (1978)"
                value={sourcesProvided}
                onChange={(e) => setSourcesProvided(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Rights */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900">
                Step 4: Rights & Copyright Declaration
              </h2>
              <p className="text-stone-500">Banjo respects intellectual property and requires verified assertions.</p>
            </div>

            <div className="space-y-2.5">
              {rightsOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    rightsDeclaration === opt.value
                      ? 'border-amber-600 bg-amber-50/70'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="rights"
                      value={opt.value}
                      checked={rightsDeclaration === opt.value}
                      onChange={(e) => setRightsDeclaration(e.target.value)}
                      className="mt-0.5 text-amber-700 focus:ring-amber-700"
                    />
                    <div>
                      <p className="font-semibold text-stone-900">{opt.value}</p>
                      <p className="text-stone-600 text-[11px] mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation */}
        {step === 5 && (
          <div className="space-y-5 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-stone-900">
                Step 5: Review & Submit
              </h2>
              <p className="text-stone-500">Confirm details before submitting to the archivist queue.</p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 font-mono text-[11px]">
              <div><strong>Title:</strong> {title || 'Untitled Archive Track'}</div>
              <div><strong>Artist:</strong> {artistOrBand || 'Traditional Artists'}</div>
              <div><strong>Year:</strong> {releaseYear}</div>
              <div><strong>Rights:</strong> {rightsDeclaration}</div>
            </div>

            {uploadStatus !== 'idle' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex justify-between font-mono text-[11px] text-amber-900">
                  <span>Uploading to Cloudflare R2 archive storage...</span>
                  <span className="font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-700 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                {uploadStatus === 'completed' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Submission confirmed! Sent to Archival Moderation Queue.</span>
                  </div>
                )}
              </div>
            )}

            {uploadStatus === 'idle' && (
              <button
                type="button"
                onClick={handleSimulatedUpload}
                className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Publish to Archival Review Queue</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Step Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : <div />}

          {step < 5 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold cursor-pointer"
            >
              <span>Next: Step {step + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 5 && uploadStatus === 'completed' && (
            <button
              onClick={() => navigateTo('profile')}
              className="px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium cursor-pointer"
            >
              View in My Contributions →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
