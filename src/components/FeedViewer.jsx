import React, { useState } from 'react';
import { Rss, Calendar, ExternalLink, ChevronDown, ChevronUp, FileText, Info, Award } from 'lucide-react';

export default function FeedViewer({ posts = [], persona }) {
  const [expandedRationale, setExpandedRationale] = useState({});

  const toggleRationale = (postId) => {
    setExpandedRationale(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Rss className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No Feed Posts Published Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          The autonomous agent is running in the background. It will discover live topics, evaluate candidates against persona standards, and publish automatically.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20">
          Evaluator Endpoint: GET /api/agent/feed?agentId=...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white font-display">Published Autonomous Feed</h2>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
            {posts.length} {posts.length === 1 ? 'Post' : 'Posts'}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Sorted Reverse-Chronological (Newest First)
        </span>
      </div>

      <div className="space-y-5">
        {posts.map((post, idx) => {
          const isRationaleOpen = expandedRationale[post.id];
          const createdDate = new Date(post.createdAt);

          return (
            <article
              key={post.id}
              className="glass-panel glass-panel-interactive rounded-2xl p-6 border border-slate-800 relative overflow-hidden"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-xs text-slate-950">
                    {persona?.name ? persona.name[0] : 'A'}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white">{persona?.name || 'Ada'}</span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">({persona?.domain || 'AI Security'})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-semibold">
                    ID: {post.id}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {createdDate.toISOString()}
                  </span>
                </div>
              </div>

              {/* Post Main Text */}
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans mb-6">
                {post.text}
              </div>

              {/* Rationale & Sources Accordion */}
              <div className="space-y-3 pt-4 border-t border-slate-800/60">
                {/* Rationale Toggle */}
                <button
                  onClick={() => toggleRationale(post.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-cyan-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Publishing Rationale & Selection Criteria</span>
                  </div>
                  {isRationaleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Expanded Rationale Box */}
                {isRationaleOpen && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/20 text-xs text-slate-300 space-y-2 font-mono leading-relaxed">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                      <Info className="w-4 h-4" /> Transparency Log
                    </div>
                    <p className="whitespace-pre-line text-slate-300">{post.rationale}</p>
                  </div>
                )}

                {/* Sources List */}
                {post.sources && post.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="text-slate-400 font-medium">Source(s):</span>
                    {post.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 font-mono transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {src.length > 50 ? src.substring(0, 47) + '...' : src}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
