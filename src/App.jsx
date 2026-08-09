import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PersonaSelector from './components/PersonaSelector';
import FeedViewer from './components/FeedViewer';
import EditorialAuditLog from './components/EditorialAuditLog';
import MemoryInspector from './components/MemoryInspector';
import ApiTester from './components/ApiTester';
import { Rss, Scale, Brain, UserCheck, Terminal, Sparkles } from 'lucide-react';

export default function App() {
  const [agentId, setAgentId] = useState('agent-ada-nrie7');
  const [agentStatus, setAgentStatus] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [allowManualTrigger, setAllowManualTrigger] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(false);

  // Initial load
  useEffect(() => {
    // Check whether manual triggering is enabled for this deployment (dev-only feature)
    fetch('/api/agent/config')
      .then(res => res.json())
      .then(cfg => {
        setAllowManualTrigger(!!cfg.allowManualTrigger);
        setLlmEnabled(!!cfg.llmEnabled);
      })
      .catch(() => { setAllowManualTrigger(false); setLlmEnabled(false); });

    // Check if we need to auto-init Ada default persona
    fetchStatusAndFeed(agentId);

    // Auto-poll status and feed every 5 seconds for real-time live updates
    const timer = setInterval(() => {
      if (agentId) {
        fetchStatusAndFeed(agentId);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [agentId]);

  const fetchStatusAndFeed = async (targetAgentId) => {
    if (!targetAgentId) return;

    try {
      // Fetch Feed
      const feedRes = await fetch(`/api/agent/feed?agentId=${targetAgentId}`);
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setFeedPosts(feedData.posts || []);
      }

      // Fetch Status
      const statusRes = await fetch(`/api/agent/status?agentId=${targetAgentId}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAgentStatus(statusData);
      }
    } catch (err) {
      console.error('Error fetching agent status/feed:', err);
    }
  };

  // Handle POST /api/agent/init
  const handleInitAgent = async (payload) => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/agent/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.agentId) {
        setAgentId(data.agentId);
        // Wait briefly for initial discovery cycle to finish
        setTimeout(() => {
          fetchStatusAndFeed(data.agentId);
        }, 1200);
      }
    } catch (err) {
      console.error('Error initializing agent:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle manual trigger
  const handleTriggerCycle = async () => {
    if (!agentId) return;
    setIsTriggering(true);
    try {
      await fetch('/api/agent/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });
      await fetchStatusAndFeed(agentId);
    } catch (err) {
      console.error('Error triggering autonomous cycle:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Top Header */}
      <Header
        agentStatus={agentStatus}
        onRefresh={() => fetchStatusAndFeed(agentId)}
        onTrigger={handleTriggerCycle}
        isTriggering={isTriggering}
        allowManualTrigger={allowManualTrigger}
        llmEnabled={llmEnabled}
      />

      <main className="max-w-7xl mx-auto px-6 flex-1 w-full space-y-6">

        {/* Persona Selector Card */}
        <PersonaSelector
          currentPersona={agentStatus?.persona}
          onInitAgent={handleInitAgent}
          isInitializing={isInitializing}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'feed', label: 'Autonomous Feed', icon: Rss, count: feedPosts.length },
            { id: 'audit', label: 'Editorial Audit Log', icon: Scale, count: agentStatus?.rejectedCandidates?.length },
            { id: 'memory', label: 'Long-Term Memory', icon: Brain },
            { id: 'api', label: 'API Console (/api/agent)', icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition border ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Tab View */}
        <div>
          {activeTab === 'feed' && (
            <FeedViewer posts={feedPosts} persona={agentStatus?.persona} />
          )}

          {activeTab === 'audit' && (
            <EditorialAuditLog agentStatus={agentStatus} />
          )}

          {activeTab === 'memory' && (
            <MemoryInspector agentStatus={agentStatus} />
          )}

          {activeTab === 'api' && (
            <ApiTester agentId={agentId} />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-500 border-t border-slate-900 pt-8">
        <p className="font-mono">Autonomous AI Creator Agent &bull; Powered by Live Information Sources &amp; Editorial Judgment</p>
      </footer>
    </div>
  );
}
