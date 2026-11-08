import React, { useState } from 'react';
import {
  Box,
  Timer,
  BookOpen,
  Volume2,
  VolumeX,
  BarChart2,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { soundManager } from '../lib/sound';

export type AppViewMode = 'trainer' | 'scrambleSolve' | 'cube3d' | 'timer' | 'guide';

interface NavbarProps {
  currentMode: AppViewMode;
  onSelectMode: (mode: AppViewMode) => void;
  onOpenHistory: () => void;
  solveCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenHistory,
  solveCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);

  const toggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-sky-600/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Box className="w-5 h-5 text-sky-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-white text-base tracking-tight">CFOP CubeMaster</h1>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              3D
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Algorithm Visualizer & Speedcubing Trainer
          </p>
        </div>
      </div>

      {/* Center Nav Modes Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => onSelectMode('trainer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            currentMode === 'trainer'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Alg Trainer</span>
        </button>

        <button
          onClick={() => onSelectMode('scrambleSolve')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            currentMode === 'scrambleSolve'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CFOP Walkthrough</span>
        </button>

        <button
          onClick={() => onSelectMode('cube3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            currentMode === 'cube3d'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Playground</span>
        </button>

        <button
          onClick={() => onSelectMode('timer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            currentMode === 'timer'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Timer</span>
          {solveCount > 0 && (
            <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.2 rounded-full text-sky-300">
              {solveCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectMode('guide')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            currentMode === 'guide'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden md:inline">CFOP Guide</span>
        </button>
      </nav>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHistory}
          title="Solve History & Stats"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition border border-transparent hover:border-slate-800"
        >
          <BarChart2 className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition border border-transparent hover:border-slate-800"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-sky-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <a
          href="/assets/aistudio/andy-klise-3x3x3-speedcubing-guide-v4_8baf3647.pdf"
          target="_blank"
          rel="noopener noreferrer"
          title="Andy Klise Speedcubing PDF Reference"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>PDF Guide</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>
    </header>
  );
};
