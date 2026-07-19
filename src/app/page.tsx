'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CameraTargetMode, DivergencePoint } from '@/types/physics';
import { PRESETS } from '@/utils/presets';
import { Header } from '@/components/ui/Header';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { AnalyticsDrawer } from '@/components/ui/AnalyticsDrawer';
import { GuideModal } from '@/components/ui/GuideModal';

// Dynamically import Canvas to bypass SSR issues with WebGL/Three.js
const SimulationCanvas = dynamic(
  () => import('@/components/canvas/SimulationCanvas').then((mod) => mod.SimulationCanvas),
  { ssr: false }
);

export default function Home() {
  // Simulation State
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

  // Guide Modal State
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

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
    if (preset.bodyColors) {
      setBodyColors([...preset.bodyColors]);
    }
    setMetricsHistory([]);
    setResetTrigger((prev) => prev + 1);
  };

  // Reset Handler
  const handleReset = () => {
    setMetricsHistory([]);
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
        onMetricsUpdate={handleMetricsUpdate}
        resetTrigger={resetTrigger}
      />

      {/* Floating Header UI */}
      <Header
        fps={fps}
        isWasm={isWasm}
        divergence={currentDivergence}
        elapsedTime={elapsedTime}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

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
      />

      {/* Real-time Analytics Drawer */}
      <AnalyticsDrawer
        metricsHistory={metricsHistory}
        currentDivergence={currentDivergence}
      />

      {/* Interactive Physics & Chaos Educational Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </main>
  );
}
