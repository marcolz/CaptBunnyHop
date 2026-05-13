import { C, SPECIES_PHYSICS } from './config';
import { game } from './state';
import { playJumpSound, playPowerupSound } from './audio';
import { score } from './score';
import type { Obstacle } from './obstacle';
import pirateHatUrl from './assets/pirate-hat.webp';

const PIRATE_QUERY = new URLSearchParams(location.search).get('pirate') === '1';
const PIRATE_SCORE_THRESHOLD = 5000;

const pirateHatImg = new Image();
pirateHatImg.src = pirateHatUrl;

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Bunny {
  x = 110;
  y = C.GROUND_Y - C.BUNNY_H;
  vy = 0;
  onGround = true;
  jumpsRemaining: number = SPECIES_PHYSICS.bunny.maxJumps;
  hopFrame = 0;
  hopTimer = 0;
  squish = 1;
  squishTimer = 0;
  isSquat = false;
  earFlapTimer = 0;
  earFlapDuration = 0;
  earFlapStrength = 0;
  earSpinAngle = 0;
  glideHeld = false;
  standingOn: Obstacle | null = null;
  isGrown = false;
  invulnerableFrames = 0;

  reset(): void {
    this.x = 110;
    this.y = C.GROUND_Y - C.BUNNY_H;
    this.vy = 0;
    this.onGround = true;
    this.jumpsRemaining = SPECIES_PHYSICS[game.species].maxJumps;
    this.hopFrame = 0;
    this.hopTimer = 0;
    this.squish = 1;
    this.squishTimer = 0;
    this.isSquat = false;
    this.earFlapTimer = 0;
    this.earFlapDuration = 0;
    this.earFlapStrength = 0;
    this.earSpinAngle = 0;
    this.glideHeld = false;
    this.standingOn = null;
    this.isGrown = false;
    this.invulnerableFrames = 0;
  }

  grow(): void {
    this.isGrown = true;
    playPowerupSound();
  }

  ungrow(): void {
    this.isGrown = false;
    this.invulnerableFrames = 45;
  }

  setGlideHeld(v: boolean): void {
    // Letting go of glide mid-air gives a small downward kick so the puppy
    // drops a little more quickly than a passive return to normal gravity.
    if (!v && this.glideHeld && this.isGliding()) {
      this.vy = Math.max(this.vy, 3);
    }
    this.glideHeld = v;
  }

  isGliding(): boolean {
    return game.species === 'puppy' && this.glideHeld && !this.onGround && this.vy > 0;
  }

  jump(): void {
    if (this.jumpsRemaining <= 0) return;
    const phys = SPECIES_PHYSICS[game.species];
    const isFinalJump = this.jumpsRemaining === 1;
    this.vy = phys.jumpVel;
    this.onGround = false;
    this.standingOn = null;
    this.jumpsRemaining--;
    this.squish = 0.7;
    this.squishTimer = 8;
    this.earFlapStrength = isFinalJump ? 1.15 : 0.7;
    this.earFlapDuration = isFinalJump ? 14 : 9;
    this.earFlapTimer = this.earFlapDuration;
    playJumpSound();
  }

  releaseJump(): void {
    const cutoff = SPECIES_PHYSICS[game.species].jumpCutoffVel;
    if (!this.onGround && this.vy < cutoff) {
      this.vy = cutoff;
    }
  }

  squat(): void {
    if (this.onGround) this.isSquat = true;
  }

  releaseSquat(): void {
    this.isSquat = false;
  }

  update(tScale: number, platforms: readonly Obstacle[] = []): void {
    // Riding a platform: stay glued to its top; fall off when it passes under us.
    if (this.standingOn) {
      const p = this.standingOn;
      const bL = this.x + 5;
      const bR = this.x + C.BUNNY_W - 5;
      if (bR < p.x || bL > p.x + p.w) {
        this.standingOn = null;
        this.onGround = false;
      } else {
        this.y = p.y - C.BUNNY_H;
      }
    }

    if (!this.onGround) {
      const prevBottom = this.y + C.BUNNY_H;
      if (this.isGliding()) {
        this.vy += C.GRAVITY * C.GLIDE_GRAVITY_MULT * tScale;
        if (this.vy > C.GLIDE_MAX_VY) this.vy = C.GLIDE_MAX_VY;
      } else {
        this.vy += C.GRAVITY * tScale;
      }
      this.y += this.vy * tScale;
      const newBottom = this.y + C.BUNNY_H;

      // Land on a snack platform when falling through its top from above.
      if (this.vy >= 0) {
        const bL = this.x + 5;
        const bR = this.x + C.BUNNY_W - 5;
        for (const p of platforms) {
          if (p.type !== 'snack') continue;
          if (prevBottom <= p.y && newBottom >= p.y &&
              bR > p.x && bL < p.x + p.w) {
            this.y = p.y - C.BUNNY_H;
            this.vy = 0;
            this.onGround = true;
            this.standingOn = p;
            this.jumpsRemaining = SPECIES_PHYSICS[game.species].maxJumps;
            this.squish = 1.35;
            this.squishTimer = 8;
            this.earSpinAngle = 0;
            break;
          }
        }
      }

      if (!this.onGround && this.y >= C.GROUND_Y - C.BUNNY_H) {
        this.y = C.GROUND_Y - C.BUNNY_H;
        this.vy = 0;
        this.onGround = true;
        this.jumpsRemaining = SPECIES_PHYSICS[game.species].maxJumps;
        this.squish = 1.35;
        this.squishTimer = 8;
        this.earSpinAngle = 0;
      }
    }
    if (this.earFlapTimer > 0) {
      this.earFlapTimer = Math.max(0, this.earFlapTimer - tScale);
    }
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames = Math.max(0, this.invulnerableFrames - tScale);
    }
    if (!this.onGround && this.vy > 1.5) {
      const spinSpeed = 0.35 + Math.min(this.vy, 14) * 0.1;
      this.earSpinAngle = (this.earSpinAngle + spinSpeed * tScale) % (Math.PI * 2);
    }
    if (this.squishTimer > 0) {
      this.squishTimer -= tScale;
      const ease = 1 - Math.pow(1 - 0.35, tScale);
      this.squish += (1 - this.squish) * ease;
    } else {
      this.squish = 1;
    }
    if (this.onGround && game.status === 'playing') {
      this.hopTimer += tScale;
      if (this.hopTimer >= 8) {
        this.hopTimer = 0;
        this.hopFrame = (this.hopFrame + 1) % 4;
      }
    }
  }

  getBounds(): Bounds {
    const scale = this.isGrown ? 2 : 1;
    const baseH = this.isSquat ? 16 : C.BUNNY_H - 6;
    const baseYOff = this.isSquat ? (C.BUNNY_H - 6 - baseH) : 4;
    // Scale around the feet so the bottom of the bounds stays put.
    const distFromFeetToTop = (C.BUNNY_H - baseYOff) * scale;
    const h = baseH * scale;
    const w = (C.BUNNY_W - 10) * scale;
    const cx = this.x + C.BUNNY_W / 2;
    return {
      x: cx - w / 2,
      y: this.y + C.BUNNY_H - distFromFeetToTop,
      w,
      h,
    };
  }

  draw(c: CanvasRenderingContext2D): void {
    // Blink during invulnerability so the recovery window reads clearly.
    if (this.invulnerableFrames > 0 && Math.floor(this.invulnerableFrames / 4) % 2 === 0) {
      return;
    }
    const drawState: DrawableState = {
      x: this.x,
      y: this.y,
      vy: this.vy,
      onGround: this.onGround,
      isSquat: this.isSquat,
      squish: this.squish,
      hopFrame: this.hopFrame,
      earFlapTimer: this.earFlapTimer,
      earFlapDuration: this.earFlapDuration,
      earFlapStrength: this.earFlapStrength,
      earSpinAngle: this.earSpinAngle,
      isGliding: this.isGliding(),
      isGrown: this.isGrown,
    };
    drawCharacter(c, drawState, game.species, true, true);
  }
}

export const bunny = new Bunny();

interface DrawableState {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  isSquat: boolean;
  squish: number;
  hopFrame: number;
  earFlapTimer: number;
  earFlapDuration: number;
  earFlapStrength: number;
  earSpinAngle: number;
  isGliding: boolean;
  isGrown: boolean;
}

export function drawCharacter(
  c: CanvasRenderingContext2D,
  s: DrawableState,
  species: 'bunny' | 'kitten' | 'puppy',
  withShadow: boolean,
  withHat: boolean,
): void {
  c.save();
  const cx = s.x + C.BUNNY_W / 2;
  const cy = s.y + C.BUNNY_H;
  c.translate(cx, cy);
  const sizeScale = s.isGrown ? 2 : 1;
  const yScale = (s.isSquat ? s.squish * 0.55 : s.squish) * sizeScale;
  c.scale(sizeScale, yScale);
  c.translate(-cx, -cy);

  if (species === 'kitten') {
    drawKittenBody(c, s, withShadow, withHat);
  } else if (species === 'puppy') {
    drawPuppyBody(c, s, withShadow, withHat);
  } else {
    drawBunnyBody(c, s, withShadow, withHat);
  }

  c.restore();
}

function drawBunnyBody(
  c: CanvasRenderingContext2D,
  s: DrawableState,
  withShadow: boolean,
  withHat: boolean,
): void {
  const bx = s.x;
  const by = s.y;
  const hop = s.hopFrame;

  if (withShadow) {
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath();
    c.ellipse(bx + C.BUNNY_W / 2, C.GROUND_Y + 2, 14, 4, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Tail
  c.fillStyle = '#f0f0f0';
  c.beginPath();
  c.arc(bx + 4, by + C.BUNNY_H - 10, 6, 0, Math.PI * 2);
  c.fill();

  // Body
  c.fillStyle = '#f5f0e8';
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2, by + C.BUNNY_H - 14, 14, 16, 0, 0, Math.PI * 2);
  c.fill();

  // Belly
  c.fillStyle = '#ffe8e0';
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2 + 2, by + C.BUNNY_H - 12, 8, 10, 0.1, 0, Math.PI * 2);
  c.fill();

  // Ears
  const earWobble = s.onGround ? Math.sin(hop * Math.PI / 2) * 2 : -3;
  let earFlap = 0;
  if (s.earFlapDuration > 0 && s.earFlapTimer > 0) {
    const p = 1 - s.earFlapTimer / s.earFlapDuration;
    const downstroke = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65);
    earFlap = downstroke * s.earFlapStrength;
  }

  const drawEar = (x: number, y: number, angle: number): void => {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = '#f5f0e8';
    c.beginPath();
    c.ellipse(0, 0, 5, 14, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f0a0b0';
    c.beginPath();
    c.ellipse(0, 1, 2.5, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  if (!s.onGround && s.vy > 1.5) {
    const rotor = s.earSpinAngle;
    const hubX = bx + C.BUNNY_W / 2 + 2;
    const hubY = by + 10 + earWobble - Math.min(4, s.vy * 0.25);
    const arm = 8;
    const xOff = Math.cos(rotor) * arm;
    const yOff = Math.sin(rotor) * 2.4;
    drawEar(hubX + xOff, hubY + yOff, rotor);
    drawEar(hubX - xOff, hubY - yOff, rotor + Math.PI);
  } else {
    const earY = by + 10 + earWobble + earFlap * 2.5;
    drawEar(bx + 10, earY, -0.15 + earFlap * 1.25);
    drawEar(bx + 22, earY, 0.15 - earFlap * 1.25);
  }

  // Head
  c.fillStyle = '#f5f0e8';
  c.beginPath();
  c.arc(bx + C.BUNNY_W / 2 + 2, by + 24, 12, 0, Math.PI * 2);
  c.fill();

  if (withHat) {
    const showHat = (PIRATE_QUERY || score.current >= PIRATE_SCORE_THRESHOLD);
    if (showHat && pirateHatImg.complete) {
      const hatW = 44;
      const hatH = 30;
      const hatCx = bx + C.BUNNY_W / 2 + 2;
      const hatCy = by - 6;
      c.drawImage(pirateHatImg, hatCx - hatW / 2, hatCy - hatH / 2, hatW, hatH);
    }
  }

  // Eyes
  c.fillStyle = '#2a1a1a';
  c.beginPath();
  c.arc(bx + 12, by + 22, 2.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(bx + 22, by + 22, 2.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'white';
  c.beginPath();
  c.arc(bx + 13, by + 21, 0.8, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(bx + 23, by + 21, 0.8, 0, Math.PI * 2);
  c.fill();

  // Nose
  c.fillStyle = '#f0a0b0';
  c.beginPath();
  c.ellipse(bx + 17, by + 26, 2.5, 1.8, 0, 0, Math.PI * 2);
  c.fill();

  // Mouth
  c.strokeStyle = '#c07080';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(bx + 17, by + 27.5);
  c.quadraticCurveTo(bx + 14, by + 30, bx + 13, by + 29);
  c.stroke();
  c.beginPath();
  c.moveTo(bx + 17, by + 27.5);
  c.quadraticCurveTo(bx + 20, by + 30, bx + 21, by + 29);
  c.stroke();

  // Legs — hop animation
  const legOffset = s.onGround ? [0, 4, 0, -4][hop] : 0;
  c.fillStyle = '#f5f0e8';
  c.beginPath();
  c.ellipse(bx + 8, by + C.BUNNY_H - 4 + legOffset, 7, 5, s.onGround ? 0.3 : -0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 22, by + C.BUNNY_H - 4 - legOffset, 6, 4.5, -0.3, 0, Math.PI * 2);
  c.fill();
}

function drawKittenBody(
  c: CanvasRenderingContext2D,
  s: DrawableState,
  withShadow: boolean,
  withHat: boolean,
): void {
  const bx = s.x;
  const by = s.y;
  const hop = s.hopFrame;

  const FUR = '#e8a868';
  const FUR_DARK = '#c88848';
  const BELLY = '#fff0e0';
  const EAR_INNER = '#f0a0b0';

  if (withShadow) {
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath();
    c.ellipse(bx + C.BUNNY_W / 2, C.GROUND_Y + 2, 14, 4, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Tail — animations mirror bunny ear logic:
  //  • jump / double-jump  → flick envelope (tailFlap from earFlap state)
  //  • falling fast         → helicopter spin (earSpinAngle)
  //  • landing              → spin resets, idle swish resumes
  let tailFlap = 0;
  if (s.earFlapDuration > 0 && s.earFlapTimer > 0) {
    const p = 1 - s.earFlapTimer / s.earFlapDuration;
    const downstroke = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65);
    tailFlap = downstroke * s.earFlapStrength;
  }
  const baseX = bx + 4;
  const baseY = by + C.BUNNY_H - 8;
  c.strokeStyle = FUR;
  c.lineWidth = 5;
  c.lineCap = 'round';

  if (!s.onGround && s.vy > 1.5) {
    // Helicopter: tail whirls behind/over the body in a circle
    const rotor = s.earSpinAngle;
    const arm = 14;
    const tipX = baseX - 2 + Math.cos(rotor + Math.PI / 2) * arm;
    const tipY = baseY - 10 + Math.sin(rotor + Math.PI / 2) * arm * 0.6;
    const ctrlX = baseX - 4 + Math.cos(rotor) * 6;
    const ctrlY = baseY - 6 + Math.sin(rotor) * 6;
    c.beginPath();
    c.moveTo(baseX, baseY);
    c.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    c.stroke();
  } else {
    // Idle hop swish + flick on jump
    const idleSwish = s.onGround ? Math.sin(hop * Math.PI / 2) * 3 : -4;
    // Flick: pulls the tail upward and forward, then settles back.
    const flickY = -tailFlap * 12;
    const flickX = tailFlap * 5;
    c.beginPath();
    c.moveTo(baseX, baseY);
    c.quadraticCurveTo(
      bx - 6 + flickX,
      by + C.BUNNY_H - 18 + idleSwish + flickY * 0.6,
      bx + 2 + flickX * 1.5,
      by + C.BUNNY_H - 26 + idleSwish + flickY,
    );
    c.stroke();
  }
  c.lineWidth = 1;

  // Body
  c.fillStyle = FUR;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2, by + C.BUNNY_H - 14, 14, 16, 0, 0, Math.PI * 2);
  c.fill();

  // Belly
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2 + 2, by + C.BUNNY_H - 12, 8, 10, 0.1, 0, Math.PI * 2);
  c.fill();

  // Stripes
  c.fillStyle = FUR_DARK;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2 - 6, by + C.BUNNY_H - 18, 1.5, 4, 0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2 - 4, by + C.BUNNY_H - 10, 1.5, 4, 0.2, 0, Math.PI * 2);
  c.fill();

  // Ears (triangular)
  const earWobble = s.onGround ? Math.sin(hop * Math.PI / 2) * 1 : -1;
  let earFlap = 0;
  if (s.earFlapDuration > 0 && s.earFlapTimer > 0) {
    const p = 1 - s.earFlapTimer / s.earFlapDuration;
    const downstroke = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65);
    earFlap = downstroke * s.earFlapStrength * 0.4;
  }

  const drawTriEar = (cx0: number, cy0: number, dir: number): void => {
    const tilt = dir * 0.25 + earFlap * dir;
    c.save();
    c.translate(cx0, cy0);
    c.rotate(tilt);
    // outer triangle
    c.fillStyle = FUR;
    c.beginPath();
    c.moveTo(-4.5, 4);
    c.lineTo(4.5, 4);
    c.lineTo(0, -8);
    c.closePath();
    c.fill();
    // inner pink
    c.fillStyle = EAR_INNER;
    c.beginPath();
    c.moveTo(-2.2, 2.5);
    c.lineTo(2.2, 2.5);
    c.lineTo(0, -4);
    c.closePath();
    c.fill();
    c.restore();
  };

  // Head
  const headCx = bx + C.BUNNY_W / 2 + 2;
  const headCy = by + 24;

  // Ears positioned on top of head
  drawTriEar(headCx - 7, headCy - 10 + earWobble, -1);
  drawTriEar(headCx + 7, headCy - 10 + earWobble, 1);

  c.fillStyle = FUR;
  c.beginPath();
  c.arc(headCx, headCy, 12, 0, Math.PI * 2);
  c.fill();

  // Forehead stripe
  c.fillStyle = FUR_DARK;
  c.beginPath();
  c.ellipse(headCx, headCy - 8, 2, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(headCx - 5, headCy - 6, 1.5, 2.5, -0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(headCx + 5, headCy - 6, 1.5, 2.5, 0.4, 0, Math.PI * 2);
  c.fill();

  if (withHat) {
    const showHat = (PIRATE_QUERY || score.current >= PIRATE_SCORE_THRESHOLD);
    if (showHat && pirateHatImg.complete) {
      const hatW = 44;
      const hatH = 30;
      const hatCx = bx + C.BUNNY_W / 2 + 2;
      const hatCy = by - 6;
      c.drawImage(pirateHatImg, hatCx - hatW / 2, hatCy - hatH / 2, hatW, hatH);
    }
  }

  // Eyes — almond cat-shape
  c.fillStyle = '#2a1a1a';
  c.beginPath();
  c.ellipse(bx + 12, by + 22, 2.4, 2.8, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 22, by + 22, 2.4, 2.8, 0, 0, Math.PI * 2);
  c.fill();
  // shine
  c.fillStyle = 'white';
  c.beginPath();
  c.arc(bx + 13, by + 21, 0.8, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(bx + 23, by + 21, 0.8, 0, Math.PI * 2);
  c.fill();

  // Nose (little pink triangle)
  c.fillStyle = '#f0a0b0';
  c.beginPath();
  c.moveTo(bx + 17, by + 26);
  c.lineTo(bx + 15, by + 25);
  c.lineTo(bx + 19, by + 25);
  c.closePath();
  c.fill();

  // Mouth — small "w"
  c.strokeStyle = '#7a4030';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(bx + 17, by + 26.5);
  c.lineTo(bx + 17, by + 28);
  c.stroke();
  c.beginPath();
  c.moveTo(bx + 17, by + 28);
  c.quadraticCurveTo(bx + 14.5, by + 29.5, bx + 13, by + 28.5);
  c.stroke();
  c.beginPath();
  c.moveTo(bx + 17, by + 28);
  c.quadraticCurveTo(bx + 19.5, by + 29.5, bx + 21, by + 28.5);
  c.stroke();

  // Whiskers — three each side
  c.strokeStyle = 'rgba(60,40,30,0.6)';
  c.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    const yo = (i - 1) * 1.6;
    c.beginPath();
    c.moveTo(bx + 14, by + 26 + yo);
    c.lineTo(bx + 6, by + 25 + yo * 1.5);
    c.stroke();
    c.beginPath();
    c.moveTo(bx + 20, by + 26 + yo);
    c.lineTo(bx + 28, by + 25 + yo * 1.5);
    c.stroke();
  }

  // Legs — hop animation
  const legOffset = s.onGround ? [0, 4, 0, -4][hop] : 0;
  c.fillStyle = FUR;
  c.beginPath();
  c.ellipse(bx + 8, by + C.BUNNY_H - 4 + legOffset, 7, 5, s.onGround ? 0.3 : -0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 22, by + C.BUNNY_H - 4 - legOffset, 6, 4.5, -0.3, 0, Math.PI * 2);
  c.fill();
  // Paw tips
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(bx + 9, by + C.BUNNY_H - 2 + legOffset, 2.5, 1.2, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 23, by + C.BUNNY_H - 2 - legOffset, 2.2, 1.1, 0, 0, Math.PI * 2);
  c.fill();
}

function drawPuppyBody(
  c: CanvasRenderingContext2D,
  s: DrawableState,
  withShadow: boolean,
  withHat: boolean,
): void {
  const bx = s.x;
  const by = s.y;
  const hop = s.hopFrame;

  const FUR = '#e8c878';
  const FUR_DARK = '#c8a868';
  const BELLY = '#fff0d8';
  const EAR = '#b88848';
  const EAR_INNER = '#e8b8a0';

  if (withShadow) {
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath();
    // While gliding the shadow widens slightly to read like an in-air parachute.
    const shadowW = s.isGliding ? 18 : 14;
    c.ellipse(bx + C.BUNNY_W / 2, C.GROUND_Y + 2, shadowW, 4, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Tail — curved stroke that swishes via hopFrame; small wag on landing.
  let tailWag = 0;
  if (s.earFlapDuration > 0 && s.earFlapTimer > 0) {
    const p = 1 - s.earFlapTimer / s.earFlapDuration;
    const downstroke = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65);
    tailWag = downstroke * s.earFlapStrength;
  }
  const idleSwish = s.onGround ? Math.sin(hop * Math.PI / 2) * 3 : -2;
  c.strokeStyle = FUR;
  c.lineWidth = 4.5;
  c.lineCap = 'round';
  const tailBaseX = bx + 4;
  const tailBaseY = by + C.BUNNY_H - 12;
  c.beginPath();
  c.moveTo(tailBaseX, tailBaseY);
  c.quadraticCurveTo(
    bx - 6 + tailWag * 4,
    by + C.BUNNY_H - 18 + idleSwish,
    bx - 4 + tailWag * 6,
    by + C.BUNNY_H - 24 + idleSwish - tailWag * 4,
  );
  c.stroke();
  c.lineWidth = 1;

  // Body
  c.fillStyle = FUR;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2, by + C.BUNNY_H - 14, 14, 16, 0, 0, Math.PI * 2);
  c.fill();

  // Belly
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2 + 2, by + C.BUNNY_H - 12, 8, 10, 0.1, 0, Math.PI * 2);
  c.fill();

  // Head (drawn before ears so floppy ears can sit on top of head edge)
  const headCx = bx + C.BUNNY_W / 2 + 2;
  const headCy = by + 24;
  c.fillStyle = FUR;
  c.beginPath();
  c.arc(headCx, headCy, 12, 0, Math.PI * 2);
  c.fill();

  // Floppy ears: long ovals hanging beside the head.
  // - On ground: hang straight down with a small idle wobble.
  // - In air falling fast (not gliding): lifted slightly by airflow.
  // - Gliding: rotate outward, like wings spread, to read as a parachute.
  const earWobble = s.onGround ? Math.sin(hop * Math.PI / 2) * 1.5 : 0;
  let earTilt = 0;        // radians outward from straight-down
  let earLift = 0;        // px shift up at the hinge
  let earLen = 13;        // base ear length
  let earWide = 4.5;      // base ear width
  if (s.isGliding) {
    earTilt = 1.0;        // ~57° outward
    earLift = -2;
    earLen = 15;
    earWide = 5.5;
  } else if (!s.onGround && s.vy > 1.5) {
    earTilt = 0.35;
    earLift = -1;
  }

  const drawFloppyEar = (hingeX: number, hingeY: number, dir: number): void => {
    c.save();
    c.translate(hingeX, hingeY + earLift);
    // Rotate so ear hangs down (Math.PI/2 = pointing down on canvas), then add outward tilt.
    c.rotate(Math.PI / 2 + dir * earTilt + dir * earWobble * 0.05);
    // Outer ear (slightly darker than fur for floppy depth)
    c.fillStyle = EAR;
    c.beginPath();
    c.ellipse(earLen * 0.55, 0, earLen, earWide, 0, 0, Math.PI * 2);
    c.fill();
    // Inner pink (only visible on the inside half)
    c.fillStyle = EAR_INNER;
    c.beginPath();
    c.ellipse(earLen * 0.55, 0, earLen * 0.65, earWide * 0.5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  drawFloppyEar(headCx - 9, headCy - 4, -1);
  drawFloppyEar(headCx + 9, headCy - 4, 1);

  // Forehead splotch (lab patch)
  c.fillStyle = FUR_DARK;
  c.beginPath();
  c.ellipse(headCx - 3, headCy - 6, 3, 2.2, -0.3, 0, Math.PI * 2);
  c.fill();

  // Snout (lighter oval at front of head)
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(headCx, headCy + 4, 6, 4, 0, 0, Math.PI * 2);
  c.fill();

  if (withHat) {
    const showHat = (PIRATE_QUERY || score.current >= PIRATE_SCORE_THRESHOLD);
    if (showHat && pirateHatImg.complete) {
      const hatW = 44;
      const hatH = 30;
      const hatCx = bx + C.BUNNY_W / 2 + 2;
      const hatCy = by - 6;
      c.drawImage(pirateHatImg, hatCx - hatW / 2, hatCy - hatH / 2, hatW, hatH);
    }
  }

  // Eyes — round and friendly
  c.fillStyle = '#2a1a1a';
  c.beginPath();
  c.arc(bx + 12, by + 22, 2.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(bx + 22, by + 22, 2.4, 0, Math.PI * 2);
  c.fill();
  // shine
  c.fillStyle = 'white';
  c.beginPath();
  c.arc(bx + 13, by + 21, 0.9, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(bx + 23, by + 21, 0.9, 0, Math.PI * 2);
  c.fill();

  // Nose — black dot at tip of snout
  c.fillStyle = '#1a1010';
  c.beginPath();
  c.ellipse(headCx, headCy + 2.5, 2, 1.5, 0, 0, Math.PI * 2);
  c.fill();

  // Mouth — small smile under snout
  c.strokeStyle = '#5a3020';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(headCx, headCy + 4);
  c.lineTo(headCx, headCy + 6);
  c.stroke();
  c.beginPath();
  c.moveTo(headCx, headCy + 6);
  c.quadraticCurveTo(headCx - 2.5, headCy + 7.5, headCx - 4, headCy + 6.5);
  c.stroke();
  c.beginPath();
  c.moveTo(headCx, headCy + 6);
  c.quadraticCurveTo(headCx + 2.5, headCy + 7.5, headCx + 4, headCy + 6.5);
  c.stroke();

  // Tongue (only visible if gliding — happy panting puppy!)
  if (s.isGliding) {
    c.fillStyle = '#f08090';
    c.beginPath();
    c.ellipse(headCx, headCy + 7.5, 1.6, 1.2, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Legs — hop animation
  const legOffset = s.onGround ? [0, 4, 0, -4][hop] : 0;
  c.fillStyle = FUR;
  c.beginPath();
  c.ellipse(bx + 8, by + C.BUNNY_H - 4 + legOffset, 7, 5, s.onGround ? 0.3 : -0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 22, by + C.BUNNY_H - 4 - legOffset, 6, 4.5, -0.3, 0, Math.PI * 2);
  c.fill();
  // Paw tips
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(bx + 9, by + C.BUNNY_H - 2 + legOffset, 2.5, 1.2, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 23, by + C.BUNNY_H - 2 - legOffset, 2.2, 1.1, 0, 0, Math.PI * 2);
  c.fill();
}

export function drawIdlePreview(
  c: CanvasRenderingContext2D,
  species: 'bunny' | 'kitten' | 'puppy',
): void {
  // Draw idle character at a fixed position, no shadow, no hat.
  const idle: DrawableState = {
    x: (c.canvas.width - C.BUNNY_W) / 2,
    y: (c.canvas.height - C.BUNNY_H) / 2,
    vy: 0,
    onGround: true,
    isSquat: false,
    squish: 1,
    hopFrame: 0,
    earFlapTimer: 0,
    earFlapDuration: 0,
    earFlapStrength: 0,
    earSpinAngle: 0,
    isGliding: false,
    isGrown: false,
  };
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.save();
  // Override GROUND_Y reference for shadow by skipping it (withShadow=false).
  const cx = idle.x + C.BUNNY_W / 2;
  const cy = idle.y + C.BUNNY_H;
  c.translate(cx, cy);
  c.scale(1, 1);
  c.translate(-cx, -cy);
  if (species === 'kitten') {
    drawKittenBody(c, idle, false, false);
  } else if (species === 'puppy') {
    drawPuppyBody(c, idle, false, false);
  } else {
    drawBunnyBody(c, idle, false, false);
  }
  c.restore();
}
