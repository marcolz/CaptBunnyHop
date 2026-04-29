import { game } from './state';
import { bunny } from './bunny';
import { initAudio } from './audio';
import { startGame, goToWelcome } from './control';
import { showOverlay, bunnyNameInput } from './overlay';

function handleInput(): void {
  initAudio();
  if (game.status === 'splash') {
    game.status = 'waiting';
    showOverlay('waiting');
    setTimeout(() => bunnyNameInput.focus(), 0);
  } else if (game.status === 'waiting' || (game.status === 'game_over' && performance.now() - game.gameOverTime >= 2000)) {
    startGame();
  } else if (game.status === 'playing') {
    bunny.jump();
  }
}

function handleRelease(): void {
  if (game.status === 'playing') bunny.releaseJump();
}

const DUCK_ZONE_FRACTION = 2 / 3;
let duckTouchId: number | null = null;

export function bindInput(canvas: HTMLCanvasElement): void {
  bunnyNameInput.addEventListener('input', () => {
    bunnyNameInput.setCustomValidity('');
  });

  const isInDuckZone = (clientY: number): boolean => {
    const rect = canvas.getBoundingClientRect();
    return clientY >= rect.top + rect.height * DUCK_ZONE_FRACTION;
  };

  const releaseDuckIfMatched = (changedTouches: TouchList): boolean => {
    for (const t of Array.from(changedTouches)) {
      if (t.identifier === duckTouchId) {
        duckTouchId = null;
        if (game.status === 'playing') bunny.releaseSquat();
        return true;
      }
    }
    return false;
  };

  document.addEventListener('keydown', e => {
    const inInput = e.target === bunnyNameInput;
    if (inInput) {
      if (e.code === 'Enter') {
        e.preventDefault();
        handleInput();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        goToWelcome();
      }
      return;
    }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      handleInput();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      if (game.status === 'playing') bunny.squat();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      goToWelcome();
    }
  });

  document.addEventListener('keyup', e => {
    if (e.target === bunnyNameInput) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      handleRelease();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      if (game.status === 'playing') bunny.releaseSquat();
    }
  });

  document.addEventListener('touchstart', e => {
    if (e.target === bunnyNameInput) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (game.status === 'playing' && isInDuckZone(touch.clientY)) {
      duckTouchId = touch.identifier;
      bunny.squat();
    } else {
      handleInput();
    }
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if (e.target === bunnyNameInput) return;
    e.preventDefault();
    if (releaseDuckIfMatched(e.changedTouches)) return;
    handleRelease();
  }, { passive: false });

  document.addEventListener('touchcancel', e => {
    if (e.target === bunnyNameInput) return;
    if (releaseDuckIfMatched(e.changedTouches)) return;
    handleRelease();
  }, { passive: false });

  canvas.addEventListener('mousedown', () => handleInput());
  canvas.addEventListener('mouseup', () => handleRelease());
}
