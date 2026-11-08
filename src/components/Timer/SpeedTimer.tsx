import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SolveRecord, TimerStats } from '../../types/cube';
import { generateScramble, formatSolveTime, calculateAoN } from '../../lib/cubeState';
import { soundManager } from '../../lib/sound';
import {
  RotateCcw,
  Copy,
  Check,
  Trash2,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  Clock,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpeedTimerProps {
  onLoadScrambleOnCube?: (scramble: string) => void;
  onOpenSolveHistory?: () => void;
}

export const SpeedTimer: React.FC<SpeedTimerProps> = ({
  onLoadScrambleOnCube,
  onOpenSolveHistory,
}) => {
  const [scramble, setScramble] = useState<string>('');
  const [copiedScramble, setCopiedScramble] = useState(false);
  const [useInspection, setUseInspection] = useState(false);

  // Timer states: 'idle' | 'holding' | 'ready' | 'inspecting' | 'running' | 'stopped'
  const [timerState, setTimerState] = useState<
    'idle' | 'holding' | 'ready' | 'inspecting' | 'running' | 'stopped'
  >('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [inspectionSeconds, setInspectionSeconds] = useState(15);

  const [solves, setSolves] = useState<SolveRecord[]>([]);
  const [lastSolve, setLastSolve] = useState<SolveRecord | null>(null);

  // Hold tracking
  const holdStartTimeRef = useRef<number>(0);
  const holdTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number>(0);
  const inspectionIntervalRef = useRef<number | null>(null);

  // Load solves from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cfop_cube_solves');
      if (stored) {
        setSolves(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
    setScramble(generateScramble(21));
  }, []);

  // Save solves to localStorage
  const saveSolves = (newSolves: SolveRecord[]) => {
    setSolves(newSolves);
    try {
      localStorage.setItem('cfop_cube_solves', JSON.stringify(newSolves));
    } catch {
      // Ignored
    }
  };

  // Stats computation
  const stats: TimerStats = React.useMemo(() => {
    if (solves.length === 0) {
      return {
        count: 0,
        best: null,
        worst: null,
        mean: null,
        ao5: null,
        ao12: null,
        ao50: null,
        ao100: null,
      };
    }

    const validSolves = solves.filter((s) => s.penalty !== 'dnf');
    const rawTimes = solves.map((s) => {
      if (s.penalty === 'dnf') return Infinity;
      return s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs;
    });

    const best = validSolves.length > 0 ? Math.min(...validSolves.map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs))) : null;
    const worst = validSolves.length > 0 ? Math.max(...validSolves.map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs))) : null;
    const mean = validSolves.length > 0 ? Math.round(validSolves.reduce((a, b) => a + (b.penalty === '+2' ? b.timeMs + 2000 : b.timeMs), 0) / validSolves.length) : null;

    const ao5 = calculateAoN(rawTimes, 5);
    const ao12 = calculateAoN(rawTimes, 12);
    const ao50 = calculateAoN(rawTimes, 50);
    const ao100 = calculateAoN(rawTimes, 100);

    return {
      count: solves.length,
      best,
      worst,
      mean,
      ao5: ao5 === Infinity ? null : ao5,
      ao12: ao12 === Infinity ? null : ao12,
      ao50: ao50 === Infinity ? null : ao50,
      ao100: ao100 === Infinity ? null : ao100,
    };
  }, [solves]);

  // Next Scramble
  const handleNewScramble = () => {
    setScramble(generateScramble(21));
  };

  // Copy Scramble
  const handleCopyScramble = () => {
    navigator.clipboard.writeText(scramble);
    setCopiedScramble(true);
    setTimeout(() => setCopiedScramble(false), 1500);
  };

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const finalTime = Date.now() - startTimestampRef.current;
    setElapsedMs(finalTime);
    setTimerState('stopped');

    soundManager.playFinishChime();

    // Check if new PB
    const previousBest = solves.filter((s) => s.penalty !== 'dnf').map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));
    const isNewPB = previousBest.length > 0 && finalTime < Math.min(...previousBest);
    if (isNewPB) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignored
      }
    }

    const newRecord: SolveRecord = {
      id: 'solve_' + Date.now(),
      timeMs: finalTime,
      scramble,
      date: Date.now(),
      session: 'Main Session',
    };

    setLastSolve(newRecord);
    const updated = [newRecord, ...solves];
    saveSolves(updated);

    // Prepare next scramble
    handleNewScramble();
  }, [scramble, solves]);

  // Start Inspection
  const startInspection = useCallback(() => {
    setTimerState('inspecting');
    setInspectionSeconds(15);

    let sec = 15;
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);

    inspectionIntervalRef.current = window.setInterval(() => {
      sec -= 1;
      setInspectionSeconds(sec);

      if (sec === 7 || sec === 3) {
        soundManager.playInspectionAlert();
      }

      if (sec <= 0) {
        if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
        // Start solve or DNF if not started
      }
    }, 1000);
  }, []);

  // Start Running the Timer
  const startSolveTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }

    setTimerState('running');
    startTimestampRef.current = Date.now();

    timerIntervalRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimestampRef.current);
    }, 10);
  }, []);

  // Handlers for Hold & Release
  const handleTriggerDown = useCallback(() => {
    if (timerState === 'running') {
      stopTimer();
      return;
    }

    if (timerState === 'inspecting') {
      // Holding space while inspecting prepares the solve
      setTimerState('holding');
      holdStartTimeRef.current = Date.now();
      holdTimeoutRef.current = window.setTimeout(() => {
        setTimerState('ready');
        soundManager.playReadyBeep();
      }, 400);
      return;
    }

    if (timerState === 'idle' || timerState === 'stopped') {
      if (useInspection) {
        startInspection();
      } else {
        setTimerState('holding');
        holdStartTimeRef.current = Date.now();
        holdTimeoutRef.current = window.setTimeout(() => {
          setTimerState('ready');
          soundManager.playReadyBeep();
        }, 450);
      }
    }
  }, [timerState, useInspection, startInspection, stopTimer]);

  const handleTriggerUp = useCallback(() => {
    if (timerState === 'holding') {
      // Released too early
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      setTimerState('idle');
    } else if (timerState === 'ready') {
      // Released ready hold -> START!
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      startSolveTimer();
    }
  }, [timerState, startSolveTimer]);

  // Keyboard Event Listeners for Spacebar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          handleTriggerDown();
        }
      } else if (timerState === 'running') {
        // Any key stops the timer
        stopTimer();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTriggerUp();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, [timerState, handleTriggerDown, handleTriggerUp, stopTimer]);

  // Penalties
  const togglePenalty = (penalty: '+2' | 'dnf') => {
    if (!lastSolve) return;
    const currentPenalty = lastSolve.penalty;
    const newPenalty = currentPenalty === penalty ? 'none' : penalty;

    const updatedLast: SolveRecord = { ...lastSolve, penalty: newPenalty };
    setLastSolve(updatedLast);

    const updated = solves.map((s) => (s.id === updatedLast.id ? updatedLast : s));
    saveSolves(updated);
  };

  const deleteLastSolve = () => {
    if (!lastSolve) return;
    const updated = solves.filter((s) => s.id !== lastSolve.id);
    saveSolves(updated);
    setLastSolve(updated[0] || null);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-4 lg:p-6 overflow-y-auto">
      {/* Top Header: Scramble Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mb-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            WCA 3x3x3 Scramble
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLoadScrambleOnCube?.(scramble)}
              title="Visualize scramble on 3D Cube"
              className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 rounded-lg transition flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              View on 3D Cube
            </button>
            <button
              onClick={handleCopyScramble}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Copy Scramble"
            >
              {copiedScramble ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleNewScramble}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="New Scramble"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="font-mono text-base sm:text-xl text-center text-slate-100 font-semibold tracking-wide py-2 leading-relaxed">
          {scramble}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={useInspection}
              onChange={(e) => setUseInspection(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>15s WCA Inspection</span>
          </label>
          <span className="hidden sm:inline text-slate-500">Hold Space or Touch below to arm timer</span>
        </div>
      </div>

      {/* Main Touch & Stackmat Timer Area */}
      <div
        onMouseDown={handleTriggerDown}
        onMouseUp={handleTriggerUp}
        onTouchStart={handleTriggerDown}
        onTouchEnd={handleTriggerUp}
        className={`flex-1 min-h-[280px] max-w-4xl mx-auto w-full rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition select-none shadow-2xl relative p-6 ${
          timerState === 'ready'
            ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-500/20'
            : timerState === 'holding'
            ? 'bg-amber-950/40 border-amber-500'
            : timerState === 'inspecting'
            ? 'bg-rose-950/40 border-rose-500'
            : timerState === 'running'
            ? 'bg-slate-900/40 border-sky-500'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Inspection countdown or Timer Digits */}
        {timerState === 'inspecting' ? (
          <div className="flex flex-col items-center animate-pulse">
            <span className="text-sm uppercase tracking-widest text-rose-400 font-bold mb-2">
              Inspection Time
            </span>
            <span className="font-mono text-8xl font-black text-rose-400">{inspectionSeconds}</span>
            <span className="text-xs text-slate-400 mt-3">Hold Space/Screen to start</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {timerState === 'ready' && (
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3 animate-bounce">
                READY — Release to Start!
              </span>
            )}
            {timerState === 'holding' && (
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-3">
                Holding...
              </span>
            )}
            {timerState === 'running' && (
              <span className="text-xs uppercase tracking-widest text-sky-400 font-bold mb-3">
                Solving... Tap anywhere to stop
              </span>
            )}

            <span
              className={`font-mono text-7xl sm:text-9xl font-black tracking-tight ${
                timerState === 'ready'
                  ? 'text-emerald-400'
                  : timerState === 'holding'
                  ? 'text-amber-400'
                  : timerState === 'running'
                  ? 'text-sky-300'
                  : 'text-white'
              }`}
            >
              {formatSolveTime(elapsedMs, lastSolve?.penalty)}
            </span>

            {/* Quick Penalties on Last Solve */}
            {timerState === 'stopped' && lastSolve && (
              <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => togglePenalty('+2')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    lastSolve.penalty === '+2'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +2 sec
                </button>
                <button
                  onClick={() => togglePenalty('dnf')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    lastSolve.penalty === 'dnf'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  DNF
                </button>
                <button
                  onClick={deleteLastSolve}
                  title="Delete Solve"
                  className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Statistics Cards */}
      <div className="max-w-4xl mx-auto w-full mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>Personal Best</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-mono text-2xl font-bold text-amber-300">
            {stats.best ? formatSolveTime(stats.best) : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>Current ao5</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-mono text-2xl font-bold text-sky-300">
            {stats.ao5 ? formatSolveTime(stats.ao5) : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>Current ao12</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-mono text-2xl font-bold text-purple-300">
            {stats.ao12 ? formatSolveTime(stats.ao12) : '--'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>Total Solves</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-emerald-300">{stats.count}</span>
            {stats.count > 0 && (
              <button
                onClick={onOpenSolveHistory}
                className="text-xs text-sky-400 hover:underline"
              >
                View all →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Solves Preview Strip */}
      {solves.length > 0 && (
        <div className="max-w-4xl mx-auto w-full mt-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400 overflow-x-auto">
          <span className="font-bold uppercase text-slate-500 mr-2 shrink-0">Recent:</span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {solves.slice(0, 8).map((s, idx) => (
              <span
                key={s.id}
                className={`font-mono px-2 py-1 rounded bg-slate-800 ${
                  idx === 0 ? 'text-white font-bold bg-slate-700' : 'text-slate-300'
                }`}
              >
                {formatSolveTime(s.timeMs, s.penalty)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
