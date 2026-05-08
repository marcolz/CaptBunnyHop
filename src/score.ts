import { C } from './config';
import type { Species } from './state';

export const score = {
  current: 0,
  high: parseInt(localStorage.getItem('dodge_hi') ?? '0', 10),
  flashTimer: 0,
  _acc: 0,

  reset(): void {
    this.current = 0;
    this.flashTimer = 0;
    this._acc = 0;
  },

  increment(tScale: number): void {
    this._acc += tScale;
    while (this._acc >= 1) {
      this._acc -= 1;
      this.current++;
      if (this.current % 100 === 0) this.flashTimer = 20;
    }
  },

  checkHigh(): void {
    if (this.current > this.high) {
      this.high = this.current;
      localStorage.setItem('dodge_hi', String(this.high));
    }
  },

  draw(c: CanvasRenderingContext2D): void {
    if (this.flashTimer > 0) this.flashTimer--;
    const flash = this.flashTimer > 0 && Math.floor(this.flashTimer / 4) % 2 === 0;
    c.font = 'bold 15px "Courier New", monospace';
    c.textAlign = 'right';
    c.fillStyle = flash ? '#ff8c00' : 'rgba(0,0,0,0.55)';
    c.fillText(
      `HI ${String(this.high).padStart(5, '0')}  ${String(this.current).padStart(5, '0')}`,
      C.W - 10,
      24,
    );
    c.textAlign = 'left';
  },
};

export interface ScoreEntry { name: string; score: number; species?: Species; }

const HISTORY_KEY = 'bun_history';

export function getHistory(): ScoreEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveToHistory(name: string, current: number, species: Species): void {
  const h = getHistory();
  h.push({ name: name || 'Bunny', score: current, species });
  const best = new Map<string, ScoreEntry>();
  for (const e of h) {
    const key = `${e.name}|${e.species ?? ''}`;
    const existing = best.get(key);
    if (!existing || existing.score < e.score) best.set(key, e);
  }
  const deduped = Array.from(best.values());
  deduped.sort((a, b) => b.score - a.score);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped.slice(0, 10)));
}
