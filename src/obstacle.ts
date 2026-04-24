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

  constructor(type: ObstacleType, spawnSpeed: number) {
    this.type = type;
    this.speed = spawnSpeed;
    if (type === 'house') {
      this.isMultiStory = Math.random() < 0.35;
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
      // puff: big cheesy circle on the ground
      this.w = 58;
      this.h = 58;
      this.x = C.W + 10;
      this.y = C.GROUND_Y - this.h;
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
      const m = 7;
      return { x: this.x + m, y: this.y + m, w: this.w - m * 2, h: this.h - m * 2 };
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

  _drawHouse(c: CanvasRenderingContext2D): void {
    const x = this.x, y = this.y, w = this.w, h = this.h;

    if (this.isMultiStory) {
      // Two-story house with garage
      const topH = h - this.garageH;

      // Top floor (normal house)
      c.fillStyle = '#c8813a';
      c.fillRect(x, y + 20, w, topH - 20);
      c.fillStyle = '#a86828';
      c.fillRect(x + w - 10, y + 20, 10, topH - 20);

      // Roof for top floor
      c.fillStyle = '#8b4513';
      c.beginPath();
      c.moveTo(x - 4, y + 22);
      c.lineTo(x + w / 2, y);
      c.lineTo(x + w + 4, y + 22);
      c.closePath();
      c.fill();
      c.fillStyle = '#6b3010';
      c.fillRect(x + w / 2 - 2, y, 4, 22);

      // Window on top floor
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

      // Bottom floor (garage)
      const gY = y + topH;
      c.fillStyle = '#8b4513';
      c.fillRect(x, gY, 6, this.garageH);
      c.fillRect(x + w - 6, gY, 6, this.garageH);
      c.fillRect(x, gY, w, 3);

      // Cardboard texture
      c.strokeStyle = 'rgba(80,40,10,0.3)';
      c.lineWidth = 0.8;
      for (let i = 0; i < 2; i++) {
        c.beginPath();
        c.moveTo(x + 2, y + 30 + i * 10);
        c.lineTo(x + w - 6, y + 30 + i * 10);
        c.stroke();
      }
      c.fillStyle = 'rgba(80,40,10,0.35)';
      c.font = 'bold 5px monospace';
      c.fillText('2-STORY', x + 2, y + 26);
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
    if (puffImg.complete && puffImg.naturalWidth) {
      c.drawImage(puffImg, this.x, this.y, this.w, this.h);
    } else {
      c.fillStyle = '#f0a800';
      c.beginPath();
      c.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
      c.fill();
    }
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
};
