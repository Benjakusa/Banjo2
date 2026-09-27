/**
 * Web Audio Engine for Banjo African Music Heritage Platform
 * Synthesizes vintage African musical motifs (Benga high-tempo interlocking guitars,
 * Congolese Rhumba rumba-clave with warm bass, Highlife brass/keys, Taarab strings)
 * and speech-interview simulation with real-time waveform analysis.
 */

class BanjoAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private currentSampleType: string = 'benga_fast';
  private playbackSpeed: number = 1.0;
  private isDataSaver: boolean = false;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private startTime = 0;
  private pausedTime = 0;
  private simulatedDuration = 274; // default ~4:34
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 12000; // open by default

      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64;

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setDataSaver(enabled: boolean) {
    this.isDataSaver = enabled;
    if (this.filterNode && this.ctx) {
      // In data saver mode, apply 4kHz vintage telephone/transistor radio bandpass cutoff
      this.filterNode.frequency.setTargetAtTime(enabled ? 3800 : 12000, this.ctx.currentTime, 0.1);
    }
  }

  public setSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public play(sampleType: string = 'benga_fast', durationSeconds: number = 274, fromTime?: number) {
    this.initContext();
    if (!this.ctx || !this.filterNode) return;

    this.currentSampleType = sampleType;
    this.simulatedDuration = durationSeconds;

    if (fromTime !== undefined) {
      this.pausedTime = fromTime;
    }

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.pausedTime / this.playbackSpeed;

    this.startMusicalLoop();
  }

  public pause() {
    this.isPlaying = false;
    if (this.ctx) {
      this.pausedTime = (this.ctx.currentTime - this.startTime) * this.playbackSpeed;
    }
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public seek(seconds: number) {
    this.pausedTime = Math.max(0, Math.min(seconds, this.simulatedDuration));
    if (this.isPlaying && this.ctx) {
      this.startTime = this.ctx.currentTime - this.pausedTime / this.playbackSpeed;
    } else {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.pausedTime, this.simulatedDuration);
      }
    }
  }

  public stop() {
    this.pause();
    this.pausedTime = 0;
  }

  private startMusicalLoop() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }

    let beat = 0;

    // Scale notes for Benga (Kenyan pentatonic / D major high speed arpeggios)
    // D4, F#4, G4, A4, B4, C#5, D5, E5, F#5
    const bengaPitches = [293.66, 369.99, 392.0, 440.0, 493.88, 554.37, 587.33, 659.25, 739.99];
    // Congolese Rhumba (Lyrical, flowing syncopation, C major - Am)
    const rhumbaPitches = [261.63, 329.63, 392.0, 440.0, 523.25, 659.25];
    // Highlife (Warm bright brass & guitar chords in F)
    const highlifePitches = [349.23, 440.0, 523.25, 698.46, 783.99];

    const intervalMs = 120 / this.playbackSpeed; // high tempo 16th-note pulse

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.filterNode) return;

      const currentTime = (this.ctx.currentTime - this.startTime) * this.playbackSpeed;
      if (currentTime >= this.simulatedDuration) {
        this.stop();
        if (this.onEndedCallback) this.onEndedCallback();
        return;
      }

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(currentTime, this.simulatedDuration);
      }

      const now = this.ctx.currentTime;

      // Percussion: African clave / cowbell / woodblock pattern
      if (beat % 2 === 0 || beat % 8 === 3 || beat % 8 === 6) {
        this.playPercussion(now, beat % 4 === 0 ? 800 : 1200);
      }

      // Bass guitar: deep rhythmic foundation
      if (beat % 4 === 0 || beat % 4 === 3) {
        const bassFreq = this.currentSampleType === 'rhumba_slow' ? 73.42 : 110.0;
        this.playBassNote(now, bassFreq * (beat % 8 === 0 ? 1 : 1.33));
      }

      // Lead guitar / Nyatiti interlocking high speed riffs
      if (this.currentSampleType === 'benga_fast') {
        const pitchIndex = (beat * 3 + Math.floor(beat / 4)) % bengaPitches.length;
        const noteFreq = bengaPitches[pitchIndex];
        this.playPluckNote(now, noteFreq, 0.15, 'triangle');
      } else if (this.currentSampleType === 'rhumba_slow') {
        // Melodic flowing guitar lines
        if (beat % 2 === 0) {
          const pitchIndex = (Math.floor(beat / 2)) % rhumbaPitches.length;
          this.playPluckNote(now, rhumbaPitches[pitchIndex], 0.25, 'sine');
        }
      } else {
        // Highlife brassy bright pattern
        const pitchIndex = (beat % highlifePitches.length);
        this.playPluckNote(now, highlifePitches[pitchIndex], 0.18, 'sawtooth');
      }

      beat++;
    }, intervalMs);
  }

  private playPluckNote(time: number, freq: number, duration: number, type: OscillatorType) {
    if (!this.ctx || !this.filterNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      // Warm vintage pluck envelope
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + duration);
    } catch {
      // Audio node scheduling safe catch
    }
  }

  private playBassNote(time: number, freq: number) {
    if (!this.ctx || !this.filterNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + 0.35);
    } catch {
      // Safe catch
    }
  }

  private playPercussion(time: number, freq: number) {
    if (!this.ctx || !this.filterNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + 0.05);
    } catch {
      // Safe catch
    }
  }
}

export const audioEngine = new BanjoAudioEngine();
