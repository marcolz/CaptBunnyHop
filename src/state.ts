import { C } from './config';

export type GameStatus = 'splash' | 'character_select' | 'waiting' | 'playing' | 'game_over';
export type Species = 'bunny' | 'kitten';

interface GameState {
  status: GameStatus;
  species: Species;
  bunnyName: string;
  kittenName: string;
  gameOverTime: number;
  speed: number;
  frameCount: number;
}

const storedSpecies = localStorage.getItem('species');
const initialSpecies: Species = storedSpecies === 'kitten' ? 'kitten' : 'bunny';

export const game: GameState = {
  status: 'splash',
  species: initialSpecies,
  bunnyName: localStorage.getItem('bunnyName') ?? '',
  kittenName: localStorage.getItem('kittenName') ?? '',
  gameOverTime: 0,
  speed: C.INIT_SPEED,
  frameCount: 0,
};

export function getCurrentName(): string {
  return game.species === 'kitten' ? game.kittenName : game.bunnyName;
}

export function setCurrentName(name: string): void {
  if (game.species === 'kitten') {
    game.kittenName = name;
    localStorage.setItem('kittenName', name);
  } else {
    game.bunnyName = name;
    localStorage.setItem('bunnyName', name);
  }
}

export function setSpecies(s: Species): void {
  game.species = s;
  localStorage.setItem('species', s);
}
