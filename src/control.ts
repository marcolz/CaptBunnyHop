import { C } from './config';
import { game } from './state';
import { score, saveToHistory } from './score';
import { bunny } from './bunny';
import { obstacles } from './obstacle';
import { showOverlay, hideOverlay, bunnyNameInput } from './overlay';
import { initAudio, stopJingle, playHitSound } from './audio';

export function startGame(): boolean {
  const enteredName = (bunnyNameInput.value || '').trim().slice(0, 16);
  if (!enteredName) {
    bunnyNameInput.setCustomValidity('Please enter a bunny name.');
    bunnyNameInput.reportValidity();
    bunnyNameInput.focus();
    return false;
  }
  bunnyNameInput.setCustomValidity('');
  initAudio();
  stopJingle();
  game.bunnyName = enteredName;
  localStorage.setItem('bunnyName', game.bunnyName);
  if (document.activeElement === bunnyNameInput) bunnyNameInput.blur();
  game.status = 'playing';
  game.speed = C.INIT_SPEED;
  game.frameCount = 0;
  score.reset();
  bunny.reset();
  obstacles.reset();
  hideOverlay();
  return true;
}

export function gameOver(): void {
  game.status = 'game_over';
  game.gameOverTime = performance.now();
  score.checkHigh();
  saveToHistory(game.bunnyName, score.current);
  playHitSound();
  showOverlay('game_over');
}

export function goToWelcome(): void {
  stopJingle();
  game.status = 'waiting';
  game.speed = C.INIT_SPEED;
  score.reset();
  bunny.reset();
  obstacles.reset();
  showOverlay('waiting');
}
