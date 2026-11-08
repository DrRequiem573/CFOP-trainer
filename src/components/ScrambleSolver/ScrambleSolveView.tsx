import React, { useState, useMemo, useCallback } from 'react';
import { CubeCanvas } from '../Cube3D/CubeCanvas';
import { CubeCaseDiagram } from '../Trainer/CubeCaseDiagram';
import { generateScramble, parseAlgorithm } from '../../lib/cubeState';
import { soundManager } from '../../lib/sound';
import {
  Shuffle,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Compass,
  Layers,
  Sparkles,
  Info,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CFOPPhaseStep {
  id: 'cross' | 'f2l-1' | 'f2l-2' | 'f2l-3' | 'f2l-4' | 'oll' | 'pll';
  title: string;
  stageName: 'Cross' | 'F2L' | 'OLL' | 'PLL';
  moves: string;
  slotName?: string;
  caseCode?: string;
  explanation: string;
  lookAheadTip: string;
}

interface CuratedSolve {
  id: string;
  title: string;
  scramble: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Sub-15 Speedcubing';
  phases: CFOPPhaseStep[];
}

const CURATED_SOLVES: CuratedSolve[] = [
  {
    id: 'solve-1',
    title: 'WCA Solve #1: Classic T-Perm & Easy Cross',
    scramble: "D2 F' R2 U2 B2 L2 F' R2 B' U2 R2 B' R B2 L' F' D B' U' F",
    difficulty: 'Intermediate',
    phases: [
      {
        id: 'cross',
        title: 'White Cross (Bottom D)',
        stageName: 'Cross',
        moves: "D' R' F D2",
        explanation:
          '15-second inspection planning: White-Blue edge is placed with R\'. Align bottom centers with D\', insert White-Green with F, and restore the D cross with D2. All 4 cross edges are aligned directly with their center pieces on the bottom.',
        lookAheadTip: 'Keep cross on bottom to track your first F2L pair during inspection.',
      },
      {
        id: 'f2l-1',
        title: 'F2L Pair 1: Front-Right (FR) Slot',
        stageName: 'F2L',
        slotName: 'Green-Red (FR)',
        moves: "U (R U' R')",
        explanation:
          'Corner White-Green-Red is at UFR with White facing right. Edge Green-Red is at UF. U moves edge into position, then direct 3-move trigger R U\' R\' pairs them and inserts into the FR slot.',
        lookAheadTip: 'Watch where the Red-Blue pieces move during the R U\' R\' trigger.',
      },
      {
        id: 'f2l-2',
        title: 'F2L Pair 2: Back-Right (BR) Slot',
        stageName: 'F2L',
        slotName: 'Red-Blue (BR)',
        moves: "U' (R' U R) U' (R' U' R)",
        explanation:
          'Corner White-Red-Blue and Edge Red-Blue. Position with U\', separate with R\' U R, then insert into the Back-Right slot without rotating the cube.',
        lookAheadTip: 'Solving into back slots keeps the front two slots open for easier lookahead.',
      },
      {
        id: 'f2l-3',
        title: 'F2L Pair 3: Back-Left (BL) Slot',
        stageName: 'F2L',
        slotName: 'Blue-Orange (BL)',
        moves: "U L' U' L U2 L' U L",
        explanation:
          'Corner White-Blue-Orange and Edge Blue-Orange. Hide corner, position edge, pair up over the slot, and insert directly into Back-Left.',
        lookAheadTip: 'Only one pair left! Scan the U layer for the final Orange-Green pieces.',
      },
      {
        id: 'f2l-4',
        title: 'F2L Pair 4: Front-Left (FL) Slot',
        stageName: 'F2L',
        slotName: 'Orange-Green (FL)',
        moves: "U' (F' U F) U (F' U' F)",
        explanation:
          'Final F2L pair (White-Orange-Green). Form pair in U layer, insert into Front-Left slot. Both first two layers are now completely solved!',
        lookAheadTip: 'Count oriented yellow edges on top to anticipate OLL cross or dot.',
      },
      {
        id: 'oll',
        title: 'OLL: Orient Last Layer (Sune)',
        stageName: 'OLL',
        caseCode: 'OLL 27 (Sune)',
        moves: "R U R' U R U2 R'",
        explanation:
          'Yellow cross is formed with 1 corner oriented yellow on top. Standard Sune algorithm: 7 fast moves orient all top pieces yellow.',
        lookAheadTip: 'Look at the headlights or solid bars on the sides during U2 to predict the PLL case.',
      },
      {
        id: 'pll',
        title: 'PLL: Permute Last Layer (T-Perm)',
        stageName: 'PLL',
        caseCode: 'T-Permutation',
        moves: "R U R' U' R' F R2 U' R' U' R U R' F' U'",
        explanation:
          'Headlights on Left side! Swaps Front-Right and Back-Right corners, and Front and Right edges. Final U\' AUF (Adjust Upper Face) solves the entire Rubik\'s cube!',
        lookAheadTip: 'AUF recognition: match the completed color bar with the corresponding face.',
      },
    ],
  },
  {
    id: 'solve-2',
    title: 'WCA Solve #2: Sub-15 Speed Solve (Jb-Perm Finish)',
    scramble: "R2 U2 B2 R2 D2 F L2 F' R2 F2 U' L' D2 B' R2 B D F2 R",
    difficulty: 'Sub-15 Speedcubing',
    phases: [
      {
        id: 'cross',
        title: 'White Cross (Bottom D)',
        stageName: 'Cross',
        moves: "R' D' F2 R D",
        explanation:
          'Direct 5-move bottom cross. R\' inserts White-Blue, D\' aligns red and green, F2 inserts White-Green, R inserts White-Red, D restores alignment.',
        lookAheadTip: 'Zero rotations throughout inspection and cross execution.',
      },
      {
        id: 'f2l-1',
        title: 'F2L Pair 1: Front-Right (FR) Slot',
        stageName: 'F2L',
        slotName: 'Green-Red (FR)',
        moves: "(R U R')",
        explanation: 'Free pair already matched during cross! Instant 3-move direct insert into FR.',
        lookAheadTip: 'Free pairs give instant look-ahead into pair #2 without pause.',
      },
      {
        id: 'f2l-2',
        title: 'F2L Pair 2: Front-Left (FL) Slot',
        stageName: 'F2L',
        slotName: 'Green-Orange (FL)',
        moves: "U' (L' U L)",
        explanation: 'Corner and edge paired in U layer, direct left-handed 3-move insert into FL.',
        lookAheadTip: 'Keep eyes on the U face to track remaining back pieces.',
      },
      {
        id: 'f2l-3',
        title: 'F2L Pair 3: Back-Right (BR) Slot',
        stageName: 'F2L',
        slotName: 'Red-Blue (BR)',
        moves: "U (R' U' R U') (R' U' R)",
        explanation: 'White sticker on corner facing UP. Rotate edge to match side color, pair and insert into BR.',
        lookAheadTip: 'Smooth turning without regrip saves 0.8 seconds.',
      },
      {
        id: 'f2l-4',
        title: 'F2L Pair 4: Back-Left (BL) Slot',
        stageName: 'F2L',
        slotName: 'Blue-Orange (BL)',
        moves: "U2 (L U L' U) (L U' L')",
        explanation: 'Final slot insertion into Back-Left. First two layers fully solved.',
        lookAheadTip: 'Notice the yellow line on top for 2-Look or 1-Look OLL.',
      },
      {
        id: 'oll',
        title: 'OLL: Orient Last Layer (OLL 33)',
        stageName: 'OLL',
        caseCode: 'OLL 33 (T-Shape)',
        moves: "(R U R' U') (R' F R F')",
        explanation: 'T-Shape yellow orientation. Sexy move into Sledgehammer: 8 quick moves.',
        lookAheadTip: 'Notice headlights on right side to identify Jb-Perm or Ra-Perm.',
      },
      {
        id: 'pll',
        title: 'PLL: Permute Last Layer (Jb-Perm)',
        stageName: 'PLL',
        caseCode: 'Jb-Permutation',
        moves: "(R U R' F') (R U R' U') (R' F R2 U' R')",
        explanation: 'Full bar on Right face, headlights on Left! Solved in 1.1s. Cube is fully solved!',
        lookAheadTip: 'No AUF required on this solve!',
      },
    ],
  },
  {
    id: 'solve-3',
    title: 'WCA Solve #3: Beginner-Friendly CFOP Walkthrough',
    scramble: "F2 R2 U2 B2 D2 L2 F2 U' L2 U2 F' L' U' B F' D' R' F D'",
    difficulty: 'Beginner',
    phases: [
      {
        id: 'cross',
        title: 'White Cross (Bottom D)',
        stageName: 'Cross',
        moves: "F R' D' F2",
        explanation: 'Easy 4-move white cross on the bottom. Aligns all 4 white edge pieces with center colors.',
        lookAheadTip: 'Practice doing cross with eyes closed after 15s inspection.',
      },
      {
        id: 'f2l-1',
        title: 'F2L Pair 1: Front-Right (FR) Slot',
        stageName: 'F2L',
        slotName: 'Green-Red (FR)',
        moves: "U (R U' R')",
        explanation: 'Basic case 1: corner facing right, edge matching front color. U setup into R U\' R\'.',
        lookAheadTip: 'Do not rush the insert; keep turning rhythm steady.',
      },
      {
        id: 'f2l-2',
        title: 'F2L Pair 2: Front-Left (FL) Slot',
        stageName: 'F2L',
        slotName: 'Green-Orange (FL)',
        moves: "U' (L' U L)",
        explanation: 'Mirror case 2 on the left side: U\' setup into L\' U L insert.',
        lookAheadTip: 'Scan remaining corners while inserting.',
      },
      {
        id: 'f2l-3',
        title: 'F2L Pair 3: Back-Right (BR) Slot',
        stageName: 'F2L',
        slotName: 'Red-Blue (BR)',
        moves: "U' (R' U2 R) U2 (R' U R)",
        explanation: 'Corner and edge same color on top: hide corner in front, move edge away, pair and insert.',
        lookAheadTip: 'U2 setup gives clear visibility of the last slot.',
      },
      {
        id: 'f2l-4',
        title: 'F2L Pair 4: Back-Left (BL) Slot',
        stageName: 'F2L',
        slotName: 'Blue-Orange (BL)',
        moves: "(L U L' U') (L U L')",
        explanation: 'Final slot insertion into Back-Left. All first two layers are completed!',
        lookAheadTip: 'Transition directly into OLL without rotating the cube.',
      },
      {
        id: 'oll',
        title: 'OLL: Orient Last Layer (Antisune)',
        stageName: 'OLL',
        caseCode: 'OLL 26 (Antisune)',
        moves: "R U2 R' U' R U' R'",
        explanation: 'Antisune: corner facing front-left. Mirror of Sune. Orients all top yellow facelets.',
        lookAheadTip: 'Check headlights on back to recognize U-Perms.',
      },
      {
        id: 'pll',
        title: 'PLL: Permute Last Layer (Ua-Perm)',
        stageName: 'PLL',
        caseCode: 'Ua-Permutation',
        moves: "(R U' R U) (R U R U') (R' U' R2)",
        explanation: 'Solved bar at Back, 3 edges cycling counter-clockwise. Complete CFOP solve finished!',
        lookAheadTip: 'AUF with U to complete the solve.',
      },
    ],
  },
];

export const ScrambleSolveView: React.FC = () => {
  const [selectedSolveIndex, setSelectedSolveIndex] = useState(0);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [copiedScramble, setCopiedScramble] = useState(false);
  const [customScrambleInput, setCustomScrambleInput] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const currentSolve = CURATED_SOLVES[selectedSolveIndex];
  const activePhase = currentSolve.phases[activePhaseIndex];

  // Compute accumulated moves:
  // Setup moves for the active phase:
  // Starts with Scramble, then all solved moves from previous phases!
  const previousPhasesMoves = useMemo(() => {
    const moves: string[] = [];
    for (let i = 0; i < activePhaseIndex; i++) {
      moves.push(...parseAlgorithm(currentSolve.phases[i].moves));
    }
    return moves;
  }, [currentSolve, activePhaseIndex]);

  // Setup moves to reach the beginning of this phase on the 3D cube:
  // Scramble + previous phases moves!
  const phaseSetupMoves = useMemo(() => {
    const scrambleMoves = parseAlgorithm(currentSolve.scramble);
    return [...scrambleMoves, ...previousPhasesMoves];
  }, [currentSolve.scramble, previousPhasesMoves]);

  // Moves to solve this active phase:
  const phaseSolveMoves = useMemo(() => {
    return parseAlgorithm(activePhase.moves);
  }, [activePhase.moves]);

  // All moves to solve the entire cube from scramble:
  const allSolveMoves = useMemo(() => {
    const moves: string[] = [];
    for (const phase of currentSolve.phases) {
      moves.push(...parseAlgorithm(phase.moves));
    }
    return moves;
  }, [currentSolve]);

  // Copy scramble to clipboard
  const handleCopyScramble = () => {
    navigator.clipboard.writeText(currentSolve.scramble);
    setCopiedScramble(true);
    setTimeout(() => setCopiedScramble(false), 2000);
  };

  // Next / Previous phase navigation
  const nextPhase = () => {
    if (activePhaseIndex < currentSolve.phases.length - 1) {
      setActivePhaseIndex(activePhaseIndex + 1);
    }
  };

  const prevPhase = () => {
    if (activePhaseIndex > 0) {
      setActivePhaseIndex(activePhaseIndex - 1);
    }
  };

  // Generate random new scramble
  const handleNewRandomScramble = () => {
    // Pick next curated solve or generate
    const nextIdx = (selectedSolveIndex + 1) % CURATED_SOLVES.length;
    setSelectedSolveIndex(nextIdx);
    setActivePhaseIndex(0);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full w-full bg-slate-950 overflow-hidden select-none">
      {/* LEFT PANEL: Scramble Details, CFOP Phase Stepper & Explanations */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col h-full bg-slate-900 border-r border-slate-800 shrink-0 overflow-y-auto">
        {/* Header: Scramble & Action Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <h2 className="font-bold text-white text-sm">CFOP Solve Walkthrough</h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNewRandomScramble}
                title="Load another WCA scramble & full solve"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-700"
              >
                <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                <span>Next Solve</span>
              </button>
            </div>
          </div>

          {/* WCA Scramble Box */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Official WCA 20-Move Scramble:
              </span>
              <button
                onClick={handleCopyScramble}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                title="Copy scramble to clipboard"
              >
                {copiedScramble ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedScramble ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs sm:text-sm text-amber-300 font-bold tracking-wide leading-relaxed">
              {currentSolve.scramble}
            </p>
          </div>

          {/* Preset Solve Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {CURATED_SOLVES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSolveIndex(idx);
                  setActivePhaseIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                  idx === selectedSolveIndex
                    ? 'bg-sky-500 text-white shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Solve #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Stepper Pills */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-300">Solve Progress (7 Steps):</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Step {activePhaseIndex + 1} of {currentSolve.phases.length}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {currentSolve.phases.map((p, idx) => {
              const isActive = idx === activePhaseIndex;
              const isPast = idx < activePhaseIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`py-1.5 px-1 rounded-lg text-center font-bold text-[10px] transition flex flex-col items-center gap-0.5 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow ring-2 ring-sky-400/50'
                      : isPast
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{p.stageName}</span>
                  <span className="text-[9px] opacity-75">{idx === 0 ? 'Cross' : idx <= 4 ? `P${idx}` : idx === 5 ? 'OLL' : 'PLL'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Phase Details & Rich Commentary */}
        <div className="p-4 space-y-4 flex-1">
          {/* Phase Title Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
                  {activePhase.stageName}
                </span>
                <h3 className="font-bold text-white text-sm">{activePhase.title}</h3>
              </div>

              {activePhase.slotName && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {activePhase.slotName}
                </span>
              )}
            </div>

            {/* Solution Moves for this Phase */}
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Phase Solution Moves:
              </span>
              <p className="font-mono text-base font-black text-sky-300 tracking-wide">
                {activePhase.moves}
              </p>
            </div>

            {/* In-depth Step Explanation */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{activePhase.explanation}</p>
              </div>

              <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-amber-200/90 text-[11px]">
                  <span className="font-bold">Speedcubing Lookahead:</span> {activePhase.lookAheadTip}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons between Phases */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={prevPhase}
              disabled={activePhaseIndex === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Phase</span>
            </button>

            <button
              onClick={nextPhase}
              disabled={activePhaseIndex === currentSolve.phases.length - 1}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/30"
            >
              <span>Next Phase</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Interactive 3D Rubik's Cube synchronized with the CFOP solve */}
      <div className="flex-1 h-full relative">
        <CubeCanvas
          key={`${currentSolve.id}_phase_${activePhaseIndex}`}
          solveMoves={phaseSolveMoves}
          setupMoves={phaseSetupMoves}
          stage={activePhase.stageName.toLowerCase() as any}
          algorithmName={`${activePhase.stageName}: ${activePhase.title}`}
          focusMode={activePhase.stageName.toLowerCase() as any}
          initialMode="walkthrough"
        />
      </div>
    </div>
  );
};
