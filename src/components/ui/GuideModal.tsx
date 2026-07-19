'use client';

import React from 'react';
import { X, HelpCircle, Sparkles, Scale, Cpu, Compass } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl glass-panel border border-white/15 overflow-hidden shadow-2xl flex flex-col bg-space-900/95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-space-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-space-900 rounded-[10px] flex items-center justify-center text-cyan-300">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                AstraChaos 3D — Guide & Physics Primer
              </h2>
              <p className="text-xs text-slate-400">
                Understanding deterministic chaos & parallel universe simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: The Three-Body Problem */}
          <div className="p-4 rounded-2xl bg-space-800/50 border border-white/5 space-y-2">
            <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              1. What is the Three-Body Problem?
            </h3>
            <p>
              In physics, two orbiting bodies (like Earth and the Sun) follow clean, predictable Kepler ellipses. However, as soon as a <strong>third body</strong> is added, their gravitational interactions create a non-linear feedback loop with no simple mathematical formula. The result is <strong>deterministic chaos</strong>.
            </p>
          </div>

          {/* Section 2: The Butterfly Effect & Dual Universes */}
          <div className="p-4 rounded-2xl bg-space-800/50 border border-white/5 space-y-2">
            <h3 className="font-bold text-sm text-pink-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-pink-400" />
              2. What is the Butterfly Effect?
            </h3>
            <p>
              The Butterfly Effect is the hallmark of chaotic systems: a tiny nudge in starting conditions causes massive, unpredictable divergences over time.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                <strong className="text-cyan-400">Universe A (Control - Cyan):</strong> Simulates the exact initial positions and velocities you set.
              </li>
              <li>
                <strong className="text-pink-400">Universe B (Perturbed - Magenta):</strong> Nudges Planet 1 position by a microscopic fraction (e.g. 10&#8315;&#8775; = 0.0000001).
              </li>
            </ul>
            <p>
              Cyan and Magenta initially overlap perfectly. As time ticks forward, they hit a <strong>chaotic inflection point</strong> where the two timelines violently split apart into completely different futures!
            </p>
          </div>

          {/* Section 3: Mass & Size Controls */}
          <div className="p-4 rounded-2xl bg-space-800/50 border border-white/5 space-y-2">
            <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              3. Does altering Mass & Size make physical sense?
            </h3>
            <p>
              <strong>Yes, absolutely!</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Mass (m):</strong> Directly governs gravitational pull. Heavy objects act like massive solar anchors, while lighter objects orbit quickly or get slingshotted into deep space.
              </li>
              <li>
                <strong>Visual Size Scale (R):</strong> In nature, physical volume scales with mass (V &propto; m). We provide a Visual Size Scale slider so you can enlarge small planets to make them easy to see or shrink massive stars for visual balance.
              </li>
            </ul>
          </div>

          {/* Section 4: Controls & Physics Telemetry */}
          <div className="p-4 rounded-2xl bg-space-800/50 border border-white/5 space-y-2">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              4. Quick Controls Glossary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-space-900/60 border border-slate-700/50">
                <span className="font-bold text-white block">Quantum Perturbation (&delta;)</span>
                Displacement applied to Universe B (10&#8315;&#8313; to 10&#8315;&#179;).
              </div>
              <div className="p-2 rounded-xl bg-space-900/60 border border-slate-700/50">
                <span className="font-bold text-white block">RK4 Integration</span>
                4th-Order Runge-Kutta numerical solver for 60 FPS accuracy.
              </div>
              <div className="p-2 rounded-xl bg-space-900/60 border border-slate-700/50">
                <span className="font-bold text-white block">Target Lock Camera</span>
                Anchors your view onto any planet or the system Center of Mass.
              </div>
              <div className="p-2 rounded-xl bg-space-900/60 border border-slate-700/50">
                <span className="font-bold text-white block">Divergence Distance</span>
                Measures Euclidean distance between Universe A and B over time.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-space-800/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold text-xs hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            Got it, Let's Explore Chaos!
          </button>
        </div>
      </div>
    </div>
  );
};
