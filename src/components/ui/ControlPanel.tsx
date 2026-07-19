'use client';

import React, { useState } from 'react';
import { PRESETS } from '@/utils/presets';
import { CameraTargetMode } from '@/types/physics';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Eye,
  Camera,
  Layers,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HelpCircle,
  Maximize2,
  Palette,
} from 'lucide-react';

interface ControlPanelProps {
  presetKey: string;
  onSelectPreset: (key: string) => void;
  perturbation: number;
  onPerturbationChange: (val: number) => void;
  dt: number;
  onDtChange: (val: number) => void;
  subSteps: number;
  onSubStepsChange: (val: number) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  cameraMode: CameraTargetMode;
  onCameraModeChange: (mode: CameraTargetMode) => void;
  showA: boolean;
  onToggleShowA: () => void;
  showB: boolean;
  onToggleShowB: () => void;
  trailLength: number;
  onTrailLengthChange: (val: number) => void;
  masses: [number, number, number];
  onMassChange: (idx: number, val: number) => void;
  sizeScale: number;
  onSizeScaleChange: (val: number) => void;
  bodyColors: [string, string, string];
  onBodyColorChange: (idx: number, color: string) => void;
  onApplyColorPalette: (palette: [string, string, string]) => void;
}

const PALETTE_PRESETS: { name: string; colors: [string, string, string] }[] = [
  { name: 'Cyberpunk Neon', colors: ['#ffaa00', '#00f3ff', '#ff007f'] },
  { name: 'Solar Triad', colors: ['#ffd700', '#ff5722', '#00e676'] },
  { name: 'Cosmic Aurora', colors: ['#a855f7', '#3b82f6', '#10b981'] },
  { name: 'Fire & Ice', colors: ['#ff1744', '#00b0ff', '#e040fb'] },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  presetKey,
  onSelectPreset,
  perturbation,
  onPerturbationChange,
  dt,
  onDtChange,
  subSteps,
  onSubStepsChange,
  isRunning,
  onTogglePlay,
  onReset,
  cameraMode,
  onCameraModeChange,
  showA,
  onToggleShowA,
  showB,
  onToggleShowB,
  trailLength,
  onTrailLengthChange,
  masses,
  onMassChange,
  sizeScale,
  onSizeScaleChange,
  bodyColors,
  onBodyColorChange,
  onApplyColorPalette,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'presets' | 'butterfly' | 'physics' | 'colors' | 'camera'>('presets');
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // Convert perturbation (1e-9 to 1e-3) to slider exponent (-9 to -3)
  const logExp = Math.log10(Math.max(1e-12, perturbation));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const exp = parseFloat(e.target.value);
    onPerturbationChange(Math.pow(10, exp));
  };

  return (
    <aside
      className={`absolute top-16 left-2 sm:top-20 sm:left-4 z-20 transition-all duration-300 pointer-events-auto ${
        isOpen ? 'w-[calc(100vw-1rem)] max-w-sm sm:w-96' : 'w-10 sm:w-12'
      }`}
    >
      <div className="rounded-2xl glass-panel overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[calc(100vh-160px)]">
        {/* Header & Toggle Button */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-white/10 bg-space-800/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            {isOpen && <span className="text-xs sm:text-sm font-semibold text-white">Simulation Controls</span>}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse Panel' : 'Expand Panel'}
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <>
            {/* Quick Playback Bar */}
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-space-900/50 border-b border-white/5">
              <button
                onClick={onTogglePlay}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-xs transition-all ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={onReset}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 text-[10px] sm:text-[11px] font-medium bg-space-900/80 overflow-x-auto">
              {[
                { id: 'presets', label: 'Presets', icon: Sparkles },
                { id: 'butterfly', label: 'Butterfly', icon: Layers },
                { id: 'physics', label: 'Mass & Size', icon: Sliders },
                { id: 'colors', label: 'Colors', icon: Palette },
                { id: 'camera', label: 'View', icon: Camera },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1.5 whitespace-nowrap border-b-2 transition-all ${
                      active
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tooltip Banner (if hovered) */}
            {hoveredTooltip && (
              <div className="bg-cyan-950/80 border-b border-cyan-500/30 p-2 px-3 text-[11px] text-cyan-200 flex items-center gap-2 animate-fade-in">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>{hoveredTooltip}</span>
              </div>
            )}

            {/* Tab Contents Container */}
            <div className="p-3 sm:p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)] text-xs">
              {/* TAB 1: PRESETS */}
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Orbital Presets Vault
                    </span>
                    <HelpCircle
                      className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredTooltip('Click any preset to load classic 3-body gravitational choreography!')
                      }
                      onMouseLeave={() => setHoveredTooltip(null)}
                    />
                  </div>
                  <div className="space-y-2">
                    {Object.values(PRESETS).map((p) => {
                      const selected = presetKey === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => onSelectPreset(p.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                            selected
                              ? 'bg-gradient-to-r from-cyan-950/80 to-pink-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                              : 'bg-space-800/50 border-white/5 text-slate-300 hover:bg-space-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs flex items-center justify-between">
                            <span>{p.name}</span>
                            {selected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: BUTTERFLY FACTOR */}
              {activeTab === 'butterfly' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <label className="font-semibold text-slate-300">Quantum Perturbation (δ)</label>
                        <HelpCircle
                          className="w-3.5 h-3.5 text-slate-500 hover:text-pink-400 cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredTooltip(
                              'Displaces Universe B by a microscopic factor (10^-9 = quantum scale, 10^-3 = macro scale).'
                            )
                          }
                          onMouseLeave={() => setHoveredTooltip(null)}
                        />
                      </div>
                      <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                        10^{logExp.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                      Nudges Universe B's position. Watch how even a microscopic nudge ($10^{-7}$) violently diverges over time.
                    </p>
                    <input
                      type="range"
                      min="-9"
                      max="-3"
                      step="0.1"
                      value={logExp}
                      onChange={handleSliderChange}
                      className="w-full accent-pink-500 bg-space-700 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                      <span>10^-9 (Quantum)</span>
                      <span>10^-6 (Nano)</span>
                      <span>10^-3 (Macro)</span>
                    </div>
                  </div>

                  {/* Universe Overlays Toggle */}
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Parallel Universes
                    </span>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-800/50 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        <span className="font-medium text-slate-200">Universe A (Control Solid)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showA}
                        onChange={onToggleShowA}
                        className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-800/50 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-pink-500 shadow-sm shadow-pink-500" />
                        <span className="font-medium text-slate-200">Universe B (Perturbed Ghost)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showB}
                        onChange={onToggleShowB}
                        className="accent-pink-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MASS & SIZE PARAMETERS */}
              {activeTab === 'physics' && (
                <div className="space-y-4">
                  {/* Visual Size Scale Slider */}
                  <div className="p-3 rounded-xl bg-space-800/60 border border-cyan-500/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                        <label className="font-semibold text-cyan-300">Visual Size Multiplier</label>
                      </div>
                      <span className="font-mono text-cyan-400">{sizeScale.toFixed(1)}x</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Scales the 3D radius of all bodies for clarity without altering their gravitational mass.
                    </p>
                    <input
                      type="range"
                      min="0.4"
                      max="3.0"
                      step="0.1"
                      value={sizeScale}
                      onChange={(e) => onSizeScaleChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-space-700 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Body Masses Editor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Individual Body Masses
                      </span>
                      <HelpCircle
                        className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredTooltip('Increasing mass increases gravitational pull F = G*(m1*m2)/r^2.')
                        }
                        onMouseLeave={() => setHoveredTooltip(null)}
                      />
                    </div>
                    {[0, 1, 2].map((idx) => (
                      <div key={`mass-input-${idx}`} className="p-2 rounded-xl bg-space-800/40 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bodyColors[idx] }} />
                            Body {idx + 1} Mass:
                          </span>
                          <span className="text-cyan-400 font-bold">{masses[idx].toFixed(1)} m₀</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="20.0"
                          step="0.1"
                          value={masses[idx]}
                          onChange={(e) => onMassChange(idx, parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 bg-space-700 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Time Step & Precision */}
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Solver Numerics
                    </span>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-300">Time Step (dt)</label>
                        <span className="font-mono text-cyan-400">{dt.toFixed(4)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="0.02"
                        step="0.001"
                        value={dt}
                        onChange={(e) => onDtChange(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 bg-space-700 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-300">RK4 Sub-Steps</label>
                        <span className="font-mono text-cyan-400">{subSteps} / frame</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={subSteps}
                        onChange={(e) => onSubStepsChange(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 bg-space-700 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-300">Trail Buffer</label>
                        <span className="font-mono text-cyan-400">{trailLength} pts</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="800"
                        step="50"
                        value={trailLength}
                        onChange={(e) => onTrailLengthChange(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 bg-space-700 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BODY COLORS TAB */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Signature Body Colors
                    </span>
                    <HelpCircle
                      className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredTooltip('Assigns distinct signature colors to Body 1, 2, and 3 across both universes!')
                      }
                      onMouseLeave={() => setHoveredTooltip(null)}
                    />
                  </div>

                  {/* Individual Body Color Pickers */}
                  <div className="space-y-2">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={`color-picker-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-space-800/50 border border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: bodyColors[idx] }}
                          />
                          <span className="font-semibold text-slate-200">Body {idx + 1} Color</span>
                        </div>
                        <input
                          type="color"
                          value={bodyColors[idx]}
                          onChange={(e) => onBodyColorChange(idx, e.target.value)}
                          className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Curated Color Palettes */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Preset Color Schemes
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PALETTE_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => onApplyColorPalette(p.colors)}
                          className="p-2 rounded-xl bg-space-800/60 border border-white/5 hover:border-cyan-400/50 text-left transition-all space-y-1.5"
                        >
                          <span className="font-semibold text-[11px] text-slate-300 block">{p.name}</span>
                          <div className="flex gap-1.5">
                            {p.colors.map((c, i) => (
                              <span
                                key={`${p.name}-${i}`}
                                className="w-3.5 h-3.5 rounded-full border border-white/10"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CAMERA & VIEW */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Target Lock Mode
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'free', label: 'Free Orbit Camera' },
                      { id: 'body0', label: 'Lock onto Body 1' },
                      { id: 'body1', label: 'Lock onto Body 2' },
                      { id: 'body2', label: 'Lock onto Body 3' },
                      { id: 'com', label: 'Lock to Center of Mass' },
                    ].map((mode) => {
                      const active = cameraMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => onCameraModeChange(mode.id as CameraTargetMode)}
                          className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                            active
                              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 font-semibold'
                              : 'bg-space-800/40 border-white/5 text-slate-300 hover:bg-space-800'
                          }`}
                        >
                          <span>{mode.label}</span>
                          <Eye className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
