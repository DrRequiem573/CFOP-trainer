import React, { useState, useEffect } from 'react';
import { Navbar, AppViewMode } from './components/Navbar';
import { CubeCanvas } from './components/Cube3D/CubeCanvas';
import { AlgTrainer } from './components/Trainer/AlgTrainer';
import { SpeedTimer } from './components/Timer/SpeedTimer';
import { CFOPGuide } from './components/CFOPGuide/CFOPGuide';
import { ScrambleSolveView } from './components/ScrambleSolver/ScrambleSolveView';
import { SolveHistoryModal } from './components/Timer/SolveHistoryModal';
import { AlgorithmCase, FocusLayerMode, SolveRecord } from './types/cube';
import { CFOP_ALGORITHMS } from './lib/algorithmsData';
import { parseAlgorithm, invertAlgorithm } from './lib/cubeState';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppViewMode>('trainer');
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmCase>(() => {
    // Default to T-Perm (iconic speedcubing PLL)
    return CFOP_ALGORITHMS.find((a) => a.id === 'pll-t') || CFOP_ALGORITHMS[0];
  });

  const [solveMoves, setSolveMoves] = useState<string[]>(() => {
    return parseAlgorithm(CFOP_ALGORITHMS.find((a) => a.id === 'pll-t')?.primaryAlg || '');
  });

  const [setupMoves, setSetupMoves] = useState<string[]>(() => {
    const alg = CFOP_ALGORITHMS.find((a) => a.id === 'pll-t')?.primaryAlg || '';
    return parseAlgorithm(invertAlgorithm(alg));
  });

  const [trainerMode, setTrainerMode] = useState<'walkthrough' | 'drill'>('walkthrough');
  const [focusMode, setFocusMode] = useState<FocusLayerMode>('pll');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  // Load solves on start
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cfop_cube_solves');
      if (stored) {
        setSolves(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
  }, []);

  const handleUpdateSolves = (updated: SolveRecord[]) => {
    setSolves(updated);
    try {
      localStorage.setItem('cfop_cube_solves', JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  // Handle selecting an algorithm from Trainer
  const handleSelectAlgorithm = (alg: AlgorithmCase, mode: 'walkthrough' | 'drill' = 'walkthrough') => {
    setActiveAlgorithm(alg);
    const parsedSolve = parseAlgorithm(alg.primaryAlg);
    const parsedSetup = parseAlgorithm(invertAlgorithm(alg.primaryAlg));
    setSolveMoves(parsedSolve);
    setSetupMoves(parsedSetup);
    setTrainerMode(mode);

    // Set matching layer focus
    if (alg.stage === 'cross') setFocusMode('cross');
    else if (alg.stage === 'f2l') setFocusMode('f2l');
    else if (alg.stage === 'oll') setFocusMode('oll');
    else if (alg.stage === 'pll') setFocusMode('pll');
  };

  // When timer requests to inspect a scramble on 3D cube
  const handleLoadScrambleOnCube = (scrambleStr: string) => {
    const scrambleMoves = parseAlgorithm(scrambleStr);
    setActiveAlgorithm({
      id: 'scramble_' + Date.now(),
      stage: 'cross',
      subCategory: 'WCA Scramble',
      name: 'WCA 3x3x3 Scramble',
      primaryAlg: scrambleStr,
    });
    setSolveMoves([]);
    setSetupMoves(scrambleMoves);
    setTrainerMode('walkthrough');
    setFocusMode('all');
    setCurrentMode('cube3d');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Navigation Header */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        onOpenHistory={() => setIsHistoryOpen(true)}
        solveCount={solves.length}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* MODE 1: Algorithm Trainer (Split View: Explorer + 3D Cube) */}
        {currentMode === 'trainer' && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Left Drawer / Sidebar: CFOP Algorithm Explorer */}
            <AlgTrainer
              onSelectAlgorithm={handleSelectAlgorithm}
              activeAlgId={activeAlgorithm.id}
              onSetFocusMode={setFocusMode}
            />

            {/* Right: Interactive 3D Cube Viewport */}
            <div className="flex-1 h-full relative">
              <CubeCanvas
                key={activeAlgorithm.id + '_' + trainerMode}
                solveMoves={solveMoves}
                setupMoves={setupMoves}
                stage={activeAlgorithm.stage}
                algorithmName={`${activeAlgorithm.code || activeAlgorithm.name}`}
                focusMode={focusMode}
                onFocusModeChange={setFocusMode}
                initialMode={trainerMode}
              />
            </div>
          </div>
        )}

        {/* MODE 2: Dedicated Scramble & Full CFOP Solve Walkthrough */}
        {currentMode === 'scrambleSolve' && <ScrambleSolveView />}

        {/* MODE 2: Full 3D Playground */}
        {currentMode === 'cube3d' && (
          <div className="flex-1 h-full relative">
            <CubeCanvas
              key="playground"
              solveMoves={solveMoves}
              setupMoves={setupMoves}
              stage={activeAlgorithm.stage}
              algorithmName={activeAlgorithm.name}
              focusMode={focusMode}
              onFocusModeChange={setFocusMode}
              initialMode="walkthrough"
            />
          </div>
        )}

        {/* MODE 3: Speedcubing Timer */}
        {currentMode === 'timer' && (
          <SpeedTimer
            onLoadScrambleOnCube={handleLoadScrambleOnCube}
            onOpenSolveHistory={() => setIsHistoryOpen(true)}
          />
        )}

        {/* MODE 4: CFOP Guide & PDF Reference */}
        {currentMode === 'guide' && <CFOPGuide />}
      </main>

      {/* Solve History & Analytics Modal */}
      <SolveHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        solves={solves}
        onUpdateSolves={handleUpdateSolves}
        onSelectScrambleToCube={handleLoadScrambleOnCube}
      />
    </div>
  );
}
