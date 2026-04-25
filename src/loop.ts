import { C } from './config';
import { game } from './state';
import { bg } from './background';
import { bunny } from './bunny';
import { obstacles } from './obstacle';
import { score } from './score';
import { gameOver } from './control';

export function startLoop(ctx: CanvasRenderingContext2D): void {
  let lastTs = 0;

  function loop(ts: number): void {
    requestAnimationFrame(loop);
    const dt = ts - lastTs;
    lastTs = ts;
    if (dt > 100) return; // tab was backgrounded

    // Frame-time multiplier: makes physics wall-clock correct regardless of render rate.
    // Capped so a GC hitch doesn't tunnel the bunny through an obstacle.
    const tScale = Math.min(dt / (1000 / 60), 3);

    if (game.status === 'playing') {
      game.frameCount++;
      game.speed = Math.min(C.MAX_SPEED, game.speed + C.SPEED_INC * tScale);
      score.increment(tScale);
      bg.update(game.speed, tScale);
      bunny.update(tScale);
      obstacles.update(game.speed, tScale);
      if (obstacles.checkCollision(bunny.getBounds(), bunny)) gameOver();
    } else if (game.status === 'waiting') {
      bg.update(1.5, tScale);
      bunny.update(tScale);
    }
    // game_over and splash: static — nothing updates

    // Render
    ctx.clearRect(0, 0, C.W, C.H);
    bg.draw(ctx);
    obstacles.drawBack(ctx);
    bunny.draw(ctx);
    obstacles.drawFront(ctx);
    score.draw(ctx);
  }

  requestAnimationFrame(loop);
}
