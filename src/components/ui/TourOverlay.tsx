'use client';

import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Sliders, Layers, Palette, Activity, Orbit } from 'lucide-react';

interface TourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to AstraChaos 3D',
    subtitle: 'Interactive 3D Celestial Mechanics & Chaos Sandbox',
    description:
      'This simulation overlays two parallel universes (Universe A Control vs Universe B Perturbed). Click and drag anywhere on the screen to rotate the 3D scene, scroll to zoom, or right-click to pan.',
    icon: Orbit,
    badge: 'Step 1 of 6: 3D Viewport',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Orbital Presets Vault',
    subtitle: 'Explore Classic Three-Body Solutions',
    description:
      'In the Presets tab, select famous historical orbits: the stable Chenciner Figure-Eight loop, the violent Pythagorean 3-Body (Burrau) collision, or Lagrange Horseshoe orbits.',
    icon: Sparkles,
    badge: 'Step 2 of 6: Presets',
    color: 'from-cyan-400 to-teal-400',
  },
  {
    title: 'Quantum Butterfly Perturbation',
    subtitle: 'Sensitivity to Initial Conditions',
    description:
      'In the Butterfly tab, adjust the perturbation slider (10^-9 to 10^-3). Watch Universe B start out identical to Universe A, then hit a chaotic inflection point where the timelines violently split apart!',
    icon: Layers,
    badge: 'Step 3 of 6: Butterfly Factor',
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Mass & Size Customization',
    subtitle: 'Warp Gravity & Scale Planet Radii',
    description:
      'In the Mass & Size tab, alter individual body masses to change gravitational pull (F = G*m1*m2/r^2). Use the Visual Size Multiplier slider to enlarge small planets or shrink massive stars for visual clarity.',
    icon: Sliders,
    badge: 'Step 4 of 6: Physics',
    color: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Signature Per-Body Colors',
    subtitle: 'Track Individual Planets Across Timelines',
    description:
      'In the Body Colors tab, assign distinct signature colors to Body 1, 2, and 3. Universe A displays solid glowing spheres, while Universe B displays wireframe ghost halos in the exact same color!',
    icon: Palette,
    badge: 'Step 5 of 6: Colors',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Real-Time Divergence Analytics',
    subtitle: 'Live Telemetry & Inflection Alert',
    description:
      'The chart at the bottom tracks Euclidean divergence distance ||r_A - r_B|| over time. When chaos explodes, the top header triggers the "Butterfly Inflection Hit!" alert banner.',
    icon: Activity,
    badge: 'Step 6 of 6: Telemetry',
    color: 'from-emerald-400 to-teal-500',
  },
];

export const TourOverlay: React.FC<TourOverlayProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-white/20 overflow-hidden shadow-2xl flex flex-col bg-space-900/95">
        {/* Step Progress Bar */}
        <div className="flex h-1.5 w-full bg-space-800">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={`progress-${i}`}
              className={`flex-1 transition-all duration-300 ${
                i <= currentStep ? 'bg-gradient-to-r from-cyan-400 to-pink-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Card Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-space-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${step.color} p-0.5 shadow-lg flex items-center justify-center`}>
              <div className="w-full h-full bg-space-900 rounded-[14px] flex items-center justify-center text-white">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-400">
                {step.badge}
              </span>
              <h3 className="text-base font-bold text-white tracking-wide">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-3 text-slate-300 text-xs leading-relaxed">
          <p className="font-semibold text-slate-200 text-sm">{step.subtitle}</p>
          <p className="text-slate-300 leading-relaxed bg-space-800/50 p-4 rounded-2xl border border-white/5">
            {step.description}
          </p>
        </div>

        {/* Card Footer Controls */}
        <div className="p-4 border-t border-white/10 bg-space-800/60 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium text-xs transition-all ${
              isFirst
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'bg-space-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={`dot-${i}`}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-5 bg-cyan-400' : 'bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold text-xs hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            <span>{isLast ? 'Finish Tour' : 'Next Step'}</span>
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
