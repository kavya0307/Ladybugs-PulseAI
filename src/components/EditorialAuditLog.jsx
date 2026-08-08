import React, { useState } from 'react';
import { Scale, CheckCircle, XCircle, AlertTriangle, Filter, Search } from 'lucide-react';

export default function EditorialAuditLog({ agentStatus }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const rejectedList = agentStatus?.rejectedCandidates || [];
  const stats = agentStatus?.stats || { totalDiscovered: 0, totalApproved: 0, totalRejected: 0 };

  const filtered = rejectedList.filter(item => {
    if (filterStatus === 'REJECTED' && !item.reason.includes('Rejected')) return false;
    if (filterStatus === 'DUPLICATE' && !item.reason.includes('Memory')) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.reason.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-display">Editorial Judgment Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-400">
            Demonstrating intentional rejection of off-topic, duplicate, or low-substance topics.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Discovered:</span>{' '}
            <strong className="text-slate-200 font-mono">{stats.totalDiscovered}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <span>Approved:</span>{' '}
            <strong className="font-mono">{stats.totalApproved}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <span>Rejected:</span>{' '}
            <strong className="font-mono">{stats.totalRejected}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filter:</span>
          {['ALL', 'REJECTED', 'DUPLICATE'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                filterStatus === st
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Audit Table / Cards */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800 text-slate-400 text-xs">
          No evaluated candidate logs matching search filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const isDuplicate = item.reason.includes('Memory') || item.reason.includes('overlap');
            const isSpam = item.reason.includes('clickbait') || item.reason.includes('promotional');

            return (
              <div
                key={item.id || idx}
                className="glass-panel rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-semibold text-white font-sans">{item.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      Source: {item.source}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-300 font-bold">
                      Score: {item.score}/100
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-rose-300/90 leading-relaxed">
                  <span className="font-bold text-rose-400">Editorial Rationale:</span> {item.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
