import React, { useState } from 'react';
import { SolveRecord, TimerStats } from '../../types/cube';
import { formatSolveTime } from '../../lib/cubeState';
import { Trash2, Download, Copy, Check, X, TrendingDown, Clock, Award, BarChart2 } from 'lucide-react';

interface SolveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  solves: SolveRecord[];
  onUpdateSolves: (updated: SolveRecord[]) => void;
  onSelectScrambleToCube?: (scramble: string) => void;
}

export const SolveHistoryModal: React.FC<SolveHistoryModalProps> = ({
  isOpen,
  onClose,
  solves,
  onUpdateSolves,
  onSelectScrambleToCube,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const validSolves = solves.filter((s) => s.penalty !== 'dnf');
  const validTimes = validSolves.map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));

  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const worstTime = validTimes.length > 0 ? Math.max(...validTimes) : null;
  const averageTime =
    validTimes.length > 0
      ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
      : null;

  // Calculate Standard Deviation
  const stdDev =
    validTimes.length > 1 && averageTime !== null
      ? Math.round(
          Math.sqrt(
            validTimes.reduce((acc, t) => acc + Math.pow(t - averageTime, 2), 0) /
              (validTimes.length - 1)
          )
        )
      : null;

  const handleDeleteSolve = (id: string) => {
    const updated = solves.filter((s) => s.id !== id);
    onUpdateSolves(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all solve history? This cannot be undone.')) {
      onUpdateSolves([]);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(solves, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `cfop_solves_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleCopySummary = () => {
    const summary = `CFOP CubeMaster Solves (${solves.length}):
Best: ${bestTime ? formatSolveTime(bestTime) : '--'}
Average: ${averageTime ? formatSolveTime(averageTime) : '--'}
Recent 5: ${solves.slice(0, 5).map((s) => formatSolveTime(s.timeMs, s.penalty)).join(', ')}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Trend Chart data points (reverse chronological so oldest is left, newest right)
  const chartSolves = solves.slice(0, 30).reverse();
  const maxChartTime = Math.max(...chartSolves.map((s) => s.timeMs), 30000);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-none z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-sky-400" />
              Solve History & Session Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tracking your speedcubing progress, averages, and consistency.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-xs text-slate-400 font-medium">Session Solves</span>
              <p className="font-mono text-2xl font-bold text-white mt-1">{solves.length}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-xs text-amber-400 font-medium">Best Single (PB)</span>
              <p className="font-mono text-2xl font-bold text-amber-300 mt-1">
                {bestTime ? formatSolveTime(bestTime) : '--'}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-xs text-sky-400 font-medium">Session Mean</span>
              <p className="font-mono text-2xl font-bold text-sky-300 mt-1">
                {averageTime ? formatSolveTime(averageTime) : '--'}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-xs text-purple-400 font-medium">Std Deviation</span>
              <p className="font-mono text-2xl font-bold text-purple-300 mt-1">
                {stdDev ? `±${(stdDev / 1000).toFixed(2)}s` : '--'}
              </p>
            </div>
          </div>

          {/* Simple Visual Trend Chart */}
          {chartSolves.length >= 3 && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  Solve Time Trend (Last {chartSolves.length} Solves)
                </span>
                <span>Fastest: {bestTime ? formatSolveTime(bestTime) : '--'}</span>
              </div>
              <div className="h-28 flex items-end gap-1.5 w-full pt-4 border-b border-slate-800">
                {chartSolves.map((s, idx) => {
                  const effective = s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs;
                  const heightPercent = s.penalty === 'dnf' ? 100 : Math.min(100, Math.max(12, (effective / maxChartTime) * 100));
                  const isPB = effective === bestTime;
                  return (
                    <div
                      key={s.id}
                      title={`#${idx + 1}: ${formatSolveTime(s.timeMs, s.penalty)}`}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    >
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all ${
                          s.penalty === 'dnf'
                            ? 'bg-rose-500/70'
                            : isPB
                            ? 'bg-amber-400'
                            : 'bg-sky-500/70 group-hover:bg-sky-400'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solves Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                All Solves ({solves.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleExportJson}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
                {solves.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {solves.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No solves recorded yet.</p>
                <p className="text-xs text-slate-600 mt-1">Arm the timer using Spacebar and record your first solve!</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Scramble</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {solves.map((s, idx) => {
                      const effective = s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs;
                      const isPB = effective === bestTime;
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 text-slate-500">{solves.length - idx}</td>
                          <td className="p-3 font-bold text-sm">
                            <span
                              className={
                                s.penalty === 'dnf'
                                  ? 'text-rose-400'
                                  : isPB
                                  ? 'text-amber-400 flex items-center gap-1'
                                  : 'text-white'
                              }
                            >
                              {formatSolveTime(s.timeMs, s.penalty)}
                              {isPB && <Award className="w-3.5 h-3.5 text-amber-400 inline" />}
                            </span>
                          </td>
                          <td
                            className="p-3 text-slate-400 font-sans truncate max-w-xs cursor-pointer hover:text-sky-400"
                            title="Click to view scramble on 3D cube"
                            onClick={() => {
                              onSelectScrambleToCube?.(s.scramble);
                              onClose();
                            }}
                          >
                            {s.scramble}
                          </td>
                          <td className="p-3 text-slate-500 font-sans">
                            {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteSolve(s.id)}
                              className="text-slate-500 hover:text-rose-400 transition p-1"
                              title="Delete Solve"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
