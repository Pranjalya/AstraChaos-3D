'use client';

import React, { useState } from 'react';
import { 
  Target, 
  Sparkles, 
  Terminal, 
  Zap, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Rocket,
  Flame,
  Globe2,
  ShieldCheck,
  ZapOff,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { streamInverseOptimization } from '@/utils/copilotClient';
import { CopilotResponsePayload } from '@/types/physics';

interface InverseOptimizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCopilotPayload: (payload: CopilotResponsePayload) => void;
}

const PRESET_GOAL_CHIPS = [
  {
    id: 'slingshot',
    icon: Rocket,
    title: '🚀 Slingshot Boost',
    description: 'Maximize Body 3 kinetic energy ratio via gravity assist close encounter.',
    prompt: 'Find an initial condition where Body 3 slingshots around Body 1 with maximum velocity boost.',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400'
  },
  {
    id: 'ejection',
    icon: Flame,
    title: '☄️ Chaotic Ejection',
    description: 'Force Body 3 to start bound and escape outwards at target horizon.',
    prompt: 'Force Body 3 to start bound in a triple system and escape outwards into deep space.',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-400'
  },
  {
    id: 'binary_capture',
    icon: Globe2,
    title: '🌌 Binary Capture & Exchange',
    description: 'Transfer Body 3 from orbiting Body 1 to capturing orbit around Body 2.',
    prompt: 'Transfer Body 3 from orbiting Body 1 to a capturing orbit around Body 2.',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400'
  },
  {
    id: 'trojan_resonance',
    icon: ShieldCheck,
    title: '🛡️ Trojan Equilibrium',
    description: 'Maintain stable equilateral triangle L4/L5 configuration.',
    prompt: 'Maintain a stable equilateral triangle L4/L5 Trojan orbit configuration.',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400'
  },
  {
    id: 'triple_encounter',
    icon: ZapOff,
    title: '💥 Triple Close Flyby',
    description: 'All 3 bodies pass within close proximity without collisional impact.',
    prompt: 'Synthesize a close-proximity triple body flyby without collisional impact.',
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400'
  }
];

export const InverseOptimizerDrawer: React.FC<InverseOptimizerDrawerProps> = ({
  isOpen,
  onClose,
  onApplyCopilotPayload
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('slingshot');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isChipsCollapsed, setIsChipsCollapsed] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [generation, setGeneration] = useState<number>(0);
  const [maxGenerations, setMaxGenerations] = useState<number>(40);
  const [bestFitness, setBestFitness] = useState<number>(0.0);
  const [resultPayload, setResultPayload] = useState<CopilotResponsePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartOptimization = async (goalId: string = selectedGoal, promptOverride?: string) => {
    const activePrompt = promptOverride !== undefined ? promptOverride : customPrompt;
    setSelectedGoal(goalId);
    if (promptOverride !== undefined) {
      setCustomPrompt(promptOverride);
    }
    // Auto-collapse preset suggestion chips section when optimization starts
    setIsChipsCollapsed(true);
    setIsOptimizing(true);
    setProgressPct(0);
    setGeneration(0);
    setBestFitness(0.0);
    setResultPayload(null);
    setErrorMessage(null);

    await streamInverseOptimization(
      goalId,
      activePrompt,
      (pct, gen, maxGen, fitness) => {
        setProgressPct(pct);
        setGeneration(gen);
        setMaxGenerations(maxGen);
        setBestFitness(fitness);
      },
      (payload) => {
        setIsOptimizing(false);
        setProgressPct(100);
        setResultPayload(payload);
      },
      (err) => {
        setIsOptimizing(false);
        setErrorMessage(err);
      }
    );
  };

  const handleInjectOrbit = () => {
    if (resultPayload) {
      onApplyCopilotPayload(resultPayload);
      onClose();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <Target className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Inverse Physics Agent
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono">
                CMA-ES / SSE
              </span>
            </h2>
            <p className="text-xs text-slate-400">Generative NLP & target trajectory optimization</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Intro Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Reverse-Engineer Chaotic Initial Conditions
          </p>
          <p className="text-slate-400 leading-relaxed">
            Pose any custom natural language target asking or select a suggestion chip below. The AI optimization engine searches 18D state vector space (positions r_i, velocities v_i) using evolutionary rollouts to discover matching initial states.
          </p>
        </div>

        {/* Custom Asking Natural Language Text Input Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Pose Your Custom Target Asking</span>
            <span className="text-[10px] text-cyan-400 font-mono">Generative AI Search</span>
          </label>
          <div className="relative">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe your desired target orbit (e.g. 'Find an initial condition where Body 3 slingshots around Body 1 with maximum speed boost' or 'Eject Body 3 into deep space')..."
              rows={3}
              className="w-full p-3.5 pr-28 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 resize-none transition-all"
            />
            <button
              onClick={() => handleStartOptimization(selectedGoal, customPrompt)}
              disabled={isOptimizing || !customPrompt.trim()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Optimize</span>
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Preset Suggestion Chips
            </label>
            <button
              onClick={() => setIsChipsCollapsed(!isChipsCollapsed)}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
            >
              <span>{isChipsCollapsed ? 'Show Chips' : 'Hide Chips'}</span>
              {isChipsCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isChipsCollapsed && (
            <div className="grid grid-cols-1 gap-2.5 transition-all duration-300">
              {PRESET_GOAL_CHIPS.map((chip) => {
                const isSelected = selectedGoal === chip.id && customPrompt === chip.prompt;
                const IconComp = chip.icon;
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleStartOptimization(chip.id, chip.prompt)}
                    disabled={isOptimizing}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start space-x-3 group ${
                      isSelected
                        ? `bg-gradient-to-r ${chip.color} shadow-lg shadow-cyan-500/10 border-cyan-400`
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    } ${isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                          {chip.title}
                        </span>
                        {isSelected && isOptimizing && (
                          <span className="text-[10px] font-mono text-cyan-400 animate-pulse">Optimizing...</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{chip.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>


        {/* Real-Time Optimization Progress Box */}
        {(isOptimizing || progressPct > 0) && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 animate-spin" />
                Evolutionary Vector Search Progress
              </span>
              <span className="font-mono text-cyan-400">{progressPct}%</span>
            </div>

            {/* Cyber Progress Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/50"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Real-time Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Generation:</span>
                <span className="text-slate-200 font-bold">{generation} / {maxGenerations}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Best Fitness:</span>
                <span className="text-cyan-400 font-bold">{bestFitness.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Optimization Result Summary */}
        {resultPayload && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {resultPayload.system_name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{resultPayload.description}</p>
              </div>
            </div>

            {/* Scorecard Mini Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Total Energy E</span>
                <span className="text-slate-200 font-mono font-semibold">{resultPayload.diagnostics.total_energy} J</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Stability Horizon</span>
                <span className="text-cyan-400 font-mono font-semibold">{resultPayload.diagnostics.chaos_horizon_time} units</span>
              </div>
            </div>

            {/* Tool Logs */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                Optimization Tool Execution Stream
              </span>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                {resultPayload.tool_logs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-cyan-400">✓ {log.tool_name}</span>
                    <span className="text-slate-400">{log.result_summary}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Inject CTA */}
            <button
              onClick={handleInjectOrbit}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-pink-500 hover:from-cyan-400 hover:via-blue-500 hover:to-pink-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Inject Optimized Orbit into 3D Viewport</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <button
          onClick={() => handleStartOptimization(selectedGoal, customPrompt)}
          disabled={isOptimizing}
          className={`w-full py-2.5 rounded-xl border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all flex items-center justify-center space-x-2 ${
            isOptimizing ? 'bg-slate-900 opacity-50 cursor-not-allowed' : 'bg-cyan-500/10 hover:bg-cyan-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{isOptimizing ? 'Optimizing Trajectory...' : 'Run Inverse Optimization Rollout'}</span>
        </button>
      </div>
    </div>
  );
};
