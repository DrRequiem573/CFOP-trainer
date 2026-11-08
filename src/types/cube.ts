export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export type Move =
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2'
  | 'M' | "M'" | 'M2'
  | 'E' | "E'" | 'E2'
  | 'S' | "S'" | 'S2'
  | 'u' | "u'" | 'u2' | 'Uw' | "Uw'" | 'Uw2'
  | 'd' | "d'" | 'd2' | 'Dw' | "Dw'" | 'Dw2'
  | 'f' | "f'" | 'f2' | 'Fw' | "Fw'" | 'Fw2'
  | 'b' | "b'" | 'b2' | 'Bw' | "Bw'" | 'Bw2'
  | 'l' | "l'" | 'l2' | 'Lw' | "Lw'" | 'Lw2'
  | 'r' | "r'" | 'r2' | 'Rw' | "Rw'" | 'Rw2'
  | 'x' | "x'" | 'x2'
  | 'y' | "y'" | 'y2'
  | 'z' | "z'" | 'z2';

export type CFOPStage = 'cross' | 'f2l' | 'oll' | 'pll';

export interface AlgorithmCase {
  id: string;
  stage: CFOPStage;
  subCategory: string; // e.g. "Easy Cases (1-4)", "Edges Only", "Adjacent Corners"
  name: string;
  code?: string; // e.g. "T-Perm", "F2L 1", "Sune", "Ua"
  primaryAlg: string;
  alternateAlgs?: string[];
  setupAlg?: string; // Alg to setup this exact case from solved cube
  probability?: string; // e.g. "1/18", "4/27"
  recognitionTip?: string;
  diagramSvg?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface SolveRecord {
  id: string;
  timeMs: number;
  scramble: string;
  date: number; // timestamp
  penalty?: 'none' | '+2' | 'dnf';
  session: string;
  stageTag?: string; // e.g. "3x3 Full", "F2L Practice", "PLL Time Attack"
  note?: string;
}

export interface TimerStats {
  count: number;
  best: number | null;
  worst: number | null;
  mean: number | null;
  ao5: number | null;
  ao12: number | null;
  ao50: number | null;
  ao100: number | null;
}

export type FocusLayerMode = 'all' | 'cross' | 'f2l' | 'oll' | 'pll';
