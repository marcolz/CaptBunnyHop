import { STARTUP_QUOTES } from './config';
import { game } from './state';
import { score, getHistory } from './score';
import { startJingle, stopJingle, playGameOverJingle } from './audio';

export type OverlayMode = 'splash' | 'waiting' | 'game_over';

const overlay = document.getElementById('overlay') as HTMLDivElement;
const overlayWhatsNew = document.getElementById('overlay-whats-new') as HTMLDivElement;
const overlayTitle = document.getElementById('overlay-title') as HTMLDivElement;
const overlaySub = document.getElementById('overlay-subtitle') as HTMLDivElement;
const overlayScores = document.getElementById('overlay-scores') as HTMLDivElement;
const overlayLb = document.getElementById('overlay-leaderboard') as HTMLDivElement;
const overlayNameRow = document.getElementById('overlay-name-row') as HTMLDivElement;
export const bunnyNameInput = document.getElementById('bunny-name') as HTMLInputElement;

function getRandomQuote(): string {
  return STARTUP_QUOTES[Math.floor(Math.random() * STARTUP_QUOTES.length)];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function showOverlay(mode: OverlayMode): void {
  overlay.style.display = 'flex';
  if (mode === 'splash') {
    overlayWhatsNew.style.display = '';
    overlayTitle.textContent = 'CAPTAIN BUN HOP';
    overlaySub.style.display = '';
    overlaySub.textContent = getRandomQuote();
    overlayNameRow.style.display = 'none';
    overlayScores.textContent = 'Tap or press any key to begin';
    overlayLb.innerHTML = '';
  } else if (mode === 'waiting') {
    startJingle();
    overlayWhatsNew.style.display = 'none';
    overlayTitle.textContent = 'WELCOME';
    overlaySub.style.display = 'none';
    overlayNameRow.style.display = 'flex';
    bunnyNameInput.value = game.bunnyName;
    overlayScores.textContent = (score.high > 0 ? `Best: ${score.high} • ` : '') + 'Press Space or Tap to Start';
    overlayLb.innerHTML = '';
  } else {
    stopJingle();
    playGameOverJingle();
    overlayWhatsNew.style.display = 'none';
    overlayTitle.textContent = 'GAME OVER';
    overlaySub.style.display = '';
    overlaySub.textContent = game.bunnyName
      ? `${game.bunnyName} scored ${score.current}!`
      : `Your bunny scored ${score.current}!`;
    overlayNameRow.style.display = 'none';
    overlayScores.textContent = `Best: ${score.high}${score.current === score.high && score.high > 0 ? ' 🏆 New Record!' : ''}`;
    overlayScores.textContent += '\nPress Space or Tap to Restart';
    const history = getHistory();
    overlayLb.innerHTML = '';
    if (history.length > 0) {
      const table = document.createElement('table');
      let highlighted = false;
      for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        const tr = document.createElement('tr');
        if (!highlighted && entry.score === score.current) {
          tr.className = 'lb-current';
          highlighted = true;
        }
        tr.innerHTML = `<td class="lb-rank">${i + 1}.</td><td class="lb-name">${escapeHtml(entry.name)}</td><td class="lb-score">${entry.score}</td>`;
        table.appendChild(tr);
      }
      overlayLb.appendChild(table);
    }
  }
}

export function hideOverlay(): void {
  overlay.style.display = 'none';
}
