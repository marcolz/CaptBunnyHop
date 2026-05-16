import jingleUrl from './assets/jingle.mp3';
import gameOverUrl from './assets/game-over.mp3';
import powerupUrl from './assets/powerup.ogg';
import pandaSelectUrl from './assets/panda-select.ogg';
import pandaKickUrl from './assets/panda-kick.ogg';

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

export function playMeow(): void {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const t0 = ctx.currentTime;

  // Two-syllable "me-ow": rising vowel then falling vowel.
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  // A formant-ish lowpass shapes the buzzy sawtooth into a vowel.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 8;

  osc.type = 'sawtooth';
  // Pitch: rise on "me", fall on "ow".
  osc.frequency.setValueAtTime(640, t0);
  osc.frequency.linearRampToValueAtTime(860, t0 + 0.10);
  osc.frequency.linearRampToValueAtTime(690, t0 + 0.22);
  osc.frequency.linearRampToValueAtTime(450, t0 + 0.45);

  // Formant sweep: "ee" (~2200 Hz) → "aa" (~1100 Hz) → "oo" (~700 Hz).
  filter.frequency.setValueAtTime(2200, t0);
  filter.frequency.linearRampToValueAtTime(1100, t0 + 0.18);
  filter.frequency.linearRampToValueAtTime(700, t0 + 0.45);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.55);
}

export function playWoof(): void {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const t0 = ctx.currentTime;

  // Two short barks: "wuf-wuf". Each is a quick low-pitched burst with a snappy decay.
  const playBark = (start: number, basePitch: number): void => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(900, start);
    filter.frequency.linearRampToValueAtTime(500, start + 0.10);

    osc.type = 'sawtooth';
    // Quick "wu-uff" pitch arc: jump up then drop.
    osc.frequency.setValueAtTime(basePitch * 0.9, start);
    osc.frequency.linearRampToValueAtTime(basePitch * 1.15, start + 0.03);
    osc.frequency.linearRampToValueAtTime(basePitch * 0.7, start + 0.13);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.30, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.18);
  };

  playBark(t0, 220);
  playBark(t0 + 0.18, 200);
}

export function playHiya(): void {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const t0 = ctx.currentTime;

  // Burst 1 — "hi": short square tone at ~520 Hz
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(520, t0);
  gain1.gain.setValueAtTime(0.0001, t0);
  gain1.gain.exponentialRampToValueAtTime(0.15, t0 + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(t0);
  osc1.stop(t0 + 0.1);

  // Burst 2 — "YA": triangle sweeping 380 → 240 Hz
  const t1 = t0 + 0.11;
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(380, t1);
  osc2.frequency.linearRampToValueAtTime(240, t1 + 0.14);
  gain2.gain.setValueAtTime(0.0001, t1);
  gain2.gain.exponentialRampToValueAtTime(0.22, t1 + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.001, t1 + 0.15);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(t1);
  osc2.stop(t1 + 0.16);

  // Brief noise burst for shout texture
  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 900;
  noiseFilter.Q.value = 2;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t1);
  noiseGain.gain.exponentialRampToValueAtTime(0.08, t1 + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t1 + 0.05);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t1);
  noise.stop(t1 + 0.06);
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

let gameOverEl: HTMLAudioElement | null = null;

function getGameOver(): HTMLAudioElement | null {
  if (gameOverEl) return gameOverEl;
  const el = document.getElementById('gameOverAudio');
  if (!(el instanceof HTMLAudioElement)) return null;
  if (!el.src) el.src = gameOverUrl;
  gameOverEl = el;
  return gameOverEl;
}

export function playGameOverJingle(): void {
  const audio = getGameOver();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(err => console.log('Game-over audio play failed:', err));
}

export function stopGameOverJingle(): void {
  const audio = getGameOver();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

let powerupEl: HTMLAudioElement | null = null;

function getPowerup(): HTMLAudioElement | null {
  if (powerupEl) return powerupEl;
  const el = document.getElementById('powerupAudio');
  if (!(el instanceof HTMLAudioElement)) return null;
  if (!el.src) el.src = powerupUrl;
  powerupEl = el;
  return powerupEl;
}

export function playPowerupSound(): void {
  const audio = getPowerup();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(err => console.log('Powerup audio play failed:', err));
}

let pandaSelectEl: HTMLAudioElement | null = null;

function getPandaSelect(): HTMLAudioElement | null {
  if (pandaSelectEl) return pandaSelectEl;
  const el = document.getElementById('pandaSelectAudio');
  if (!(el instanceof HTMLAudioElement)) return null;
  if (!el.src) el.src = pandaSelectUrl;
  pandaSelectEl = el;
  return pandaSelectEl;
}

export function playPandaSelect(): void {
  const audio = getPandaSelect();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(err => console.log('Panda select audio play failed:', err));
}

let pandaKickEl: HTMLAudioElement | null = null;

function getPandaKick(): HTMLAudioElement | null {
  if (pandaKickEl) return pandaKickEl;
  const el = document.getElementById('pandaKickAudio');
  if (!(el instanceof HTMLAudioElement)) return null;
  if (!el.src) el.src = pandaKickUrl;
  pandaKickEl = el;
  return pandaKickEl;
}

export function playPandaKick(): void {
  const audio = getPandaKick();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(err => console.log('Panda kick audio play failed:', err));
}
