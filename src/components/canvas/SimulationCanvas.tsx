'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CameraTargetMode, DivergencePoint, SlingshotPlan, Vector3D } from '@/types/physics';
import { PhysicsSolver, createPhysicsEngine } from '@/utils/wasmBridge';
import { PRESETS } from '@/utils/presets';
import { Bodies } from './Bodies';
import { Trails } from './Trails';
import { Probe3D } from './Probe3D';
import { CameraController } from './CameraController';

interface SimulationCanvasProps {
  presetKey: string;
  perturbation: number;
  dt: number;
  subSteps: number;
  isRunning: boolean;
  cameraMode: CameraTargetMode;
  showA: boolean;
  showB: boolean;
  trailLength: number;
  masses: [number, number, number];
  sizeScale: number;
  bodyColors: [string, string, string];
  customPosA: [Vector3D, Vector3D, Vector3D];
  customVelA: [Vector3D, Vector3D, Vector3D];
  onMetricsUpdate: (point: DivergencePoint, currentFps: number, isWasm: boolean, elapsedTime: number) => void;
  resetTrigger: number;
  probePlan?: SlingshotPlan | null;
  onApplyImpulseRef?: React.MutableRefObject<((dvX: number, dvY: number, dvZ: number) => void) | null>;
  onClearProbeRef?: React.MutableRefObject<(() => void) | null>;
}

const SimulationLoop: React.FC<SimulationCanvasProps & { controlsRef: React.RefObject<OrbitControlsImpl | null> }> = ({
  presetKey,
  perturbation,
  dt,
  subSteps,
  isRunning,
  cameraMode,
  showA,
  showB,
  trailLength,
  masses,
  sizeScale,
  bodyColors,
  customPosA,
  customVelA,
  onMetricsUpdate,
  resetTrigger,
  probePlan,
  onApplyImpulseRef,
  onClearProbeRef,
  controlsRef,
}) => {
  const solverRef = useRef<PhysicsSolver | null>(null);
  const [posA, setPosA] = useState<Float32Array>(new Float32Array(9));
  const [posB, setPosB] = useState<Float32Array>(new Float32Array(9));

  // Probe State
  const [probePos, setProbePos] = useState<THREE.Vector3>(new THREE.Vector3());
  const [probeVel, setProbeVel] = useState<THREE.Vector3>(new THREE.Vector3());
  const [isProbeActive, setIsProbeActive] = useState<boolean>(false);
  const probeHistoryRef = useRef<THREE.Vector3[]>([]);
  const [probeHistory, setProbeHistory] = useState<THREE.Vector3[]>([]);

  const historyARef = useRef<THREE.Vector3[][]>([[], [], []]);
  const historyBRef = useRef<THREE.Vector3[][]>([[], [], []]);
  const [historyA, setHistoryA] = useState<THREE.Vector3[][]>([[], [], []]);
  const [historyB, setHistoryB] = useState<THREE.Vector3[][]>([[], [], []]);

  const frameCounter = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsRef = useRef(60);

  // Attach impulse & clear handlers
  useEffect(() => {
    if (onApplyImpulseRef) {
      onApplyImpulseRef.current = (dvX, dvY, dvZ) => {
        if (solverRef.current && solverRef.current.applyProbeImpulse) {
          solverRef.current.applyProbeImpulse(dvX, dvY, dvZ);
        }
      };
    }
    if (onClearProbeRef) {
      onClearProbeRef.current = () => {
        if (solverRef.current && solverRef.current.setProbe) {
          solverRef.current.setProbe([0, 0, 0], [0, 0, 0], false);
        }
        setIsProbeActive(false);
        probeHistoryRef.current = [];
        setProbeHistory([]);
      };
    }
  }, [onApplyImpulseRef, onClearProbeRef]);

  // Handle new Slingshot Probe Launch
  useEffect(() => {
    if (probePlan && solverRef.current && solverRef.current.setProbe) {
      const p = probePlan.probe_start_pos;
      const v = probePlan.probe_start_vel;
      solverRef.current.setProbe([p.x, p.y, p.z], [v.x, v.y, v.z], true);
      setIsProbeActive(true);
      setProbePos(new THREE.Vector3(p.x, p.y, p.z));
      setProbeVel(new THREE.Vector3(v.x, v.y, v.z));
      probeHistoryRef.current = [];
      setProbeHistory([]);
    }
  }, [probePlan]);

  // Initialize or Reset Physics Engine with custom initial position/velocity vectors
  useEffect(() => {
    let isMounted = true;
    const preset = PRESETS[presetKey] || PRESETS.figureEight;
    const pA = [
      customPosA[0].x, customPosA[0].y, customPosA[0].z,
      customPosA[1].x, customPosA[1].y, customPosA[1].z,
      customPosA[2].x, customPosA[2].y, customPosA[2].z,
    ];
    const vA = [
      customVelA[0].x, customVelA[0].y, customVelA[0].z,
      customVelA[1].x, customVelA[1].y, customVelA[1].z,
      customVelA[2].x, customVelA[2].y, customVelA[2].z,
    ];

    createPhysicsEngine(masses, pA, vA, perturbation, preset.gConst, preset.softening).then((solver) => {
      if (!isMounted) return;
      solverRef.current = solver;
      const initA = solver.getPositionsA();
      const initB = solver.getPositionsB();
      setPosA(initA);
      setPosB(initB);
      historyARef.current = [[], [], []];
      historyBRef.current = [[], [], []];
      setHistoryA([[], [], []]);
      setHistoryB([[], [], []]);

      if (probePlan && solver.setProbe) {
        const p = probePlan.probe_start_pos;
        const v = probePlan.probe_start_vel;
        solver.setProbe([p.x, p.y, p.z], [v.x, v.y, v.z], true);
        setIsProbeActive(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [presetKey, resetTrigger]);

  // Live Mass update without resetting positions
  useEffect(() => {
    if (solverRef.current) {
      solverRef.current.setMasses(masses);
    }
  }, [masses]);

  useFrame(() => {
    if (!solverRef.current || !isRunning) return;

    // Execute RK4 steps
    solverRef.current.step(dt, subSteps);

    const newA = solverRef.current.getPositionsA();
    const newB = solverRef.current.getPositionsB();
    setPosA(newA);
    setPosB(newB);

    // Probe state tracking
    if (solverRef.current.isProbeActive && solverRef.current.isProbeActive()) {
      if (solverRef.current.getProbePosition && solverRef.current.getProbeVelocity) {
        const pArray = solverRef.current.getProbePosition();
        const vArray = solverRef.current.getProbeVelocity();
        const pVec = new THREE.Vector3(pArray[0], pArray[1], pArray[2]);
        const vVec = new THREE.Vector3(vArray[0], vArray[1], vArray[2]);
        setProbePos(pVec);
        setProbeVel(vVec);

        probeHistoryRef.current.push(pVec);
        if (probeHistoryRef.current.length > trailLength * 2) {
          probeHistoryRef.current.shift();
        }
        setProbeHistory([...probeHistoryRef.current]);
      }
    }

    // Update history trail points
    for (let b = 0; b < 3; b++) {
      const pA = new THREE.Vector3(newA[b * 3], newA[b * 3 + 1], newA[b * 3 + 2]);
      const pB = new THREE.Vector3(newB[b * 3], newB[b * 3 + 1], newB[b * 3 + 2]);

      historyARef.current[b].push(pA);
      if (historyARef.current[b].length > trailLength) {
        historyARef.current[b].shift();
      }

      historyBRef.current[b].push(pB);
      if (historyBRef.current[b].length > trailLength) {
        historyBRef.current[b].shift();
      }
    }

    setHistoryA([...historyARef.current]);
    setHistoryB([...historyBRef.current]);

    // Measure FPS & emit metrics
    frameCounter.current++;
    const now = performance.now();
    if (now - lastTime.current >= 200) {
      fpsRef.current = Math.round((frameCounter.current * 1000) / (now - lastTime.current));
      frameCounter.current = 0;
      lastTime.current = now;

      const div = solverRef.current.getMaxDivergence();
      const elapsed = solverRef.current.getElapsedTime();
      const logDiv = Math.log10(Math.max(1e-12, div));

      onMetricsUpdate(
        { time: parseFloat(elapsed.toFixed(2)), divergence: div, logDivergence: logDiv },
        fpsRef.current,
        solverRef.current.isWasm,
        elapsed
      );
    }
  });

  return (
    <>
      <CameraController mode={cameraMode} posA={posA} controlsRef={controlsRef} />
      <Bodies posA={posA} posB={posB} masses={masses} bodyColors={bodyColors} sizeScale={sizeScale} showA={showA} showB={showB} />
      <Trails historyA={historyA} historyB={historyB} bodyColors={bodyColors} showA={showA} showB={showB} maxPoints={trailLength} />
      <Probe3D
        position={probePos}
        velocity={probeVel}
        active={isProbeActive}
        plannedTrajectory={probePlan?.trajectory_points || []}
        probeHistory={probeHistory}
      />
    </>
  );
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = (props) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div className="w-full h-full relative bg-space-900">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        <color attach="background" args={['#05070f']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00f3ff" />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />
        <gridHelper args={[20, 20, '#1d2842', '#0f172a']} position={[0, -2, 0]} />
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} />
        <SimulationLoop {...props} controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
};

