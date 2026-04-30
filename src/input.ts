import { game } from './state';
import { bunny } from './bunny';
import { initAudio } from './audio';
import { startGame, goToCharacterSelect } from './control';
import { showOverlay, setOnCharacterChosen, bunnyNameInput } from './overlay';

function goToWaitingFocusName(): void {
  game.status = 'waiting';
  showOverlay('waiting');
  setTimeout(() => bunnyNameInput.focus(), 0);
}

setOnCharacterChosen(() => {
  if (game.status === 'character_select') {
    goToWaitingFocusName();
  }
});

function handleInput(): void {
  initAudio();
  if (game.status === 'splash') {
    game.status = 'character_select';
    showOverlay('character_select');
  } else if (game.status === 'character_select') {
    // Keyboard fallback: keep persisted species, advance to naming.
    goToWaitingFocusName();
  } else if (game.status === 'waiting' || (game.status === 'game_over' && performance.now() - game.gameOverTime >= 2000)) {
    if (game.status === 'game_over') {
      goToCharacterSelect();
      return;
    }
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
        goToCharacterSelect();
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
      goToCharacterSelect();
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
    const target = e.target as HTMLElement;
    if (target && target.closest && target.closest('#overlay-character-row')) {
      // Let character buttons handle their own taps
      return;
    }
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
    const target = e.target as HTMLElement;
    if (target && target.closest && target.closest('#overlay-character-row')) {
      return;
    }
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
