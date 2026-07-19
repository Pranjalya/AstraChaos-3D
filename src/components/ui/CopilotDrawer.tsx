'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Terminal, 
  Zap, 
  Gauge, 
  Activity, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { fetchCopilotOrbit } from '@/utils/copilotClient';
import { CopilotResponsePayload } from '@/types/physics';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCopilotPayload: (payload: CopilotResponsePayload) => void;
}

const PROMPT_SUGGESTIONS = [
  {
    icon: '🪐',
    title: 'Binary Star & Rogue Companion',
    prompt: 'Create a massive binary star pair orbited by a lightweight companion planet in an unstable retrograde horseshoe path.'
  },
  {
    icon: '♾️',
    title: 'Figure-Eight Choreography',
    prompt: 'Generate a 3D Chenciner figure-eight periodic choreography with equal mass bodies.'
  },
  {
    icon: '💥',
    title: 'Pythagorean Triple Collision',
    prompt: 'Build a Burrau 3:4:5 ratio Pythagorean triple collision experiencing explosive gravitational scattering.'
  },
  {
    icon: '🌌',
    title: 'Hierarchical Solar-Jupiter System',
    prompt: 'Design a hierarchical triple system with a heavy sun, medium planet, and lightweight moon.'
  },
  {
    icon: '🌠',
    title: 'Hyperbolic Slingshot Flyby',
    prompt: 'Simulate a high-velocity rogue body plunging past a central binary system on a hyperbolic trajectory.'
  },
  {
    icon: '🌀',
    title: 'Lagrange L4 Trojan Triad',
    prompt: 'Create a massive star and companion with a lightweight asteroid librating near the 60 degree L4 Lagrange point.'
  },
  {
    icon: '☄️',
    title: 'Tidal Disruption Ejection',
    prompt: 'Model an unstable close encounter between three massive stars resulting in the violent ejection of body 3.'
  },
  {
    icon: '⚖️',
    title: 'Collinear Euler Instability',
    prompt: 'Set up an unstable Euler collinear triple alignment with a 1e-8 quantum perturbation.'
  }
];


export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  onApplyCopilotPayload
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activePayload, setActivePayload] = useState<CopilotResponsePayload | null>(null);

  const handleRunCopilot = async (selectedPrompt?: string) => {
    const query = selectedPrompt || prompt;
    if (!query.trim()) return;

    if (selectedPrompt) {
      setPrompt(selectedPrompt);
    }

    setIsLoading(true);
    try {
      const payload = await fetchCopilotOrbit(query);
      setActivePayload(payload);
    } catch (err) {
      console.error('[Copilot UI] Error running copilot query:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToSandbox = () => {
    if (activePayload) {
      onApplyCopilotPayload(activePayload);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-space-950/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      {/* Slide-out Panel */}
      <div className="w-full max-w-xl h-full bg-space-900/95 border-l border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Panel Header */}
        <div className="p-5 border-b border-cyan-500/20 bg-space-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg tracking-wide text-cyan-300 font-mono">
                  Agentic Physics Copilot
                </h2>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full">
                  FastAPI + Nemotron
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Natural language state vector synthesis & MCP tool calls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Prompt Input Box */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Describe Celestial System
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a heavy binary star pair orbited by a lightweight companion planet in a retrograde horseshoe orbit..."
                rows={3}
                className="w-full bg-[#05070f] border border-cyan-500/40 focus:border-cyan-400 rounded-xl p-3.5 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none font-sans shadow-inner"
              />
              <button
                onClick={() => handleRunCopilot()}
                disabled={isLoading || !prompt.trim()}
                className="absolute bottom-3 right-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" /> Thinking...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Execute Agent
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Suggested Prompt Chips
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PROMPT_SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunCopilot(chip.prompt)}
                  className="p-2.5 bg-[#0b0f19] hover:bg-[#131b2e] border border-cyan-500/20 hover:border-cyan-400/40 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{chip.icon}</span>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors font-mono">
                      {chip.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {chip.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Active Copilot Results & Tool Log Terminal */}
          {activePayload && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* System Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-space-950 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-cyan-300 text-base font-mono">
                    {activePayload.system_name}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> State Synthesized
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activePayload.description}
                </p>
              </div>

              {/* Tool Execution Terminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> MCP Tool Invocation Trace
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activePayload.tool_logs.length} Executions
                  </span>
                </div>

                <div className="bg-space-950 border border-cyan-500/25 rounded-xl p-3 font-mono text-xs space-y-2.5 max-h-52 overflow-y-auto custom-scrollbar">
                  {activePayload.tool_logs.map((log, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-space-800/60 pb-2 last:border-none last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-semibold text-[11px] flex items-center gap-1">
                          🔧 <code className="bg-cyan-950/60 px-1.5 py-0.5 rounded text-cyan-300">{log.tool_name}()</code>
                        </span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {log.status === 'LOCAL_SOLVER' || log.status === 'FALLBACK' ? 'OFFLINE SOLVER' : log.status}
                        </span>

                      </div>
                      <p className="text-[11px] text-slate-300 pl-4 border-l-2 border-cyan-500/30">
                        {log.description}
                      </p>
                      <p className="text-[10px] text-slate-400 pl-4 font-sans italic">
                        ↳ {log.result_summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physics Diagnostics Grid */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" /> Physics Diagnostics Scorecard
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-space-950/60 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Total Mechanical Energy (E=T+V)</span>
                    <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                      {activePayload.diagnostics.total_energy} <span className="text-xs font-normal text-slate-400">J</span>
                    </p>
                  </div>

                  <div className="bg-space-950/60 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Angular Momentum |L|</span>
                    <p className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                      {activePayload.diagnostics.angular_momentum}
                    </p>
                  </div>

                  <div className="bg-space-950/60 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Chaos Horizon Time</span>
                    <p className="text-base font-bold text-magenta-400 font-mono mt-0.5">
                      {activePayload.diagnostics.chaos_horizon_time} <span className="text-xs font-normal text-slate-400">units</span>
                    </p>
                  </div>

                  <div className="bg-space-950/60 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Stability Class</span>
                    <p className="text-xs font-bold text-emerald-400 font-mono mt-1 line-clamp-1">
                      {activePayload.diagnostics.stability_classification}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        {activePayload && (
          <div className="p-4 border-t border-cyan-500/20 bg-space-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Masses: {activePayload.masses.join(' : ')}</span>
            </div>

            <button
              onClick={handleApplyToSandbox}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-magenta-500 hover:from-cyan-300 hover:to-magenta-400 text-space-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> Inject Orbit into 3D Sandbox
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
