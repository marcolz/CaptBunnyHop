import { C } from './config';

export type GameStatus = 'splash' | 'character_select' | 'waiting' | 'playing' | 'game_over';
export type Species = 'bunny' | 'kitten' | 'puppy' | 'panda';

interface GameState {
  status: GameStatus;
  species: Species;
  bunnyName: string;
  kittenName: string;
  puppyName: string;
  pandaName: string;
  gameOverTime: number;
  speed: number;
  frameCount: number;
}

const storedSpecies = localStorage.getItem('species');
const initialSpecies: Species =
  storedSpecies === 'kitten' ? 'kitten' :
  storedSpecies === 'puppy' ? 'puppy' :
  storedSpecies === 'panda' ? 'panda' :
  'bunny';

export const game: GameState = {
  status: 'splash',
  species: initialSpecies,
  bunnyName: localStorage.getItem('bunnyName') ?? '',
  kittenName: localStorage.getItem('kittenName') ?? '',
  puppyName: localStorage.getItem('puppyName') ?? '',
  pandaName: localStorage.getItem('pandaName') ?? '',
  gameOverTime: 0,
  speed: C.INIT_SPEED,
  frameCount: 0,
};

export function getCurrentName(): string {
  switch (game.species) {
    case 'kitten': return game.kittenName;
    case 'puppy': return game.puppyName;
    case 'panda': return game.pandaName;
    default: return game.bunnyName;
  }
}

export function setCurrentName(name: string): void {
  switch (game.species) {
    case 'kitten':
      game.kittenName = name;
      localStorage.setItem('kittenName', name);
      break;
    case 'puppy':
      game.puppyName = name;
      localStorage.setItem('puppyName', name);
      break;
    case 'panda':
      game.pandaName = name;
      localStorage.setItem('pandaName', name);
      break;
    default:
      game.bunnyName = name;
      localStorage.setItem('bunnyName', name);
  }
}

export function setSpecies(s: Species): void {
  game.species = s;
  localStorage.setItem('species', s);
}
