/**
 * Shared Anthropic API client for the Autonomous AI Creator agent.
 *
 * Used by editorial.mjs for two real AI reasoning steps:
 *   1. Editorial judgment  - deciding whether a discovered topic is worth publishing
 *   2. Post writing        - drafting the actual persona-voiced post
 *
 * Design goals:
 *   - Never crash the autonomous cycle. If the API key is missing, the network
 *     is down, or the model returns something unparsable, callers get `null`
 *     back and are expected to fall back to the deterministic template logic
 *     in editorial.mjs. This matters a lot for a 48-hour unattended judging
 *     window - a flaky LLM call must never mean an empty feed.
 *   - Keep calls cheap and fast: small max_tokens, short prompts, JSON-only
 *     responses where structured output is needed.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export function isLLMAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Low-level call. Returns the raw text of Claude's reply, or null on any failure.
 */
async function callClaude(prompt, maxTokens = 500) {
  if (!isLLMAvailable()) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s safety timeout

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[LLM] API error ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find(c => c.type === 'text');
    return textBlock ? textBlock.text : null;
  } catch (err) {
    console.error('[LLM] Call failed:', err.message);
    return null;
  }
}

/**
 * Asks Claude to reason about whether a candidate topic fits this persona's
 * editorial standard, and to produce a structured score + verdict.
 * Returns null on any failure so the caller can fall back to keyword scoring.
 */
export async function llmEvaluateCandidate(candidate, persona, recentPostTitles = []) {
  const prompt = `You are the editorial judgment layer for an autonomous AI persona.

PERSONA: ${persona.name}, ${persona.title}
DOMAIN: ${persona.domain}
VOICE: ${persona.voice}
EDITORIAL FOCUS AREAS:
${persona.editorialFocus.map(f => `- ${f}`).join('\n')}

RECENTLY PUBLISHED (avoid near-duplicates of these):
${recentPostTitles.length ? recentPostTitles.map(t => `- ${t}`).join('\n') : '(none yet)'}

CANDIDATE TOPIC TO EVALUATE:
Title: ${candidate.title}
Summary: ${candidate.summary}
Source: ${candidate.source}

Judge this topic as this persona would. Consider: Is it genuinely relevant to the
persona's focus areas? Does it have real technical substance, or is it shallow/
promotional? Is it meaningfully different from what was recently published?

Respond with ONLY a JSON object, no other text, no markdown fences:
{"score": <integer 0-100>, "approved": <true|false>, "reason": "<one or two sentences explaining the editorial call, written as this persona would think about it>"}`;

  const raw = await callClaude(prompt, 300);
  if (!raw) return null;

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.score !== 'number' || typeof parsed.approved !== 'boolean') return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      approved: parsed.approved,
      reason: parsed.reason || 'No reason provided.'
    };
  } catch (err) {
    console.error('[LLM] Failed to parse evaluation JSON:', raw);
    return null;
  }
}

/**
 * Asks Claude to write the actual post in the persona's voice.
 * Returns null on any failure so the caller can fall back to the template writer.
 */
export async function llmWritePost(candidate, persona) {
  const prompt = `You are ${persona.name}, ${persona.title}. Your voice: ${persona.voice}.
Your focus areas: ${persona.editorialFocus.join(', ')}.

Write a short social media post (LinkedIn/X style, under 130 words) about this topic,
entirely in your own voice and editorial perspective:

Title: ${candidate.title}
Summary: ${candidate.summary}

Structure: a punchy opening line (can include one relevant emoji), 1-2 sentences on
the topic itself, then 1-2 sentences of your own technical/editorial take on why it
matters right now. End with 3-4 relevant hashtags.

Respond with ONLY the post text, nothing else - no preamble, no quotation marks around it.`;

  const raw = await callClaude(prompt, 400);
  if (!raw) return null;
  return raw.trim();
}
