import React, { useEffect, useState } from 'react';
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
import { MusicianCredit } from '../../types';

const AUDIO_ACCEPT = 'audio/*,video/mp4,video/webm,video/ogg,.mp3,.wav,.flac,.m4a,.ogg,.aac,.mp4,.webm,.ogv';
const AUDIO_MAX_BYTES = 100 * 1024 * 1024;
const METADATA_ONLY_DECLARATION = 'I am submitting historical information only; Banjo should not host the audio.';

const validateAudio = (file: File): string | null => {
  const supportedMediaType = file.type.startsWith('audio/') || ['video/mp4', 'video/webm', 'video/ogg'].includes(file.type);
  const supportedExtension = /\.(mp3|wav|flac|m4a|ogg|aac|mp4|webm|ogv)$/i.test(file.name);
  if (!supportedMediaType && !supportedExtension) return 'Use a supported audio file or an MP4, WebM or OGG video.';
  if (file.size > AUDIO_MAX_BYTES) return 'Media must be under 100 MB.';
  if (file.size === 0) return 'That media file is empty.';
  return null;
};

export const UploadContributeView: React.FC = () => {
  const { submitNewRecording, submitSongEdit, replaceRecordingMedia, editingRecordingId, recordings, navigateTo, isOfflineMode, isBackendConnected, showToast } = useBanjo();
  const editingRecording = editingRecordingId ? recordings.find((recording) => recording.id === editingRecordingId) : undefined;
  const isEditing = Boolean(editingRecording);

  const [submissionCategory, setSubmissionCategory] = useState<
    'music_recording' | 'photograph' | 'document' | 'interview' | 'artist_band'
  >('music_recording');

  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [artistOrBand, setArtistOrBand] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [studio, setStudio] = useState('');

  // Step 2 Contributors
  const [composer, setComposer] = useState('');
  const [leadVocalist, setLeadVocalist] = useState('');
  const [otherVocalists, setOtherVocalists] = useState<string[]>([]);
  const [guitarists, setGuitarists] = useState<Array<{ name: string; guitarType: string }>>([]);
  const [otherInstrumentalists, setOtherInstrumentalists] = useState<Array<{ name: string; instrument: string }>>([]);
  const [bandLeader, setBandLeader] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');

  // Step 3 History & Sources
  const [historyNarrative, setHistoryNarrative] = useState('');
  const [sourcesProvided, setSourcesProvided] = useState('');

  // Step 4 Rights Declaration
  const [rightsDeclaration, setRightsDeclaration] = useState('');

  // Upload state
  // Audio can be omitted only when the contributor selects metadata-only rights terms.
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailTouched, setThumbnailTouched] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [uploadStage, setUploadStage] = useState<'uploading_audio' | 'publishing'>('uploading_audio');
  const [editSummary, setEditSummary] = useState('');

  // Entering or leaving edit mode resets the whole wizard, then either fills
  // it from the recording being edited or clears it for a fresh contribution.
  useEffect(() => {
    setStep(1);
    setUploadStatus('idle');
    setUploadStage('uploading_audio');
    setEditSummary('');
    setAudioFile(null);
    setAudioError(null);
    setThumbnailFile(null);
    setThumbnailError(null);
    setSubmissionCategory('music_recording');

    if (!editingRecording) {
      setTitle('');
      setArtistOrBand('');
      setReleaseYear('');
      setCountry('');
      setRegion('');
      setGenre('');
      setLanguage('');
      setStudio('');
      setComposer('');
      setLeadVocalist('');
      setOtherVocalists([]);
      setGuitarists([]);
      setOtherInstrumentalists([]);
      setBandLeader('');
      setAlbumTitle('');
      setHistoryNarrative('');
      setSourcesProvided('');
      setRightsDeclaration('');
      setThumbnailPreview(null);
      setThumbnailTouched(false);
      return;
    }

    setTitle(editingRecording.title || '');
    setArtistOrBand(editingRecording.artistOrBand || '');
    setReleaseYear(editingRecording.releaseYear == null ? '' : String(editingRecording.releaseYear));
    setCountry(editingRecording.country || '');
    setRegion(editingRecording.region || '');
    setGenre(editingRecording.genre || '');
    setLanguage(editingRecording.language || '');
    setStudio(editingRecording.studio || '');
    setAlbumTitle(editingRecording.albumTitle || '');
    setComposer(editingRecording.composer || editingRecording.musicians.find((credit) => credit.role.toLowerCase().includes('composer'))?.musicianName || '');
    setLeadVocalist(editingRecording.musicians.find((credit) => credit.role.toLowerCase().includes('lead vocal'))?.musicianName || '');
    setOtherVocalists(editingRecording.musicians.filter((credit) => credit.role.toLowerCase().includes('other vocalist')).map((credit) => credit.musicianName));
    setGuitarists(editingRecording.musicians.filter((credit) => credit.role.toLowerCase().includes('guitar')).map((credit) => ({ name: credit.musicianName, guitarType: credit.instrument || 'Guitar' })));
    setOtherInstrumentalists(editingRecording.musicians.filter((credit) => credit.role.toLowerCase() === 'instrumentalist').map((credit) => ({ name: credit.musicianName, instrument: credit.instrument || '' })));
    setBandLeader(editingRecording.musicians.find((credit) => credit.role.toLowerCase().includes('band leader'))?.musicianName || '');
    setHistoryNarrative(editingRecording.story || '');
    setSourcesProvided(editingRecording.sources?.map((source) => source.title).filter(Boolean).join('; ') || '');
    setThumbnailPreview(editingRecording.coverImage || null);
    setThumbnailTouched(Boolean(editingRecording.coverImage));
    // No rights declaration until a replacement file is attached: the media
    // already in the archive keeps the rights it was published under.
    setRightsDeclaration('');
  }, [editingRecordingId]);

  // The cover shown throughout the wizard: the uploaded image if there is one,
  // otherwise artwork derived from whatever title has been typed so far.
  const coverImage = thumbnailPreview || (title.trim() ? generateThumbnail(title) : '');
  const isAutoCover = !thumbnailPreview && Boolean(coverImage);
  const parsedYear = Number(releaseYear);
  const yearWasEntered = releaseYear.trim().length > 0;
  const validReleaseYear = !yearWasEntered || (Number.isInteger(parsedYear) && parsedYear >= 1850 && parsedYear <= new Date().getFullYear());
  const metadataOnly = rightsDeclaration === METADATA_ONLY_DECLARATION;
  const submissionIssues = [
    (isOfflineMode || !isBackendConnected) ? 'Archive backend is unavailable. Check Vercel Supabase environment variables and database setup.' : '',
    !validReleaseYear ? 'Enter a valid release year between 1850 and the current year, or leave it blank.' : '',
    !isEditing && !rightsDeclaration ? 'Choose a rights declaration before publishing.' : '',
    !isEditing && !audioFile && !metadataOnly ? 'Attach an audio file, or choose metadata-only submission.' : '',
    isEditing && audioFile && metadataOnly ? 'Choose a rights declaration for the replacement media.' : '',
    isEditing && audioFile && !rightsDeclaration ? 'Choose a rights declaration for the replacement media.' : '',
    audioFile && !metadataOnly ? audioError : '',
    isEditing && !editSummary.trim() ? 'Explain what changed before submitting this edit.' : '',
  ].filter(Boolean);

  const handleAudioFile = (file: File | null) => {
    setAudioFile(file);
    setAudioError(file ? validateAudio(file) : null);
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

  const handleUpload = async () => {
    if (isOfflineMode || !isBackendConnected) {
      showToast('Connect the archive backend before publishing a contribution.');
      return;
    }
    if ((!isEditing && ((!audioFile && !metadataOnly) || (!metadataOnly && audioError) || !rightsDeclaration))
      || (isEditing && audioFile && (metadataOnly || !rightsDeclaration || audioError))) {
      showToast(isEditing ? 'Choose a valid replacement file and its rights declaration.' : 'Choose a rights declaration and attach valid audio, or choose metadata-only submission.');
      return;
    }
    if (!validReleaseYear) {
      showToast('Enter a valid release year, or leave it blank.');
      return;
    }
    setUploadStatus('uploading');
    setUploadStage(audioFile ? 'uploading_audio' : 'publishing');
    try {
      const musicians: MusicianCredit[] = [];
      const addMusician = (name: string, role: string, instrument: string) => {
        const musicianName = name.trim();
        if (!musicianName) return;
        const musicianId = musicianName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'contributor';
        musicians.push({
          musicianId: `submission-credit-${musicians.length}-${musicianId}`,
          musicianName,
          role,
          instrument,
        });
      };
      addMusician(composer, 'Composer', 'Composition');
      addMusician(leadVocalist, 'Lead Vocalist', 'Vocals');
      otherVocalists.forEach((name) => addMusician(name, 'Other Vocalist', 'Vocals'));
      guitarists.forEach(({ name, guitarType }) => addMusician(name, 'Guitarist', guitarType.trim() || 'Guitar'));
      otherInstrumentalists.forEach(({ name, instrument }) => addMusician(name, 'Instrumentalist', instrument.trim() || 'Other instrument'));
      addMusician(bandLeader, 'Band Leader', 'Band leadership');

      if (isEditing && editingRecording) {
        if (!editSummary.trim()) {
          showToast('Add a short explanation of the metadata changes.');
          setUploadStatus('idle');
          return;
        }
        if (audioFile) {
          const mediaSaved = await replaceRecordingMedia(editingRecording.id, audioFile, rightsDeclaration);
          if (!mediaSaved) {
            setUploadStatus('idle');
            return;
          }
        }
        submitSongEdit(editingRecording.id, {
          title: title.trim(),
          artistOrBand: artistOrBand.trim(),
          albumTitle: albumTitle.trim(),
          year: releaseYear,
          country,
          region,
          genre,
          language,
          studio,
          composer,
          history: historyNarrative,
          musicians,
          sources: sourcesProvided,
          coverImage,
          explanation: editSummary.trim(),
        });
        setUploadStatus('completed');
        return;
      }

      const submitted = await submitNewRecording(
        {
          title: title.trim(),
          artistOrBand: artistOrBand.trim(),
          releaseYear: yearWasEntered ? parsedYear : undefined,
          albumTitle: albumTitle.trim() || undefined,
          country,
          region,
          genre,
          language,
          studio,
          composer,
          story: historyNarrative.trim(),
          coverImage,
          audioFileName: metadataOnly ? undefined : audioFile?.name,
          audioFileSize: metadataOnly ? undefined : audioFile?.size,
          audioMimeType: metadataOnly ? undefined : audioFile?.type,
          musicians,
        },
        rightsDeclaration,
        sourcesProvided,
        metadataOnly ? null : audioFile,
        setUploadStage
      );
      setUploadStatus(submitted ? 'completed' : 'idle');
    } catch {
      setUploadStatus('idle');
      showToast('Submission failed unexpectedly. Please retry.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">
          {isEditing ? 'Editing Archive Entry' : 'Community Contribution'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">
          {isEditing ? `Edit: ${editingRecording?.title}` : 'Contribute Knowledge & Recordings'}
        </h1>
        <p className="text-xs text-ink-60 mt-1">
          {isEditing
            ? 'Correct metadata, add sources, or attach a replacement media file. Archivists review every edit before it is published.'
            : 'Add missing details, upload digitized master recordings, or submit documentary evidence to the encyclopedia.'}
        </p>
        {isEditing && editingRecording && (
          <button
            type="button"
            onClick={() => navigateTo('song_detail', { songId: editingRecording.id })}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to the recording</span>
          </button>
        )}
      </div>

      {/* Category Selection Bar — the contribution type is fixed while editing an existing recording */}
      {!isEditing && (
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
              onClick={() => item.key === 'music_recording' && setSubmissionCategory(item.key as typeof submissionCategory)}
              disabled={item.key !== 'music_recording'}
              title={item.key === 'music_recording' ? undefined : 'This contribution type is not available yet.'}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all ${item.key === 'music_recording' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${
                isSelected
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink-12 bg-paper text-ink-60 hover:bg-ink-06'
              }`}
            >
              <IconC className={`w-4 h-4 ${isSelected ? 'text-brand' : 'text-ink-60'}`} />
              <span className="font-semibold text-[11px]">{item.label}</span>
              {item.key !== 'music_recording' && <span className="text-[9px]">Coming soon</span>}
            </button>
          );
        })}
      </div>
      )}

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
              <p className="text-ink-60">
                {isEditing
                  ? 'Update the details below. Leave the media empty to keep what the archive already holds.'
                  : 'Provide title, artist, year, and studio information.'}
              </p>
            </div>

            <FileDropzone
              accept={AUDIO_ACCEPT}
              label={isEditing ? 'Replacement audio or video file' : 'Audio or video file'}
              cta="Choose media file"
              hint={isEditing
                ? 'Optional — leave empty to keep the media already in the archive. Audio files, or MP4, WebM and OGG video, up to 100 MB.'
                : 'Audio files, or MP4, WebM and OGG video, up to 100 MB.'}
              icon="audio"
              file={audioFile}
              onFile={handleAudioFile}
              error={audioError}
              required={!isEditing && rightsDeclaration !== METADATA_ONLY_DECLARATION}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <FileDropzone
                accept="image/*"
                label="Upload thumbnail file"
                cta="Choose a thumbnail image"
                hint={isEditing
                  ? 'Optional — leave empty to keep the cover art already in the archive.'
                  : 'Leave empty and the app draws cover art from the song title.'}
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

            <div className="space-y-4">
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
                <label className="block text-ink-60 font-medium mb-1">Lead vocalist</label>
                <input
                  type="text"
                  placeholder="e.g. Mary Achieng"
                  value={leadVocalist}
                  onChange={(e) => setLeadVocalist(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>

              <section className="space-y-2 rounded-xl border border-ink-12 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">Other vocalists</h3>
                  <button type="button" onClick={() => setOtherVocalists((items) => [...items, ''])} className="rounded-full border border-ink-12 px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-ink-06">Add other vocalist</button>
                </div>
                {otherVocalists.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" aria-label={`Other vocalist ${index + 1}`} placeholder="Player name" value={name} onChange={(e) => setOtherVocalists((items) => items.map((item, itemIndex) => itemIndex === index ? e.target.value : item))} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                    <button type="button" aria-label={`Remove other vocalist ${index + 1}`} onClick={() => setOtherVocalists((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-ink-12 px-3 text-ink-60 hover:bg-ink-06">Remove</button>
                  </div>
                ))}
              </section>

              <section className="space-y-2 rounded-xl border border-ink-12 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">Guitarists</h3>
                  <button type="button" onClick={() => setGuitarists((items) => [...items, { name: '', guitarType: '' }])} className="rounded-full border border-ink-12 px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-ink-06">Add guitarist</button>
                </div>
                {guitarists.map((guitarist, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="text" aria-label={`Guitar type ${index + 1}`} placeholder="Guitar type (lead, rhythm, bass…)" value={guitarist.guitarType} onChange={(e) => setGuitarists((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, guitarType: e.target.value } : item))} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                    <input type="text" aria-label={`Guitarist name ${index + 1}`} placeholder="Player name" value={guitarist.name} onChange={(e) => setGuitarists((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                    <button type="button" aria-label={`Remove guitarist ${index + 1}`} onClick={() => setGuitarists((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-ink-12 px-3 py-2 text-ink-60 hover:bg-ink-06">Remove</button>
                  </div>
                ))}
              </section>

              <section className="space-y-2 rounded-xl border border-ink-12 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">Other instruments</h3>
                  <button type="button" onClick={() => setOtherInstrumentalists((items) => [...items, { name: '', instrument: '' }])} className="rounded-full border border-ink-12 px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-ink-06">Add instrument</button>
                </div>
                {otherInstrumentalists.map((credit, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="text" aria-label={`Instrument ${index + 1}`} placeholder="Instrument" value={credit.instrument} onChange={(e) => setOtherInstrumentalists((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, instrument: e.target.value } : item))} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                    <input type="text" aria-label={`Instrument player ${index + 1}`} placeholder="Player name" value={credit.name} onChange={(e) => setOtherInstrumentalists((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                    <button type="button" aria-label={`Remove instrument ${index + 1}`} onClick={() => setOtherInstrumentalists((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-ink-12 px-3 py-2 text-ink-60 hover:bg-ink-06">Remove</button>
                  </div>
                ))}
              </section>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-ink-60">Band leader</label>
                  <input type="text" placeholder="Name of band leader" value={bandLeader} onChange={(e) => setBandLeader(e.target.value)} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-ink-60">Album</label>
                  <input type="text" placeholder="Album title" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-ink-60">Language</label>
                  <input type="text" placeholder="Language of the recording" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-ink-60">Sound Engineer / Studio</label>
                  <input type="text" placeholder="Studio or sound engineer" value={studio} onChange={(e) => setStudio(e.target.value)} className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0" />
                </div>
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
              <p className="text-ink-60">Choose the rights declaration that accurately applies to this contribution.</p>
              <p className="rounded-lg border border-brand/40 bg-brand/10 p-3 text-ink">
                Recording metadata and any uploaded audio become publicly accessible after publishing. Only upload audio you have the right to share.
              </p>
              {isEditing && (
                <p className="rounded-lg border border-ink-12 bg-ink-06 p-3 text-ink-60">
                  {audioFile
                    ? 'A replacement file is attached, so choose the rights declaration that covers this upload.'
                    : 'No replacement file attached — the archive keeps the existing media and the rights it was published under. A declaration is only needed if you attach a file.'}
                </p>
              )}
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
                {isEditing ? 'Step 5: Review & Submit Edit' : 'Step 5: Review & Publish'}
              </h2>
              <p className="text-ink-60">
                {isEditing
                  ? 'Confirm the changes and explain what you updated. Archivists review the edit before it appears in the archive.'
                  : 'Confirm the details before the recording is published to the public archive.'}
              </p>
            </div>

            {isEditing && (
              <div>
                <label className="block text-ink-60 font-medium mb-1">Edit summary (required)</label>
                <input
                  type="text"
                  placeholder="e.g. Corrected the release year using the 1978 Daily Nation review"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full rounded-lg border border-ink-12 px-3 py-2 text-ink focus:border-focus focus:outline-2 focus:outline-focus focus:outline-offset-0"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-ink-06 border border-ink-12 space-y-1.5 font-mono text-[11px]">
              <div><strong>Title:</strong> {title || 'Untitled Archive Track'}</div>
              <div><strong>Artist:</strong> {artistOrBand || 'Traditional Artists'}</div>
              <div><strong>Year:</strong> {releaseYear || 'not entered'}</div>
              <div><strong>Country:</strong> {country || 'not entered'}</div>
              <div>
                <strong>Rights:</strong>{' '}
                {isEditing && !rightsDeclaration ? 'existing archive media rights unchanged' : rightsDeclaration}
              </div>
              <div>
                <strong>Media:</strong>{' '}
                {isEditing && !audioFile
                  ? 'existing archive media kept'
                  : metadataOnly ? 'metadata-only submission; no media will be stored' : audioFile ? `${audioFile.name} (${audioFile.type || 'media'})` : 'not attached'}
              </div>
              <div>
                <strong>Cover:</strong>{' '}
                {isAutoCover ? `generated from title (${initialsFromTitle(title)})` : thumbnailFile ? thumbnailFile.name : thumbnailPreview ? 'existing cover art kept' : 'none'}
              </div>
            </div>

            {uploadStatus !== 'idle' && (
              <div role="status" aria-live="polite" aria-busy={uploadStatus === 'uploading'} className="p-4 rounded-xl bg-brand/10 border border-brand space-y-3">
                {uploadStatus === 'uploading' && (
                  <>
                    <p className="text-xs font-semibold text-ink">
                      {uploadStage === 'uploading_audio'
                        ? (isEditing ? 'Uploading replacement media…' : 'Uploading audio to the archive…')
                        : (isEditing ? 'Submitting your edit…' : 'Publishing recording…')}
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-12" aria-hidden="true">
                      <div className={`h-full rounded-full bg-brand transition-all duration-500 ${uploadStage === 'uploading_audio' ? 'w-1/3 animate-pulse' : 'w-2/3 animate-pulse'}`} />
                    </div>
                    <p className="text-[11px] text-ink-60">
                      {isEditing
                        ? 'Your edit will be queued for archivist review as soon as this finishes.'
                        : 'Your recording will be published to the archive as soon as this finishes.'}
                    </p>
                  </>
                )}
                {uploadStatus === 'completed' && (
                  <div className="p-2.5 bg-ink-06 border border-ink-12 rounded-lg text-ink flex items-center gap-2">
                    <Check2Circle className="w-4 h-4 text-ink shrink-0" />
                    <span>
                      {isEditing
                        ? 'Your edit has been submitted and is under review by Banjo Archivists.'
                        : rightsDeclaration === METADATA_ONLY_DECLARATION ? 'The metadata entry is now published. No audio was stored.' : 'The recording and metadata are now published in the archive.'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {uploadStatus === 'idle' && (
              <>
                {submissionIssues.length > 0 && (
                  <div role="status" aria-live="polite" className="rounded-xl border border-ink-12 bg-ink-06 px-3 py-2 text-ink-60">
                    <p className="mb-1 font-semibold text-ink">{isEditing ? 'Resolve these items before submitting this edit:' : 'Resolve these items before publishing:'}</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {submissionIssues.map((issue) => <li key={issue}>{issue}</li>)}
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={submissionIssues.length > 0}
                  className="w-full py-3 rounded-xl bg-brand text-on-orange font-semibold text-xs cursor-pointer flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudArrowUp className="w-4 h-4" />
                  <span>{isEditing ? 'Submit Edit for Review' : 'Publish Recording Now'}</span>
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

          {step === 5 && uploadStatus === 'completed' && (isEditing && editingRecording ? (
            <button
              onClick={() => navigateTo('song_detail', { songId: editingRecording.id })}
              className="px-4 py-2 rounded-lg border border-ink-12 bg-paper hover:bg-ink-06 text-ink-60 text-xs font-medium cursor-pointer"
            >
              Back to the recording <ArrowRight className="w-3 h-3 inline" />
            </button>
          ) : (
            <button
              onClick={() => navigateTo('profile')}
              className="px-4 py-2 rounded-lg border border-ink-12 bg-paper hover:bg-ink-06 text-ink-60 text-xs font-medium cursor-pointer"
            >
              View in My Contributions <ArrowRight className="w-3 h-3 inline" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
