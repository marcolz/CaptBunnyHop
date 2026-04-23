import { C } from './config';

export type GameStatus = 'splash' | 'waiting' | 'playing' | 'game_over';

interface GameState {
  status: GameStatus;
  bunnyName: string;
  gameOverTime: number;
  speed: number;
  frameCount: number;
}

export const game: GameState = {
  status: 'splash',
  bunnyName: localStorage.getItem('bunnyName') ?? '',
  gameOverTime: 0,
  speed: C.INIT_SPEED,
  frameCount: 0,
};
