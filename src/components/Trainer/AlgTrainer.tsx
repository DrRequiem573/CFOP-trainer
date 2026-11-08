import React, { useState, useMemo } from 'react';
import { AlgorithmCase, CFOPStage, FocusLayerMode } from '../../types/cube';
import { CFOP_ALGORITHMS } from '../../lib/algorithmsData';
import { CubeCaseDiagram } from './CubeCaseDiagram';
import { Search, BookOpen, Star, ChevronRight, Copy, Check } from 'lucide-react';
import { invertAlgorithm } from '../../lib/cubeState';

interface AlgTrainerProps {
  onSelectAlgorithm: (alg: AlgorithmCase, mode?: 'walkthrough' | 'drill') => void;
  activeAlgId?: string;
  onSetFocusMode?: (mode: FocusLayerMode) => void;
}

export const AlgTrainer: React.FC<AlgTrainerProps> = ({
  onSelectAlgorithm,
  activeAlgId,
  onSetFocusMode,
}) => {
  const [selectedStage, setSelectedStage] = useState<CFOPStage>('pll');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cfop_favorites');
      return saved ? JSON.parse(saved) : ['pll-t', 'pll-jb', 'pll-ua', 'oll-sune', 'f2l-1'];
    } catch {
      return ['pll-t', 'pll-jb', 'pll-ua'];
    }
  });

  const [copiedAlgId, setCopiedAlgId] = useState<string | null>(null);
  const [copiedSetupId, setCopiedSetupId] = useState<string | null>(null);

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem('cfop_favorites', JSON.stringify(next));
    } catch {
      // Ignored
    }
  };

  // Categories in current stage
  const categories = useMemo(() => {
    const stageAlgs = CFOP_ALGORITHMS.filter((a) => a.stage === selectedStage);
    const set = new Set(stageAlgs.map((a) => a.subCategory));
    return ['all', ...Array.from(set)];
  }, [selectedStage]);

  // Filtered algorithms list
  const filteredAlgorithms = useMemo(() => {
    return CFOP_ALGORITHMS.filter((alg) => {
      if (alg.stage !== selectedStage) return false;
      if (selectedCategory !== 'all' && alg.subCategory !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = alg.name.toLowerCase().includes(query);
        const matchesCode = alg.code?.toLowerCase().includes(query);
        const matchesAlg = alg.primaryAlg.toLowerCase().includes(query);
        const matchesTip = alg.recognitionTip?.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesAlg || matchesTip;
      }
      return true;
    });
  }, [selectedStage, selectedCategory, searchQuery]);

  // Stage change with layer focus automatic sync
  const handleStageChange = (stage: CFOPStage) => {
    setSelectedStage(stage);
    setSelectedCategory('all');
    if (stage === 'cross') onSetFocusMode?.('cross');
    else if (stage === 'f2l') onSetFocusMode?.('f2l');
    else if (stage === 'oll') onSetFocusMode?.('oll');
    else if (stage === 'pll') onSetFocusMode?.('pll');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-full max-w-sm sm:max-w-md lg:max-w-md shrink-0 select-none">
      {/* Header: Stage Selector */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/90 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-white text-sm">Algorithm Library</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {filteredAlgorithms.length} Cases
          </span>
        </div>

        {/* 4 Stage Pills */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {(['cross', 'f2l', 'oll', 'pll'] as CFOPStage[]).map((stage) => {
            const labelMap: Record<CFOPStage, string> = {
              cross: 'Cross',
              f2l: 'F2L',
              oll: 'OLL',
              pll: 'PLL',
            };
            const active = selectedStage === stage;
            return (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  active
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labelMap[stage]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Categories Filter */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${selectedStage.toUpperCase()} cases or algs...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Category Pill Scroller */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg shrink-0 text-[11px] font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-sky-400 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Algorithms List with Visual Case Diagrams */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredAlgorithms.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <p>No algorithms match your search.</p>
          </div>
        ) : (
          filteredAlgorithms.map((alg) => {
            const isSelected = activeAlgId === alg.id;
            const isFav = favorites.includes(alg.id);

            return (
              <div
                key={alg.id}
                onClick={() => onSelectAlgorithm(alg, 'walkthrough')}
                className={`group rounded-2xl border p-3 transition cursor-pointer flex gap-3 items-center ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                {/* 2D Case Recognition Visual Diagram */}
                <div className="shrink-0 relative" title="Visual representation of this case">
                  <CubeCaseDiagram stage={alg.stage} caseId={alg.id} size={68} />
                </div>

                {/* Alg Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 shrink-0">
                        {alg.code || alg.name}
                      </span>
                      <h3 className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition">
                        {alg.name}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(alg.id, e)}
                      title="Bookmark favorite"
                      className="p-1 text-slate-500 hover:text-amber-400 transition shrink-0"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Primary Alg Box */}
                  <div className="bg-slate-950/80 rounded-lg px-2.5 py-1.5 border border-slate-800/80 mb-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-mono text-xs text-sky-200 font-bold tracking-wide truncate">
                        {alg.primaryAlg}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(alg.primaryAlg);
                          setCopiedAlgId(alg.id);
                          setTimeout(() => setCopiedAlgId(null), 1500);
                        }}
                        title="Copy algorithm"
                        className="p-0.5 text-slate-500 hover:text-slate-300 transition shrink-0"
                      >
                        {copiedAlgId === alg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Setup moves to reach this case from solved cube */}
                  {(() => {
                    const setup = alg.setupAlg || invertAlgorithm(alg.primaryAlg);
                    const isCopied = copiedSetupId === alg.id;
                    return (
                      <div className="bg-slate-950/40 rounded px-2 py-1 border border-slate-800/40 mb-1.5 flex items-center justify-between gap-1">
                        <div className="flex items-baseline gap-1 min-w-0">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider shrink-0">
                            Setup:
                          </span>
                          <span className="font-mono text-[11px] text-slate-300 truncate font-medium">
                            {setup}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(setup);
                            setCopiedSetupId(alg.id);
                            setTimeout(() => setCopiedSetupId(null), 1500);
                          }}
                          title="Copy setup moves to practice on real cube"
                          className="text-[10px] text-slate-500 hover:text-amber-400 transition shrink-0 px-1 py-0.5"
                        >
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Recognition trigger hint */}
                  {alg.recognitionTip && (
                    <p className="text-[11px] text-slate-400 truncate mb-1.5">
                      <span className="text-amber-400 font-medium">Cue: </span>
                      {alg.recognitionTip}
                    </p>
                  )}

                  {/* Clear Actions: Solve Walkthrough vs Interactive Drill */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlgorithm(alg, 'drill');
                      }}
                      title="Practice solving this case with interactive move feedback"
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 hover:bg-emerald-900 rounded-md transition"
                    >
                      🎯 Drill
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlgorithm(alg, 'walkthrough');
                      }}
                      title="Watch the algorithm solve the case step-by-step"
                      className="px-2.5 py-1 text-[11px] font-semibold text-sky-200 bg-sky-950/70 border border-sky-800/80 hover:bg-sky-900 rounded-md transition flex items-center gap-0.5"
                    >
                      <span>▶ Solve</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
