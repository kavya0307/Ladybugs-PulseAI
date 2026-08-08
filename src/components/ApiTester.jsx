import React, { useState } from 'react';
import { Terminal, Send, Copy, Check, Play, Code } from 'lucide-react';

export default function ApiTester({ agentId }) {
  const [initPayload, setInitPayload] = useState(
    JSON.stringify({ persona: { name: 'Ada', domain: 'AI Security' } }, null, 2)
  );
  const [initResponse, setInitResponse] = useState(null);
  const [feedResponse, setFeedResponse] = useState(null);
  const [loadingEndpoint, setLoadingEndpoint] = useState(null);
  const [copiedCurl, setCopiedCurl] = useState(null);

  const currentAgentId = agentId || 'abc-123';

  const handleTestInit = async () => {
    setLoadingEndpoint('INIT');
    try {
      const parsed = JSON.parse(initPayload);
      const res = await fetch('/api/agent/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      setInitResponse({ status: res.status, data });
    } catch (e) {
      setInitResponse({ status: 500, error: e.message });
    } finally {
      setLoadingEndpoint(null);
    }
  };

  const handleTestFeed = async () => {
    setLoadingEndpoint('FEED');
    try {
      const res = await fetch(`/api/agent/feed?agentId=${currentAgentId}`);
      const data = await res.json();
      setFeedResponse({ status: res.status, data });
    } catch (e) {
      setFeedResponse({ status: 500, error: e.message });
    } finally {
      setLoadingEndpoint(null);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(key);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  const initCurl = `curl -X POST http://localhost:5000/api/agent/init \\\n  -H "Content-Type: application/json" \\\n  -d '${initPayload.replace(/\n/g, '')}'`;
  const feedCurl = `curl "http://localhost:5000/api/agent/feed?agentId=${currentAgentId}"`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white font-display">Evaluator API Inspection Console</h2>
        </div>
        <p className="text-xs text-slate-400">
          Directly test the two required HTTP endpoints <code className="font-mono text-cyan-300">POST /api/agent/init</code> and <code className="font-mono text-cyan-300">GET /api/agent/feed</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. POST /api/agent/init */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 font-mono">POST</span>
              <span className="text-sm font-bold text-white font-mono">/api/agent/init</span>
            </div>
            <button
              onClick={() => copyToClipboard(initCurl, 'init')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            >
              {copiedCurl === 'init' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedCurl === 'init' ? 'Copied cURL' : 'cURL'}
            </button>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-mono">Request JSON Body:</label>
            <textarea
              rows={5}
              value={initPayload}
              onChange={(e) => setInitPayload(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleTestInit}
            disabled={loadingEndpoint === 'INIT'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition"
          >
            <Play className="w-3.5 h-3.5" />
            {loadingEndpoint === 'INIT' ? 'Executing Request...' : 'Send POST /api/agent/init'}
          </button>

          {initResponse && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span>Response Status: <strong className="text-emerald-400">{initResponse.status} OK</strong></span>
              </div>
              <pre className="text-slate-200 overflow-x-auto">{JSON.stringify(initResponse.data || initResponse.error, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* 2. GET /api/agent/feed?agentId=... */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-300 font-mono">GET</span>
              <span className="text-sm font-bold text-white font-mono">/api/agent/feed?agentId={currentAgentId}</span>
            </div>
            <button
              onClick={() => copyToClipboard(feedCurl, 'feed')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            >
              {copiedCurl === 'feed' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedCurl === 'feed' ? 'Copied cURL' : 'cURL'}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono">
            Query Parameter: <span className="text-cyan-300 font-bold">agentId={currentAgentId}</span>
          </div>

          <button
            onClick={handleTestFeed}
            disabled={loadingEndpoint === 'FEED'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
          >
            <Play className="w-3.5 h-3.5" />
            {loadingEndpoint === 'FEED' ? 'Fetching Feed...' : 'Send GET /api/agent/feed'}
          </button>

          {feedResponse && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span>Response Status: <strong className="text-emerald-400">{feedResponse.status} OK</strong></span>
                <span>Posts: {feedResponse.data?.posts?.length || 0}</span>
              </div>
              <pre className="text-slate-200 overflow-x-auto">{JSON.stringify(feedResponse.data || feedResponse.error, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
