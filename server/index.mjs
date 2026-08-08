/**
 * Express API Server for Autonomous AI Creator.
 * Exposes required POST /api/agent/init and GET /api/agent/feed endpoints.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAgent, getAgentFeed, getAgentStatus, runAutonomousCycle } from './agent/runner.mjs';
import { PRESET_PERSONAS } from './agent/persona.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend assets if built
app.use(express.static(path.join(__dirname, '../dist')));

/**
 * 1. REQUIRED ENDPOINT: POST /api/agent/init
 * Called once before evaluation to initialize agent persona.
 */
app.post('/api/agent/init', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[API] Received POST /api/agent/init:', JSON.stringify(payload));

    const result = await initAgent(payload);

    return res.status(200).json({
      agentId: result.agentId
    });
  } catch (err) {
    console.error('[API] Error initializing agent:', err);
    return res.status(500).json({ error: 'Failed to initialize agent', message: err.message });
  }
});

/**
 * 2. REQUIRED ENDPOINT: GET /api/agent/feed?agentId=...
 * Called periodically during evaluation to retrieve posts in reverse chronological order.
 */
app.get('/api/agent/feed', (req, res) => {
  try {
    const agentId = req.query.agentId;

    if (!agentId) {
      return res.status(400).json({ error: 'Missing required query parameter: agentId' });
    }

    const feed = getAgentFeed(agentId);
    return res.status(200).json(feed);
  } catch (err) {
    console.error('[API] Error fetching feed:', err);
    return res.status(500).json({ error: 'Failed to retrieve feed', message: err.message });
  }
});

/**
 * HELPER ENDPOINTS for UI & Inspection
 */

// Get detailed status of agent
app.get('/api/agent/status', (req, res) => {
  const agentId = req.query.agentId;
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agentId' });
  }
  const status = getAgentStatus(agentId);
  return res.json(status);
});

// Trigger immediate autonomous cycle (for demo & verification)
app.post('/api/agent/trigger', async (req, res) => {
  const { agentId } = req.body || {};
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agentId' });
  }
  const result = await runAutonomousCycle(agentId);
  return res.json(result);
});

// Get available preset personas
app.get('/api/agent/presets', (req, res) => {
  return res.json(PRESET_PERSONAS);
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    return res.sendFile(indexPath, (err) => {
      if (err) {
        res.type('text/plain').send('Autonomous AI Creator API Server is active. Frontend build missing or dev mode.');
      }
    });
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Autonomous AI Creator API Server running on port ${PORT}`);
  console.log(`- POST /api/agent/init`);
  console.log(`- GET  /api/agent/feed?agentId=...`);
  console.log(`====================================================`);
});
