/**
 * VANGUARD MOTORCYCLES - BROWSER NATIVE EXHAUST SOUND SYNTHESIZER
 * Pure Web Audio API simulation of a twin-cylinder 650cc motorcycle exhaust rumble.
 * Zero external audio downloads needed!
 */

class MotorcycleSoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.filter = null;
    this.lfo = null;
    this.lfoGain = null;
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
  }

  start() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;

    // Master gain
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0.01, t);
    this.gainNode.gain.exponentialRampToValueAtTime(0.18, t + 0.3);

    // Low pass filter for deep muffled exhaust chamber tone
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(220, t);
    this.filter.Q.setValueAtTime(4, t);

    // Primary low frequency rumble (twin cylinder combustion strokes)
    this.osc1 = this.audioCtx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(55, t); // ~1100 RPM idle pulse

    // Secondary sub-bass harmonic
    this.osc2 = this.audioCtx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(27.5, t);

    // Rhythm LFO to simulate the classic irregular 270-degree crankshaft firing order thumping
    this.lfo = this.audioCtx.createOscillator();
    this.lfo.frequency.setValueAtTime(9.5, t); // 9-10 Hz pulse rhythm

    this.lfoGain = this.audioCtx.createGain();
    this.lfoGain.gain.setValueAtTime(15, t);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.osc1.frequency);

    // Connect audio graph
    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.osc1.start(t);
    this.osc2.start(t);
    this.lfo.start(t);

    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying || !this.audioCtx) return;
    const t = this.audioCtx.currentTime;
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

    setTimeout(() => {
      try {
        if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
        if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
        if (this.lfo) { this.lfo.stop(); this.lfo.disconnect(); }
      } catch (e) {}
      this.isPlaying = false;
    }, 450);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

window.vanguardAudio = new MotorcycleSoundEngine();
