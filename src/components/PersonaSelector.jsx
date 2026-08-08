import React, { useState } from 'react';
import { UserCheck, Sparkles, Plus, CheckCircle2, Shield, Cpu, Scale, Code, Bot } from 'lucide-react';

const PRESETS = [
  { name: 'Ada', domain: 'AI Security', icon: Shield, title: 'AI Security Researcher' },
  { name: 'Marcus', domain: 'ML Infrastructure', icon: Cpu, title: 'ML Systems Engineer' },
  { name: 'Elena', domain: 'AI Ethics', icon: Scale, title: 'AI Governance Fellow' },
  { name: 'Kaelen', domain: 'Open Source AI', icon: Code, title: 'Dev Advocate' },
  { name: 'Soren', domain: 'Robotics', icon: Bot, title: 'Embodied AI Pioneer' }
];

export default function PersonaSelector({ currentPersona, onInitAgent, isInitializing }) {
  const [customName, setCustomName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSelectPreset = (preset) => {
    onInitAgent({ persona: { name: preset.name, domain: preset.domain } });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName || !customDomain) return;
    onInitAgent({ persona: { name: customName, domain: customDomain } });
    setCustomName('');
    setCustomDomain('');
    setShowCustomForm(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-display">Active Agent Persona</h2>
          </div>
          <p className="text-xs text-slate-400">
            Select or initialize an autonomous identity. Evaluators can call <code className="font-mono text-cyan-300">POST /api/agent/init</code> to change identity.
          </p>
        </div>

        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          {showCustomForm ? 'Close Custom Form' : 'New Custom Persona'}
        </button>
      </div>

      {/* Custom Persona Form */}
      {showCustomForm && (
        <form onSubmit={handleCustomSubmit} className="mb-6 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-300 mb-1">Persona Name</label>
            <input
              type="text"
              placeholder="e.g. Maya"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-300 mb-1">Technology Domain</label>
            <input
              type="text"
              placeholder="e.g. Agentic Workflow Architecture"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isInitializing}
            className="w-full md:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Agent'}
          </button>
        </form>
      )}

      {/* Preset Personas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentPersona?.name === preset.name;

          return (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset)}
              disabled={isInitializing}
              className={`flex flex-col justify-between text-left p-4 rounded-xl transition border ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className="font-bold text-sm text-white">{preset.name}</div>
                <div className="text-xs text-cyan-400/90 font-medium">{preset.domain}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                {preset.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
