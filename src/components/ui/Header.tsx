'use client';

import React from 'react';
import { Cpu, Zap, Activity, AlertTriangle, BookOpen, Github, User, Compass, Bot, Target } from 'lucide-react';
import { warmupCopilotBackend } from '@/utils/copilotClient';

interface HeaderProps {
  fps: number;
  isWasm: boolean;
  divergence: number;
  elapsedTime: number;
  onOpenGuide: () => void;
  onStartTour: () => void;
  onOpenCopilot: () => void;
  onOpenInverseOptimizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fps,
  isWasm,
  divergence,
  elapsedTime,
  onOpenGuide,
  onStartTour,
  onOpenCopilot,
  onOpenInverseOptimizer,
}) => {
  const isDivergent = divergence > 0.5;

  return (
    <header className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-20 flex flex-wrap items-center justify-between gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-2xl glass-panel pointer-events-auto">
      {/* Title & Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-universeA via-cyan-400 to-universeB p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-space-900 rounded-[10px] flex items-center justify-center text-lg sm:text-xl">
            🦋
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-white bg-gradient-to-r from-cyan-400 via-white to-pink-500 bg-clip-text text-transparent">
              AstraChaos 3D
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 rounded-full">
              RK4 Solver
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium hidden md:block">
            Deterministic Chaos & Parallel Gravitational Universes
          </p>
        </div>
      </div>

      {/* Buttons & Badges */}
      <div className="flex items-center gap-1.5 sm:gap-3 font-mono text-xs">
        {/* Inverse Physics Optimizer Button */}
        <button
          onMouseEnter={warmupCopilotBackend}
          onClick={() => {
            warmupCopilotBackend();
            onOpenInverseOptimizer();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/50 text-cyan-300 font-bold text-xs hover:border-cyan-300 hover:text-white transition-all shadow-lg shadow-cyan-500/10"
          title="Open Target-Driven Inverse Physics AI Agent"
        >
          <Target className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="font-sans font-bold">Inverse AI</span>
        </button>

        {/* Agentic AI Copilot Button */}
        <button
          onMouseEnter={warmupCopilotBackend}
          onClick={() => {
            warmupCopilotBackend();
            onOpenCopilot();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-pink-500 text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-cyan-500/25 animate-pulse"
          title="Open Agentic AI Celestial Copilot"
        >
          <Bot className="w-4 h-4 text-cyan-200" />
          <span className="font-sans font-bold">AI Copilot</span>
        </button>



        {/* Onboarding Tour Button */}
        <button
          onClick={onStartTour}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-800/90 border border-slate-700/60 text-slate-200 font-semibold text-xs hover:border-cyan-400 hover:text-cyan-300 transition-all"
          title="Start Interactive UI Tour"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans hidden sm:inline">Tour</span>
        </button>

        {/* Physics Guide Button */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-800/90 border border-cyan-400/40 text-cyan-300 hover:border-cyan-300 hover:text-white transition-all"
          title="Open Physics & Chaos Primer"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans font-semibold hidden md:inline">Physics Guide</span>
        </button>

        {/* Developer Credit */}
        <a
          href="https://github.com/Pranjalya"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800/80 border border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
          title="Developer: Pranjalya Tiwari"
        >
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans font-medium text-[11px]">Pranjalya Tiwari</span>
        </a>

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/Pranjalya/AstraChaos-3D"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          title="GitHub Repository"
        >
          <Github className="w-3.5 h-3.5 text-slate-200" />
          <span className="font-sans font-medium text-[11px]">GitHub</span>
        </a>

        {/* Engine Badge */}
        <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
          isWasm
            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          {isWasm ? <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isWasm ? 'WASM Engine' : 'TS Solver'}</span>
        </div>

        {/* FPS Meter */}
        <div className="hidden lg:flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800/80 border border-slate-700/50 text-slate-300 w-[92px] tabular-nums shrink-0 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{fps} FPS</span>
        </div>



        {/* Inflection Alert */}
        {isDivergent && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-950/80 border border-pink-500/50 text-pink-300 animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-semibold hidden lg:inline">Butterfly Inflection!</span>
          </div>
        )}
      </div>
    </header>
  );
};
