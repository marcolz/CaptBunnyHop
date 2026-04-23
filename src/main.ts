import { C } from './config';
import { bindInput } from './input';
import { startLoop } from './loop';
import { showOverlay } from './overlay';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D canvas context not available');

const dpr = window.devicePixelRatio || 1;
canvas.width = C.W * dpr;
canvas.height = C.H * dpr;
ctx.scale(dpr, dpr);

bindInput(canvas);
showOverlay('splash');
startLoop(ctx);
