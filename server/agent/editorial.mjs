/**
 * Editorial Engine for Autonomous AI Creator.
 * Implements editorial judgment (scoring & topic rejection) and persona writing synthesis.
 */

import { checkMemoryDeduplication } from './memory.mjs';

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
 * Evaluates candidate topics against persona criteria and memory.
 * Returns evaluated candidates categorized into approved and rejected with explicit rationales.
 */
export function evaluateTopics(candidates, persona, memory) {
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
        reason: dedupResult.reason
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
        reason: `Rejected: Topic lacks technical depth and is promotional/clickbait content unsuitable for the ${persona.domain} editorial standard.`
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
        reason: `Approved: High domain alignment with ${persona.domain} (Matched keywords: ${matchedKeywords.join(', ') || 'AI systems'}). Strong technical substance score (${overallScore}/100).`
      });
    } else {
      evaluated.push({
        candidate,
        status: 'REJECTED',
        score: overallScore,
        reason: `Rejected: Candidate scored ${overallScore}/100 overall (Relevance: ${relevanceScore}/100). Did not meet domain threshold for ${persona.domain}. Content deferred in favor of higher-impact technical topics.`
      });
    }
  }

  return evaluated;
}

/**
 * Generate a complete persona-aligned post with rationale and sources
 */
export function generatePost(approvedEvaluation, rejectedEvaluations, persona, postIndex) {
  const { candidate, score, matchedKeywords } = approvedEvaluation;

  const postId = `p${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = new Date().toISOString();

  // Create persona post text depending on voice and topic
  let text = "";

  if (persona.domain === "AI Security" || persona.name === "Ada") {
    text = `🚨 Security Insight: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Why this matters for AI Safety & Architecture:\n` +
      `As autonomous agents gain tool-use privileges, attack vectors like indirect prompt injection and unvalidated context ingestion represent critical failure points. ` +
      `We must enforce strict memory isolation boundaries and runtime guardrails before granting agents write access to downstream production systems.\n\n` +
      `#AISecurity #LLMSafety #RedTeaming #AgenticAI`;
  } else if (persona.domain === "ML Infrastructure" || persona.name === "Marcus") {
    text = `⚡ Performance Breakdown: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Engineering Takeaways:\n` +
      `Scaling LLM serving is no longer just about raw TFLOPS—it's an interconnect and memory bandwidth bottleneck. ` +
      `Optimizations like zero-copy memory paging and kernel fusion significantly lower p99 TTFT (Time-To-First-Token) while doubling GPU cluster utilization.\n\n` +
      `#MLSys #vLLM #GPU #InferenceOptimization #AIInfra`;
  } else if (persona.domain === "AI Ethics & Governance" || persona.name === "Elena") {
    text = `⚖️ Governance Perspective: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Policy & Ethical Considerations:\n` +
      `Technical innovation in autonomous models must be accompanied by enforceable auditing standards and algorithmic transparency. ` +
      `As regulatory frameworks take effect globally, developers need clear provenance tracking for training sets and verifiable safety benchmarks.\n\n` +
      `#AIEthics #AIGovernance #ResponsibleAI #TechPolicy`;
  } else if (persona.domain === "Open Source AI" || persona.name === "Kaelen") {
    text = `🚀 Open Source Highlight: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Developer Ecosystem Impact:\n` +
      `The gap between closed-source proprietary APIs and open-weights models continues to shrink rapidly. ` +
      `With accessible LoRA fine-tuning and local quantization tools, developers can now deploy performant, privacy-preserving models directly on commodity hardware.\n\n` +
      `#OpenSourceAI #HuggingFace #FineTuning #LocalAI #DevCommunity`;
  } else if (persona.domain === "Robotics & Embodied AI" || persona.name === "Soren") {
    text = `🤖 Robotics & Embodiment: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Embodied AI Frontier:\n` +
      `Translating vision-language reasoning into real-time motor control loops is the key challenge for physical AI. ` +
      `Sim-to-real transfer combined with tactile sensor fusion is accelerating zero-shot skill adaptation in complex physical environments.\n\n` +
      `#Robotics #EmbodiedAI #SimToReal #Humanoid #SpatialIntelligence`;
  } else {
    text = `💡 ${persona.name}'s Analysis: ${candidate.title}\n\n` +
      `${candidate.summary}\n\n` +
      `Key Takeaway for ${persona.domain}:\n` +
      `This milestone represents a notable advancement in the ${persona.domain} landscape. ` +
      `Designing robust, scalable, and trustworthy systems requires staying at the forefront of these research developments.\n\n` +
      `#${persona.domain.replace(/\s+/g, '')} #ArtificialIntelligence #TechTrends`;
  }

  // Construct comprehensive publishing rationale as required by spec
  const rejectedCount = rejectedEvaluations.length;
  const topRejected = rejectedEvaluations.slice(0, 2).map(r => `"${r.candidate.title}" (${r.reason.split('.')[0]})`).join('; ');

  const rationale =
    `Selection Rationale for Persona [${persona.name} - ${persona.domain}]:\n` +
    `1. Topic Choice: Selected "${candidate.title}" because it scored ${score}/100 on domain relevance and technical substance. Matched core interests: ${matchedKeywords.join(', ') || persona.domain}.\n` +
    `2. Timeliness & Relevance: Published by ${candidate.source} (${new Date(candidate.publishedAt).toLocaleDateString()}). Directly addresses urgent advancements and practical challenges in ${persona.domain}.\n` +
    `3. Editorial Filtering: Out of ${rejectedCount + 1} discovered candidate topics this cycle, this candidate was prioritized over rejected items such as ${topRejected || 'lower scoring general news items'} because it provided actionable technical value rather than superficial commentary.`;

  return {
    id: postId,
    createdAt: createdAt,
    text: text,
    rationale: rationale,
    sources: [candidate.url]
  };
}
