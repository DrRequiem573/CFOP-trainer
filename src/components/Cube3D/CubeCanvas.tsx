import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CUBE_COLORS, MOVE_EXPLANATIONS, invertMove } from '../../lib/cubeState';
import { CFOPStage, FocusLayerMode } from '../../types/cube';
import { soundManager } from '../../lib/sound';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  HelpCircle,
  SlidersHorizontal,
  Target,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CubeCanvasProps {
  solveMoves?: string[];
  setupMoves?: string[];
  algorithmName?: string;
  stage?: CFOPStage;
  focusMode?: FocusLayerMode;
  onFocusModeChange?: (mode: FocusLayerMode) => void;
  initialMode?: 'walkthrough' | 'drill';
}

interface CubieData {
  mesh: THREE.Group;
  initialX: number;
  initialY: number;
  initialZ: number;
  isF2LCorner: boolean; // Front-Right-Bottom corner
  isF2LEdge: boolean;   // Front-Right-Middle edge
  stickers: { face: string; mesh: THREE.Mesh; baseMaterial: THREE.MeshPhysicalMaterial }[];
  baseBodyMaterial: THREE.MeshStandardMaterial;
}

export const CubeCanvas: React.FC<CubeCanvasProps> = ({
  solveMoves = [],
  setupMoves = [],
  algorithmName = 'CFOP Algorithm',
  stage = 'pll',
  focusMode = 'all',
  onFocusModeChange,
  initialMode = 'walkthrough',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Mode: 'walkthrough' (watch/step solve) or 'drill' (interactive practice)
  const [activeTabMode, setActiveTabMode] = useState<'walkthrough' | 'drill'>(initialMode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showManualTurns, setShowManualTurns] = useState(false);
  const [currentMoveDisplay, setCurrentMoveDisplay] = useState<string>('');
  const [showNotationHelp, setShowNotationHelp] = useState(false);
  const [highlightConcernedPieces, setHighlightConcernedPieces] = useState(true);

  // Drill mode state
  const [drillStep, setDrillStep] = useState(0);
  const [hideDrillMoves, setHideDrillMoves] = useState(false);
  const [drillStartTime, setDrillStartTime] = useState<number | null>(null);
  const [drillFinishedTime, setDrillFinishedTime] = useState<number | null>(null);
  const [wrongMoveNotice, setWrongMoveNotice] = useState<string | null>(null);

  // Solved state
  const [isCaseSolved, setIsCaseSolved] = useState(false);
  const [copiedSetup, setCopiedSetup] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cubeRootGroupRef = useRef<THREE.Group | null>(null);
  const pivotGroupRef = useRef<THREE.Group | null>(null);
  const slotGuideRef = useRef<THREE.Mesh | null>(null);
  const cubiesRef = useRef<CubieData[]>([]);

  // Animation & Queue
  const isAnimatingRef = useRef(false);
  const activeTurnRef = useRef<{
    cubies: THREE.Group[];
    axis: 'x' | 'y' | 'z';
    targetAngle: number;
    currentAngle: number;
    stepSpeed: number;
    onDone?: () => void;
  } | null>(null);

  const moveQueueRef = useRef<{ move: string; onFinish?: () => void }[]>([]);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const solveMovesRef = useRef<string[]>(solveMoves);
  solveMovesRef.current = solveMoves;

  const setupMovesRef = useRef<string[]>(setupMoves);
  setupMovesRef.current = setupMoves;

  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  const stageRef = useRef<CFOPStage>(stage);
  stageRef.current = stage;

  // Highlights the concerned pieces for this stage (F2L active pair, OLL/PLL top layer pieces)
  const applyPieceHighlighting = useCallback(() => {
    if (!cubiesRef.current) return;
    const currentStage = stageRef.current;
    const highlight = highlightConcernedPieces;

    cubiesRef.current.forEach((cubie) => {
      let isConcerned = true;

      if (highlight) {
        if (currentStage === 'f2l') {
          // In F2L: The concerned pieces are the active Corner and Edge pair being inserted into FR!
          isConcerned = cubie.isF2LCorner || cubie.isF2LEdge;
        } else if (currentStage === 'oll' || currentStage === 'pll') {
          // In OLL/PLL: The concerned pieces are the 9 pieces in the top Yellow layer (initialY === 1)
          isConcerned = cubie.initialY === 1;
        } else if (currentStage === 'cross') {
          // In Cross: The concerned pieces are the bottom White cross pieces (initialY === -1)
          isConcerned = cubie.initialY === -1;
        }
      }

      // If highlighted, concerned pieces pop with vibrant electric glow while the rest of the cube stays solid and clear
      const opacity = highlight && !isConcerned ? 0.65 : 1.0;
      const bodyOpacity = highlight && !isConcerned ? 0.75 : 1.0;
      const emissiveColor = new THREE.Color(
        currentStage === 'f2l' && (cubie.isF2LCorner || cubie.isF2LEdge)
          ? '#00e5ff' // Vibrant Electric Cyan glow for F2L active pair
          : currentStage === 'oll'
          ? '#ffd000' // Golden Yellow glow for OLL yellow orientation
          : currentStage === 'pll'
          ? '#00e5ff' // Electric Cyan glow for PLL permutations
          : '#ffffff'
      );
      const emissiveIntensity = isConcerned && highlight ? 0.42 : 0;

      cubie.stickers.forEach((s) => {
        s.baseMaterial.transparent = highlight && !isConcerned;
        s.baseMaterial.opacity = opacity;
        s.baseMaterial.emissive = emissiveColor;
        s.baseMaterial.emissiveIntensity = emissiveIntensity;
        s.baseMaterial.needsUpdate = true;
      });

      cubie.baseBodyMaterial.transparent = highlight && !isConcerned;
      cubie.baseBodyMaterial.opacity = bodyOpacity;
      cubie.baseBodyMaterial.needsUpdate = true;
    });

    // Show/hide glowing slot guide for F2L
    if (slotGuideRef.current) {
      slotGuideRef.current.visible = currentStage === 'f2l' && highlight;
    }
  }, [highlightConcernedPieces]);

  useEffect(() => {
    applyPieceHighlighting();
  }, [stage, highlightConcernedPieces, applyPieceHighlighting]);

  // Turn translation into rotational parameters
  const getTurnParams = (move: string) => {
    let axis: 'x' | 'y' | 'z' = 'y';
    let angle = -Math.PI / 2;
    let filter: (pos: THREE.Vector3) => boolean = () => false;

    const base = move.replace(/[2']/g, '');
    const isDouble = move.includes('2');
    const isPrime = move.includes("'");
    let multiplier = isDouble ? 2 : 1;
    if (isPrime) multiplier = -multiplier;

    switch (base) {
      case 'U':
        axis = 'y';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => p.y > 0.4;
        break;
      case 'D':
        axis = 'y';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => p.y < -0.4;
        break;
      case 'R':
        axis = 'x';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => p.x > 0.4;
        break;
      case 'L':
        axis = 'x';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => p.x < -0.4;
        break;
      case 'F':
        axis = 'z';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => p.z > 0.4;
        break;
      case 'B':
        axis = 'z';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => p.z < -0.4;
        break;
      case 'M':
        axis = 'x';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => Math.abs(p.x) < 0.4;
        break;
      case 'E':
        axis = 'y';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => Math.abs(p.y) < 0.4;
        break;
      case 'S':
        axis = 'z';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => Math.abs(p.z) < 0.4;
        break;
      case 'r':
      case 'Rw':
        axis = 'x';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => p.x > -0.4;
        break;
      case 'l':
      case 'Lw':
        axis = 'x';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => p.x < 0.4;
        break;
      case 'u':
      case 'Uw':
        axis = 'y';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => p.y > -0.4;
        break;
      case 'd':
      case 'Dw':
        axis = 'y';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => p.y < 0.4;
        break;
      case 'f':
      case 'Fw':
        axis = 'z';
        angle = (-Math.PI / 2) * multiplier;
        filter = (p) => p.z > -0.4;
        break;
      case 'b':
      case 'Bw':
        axis = 'z';
        angle = (Math.PI / 2) * multiplier;
        filter = (p) => p.z < 0.4;
        break;
      case 'x':
        axis = 'x';
        angle = (-Math.PI / 2) * multiplier;
        filter = () => true;
        break;
      case 'y':
        axis = 'y';
        angle = (-Math.PI / 2) * multiplier;
        filter = () => true;
        break;
      case 'z':
        axis = 'z';
        angle = (-Math.PI / 2) * multiplier;
        filter = () => true;
        break;
      default:
        filter = () => false;
        break;
    }

    return { axis, angle, filter, isDouble };
  };

  // Instant turn execution (zero delay for instant case setup)
  const executeTurnInstant = useCallback((move: string) => {
    if (!cubeRootGroupRef.current || !pivotGroupRef.current) return;
    const root = cubeRootGroupRef.current;
    const pivot = pivotGroupRef.current;

    const { axis, angle, filter } = getTurnParams(move);
    const targetCubies: THREE.Group[] = [];
    const worldPos = new THREE.Vector3();

    cubiesRef.current.forEach(({ mesh }) => {
      mesh.getWorldPosition(worldPos);
      root.worldToLocal(worldPos);
      if (filter(worldPos)) {
        targetCubies.push(mesh);
      }
    });

    pivot.rotation.set(0, 0, 0);
    pivot.position.set(0, 0, 0);

    targetCubies.forEach((mesh) => {
      pivot.attach(mesh);
    });

    pivot.rotation[axis] = angle;
    pivot.updateMatrixWorld(true);

    targetCubies.forEach((mesh) => {
      mesh.updateMatrixWorld(true);
      root.attach(mesh);
      mesh.position.x = Math.round(mesh.position.x);
      mesh.position.y = Math.round(mesh.position.y);
      mesh.position.z = Math.round(mesh.position.z);
    });

    pivot.rotation.set(0, 0, 0);
  }, []);

  // Smooth animated turn execution
  const executeTurn = useCallback(
    (move: string, onFinish?: () => void) => {
      if (!cubeRootGroupRef.current || !pivotGroupRef.current) return;
      const pivot = pivotGroupRef.current;
      const root = cubeRootGroupRef.current;

      const { axis, angle, filter, isDouble } = getTurnParams(move);
      const targetCubies: THREE.Group[] = [];
      const worldPos = new THREE.Vector3();

      cubiesRef.current.forEach(({ mesh }) => {
        mesh.getWorldPosition(worldPos);
        root.worldToLocal(worldPos);
        if (filter(worldPos)) {
          targetCubies.push(mesh);
        }
      });

      pivot.rotation.set(0, 0, 0);
      pivot.position.set(0, 0, 0);

      targetCubies.forEach((mesh) => {
        pivot.attach(mesh);
      });

      soundManager.playTurnClick(isDouble ? 2 : 0);
      setCurrentMoveDisplay(move);

      const baseDurationMs = 170 / Math.max(0.2, speedRef.current);
      const stepSpeed = Math.abs(angle) / (baseDurationMs / 16);

      activeTurnRef.current = {
        cubies: targetCubies,
        axis,
        targetAngle: angle,
        currentAngle: 0,
        stepSpeed,
        onDone: () => {
          targetCubies.forEach((mesh) => {
            mesh.updateMatrixWorld(true);
            root.attach(mesh);
            mesh.position.x = Math.round(mesh.position.x);
            mesh.position.y = Math.round(mesh.position.y);
            mesh.position.z = Math.round(mesh.position.z);
          });

          pivot.rotation.set(0, 0, 0);
          activeTurnRef.current = null;
          isAnimatingRef.current = false;
          applyPieceHighlighting();
          onFinish?.();
        },
      };

      isAnimatingRef.current = true;
    },
    [applyPieceHighlighting]
  );

  // Animation queue runner
  const processNextInQueue = useCallback(() => {
    if (isAnimatingRef.current || activeTurnRef.current) return;
    if (moveQueueRef.current.length === 0) return;

    const next = moveQueueRef.current.shift();
    if (next) {
      executeTurn(next.move, () => {
        next.onFinish?.();
        setTimeout(() => {
          processNextInQueue();
        }, 10);
      });
    }
  }, [executeTurn]);

  const performMove = useCallback(
    (move: string) => {
      moveQueueRef.current.push({ move });
      processNextInQueue();
    },
    [processNextInQueue]
  );

  // Reset to Solved Cube State
  const resetToSolved = useCallback(() => {
    setIsPlaying(false);
    moveQueueRef.current = [];
    activeTurnRef.current = null;
    isAnimatingRef.current = false;
    setCurrentStep(-1);
    setCurrentMoveDisplay('');
    setIsCaseSolved(true);

    if (!cubeRootGroupRef.current || !pivotGroupRef.current) return;
    const root = cubeRootGroupRef.current;
    const pivot = pivotGroupRef.current;

    pivot.rotation.set(0, 0, 0);

    cubiesRef.current.forEach(({ mesh, initialX, initialY, initialZ }) => {
      root.attach(mesh);
      mesh.position.set(initialX, initialY, initialZ);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      mesh.updateMatrixWorld(true);
    });

    applyPieceHighlighting();
  }, [applyPieceHighlighting]);

  // Instant Setup to the Case State (applies inverse moves so case is ready to be solved!)
  const setupCaseInstant = useCallback(() => {
    resetToSolved();
    setIsCaseSolved(false);

    // Apply setup moves to scramble the cube into the exact case
    const moves = setupMovesRef.current;
    if (moves && moves.length > 0) {
      moves.forEach((m) => {
        executeTurnInstant(m);
      });
    }

    setCurrentStep(-1);
    setDrillStep(0);
    setDrillStartTime(Date.now());
    setDrillFinishedTime(null);
    setWrongMoveNotice(null);
    setCurrentMoveDisplay('');
    applyPieceHighlighting();
  }, [resetToSolved, executeTurnInstant, applyPieceHighlighting]);

  // When setupMoves or solveMoves change, instantly set up the case on the 3D cube!
  useEffect(() => {
    setupMovesRef.current = setupMoves;
    solveMovesRef.current = solveMoves;
    stageRef.current = stage;
    setupCaseInstant();
  }, [setupMoves, solveMoves, stage, setupCaseInstant]);

  // Step forward in Solve Walkthrough
  const stepForward = useCallback(() => {
    const moves = solveMovesRef.current;
    const nextIdx = currentStepRef.current + 1;
    if (nextIdx >= moves.length) {
      setIsPlaying(false);
      setIsCaseSolved(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      soundManager.playFinishChime();
      return;
    }

    const move = moves[nextIdx];
    setCurrentStep(nextIdx);

    moveQueueRef.current.push({
      move,
      onFinish: () => {
        if (nextIdx === moves.length - 1) {
          setIsCaseSolved(true);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
          soundManager.playFinishChime();
        }

        if (isPlayingRef.current) {
          setTimeout(() => {
            stepForward();
          }, 140 / Math.max(0.5, speedRef.current));
        }
      },
    });
    processNextInQueue();
  }, [processNextInQueue]);

  // Step backward in Solve Walkthrough
  const stepBackward = useCallback(() => {
    const moves = solveMovesRef.current;
    const curIdx = currentStepRef.current;
    if (curIdx < 0) return;

    setIsPlaying(false);
    setIsCaseSolved(false);
    const move = moves[curIdx];
    const inverted = invertMove(move);

    setCurrentStep(curIdx - 1);

    moveQueueRef.current.push({ move: inverted });
    processNextInQueue();
  }, [processNextInQueue]);

  // Jump to specific step in solve algorithm (scrubbing timeline)
  const jumpToStep = useCallback(
    (targetStep: number) => {
      setIsPlaying(false);
      moveQueueRef.current = [];
      activeTurnRef.current = null;
      isAnimatingRef.current = false;

      // Reset to case setup first
      setupCaseInstant();

      // Execute moves up to targetStep instantly
      const moves = solveMovesRef.current;
      for (let i = 0; i <= targetStep; i++) {
        if (moves[i]) {
          executeTurnInstant(moves[i]);
        }
      }

      setCurrentStep(targetStep);
      if (moves[targetStep]) {
        setCurrentMoveDisplay(moves[targetStep]);
      }
      const isNowSolved = targetStep === moves.length - 1;
      setIsCaseSolved(isNowSolved);
      applyPieceHighlighting();
    },
    [setupCaseInstant, executeTurnInstant, applyPieceHighlighting]
  );

  // Toggle Auto-Play Solve
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentStep >= solveMovesRef.current.length - 1 || isCaseSolved) {
        setupCaseInstant();
        setTimeout(() => {
          setIsPlaying(true);
          stepForward();
        }, 100);
      } else {
        setIsPlaying(true);
        stepForward();
      }
    }
  };

  // Interactive Drill input handler
  const handleDrillMoveInput = (move: string) => {
    const expected = solveMovesRef.current[drillStep];
    if (!expected) return;

    if (move === expected) {
      setWrongMoveNotice(null);
      performMove(move);
      const nextStep = drillStep + 1;
      setDrillStep(nextStep);

      if (nextStep >= solveMovesRef.current.length) {
        const totalTime = drillStartTime ? (Date.now() - drillStartTime) / 1000 : 0;
        setDrillFinishedTime(totalTime);
        setIsCaseSolved(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        soundManager.playFinishChime();
      }
    } else {
      soundManager.playInspectionAlert();
      setWrongMoveNotice(`Expected "${expected}", but you turned "${move}"`);
      setTimeout(() => setWrongMoveNotice(null), 2500);
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key;

      if (activeTabMode === 'walkthrough') {
        if (key === ' ') {
          e.preventDefault();
          togglePlay();
        } else if (key === 'ArrowRight') {
          stepForward();
        } else if (key === 'ArrowLeft') {
          stepBackward();
        }
      } else if (activeTabMode === 'drill') {
        const keyMap: Record<string, string> = {
          r: 'R',
          R: "R'",
          u: 'U',
          U: "U'",
          f: 'F',
          F: "F'",
          l: 'L',
          L: "L'",
          d: 'D',
          D: "D'",
          b: 'B',
          B: "B'",
          m: 'M',
          M: "M'",
        };
        if (keyMap[key]) {
          handleDrillMoveInput(keyMap[key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabMode, togglePlay, stepForward, stepBackward, drillStep]);

  // Camera presets
  const setCameraView = (view: 'iso' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (view === 'iso') camera.position.set(4.8, 4.4, 5.4);
    else camera.position.set(0, 7.8, 0.1);

    controls.target.set(0, 0, 0);
    controls.update();
  };

  // Main Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0e14');
    scene.fog = new THREE.FogExp2('#0b0e14', 0.04);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(4.8, 4.4, 5.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced neutral studio lighting rig (no color tints that distort yellow or red)
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.35);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#ffffff', 0.55);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight('#ffffff', 0.35);
    bottomLight.position.set(0, -6, 2);
    scene.add(bottomLight);

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#334155', 0.55);
    scene.add(hemiLight);

    // Ground contact shadow
    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.2;
    scene.add(shadowMesh);

    // Target Slot guide mesh for F2L (illuminated electric cyan bracket at Front-Right)
    const slotGuideGeo = new THREE.BoxGeometry(1.05, 2.05, 1.05);
    const slotGuideMat = new THREE.MeshBasicMaterial({
      color: '#00e5ff',
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const slotGuide = new THREE.Mesh(slotGuideGeo, slotGuideMat);
    slotGuide.position.set(1, -0.5, 1);
    slotGuide.visible = false;
    scene.add(slotGuide);
    slotGuideRef.current = slotGuide;

    // Cube Groups
    const cubeRootGroup = new THREE.Group();
    scene.add(cubeRootGroup);
    cubeRootGroupRef.current = cubeRootGroup;

    const pivotGroup = new THREE.Group();
    cubeRootGroup.add(pivotGroup);
    pivotGroupRef.current = pivotGroup;

    // Generate 27 Cubies
    // Standard CFOP Orientation:
    // U face (y === 1): Yellow (#FFD000)
    // D face (y === -1): White (#FFFFFF)
    // F face (z === 1): Green (#00C853)
    // B face (z === -1): Blue (#0050E6)
    // L face (x === -1): Orange (#FF6200)
    // R face (x === 1): Red (#E00020)
    const cubies: CubieData[] = [];
    const cubieSize = 0.96;
    const stickerSize = 0.88;
    const stickerThickness = 0.015;

    const bodyGeometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const stickerGeo = new THREE.BoxGeometry(stickerSize, stickerSize, stickerThickness);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubieGroup = new THREE.Group();
          cubieGroup.position.set(x, y, z);

          const bodyMat = new THREE.MeshStandardMaterial({
            color: CUBE_COLORS.core,
            roughness: 0.5,
            metalness: 0.05,
          });
          const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMat);
          bodyMesh.castShadow = !isSoftwareGl;
          bodyMesh.receiveShadow = !isSoftwareGl;
          cubieGroup.add(bodyMesh);

          const stickers: { face: string; mesh: THREE.Mesh; baseMaterial: THREE.MeshPhysicalMaterial }[] = [];

          const addSticker = (face: string, color: string, pos: THREE.Vector3, rot: THREE.Euler) => {
            const stickerMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(color),
              roughness: 0.28,
              metalness: 0.0,
              clearcoat: 0.0, // Zero clearcoat prevents white specular glare washing out colors
            });
            const stickerMesh = new THREE.Mesh(stickerGeo, stickerMat);
            stickerMesh.position.copy(pos);
            stickerMesh.rotation.copy(rot);
            cubieGroup.add(stickerMesh);
            stickers.push({ face, mesh: stickerMesh, baseMaterial: stickerMat });
          };

          const offset = cubieSize / 2 + stickerThickness / 2;

          // U face (y === 1) -> YELLOW
          if (y === 1) addSticker('U', CUBE_COLORS.U, new THREE.Vector3(0, offset, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
          // D face (y === -1) -> WHITE
          if (y === -1) addSticker('D', CUBE_COLORS.D, new THREE.Vector3(0, -offset, 0), new THREE.Euler(Math.PI / 2, 0, 0));
          // F face (z === 1) -> GREEN
          if (z === 1) addSticker('F', CUBE_COLORS.F, new THREE.Vector3(0, 0, offset), new THREE.Euler(0, 0, 0));
          // B face (z === -1) -> BLUE
          if (z === -1) addSticker('B', CUBE_COLORS.B, new THREE.Vector3(0, 0, -offset), new THREE.Euler(0, Math.PI, 0));
          // L face (x === -1) -> ORANGE
          if (x === -1) addSticker('L', CUBE_COLORS.L, new THREE.Vector3(-offset, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
          // R face (x === 1) -> RED
          if (x === 1) addSticker('R', CUBE_COLORS.R, new THREE.Vector3(offset, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));

          cubeRootGroup.add(cubieGroup);

          // Identify active F2L pieces (Front-Right-Bottom corner and Front-Right-Middle edge)
          const isF2LCorner = x === 1 && y === -1 && z === 1;
          const isF2LEdge = x === 1 && y === 0 && z === 1;

          cubies.push({
            mesh: cubieGroup,
            initialX: x,
            initialY: y,
            initialZ: z,
            isF2LCorner,
            isF2LEdge,
            stickers,
            baseBodyMaterial: bodyMat,
          });
        }
      }
    }

    cubiesRef.current = cubies;
    setupCaseInstant();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (activeTurnRef.current) {
        const turn = activeTurnRef.current;
        const remaining = turn.targetAngle - turn.currentAngle;
        const dir = Math.sign(remaining);
        const step = dir * Math.min(Math.abs(remaining), turn.stepSpeed);

        turn.currentAngle += step;
        pivotGroup.rotation[turn.axis] = turn.currentAngle;

        if (Math.abs(turn.currentAngle - turn.targetAngle) < 0.001) {
          pivotGroup.rotation[turn.axis] = turn.targetAngle;
          turn.onDone?.();
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bodyGeometry.dispose();
      stickerGeo.dispose();
      shadowGeo.dispose();
      shadowTex.dispose();
      slotGuideGeo.dispose();
      slotGuideMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing outline-none" />

      {/* Top Floating HUD: Case Status, Mode Switcher & Lighting Toggle */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Case Name Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2.5">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[160px] sm:max-w-xs">
              {algorithmName}
            </span>
            {isCaseSolved ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                Case Ready
              </span>
            )}
          </div>

          {/* Mode Switcher: Walkthrough vs Interactive Drill */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-lg flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setActiveTabMode('walkthrough');
                setupCaseInstant();
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                activeTabMode === 'walkthrough'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Walkthrough</span>
            </button>
            <button
              onClick={() => {
                setActiveTabMode('drill');
                setupCaseInstant();
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                activeTabMode === 'drill'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3 h-3" />
              <span>Interactive Drill</span>
            </button>
          </div>
        </div>

        {/* Piece Lighting Toggle, Camera & Help Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Lit-Up Concerned Pieces Toggle */}
          <button
            onClick={() => setHighlightConcernedPieces(!highlightConcernedPieces)}
            title={highlightConcernedPieces ? 'Piece Lighting: ON (concerned pieces lit up)' : 'Piece Lighting: OFF (full cube)'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
              highlightConcernedPieces
                ? 'bg-sky-950/90 text-sky-300 border-sky-700/80'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${highlightConcernedPieces ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Lit Pieces</span>
          </button>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center gap-1 shadow-lg text-xs">
            <button
              onClick={() => setCameraView('iso')}
              title="Isometric 3D View"
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium transition"
            >
              3D
            </button>
            <button
              onClick={() => setCameraView('top')}
              title="Top View (Yellow U Layer)"
              className="px-2 py-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg font-medium transition"
            >
              Top (Yellow)
            </button>
          </div>

          <button
            onClick={() => setShowNotationHelp(!showNotationHelp)}
            title="Notation & Shortcuts"
            className="p-2 bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition shadow-lg"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Notation & Shortcuts Modal */}
      {showNotationHelp && (
        <div className="absolute inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Notation & Shortcuts (Yellow Top / White Bottom)
              </h3>
              <button
                onClick={() => setShowNotationHelp(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="font-mono text-emerald-400 font-bold">R, L, U, D, F, B</span>: Clockwise 90°
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="font-mono text-sky-400 font-bold">' (Prime)</span>: Counter-clockwise 90°
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="font-mono text-emerald-400 font-bold">2 (e.g. U2)</span>: 180° Turn
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="font-mono text-sky-400 font-bold">M</span>: Middle slice down
                </div>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-lg space-y-1">
                <p><span className="text-white font-mono font-bold">Space</span>: Play / Pause solve</p>
                <p><span className="text-white font-mono font-bold">← / →</span>: Step backward / forward</p>
                <p><span className="text-white font-mono font-bold">Lit Pieces</span>: Highlights active F2L pair or OLL/PLL pieces</p>
                <p><span className="text-white font-mono font-bold">Mouse Drag</span>: Rotate 3D cube camera</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Drill HUD Overlay */}
      {activeTabMode === 'drill' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-20">
          <div className="bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-3 shadow-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Interactive Drill</span>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded">
                  {drillStep} / {solveMoves.length} moves
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHideDrillMoves(!hideDrillMoves)}
                  title={hideDrillMoves ? 'Show Solution Moves' : 'Hide Solution Moves'}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {hideDrillMoves ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={setupCaseInstant}
                  title="Restart Drill"
                  className="px-2 py-0.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              </div>
            </div>

            {drillFinishedTime !== null ? (
              <div className="text-center py-2 bg-emerald-950/60 border border-emerald-800 rounded-xl">
                <span className="text-emerald-300 font-bold text-sm block">🎉 Drill Solved in {drillFinishedTime.toFixed(2)}s!</span>
                <button
                  onClick={setupCaseInstant}
                  className="mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                >
                  Drill Again
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-950/80 rounded-xl p-2.5 border border-slate-800">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 font-medium">Next Move:</span>
                  <span className="font-mono text-lg font-black text-emerald-400">
                    {hideDrillMoves ? '?' : solveMoves[drillStep] || 'Done!'}
                  </span>
                  {!hideDrillMoves && solveMoves[drillStep] && MOVE_EXPLANATIONS[solveMoves[drillStep]] && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      ({MOVE_EXPLANATIONS[solveMoves[drillStep]].name})
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-slate-500">Press key or click turn below</span>
              </div>
            )}

            {wrongMoveNotice && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs px-3 py-1.5 rounded-lg font-medium text-center animate-shake">
                {wrongMoveNotice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-20 flex flex-col gap-1.5">
        {(showManualTurns || activeTabMode === 'drill') && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-xl flex items-center justify-between gap-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0 px-2">Turns:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {['R', "R'", 'U', "U'", 'F', "F'", 'L', "L'", 'D', "D'", 'B', "B'", 'M', 'x', 'y', 'z'].map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (activeTabMode === 'drill') handleDrillMoveInput(m);
                      else performMove(m);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold rounded-lg transition active:scale-95"
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Setup on Real Cube banner (showing speedcubers how to reach this case from solved state) */}
        {setupMoves && setupMoves.length > 0 && (
          <div className="self-center bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 px-3 py-1 rounded-xl shadow-lg flex items-center gap-2 text-xs max-w-full backdrop-blur-md">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span>Setup on Real Cube:</span>
            </span>
            <span className="font-mono font-semibold text-slate-200 text-xs truncate max-w-[260px] sm:max-w-md">
              {setupMoves.join(' ')}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(setupMoves.join(' '));
                setCopiedSetup(true);
                setTimeout(() => setCopiedSetup(false), 1500);
              }}
              title="Copy setup moves to clipboard"
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] shrink-0"
            >
              {copiedSetup ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Current Move Step Explanation Banner (Walkthrough Mode) */}
        {activeTabMode === 'walkthrough' && currentStep >= 0 && solveMoves[currentStep] && (
          <div className="self-center bg-slate-900/95 border border-sky-500/40 px-3.5 py-1 rounded-full shadow-lg flex items-center gap-2 text-xs max-w-full truncate">
            <span className="font-mono font-black text-sky-400 text-sm">
              {solveMoves[currentStep]}
            </span>
            {MOVE_EXPLANATIONS[solveMoves[currentStep]] && (
              <span className="text-slate-200 font-medium truncate hidden sm:inline">
                {MOVE_EXPLANATIONS[solveMoves[currentStep]].name}
              </span>
            )}
            <span className="text-[11px] text-sky-300/80 font-mono">
              ({currentStep + 1}/{solveMoves.length})
            </span>
          </div>
        )}

        {/* Main Dock Container */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2.5">
          {/* Left: Step Playback Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={setupCaseInstant}
              title="Reset to Case State (Ready to Solve)"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Case</span>
            </button>
            <button
              onClick={stepBackward}
              disabled={activeTabMode === 'drill'}
              title="Step Back (←)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              disabled={activeTabMode === 'drill'}
              title={isPlaying ? 'Pause Solve' : 'Play Solve Algorithm'}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition text-xs disabled:opacity-40"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isPlaying ? 'Pause' : 'Solve'}</span>
            </button>
            <button
              onClick={stepForward}
              disabled={activeTabMode === 'drill'}
              title="Step Forward (→)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Algorithm Sequence Chips (showing solve progress) */}
          {solveMoves.length > 0 ? (
            <div className="flex-1 flex items-center gap-1 overflow-x-auto px-2 scrollbar-none max-w-xs sm:max-w-sm md:max-w-md">
              {solveMoves.map((move, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (activeTabMode === 'drill') handleDrillMoveInput(move);
                    else jumpToStep(idx);
                  }}
                  title={MOVE_EXPLANATIONS[move] ? `${move}: ${MOVE_EXPLANATIONS[move].name}` : move}
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 transition ${
                    activeTabMode === 'walkthrough' && idx === currentStep
                      ? 'bg-sky-500 text-white shadow ring-1 ring-sky-300'
                      : activeTabMode === 'drill' && idx === drillStep
                      ? 'bg-emerald-500 text-white shadow ring-1 ring-emerald-300'
                      : idx < (activeTabMode === 'drill' ? drillStep : currentStep)
                      ? 'text-slate-500 bg-slate-950/60'
                      : 'text-slate-300 bg-slate-800/60 hover:bg-slate-700'
                  }`}
                >
                  {move}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 text-center text-xs text-slate-500 font-medium truncate">
              Ready
            </div>
          )}

          {/* Right: Speed & Options */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                const nextSpeed =
                  speedMultiplier === 1
                    ? 1.5
                    : speedMultiplier === 1.5
                    ? 2.5
                    : speedMultiplier === 2.5
                    ? 0.5
                    : 1;
                setSpeedMultiplier(nextSpeed);
              }}
              title="Solve Playback Speed"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-mono text-xs font-semibold transition"
            >
              {speedMultiplier}x
            </button>

            <button
              onClick={resetToSolved}
              title="Reset to Fully Solved Cube"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Solved
            </button>

            {activeTabMode !== 'drill' && (
              <button
                onClick={() => setShowManualTurns(!showManualTurns)}
                title="Toggle Manual Face Turns"
                className={`p-2 rounded-xl transition ${
                  showManualTurns
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
