import { C } from './config';

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
