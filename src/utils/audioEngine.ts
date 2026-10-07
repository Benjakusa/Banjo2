class BanjoAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private playbackSpeed = 1;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;

  private createAudio(source: string): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'metadata';
      this.audio.addEventListener('timeupdate', () => {
        this.onTimeUpdateCallback?.(this.audio?.currentTime || 0, this.audio?.duration || 0);
      });
      this.audio.addEventListener('ended', () => this.onEndedCallback?.());
    }
    if (this.audio.src !== source) {
      this.audio.pause();
      this.audio.src = source;
      this.audio.load();
    }
    return this.audio;
  }

  public setDataSaver(_enabled: boolean) {}

  public setSpeed(speed: number) {
    this.playbackSpeed = speed;
    if (this.audio) this.audio.playbackRate = speed;
  }

  public onTimeUpdate(callback: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = callback;
  }

  public onEnded(callback: () => void) {
    this.onEndedCallback = callback;
  }

  public getAnalyser(): AnalyserNode | null {
    return null;
  }

  public async play(source: string, _durationSeconds?: number, fromTime?: number): Promise<void> {
    if (!source) throw new Error('No audio source is available for this recording.');
    const audio = this.createAudio(source);
    audio.playbackRate = this.playbackSpeed;
    if (fromTime !== undefined) audio.currentTime = Math.max(0, fromTime);
    await audio.play();
  }

  public pause() {
    this.audio?.pause();
  }

  public seek(seconds: number) {
    if (!this.audio) return;
    const upperBound = Number.isFinite(this.audio.duration) ? this.audio.duration : seconds;
    this.audio.currentTime = Math.max(0, Math.min(seconds, upperBound));
    this.onTimeUpdateCallback?.(this.audio.currentTime, this.audio.duration || 0);
  }

  public stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

export const audioEngine = new BanjoAudioEngine();
