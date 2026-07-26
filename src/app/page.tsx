'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CameraTargetMode, DivergencePoint, Vector3D, CopilotResponsePayload, SlingshotPlan } from '@/types/physics';
import { PRESETS } from '@/utils/presets';
import { Header } from '@/components/ui/Header';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { AnalyticsDrawer } from '@/components/ui/AnalyticsDrawer';
import { GuideModal } from '@/components/ui/GuideModal';
import { TourOverlay } from '@/components/ui/TourOverlay';
import { CopilotDrawer } from '@/components/ui/CopilotDrawer';
import { SlingshotPanel } from '@/components/controls/SlingshotPanel';

// Dynamically import Canvas to bypass SSR issues with WebGL/Three.js
const SimulationCanvas = dynamic(
  () => import('@/components/canvas/SimulationCanvas').then((mod) => mod.SimulationCanvas),
  { ssr: false }
);

export default function Home() {
  // Simulation Preset & Parameters
  const [presetKey, setPresetKey] = useState<string>('figureEight');
  const [perturbation, setPerturbation] = useState<number>(1e-7);
  const [dt, setDt] = useState<number>(0.008);
  const [subSteps, setSubSteps] = useState<number>(20);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<CameraTargetMode>('free');
  const [showA, setShowA] = useState<boolean>(true);
  const [showB, setShowB] = useState<boolean>(true);
  const [trailLength, setTrailLength] = useState<number>(300);
  const [masses, setMasses] = useState<[number, number, number]>([1.0, 1.0, 1.0]);
  const [sizeScale, setSizeScale] = useState<number>(1.0);
  const [bodyColors, setBodyColors] = useState<[string, string, string]>(['#ffaa00', '#00f3ff', '#ff007f']);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Probe & Slingshot State
  const [probePlan, setProbePlan] = useState<SlingshotPlan | null>(null);
  const [isSlingshotOpen, setIsSlingshotOpen] = useState<boolean>(false);
  const onApplyImpulseRef = React.useRef<((dvX: number, dvY: number, dvZ: number) => void) | null>(null);
  const onClearProbeRef = React.useRef<(() => void) | null>(null);

  // Initial Vectors State
  const defaultPreset = PRESETS.figureEight;
  const [posA, setPosA] = useState<[Vector3D, Vector3D, Vector3D]>([
    { ...defaultPreset.posA[0] },
    { ...defaultPreset.posA[1] },
    { ...defaultPreset.posA[2] },
  ]);
  const [velA, setVelA] = useState<[Vector3D, Vector3D, Vector3D]>([
    { ...defaultPreset.velA[0] },
    { ...defaultPreset.velA[1] },
    { ...defaultPreset.velA[2] },
  ]);

  // Modals & Copilot State
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Telemetry Metrics
  const [fps, setFps] = useState<number>(60);
  const [isWasm, setIsWasm] = useState<boolean>(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentDivergence, setCurrentDivergence] = useState<number>(0);
  const [metricsHistory, setMetricsHistory] = useState<DivergencePoint[]>([]);

  // Preset Selection Handler
  const handleSelectPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setPresetKey(key);
    setDt(preset.defaultDt);
    setSubSteps(preset.defaultSubSteps);
    setMasses([...preset.masses]);
    setPosA([
      { ...preset.posA[0] },
      { ...preset.posA[1] },
      { ...preset.posA[2] },
    ]);
    setVelA([
      { ...preset.velA[0] },
      { ...preset.velA[1] },
      { ...preset.velA[2] },
    ]);
    if (preset.bodyColors) {
      setBodyColors([...preset.bodyColors]);
    }
    setProbePlan(null);
    if (onClearProbeRef.current) onClearProbeRef.current();
    setMetricsHistory([]);
    setElapsedTime(0);
    setResetTrigger((prev) => prev + 1);
  };

  // Agentic Copilot Payload Injection Handler
  const handleApplyCopilotPayload = (payload: CopilotResponsePayload) => {
    // Register custom dynamic preset in PRESETS map
    PRESETS['aiCustom'] = {
      id: 'aiCustom',
      name: payload.system_name,
      description: payload.description,
      gConst: 1.0,
      softening: 0.005,
      defaultDt: payload.recommended_dt || 0.008,
      defaultSubSteps: payload.recommended_sub_steps || 20,
      masses: [...payload.masses],
      posA: [...payload.pos_a],
      velA: [...payload.vel_a],
      bodyColors: [...payload.body_colors]
    };

    setPresetKey('aiCustom');
    setMasses([...payload.masses]);
    setBodyColors([...payload.body_colors]);
    setPosA([...payload.pos_a]);
    setVelA([...payload.vel_a]);
    setPerturbation(payload.recommended_perturbation || 1e-7);
    setDt(payload.recommended_dt || 0.008);
    setSubSteps(payload.recommended_sub_steps || 20);
    setProbePlan(null);
    if (onClearProbeRef.current) onClearProbeRef.current();
    setMetricsHistory([]);
    setElapsedTime(0);
    setResetTrigger((prev) => prev + 1);
  };

  // Reset Handler
  const handleReset = () => {
    setMetricsHistory([]);
    setElapsedTime(0);
    if (onClearProbeRef.current) onClearProbeRef.current();
    setProbePlan(null);
    setResetTrigger((prev) => prev + 1);
  };

  // Vector Edit Handler (Only at t = 0s)
  const handleVectorChange = (
    type: 'pos' | 'vel',
    bodyIdx: number,
    axis: 'x' | 'y' | 'z',
    val: number
  ) => {
    if (type === 'pos') {
      const nextPos = [...posA] as [Vector3D, Vector3D, Vector3D];
      nextPos[bodyIdx] = { ...nextPos[bodyIdx], [axis]: val };
      setPosA(nextPos);
    } else {
      const nextVel = [...velA] as [Vector3D, Vector3D, Vector3D];
      nextVel[bodyIdx] = { ...nextVel[bodyIdx], [axis]: val };
      setVelA(nextVel);
    }
    setMetricsHistory([]);
    setElapsedTime(0);
    setResetTrigger((prev) => prev + 1);
  };

  // Zero Velocities Handler
  const handleZeroVelocities = () => {
    setVelA([
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ]);
    setMetricsHistory([]);
    setElapsedTime(0);
    setResetTrigger((prev) => prev + 1);
  };

  // Randomize Vectors Handler
  const handleRandomizeVectors = () => {
    const randomPos: [Vector3D, Vector3D, Vector3D] = [
      { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 2 },
      { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 2 },
      { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 2 },
    ];
    const randomVel: [Vector3D, Vector3D, Vector3D] = [
      { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 1 },
      { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 1 },
      { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 1 },
    ];
    setPosA(randomPos);
    setVelA(randomVel);
    setMetricsHistory([]);
    setElapsedTime(0);
    setResetTrigger((prev) => prev + 1);
  };

  // Live Metrics Telemetry Callback
  const handleMetricsUpdate = useCallback(
    (point: DivergencePoint, currentFps: number, wasmState: boolean, time: number) => {
      setFps(currentFps);
      setIsWasm(wasmState);
      setElapsedTime(time);
      setCurrentDivergence(point.divergence);
      setMetricsHistory((prev) => [...prev.slice(-200), point]);
    },
    []
  );

  // Mass Change Handler
  const handleMassChange = (idx: number, val: number) => {
    const newMasses = [...masses] as [number, number, number];
    newMasses[idx] = val;
    setMasses(newMasses);
  };

  // Color Change Handlers
  const handleBodyColorChange = (idx: number, color: string) => {
    const newColors = [...bodyColors] as [string, string, string];
    newColors[idx] = color;
    setBodyColors(newColors);
  };

  const handleApplyColorPalette = (palette: [string, string, string]) => {
    setBodyColors([...palette]);
  };

  return (
    <main className="w-screen h-screen overflow-hidden relative bg-space-900 select-none">
      {/* 3D Canvas Background */}
      <SimulationCanvas
        presetKey={presetKey}
        perturbation={perturbation}
        dt={dt}
        subSteps={subSteps}
        isRunning={isRunning}
        cameraMode={cameraMode}
        showA={showA}
        showB={showB}
        trailLength={trailLength}
        masses={masses}
        sizeScale={sizeScale}
        bodyColors={bodyColors}
        customPosA={posA}
        customVelA={velA}
        onMetricsUpdate={handleMetricsUpdate}
        resetTrigger={resetTrigger}
        probePlan={probePlan}
        onApplyImpulseRef={onApplyImpulseRef}
        onClearProbeRef={onClearProbeRef}
      />

      {/* Floating Header UI */}
      <Header
        fps={fps}
        isWasm={isWasm}
        divergence={currentDivergence}
        elapsedTime={elapsedTime}
        onOpenGuide={() => setIsGuideOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onToggleSlingshot={() => setIsSlingshotOpen(!isSlingshotOpen)}
        isSlingshotOpen={isSlingshotOpen}
      />

      {/* RL Spacecraft Slingshot Floating Widget */}
      {isSlingshotOpen && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4">
          <SlingshotPanel
            onLaunchProbe={(plan) => setProbePlan(plan)}
            onApplyImpulse={(dvX, dvY, dvZ) => {
              if (onApplyImpulseRef.current) {
                onApplyImpulseRef.current(dvX, dvY, dvZ);
              }
            }}
            onClearProbe={() => {
              if (onClearProbeRef.current) {
                onClearProbeRef.current();
              }
              setProbePlan(null);
            }}
            isProbeActive={probePlan !== null}
            currentMasses={masses}
            currentPosA={posA}
            currentVelA={velA}
            bodyColors={bodyColors}
          />
        </div>
      )}


      {/* Control Panel Sidebar */}
      <ControlPanel
        presetKey={presetKey}
        onSelectPreset={handleSelectPreset}
        perturbation={perturbation}
        onPerturbationChange={setPerturbation}
        dt={dt}
        onDtChange={setDt}
        subSteps={subSteps}
        onSubStepsChange={setSubSteps}
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        showA={showA}
        onToggleShowA={() => setShowA(!showA)}
        showB={showB}
        onToggleShowB={() => setShowB(!showB)}
        trailLength={trailLength}
        onTrailLengthChange={setTrailLength}
        masses={masses}
        onMassChange={handleMassChange}
        sizeScale={sizeScale}
        onSizeScaleChange={setSizeScale}
        bodyColors={bodyColors}
        onBodyColorChange={handleBodyColorChange}
        onApplyColorPalette={handleApplyColorPalette}
        posA={posA}
        velA={velA}
        onVectorChange={handleVectorChange}
        onZeroVelocities={handleZeroVelocities}
        onRandomizeVectors={handleRandomizeVectors}
        elapsedTime={elapsedTime}
      />

      {/* Real-time Analytics Drawer */}
      <AnalyticsDrawer
        metricsHistory={metricsHistory}
        currentDivergence={currentDivergence}
      />

      {/* Interactive Agentic Physics Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onApplyCopilotPayload={handleApplyCopilotPayload}
      />

      {/* Interactive Physics & Chaos Educational Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Interactive Onboarding Tour Overlay */}
      <TourOverlay
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </main>
  );
}
