import { C } from './config';
import { game, setCurrentName, getCurrentName } from './state';
import { score, saveToHistory } from './score';
import { bunny } from './bunny';
import { obstacles } from './obstacle';
import { showOverlay, hideOverlay, bunnyNameInput } from './overlay';
import { initAudio, stopJingle, stopGameOverJingle, playHitSound } from './audio';

export function startGame(): boolean {
  const enteredName = (bunnyNameInput.value || '').trim().slice(0, 16);
  if (!enteredName) {
    const noun =
      game.species === 'kitten' ? 'kitten' :
      game.species === 'puppy' ? 'puppy' :
      'bunny';
    bunnyNameInput.setCustomValidity(`Please enter a ${noun} name.`);
    bunnyNameInput.reportValidity();
    bunnyNameInput.focus();
    return false;
  }
  bunnyNameInput.setCustomValidity('');
  initAudio();
  stopJingle();
  stopGameOverJingle();
  setCurrentName(enteredName);
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
  saveToHistory(getCurrentName(), score.current);
  playHitSound();
  showOverlay('game_over');
}

export function goToCharacterSelect(): void {
  stopJingle();
  stopGameOverJingle();
  game.status = 'character_select';
  game.speed = C.INIT_SPEED;
  score.reset();
  bunny.reset();
  obstacles.reset();
  showOverlay('character_select');
}

export function goToWelcome(): void {
  stopJingle();
  stopGameOverJingle();
  game.status = 'waiting';
  game.speed = C.INIT_SPEED;
  score.reset();
  bunny.reset();
  obstacles.reset();
  showOverlay('waiting');
}
