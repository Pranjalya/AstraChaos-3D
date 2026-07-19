'use client';

import React from 'react';
import { Cpu, Zap, Activity, AlertTriangle, BookOpen, Github, User } from 'lucide-react';

interface HeaderProps {
  fps: number;
  isWasm: boolean;
  divergence: number;
  elapsedTime: number;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ fps, isWasm, divergence, elapsedTime, onOpenGuide }) => {
  const isDivergent = divergence > 0.5;

  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl glass-panel pointer-events-auto">
      {/* Title & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-universeA via-cyan-400 to-universeB p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-space-900 rounded-[10px] flex items-center justify-center text-xl">
            🦋
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-wider text-white bg-gradient-to-r from-cyan-400 via-white to-pink-500 bg-clip-text text-transparent">
              AstraChaos 3D
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 rounded-full">
              RK4 Solver
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            Deterministic Chaos & Parallel Gravitational Universes
          </p>
        </div>
      </div>

      {/* Realtime Badges, Developer Link & Guide Button */}
      <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          title="GitHub Repository"
        >
          <Github className="w-3.5 h-3.5 text-slate-200" />
          <span className="font-sans font-medium text-[11px] hidden sm:inline">GitHub</span>
        </a>

        {/* Guide Button */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 hover:border-cyan-300 hover:text-white transition-all shadow-md"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold font-sans">Physics Guide</span>
        </button>

        {/* Engine Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
          isWasm
            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          {isWasm ? <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isWasm ? 'WASM Engine' : 'TS Solver'}</span>
        </div>

        {/* FPS Meter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800/80 border border-slate-700/50 text-slate-300 hidden md:flex">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{fps} FPS</span>
        </div>

        {/* Time Elapsed */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-800/80 border border-slate-700/50 text-slate-300 hidden sm:flex">
          <span className="text-slate-400">t =</span>
          <span>{elapsedTime.toFixed(1)}s</span>
        </div>

        {/* Inflection Alert */}
        {isDivergent && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/80 border border-pink-500/50 text-pink-300 animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-semibold hidden lg:inline">Butterfly Inflection Hit!</span>
          </div>
        )}
      </div>
    </header>
  );
};
