import { Move } from '../types/cube';

export const CUBE_COLORS = {
  U: '#FFD000', // Saturated Electric Lemon-Gold Yellow on Top
  D: '#FFFFFF', // Crisp Optic Pure White on Bottom
  F: '#00C853', // Vivid Emerald Kelly Green
  B: '#0050E6', // Electric Cobalt Royal Blue
  L: '#FF6200', // Punchy Neon Tangerine Orange (unmistakable from red)
  R: '#E00020', // Deep Ruby Crimson Red (unmistakable from orange)
  core: '#111317', // Matte deep dark speedcube plastic
  stickerBorder: '#0b0c0e',
  highlight: '#00E5FF', // Bright electric cyan highlight
  dimmed: '#273248',
};

/**
 * Standard WCA move notation to human-readable explanation
 */
export const MOVE_EXPLANATIONS: Record<string, { name: string; desc: string }> = {
  R: { name: 'Right Clockwise', desc: 'Turn Right face 90° clockwise (away from you)' },
  "R'": { name: 'Right Counter-Clockwise', desc: 'Turn Right face 90° counter-clockwise (towards you)' },
  R2: { name: 'Right 180°', desc: 'Turn Right face 180°' },

  L: { name: 'Left Clockwise', desc: 'Turn Left face 90° clockwise (towards you)' },
  "L'": { name: 'Left Counter-Clockwise', desc: 'Turn Left face 90° counter-clockwise (away from you)' },
  L2: { name: 'Left 180°', desc: 'Turn Left face 180°' },

  U: { name: 'Up (Top) Clockwise', desc: 'Turn Top face 90° clockwise (left to right)' },
  "U'": { name: 'Up (Top) Counter-Clockwise', desc: 'Turn Top face 90° counter-clockwise (right to left)' },
  U2: { name: 'Up 180°', desc: 'Turn Top face 180°' },

  D: { name: 'Down (Bottom) Clockwise', desc: 'Turn Bottom face 90° clockwise' },
  "D'": { name: 'Down Counter-Clockwise', desc: 'Turn Bottom face 90° counter-clockwise' },
  D2: { name: 'Down 180°', desc: 'Turn Bottom face 180°' },

  F: { name: 'Front Clockwise', desc: 'Turn Front face 90° clockwise' },
  "F'": { name: 'Front Counter-Clockwise', desc: 'Turn Front face 90° counter-clockwise' },
  F2: { name: 'Front 180°', desc: 'Turn Front face 180°' },

  B: { name: 'Back Clockwise', desc: 'Turn Back face 90° clockwise' },
  "B'": { name: 'Back Counter-Clockwise', desc: 'Turn Back face 90° counter-clockwise' },
  B2: { name: 'Back 180°', desc: 'Turn Back face 180°' },

  M: { name: 'Middle Slice', desc: 'Turn Middle layer between L and R downwards (same direction as L)' },
  "M'": { name: 'Middle Slice Up', desc: 'Turn Middle layer upwards (same direction as R)' },
  M2: { name: 'Middle Slice 180°', desc: 'Turn Middle layer 180°' },

  E: { name: 'Equatorial Slice', desc: 'Turn Middle horizontal layer (same direction as D)' },
  "E'": { name: 'Equatorial Slice Reverse', desc: 'Turn Middle horizontal layer (same direction as U)' },
  E2: { name: 'Equatorial Slice 180°', desc: 'Turn Middle horizontal layer 180°' },

  S: { name: 'Standing Slice', desc: 'Turn Middle vertical slice parallel to Front (same direction as F)' },
  "S'": { name: 'Standing Slice Reverse', desc: 'Turn Middle vertical slice counter-clockwise' },
  S2: { name: 'Standing Slice 180°', desc: 'Turn Middle vertical slice 180°' },

  // Wide moves (two layers)
  r: { name: 'Right Wide', desc: 'Turn Right and Middle slice together clockwise (Rw)' },
  "r'": { name: 'Right Wide Inverse', desc: 'Turn Right and Middle slice together counter-clockwise' },
  r2: { name: 'Right Wide 180°', desc: 'Turn Right and Middle slice together 180°' },
  Rw: { name: 'Right Wide', desc: 'Turn Right and Middle slice together clockwise' },
  "Rw'": { name: 'Right Wide Inverse', desc: 'Turn Right and Middle slice together counter-clockwise' },
  Rw2: { name: 'Right Wide 180°', desc: 'Turn Right and Middle slice together 180°' },

  l: { name: 'Left Wide', desc: 'Turn Left and Middle slice together clockwise (Lw)' },
  "l'": { name: 'Left Wide Inverse', desc: 'Turn Left and Middle slice together counter-clockwise' },
  l2: { name: 'Left Wide 180°', desc: 'Turn Left and Middle slice together 180°' },
  Lw: { name: 'Left Wide', desc: 'Turn Left and Middle slice together clockwise' },
  "Lw'": { name: 'Left Wide Inverse', desc: 'Turn Left and Middle slice together counter-clockwise' },
  Lw2: { name: 'Left Wide 180°', desc: 'Turn Left and Middle slice together 180°' },

  u: { name: 'Up Wide', desc: 'Turn top two layers together clockwise (Uw)' },
  "u'": { name: 'Up Wide Inverse', desc: 'Turn top two layers together counter-clockwise' },
  u2: { name: 'Up Wide 180°', desc: 'Turn top two layers together 180°' },
  Uw: { name: 'Up Wide', desc: 'Turn top two layers together clockwise' },
  "Uw'": { name: 'Up Wide Inverse', desc: 'Turn top two layers together counter-clockwise' },
  Uw2: { name: 'Up Wide 180°', desc: 'Turn top two layers together 180°' },

  d: { name: 'Down Wide', desc: 'Turn bottom two layers together clockwise (Dw)' },
  "d'": { name: 'Down Wide Inverse', desc: 'Turn bottom two layers together counter-clockwise' },
  d2: { name: 'Down Wide 180°', desc: 'Turn bottom two layers together 180°' },
  Dw: { name: 'Down Wide', desc: 'Turn bottom two layers together clockwise' },
  "Dw'": { name: 'Down Wide Inverse', desc: 'Turn bottom two layers together counter-clockwise' },
  Dw2: { name: 'Down Wide 180°', desc: 'Turn bottom two layers together 180°' },

  f: { name: 'Front Wide', desc: 'Turn front two layers together clockwise (Fw)' },
  "f'": { name: 'Front Wide Inverse', desc: 'Turn front two layers together counter-clockwise' },
  f2: { name: 'Front Wide 180°', desc: 'Turn front two layers together 180°' },
  Fw: { name: 'Front Wide', desc: 'Turn front two layers together clockwise' },
  "Fw'": { name: 'Front Wide Inverse', desc: 'Turn front two layers together counter-clockwise' },
  Fw2: { name: 'Front Wide 180°', desc: 'Turn front two layers together 180°' },

  b: { name: 'Back Wide', desc: 'Turn back two layers together clockwise (Bw)' },
  "b'": { name: 'Back Wide Inverse', desc: 'Turn back two layers together counter-clockwise' },
  b2: { name: 'Back Wide 180°', desc: 'Turn back two layers together 180°' },
  Bw: { name: 'Back Wide', desc: 'Turn back two layers together clockwise' },
  "Bw'": { name: 'Back Wide Inverse', desc: 'Turn back two layers together counter-clockwise' },
  Bw2: { name: 'Back Wide 180°', desc: 'Turn back two layers together 180°' },

  // Cube Rotations
  x: { name: 'Cube Rotation X', desc: 'Rotate whole cube clockwise around X axis (follow R face)' },
  "x'": { name: 'Cube Rotation X Reverse', desc: 'Rotate whole cube counter-clockwise around X axis (follow R\')' },
  x2: { name: 'Cube Rotation X 180°', desc: 'Rotate whole cube 180° around X axis' },

  y: { name: 'Cube Rotation Y', desc: 'Rotate whole cube clockwise around Y axis (follow U face)' },
  "y'": { name: 'Cube Rotation Y Reverse', desc: 'Rotate whole cube counter-clockwise around Y axis (follow U\')' },
  y2: { name: 'Cube Rotation Y 180°', desc: 'Rotate whole cube 180° around Y axis' },

  z: { name: 'Cube Rotation Z', desc: 'Rotate whole cube clockwise around Z axis (follow F face)' },
  "z'": { name: 'Cube Rotation Z Reverse', desc: 'Rotate whole cube counter-clockwise around Z axis (follow F\')' },
  z2: { name: 'Cube Rotation Z 180°', desc: 'Rotate whole cube 180° around Z axis' },
};

/**
 * Normalizes algorithm strings (removes brackets, extra spaces, handles multiplier syntax like (R U R' U')*3)
 */
export function cleanAlgorithmString(alg: string): string {
  if (!alg) return '';
  let cleaned = alg.replace(/[\(\)\[\]]/g, ' ');
  // Handle *3 or *2 multipliers e.g. "(R U R' U')*3"
  cleaned = cleaned.replace(/([RUFBLDrufbdlxyzMESw'2]+)\s*\*\s*(\d+)/g, (_match, token, count) => {
    const times = parseInt(count, 10);
    return Array(times).fill(token).join(' ');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Parses an algorithm string into a clean array of Move tokens
 */
export function parseAlgorithm(alg: string): string[] {
  const cleaned = cleanAlgorithmString(alg);
  if (!cleaned) return [];
  // Split into tokens
  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  const moves: string[] = [];

  for (const token of rawTokens) {
    // Normalization: e.g. R'2 -> R2, U2' -> U2
    let normalized = token.replace(/’/g, "'").replace(/′/g, "'");
    if (normalized.endsWith("2'") || normalized.endsWith("'2")) {
      normalized = normalized.slice(0, -2) + '2';
    }
    if (normalized) {
      moves.push(normalized);
    }
  }

  return moves;
}

/**
 * Inverts a single move (e.g. R -> R', R' -> R, R2 -> R2)
 */
export function invertMove(move: string): string {
  if (move.endsWith('2')) {
    return move; // 180 turn is its own inverse
  }
  if (move.endsWith("'")) {
    return move.slice(0, -1);
  }
  return move + "'";
}

/**
 * Inverts a full algorithm: reverses the move order and inverts each move.
 * Great for setting up the cube before practicing the algorithm!
 */
export function invertAlgorithm(alg: string): string {
  const moves = parseAlgorithm(alg);
  const inverted = moves.slice().reverse().map(invertMove);
  return inverted.join(' ');
}

/**
 * Generates an official WCA 3x3 scramble (default 21 moves)
 * Ensures no consecutive moves on same face and no opposite-face cancels (e.g., R L R)
 */
const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];
const OPPOSITE_AXIS: Record<string, string> = {
  U: 'D',
  D: 'U',
  R: 'L',
  L: 'R',
  F: 'B',
  B: 'F',
};

export function generateScramble(length = 21): string {
  const scrambleMoves: string[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    const availableFaces = FACES.filter((f) => {
      if (f === lastFace) return false;
      if (secondLastFace && f === secondLastFace && OPPOSITE_AXIS[f] === lastFace) {
        return false;
      }
      return true;
    });

    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    scrambleMoves.push(chosenFace + modifier);

    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return scrambleMoves.join(' ');
}

/**
 * Formats milliseconds into standard speedcubing time display (e.g. 12.345 or 1:04.230)
 */
export function formatSolveTime(ms: number, penalty: 'none' | '+2' | 'dnf' = 'none'): string {
  if (penalty === 'dnf') return 'DNF';
  const effectiveMs = penalty === '+2' ? ms + 2000 : ms;
  if (effectiveMs < 0) return '0.000';

  const totalSeconds = effectiveMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let timeString = '';
  if (minutes > 0) {
    timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(2)}`;
  } else {
    timeString = seconds.toFixed(2);
  }

  return penalty === '+2' ? `${timeString}+` : timeString;
}

/**
 * Calculates average of N (WCA trimming rule: remove fastest and slowest, average remaining)
 */
export function calculateAoN(timesMs: number[], n: number): number | null {
  if (timesMs.length < n) return null;
  const slice = timesMs.slice(0, n);
  if (slice.includes(Infinity)) {
    // If more than 1 DNF in the slice, average is DNF (represented as Infinity)
    const dnfCount = slice.filter((t) => !isFinite(t)).length;
    if (dnfCount > 1) return Infinity;
  }

  const sorted = [...slice].sort((a, b) => a - b);
  // Remove fastest and slowest
  const trimmed = sorted.slice(1, -1);
  if (trimmed.includes(Infinity)) return Infinity;

  const sum = trimmed.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / trimmed.length);
}
