import { C, SPECIES_PHYSICS } from './config';
import { game } from './state';
import { playJumpSound, playPowerupSound, playPandaKick } from './audio';
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
  isKicking = false;
  kickTimer = 0;
  kickCooldownTimer = 0;
  kickUsedThisJump = false;
  kickStartX = 0;
  // Anime-style 功夫 flash. Counted in frames; outlives the kick itself so the
  // characters linger on screen for dramatic effect.
  kickFlashTimer = 0;
  kickFlashDuration = 0;

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
    this.isKicking = false;
    this.kickTimer = 0;
    this.kickCooldownTimer = 0;
    this.kickUsedThisJump = false;
    this.kickStartX = 0;
    this.kickFlashTimer = 0;
    this.kickFlashDuration = 0;
  }

  kick(): void {
    // Panda-only flying kick. Works from ground OR mid-air. Limited by a real
    // cooldown so it can't be spammed.
    if (game.species !== 'panda') return;
    if (this.isKicking) return;
    if (this.kickCooldownTimer > 0) return;
    if (this.kickUsedThisJump) return;
    this.isKicking = true;
    this.kickTimer = C.PANDA_KICK_DURATION_FRAMES;
    this.kickUsedThisJump = true;
    this.kickStartX = this.x;
    // Small upward kick adds a "hang" visual. When launched from the ground,
    // also lift off so the vy actually applies.
    this.vy = -1.5;
    if (this.onGround) {
      this.onGround = false;
      this.standingOn = null;
    }
    // 功夫 flash stays visible for the full kick + cooldown window, then fades
    // out just as the kick becomes available again.
    this.kickFlashDuration = C.PANDA_KICK_DURATION_FRAMES + C.PANDA_KICK_COOLDOWN_FRAMES;
    this.kickFlashTimer = this.kickFlashDuration;
    playPandaKick();
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
    // Panda's mid-air kick budget refills with each new jump.
    this.kickUsedThisJump = false;
    playJumpSound();
  }

  releaseJump(): void {
    const cutoff = SPECIES_PHYSICS[game.species].jumpCutoffVel;
    if (!this.onGround && this.vy < cutoff) {
      this.vy = cutoff;
    }
  }

  squat(): void {
    // Panda has no squat — its low-profile move is the flying kick.
    if (game.species === 'panda') return;
    if (this.onGround) this.isSquat = true;
  }

  releaseSquat(): void {
    this.isSquat = false;
  }

  update(tScale: number, platforms: readonly Obstacle[] = []): void {
    // Panda flying kick: lunges forward and dampens gravity for the kick frames.
    if (this.isKicking) {
      this.x += (C.PANDA_KICK_LUNGE_DX / C.PANDA_KICK_DURATION_FRAMES) * tScale;
      this.kickTimer -= tScale;
      if (this.kickTimer <= 0) {
        this.kickTimer = 0;
        this.isKicking = false;
        // Start the cooldown — kick can't be re-triggered until it expires.
        this.kickCooldownTimer = C.PANDA_KICK_COOLDOWN_FRAMES;
        // Drop out of the kick — small downward push so the panda visibly falls.
        this.vy = Math.max(this.vy, 3);
      }
    } else if (this.x > 110) {
      // Spring-back to the home x so chained kicks can't drive the panda off the right edge.
      const pull = (this.x - 110) * C.PANDA_RECENTER_RATE * tScale;
      this.x = Math.max(110, this.x - pull);
    }
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
      if (this.isKicking) {
        // Dampen gravity during the kick so the panda "hangs" mid-air briefly.
        this.vy += C.GRAVITY * 0.25 * tScale;
      } else if (this.isGliding()) {
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
            this.kickUsedThisJump = false;
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
        this.kickUsedThisJump = false;
        // If we somehow land mid-kick (lunge dropped us onto the floor), cancel it.
        this.isKicking = false;
        this.kickTimer = 0;
      }
    }
    if (this.earFlapTimer > 0) {
      this.earFlapTimer = Math.max(0, this.earFlapTimer - tScale);
    }
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames = Math.max(0, this.invulnerableFrames - tScale);
    }
    if (this.kickCooldownTimer > 0) {
      this.kickCooldownTimer = Math.max(0, this.kickCooldownTimer - tScale);
    }
    if (this.kickFlashTimer > 0) {
      this.kickFlashTimer = Math.max(0, this.kickFlashTimer - tScale);
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
    if (this.isKicking) {
      // Mid-air kick hitbox: extends forward (kick leg) and down to ground level
      // so a kick above an obstacle still smashes it.
      const scale = this.isGrown ? 2 : 1;
      const cx = this.x + C.BUNNY_W / 2;
      const left = cx - (C.BUNNY_W / 2) * scale;
      const right = cx + (C.BUNNY_W / 2 + C.PANDA_KICK_REACH) * scale;
      const top = this.y + 4 * scale;
      const bottom = C.GROUND_Y;
      return { x: left, y: top, w: right - left, h: bottom - top };
    }
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
      isKicking: this.isKicking,
    };
    drawCharacter(c, drawState, game.species, true, true);
  }

  // Anime-style 功夫 (gōngfū) flash. Stays on screen for the full kick + cooldown
  // window, then fades out just as the kick becomes available again — so the
  // characters visually represent the cooldown state.
  drawKickFlash(c: CanvasRenderingContext2D): void {
    if (this.kickFlashTimer <= 0 || this.kickFlashDuration <= 0) return;
    // t = 0 at trigger, 1 right before disappearing
    const t = 1 - this.kickFlashTimer / this.kickFlashDuration;

    // Map the dramatic pop-in onto the kick frames (~19% of total when
    // duration = 14 + 60 = 74), then hold for the cooldown, and fade out in the
    // last ~8% (~6 frames ≈ 100 ms) so the disappearance reads as "ready again".
    const kickFrac = C.PANDA_KICK_DURATION_FRAMES / this.kickFlashDuration;
    const popEnd = kickFrac * 0.55;       // pop in
    const settleEnd = kickFrac * 0.95;    // settle
    const fadeStart = 1 - 0.08;           // last ~6 frames

    let scale: number;
    let alpha: number;
    if (t < popEnd) {
      const p = t / popEnd;
      scale = p * 1.25;
      alpha = p;
    } else if (t < settleEnd) {
      const p = (t - popEnd) / (settleEnd - popEnd);
      scale = 1.25 - p * 0.25;
      alpha = 1;
    } else if (t < fadeStart) {
      scale = 1;
      alpha = 1;
    } else {
      const p = (t - fadeStart) / (1 - fadeStart);
      scale = 1 + p * 0.15;
      alpha = 1 - p;
    }

    const cx = 605; // upper-right of canvas, clear of the score readout
    const cy = 110;
    const charSize = 56;
    const ROT = 17 * Math.PI / 180;

    c.save();
    c.globalAlpha = alpha;
    c.translate(cx, cy);
    c.rotate(ROT);
    c.scale(scale, scale);

    // Red chop-stamp rectangle behind the characters
    c.fillStyle = 'rgba(192,40,42,0.92)';
    c.fillRect(-44, -64, 88, 128);
    // Thin darker red border
    c.strokeStyle = 'rgba(120,20,20,0.95)';
    c.lineWidth = 2;
    c.strokeRect(-44, -64, 88, 128);

    // Black calligraphy characters on top — 功 (top) and 夫 (bottom)
    c.fillStyle = '#0a0a0a';
    c.font = `bold ${charSize}px "STSong", "Songti SC", "SimSun", "Noto Serif CJK SC", serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('功', 0, -28);
    c.fillText('夫', 0, 32);

    c.restore();
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
  isKicking: boolean;
}

export function drawCharacter(
  c: CanvasRenderingContext2D,
  s: DrawableState,
  species: 'bunny' | 'kitten' | 'puppy' | 'panda',
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
  } else if (species === 'panda') {
    drawPandaBody(c, s, withShadow, withHat);
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

function drawPandaBody(
  c: CanvasRenderingContext2D,
  s: DrawableState,
  withShadow: boolean,
  withHat: boolean,
): void {
  const bx = s.x;
  const by = s.y;
  const hop = s.hopFrame;

  const WHITE = '#f5f5f0';
  const WHITE_SHADE = '#e0ddd2';
  const BLACK = '#1a1a1a';
  const BLACK_SOFT = '#2a2a2a';
  const SASH = '#c0282a';
  const SASH_DARK = '#8a1c1e';

  if (withShadow) {
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.beginPath();
    const shadowW = s.isKicking ? 18 : 14;
    c.ellipse(bx + C.BUNNY_W / 2, C.GROUND_Y + 2, shadowW, 4, 0, 0, Math.PI * 2);
    c.fill();
  }

  if (s.isKicking) {
    // Flying kick: body tilted ~10° forward, one leg extended forward (right),
    // arms tucked, motion streaks behind, chi spark at the foot.
    const bodyCx = bx + C.BUNNY_W / 2;
    const bodyCy = by + C.BUNNY_H - 14;

    // Motion streaks behind (to the left of the panda)
    c.strokeStyle = 'rgba(120,110,100,0.45)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const sy = bodyCy - 6 + i * 5;
      c.beginPath();
      c.moveTo(bx - 4 - i * 4, sy);
      c.lineTo(bx - 14 - i * 6, sy + 0.5);
      c.stroke();
    }
    c.lineWidth = 1;

    c.save();
    c.translate(bodyCx, bodyCy);
    c.rotate(0.18); // ~10° forward tilt

    // Tucked back leg (small black oval behind)
    c.fillStyle = BLACK;
    c.beginPath();
    c.ellipse(-4, 6, 5, 4, 0.4, 0, Math.PI * 2);
    c.fill();

    // Body — white round
    c.fillStyle = WHITE;
    c.beginPath();
    c.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
    c.fill();

    // Belly highlight
    c.fillStyle = WHITE_SHADE;
    c.beginPath();
    c.ellipse(1, 4, 6, 8, 0.1, 0, Math.PI * 2);
    c.fill();

    // Tucked arms (small black ovals near shoulders)
    c.fillStyle = BLACK;
    c.beginPath();
    c.ellipse(-7, -2, 3, 5, -0.4, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(7, -2, 3, 5, 0.4, 0, Math.PI * 2);
    c.fill();

    // Red kung-fu sash diagonal
    c.fillStyle = SASH;
    c.fillRect(-13, -2, 26, 4);
    c.fillStyle = SASH_DARK;
    c.fillRect(-13, 1.5, 26, 0.7);

    // Extended kick leg — straight out to the right
    c.fillStyle = BLACK;
    c.beginPath();
    c.ellipse(18, 2, 12, 4, 0, 0, Math.PI * 2);
    c.fill();
    // Foot at the tip
    c.fillStyle = BLACK_SOFT;
    c.beginPath();
    c.ellipse(29, 2, 4, 3, 0, 0, Math.PI * 2);
    c.fill();

    // Head — white circle
    c.fillStyle = WHITE;
    c.beginPath();
    c.arc(2, -16, 10, 0, Math.PI * 2);
    c.fill();
    // Ears
    c.fillStyle = BLACK;
    c.beginPath();
    c.arc(-5, -23, 3.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(9, -23, 3.5, 0, Math.PI * 2);
    c.fill();
    // Eye patches
    c.fillStyle = BLACK_SOFT;
    c.beginPath();
    c.ellipse(-2, -17, 3, 3.5, -0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(6, -17, 3, 3.5, 0.3, 0, Math.PI * 2);
    c.fill();
    // Pupils — looking forward (toward the kick)
    c.fillStyle = 'white';
    c.beginPath();
    c.arc(-1, -17, 1.1, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(7, -17, 1.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = BLACK;
    c.beginPath();
    c.arc(0, -17, 0.6, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(8, -17, 0.6, 0, Math.PI * 2);
    c.fill();
    // Nose
    c.fillStyle = BLACK;
    c.beginPath();
    c.ellipse(3, -12, 1.6, 1.3, 0, 0, Math.PI * 2);
    c.fill();
    // Open-mouth yell — small white "O"
    c.fillStyle = '#3a1a1a';
    c.beginPath();
    c.ellipse(4, -9, 1.6, 1.4, 0, 0, Math.PI * 2);
    c.fill();

    c.restore();

    // Chi spark at the kick foot — bright starburst
    const sparkX = bx + C.BUNNY_W / 2 + 30;
    const sparkY = bodyCy + 5;
    c.fillStyle = 'rgba(255,255,200,0.85)';
    c.beginPath();
    c.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,240,150,0.9)';
    c.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + 0.4;
      c.beginPath();
      c.moveTo(sparkX + Math.cos(a) * 1.5, sparkY + Math.sin(a) * 1.5);
      c.lineTo(sparkX + Math.cos(a) * 6, sparkY + Math.sin(a) * 6);
      c.stroke();
    }
    c.lineWidth = 1;
    return;
  }

  // Standing panda

  // Small white tail nub
  c.fillStyle = WHITE;
  c.beginPath();
  c.arc(bx + 5, by + C.BUNNY_H - 14, 3, 0, Math.PI * 2);
  c.fill();

  // Back legs (black) — hop animation
  const legOffset = s.onGround ? [0, 3, 0, -3][hop] : 0;
  c.fillStyle = BLACK;
  c.beginPath();
  c.ellipse(bx + 9, by + C.BUNNY_H - 4 + legOffset, 6.5, 5, s.onGround ? 0.2 : -0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + 22, by + C.BUNNY_H - 4 - legOffset, 6, 4.5, -0.2, 0, Math.PI * 2);
  c.fill();

  // Body (white round)
  c.fillStyle = WHITE;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2, by + C.BUNNY_H - 14, 14, 16, 0, 0, Math.PI * 2);
  c.fill();

  // Belly highlight
  c.fillStyle = WHITE_SHADE;
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W / 2 + 1, by + C.BUNNY_H - 10, 6, 8, 0.1, 0, Math.PI * 2);
  c.fill();

  // Black "arms" — short black ovals at shoulders
  c.fillStyle = BLACK;
  c.beginPath();
  c.ellipse(bx + 6, by + C.BUNNY_H - 16, 4, 7, -0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(bx + C.BUNNY_W - 6, by + C.BUNNY_H - 16, 4, 7, 0.2, 0, Math.PI * 2);
  c.fill();

  // Red kung-fu sash — diagonal across chest
  c.save();
  c.translate(bx + C.BUNNY_W / 2, by + C.BUNNY_H - 14);
  c.rotate(-0.35);
  c.fillStyle = SASH;
  c.fillRect(-14, -2, 28, 4);
  c.fillStyle = SASH_DARK;
  c.fillRect(-14, 1.5, 28, 0.7);
  c.fillStyle = SASH;
  c.beginPath();
  c.arc(11, 0, 2.5, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Head — white circle
  const headCx = bx + C.BUNNY_W / 2 + 1;
  const headCy = by + 22;
  c.fillStyle = WHITE;
  c.beginPath();
  c.arc(headCx, headCy, 12.5, 0, Math.PI * 2);
  c.fill();

  // Black ears on top
  c.fillStyle = BLACK;
  c.beginPath();
  c.arc(headCx - 9, headCy - 9, 4.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(headCx + 9, headCy - 9, 4.5, 0, Math.PI * 2);
  c.fill();

  if (withHat) {
    const showHat = (PIRATE_QUERY || score.current >= PIRATE_SCORE_THRESHOLD);
    if (showHat && pirateHatImg.complete) {
      const hatW = 44;
      const hatH = 30;
      const hatCx = bx + C.BUNNY_W / 2 + 1;
      const hatCy = by - 6;
      c.drawImage(pirateHatImg, hatCx - hatW / 2, hatCy - hatH / 2, hatW, hatH);
    }
  }

  // Eye patches — signature panda look
  c.fillStyle = BLACK_SOFT;
  c.beginPath();
  c.ellipse(headCx - 5, headCy - 1, 3.5, 4.5, -0.3, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(headCx + 5, headCy - 1, 3.5, 4.5, 0.3, 0, Math.PI * 2);
  c.fill();

  // Eyes (white dot inside each patch + pupil)
  c.fillStyle = 'white';
  c.beginPath();
  c.arc(headCx - 5, headCy - 1, 1.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(headCx + 5, headCy - 1, 1.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BLACK;
  c.beginPath();
  c.arc(headCx - 5, headCy - 1, 0.7, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(headCx + 5, headCy - 1, 0.7, 0, Math.PI * 2);
  c.fill();

  // Nose
  c.fillStyle = BLACK;
  c.beginPath();
  c.ellipse(headCx, headCy + 4, 2, 1.6, 0, 0, Math.PI * 2);
  c.fill();

  // Mouth
  c.strokeStyle = BLACK_SOFT;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(headCx, headCy + 5.5);
  c.lineTo(headCx, headCy + 7);
  c.stroke();
  c.beginPath();
  c.moveTo(headCx, headCy + 7);
  c.quadraticCurveTo(headCx - 2, headCy + 8.5, headCx - 3, headCy + 7.5);
  c.stroke();
  c.beginPath();
  c.moveTo(headCx, headCy + 7);
  c.quadraticCurveTo(headCx + 2, headCy + 8.5, headCx + 3, headCy + 7.5);
  c.stroke();
}

export function drawIdlePreview(
  c: CanvasRenderingContext2D,
  species: 'bunny' | 'kitten' | 'puppy' | 'panda',
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
    isKicking: false,
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
  } else if (species === 'panda') {
    drawPandaBody(c, idle, false, false);
  } else {
    drawBunnyBody(c, idle, false, false);
  }
  c.restore();
}
