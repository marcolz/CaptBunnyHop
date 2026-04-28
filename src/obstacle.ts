import { C } from './config';
import { Bunny, Bounds } from './bunny';
import snackUrl from './assets/snack.webp';
import puffUrl from './assets/puff.webp';

const snackImg = new Image();
snackImg.src = snackUrl;

const puffImg = new Image();
puffImg.src = puffUrl;

export type ObstacleType = 'house' | 'snack' | 'puff';

export class Obstacle {
  type: ObstacleType;
  speed: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isMultiStory = false;
  garageH = 0;
  visualScale = 1;

  constructor(type: ObstacleType, spawnSpeed: number) {
    this.type = type;
    this.speed = spawnSpeed;
    if (type === 'house') {
      this.isMultiStory = true;
      this.w = 48;
      this.h = this.isMultiStory ? 85 : 58;
      this.x = C.W + 10;
      this.y = C.GROUND_Y - this.h;
      this.garageH = this.isMultiStory ? 40 : 0;
    } else if (type === 'snack') {
      // aspect ratio of snack is ~1340:793 ≈ 1.69:1
      this.w = 90;
      this.h = 53;
      this.x = C.W + 10;
      this.y = C.GROUND_Y - 100 - Math.random() * 30;
    } else {
      // puff: cheese-puff curl on the ground (image aspect ~1.55:1)
      this.h = 42;
      this.w = 65;
      this.x = C.W + 10;
      this.y = C.GROUND_Y - this.h;
      // ~1 in 20 puffs is visually gigantic (collision unaffected).
      if (Math.random() < 0.05) this.visualScale = 3.2;
    }
  }

  update(spd: number, tScale: number): void {
    this.x -= spd * tScale;
  }

  isOffscreen(): boolean {
    return this.x + this.w < 0;
  }

  getBounds(): Bounds {
    if (this.type === 'puff') {
      // Dense body of the cheese curl, excluding the thin curling tips.
      return {
        x: this.x + this.w * 0.21,
        y: this.y + this.h * 0.13,
        w: this.w * 0.60,
        h: this.h * 0.74,
      };
    }
    if (this.type === 'snack') {
      // collision on bag body only, not the wings (outer ~28% each side)
      return {
        x: this.x + this.w * 0.28,
        y: this.y + this.h * 0.08,
        w: this.w * 0.44,
        h: this.h * 0.84,
      };
    }
    const m = 4;
    return { x: this.x + m, y: this.y + m, w: this.w - m * 2, h: this.h - m * 2 };
  }

  draw(c: CanvasRenderingContext2D): void {
    if (this.type === 'house') this._drawHouse(c);
    else if (this.type === 'snack') this._drawSnack(c);
    else this._drawPuff(c);
  }

  drawForeground(c: CanvasRenderingContext2D): void {
    if (this.type !== 'house' || !this.isMultiStory) return;
    // Trailing (left) pylon — drawn after the bunny so the bunny passes behind it.
    const x = this.x;
    const gY = this.y + (this.h - this.garageH);
    c.fillStyle = '#c89260';
    c.fillRect(x, gY, 6, this.garageH);
    c.fillStyle = '#a8743e';
    c.fillRect(x + 4, gY, 2, this.garageH);
  }

  _drawHouse(c: CanvasRenderingContext2D): void {
    const x = this.x, y = this.y, w = this.w, h = this.h;

    if (this.isMultiStory) {
      // Stack of two Amazon delivery boxes
      const topH = h - this.garageH;
      const gY = y + topH;

      const cb = '#c89260';
      const cbDark = '#a8743e';
      const cbShadow = '#7a5028';
      const amzBlue = '#1399d1';
      const amzBlueDeep = '#0c6e9b';

      // Top box body
      c.fillStyle = cb;
      c.fillRect(x, y, w, topH);
      c.fillStyle = cbDark;
      c.fillRect(x + w - 5, y, 5, topH);
      // Top flap edge
      c.fillStyle = cbShadow;
      c.fillRect(x, y, w, 1);
      // Center flap seam (where the two top flaps meet)
      c.strokeStyle = 'rgba(80,40,10,0.45)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x, y + 1);
      c.lineTo(x + w, y + 1);
      c.stroke();

      // Bottom level — open archway so the bunny visibly passes through.
      // The trailing (left) pylon is drawn in the foreground pass so the
      // bunny passes behind it; only the leading (right) pylon goes here.
      c.fillStyle = cb;
      c.fillRect(x + w - 6, gY, 6, this.garageH);
      c.fillStyle = cbDark;
      c.fillRect(x + w - 5, gY, 5, this.garageH);
      // Lintel — bottom flaps of the top box overhanging the opening
      c.fillStyle = cbShadow;
      c.fillRect(x, gY - 1, w, 2);
      c.fillStyle = cb;
      c.fillRect(x, gY + 1, w, 3);
      c.fillStyle = cbDark;
      c.fillRect(x + w - 5, gY + 1, 5, 3);
      // Soft shadow cast under the lintel into the opening
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.fillRect(x + 6, gY + 4, w - 12, 3);

      // Amazon Prime tape — runs across each box's top flap seam
      const drawTape = (ty: number) => {
        c.fillStyle = amzBlue;
        c.fillRect(x, ty, w, 9);
        c.fillStyle = 'rgba(255,255,255,0.18)';
        c.fillRect(x, ty, w, 1);
        c.fillStyle = amzBlueDeep;
        c.fillRect(x, ty + 8, w, 1);

        // "amazon" smile arrow centered
        const cx = x + w / 2;
        const cy = ty + 4;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.1;
        c.beginPath();
        c.arc(cx, cy, 4.2, 0.08 * Math.PI, 0.92 * Math.PI, false);
        c.stroke();
        // arrow tip on right end of smile
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(cx + 4, cy + 2.8);
        c.lineTo(cx + 6.5, cy + 4.2);
        c.lineTo(cx + 3.2, cy + 4.6);
        c.closePath();
        c.fill();
        // tiny "prime" wordmark on the left
        c.fillStyle = '#ffffff';
        c.font = 'bold 4px sans-serif';
        c.fillText('prime', x + 2, cy + 2);
      };
      drawTape(y + 10);

      // Shipping label on top box
      const lx = x + w - 16, ly = y + 25;
      c.fillStyle = '#fff8e0';
      c.fillRect(lx, ly, 13, 13);
      c.strokeStyle = cbShadow;
      c.lineWidth = 0.5;
      c.strokeRect(lx, ly, 13, 13);
      c.fillStyle = '#000';
      c.fillRect(lx + 1, ly + 2, 10, 0.8);
      c.fillRect(lx + 1, ly + 4, 7, 0.8);
      for (let i = 0; i < 5; i++) {
        c.fillRect(lx + 1 + i * 2.2, ly + 7, 1, 5);
      }
    } else {
      // Single-story house
      c.fillStyle = '#c8813a';
      c.fillRect(x, y + 20, w, h - 20);
      c.fillStyle = '#a86828';
      c.fillRect(x + w - 10, y + 20, 10, h - 20);

      c.fillStyle = '#8b4513';
      c.beginPath();
      c.moveTo(x - 4, y + 22);
      c.lineTo(x + w / 2, y);
      c.lineTo(x + w + 4, y + 22);
      c.closePath();
      c.fill();
      c.fillStyle = '#6b3010';
      c.fillRect(x + w / 2 - 2, y, 4, 22);

      c.fillStyle = '#5a3010';
      c.fillRect(x + w / 2 - 7, y + h - 22, 14, 22);
      c.fillStyle = '#3a1a08';
      c.fillRect(x + w / 2 - 6, y + h - 21, 12, 20);
      c.fillStyle = '#f0c040';
      c.beginPath();
      c.arc(x + w / 2 + 3, y + h - 11, 1.5, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = '#a0d4f0';
      c.fillRect(x + 6, y + 28, 12, 10);
      c.strokeStyle = '#5a3010';
      c.lineWidth = 1.5;
      c.strokeRect(x + 6, y + 28, 12, 10);
      c.beginPath();
      c.moveTo(x + 12, y + 28);
      c.lineTo(x + 12, y + 38);
      c.moveTo(x + 6, y + 33);
      c.lineTo(x + 18, y + 33);
      c.stroke();

      c.strokeStyle = 'rgba(80,40,10,0.3)';
      c.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(x + 2, y + 30 + i * 10);
        c.lineTo(x + w - 12, y + 30 + i * 10);
        c.stroke();
      }
      c.fillStyle = 'rgba(80,40,10,0.35)';
      c.font = 'bold 6px monospace';
      c.fillText('CARDBOARD', x + 2, y + 26);
    }
  }

  _drawSnack(c: CanvasRenderingContext2D): void {
    const t = Date.now();
    const bob = Math.sin(t / 220) * 3;
    const tilt = Math.sin(t / 340) * 0.06;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2 + bob;
    c.save();
    c.translate(cx, cy);
    c.rotate(tilt);
    if (snackImg.complete && snackImg.naturalWidth) {
      c.drawImage(snackImg, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      // fallback while image loads
      c.fillStyle = '#ff8c1a';
      c.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }
    c.restore();
  }

  _drawPuff(c: CanvasRenderingContext2D): void {
    const t = Date.now();
    const phase = (this.x + this.y) * 0.05;
    const swing = Math.sin(t / 280 + phase) * 0.22;
    const bob = Math.sin(t / 320 + phase) * 1.2;
    const s = this.visualScale;
    const drawW = this.w * s;
    const drawH = this.h * s;
    // Anchor by the bottom centre of the original (collision) box so the giant
    // puff still rests on the ground.
    const pivotX = this.x + this.w / 2;
    const pivotY = this.y + this.h - drawH * 0.85;
    c.save();
    c.translate(pivotX, pivotY + bob);
    c.rotate(swing);
    if (puffImg.complete && puffImg.naturalWidth) {
      c.drawImage(puffImg, -drawW / 2, -drawH * 0.15, drawW, drawH);
    } else {
      c.fillStyle = '#f0a800';
      c.beginPath();
      c.arc(0, drawH * 0.35, drawW / 2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

export const obstacles = {
  list: [] as Obstacle[],
  distToNext: 900,

  reset(): void {
    this.list = [];
    this.distToNext = 900 + Math.random() * 400;
  },

  update(spd: number, tScale: number): void {
    this.distToNext -= spd * tScale;
    if (this.distToNext <= 0) {
      const r = Math.random();
      const type: ObstacleType = r < 0.42 ? 'house' : r < 0.78 ? 'snack' : 'puff';
      this.list.push(new Obstacle(type, spd));
      const gap = C.OBS_MIN_GAP + Math.random() * (C.OBS_MAX_GAP - C.OBS_MIN_GAP);
      this.distToNext = gap / (spd / C.INIT_SPEED);
    }
    for (const o of this.list) o.update(spd, tScale);
    this.list = this.list.filter(o => !o.isOffscreen());
  },

  checkCollision(b: Bounds, bunny: Bunny): boolean {
    for (const o of this.list) {
      let ob = o.getBounds();
      if (o.type === 'house' && o.isMultiStory && bunny && bunny.isSquat) {
        const m = 4;
        ob = { x: o.x + m, y: o.y + m, w: o.w - m * 2, h: o.h - o.garageH - m };
      }
      if (b.x < ob.x + ob.w && b.x + b.w > ob.x &&
          b.y < ob.y + ob.h && b.y + b.h > ob.y) return true;
    }
    return false;
  },

  draw(c: CanvasRenderingContext2D): void {
    for (const o of this.list) o.draw(c);
  },

  drawForeground(c: CanvasRenderingContext2D): void {
    for (const o of this.list) o.drawForeground(c);
  },
};
