import React from 'react';
import { CFOPStage } from '../../types/cube';
import { getCaseSimulatedState, SIM_COLORS } from '../../lib/cubeSimulator';
import { CFOP_ALGORITHMS } from '../../lib/algorithmsData';
import { invertAlgorithm } from '../../lib/cubeState';

interface CubeCaseDiagramProps {
  stage: CFOPStage;
  caseId: string;
  setupMoves?: string;
  size?: number; // width & height in px
  className?: string;
}

// Arrow color constants for PLL
const ARROW_COLOR = '#00E5FF';
const ARROW_ALT = '#FF2A6D';

function getSetupForCase(caseId: string, stage: CFOPStage): string {
  const found = CFOP_ALGORITHMS.find((a) => a.id === caseId);
  if (found?.setupAlg) return found.setupAlg;
  if (found?.primaryAlg) return invertAlgorithm(found.primaryAlg);

  // Fallback defaults
  if (stage === 'f2l') return "R U R' U'";
  if (stage === 'pll') return "R U R' U' R' F R2 U' R' U' R U R' F'";
  return "F R U R' U' F'";
}

/**
 * Procedural SVG Case Diagrams for CFOP Algorithms
 * Dynamically rendered directly from the 3D Rubik's cube state simulation!
 * - F2L: Canonical 3D Isometric Rubik's cube showing the exact sticker positions
 *        of the active pair and glowing Front-Right (FR) target slot.
 * - PLL: Top yellow face + 12 perimeter side-facelets derived from setup moves.
 * - OLL: 3x3 top yellow facelets + outer yellow orientation bars.
 */
export const CubeCaseDiagram: React.FC<CubeCaseDiagramProps> = ({
  stage,
  caseId,
  setupMoves,
  size = 68,
  className = '',
}) => {
  const effectiveSetup = setupMoves || getSetupForCase(caseId, stage);

  // =========================================================================
  // 1. F2L DIAGRAM: Official Andy Klise Guide Diagram with 3D Simulation Fallback
  // =========================================================================
  if (stage === 'f2l') {
    // Check if canonical Andy Klise image is available (cases 1 to 41)
    const match = caseId.match(/f2l-(\d+)/);
    const caseNum = match ? parseInt(match[1], 10) : null;

    if (caseNum && caseNum >= 1 && caseNum <= 41) {
      return (
        <div
          className={`shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-[#0c0f17] flex items-center justify-center p-0.5 relative group/img ${className}`}
          style={{ width: size, height: size }}
        >
          <img
            src={`/assets/f2l/f2l_${caseNum}.png`}
            alt={`F2L ${caseNum} recognition diagram`}
            className="w-full h-full object-contain filter contrast-125 brightness-105"
            loading="lazy"
            onError={(e) => {
              // Hide broken image and fallback to procedural render
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    const state = getCaseSimulatedState('f2l', effectiveSetup);

    // Exact isometric projection formulas
    // Top Face (U): c = col 0..3 (Left to Right), r = row 0..3 (Back to Front)
    const ptU = (c: number, r: number): [number, number] => {
      const px = 50 + (c - r) * 10.5;
      const py = 12 + (c + r) * 6.0;
      return [Number(px.toFixed(1)), Number(py.toFixed(1))];
    };

    // Front Face (F): c = col 0..3 (Left to Right), y = row 0..3 (Top to Bottom)
    const ptF = (c: number, y: number): [number, number] => {
      const px = 18.5 + c * 10.5;
      const py = 30 + c * 6.0 + y * 13.0;
      return [Number(px.toFixed(1)), Number(py.toFixed(1))];
    };

    // Right Face (R): c = col 0..3 (Front to Back), y = row 0..3 (Top to Bottom)
    const ptR = (c: number, y: number): [number, number] => {
      const px = 50 + c * 10.5;
      const py = 48 - c * 6.0 + y * 13.0;
      return [Number(px.toFixed(1)), Number(py.toFixed(1))];
    };

    const quad = (p1: [number, number], p2: [number, number], p3: [number, number], p4: [number, number]) =>
      `${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}`;

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`shrink-0 drop-shadow-sm select-none ${className}`}
      >
        <rect x="2" y="2" width="96" height="96" rx="10" fill="#0c0f17" stroke="#1f2937" strokeWidth="2" />

        <g>
          {/* Top (U) Face: r = Back to Front (0..2), c = Left to Right (0..2) */}
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const p1 = ptU(c, r);
              const p2 = ptU(c + 1, r);
              const p3 = ptU(c + 1, r + 1);
              const p4 = ptU(c, r + 1);
              const color = state.U[r][c] || SIM_COLORS.inactive;
              const isLit = color !== SIM_COLORS.inactive && color !== '#9e7a04';

              return (
                <polygon
                  key={`u-${r}-${c}`}
                  points={quad(p1, p2, p3, p4)}
                  fill={color}
                  stroke={isLit ? '#ffffff' : SIM_COLORS.inactiveBorder}
                  strokeWidth={isLit ? '1.5' : '0.9'}
                  opacity={isLit ? 1 : 0.75}
                />
              );
            })
          )}

          {/* Front (F) Face: y = Top to Bottom (0..2), c = Left to Right (0..2) */}
          {[0, 1, 2].map((y) =>
            [0, 1, 2].map((c) => {
              const p1 = ptF(c, y);
              const p2 = ptF(c + 1, y);
              const p3 = ptF(c + 1, y + 1);
              const p4 = ptF(c, y + 1);
              const color = state.F[y][c] || SIM_COLORS.inactive;
              const isLit = color !== SIM_COLORS.inactive && color !== '#0b5327';

              return (
                <polygon
                  key={`f-${y}-${c}`}
                  points={quad(p1, p2, p3, p4)}
                  fill={color}
                  stroke={isLit ? '#ffffff' : SIM_COLORS.inactiveBorder}
                  strokeWidth={isLit ? '1.5' : '0.9'}
                  opacity={isLit ? 1 : 0.75}
                />
              );
            })
          )}

          {/* Right (R) Face: y = Top to Bottom (0..2), c = Front to Back (0..2) */}
          {[0, 1, 2].map((y) =>
            [0, 1, 2].map((c) => {
              const p1 = ptR(c, y);
              const p2 = ptR(c + 1, y);
              const p3 = ptR(c + 1, y + 1);
              const p4 = ptR(c, y + 1);
              const color = state.R[y][c] || SIM_COLORS.inactive;
              const isLit = color !== SIM_COLORS.inactive && color !== '#730d17';

              return (
                <polygon
                  key={`r-${y}-${c}`}
                  points={quad(p1, p2, p3, p4)}
                  fill={color}
                  stroke={isLit ? '#ffffff' : SIM_COLORS.inactiveBorder}
                  strokeWidth={isLit ? '1.5' : '0.9'}
                  opacity={isLit ? 1 : 0.75}
                />
              );
            })
          )}

          {/* Glowing Target Front-Right Slot Bracket (c=2 on F, c=0 on R, y=1..3) */}
          <polygon
            points={quad(
              ptF(2, 1),
              ptF(3, 1),
              ptF(3, 3),
              ptF(2, 3)
            )}
            fill="none"
            stroke={SIM_COLORS.targetSlot}
            strokeWidth="2.0"
            strokeDasharray="3.5,2.0"
            opacity="0.95"
          />
          <polygon
            points={quad(
              ptR(0, 1),
              ptR(1, 1),
              ptR(1, 3),
              ptR(0, 3)
            )}
            fill="none"
            stroke={SIM_COLORS.targetSlot}
            strokeWidth="2.0"
            strokeDasharray="3.5,2.0"
            opacity="0.95"
          />
        </g>
      </svg>
    );
  }

  // =========================================================================
  // 2. PLL DIAGRAMS: Top Yellow Grid + 12 Authentic Side-Facelets & Arrows
  // =========================================================================
  if (stage === 'pll') {
    const state = getCaseSimulatedState('pll', effectiveSetup);

    // Side facelets around top layer
    const sideTop = state.B[0];   // Back face top row
    const sideBottom = state.F[0];// Front face top row
    const sideLeft = state.L[0];  // Left face top row
    const sideRight = state.R[0]; // Right face top row

    let arrowType = 'none';
    if (caseId.includes('t')) arrowType = 't-swap';
    else if (caseId.includes('ua')) arrowType = 'ua-cycle';
    else if (caseId.includes('ub')) arrowType = 'ub-cycle';
    else if (caseId.includes('h')) arrowType = 'h-swap';
    else if (caseId.includes('z')) arrowType = 'z-swap';
    else if (caseId.includes('aa')) arrowType = 'aa-cycle';
    else if (caseId.includes('ab')) arrowType = 'ab-cycle';
    else if (caseId.includes('e')) arrowType = 'e-swap';
    else if (caseId.includes('ja')) arrowType = 'ja-swap';
    else if (caseId.includes('jb')) arrowType = 'jb-swap';
    else if (caseId.includes('ra')) arrowType = 'ra-swap';
    else if (caseId.includes('rb')) arrowType = 'rb-swap';
    else if (caseId.includes('f')) arrowType = 'f-swap';
    else if (caseId.includes('v')) arrowType = 'v-swap';
    else if (caseId.includes('y')) arrowType = 'y-swap';
    else if (caseId.includes('na') || caseId.includes('nb')) arrowType = 'na-swap';
    else if (caseId.includes('g')) arrowType = 'g-cycle';

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`shrink-0 drop-shadow-sm select-none ${className}`}
      >
        <defs>
          <marker id="pll-arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill={ARROW_COLOR} />
          </marker>
          <marker id="pll-arrow-alt" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill={ARROW_ALT} />
          </marker>
        </defs>

        <rect x="2" y="2" width="96" height="96" rx="10" fill="#0c0f17" stroke="#1f2937" strokeWidth="2" />

        {/* Prominent 12 side facelets */}
        {sideTop.map((c, i) => (
          <rect key={`st-${i}`} x={21 + i * 20} y="4" width="18" height="8.5" rx="2" fill={c} stroke="#0f172a" strokeWidth="1" />
        ))}
        {sideBottom.map((c, i) => (
          <rect key={`sb-${i}`} x={21 + i * 20} y="87.5" width="18" height="8.5" rx="2" fill={c} stroke="#0f172a" strokeWidth="1" />
        ))}
        {sideLeft.map((c, i) => (
          <rect key={`sl-${i}`} x="4" y={21 + i * 20} width="8.5" height="18" rx="2" fill={c} stroke="#0f172a" strokeWidth="1" />
        ))}
        {sideRight.map((c, i) => (
          <rect key={`sr-${i}`} x="87.5" y={21 + i * 20} width="8.5" height="18" rx="2" fill={c} stroke="#0f172a" strokeWidth="1" />
        ))}

        {/* 3x3 Yellow Face */}
        <g transform="translate(18, 18)">
          {[0, 1, 2].map((rIdx) =>
            [0, 1, 2].map((cIdx) => (
              <rect
                key={`top-${rIdx}-${cIdx}`}
                x={cIdx * 22}
                y={rIdx * 22}
                width="20"
                height="20"
                rx="3.5"
                fill={SIM_COLORS.U}
                stroke="#ca8a04"
                strokeWidth="1.2"
              />
            ))
          )}
        </g>

        {/* Movement Arrows */}
        {arrowType === 't-swap' && (
          <g strokeWidth="3.2" strokeLinecap="round" fill="none">
            <path d="M 72 32 L 72 68" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 72 L 72 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'ua-cycle' && (
          <g stroke={ARROW_COLOR} strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 50 70 L 68 50 L 32 50 Z" markerEnd="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'ub-cycle' && (
          <g stroke={ARROW_COLOR} strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 50 70 L 32 50 L 68 50 Z" markerEnd="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'h-swap' && (
          <g stroke={ARROW_COLOR} strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 50 30 L 50 70" markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
            <path d="M 30 50 L 70 50" markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'z-swap' && (
          <g stroke={ARROW_COLOR} strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 50 70 L 70 50" markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
            <path d="M 50 30 L 30 50" markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'aa-cycle' && (
          <g stroke={ARROW_ALT} strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 70 70 L 70 30 L 30 70 Z" markerEnd="url(#pll-arrow-alt)" />
          </g>
        )}
        {arrowType === 'ab-cycle' && (
          <g stroke={ARROW_ALT} strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 70 30 L 70 70 L 30 70 Z" markerEnd="url(#pll-arrow-alt)" />
          </g>
        )}
        {arrowType === 'e-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 30 30 L 70 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 70 30 L 30 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
          </g>
        )}
        {arrowType === 'ja-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 70 30 L 70 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 30 L 70 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'jb-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 30 30 L 30 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 30 L 30 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'ra-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 70 30 L 70 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 70 L 70 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'rb-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 30 30 L 30 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 30 L 30 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'f-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 30 30 L 70 30" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 30 50 L 70 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'v-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 70 30 L 30 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 70 50 L 50 70" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'y-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 30 30 L 70 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 30 L 30 50" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'na-swap' && (
          <g strokeWidth="3.0" strokeLinecap="round" fill="none">
            <path d="M 30 30 L 70 70" stroke={ARROW_ALT} markerEnd="url(#pll-arrow-alt)" markerStart="url(#pll-arrow-alt)" />
            <path d="M 50 30 L 50 70" stroke={ARROW_COLOR} markerEnd="url(#pll-arrow-head)" markerStart="url(#pll-arrow-head)" />
          </g>
        )}
        {arrowType === 'g-cycle' && (
          <g strokeWidth="2.8" strokeLinecap="round" fill="none">
            <circle cx="50" cy="50" r="16" stroke={ARROW_COLOR} strokeDasharray="6,4" />
            <path d="M 66 50 L 66 54 L 62 50 Z" fill={ARROW_COLOR} stroke="none" />
          </g>
        )}
      </svg>
    );
  }

  // =========================================================================
  // 3. OLL DIAGRAMS
  // =========================================================================
  if (stage === 'oll') {
    // Generate simulated top facelets from setup moves
    const state = getCaseSimulatedState('oll', effectiveSetup);

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`shrink-0 drop-shadow-sm select-none ${className}`}
      >
        <rect x="2" y="2" width="96" height="96" rx="10" fill="#0c0f17" stroke="#1f2937" strokeWidth="2" />

        {/* Outer yellow perimeter orientation bars */}
        {state.B[0].map((c, i) =>
          c === SIM_COLORS.U ? (
            <rect key={`ot-${i}`} x={21 + i * 20} y="5" width="18" height="7" rx="2" fill={SIM_COLORS.U} />
          ) : null
        )}
        {state.F[0].map((c, i) =>
          c === SIM_COLORS.U ? (
            <rect key={`ob-${i}`} x={21 + i * 20} y="88" width="18" height="7" rx="2" fill={SIM_COLORS.U} />
          ) : null
        )}
        {state.L[0].map((c, i) =>
          c === SIM_COLORS.U ? (
            <rect key={`ol-${i}`} x="5" y={21 + i * 20} width="7" height="18" rx="2" fill={SIM_COLORS.U} />
          ) : null
        )}
        {state.R[0].map((c, i) =>
          c === SIM_COLORS.U ? (
            <rect key={`or-${i}`} x="88" y={21 + i * 20} width="7" height="18" rx="2" fill={SIM_COLORS.U} />
          ) : null
        )}

        {/* 3x3 Top Grid */}
        <g transform="translate(18, 18)">
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const isYellow = state.U[r][c] === SIM_COLORS.U;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={c * 22}
                  y={r * 22}
                  width="20"
                  height="20"
                  rx="3.5"
                  fill={isYellow ? SIM_COLORS.U : SIM_COLORS.inactive}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              );
            })
          )}
        </g>
      </svg>
    );
  }

  // =========================================================================
  // 4. CROSS DIAGRAM
  // =========================================================================
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 drop-shadow-sm select-none ${className}`}
    >
      <rect x="2" y="2" width="96" height="96" rx="10" fill="#0c0f17" stroke="#1f2937" strokeWidth="2" />
      <g transform="translate(18, 18)">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const isCross = r === 1 || c === 1;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * 22}
                y={r * 22}
                width="20"
                height="20"
                rx="3.5"
                fill={isCross ? SIM_COLORS.D : SIM_COLORS.inactive}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            );
          })
        )}
      </g>
    </svg>
  );
};
