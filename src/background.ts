import { C } from './config';

export const bg = {
  cloudX: [100, 280, 500, 680],
  cloudY: [30, 55, 40, 25],
  cloudW: [80, 100, 70, 90],
  dotX: [50, 150, 250, 350, 450, 550, 650, 750],
  offset1: 0,
  offset2: 0,

  update(spd: number, tScale: number): void {
    this.offset1 = (this.offset1 + spd * 0.25 * tScale) % C.W;
    this.offset2 = (this.offset2 + spd * 0.55 * tScale) % C.W;
  },

  draw(c: CanvasRenderingContext2D): void {
    // Sky gradient
    const sky = c.createLinearGradient(0, 0, 0, C.GROUND_Y);
    sky.addColorStop(0, '#87ceeb');
    sky.addColorStop(1, '#d4efff');
    c.fillStyle = sky;
    c.fillRect(0, 0, C.W, C.GROUND_Y);

    // Clouds (parallax layer 1 — slow)
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < this.cloudX.length; i++) {
      const cx = ((this.cloudX[i] - this.offset1 * 0.4 + C.W * 2) % (C.W + 150)) - 50;
      const cy = this.cloudY[i];
      const cw = this.cloudW[i];
      this._drawCloud(c, cx, cy, cw);
    }

    // Grass strip
    c.fillStyle = '#5aaa3c';
    c.fillRect(0, C.GROUND_Y, C.W, 8);
    c.fillStyle = '#3d8c28';
    c.fillRect(0, C.GROUND_Y + 8, C.W, 4);

    // Ground fill
    c.fillStyle = '#c8a86a';
    c.fillRect(0, C.GROUND_Y + 12, C.W, C.H - C.GROUND_Y - 12);

    // Ground dots / pebbles (parallax layer 2 — faster)
    c.fillStyle = '#a8885a';
    for (let i = 0; i < this.dotX.length; i++) {
      const dx = ((this.dotX[i] - this.offset2 + C.W * 2) % (C.W + 20)) - 10;
      c.beginPath();
      c.ellipse(dx, C.GROUND_Y + 18, 4, 2.5, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(dx + 100, C.GROUND_Y + 24, 3, 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  },

  _drawCloud(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const h = w * 0.4;
    c.beginPath();
    c.ellipse(x, y, w * 0.5, h * 0.6, 0, 0, Math.PI * 2);
    c.ellipse(x + w * 0.25, y - h * 0.3, w * 0.35, h * 0.55, 0, 0, Math.PI * 2);
    c.ellipse(x - w * 0.2, y - h * 0.1, w * 0.3, h * 0.45, 0, 0, Math.PI * 2);
    c.fill();
  },
};
