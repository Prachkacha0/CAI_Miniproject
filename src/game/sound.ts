export type GameCue = 'correct' | 'incorrect' | 'complete';

const KEY = 'hardware-quest-sound';
let audio: AudioContext | null = null;

export function soundEnabled() {
  return localStorage.getItem(KEY) !== 'off';
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(KEY, enabled ? 'on' : 'off');
}

/** Tiny synthesized arcade cues, no audio downloads or third-party assets required. */
export function playCue(cue: GameCue) {
  if (!soundEnabled() || typeof window === 'undefined') return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const notes = cue === 'correct' ? [660, 880] : cue === 'complete' ? [523, 659, 784, 1047] : [220, 165];
    const start = audio.currentTime;
    notes.forEach((hz, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      const at = start + i * (cue === 'complete' ? 0.09 : 0.07);
      osc.type = cue === 'incorrect' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(hz, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(cue === 'incorrect' ? 0.07 : 0.045, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + (cue === 'complete' ? 0.2 : 0.13));
      osc.connect(gain);
      gain.connect(audio!.destination);
      osc.start(at);
      osc.stop(at + (cue === 'complete' ? 0.21 : 0.14));
    });
  } catch {
    // Sound is an enhancement; unsupported or blocked audio never interrupts play.
  }
}
