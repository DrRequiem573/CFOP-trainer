import { parseAlgorithm } from './cubeState';
import { CFOPStage } from '../types/cube';

export type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export interface CubeState {
  U: string[][]; // 3x3
  D: string[][]; // 3x3
  F: string[][]; // 3x3
  B: string[][]; // 3x3
  L: string[][]; // 3x3
  R: string[][]; // 3x3
}

// Standard WCA distinct colors
export const SIM_COLORS = {
  U: '#FFD000', // Yellow
  D: '#FFFFFF', // White
  F: '#00C853', // Green
  B: '#0050E6', // Blue
  L: '#FF6200', // Orange
  R: '#E00020', // Red
  inactive: '#1a2233', // Dark speedcube slate for non-concerned facelets
  inactiveBorder: '#273248',
  targetSlot: '#00E5FF',
};

/**
 * Creates a pristine, fully solved 3x3 Rubik's cube state
 */
export function createSolvedCube(): CubeState {
  return {
    U: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.U)),
    D: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.D)),
    F: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.F)),
    B: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.B)),
    L: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.L)),
    R: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.R)),
  };
}

/**
 * Creates an F2L-focused base cube where:
 * - White cross is solved
 * - The other 3 F2L slots (BL, BR, FL) are solved
 * - Only the active FR slot pieces (White-Green-Red corner, Green-Red edge) and centers have color;
 *   other pieces are muted so the active pair pops instantly.
 */
export function createF2LBaseCube(): CubeState {
  // Start with all facelets set to inactive slate
  const state: CubeState = {
    U: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.inactive)),
    D: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.inactive)),
    F: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.inactive)),
    B: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.inactive)),
    L: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.inactive)),
    R: Array(3).fill(null).map(() => Array(3).fill(SIM_COLORS.inactive)),
  };

  // Center orientation facelets
  state.U[1][1] = '#9e7a04'; // Muted reference yellow center
  state.F[1][1] = '#0b5327'; // Muted reference green center
  state.R[1][1] = '#730d17'; // Muted reference red center

  // Active Front-Right (FR) Corner: D=White, F=Green, R=Red at solved position (x=1, y=-1, z=1)
  state.D[0][2] = SIM_COLORS.D; // Front-Right of D face
  state.F[2][2] = SIM_COLORS.F; // Bottom-Right of F face
  state.R[2][0] = SIM_COLORS.R; // Bottom-Left of R face

  // Active Front-Right (FR) Edge: F=Green, R=Red at solved position (x=1, y=0, z=1)
  state.F[1][2] = SIM_COLORS.F; // Middle-Right of F face
  state.R[1][0] = SIM_COLORS.R; // Middle-Left of R face

  return state;
}

/**
 * Rotates a 3x3 2D array 90 degrees clockwise
 */
function rotateMatrixClockwise(matrix: string[][]): string[][] {
  const result: string[][] = Array(3).fill(null).map(() => Array(3).fill(''));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result[c][2 - r] = matrix[r][c];
    }
  }
  return result;
}

/**
 * Applies a single standard move to the CubeState
 */
export function applyMoveToCube(state: CubeState, move: string): void {
  const base = move.replace(/[2']/g, '');
  const isDouble = move.includes('2');
  const isPrime = move.includes("'");
  const turns = isDouble ? 2 : isPrime ? 3 : 1;

  for (let t = 0; t < turns; t++) {
    switch (base) {
      case 'U': {
        state.U = rotateMatrixClockwise(state.U);
        const temp = [...state.F[0]];
        state.F[0] = [...state.R[0]];
        state.R[0] = [...state.B[0]];
        state.B[0] = [...state.L[0]];
        state.L[0] = temp;
        break;
      }
      case 'D': {
        state.D = rotateMatrixClockwise(state.D);
        const temp = [...state.F[2]];
        state.F[2] = [...state.L[2]];
        state.L[2] = [...state.B[2]];
        state.B[2] = [...state.R[2]];
        state.R[2] = temp;
        break;
      }
      case 'F': {
        state.F = rotateMatrixClockwise(state.F);
        const temp = [state.U[2][0], state.U[2][1], state.U[2][2]];
        // U[2] gets L[:, 2] (bottom to top)
        state.U[2][0] = state.L[2][2];
        state.U[2][1] = state.L[1][2];
        state.U[2][2] = state.L[0][2];
        // L[:, 2] gets D[0]
        state.L[0][2] = state.D[0][0];
        state.L[1][2] = state.D[0][1];
        state.L[2][2] = state.D[0][2];
        // D[0] gets R[:, 0] (bottom to top)
        state.D[0][0] = state.R[2][0];
        state.D[0][1] = state.R[1][0];
        state.D[0][2] = state.R[0][0];
        // R[:, 0] gets temp
        state.R[0][0] = temp[0];
        state.R[1][0] = temp[1];
        state.R[2][0] = temp[2];
        break;
      }
      case 'B': {
        state.B = rotateMatrixClockwise(state.B);
        const temp = [state.U[0][0], state.U[0][1], state.U[0][2]];
        // U[0] gets R[:, 2]
        state.U[0][0] = state.R[0][2];
        state.U[0][1] = state.R[1][2];
        state.U[0][2] = state.R[2][2];
        // R[:, 2] gets D[2] (reversed)
        state.R[0][2] = state.D[2][2];
        state.R[1][2] = state.D[2][1];
        state.R[2][2] = state.D[2][0];
        // D[2] gets L[:, 0]
        state.D[2][0] = state.L[0][0];
        state.D[2][1] = state.L[1][0];
        state.D[2][2] = state.L[2][0];
        // L[:, 0] gets temp (reversed)
        state.L[0][0] = temp[2];
        state.L[1][0] = temp[1];
        state.L[2][0] = temp[0];
        break;
      }
      case 'R': {
        state.R = rotateMatrixClockwise(state.R);
        const temp = [state.U[0][2], state.U[1][2], state.U[2][2]];
        // U[:, 2] gets F[:, 2]
        state.U[0][2] = state.F[0][2];
        state.U[1][2] = state.F[1][2];
        state.U[2][2] = state.F[2][2];
        // F[:, 2] gets D[:, 2]
        state.F[0][2] = state.D[0][2];
        state.F[1][2] = state.D[1][2];
        state.F[2][2] = state.D[2][2];
        // D[:, 2] gets B[:, 0] (reversed)
        state.D[0][2] = state.B[2][0];
        state.D[1][2] = state.B[1][0];
        state.D[2][2] = state.B[0][0];
        // B[:, 0] gets temp (reversed)
        state.B[0][0] = temp[2];
        state.B[1][0] = temp[1];
        state.B[2][0] = temp[0];
        break;
      }
      case 'L': {
        state.L = rotateMatrixClockwise(state.L);
        const temp = [state.U[0][0], state.U[1][0], state.U[2][0]];
        // U[:, 0] gets B[:, 2] (reversed)
        state.U[0][0] = state.B[2][2];
        state.U[1][0] = state.B[1][2];
        state.U[2][0] = state.B[0][2];
        // B[:, 2] gets D[:, 0] (reversed)
        state.B[0][2] = state.D[2][0];
        state.B[1][2] = state.D[1][0];
        state.B[2][2] = state.D[0][0];
        // D[:, 0] gets F[:, 0]
        state.D[0][0] = state.F[0][0];
        state.D[1][0] = state.F[1][0];
        state.D[2][0] = state.F[2][0];
        // F[:, 0] gets temp
        state.F[0][0] = temp[0];
        state.F[1][0] = temp[1];
        state.F[2][0] = temp[2];
        break;
      }
      case 'M': {
        // M slice goes in direction of L
        const temp = [state.U[0][1], state.U[1][1], state.U[2][1]];
        state.U[0][1] = state.B[2][1];
        state.U[1][1] = state.B[1][1];
        state.U[2][1] = state.B[0][1];
        state.B[0][1] = state.D[2][1];
        state.B[1][1] = state.D[1][1];
        state.B[2][1] = state.D[0][1];
        state.D[0][1] = state.F[0][1];
        state.D[1][1] = state.F[1][1];
        state.D[2][1] = state.F[2][1];
        state.F[0][1] = temp[0];
        state.F[1][1] = temp[1];
        state.F[2][1] = temp[2];
        break;
      }
      // Wide moves
      case 'r':
      case 'Rw': {
        // R + M'
        applyMoveToCube(state, 'R');
        applyMoveToCube(state, "M'");
        break;
      }
      case 'l':
      case 'Lw': {
        // L + M
        applyMoveToCube(state, 'L');
        applyMoveToCube(state, 'M');
        break;
      }
      case 'u':
      case 'Uw': {
        // U + E' (turn top two layers)
        applyMoveToCube(state, 'U');
        // E' rotates middle slice in U direction
        const temp = [...state.F[1]];
        state.F[1] = [...state.R[1]];
        state.R[1] = [...state.B[1]];
        state.B[1] = [...state.L[1]];
        state.L[1] = temp;
        break;
      }
      case 'd':
      case 'Dw': {
        // D + E
        applyMoveToCube(state, 'D');
        const temp = [...state.F[1]];
        state.F[1] = [...state.L[1]];
        state.L[1] = [...state.B[1]];
        state.B[1] = [...state.R[1]];
        state.R[1] = temp;
        break;
      }
      case 'f':
      case 'Fw': {
        applyMoveToCube(state, 'F');
        // S slice in F direction
        const temp = [state.U[1][0], state.U[1][1], state.U[1][2]];
        state.U[1][0] = state.L[2][1];
        state.U[1][1] = state.L[1][1];
        state.U[1][2] = state.L[0][1];
        state.L[0][1] = state.D[1][0];
        state.L[1][1] = state.D[1][1];
        state.L[2][1] = state.D[1][2];
        state.D[1][0] = state.R[2][1];
        state.D[1][1] = state.R[1][1];
        state.D[1][2] = state.R[0][1];
        state.R[0][1] = temp[0];
        state.R[1][1] = temp[1];
        state.R[2][1] = temp[2];
        break;
      }
      default:
        break;
    }
  }
}

/**
 * Simulates an algorithm on a starting cube state and returns the resulting state
 */
export function simulateAlgorithm(startState: CubeState, algorithm: string): CubeState {
  const cloned: CubeState = {
    U: startState.U.map((row) => [...row]),
    D: startState.D.map((row) => [...row]),
    F: startState.F.map((row) => [...row]),
    B: startState.B.map((row) => [...row]),
    L: startState.L.map((row) => [...row]),
    R: startState.R.map((row) => [...row]),
  };

  const moves = parseAlgorithm(algorithm);
  for (const move of moves) {
    applyMoveToCube(cloned, move);
  }

  return cloned;
}

/**
 * Cache for simulated case previews to ensure instant zero-latency rendering
 */
const previewCache = new Map<string, CubeState>();

export function getCaseSimulatedState(stage: CFOPStage, setupAlgorithm: string): CubeState {
  const cacheKey = `${stage}_${setupAlgorithm}`;
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!;
  }

  const base = stage === 'f2l' ? createF2LBaseCube() : createSolvedCube();
  const simulated = simulateAlgorithm(base, setupAlgorithm);
  previewCache.set(cacheKey, simulated);
  return simulated;
}
