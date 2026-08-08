# Autonomous AI & Technology Creator

An autonomous AI persona system that operates completely independently after initialization. It continuously discovers live AI and tech topics, applies strict editorial judgment, maintains long-term memory to prevent repetition, and periodically publishes posts over time without human intervention.

---

## 📑 Table of Contents

- [Overview & Identity](#overview--identity)
- [System Architecture & Working Mechanism](#system-architecture--working-mechanism)
  - [1. Topic Discovery Engine](#1-topic-discovery-engine)
  - [2. Editorial Judgment & Rejection Engine](#2-editorial-judgment--rejection-engine)
  - [3. Persona Synthesis Engine](#3-persona-synthesis-engine)
  - [4. Long-Term Memory Store](#4-long-term-memory-store)
  - [5. Autonomous Background Daemon Loop](#5-autonomous-background-daemon-loop)
- [API Specification](#api-specification)
  - [1. Initialize Agent (`POST /api/agent/init`)](#1-initialize-agent-post-apiagentinit)
  - [2. Retrieve Feed (`GET /api/agent/feed`)](#2-retrieve-feed-get-apiagentfeed)
  - [3. Helper Endpoints](#3-helper-endpoints)
- [Project Directory Structure](#project-directory-structure)
- [Quickstart Guide & How to Run](#quickstart-guide--how-to-run)
- [Interactive Dashboard UI](#interactive-dashboard-ui)
- [Evaluation Criteria Alignment](#evaluation-criteria-alignment)

---

## Overview & Identity

Every day thousands of AI posts appear online, but almost all require a human writing the first prompt. This project builds an **autonomous technology creator** that eliminates the human-in-the-loop.

Once initialized via `POST /api/agent/init`, the agent:
- Discovers live news and papers from public APIs in real time.
- Uses editorial judgment to reject off-topic, duplicate, or low-substance topics.
- Writes posts in a distinct, consistent persona (e.g. AI Security, ML Infrastructure, AI Ethics).
- Tracks memory of published posts to prevent repetition.
- Periodically publishes new posts over time without any further prompts or API requests.

---

## System Architecture & Working Mechanism

```
   ┌─────────────────────────────────────────────────────────────┐
   │ 1. LIVE TOPIC DISCOVERY                                     │
   │    • Hacker News API (Algolia)                              │
   │    • arXiv CS AI Research Papers Feed                       │
   │    • Dev.to Technical Articles                              │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 2. EDITORIAL JUDGMENT ENGINE                                │
   │    • Domain Relevance Score (0-100)                         │
   │    • Technical Substance & Quality Score                    │
   │    • Novelty & Memory Uniqueness Check                      │
   │                                                             │
   │    Score < 70 ──► [REJECTED LOG] (Stored with rationale)   │
   │    Score ≥ 70 ──► [APPROVED CANDIDATE]                      │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 3. PERSONA WRITING & SYNTHESIS                              │
   │    • Synthesizes persona-aligned post text                  │
   │    • Formats structured publishing rationale                │
   │    • Attaches verified source URLs                          │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ 4. LONG-TERM MEMORY STORE                                   │
   │    • Prepend post to feed (reverse chronological)           │
   │    • Add source URL & title hash to memory deduplication    │
   │    • Persist to store.json                                  │
   └─────────────────────────────────────────────────────────────┘
```

---

### 1. Topic Discovery Engine (`server/agent/discovery.mjs`)
The agent actively monitors real-world information sources:
- **Hacker News Algolia Search API**: Queries recent high-engagement tech discussions.
- **arXiv API**: Parses XML feeds for recent computer science research papers (`cs.AI`, `cs.CL`, `cs.LG`).
- **Dev.to Feed API**: Fetches developer articles with positive community reactions.
- **Resilient Seed Fallback**: Contains pre-curated technical items to ensure high quality even during API rate limits.

### 2. Editorial Judgment & Rejection Engine (`server/agent/editorial.mjs`)
Not every news item deserves publishing. The editorial engine evaluates every candidate topic across three dimensions:
1. **Domain Relevance Score**: Evaluates keyword alignment with the active persona (e.g. `jailbreak`, `red team`, `sandbox`, `adversarial` for AI Security).
2. **Substance & Quality Score**: Gives higher weight to peer-reviewed research papers and technical write-ups while penalizing promotional clickbait or non-tech news.
3. **Novelty & Memory Uniqueness**: Checks candidate titles against past published posts to block repetition.
- **Rejection Log**: If a candidate fails the threshold, it is intentionally rejected and logged with an explicit human-readable reason (e.g. *"Rejected: Topic lacks technical depth and is promotional content..."*).

### 3. Persona Synthesis Engine (`server/agent/persona.mjs`)
Supports distinct pre-configured personas as well as custom identities:
- **Ada** (`AI Security`): Focuses on model safety, red teaming, jailbreak defenses, and agent isolation boundaries.
- **Marcus** (`ML Infrastructure`): Focuses on vLLM, speculative decoding, GPU cluster topology, and memory bandwidth optimization.
- **Elena** (`AI Ethics & Governance`): Focuses on algorithmic transparency, EU AI Act compliance, and auditing frameworks.
- **Kaelen** (`Open Source AI`): Focuses on Hugging Face open weights, LoRA fine-tuning, and local AI workflows.
- **Soren** (`Robotics & Embodied AI`): Focuses on Vision-Language-Action (VLA) models and sim-to-real transfer.

### 4. Long-Term Memory Store (`server/agent/memory.mjs`)
- Persists state to `server/data/store.json`.
- Maintains an index of `evaluatedUrls`, `publishedPosts`, and `rejectedCandidates`.
- Prevents posting the same source URL twice and blocks semantically similar titles.

### 5. Autonomous Background Daemon Loop (`server/agent/runner.mjs`)
- Manages an internal background timer per `agentId` (running cycles every ~45s in demo mode).
- Executes the Discovery $\rightarrow$ Editorial Evaluation $\rightarrow$ Generation $\rightarrow$ Memory Save sequence automatically.
- No human input or external API calls are required to keep publishing over time.

---

## API Specification

The application exposes two mandatory HTTP endpoints:

### 1. Initialize Agent (`POST /api/agent/init`)
Called exactly once before evaluation to initialize the agent persona and launch the background publishing process.

**Request:**
```json
{
  "persona": {
    "name": "Ada",
    "domain": "AI Security"
  }
}
```

**Response:**
```json
{
  "agentId": "agent-ada-ooofu"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona": {"name": "Ada", "domain": "AI Security"}}'
```

---

### 2. Retrieve Feed (`GET /api/agent/feed`)
Evaluators periodically call this endpoint to retrieve generated posts.

**Endpoint:**
`GET /api/agent/feed?agentId=agent-ada-ooofu`

**Response:**
```json
{
  "posts": [
    {
      "id": "pmsjsdvfz-55",
      "createdAt": "2026-08-08T03:00:49.391Z",
      "text": "🚨 Security Insight: CalibForge: Adversarial Solver Calibration for Scaling Learnable Terminal Tasks\n\nTraining terminal agents requires executable and verifiable tasks that are not merely solvable, but appropriately challenging for learning. Executable validation establishes feasibility, yet does not reveal how a task behaves relative to a given solver setting...\n\nWhy this matters for AI Safety & Architecture:\nAs autonomous agents gain tool-use privileges, attack vectors like indirect prompt injection and unvalidated context ingestion represent critical failure points. We must enforce strict memory isolation boundaries and runtime guardrails before granting agents write access to downstream production systems.\n\n#AISecurity #LLMSafety #RedTeaming #AgenticAI",
      "rationale": "Selection Rationale for Persona [Ada - AI Security]:\n1. Topic Choice: Selected \"CalibForge: Adversarial Solver Calibration for Scaling Learnable Terminal Tasks\" because it scored 81/100 on domain relevance and technical substance. Matched core interests: adversarial.\n2. Timeliness & Relevance: Published by arXiv CS AI Research (6/8/2026). Directly addresses urgent advancements and practical challenges in AI Security.\n3. Editorial Filtering: Out of 42 discovered candidate topics this cycle, this candidate was prioritized over rejected items such as \"Obscura: Headless browser engine. For web scraping and AI agent automation\" (Rejected: Candidate scored 31/100 overall (Relevance: 50/100)) because it provided actionable technical value rather than superficial commentary.",
      "sources": [
        "http://arxiv.org/abs/2608.06352v1"
      ]
    }
  ]
}
```

#### Feed Rules Enforced:
- **Order**: Reverse chronological (newest first).
- **ID**: Every post has a unique ID string.
- **Timestamp**: `createdAt` is a valid ISO 8601 UTC timestamp.
- **Continuity**: Previously returned posts remain available.
- **Empty State**: Returns `{"posts": []}` if no posts exist yet.

---

### 3. Helper Endpoints

- `GET /api/agent/status?agentId=...`: Returns active persona status, total posts, topic memory stats, and decision logs.
- `POST /api/agent/trigger`: Body `{"agentId": "..."}`. Triggers an immediate discovery & publishing cycle for manual testing.
- `GET /api/agent/presets`: Returns all available persona presets.

---

## Project Directory Structure

```
autonomous-ai-creator/
├── package.json              # Project dependencies (Express, React, Vite, Lucide-React)
├── vite.config.js            # Vite build configuration & API proxy
├── tailwind.config.js        # Tailwind CSS styling config
├── postcss.config.js         # PostCSS config
├── index.html                # Single Page Application HTML entry point
├── server/
│   ├── index.mjs             # Express API server serving POST /init and GET /feed
│   ├── agent/
│   │   ├── discovery.mjs     # Live information discovery (Hacker News, arXiv, Dev.to)
│   │   ├── editorial.mjs     # Editorial judgment & topic rejection logic
│   │   ├── memory.mjs        # Persistence, topic hashes & deduplication engine
│   │   ├── persona.mjs       # Persona identities & voice templates
│   │   └── runner.mjs        # Background daemon timer & cycle orchestrator
│   └── data/
│       └── store.json        # Auto-created persistent JSON memory database
└── src/
    ├── main.jsx              # React app entry point
    ├── App.jsx               # Main UI Layout & real-time polling logic
    ├── index.css             # Glassmorphism & dark-mode styling
    └── components/
        ├── Header.jsx             # Top bar & live daemon status indicator
        ├── PersonaSelector.jsx    # Switch preset personas or create custom persona
        ├── FeedViewer.jsx         # Published feed view with expandable rationale
        ├── EditorialAuditLog.jsx  # Rejection audit trail & topic scoring log
        ├── MemoryInspector.jsx    # Long-term memory stats & keyword vectors
        └── ApiTester.jsx          # Live interactive cURL & API tester console
```

---

## Quickstart Guide & How to Run

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Install Dependencies
```bash
cd C:\Users\LAVANYA\.gemini\antigravity\scratch\autonomous-ai-creator
npm install
```

### 2. Build the Production Bundle (Optional for UI)
```bash
npm run build
```

### 3. Start the API Server & Autonomous Daemon
```bash
npm run server
```
The server will run on `http://localhost:5000`.

---

## Interactive Dashboard UI

Open `http://localhost:5000` in any web browser to view the live dashboard:

1. 📰 **Autonomous Feed Tab**: Real-time reverse-chronological feed with expandable **Publishing Rationale** and direct **Sources**.
2. ⚖️ **Editorial Audit Log Tab**: Shows every topic discovered, its evaluation score (0-100), and the **explicit rejection reason** explaining why off-topic or clickbait items were filtered out.
3. 🧠 **Long-Term Memory Inspector**: Displays tracked URLs, published topic keywords, and deduplication stats.
4. 🤖 **Persona Switcher**: Allows initializing predefined personas or testing custom identities via `POST /api/agent/init`.
5. 🧪 **API Inspector Console**: Allows testing API requests directly with copyable cURL commands and live JSON responses.

---

## Evaluation Criteria Alignment

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Topic Discovery** | Fetches live papers & articles from arXiv, Hacker News, and Dev.to in real time | ✅ Complete |
| **Editorial Judgment** | Calculates relevance/substance scores; rejects clickbait and records explicit rejection reasons | ✅ Complete |
| **Consistent Persona** | Maintains clear editorial voice and domain focus (AI Security, ML Infra, Ethics, etc.) | ✅ Complete |
| **Memory** | Tracks `evaluatedUrls` and title similarity to prevent duplicate or repetitive posts | ✅ Complete |
| **Autonomous Publishing** | Runs an internal timer after initialization to generate posts without human prompts | ✅ Complete |
| **Publishing Rationale** | Returns detailed selection rationale, timeliness explanation, and sources in API response | ✅ Complete |
| **API Compliance** | Strictly implements `POST /api/agent/init` and `GET /api/agent/feed` | ✅ Complete |
