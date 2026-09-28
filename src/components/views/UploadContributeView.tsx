import React, { useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import {
  CloudArrowUp,
  Check2Circle,
  FileEarmarkMusic,
  FileEarmarkText,
  MicFill,
  CameraFill,
  Shield,
  ArrowRight,
  ArrowLeft,
  Stars,
  CheckLg
} from 'react-bootstrap-icons';
import { FileDropzone } from '../common/FileDropzone';
import { generateThumbnail, initialsFromTitle, validateThumbnail } from '../../lib/thumbnail';

const AUDIO_ACCEPT = 'audio/*,.mp3,.wav,.flac,.m4a,.ogg,.aac';
const AUDIO_MAX_BYTES = 100 * 1024 * 1024;

const validateAudio = (file: File): string | null => {
  const looksLikeAudio =
    file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|aac)$/i.test(file.name);
  if (!looksLikeAudio) return 'That does not look like an audio file. Use MP3, WAV, FLAC, M4A, OGG or AAC.';
  if (file.size > AUDIO_MAX_BYTES) return 'Audio must be under 100 MB.';
  if (file.size === 0) return 'That audio file is empty.';
  return null;
};

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
  // Media attached to the submission. The audio file is mandatory: a song
  // entry with no recording is not a song entry. The thumbnail is not -- when
  // it is missing the app draws one from the title instead.
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailTouched, setThumbnailTouched] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'scanning' | 'uploading' | 'verifying_hash' | 'completed'
  >('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // The cover shown throughout the wizard: the uploaded image if there is one,
  // otherwise artwork derived from whatever title has been typed so far.
  const coverImage = thumbnailPreview || (title.trim() ? generateThumbnail(title) : '');
  const isAutoCover = !thumbnailPreview && Boolean(coverImage);

  const handleAudioFile = (file: File | null) => {
    setAudioFile(file);
    setAudioError(file ? validateAudio(file) : null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleThumbnailFile = (file: File | null) => {
    setThumbnailFile(file);
    if (file) {
      const problem = validateThumbnail(file);
      setThumbnailError(problem);
      if (problem) {
        setThumbnailFile(null);
        return;
      }
    } else {
      setThumbnailError(null);
    }
    setThumbnailTouched(true);
  };

  // Release the object URL when the wizard unmounts.
  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
          // Carried through so the new entry is immediately playable and has
          // artwork. The object URL is session-scoped; a durable copy needs a
          // Storage upload, which is why the audio file name is kept alongside it.
          coverImage,
          audioUrl: audioUrl || undefined,
          audioFileName: audioFile?.name,
          audioFileSize: audioFile?.size,
          audioMimeType: audioFile?.type,
        },
        rightsDeclaration,
        sourcesProvided
      );
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">
          Community Contribution
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">
          Contribute Knowledge & Recordings
        </h1>
        <p className="text-xs text-ink-60 mt-1">
          Add missing details, upload digitized master recordings, or submit documentary evidence to the encyclopedia.
        </p>
      </div>

      {/* Category Selection Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        {[
          { key: 'music_recording', label: 'Music Track', icon: FileEarmarkMusic },
          { key: 'photograph', label: 'Photograph', icon: CameraFill },
          { key: 'document', label: 'Record Sleeve', icon: FileEarmarkText },
          { key: 'interview', label: 'Oral History', icon: MicFill },
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
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink-12 bg-paper text-ink-60 hover:bg-ink-06'
              }`}
            >
              <IconC className={`w-4 h-4 ${isSelected ? 'text-brand' : 'text-ink-60'}`} />
              <span className="font-semibold text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Wizard Container */}
      <div className="rounded-2xl border border-ink-12 bg-paper p-6 sm:p-8 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-ink-12 pb-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-bold transition-all ${
                  s === step
                    ? 'bg-brand text-on-orange'
                    : s < step
                    ? 'bg-ink-06 text-ink-60'
                    : 'bg-ink-06 text-ink-60'
                }`}
              >
                {s < step ? <CheckLg className="w-3.5 h-3.5" /> : s}
              </div>
            ))}
          </div>

          <span className="text-xs font-mono text-ink-60 font-bold uppercase">
            Step {step} of 5
          </span>
        </div>

        {/* STEP 1: Metadata */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-ink">
                Step 1: Song & Recording Metadata
              </h2>
              <p className="text-ink-60">Provide title, artist, year, and studio information.</p>
            </div>

            <FileDropzone
              accept={AUDIO_ACCEPT}
              label="Recording audio"
              hint="MP3, WAV, FLAC, M4A, OGG or AAC, up to 100 MB."
              icon="audio"
              file={audioFile}
              onFile={handleAudioFile}
              error={audioError}
              required
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <FileDropzone
                accept="image/*"
                label="Thumbnail"
                hint="Leave empty and the app draws cover art from the song title."
                icon="image"
                file={thumbnailFile}
                onFile={handleThumbnailFile}
                onPreview={setThumbnailPreview}
                error={thumbnailError}
              />

              {coverImage && (
                <figure className="flex flex-col items-center gap-1.5">
                  <img
                    src={coverImage}
                    alt="Cover art preview"
                    className="h-20 w-20 rounded-lg border border-ink-12 object-cover"
                  />
                  <figcaption className="text-center font-mono text-[10px] text-ink-60">
                    {isAutoCover ? 'Auto from title' : 'Your image'}
                  </figcaption>
                </figure>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-ink-60 font-medium mb-1">Song Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sawa Sawa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Artist or Band</label>
                <input
                  type="text"
                  placeholder="e.g. Shirati Jazz Band"
                  value={artistOrBand}
                  onChange={(e) => setArtistOrBand(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Release Year</label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 font-mono"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Contributors */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-ink">
                Step 2: Musicians & Instrument Roles
              </h2>
              <p className="text-ink-60">Credit every instrumentalist and vocalist who performed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-ink-60 font-medium mb-1">Composer</label>
                <input
                  type="text"
                  placeholder="e.g. D.O. Misiani"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Lead Guitarist</label>
                <input
                  type="text"
                  placeholder="e.g. Peter Ochieng"
                  value={leadGuitarist}
                  onChange={(e) => setLeadGuitarist(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Vocalist</label>
                <input
                  type="text"
                  placeholder="e.g. Mary Achieng"
                  value={leadVocalist}
                  onChange={(e) => setLeadVocalist(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <div>
                <label className="block text-ink-60 font-medium mb-1">Sound Engineer / Studio</label>
                <input
                  type="text"
                  placeholder="e.g. Polygram Industrial Area"
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Historical Narrative */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-ink">
                Step 3: Historical Narrative & Citations
              </h2>
              <p className="text-ink-60">Provide the story behind the recording and primary evidence sources.</p>
            </div>

            <div>
              <label className="block text-ink-60 font-medium mb-1">Historical Context</label>
              <textarea
                rows={5}
                placeholder="Describe how the song was composed, the studio session context, social meaning of lyrics..."
                value={historyNarrative}
                onChange={(e) => setHistoryNarrative(e.target.value)}
                className="w-full rounded-lg border border-ink-12 p-3 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0 leading-relaxed font-serif"
              />
            </div>

            <div>
              <label className="block text-ink-60 font-medium mb-1">Primary Sources / References</label>
              <input
                type="text"
                placeholder="e.g. Vinyl record runout stamp, Kenya Daily Nation article (1978)"
                value={sourcesProvided}
                onChange={(e) => setSourcesProvided(e.target.value)}
                className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Rights */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-serif font-medium text-ink">
                Step 4: Rights & Copyright Declaration
              </h2>
              <p className="text-ink-60">Banjo respects intellectual property and requires verified assertions.</p>
            </div>

            <div className="space-y-2.5">
              {rightsOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    rightsDeclaration === opt.value
                      ? 'border-brand bg-brand/10'
                      : 'border-ink-12 bg-paper hover:bg-ink-06'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="rights"
                      value={opt.value}
                      checked={rightsDeclaration === opt.value}
                      onChange={(e) => setRightsDeclaration(e.target.value)}
                      className="mt-0.5 text-ink-60 focus:ring-2 focus:ring-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                    />
                    <div>
                      <p className="font-semibold text-ink">{opt.value}</p>
                      <p className="text-ink-60 text-[11px] mt-0.5 leading-relaxed">{opt.desc}</p>
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
              <h2 className="text-lg font-serif font-medium text-ink">
                Step 5: Review & Submit
              </h2>
              <p className="text-ink-60">Confirm details before submitting to the archivist queue.</p>
            </div>

            <div className="p-4 rounded-xl bg-ink-06 border border-ink-12 space-y-1.5 font-mono text-[11px]">
              <div><strong>Title:</strong> {title || 'Untitled Archive Track'}</div>
              <div><strong>Artist:</strong> {artistOrBand || 'Traditional Artists'}</div>
              <div><strong>Year:</strong> {releaseYear}</div>
              <div><strong>Rights:</strong> {rightsDeclaration}</div>
              <div>
                <strong>Audio:</strong>{' '}
                {audioFile ? `${audioFile.name} (${audioFile.type || 'audio'})` : 'not attached'}
              </div>
              <div>
                <strong>Cover:</strong>{' '}
                {isAutoCover ? `generated from title (${initialsFromTitle(title)})` : thumbnailFile ? thumbnailFile.name : 'none'}
              </div>
            </div>

            {uploadStatus !== 'idle' && (
              <div className="p-4 rounded-xl bg-brand/10 border border-brand space-y-2">
                <div className="flex justify-between font-mono text-[11px] text-ink-60">
                  <span>Uploading to archive storage...</span>
                  <span className="font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-brand/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                {uploadStatus === 'completed' && (
                  <div className="p-2.5 bg-ink-06 border border-ink-12 rounded-lg text-ink flex items-center gap-2">
                    <Check2Circle className="w-4 h-4 text-ink shrink-0" />
                    <span>Submission confirmed! Sent to Archival Moderation Queue.</span>
                  </div>
                )}
              </div>
            )}

            {uploadStatus === 'idle' && (
              <>
                {!audioFile && (
                  <p className="rounded-xl border border-ink-12 bg-ink-06 px-3 py-2 text-ink-60">
                    A song entry needs its recording. Go back to step 1 and attach an
                    audio file before publishing.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSimulatedUpload}
                  disabled={!audioFile}
                  className="w-full py-3 rounded-xl bg-brand text-on-orange font-semibold text-xs cursor-pointer flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudArrowUp className="w-4 h-4" />
                  <span>Publish to Archival Review Queue</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Navigation Step Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-ink-12">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-xs text-ink-60 hover:text-ink cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : <div />}

          {step < 5 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand text-on-orange text-xs font-semibold cursor-pointer"
            >
              <span>Next: Step {step + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 5 && uploadStatus === 'completed' && (
            <button
              onClick={() => navigateTo('profile')}
              className="px-4 py-2 rounded-lg border border-ink-12 bg-paper hover:bg-ink-06 text-ink-60 text-xs font-medium cursor-pointer"
            >
              View in My Contributions <ArrowRight className="w-3 h-3 inline" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
