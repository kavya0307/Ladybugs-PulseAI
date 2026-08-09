/**
 * Editorial Engine for Autonomous AI Creator.
 * Implements editorial judgment (scoring & topic rejection) and persona writing synthesis.
 */

import { checkMemoryDeduplication } from './memory.mjs';
import { isLLMAvailable, llmEvaluateCandidate, llmWritePost } from './llm.mjs';

/**
 * Very lightweight stemmer so keyword matching survives simple plural/suffix
 * variation (e.g. persona keyword "vulnerability" should still match text
 * containing "vulnerabilities"). This is intentionally simple - not a real
 * NLP stemmer - just enough to stop obvious on-topic matches from being missed.
 */
function stem(word) {
  return word
    .toLowerCase()
    .replace(/ies$/, 'y')     // vulnerabilities -> vulnerability(-ish: vulnerabilit-y)
    .replace(/ing$/, '')      // scaling -> scal
    .replace(/(e?s)$/, '');   // systems -> system, models -> model
}

/**
 * Returns true if keyword `kw` meaningfully appears in `text`, allowing for
 * simple singular/plural and suffix variation in either direction.
 */
function fuzzyKeywordMatch(text, kw) {
  const kwLower = kw.toLowerCase();
  if (text.includes(kwLower)) return true;

  const kwStem = stem(kwLower);
  if (kwStem.length < 3) return false; // avoid over-matching very short stems

  // Check the stem against every word in the text (also stemmed)
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  return words.some(w => stem(w) === kwStem || w.startsWith(kwStem));
}

/**
 * Fast, deterministic keyword-based evaluation (no network calls). This is
 * used as: (a) the sole judgment path if no LLM key is configured, and
 * (b) a cheap pre-filter before spending an LLM call, so obvious spam/dupes
 * never reach the model.
 */
export function keywordEvaluateTopics(candidates, persona, memory) {
  const evaluated = [];

  for (const candidate of candidates) {
    const titleLower = candidate.title.toLowerCase();
    const summaryLower = candidate.summary.toLowerCase();
    const textCombined = `${titleLower} ${summaryLower}`;

    // 1. Memory deduplication check
    const dedupResult = checkMemoryDeduplication(memory, candidate);
    if (dedupResult.duplicate) {
      evaluated.push({
        candidate,
        status: 'REJECTED',
        score: 30,
        reason: dedupResult.reason,
        judgmentSource: 'keyword',
        skipLLM: true
      });
      continue;
    }

    // 2. Off-topic / Spam / Clickbait check
    const isSpamOrOffTopic =
      textCombined.includes('presale') ||
      textCombined.includes('10000x') ||
      textCombined.includes('buy laptop') ||
      textCombined.includes('discount code') ||
      textCombined.includes('sponsored tech wire') ||
      textCombined.includes('crypto meme');

    if (isSpamOrOffTopic) {
      evaluated.push({
        candidate,
        status: 'REJECTED',
        score: 15,
        reason: `Rejected: Topic lacks technical depth and is promotional/clickbait content unsuitable for the ${persona.domain} editorial standard.`,
        judgmentSource: 'keyword',
        skipLLM: true
      });
      continue;
    }

    // 3. Domain relevance scoring
    let relevanceScore = 50; // base score for tech news
    const domainKeywords = persona.keywords || [];
    let matchedKeywords = [];

    for (const kw of domainKeywords) {
      if (fuzzyKeywordMatch(textCombined, kw)) {
        relevanceScore += 15;
        matchedKeywords.push(kw);
      }
    }

    // Cap relevance score
    relevanceScore = Math.min(100, relevanceScore);

    // 4. Substance & Quality Scoring
    let substanceScore = candidate.rawScore || 70;
    if (candidate.source.includes('arXiv') || candidate.source.includes('Research')) {
      substanceScore += 20;
    }

    const overallScore = Math.round((relevanceScore * 0.6) + (substanceScore * 0.4));

    // Editorial Pass Threshold (>= 70 required)
    if (overallScore >= 70 && relevanceScore >= 60) {
      evaluated.push({
        candidate,
        status: 'APPROVED',
        score: overallScore,
        matchedKeywords,
        reason: `Approved: High domain alignment with ${persona.domain} (Matched keywords: ${matchedKeywords.join(', ') || 'AI systems'}). Strong technical substance score (${overallScore}/100).`,
        judgmentSource: 'keyword'
      });
    } else {
      evaluated.push({
        candidate,
        status: 'REJECTED',
        score: overallScore,
        matchedKeywords,
        reason: `Rejected: Candidate scored ${overallScore}/100 overall (Relevance: ${relevanceScore}/100). Did not meet domain threshold for ${persona.domain}. Content deferred in favor of higher-impact technical topics.`,
        judgmentSource: 'keyword'
      });
    }
  }

  return evaluated;
}

/**
 * Main evaluation entry point used by runner.mjs.
 *
 * If an LLM key is configured, candidates that survive the cheap keyword
 * pre-filter (i.e. not obvious spam/dupes) are handed to Claude for real
 * editorial reasoning, which replaces the keyword score/verdict for that
 * candidate. Anything the LLM call fails on quietly falls back to the
 * keyword-based verdict already computed - so a network hiccup can never
 * produce an empty cycle.
 *
 * To keep cycles fast and cheap, at most `maxLLMCalls` candidates are sent
 * to the model per cycle (highest keyword-score candidates first).
 */
export async function evaluateTopics(candidates, persona, memory, maxLLMCalls = 5) {
  const keywordPass = keywordEvaluateTopics(candidates, persona, memory);

  if (!isLLMAvailable()) {
    return keywordPass;
  }

  const recentPostTitles = (memory.posts || [])
    .slice(0, 5)
    .map(p => (p.text || '').split('\n')[0]);

  // Only spend LLM calls on candidates that weren't auto-rejected as spam/dupes
  const llmCandidateIndices = keywordPass
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => !e.skipLLM)
    .sort((a, b) => b.e.score - a.e.score)
    .slice(0, maxLLMCalls)
    .map(({ i }) => i);

  const finalEvaluated = [...keywordPass];

  await Promise.all(
    llmCandidateIndices.map(async (i) => {
      const candidate = keywordPass[i].candidate;
      const llmResult = await llmEvaluateCandidate(candidate, persona, recentPostTitles);
      if (!llmResult) return; // fall back silently to keyword verdict already in place

      finalEvaluated[i] = {
        candidate,
        status: llmResult.approved ? 'APPROVED' : 'REJECTED',
        score: llmResult.score,
        matchedKeywords: keywordPass[i].matchedKeywords || [],
        reason: `${llmResult.approved ? 'Approved' : 'Rejected'} (AI editorial judgment): ${llmResult.reason}`,
        judgmentSource: 'llm'
      };
    })
  );

  return finalEvaluated;
}

/**
 * Generate a complete persona-aligned post with rationale and sources.
 * Tries the LLM writer first (real generation in the persona's voice);
 * falls back to the deterministic template if the LLM is unavailable or fails,
 * so a post is always produced.
 */
export async function generatePost(approvedEvaluation, rejectedEvaluations, persona, postIndex) {
  const { candidate, score, matchedKeywords, judgmentSource } = approvedEvaluation;

  const postId = `p${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = new Date().toISOString();

  let text = await llmWritePost(candidate, persona);
  let writtenBy = 'llm';

  if (!text) {
    text = templatePostText(candidate, persona);
    writtenBy = 'template';
  }

  // Construct comprehensive publishing rationale as required by spec
  const rejectedCount = rejectedEvaluations.length;
  const topRejected = rejectedEvaluations.slice(0, 2).map(r => `"${r.candidate.title}" (${r.reason.split('.')[0]})`).join('; ');

  const judgmentNote = judgmentSource === 'llm'
    ? `Evaluated by AI editorial reasoning (not just keyword matching).`
    : `Evaluated by domain keyword scoring.`;

  const rationale =
    `Selection Rationale for Persona [${persona.name} - ${persona.domain}]:\n` +
    `1. Topic Choice: Selected "${candidate.title}" because it scored ${score}/100 on domain relevance and technical substance. Matched core interests: ${(matchedKeywords || []).join(', ') || persona.domain}. ${judgmentNote}\n` +
    `2. Timeliness & Relevance: Published by ${candidate.source} (${new Date(candidate.publishedAt).toLocaleDateString()}). Directly addresses urgent advancements and practical challenges in ${persona.domain}.\n` +
    `3. Editorial Filtering: Out of ${rejectedCount + 1} discovered candidate topics this cycle, this candidate was prioritized over rejected items such as ${topRejected || 'lower scoring general news items'} because it provided actionable technical value rather than superficial commentary.`;

  return {
    id: postId,
    createdAt: createdAt,
    text: text,
    rationale: rationale,
    sources: [candidate.url],
    _writtenBy: writtenBy // internal only, not required by spec, useful for debugging
  };
}

/**
 * Deterministic template writer - used only as a fallback when the LLM is
 * unavailable or a call fails, so the agent can never produce an empty cycle.
 */
function templatePostText(candidate, persona) {
  if (persona.domain === "AI Security" || persona.name === "Ada") {
    return `🚨 Security Insight: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Why this matters for AI Safety & Architecture:\n` +
      `As autonomous agents gain tool-use privileges, attack vectors like indirect prompt injection and unvalidated context ingestion represent critical failure points. ` +
      `We must enforce strict memory isolation boundaries and runtime guardrails before granting agents write access to downstream production systems.\n\n` +
      `#AISecurity #LLMSafety #RedTeaming #AgenticAI`;
  } else if (persona.domain === "ML Infrastructure" || persona.name === "Marcus") {
    return `⚡ Performance Breakdown: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Engineering Takeaways:\n` +
      `Scaling LLM serving is no longer just about raw TFLOPS—it's an interconnect and memory bandwidth bottleneck. ` +
      `Optimizations like zero-copy memory paging and kernel fusion significantly lower p99 TTFT (Time-To-First-Token) while doubling GPU cluster utilization.\n\n` +
      `#MLSys #vLLM #GPU #InferenceOptimization #AIInfra`;
  } else if (persona.domain === "AI Ethics & Governance" || persona.name === "Elena") {
    return `⚖️ Governance Perspective: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Policy & Ethical Considerations:\n` +
      `Technical innovation in autonomous models must be accompanied by enforceable auditing standards and algorithmic transparency. ` +
      `As regulatory frameworks take effect globally, developers need clear provenance tracking for training sets and verifiable safety benchmarks.\n\n` +
      `#AIEthics #AIGovernance #ResponsibleAI #TechPolicy`;
  } else if (persona.domain === "Open Source AI" || persona.name === "Kaelen") {
    return `🚀 Open Source Highlight: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Developer Ecosystem Impact:\n` +
      `The gap between closed-source proprietary APIs and open-weights models continues to shrink rapidly. ` +
      `With accessible LoRA fine-tuning and local quantization tools, developers can now deploy performant, privacy-preserving models directly on commodity hardware.\n\n` +
      `#OpenSourceAI #HuggingFace #FineTuning #LocalAI #DevCommunity`;
  } else if (persona.domain === "Robotics & Embodied AI" || persona.name === "Soren") {
    return `🤖 Robotics & Embodiment: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Embodied AI Frontier:\n` +
      `Translating vision-language reasoning into real-time motor control loops is the key challenge for physical AI. ` +
      `Sim-to-real transfer combined with tactile sensor fusion is accelerating zero-shot skill adaptation in complex physical environments.\n\n` +
      `#Robotics #EmbodiedAI #SimToReal #Humanoid #SpatialIntelligence`;
  } else {
    return `💡 ${persona.name}'s Analysis: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Key Takeaway for ${persona.domain}:\n` +
      `This milestone represents a notable advancement in the ${persona.domain} landscape. ` +
      `Designing robust, scalable, and trustworthy systems requires staying at the forefront of these research developments.\n\n` +
      `#${persona.domain.replace(/\s+/g, '')} #ArtificialIntelligence #TechTrends`;
  }
}
