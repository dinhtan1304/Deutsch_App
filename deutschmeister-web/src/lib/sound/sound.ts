'use client';

/**
 * Sound Effects Generator using Web Audio API
 * No external audio files needed - generates sounds programmatically
 */

type SoundType = 'correct' | 'wrong' | 'combo' | 'levelUp' | 'gameOver' | 'click' | 'tick' | 'streak';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  
  // Resume if suspended (browsers require user interaction)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
}

/**
 * Play a synthesized sound effect
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = Math.max(0, Math.min(1, volume));

  const now = ctx.currentTime;

  switch (type) {
    case 'correct':
      playCorrectSound(ctx, masterGain, now);
      break;
    case 'wrong':
      playWrongSound(ctx, masterGain, now);
      break;
    case 'combo':
      playComboSound(ctx, masterGain, now);
      break;
    case 'levelUp':
      playLevelUpSound(ctx, masterGain, now);
      break;
    case 'gameOver':
      playGameOverSound(ctx, masterGain, now);
      break;
    case 'click':
      playClickSound(ctx, masterGain, now);
      break;
    case 'tick':
      playTickSound(ctx, masterGain, now);
      break;
    case 'streak':
      playStreakSound(ctx, masterGain, now);
      break;
  }
}

// Correct answer - Pleasant rising tone
function playCorrectSound(ctx: AudioContext, output: GainNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(output);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, time); // C5
  osc.frequency.setValueAtTime(659.25, time + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, time + 0.2); // G5
  
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialDecayTo(0.01, time + 0.4);
  
  osc.start(time);
  osc.stop(time + 0.4);
}

// Wrong answer - Low buzz
function playWrongSound(ctx: AudioContext, output: GainNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(output);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.setValueAtTime(100, time + 0.15);
  
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialDecayTo(0.01, time + 0.3);
  
  osc.start(time);
  osc.stop(time + 0.3);
}

// Combo sound - Quick ascending notes
function playComboSound(ctx: AudioContext, output: GainNode, time: number) {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(output);
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const noteTime = time + i * 0.08;
    gain.gain.setValueAtTime(0.25, noteTime);
    gain.gain.exponentialDecayTo(0.01, noteTime + 0.15);
    
    osc.start(noteTime);
    osc.stop(noteTime + 0.15);
  });
}

// Level up - Triumphant fanfare
function playLevelUpSound(ctx: AudioContext, output: GainNode, time: number) {
  const notes = [
    { freq: 523.25, start: 0, dur: 0.15 },     // C5
    { freq: 659.25, start: 0.15, dur: 0.15 },  // E5
    { freq: 783.99, start: 0.3, dur: 0.15 },   // G5
    { freq: 1046.50, start: 0.45, dur: 0.4 },  // C6 (held)
  ];
  
  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(output);
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    const noteTime = time + start;
    gain.gain.setValueAtTime(0.3, noteTime);
    gain.gain.setValueAtTime(0.3, noteTime + dur * 0.7);
    gain.gain.exponentialDecayTo(0.01, noteTime + dur);
    
    osc.start(noteTime);
    osc.stop(noteTime + dur);
  });
}

// Game over - Descending tone
function playGameOverSound(ctx: AudioContext, output: GainNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(output);
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, time);
  osc.frequency.exponentialRampToValueAtTime(110, time + 0.8);
  
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialDecayTo(0.01, time + 1);
  
  osc.start(time);
  osc.stop(time + 1);
}

// Click - Short tap
function playClickSound(ctx: AudioContext, output: GainNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(output);
  
  osc.type = 'sine';
  osc.frequency.value = 1000;
  
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialDecayTo(0.01, time + 0.05);
  
  osc.start(time);
  osc.stop(time + 0.05);
}

// Tick - Timer tick
function playTickSound(ctx: AudioContext, output: GainNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(output);
  
  osc.type = 'sine';
  osc.frequency.value = 800;
  
  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialDecayTo(0.01, time + 0.03);
  
  osc.start(time);
  osc.stop(time + 0.03);
}

// Streak - Achievement sound
function playStreakSound(ctx: AudioContext, output: GainNode, time: number) {
  const notes = [783.99, 987.77, 1174.66]; // G5, B5, D6
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(output);
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const noteTime = time + i * 0.1;
    gain.gain.setValueAtTime(0.25, noteTime);
    gain.gain.exponentialDecayTo(0.01, noteTime + 0.25);
    
    osc.start(noteTime);
    osc.stop(noteTime + 0.25);
  });
}

// Polyfill for exponentialDecayTo (not native)
declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): AudioParam;
  }
}

AudioParam.prototype.exponentialDecayTo = function(value: number, endTime: number) {
  // Ensure value is never 0 (exponentialRampToValueAtTime doesn't allow 0)
  const safeValue = Math.max(0.0001, value);
  this.exponentialRampToValueAtTime(safeValue, endTime);
  return this;
};