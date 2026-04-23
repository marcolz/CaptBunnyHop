import { STARTUP_QUOTES } from './config';
import { game } from './state';
import { score } from './score';
import { startJingle } from './audio';

export type OverlayMode = 'splash' | 'waiting' | 'game_over';

const overlay = document.getElementById('overlay') as HTMLDivElement;
const overlayTitle = document.getElementById('overlay-title') as HTMLDivElement;
const overlaySub = document.getElementById('overlay-subtitle') as HTMLDivElement;
const overlayScores = document.getElementById('overlay-scores') as HTMLDivElement;
const overlayNameRow = document.getElementById('overlay-name-row') as HTMLDivElement;
export const bunnyNameInput = document.getElementById('bunny-name') as HTMLInputElement;

function getRandomQuote(): string {
  return STARTUP_QUOTES[Math.floor(Math.random() * STARTUP_QUOTES.length)];
}

export function showOverlay(mode: OverlayMode): void {
  overlay.style.display = 'flex';
  if (mode === 'splash') {
    overlayTitle.textContent = 'CAPTAIN BUN HOP';
    overlaySub.style.display = '';
    overlaySub.textContent = getRandomQuote();
    overlayNameRow.style.display = 'none';
    overlayScores.textContent = 'Tap or press any key to begin';
  } else if (mode === 'waiting') {
    startJingle();
    overlayTitle.textContent = 'WELCOME';
    overlaySub.style.display = 'none';
    overlayNameRow.style.display = 'flex';
    bunnyNameInput.value = game.bunnyName;
    overlayScores.textContent = (score.high > 0 ? `Best: ${score.high} • ` : '') + 'Press Space or Tap to Start';
  } else {
    startJingle();
    overlayTitle.textContent = 'GAME OVER';
    overlaySub.style.display = '';
    overlaySub.textContent = game.bunnyName
      ? `${game.bunnyName} scored ${score.current}!`
      : `Your bunny scored ${score.current}!`;
    overlayNameRow.style.display = 'none';
    overlayScores.textContent = `Best: ${score.high}${score.current === score.high && score.high > 0 ? ' 🏆 New Record!' : ''}`;
    overlayScores.textContent += '\nPress Space or Tap to Restart';
  }
}

export function hideOverlay(): void {
  overlay.style.display = 'none';
}
