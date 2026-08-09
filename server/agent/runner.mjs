/**
 * Autonomous Agent Runner & Scheduler for Autonomous AI Creator.
 */

import { getPersonaConfig } from './persona.mjs';
import { getAgentMemory, updateAgentMemory } from './memory.mjs';
import { discoverTopics } from './discovery.mjs';
import { evaluateTopics, generatePost } from './editorial.mjs';

// Map of active background intervals by agentId
const activeIntervals = new Map();
const activeRunState = new Map();

/**
 * Initialize agent and launch autonomous background loop
 */
export async function initAgent(inputPersona = {}) {
  const persona = getPersonaConfig(inputPersona.persona || inputPersona);
  const agentId = inputPersona.agentId || `agent-${persona.name.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;

  // Update memory store with initialized persona
  updateAgentMemory(agentId, (mem) => {
    mem.persona = persona;
    mem.status = 'ACTIVE';
    return mem;
  });

  // Start autonomous background loop if not already running
  if (!activeIntervals.has(agentId)) {
    // Run an immediate cycle synchronously/async
    runAutonomousCycle(agentId).catch(console.error);

    // Schedule periodic autonomous runs (every 45 seconds for demo/evaluation observability)
    const timer = setInterval(() => {
      runAutonomousCycle(agentId).catch(console.error);
    }, 45000);

    activeIntervals.set(agentId, timer);
  }

  return { agentId, persona };
}

/**
 * Executes one autonomous cycle (Discovery -> Editorial Judgment -> Writing -> Memory Save)
 */
export async function runAutonomousCycle(agentId) {
  if (activeRunState.get(agentId)) {
    return; // cycle already in progress
  }

  activeRunState.set(agentId, true);

  try {
    const memory = getAgentMemory(agentId);
    const persona = memory.persona || getPersonaConfig();

    console.log(`[Agent ${agentId} (${persona.name})] 🔍 Starting Autonomous Discovery Cycle...`);

    // 1. Discover live candidate topics
    const candidates = await discoverTopics();

    // Filter out candidates whose URLs are already in memory.evaluatedUrls
    let freshCandidates = candidates.filter(c => !memory.evaluatedUrls.includes(c.url));

    // If all current live URLs have been evaluated once, pick un-published topics for fresh analysis
    if (freshCandidates.length === 0) {
      const publishedUrls = new Set(memory.posts.flatMap(p => p.sources || []));
      freshCandidates = candidates.filter(c => !publishedUrls.has(c.url));
    }

    console.log(`[Agent ${agentId}] Discovered ${freshCandidates.length} candidate topics for evaluation.`);

    // 2. Perform Editorial Evaluation
    const evaluated = await evaluateTopics(freshCandidates, persona, memory);

    const approvedList = evaluated.filter(e => e.status === 'APPROVED');
    const rejectedList = evaluated.filter(e => e.status === 'REJECTED');

    console.log(`[Agent ${agentId}] Editorial Review: ${approvedList.length} approved, ${rejectedList.length} rejected.`);

    // 3. Publish Top Approved Topic
    let newPostCreated = null;

    if (approvedList.length > 0) {
      // Pick top scoring candidate
      approvedList.sort((a, b) => b.score - a.score);
      const topApproved = approvedList[0];

      newPostCreated = await generatePost(topApproved, rejectedList, persona, memory.posts.length + 1);
      console.log(`[Agent ${agentId}] ✍️ Post written by: ${newPostCreated._writtenBy}`);
      delete newPostCreated._writtenBy; // internal debug field only, not part of the public API contract

      console.log(`[Agent ${agentId}] 📝 Published new post ID: ${newPostCreated.id}`);
    } else {
      console.log(`[Agent ${agentId}] ⚠️ No candidate met publishing threshold this cycle.`);
    }

    // 4. Update Memory
    updateAgentMemory(agentId, (mem) => {
      mem.lastRunAt = new Date().toISOString();
      mem.stats.totalDiscovered += freshCandidates.length;
      mem.stats.totalApproved += approvedList.length;
      mem.stats.totalRejected += rejectedList.length;

      // Track evaluated URLs
      const newUrls = freshCandidates.map(c => c.url);
      mem.evaluatedUrls = Array.from(new Set([...mem.evaluatedUrls, ...newUrls]));

      // Log rejected candidates for audit log
      const rejectedLogs = rejectedList.map(r => ({
        id: `rej-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        title: r.candidate.title,
        url: r.candidate.url,
        source: r.candidate.source,
        score: r.score,
        reason: r.reason
      }));

      mem.rejectedCandidates = [...rejectedLogs, ...(mem.rejectedCandidates || [])].slice(0, 50);

      // Prepend new post (newest first)
      if (newPostCreated) {
        mem.posts = [newPostCreated, ...mem.posts];
      }

      return mem;
    });

    return {
      success: true,
      postCreated: newPostCreated,
      approvedCount: approvedList.length,
      rejectedCount: rejectedList.length
    };

  } catch (err) {
    console.error(`[Agent ${agentId}] Error in autonomous cycle:`, err);
    return { success: false, error: err.message };
  } finally {
    activeRunState.set(agentId, false);
  }
}

/**
 * Get feed of posts for an agentId (reverse chronological order)
 */
export function getAgentFeed(agentId) {
  const memory = getAgentMemory(agentId);
  return {
    posts: memory.posts || []
  };
}

/**
 * Get detailed status for dashboard/debugging
 */
export function getAgentStatus(agentId) {
  const memory = getAgentMemory(agentId);
  return {
    agentId,
    persona: memory.persona,
    status: activeRunState.get(agentId) ? 'EVALUATING' : 'IDLE_WAITING',
    isAutonomousLoopRunning: activeIntervals.has(agentId),
    lastRunAt: memory.lastRunAt,
    totalPosts: memory.posts ? memory.posts.length : 0,
    stats: memory.stats,
    rejectedCandidates: memory.rejectedCandidates || [],
    evaluatedUrlsCount: memory.evaluatedUrls ? memory.evaluatedUrls.length : 0
  };
}
