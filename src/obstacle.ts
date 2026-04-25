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
      this.isMultiStory = true;
      this.w = 48;
      this.h = 85;
      this.x = C.W + 10;
      this.y = C.GROUND_Y - this.h;
      this.garageH = 40;
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

  drawBack(c: CanvasRenderingContext2D): void {
    if (this.type === 'house') this._drawHouseBack(c);
    else if (this.type === 'snack') this._drawSnack(c);
    else this._drawPuff(c);
  }

  drawFront(c: CanvasRenderingContext2D): void {
    if (this.type === 'house') this._drawHouseFront(c);
  }

  _drawHouseBack(c: CanvasRenderingContext2D): void {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    const front = w - 10;
    const topH = h - this.garageH;
    const mid = y + topH;

    // --- Closed top box (everything above the dock opening) ---
    // Right side shadow panel for top box only
    c.fillStyle = '#a07030';
    c.fillRect(x + front, y, 10, topH);

    // Body
    c.fillStyle = '#c8943c';
    c.fillRect(x, y + 8, front, topH - 8);

    // Top lid (lighter)
    c.fillStyle = '#ddb050';
    c.fillRect(x, y, front, 8);

    // Amazon-blue Prime tape across the lid (extends across front + side panel)
    c.fillStyle = '#146eb4';
    c.fillRect(x, y + 1, front + 10, 5);
    // Tape bottom shadow
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(x, y + 6, front + 10, 1);
    // Tape top highlight
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(x, y + 1, front + 10, 1);
    // "prime" text on tape
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.font = 'bold 4px monospace';
    c.fillText('prime', x + 3, y + 5);

    // Lid flap crease (where lid meets body)
    c.strokeStyle = 'rgba(80,40,10,0.55)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x, y + 8);
    c.lineTo(x + front, y + 8);
    c.stroke();

    // "amazon" label
    c.fillStyle = 'rgba(80,40,10,0.7)';
    c.font = 'bold 6px monospace';
    c.fillText('amazon', x + 4, y + 17);

    // Smile arrow (orange)
    c.strokeStyle = '#ff9900';
    c.lineWidth = 1.5;
    const smY = y + 24;
    const sx1 = x + 5, sx2 = x + front - 6;
    c.beginPath();
    c.moveTo(sx1, smY);
    c.bezierCurveTo(sx1 + 2, smY + 5, sx2 - 2, smY + 5, sx2, smY + 1);
    c.stroke();
    c.beginPath();
    c.moveTo(sx2, smY + 1);
    c.lineTo(sx2 - 3, smY - 2);
    c.moveTo(sx2, smY + 1);
    c.lineTo(sx2 + 1, smY + 4);
    c.stroke();

    // FRAGILE label
    c.fillStyle = 'rgba(80,40,10,0.7)';
    c.font = 'bold 5px monospace';
    c.fillText('FRAGILE', x + 3, y + 38);

    // Corrugation hint
    c.strokeStyle = 'rgba(80,40,10,0.18)';
    c.lineWidth = 0.6;
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.moveTo(x, y + 30 + i * 6);
      c.lineTo(x + front, y + 30 + i * 6);
      c.stroke();
    }

    // --- Dock interior back wall (visible through the opening) ---
    const innerTop = mid + 4;
    const innerLeft = x + 5;
    const innerRight = x + front - 5;
    const innerBottom = y + h;

    // Dark back wall
    c.fillStyle = '#1a1208';
    c.fillRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

    // Top inner shadow gradient (sells the depth of the opening)
    const grad = c.createLinearGradient(0, innerTop, 0, innerTop + 14);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.fillRect(innerLeft, innerTop, innerRight - innerLeft, 14);

    // Subtle vertical corrugation on back wall
    c.strokeStyle = 'rgba(120,80,40,0.18)';
    c.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const px = innerLeft + 6 + i * 9;
      c.beginPath();
      c.moveTo(px, innerTop + 6);
      c.lineTo(px, innerBottom - 2);
      c.stroke();
    }

    // Floor shadow inside the dock
    const grad2 = c.createLinearGradient(0, innerBottom - 10, 0, innerBottom);
    grad2.addColorStop(0, 'rgba(0,0,0,0)');
    grad2.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = grad2;
    c.fillRect(innerLeft, innerBottom - 10, innerRight - innerLeft, 10);
  }

  _drawHouseFront(c: CanvasRenderingContext2D): void {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    const front = w - 10;
    const topH = h - this.garageH;
    const mid = y + topH;
    const headerH = 4;
    const pillarW = 5;
    const dockH = h - topH;

    // Top header overhang (front face of cardboard above the opening)
    c.fillStyle = '#c8943c';
    c.fillRect(x, mid, front, headerH);
    // Underside shadow of header (cardboard thickness edge)
    c.fillStyle = 'rgba(40,20,5,0.7)';
    c.fillRect(x, mid + headerH - 1, front, 1);

    // Left pillar (front cardboard wall)
    c.fillStyle = '#c8943c';
    c.fillRect(x, mid + headerH, pillarW, dockH - headerH);
    // Inner edge shadow on left pillar
    c.fillStyle = 'rgba(40,20,5,0.7)';
    c.fillRect(x + pillarW - 1, mid + headerH, 1, dockH - headerH);

    // Right pillar (front cardboard wall)
    c.fillStyle = '#c8943c';
    c.fillRect(x + front - pillarW, mid + headerH, pillarW, dockH - headerH);
    // Inner edge shadow on right pillar
    c.fillStyle = 'rgba(40,20,5,0.7)';
    c.fillRect(x + front - pillarW, mid + headerH, 1, dockH - headerH);

    // Right side shadow panel continuing down through dock area
    c.fillStyle = '#a07030';
    c.fillRect(x + front, mid, 10, dockH);

    // Seam line between top box and dock frame
    c.strokeStyle = 'rgba(80,40,10,0.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, mid);
    c.lineTo(x + w, mid);
    c.stroke();
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
      const cropBottom = 375; // transparent padding at bottom of source image
      const sH = puffImg.naturalHeight - cropBottom;
      c.drawImage(puffImg, 0, 0, puffImg.naturalWidth, sH, this.x, this.y, this.w, this.h);
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

  drawBack(c: CanvasRenderingContext2D): void {
    for (const o of this.list) o.drawBack(c);
  },

  drawFront(c: CanvasRenderingContext2D): void {
    for (const o of this.list) o.drawFront(c);
  },
};
