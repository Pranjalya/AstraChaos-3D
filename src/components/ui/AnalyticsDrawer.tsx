'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { DivergencePoint } from '@/types/physics';
import { LineChart as ChartIcon, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface AnalyticsDrawerProps {
  metricsHistory: DivergencePoint[];
  currentDivergence: number;
}

export const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  metricsHistory,
  currentDivergence,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [useLogScale, setUseLogScale] = useState(true);

  // Take recent metrics for display
  const chartData = metricsHistory.slice(-120);

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-20 pointer-events-auto transition-all duration-300">
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-2xl">
        {/* Drawer Header Toggle */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 bg-space-800/80 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <ChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Divergence Analytics</span>
                <span className="font-mono text-[10px] text-pink-400 bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-500/30">
                  ||r_A - r_B|| = {currentDivergence.toExponential(2)}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Scale toggle */}
            {isOpen && (
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono bg-space-900/60 px-1.5 py-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setUseLogScale(false)}
                  className={`px-1.5 py-0.5 rounded ${
                    !useLogScale ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  Linear
                </button>
                <button
                  onClick={() => setUseLogScale(true)}
                  className={`px-1.5 py-0.5 rounded ${
                    useLogScale ? 'bg-pink-500/30 text-pink-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  Log10
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Chart Content */}
        {isOpen && (
          <div className="p-2 sm:p-3 bg-space-900/90 h-36 sm:h-52 w-full relative">
            {chartData.length < 3 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Collecting orbital state telemetry...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `${v}s`}
                    dy={5}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    domain={useLogScale ? [-9, 2] : [0, 'auto']}
                    tickFormatter={(v) => (useLogScale ? `10^${v.toFixed(0)}` : v.toFixed(2))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0f19',
                      borderColor: '#ff007f',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [
                      useLogScale ? `10^${Number(val).toFixed(2)}` : Number(val).toExponential(3),
                      'Divergence Distance',
                    ]}
                    labelFormatter={(lbl) => `Time: ${lbl}s`}
                  />
                  <ReferenceLine
                    y={useLogScale ? -1 : 0.5}
                    stroke="#ff007f"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Inflection Threshold',
                      fill: '#ff007f',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={useLogScale ? 'logDivergence' : 'divergence'}
                    stroke="#ff007f"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#00f3ff', stroke: '#ff007f', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
