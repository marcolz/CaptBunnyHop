import jingleUrl from './assets/jingle.mp3';

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  if (audioCtx) return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new Ctor();
}

export function playJumpSound(): void {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(580, audioCtx.currentTime + 0.07);
  osc.frequency.exponentialRampToValueAtTime(420, audioCtx.currentTime + 0.14);
  gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.18);
}

export function playHitSound(): void {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

let jingleEl: HTMLAudioElement | null = null;

function getJingle(): HTMLAudioElement | null {
  if (jingleEl) return jingleEl;
  const el = document.getElementById('jingleAudio');
  if (!(el instanceof HTMLAudioElement)) return null;
  if (!el.src) el.src = jingleUrl;
  jingleEl = el;
  return jingleEl;
}

export function startJingle(): void {
  const audio = getJingle();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(err => console.log('Audio play failed:', err));
}

export function stopJingle(): void {
  const audio = getJingle();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
