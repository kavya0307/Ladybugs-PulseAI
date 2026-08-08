import React from 'react';
import { Bot, RefreshCw, Zap, Shield, Sparkles } from 'lucide-react';

export default function Header({ agentStatus, onRefresh, onTrigger, isTriggering }) {
  const persona = agentStatus?.persona || { name: 'Ada', domain: 'AI Security' };
  const isEvaluating = agentStatus?.status === 'EVALUATING';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Title & Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-7 h-7 animate-pulse-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Autonomous AI Creator
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Autonomous Persona
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Self-directed topic discovery, editorial judgment & periodic publishing
            </p>
          </div>
        </div>

        {/* Center Live Status Badge */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">
              Daemon Status: <strong className="text-emerald-400 font-mono">AUTONOMOUS_RUNNING</strong>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="text-xs text-slate-400">
            Agent ID: <span className="font-mono text-cyan-300 font-semibold">{agentStatus?.agentId || 'Initializing...'}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Refresh feed and status from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={onTrigger}
            disabled={isTriggering || isEvaluating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
            title="Manually trigger an immediate autonomous discovery & publishing tick"
          >
            <Zap className={`w-3.5 h-3.5 ${isTriggering || isEvaluating ? 'animate-spin' : ''}`} />
            {isTriggering || isEvaluating ? 'Evaluating Candidates...' : 'Run Autonomous Cycle'}
          </button>
        </div>

      </div>
    </header>
  );
}
