class SoundEngine {
  private ctx: AudioContext | null = null;
  private rainNode: AudioNode | null = null;
  private lofiInterval: number | null = null;
  private isLofiPlaying = false;
  private isRainPlaying = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCsgoTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {}
  }

  playKeypadTap() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  playCardSlide() {
    try {
      this.init();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.07;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch {}
  }

  playChime() {
    try {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = this.ctx!.currentTime + idx * 0.07;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch {}
  }

  playCaseDropThud() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playCaseUnlockOpen() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start();
      osc1.stop(this.ctx.currentTime + 0.08);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, this.ctx.currentTime + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.45);
      gain2.gain.setValueAtTime(0.1, this.ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(this.ctx.currentTime + 0.05);
      osc2.stop(this.ctx.currentTime + 0.45);
    } catch {}
  }

  toggleRain(): boolean {
    this.init();
    if (!this.ctx) return false;
    if (this.isRainPlaying && this.rainNode) {
      try { (this.rainNode as AudioBufferSourceNode).stop(); } catch {}
      this.rainNode = null;
      this.isRainPlaying = false;
      return false;
    }
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.07;
    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    whiteNoise.start();
    this.rainNode = whiteNoise;
    this.isRainPlaying = true;
    return true;
  }

  toggleLofi(): boolean {
    this.init();
    if (!this.ctx) return false;
    if (this.isLofiPlaying) {
      if (this.lofiInterval) clearInterval(this.lofiInterval);
      this.lofiInterval = null;
      this.isLofiPlaying = false;
      return false;
    }
    const chords = [
      [261.63, 329.63, 392.00, 493.88],
      [220.00, 261.63, 329.63, 392.00],
      [174.61, 220.00, 261.63, 329.63],
      [196.00, 246.94, 293.66, 349.23],
    ];
    let chordIdx = 0;
    const playChord = () => {
      if (!this.ctx) return;
      const current = chords[chordIdx % chords.length];
      chordIdx++;
      current.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.025, this.ctx!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 2.8);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start();
        osc.stop(this.ctx!.currentTime + 2.8);
      });
    };
    playChord();
    this.lofiInterval = window.setInterval(playChord, 3200);
    this.isLofiPlaying = true;
    return true;
  }
}

export const sounds = new SoundEngine();
