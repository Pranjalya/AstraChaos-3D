'use client';

import React, { useState } from 'react';
import { Rocket, Zap, Shield, Flame, RotateCcw, Crosshair, Sparkles } from 'lucide-react';
import { SlingshotPlan, Vector3D } from '@/types/physics';
import { fetchSlingshotPlan } from '@/utils/copilotClient';

interface SlingshotPanelProps {
  onLaunchProbe: (plan: SlingshotPlan) => void;
  onApplyImpulse: (dvX: number, dvY: number, dvZ: number) => void;
  onClearProbe: () => void;
  isProbeActive: boolean;
  currentMasses: [number, number, number];
  currentPosA: [Vector3D, Vector3D, Vector3D];
  currentVelA: [Vector3D, Vector3D, Vector3D];
  bodyColors: [string, string, string];
}

export const SlingshotPanel: React.FC<SlingshotPanelProps> = ({
  onLaunchProbe,
  onApplyImpulse,
  onClearProbe,
  isProbeActive,
  currentMasses,
  currentPosA,
  currentVelA,
  bodyColors
}) => {
  const [targetBodyIdx, setTargetBodyIdx] = useState<number>(1);
  const [maxDeltaV, setMaxDeltaV] = useState<number>(1.5);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<SlingshotPlan | null>(null);

  const handleCalculateSlingshot = async () => {
    setIsCalculating(true);
    try {
      const plan = await fetchSlingshotPlan(
        targetBodyIdx,
        maxDeltaV,
        currentMasses,
        currentPosA,
        currentVelA
      );
      setActivePlan(plan);
      onLaunchProbe(plan);
    } catch (err) {
      console.error('Failed to calculate RL Slingshot plan:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-cyan-500/30 text-white space-y-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Rocket className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
              RL Spacecraft Slingshot <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            </h3>
            <p className="text-xs text-gray-400">Delta-V Optimization & 4th-Body Gravity Assist</p>
          </div>
        </div>

        {isProbeActive && (
          <button
            onClick={() => {
              setActivePlan(null);
              onClearProbe();
            }}
            className="flex items-center space-x-1 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Abort Probe</span>
          </button>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Target Body Selection */}
        <div>
          <label className="text-gray-400 block mb-1 font-medium flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Target Body
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setTargetBodyIdx(idx)}
                className={`py-1.5 rounded-lg border text-center font-bold transition-all ${
                  targetBodyIdx === idx
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
                style={{ borderColor: targetBodyIdx === idx ? bodyColors[idx] : undefined }}
              >
                Body {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Max Delta-V Budget */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-gray-400 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Fuel Budget (Δv)
            </label>
            <span className="font-mono text-cyan-400 font-bold">{maxDeltaV.toFixed(1)} m/s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={maxDeltaV}
            onChange={(e) => setMaxDeltaV(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleCalculateSlingshot}
        disabled={isCalculating}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all disabled:opacity-50"
      >
        {isCalculating ? (
          <>
            <Zap className="w-4 h-4 animate-spin text-black" />
            <span>Running RL Trajectory Solver...</span>
          </>
        ) : (
          <>
            <Flame className="w-4 h-4 text-black" />
            <span>{isProbeActive ? 'Recalculate RL Slingshot' : 'Launch Probe & Optimize Slingshot'}</span>
          </>
        )}
      </button>

      {/* Slingshot Scorecard & Diagnostics */}
      {activePlan && (
        <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {/* Fuel Saved % */}
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="text-gray-400 font-medium text-[10px] uppercase">Gravity Assist Fuel Saved</div>
              <div className="text-lg font-black text-cyan-300 font-mono mt-0.5">
                +{activePlan.fuel_saved_percentage}%
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-500"
                  style={{ width: `${activePlan.fuel_saved_percentage}%` }}
                />
              </div>
            </div>

            {/* Kinetic Energy Gained */}
            <div className="p-2.5 rounded-xl bg-yellow-950/40 border border-yellow-500/30">
              <div className="text-gray-400 font-medium text-[10px] uppercase">Slingshot Flyby Boost</div>
              <div className="text-lg font-black text-yellow-300 font-mono mt-0.5">
                +{activePlan.kinetic_energy_gained} <span className="text-xs">J/kg</span>
              </div>
              <div className="text-[10px] text-yellow-400/80">Energy gained from gravity well</div>
            </div>
          </div>

          {/* Burn Events List */}
          {activePlan.burn_events.length > 0 && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="text-gray-300 font-bold text-[11px] uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> Planned Impulse Burns
              </div>
              {activePlan.burn_events.map((b, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-mono text-gray-300 bg-black/40 px-2 py-1 rounded">
                  <span>t={b.time}s</span>
                  <span className="text-cyan-300">Δv = {b.fuel_used} m/s</span>
                  <span className="text-gray-400">{b.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Manual Thruster Override */}
          <div>
            <div className="text-gray-400 font-medium mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Manual Thruster Impulse
            </div>
            <div className="grid grid-cols-6 gap-1 font-mono">
              {[
                { label: '+X', vec: [0.3, 0, 0] },
                { label: '-X', vec: [-0.3, 0, 0] },
                { label: '+Y', vec: [0, 0.3, 0] },
                { label: '-Y', vec: [0, -0.3, 0] },
                { label: '+Z', vec: [0, 0, 0.3] },
                { label: '-Z', vec: [0, 0, -0.3] }
              ].map((t, i) => (
                <button
                  key={i}
                  onClick={() => onApplyImpulse(t.vec[0], t.vec[1], t.vec[2])}
                  className="py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400 text-cyan-300 rounded font-bold text-[10px] transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
