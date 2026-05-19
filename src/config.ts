export const C = {
  W: 800,
  H: 260,
  GROUND_Y: 215,
  GRAVITY: 0.55,
  JUMP_VEL: -13,
  JUMP_CUTOFF_VEL: -5,
  MAX_JUMPS: 2,
  INIT_SPEED: 5,
  MAX_SPEED: 14,
  SPEED_INC: 0.0015,
  BUNNY_W: 32,
  BUNNY_H: 36,
  OBS_MIN_GAP: 800,
  OBS_MAX_GAP: 1500,
  GLIDE_GRAVITY_MULT: 0.14,
  GLIDE_MAX_VY: 1.4,
  PANDA_KICK_DURATION_FRAMES: 14,
  PANDA_KICK_COOLDOWN_FRAMES: 60,
  PANDA_KICK_LUNGE_DX: 35,
  PANDA_KICK_REACH: 40,
  PANDA_SWIPE_THRESHOLD_PX: 30,
  PANDA_RECENTER_RATE: 0.04,
  PANDA_MAX_KICK_CHARGES: 3,
  // Kitten ALLEZ HOP! fires after the button has been held long enough that the
  // kitten has committed past its jump cutoff velocity and is going for a tall
  // jump (kitten vy reaches cutoff ≈ -5.5 from -13.8 in ~15 frames @ G=0.55).
  KITTEN_HOLD_THRESHOLD_FRAMES: 16,
  // Generic action-flash timings used by bunny / kitten / puppy. Panda keeps
  // its own kick+cooldown timing for backwards-compat with the existing feel.
  ACTION_FLASH_POP_IN_FRAMES: 8,
  ACTION_FLASH_HOLD_FRAMES: 38,
  ACTION_FLASH_FADE_OUT_FRAMES: 12,
} as const;

export const SPECIES_PHYSICS = {
  bunny: { jumpVel: -11.5, maxJumps: 2, jumpCutoffVel: -4.5 },
  kitten: { jumpVel: -13.8, maxJumps: 1, jumpCutoffVel: -5.5 },
  puppy: { jumpVel: -11.5, maxJumps: 1, jumpCutoffVel: -4.5 },
  panda: { jumpVel: -11.5, maxJumps: 1, jumpCutoffVel: -4.5 },
} as const;

export const STARTUP_QUOTES = [
  "A brave little bunny can have a very big adventure.",
  "Some of the best journeys begin with tiny paws and a curious nose.",
  "Bunnies teach us that gentle can also be strong.",
  "Hop by hop, even a small rabbit can cross a great field.",
  "A rabbit's heart is full of wonder, even when the world feels big.",
  "Soft ears, quick feet, and a little courage can go a long way.",
  "Every bunny has a bit of magic in the way they keep going.",
  "The best kind of hopping is the kind that leads you somewhere new.",
  "A kind bunny makes every meadow feel more like home.",
  "Even the smallest rabbit can brighten a very cloudy day.",
];
