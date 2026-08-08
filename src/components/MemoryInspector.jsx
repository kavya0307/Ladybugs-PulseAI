import React from 'react';
import { Brain, Database, Link, Hash, Sparkles, CheckCircle2 } from 'lucide-react';

export default function MemoryInspector({ agentStatus }) {
  const persona = agentStatus?.persona || {};
  const stats = agentStatus?.stats || {};
  const evaluatedCount = agentStatus?.evaluatedUrlsCount || 0;
  const postsCount = agentStatus?.totalPosts || 0;

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-display">Long-Term Memory & Deduplication Engine</h2>
          </div>
          <p className="text-xs text-slate-400">
            Remembers past published topics, evaluated source URLs, and topic hashes to maintain continuity and prevent repetition.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Memory Active & Persisted
        </div>
      </div>

      {/* Memory Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Published Feed Posts</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{postsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Saved in persistent store</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Evaluated Sources</span>
            <Link className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{evaluatedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unique URLs tracked</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Rejected Off-Topic</span>
            <Hash className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.totalRejected || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Filtered by editorial rule</div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Domain Alignment Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.totalDiscovered > 0
              ? `${Math.round((stats.totalApproved / stats.totalDiscovered) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Precision editorial ratio</div>
        </div>
      </div>

      {/* Domain Focus Keywords */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white font-display mb-3">
          Persona Memory Keyword Vector [{persona.name} - {persona.domain}]
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          The memory engine compares candidate news items against these active domain vectors and published post titles.
        </p>

        <div className="flex flex-wrap gap-2">
          {(persona.keywords || ['security', 'safety', 'alignment', 'jailbreak', 'adversarial']).map((kw, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono font-medium"
            >
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
