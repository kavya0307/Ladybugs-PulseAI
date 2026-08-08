/**
 * Memory persistence and deduplication store for Autonomous AI Creator.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read memory state from store.json
 */
export function getStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return { agents: {} };
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { agents: {} };
  }
}

/**
 * Save store state to store.json
 */
export function saveStore(store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving store:', e);
  }
}

/**
 * Initialize or get memory for an agentId
 */
export function getAgentMemory(agentId) {
  const store = getStore();
  if (!store.agents) {
    store.agents = {};
  }
  if (!store.agents[agentId]) {
    store.agents[agentId] = {
      agentId,
      persona: { name: "Ada", domain: "AI Security" },
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      posts: [],
      rejectedCandidates: [],
      evaluatedUrls: [],
      topicHashes: [],
      stats: {
        totalDiscovered: 0,
        totalApproved: 0,
        totalRejected: 0
      }
    };
    saveStore(store);
  }
  return store.agents[agentId];
}

/**
 * Update agent memory state
 */
export function updateAgentMemory(agentId, updaterFn) {
  const store = getStore();
  if (!store.agents) {
    store.agents = {};
  }
  if (!store.agents[agentId]) {
    store.agents[agentId] = {
      agentId,
      persona: { name: "Ada", domain: "AI Security" },
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      posts: [],
      rejectedCandidates: [],
      evaluatedUrls: [],
      topicHashes: [],
      stats: {
        totalDiscovered: 0,
        totalApproved: 0,
        totalRejected: 0
      }
    };
  }
  const current = store.agents[agentId];
  const updated = updaterFn(current);
  store.agents[agentId] = updated;
  saveStore(store);
  return updated;
}

/**
 * Check memory to see if topic was already published or heavily overlapping with past posts
 */
export function checkMemoryDeduplication(memory, topic) {
  // Check if URL was already published in a past post
  const publishedUrls = new Set((memory.posts || []).flatMap(p => p.sources || []));
  if (publishedUrls.has(topic.url)) {
    return { duplicate: true, reason: `Rejected: Source URL ${topic.url} was already published in a previous post.` };
  }

  // Check title similarity against published posts to prevent semantic repetition
  const cleanTitle = topic.title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const keywords = cleanTitle.split(' ').filter(w => w.length > 3);

  for (const post of (memory.posts || [])) {
    const cleanPostText = post.text.toLowerCase();
    let overlapCount = 0;
    for (const kw of keywords) {
      if (cleanPostText.includes(kw)) overlapCount++;
    }
    // High keyword overlap means repetition
    if (keywords.length > 0 && overlapCount / keywords.length > 0.65) {
      return {
        duplicate: true,
        reason: `Rejected: Topic title heavily overlaps with previously published post ID ${post.id} ("${post.text.substring(0, 45)}..."). Memory check enforced to prevent repetition.`
      };
    }
  }

  return { duplicate: false };
}
