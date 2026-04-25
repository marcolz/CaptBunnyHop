import { C } from './config';
import { game } from './state';
import { playJumpSound } from './audio';

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
  jumpsRemaining: number = C.MAX_JUMPS;
  hopFrame = 0;
  hopTimer = 0;
  squish = 1;
  squishTimer = 0;
  isSquat = false;
  earFlapTimer = 0;
  earFlapDuration = 0;
  earFlapStrength = 0;
  earSpinAngle = 0;

  reset(): void {
    this.x = 110;
    this.y = C.GROUND_Y - C.BUNNY_H;
    this.vy = 0;
    this.onGround = true;
    this.jumpsRemaining = C.MAX_JUMPS;
    this.hopFrame = 0;
    this.hopTimer = 0;
    this.squish = 1;
    this.squishTimer = 0;
    this.isSquat = false;
    this.earFlapTimer = 0;
    this.earFlapDuration = 0;
    this.earFlapStrength = 0;
    this.earSpinAngle = 0;
  }

  jump(): void {
    if (this.jumpsRemaining <= 0) return;
    const isDoubleJump = this.jumpsRemaining === 1;
    this.vy = C.JUMP_VEL;
    this.onGround = false;
    this.jumpsRemaining--;
    this.squish = 0.7;
    this.squishTimer = 8;
    this.earFlapStrength = isDoubleJump ? 1.15 : 0.7;
    this.earFlapDuration = isDoubleJump ? 14 : 9;
    this.earFlapTimer = this.earFlapDuration;
    playJumpSound();
  }

  releaseJump(): void {
    if (!this.onGround && this.vy < C.JUMP_CUTOFF_VEL) {
      this.vy = C.JUMP_CUTOFF_VEL;
    }
  }

  squat(): void {
    if (this.onGround) this.isSquat = true;
  }

  releaseSquat(): void {
    this.isSquat = false;
  }

  update(tScale: number): void {
    if (!this.onGround) {
      this.vy += C.GRAVITY * tScale;
      this.y += this.vy * tScale;
      if (this.y >= C.GROUND_Y - C.BUNNY_H) {
        this.y = C.GROUND_Y - C.BUNNY_H;
        this.vy = 0;
        this.onGround = true;
        this.jumpsRemaining = C.MAX_JUMPS;
        this.squish = 1.35;
        this.squishTimer = 8;
        this.earSpinAngle = 0;
      }
    }
    if (this.earFlapTimer > 0) {
      this.earFlapTimer = Math.max(0, this.earFlapTimer - tScale);
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
    const h = this.isSquat ? 16 : C.BUNNY_H - 6;
    const yOffset = this.isSquat ? (C.BUNNY_H - 6 - h) : 4;
    return { x: this.x + 5, y: this.y + yOffset, w: C.BUNNY_W - 10, h };
  }

  draw(c: CanvasRenderingContext2D): void {
    c.save();
    const cx = this.x + C.BUNNY_W / 2;
    const cy = this.y + C.BUNNY_H;
    c.translate(cx, cy);
    const yScale = this.isSquat ? this.squish * 0.55 : this.squish;
    c.scale(1, yScale);
    c.translate(-cx, -cy);

    const bx = this.x;
    const by = this.y;
    const hop = this.hopFrame;

    // Shadow
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath();
    c.ellipse(bx + C.BUNNY_W / 2, C.GROUND_Y + 2, 14, 4, 0, 0, Math.PI * 2);
    c.fill();

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
    const earWobble = this.onGround ? Math.sin(hop * Math.PI / 2) * 2 : -3;
    let earFlap = 0;
    if (this.earFlapDuration > 0 && this.earFlapTimer > 0) {
      const p = 1 - this.earFlapTimer / this.earFlapDuration;
      const downstroke = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.65);
      earFlap = downstroke * this.earFlapStrength;
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

    if (!this.onGround && this.vy > 1.5) {
      const rotor = this.earSpinAngle;
      const hubX = bx + C.BUNNY_W / 2 + 2;
      const hubY = by + 10 + earWobble - Math.min(4, this.vy * 0.25);
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

    // Eyes
    c.fillStyle = '#2a1a1a';
    c.beginPath();
    c.arc(bx + 12, by + 22, 2.2, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(bx + 22, by + 22, 2.2, 0, Math.PI * 2);
    c.fill();
    // Eye shine
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
    const legOffset = this.onGround ? [0, 4, 0, -4][hop] : 0;
    c.fillStyle = '#f5f0e8';
    // Back legs
    c.beginPath();
    c.ellipse(bx + 8, by + C.BUNNY_H - 4 + legOffset, 7, 5, this.onGround ? 0.3 : -0.5, 0, Math.PI * 2);
    c.fill();
    // Front legs
    c.beginPath();
    c.ellipse(bx + 22, by + C.BUNNY_H - 4 - legOffset, 6, 4.5, -0.3, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }
}

export const bunny = new Bunny();
