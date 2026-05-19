import { C } from './config';
import { Bunny, Bounds } from './bunny';
import { game } from './state';
import brickUrl from './assets/brick.webp';
import powerupBrickUrl from './assets/powerup-brick.webp';
import puffUrl from './assets/puff.webp';
import pintUrl from './assets/pint.webp';

const brickImg = new Image();
brickImg.src = brickUrl;

const powerupBrickImg = new Image();
powerupBrickImg.src = powerupBrickUrl;

const puffImg = new Image();
puffImg.src = puffUrl;

const pintImg = new Image();
pintImg.src = pintUrl;

export type ObstacleType = 'house' | 'snack' | 'puff' | 'pint';

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
  isPowerupBrick = false;
  // Floating puff state — set when a puff is spawned by bonking a powerup brick.
  // While floating, the puff stays at its spawn x in screen-space (doesn't
  // scroll), hovers until no brick supports it, then falls under gravity.
  isFloating = false;
  vy = 0;

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
      // Cheese brick — aspect ~2.04:1.
      this.w = 100;
      this.h = 49;
      this.x = C.W + 10;
      // y is set by the spawn logic so platform pieces share a tier.
      this.y = C.GROUND_Y - 100;
    } else if (type === 'pint') {
      // ice cream pint on the ground (image aspect 366:432 ≈ 0.847:1)
      this.h = 62;
      this.w = 53;
      this.x = C.W + 10;
      this.y = C.GROUND_Y - this.h;
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
      // Brick is a tight rectangle; small margin for the soft edge highlight.
      return {
        x: this.x + this.w * 0.04,
        y: this.y + this.h * 0.06,
        w: this.w * 0.92,
        h: this.h * 0.88,
      };
    }
    if (this.type === 'pint') {
      // tight box around the cylindrical pint body
      return {
        x: this.x + this.w * 0.06,
        y: this.y + this.h * 0.04,
        w: this.w * 0.88,
        h: this.h * 0.94,
      };
    }
    const m = 4;
    return { x: this.x + m, y: this.y + m, w: this.w - m * 2, h: this.h - m * 2 };
  }

  draw(c: CanvasRenderingContext2D): void {
    if (this.type === 'house') this._drawHouse(c);
    else if (this.type === 'snack') this._drawSnack(c);
    else if (this.type === 'pint') this._drawPint(c);
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
    const img = this.isPowerupBrick ? powerupBrickImg : brickImg;
    if (img.complete && img.naturalWidth) {
      c.drawImage(img, this.x, this.y, this.w, this.h);
    } else {
      c.fillStyle = '#f0a830';
      c.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  _drawPint(c: CanvasRenderingContext2D): void {
    if (pintImg.complete && pintImg.naturalWidth) {
      c.drawImage(pintImg, this.x, this.y, this.w, this.h);
    } else {
      c.fillStyle = '#fff';
      c.fillRect(this.x, this.y + this.h * 0.15, this.w, this.h * 0.85);
      c.fillStyle = '#222';
      c.fillRect(this.x, this.y, this.w, this.h * 0.18);
    }
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

// Cartoon "POW" explosion particle. Two flavors: a short-lived radial burst
// drawn from the impact center, and small debris flecks that fly outward.
interface Particle {
  type: 'burst' | 'fleck';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  rotSpeed: number;
}

const FLECK_COLORS = ['#f5f5f0', '#c8c8c0', '#404040', '#909090'];

export const obstacles = {
  list: [] as Obstacle[],
  particles: [] as Particle[],
  distToNext: 900,

  reset(): void {
    this.list = [];
    this.particles = [];
    this.distToNext = 900 + Math.random() * 400;
  },

  update(spd: number, tScale: number): void {
    this.distToNext -= spd * tScale;
    if (this.distToNext <= 0) {
      // Puffs no longer spawn naturally — they only appear when a powerup
      // brick is bonked from below. Pints still spawn as ground hazards.
      const r = Math.random();
      const type: ObstacleType = r < 0.34 ? 'house' : r < 0.67 ? 'snack' : 'pint';
      if (type === 'snack') {
        // A snack platform is 2–4 snacks placed edge-to-edge at the same height.
        // Adjacent pieces let the bunny ride seamlessly: when it walks off one,
        // the same-frame landing check immediately catches the next one.
        const pieces = 2 + Math.floor(Math.random() * 3);
        // Two tiers: low (reachable from ground) and high (best reached from low tier).
        const platformY = Math.random() < 0.5
          ? C.GROUND_Y - 100 - Math.random() * 30   // low tier:  top 100–130 above ground
          : C.GROUND_Y - 145 - Math.random() * 15;  // high tier: top 145–160 above ground
        for (let i = 0; i < pieces; i++) {
          const piece = new Obstacle('snack', spd);
          piece.y = platformY;
          piece.x = C.W + 10 + i * piece.w;
          // About 1 in 7 bricks is a special "powerup" brick (visual variant).
          if (Math.random() < 1 / 7) piece.isPowerupBrick = true;
          this.list.push(piece);
        }
      } else {
        const o = new Obstacle(type, spd);
        this.list.push(o);
      }
      const gap = C.OBS_MIN_GAP + Math.random() * (C.OBS_MAX_GAP - C.OBS_MIN_GAP);
      this.distToNext = gap / (spd / C.INIT_SPEED);
    }
    for (const o of this.list) {
      if (o.type === 'puff' && o.isFloating) {
        this._updateFloatingPuff(o, tScale);
      } else {
        o.update(spd, tScale);
      }
    }
    this.list = this.list.filter(o => !o.isOffscreen());
  },

  destroyOverlapping(b: Bounds): void {
    // Panda flying kick: pulverize ground-stationary kill obstacles (house, pint).
    // Snacks are platforms (not obstacles); puffs are powerups and stay collectible.
    // Each destroyed obstacle bursts into a cartoon "POW" of debris.
    const next: Obstacle[] = [];
    for (const o of this.list) {
      if (o.type !== 'house' && o.type !== 'pint') {
        next.push(o);
        continue;
      }
      const ob = o.getBounds();
      const overlap = b.x < ob.x + ob.w && b.x + b.w > ob.x &&
                      b.y < ob.y + ob.h && b.y + b.h > ob.y;
      if (overlap) {
        this._spawnExplosion(o);
      } else {
        next.push(o);
      }
    }
    this.list = next;
  },

  _spawnExplosion(o: Obstacle): void {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    // One radial burst at the impact center.
    this.particles.push({
      type: 'burst',
      x: cx, y: cy,
      vx: 0, vy: 0,
      life: 18, maxLife: 18,
      size: 32,
      color: '',
      rot: 0, rotSpeed: 0,
    });
    // 6–8 debris flecks flying outward in the upper 270° (so they don't shoot
    // straight into the floor).
    const fleckCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < fleckCount; i++) {
      // Angle: random across the upper 270° (skip the 45° wedge pointing down).
      const angle = -Math.PI + (Math.random() * Math.PI * 1.5) - Math.PI * 0.25;
      const speed = 3 + Math.random() * 3;
      const life = 28 + Math.random() * 14;
      this.particles.push({
        type: 'fleck',
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life, maxLife: life,
        size: 3 + Math.random() * 3,
        color: FLECK_COLORS[Math.floor(Math.random() * FLECK_COLORS.length)],
        rot: 0,
        rotSpeed: (Math.random() - 0.5) * 0.6,
      });
    }
  },

  updateEffects(tScale: number): void {
    for (const p of this.particles) {
      p.life -= tScale;
      if (p.type === 'fleck') {
        p.vy += 0.4 * tScale;
        p.x += p.vx * tScale;
        p.y += p.vy * tScale;
        p.rot += p.rotSpeed * tScale;
      }
    }
    this.particles = this.particles.filter(p => p.life > 0);
  },

  drawEffects(c: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const t = 1 - p.life / p.maxLife;
      if (p.type === 'burst') {
        // Eased radius growth + late fade
        const eased = 1 - (1 - t) * (1 - t);
        const radius = p.size * eased;
        const alpha = t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4);
        c.save();
        c.globalAlpha = alpha;
        c.translate(p.x, p.y);
        // 8 radial rays — yellow underlay for glow, white core on top.
        const rays = 8;
        for (let i = 0; i < rays; i++) {
          const a = (Math.PI * 2 / rays) * i;
          const x2 = Math.cos(a) * radius;
          const y2 = Math.sin(a) * radius;
          c.strokeStyle = '#ffd860';
          c.lineWidth = 5;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(x2, y2);
          c.stroke();
          c.strokeStyle = '#ffffff';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(x2, y2);
          c.stroke();
        }
        // Inner white disc for extra punch — fades faster than the rays.
        const discAlpha = Math.max(0, 1 - t * 1.8);
        if (discAlpha > 0) {
          c.globalAlpha = alpha * discAlpha;
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(0, 0, 4, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      } else {
        // Fleck — small rotating square that fades in the final 30% of life.
        const alpha = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3);
        c.save();
        c.globalAlpha = alpha;
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        c.restore();
      }
    }
  },

  _updateFloatingPuff(puff: Obstacle, tScale: number): void {
    const pLeft = puff.x;
    const pRight = puff.x + puff.w;
    const pBottom = puff.y + puff.h;
    // Supported if any brick's top touches the puff's bottom with x-overlap.
    let supported = false;
    for (const o of this.list) {
      if (o === puff) continue;
      if (o.type !== 'snack') continue;
      if (Math.abs(o.y - pBottom) < 1 && o.x < pRight && o.x + o.w > pLeft) {
        supported = true;
        break;
      }
    }
    if (supported) {
      puff.vy = 0;
      return;
    }
    // No support — fall under gravity. Stays at its spawn x in screen-space.
    puff.vy += C.GRAVITY * tScale;
    puff.y += puff.vy * tScale;
    if (puff.y + puff.h >= C.GROUND_Y) {
      puff.y = C.GROUND_Y - puff.h;
      puff.vy = 0;
      // Landed — becomes a normal puff: collectible and scrolls with the world.
      puff.isFloating = false;
    }
  },

  bonk(brick: Obstacle): void {
    brick.isPowerupBrick = false;
    const puff = new Obstacle('puff', 0);
    puff.x = brick.x + (brick.w - puff.w) / 2;
    puff.y = brick.y - puff.h;
    puff.isFloating = true;
    this.list.push(puff);
  },

  checkBonk(bunny: Bunny, prevY: number): void {
    if (bunny.vy >= 0) return;
    const bL = bunny.x + 5;
    const bR = bunny.x + C.BUNNY_W - 5;
    const scale = bunny.isGrown ? 2 : 1;
    const distFromFeetToTop = (C.BUNNY_H - 4) * scale;
    const prevTop = prevY + C.BUNNY_H - distFromFeetToTop;
    const newTop = bunny.y + C.BUNNY_H - distFromFeetToTop;
    for (const o of this.list) {
      if (o.type !== 'snack' || !o.isPowerupBrick) continue;
      const brickBottom = o.y + o.h;
      if (prevTop > brickBottom && newTop <= brickBottom &&
          bR > o.x && bL < o.x + o.w) {
        this.bonk(o);
        break;
      }
    }
  },

  checkCollision(b: Bounds, bunny: Bunny): boolean {
    if (bunny.invulnerableFrames > 0) return false;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      // Snacks are platforms — pass-through, no kill collision.
      if (o.type === 'snack') continue;
      let ob = o.getBounds();
      // Squat-under-archway exemption only applies when ungrown; a grown
      // bunny is too tall to fit under the lintel even when squatting.
      if (o.type === 'house' && o.isMultiStory && bunny && bunny.isSquat && !bunny.isGrown) {
        const m = 4;
        ob = { x: o.x + m, y: o.y + m, w: o.w - m * 2, h: o.h - o.garageH - m };
      }
      const hit = b.x < ob.x + ob.w && b.x + b.w > ob.x &&
                  b.y < ob.y + ob.h && b.y + b.h > ob.y;
      if (!hit) continue;
      if (o.type === 'puff') {
        // Power-up: grow the bunny and consume the puff.
        bunny.grow();
        if (game.species === 'panda') bunny.refillKickCharge();
        this.list.splice(i, 1);
        continue;
      }
      // Any other kill obstacle (house, pint).
      if (bunny.isGrown) {
        bunny.ungrow();
        return false;
      }
      return true;
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
