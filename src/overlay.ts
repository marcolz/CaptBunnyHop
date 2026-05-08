import { STARTUP_QUOTES } from './config';
import { game, getCurrentName, setSpecies, type Species } from './state';
import { score, getHistory } from './score';
import { startJingle, stopJingle, playGameOverJingle, playMeow, playWoof, initAudio } from './audio';
import { drawIdlePreview } from './bunny';

export type OverlayMode = 'splash' | 'character_select' | 'waiting' | 'game_over';

const overlay = document.getElementById('overlay') as HTMLDivElement;
const overlayWhatsNew = document.getElementById('overlay-whats-new') as HTMLDivElement;
const overlayTitle = document.getElementById('overlay-title') as HTMLDivElement;
const overlaySub = document.getElementById('overlay-subtitle') as HTMLDivElement;
const overlayScores = document.getElementById('overlay-scores') as HTMLDivElement;
const overlayLb = document.getElementById('overlay-leaderboard') as HTMLDivElement;
const overlayNameRow = document.getElementById('overlay-name-row') as HTMLDivElement;
const overlayCharacterRow = document.getElementById('overlay-character-row') as HTMLDivElement;
const bunnyNameLabel = document.getElementById('bunny-name-label') as HTMLLabelElement;
const charBtnBunny = document.getElementById('char-btn-bunny') as HTMLButtonElement;
const charBtnKitten = document.getElementById('char-btn-kitten') as HTMLButtonElement;
const charBtnPuppy = document.getElementById('char-btn-puppy') as HTMLButtonElement;
const charPreviewBunny = document.getElementById('char-preview-bunny') as HTMLCanvasElement;
const charPreviewKitten = document.getElementById('char-preview-kitten') as HTMLCanvasElement;
const charPreviewPuppy = document.getElementById('char-preview-puppy') as HTMLCanvasElement;
export const bunnyNameInput = document.getElementById('bunny-name') as HTMLInputElement;

let onCharacterChosen: ((s: Species) => void) | null = null;

function paintPreviews(): void {
  const cb = charPreviewBunny.getContext('2d');
  const ck = charPreviewKitten.getContext('2d');
  const cp = charPreviewPuppy.getContext('2d');
  if (cb) drawIdlePreview(cb, 'bunny');
  if (ck) drawIdlePreview(ck, 'kitten');
  if (cp) drawIdlePreview(cp, 'puppy');
}

function updateSelectedHighlight(): void {
  charBtnBunny.classList.toggle('selected', game.species === 'bunny');
  charBtnKitten.classList.toggle('selected', game.species === 'kitten');
  charBtnPuppy.classList.toggle('selected', game.species === 'puppy');
}

charBtnBunny.addEventListener('click', () => {
  setSpecies('bunny');
  updateSelectedHighlight();
  if (onCharacterChosen) onCharacterChosen('bunny');
});
charBtnKitten.addEventListener('click', () => {
  setSpecies('kitten');
  updateSelectedHighlight();
  initAudio();
  playMeow();
  if (onCharacterChosen) onCharacterChosen('kitten');
});
charBtnPuppy.addEventListener('click', () => {
  setSpecies('puppy');
  updateSelectedHighlight();
  initAudio();
  playWoof();
  if (onCharacterChosen) onCharacterChosen('puppy');
});

export function setOnCharacterChosen(fn: (s: Species) => void): void {
  onCharacterChosen = fn;
}

function getRandomQuote(): string {
  return STARTUP_QUOTES[Math.floor(Math.random() * STARTUP_QUOTES.length)];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function speciesIcon(s?: Species): string {
  return s === 'kitten' ? '🐱' : s === 'puppy' ? '🐶' : s === 'bunny' ? '🐰' : '';
}

export function showOverlay(mode: OverlayMode): void {
  overlay.style.display = 'flex';
  if (mode === 'splash') {
    overlayWhatsNew.style.display = '';
    overlayTitle.textContent = 'CAPTAIN BUN HOP';
    overlaySub.style.display = '';
    overlaySub.textContent = getRandomQuote();
    overlayNameRow.style.display = 'none';
    overlayCharacterRow.style.display = 'none';
    overlayScores.textContent = 'Tap or press any key to begin';
    overlayLb.innerHTML = '';
  } else if (mode === 'character_select') {
    startJingle();
    overlayWhatsNew.style.display = 'none';
    overlayTitle.textContent = 'CHOOSE YOUR HOPPER';
    overlaySub.style.display = '';
    overlaySub.textContent = 'Tap a friend to start';
    overlayNameRow.style.display = 'none';
    overlayCharacterRow.style.display = 'flex';
    paintPreviews();
    updateSelectedHighlight();
    overlayScores.textContent = score.high > 0 ? `Best: ${score.high}` : '';
    overlayLb.innerHTML = '';
  } else if (mode === 'waiting') {
    startJingle();
    overlayWhatsNew.style.display = 'none';
    overlayTitle.textContent = 'WELCOME';
    overlaySub.style.display = 'none';
    overlayNameRow.style.display = 'flex';
    overlayCharacterRow.style.display = 'none';
    bunnyNameLabel.textContent =
      game.species === 'kitten' ? 'Name your kitten:' :
      game.species === 'puppy' ? 'Name your puppy:' :
      'Name your bunny:';
    bunnyNameInput.value = getCurrentName();
    overlayScores.textContent = (score.high > 0 ? `Best: ${score.high} • ` : '') + 'Press Space or Tap to Start';
    overlayLb.innerHTML = '';
  } else {
    stopJingle();
    playGameOverJingle();
    overlayWhatsNew.style.display = 'none';
    overlayTitle.textContent = 'GAME OVER';
    overlaySub.style.display = '';
    const name = getCurrentName();
    const noun =
      game.species === 'kitten' ? 'kitten' :
      game.species === 'puppy' ? 'puppy' :
      'bunny';
    overlaySub.textContent = name
      ? `${name} scored ${score.current}!`
      : `Your ${noun} scored ${score.current}!`;
    overlayNameRow.style.display = 'none';
    overlayCharacterRow.style.display = 'none';
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
        const icon = speciesIcon(entry.species);
        const iconHtml = icon ? `<span class="lb-icon">${icon}</span>` : '';
        tr.innerHTML = `<td class="lb-rank">${i + 1}.</td><td class="lb-name">${iconHtml}${escapeHtml(entry.name)}</td><td class="lb-score">${entry.score}</td>`;
        table.appendChild(tr);
      }
      overlayLb.appendChild(table);
    }
  }
}

export function hideOverlay(): void {
  overlay.style.display = 'none';
}
