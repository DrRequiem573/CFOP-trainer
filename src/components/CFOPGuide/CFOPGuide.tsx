import React from 'react';
import { BookOpen, ExternalLink, Lightbulb, Zap, Award, Layers, Compass, CheckCircle2 } from 'lucide-react';

export const CFOPGuide: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 lg:p-10 text-slate-300 max-w-5xl mx-auto space-y-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            Speedcubing Master Guide
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The CFOP (Fridrich) Method
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            The world's most widely used speedcubing system, popularized by Jessica Fridrich.
            Master each layer systematically: <strong>Cross</strong>, <strong>F2L</strong>,{' '}
            <strong>OLL</strong>, and <strong>PLL</strong>.
          </p>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <a
              href="/assets/aistudio/andy-klise-3x3x3-speedcubing-guide-v4_8baf3647.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30"
            >
              <span>Open Andy Klise's Speedcubing Guide PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-slate-400">
              Algorithms by Dan Harris & Erik Akkersdijk
            </span>
          </div>
        </div>
      </div>

      {/* Layer Roadmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Cross */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-lg border border-white/20">
                C
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">1. Cross (White Bottom)</h3>
                <span className="text-xs text-slate-400">Target: ≤ 6–7 moves (~82% ≤ 6)</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
              Step 1
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            The cross forms the foundation on the bottom face (White). 99.95% of all cross states can be
            solved in 7 moves or fewer. Always solve the cross on the bottom (D face) so your top view is
            ready to spot F2L pairs immediately.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Inspection Mastery:</strong> Use the 15-second WCA inspection to plan all 4 cross edges before turning the cube.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Color Neutrality:</strong> Start with White, then expand to Yellow or other faces as your recognition improves.</span>
            </div>
          </div>
        </div>

        {/* Step 2: F2L */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/20">
                F
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">2. F2L (First 2 Layers)</h3>
                <span className="text-xs text-slate-400">41 Algorithmic & Intuitive Cases</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
              Step 2
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Instead of solving corner-by-corner and edge-by-edge, F2L pairs a corner with its matching
            middle-layer edge in the U layer, then inserts both into the target slot simultaneously.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span><strong>Green Family:</strong> Based on the Sexy Move <code className="text-emerald-300 font-mono">R U R' U'</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
              <span><strong>Blue Family:</strong> Based on the Sune trigger <code className="text-sky-300 font-mono">R U R' U R U2 R'</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span><strong>Orange Family:</strong> Sledgehammer trigger <code className="text-amber-300 font-mono">R' F R F'</code></span>
            </div>
          </div>
        </div>

        {/* Step 3: OLL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-lg border border-amber-500/20">
                O
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">3. OLL (Orient Last Layer)</h3>
                <span className="text-xs text-slate-400">2-Look (9 algs) or Full (57 algs)</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 font-semibold">
              Step 3
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Turn all yellow stickers to face upwards on the U layer. With 2-Look OLL, you only need 2
            sub-steps:
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-400">1. Edge Cross:</span>
              <span>Orient top edges (Line <code className="text-amber-200 font-mono">F (R U R' U') F'</code>, Small L <code className="text-amber-200 font-mono">f (R U R' U') f'</code>, Dot).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-400">2. Corners:</span>
              <span>Orient the 7 corner variations (Sune, Anti-Sune, Car/H, Blinker/Pi, Headlights/U, Chameleon/T, Bowtie/L).</span>
            </div>
          </div>
        </div>

        {/* Step 4: PLL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black text-lg border border-sky-500/20">
                P
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">4. PLL (Permute Last Layer)</h3>
                <span className="text-xs text-slate-400">All 21 Permutations Mastered</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60 font-semibold">
              Step 4
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            The final step! All yellow stickers are already facing UP; now rearrange pieces into their
            solved slots to finish the cube.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2 text-xs">
            <div>
              <strong className="text-sky-300">Edges Only (4):</strong> Ub, Ua, H, Z
            </div>
            <div>
              <strong className="text-sky-300">Corners Only (3):</strong> Aa, Ab, E
            </div>
            <div>
              <strong className="text-sky-300">Adjacent Swaps (6):</strong> T-Perm, Ja, Jb, Ra, Rb, F
            </div>
            <div>
              <strong className="text-sky-300">Diagonal Swaps (4):</strong> V, Y, Na, Nb
            </div>
            <div>
              <strong className="text-sky-300">G-Permutations (4):</strong> Ga, Gb, Gc, Gd (Double Spins)
            </div>
          </div>
        </div>
      </div>

      {/* Pro Finger Tricks & Mechanics Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Essential Finger Tricks & Execution</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-sky-400 font-bold uppercase text-[11px]">The Sexy Move</span>
            <p className="font-mono text-sm text-white font-bold">R U R' U'</p>
            <p className="text-slate-400">
              The fundamental trigger of cubing. Right index pulls U, right thumb guides R' down, left index pushes U'.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-amber-400 font-bold uppercase text-[11px]">The Sledgehammer</span>
            <p className="font-mono text-sm text-white font-bold">R' F R F'</p>
            <p className="text-slate-400">
              Inverts corner-edge pairs and orients top edges simultaneously without leaving your grip.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-emerald-400 font-bold uppercase text-[11px]">M-Slice Ring Flick</span>
            <p className="font-mono text-sm text-white font-bold">M2' / M'</p>
            <p className="text-slate-400">
              Push bottom-back D edge with your left ring finger, followed by middle finger for effortless M2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
