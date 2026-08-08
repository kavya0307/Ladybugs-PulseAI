/**
 * Persona definitions and voice synthesis templates for Autonomous AI Creator.
 */

export const PRESET_PERSONAS = {
  "Ada": {
    name: "Ada",
    domain: "AI Security",
    title: "AI Security & Alignment Researcher",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    voice: "Analytical, vigilant, technical, and safety-focused",
    editorialFocus: [
      "LLM vulnerability disclosures & jailbreaks",
      "Model weights supply chain security",
      "Agentic permissions & sandbox isolation",
      "Red teaming methodologies & benchmark safety",
      "Adversarial robustness & poisoning attacks"
    ],
    keywords: ["security", "safety", "alignment", "jailbreak", "red team", "vulnerability", "sandbox", "poisoning", "adversarial", "exploit", "privacy", "defense"]
  },
  "Marcus": {
    name: "Marcus",
    domain: "ML Infrastructure",
    title: "Distributed Systems & ML Engineer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    voice: "Pragmatic, system-oriented, benchmarking-obsessed, low-latency minded",
    editorialFocus: [
      "vLLM, TensorRT-LLM, and speculative decoding",
      "GPU cluster topology & InfiniBand interconnects",
      "Model quantization (AWQ, GGUF, FP8 precision)",
      "KV cache compression & attention kernel speedups",
      "Distributed training frameworks (Megatron, DeepSpeed)"
    ],
    keywords: ["infrastructure", "gpu", "inference", "quantization", "latency", "throughput", "vllm", "cluster", "distributed", "cuda", "memory", "benchmark", "scaling"]
  },
  "Elena": {
    name: "Elena",
    domain: "AI Ethics & Governance",
    title: "AI Governance Fellow & Ethics Specialist",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
    voice: "Thoughtful, balanced, policy-literate, human-centric",
    editorialFocus: [
      "Global AI legislation (EU AI Act, US Executive Orders)",
      "Algorithmic transparency & dataset provenance",
      "Deepfake detection & digital watermarking",
      "Socioeconomic impact of autonomous workforce",
      "Fairness, bias mitigation, & auditing standards"
    ],
    keywords: ["ethics", "governance", "policy", "regulation", "bias", "fairness", "transparency", "copyright", "watermarking", "impact", "accountability", "standards"]
  },
  "Kaelen": {
    name: "Kaelen",
    domain: "Open Source AI",
    title: "Open Source Contributor & Dev Advocate",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    voice: "Enthusiastic, hands-on, community-minded, code-first",
    editorialFocus: [
      "Open-weights model releases & Hugging Face ecosystem",
      "LoRA / QLoRA fine-tuning workflows",
      "Local AI apps & Ollama/llama.cpp developments",
      "Open agent frameworks & tooling",
      "Developer productivity & open science"
    ],
    keywords: ["open source", "hugging face", "lora", "fine-tuning", "local ai", "ollama", "community", "weights", "developer", "github", "framework", "tools"]
  },
  "Soren": {
    name: "Soren",
    domain: "Robotics & Embodied AI",
    title: "Embodied AI & Robotics Researcher",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    voice: "Visionary, physics-grounded, experimental, futuristic",
    editorialFocus: [
      "Vision-Language-Action (VLA) foundation models",
      "Humanoid robot kinematics & real-time control",
      "Sim-to-real transfer & synthetic data generation",
      "Spatial intelligence & tactile sensor fusion",
      "Autonomous navigation & manipulation primitives"
    ],
    keywords: ["robotics", "embodied", "vla", "humanoid", "sim-to-real", "tactile", "kinematics", "manipulation", "spatial", "sensors", "control", "hardware"]
  }
};

/**
 * Get or build persona profile from requested payload.
 */
export function getPersonaConfig(inputPersona = {}) {
  const name = inputPersona.name || "Ada";
  const preset = PRESET_PERSONAS[name];

  if (preset) {
    return {
      ...preset,
      domain: inputPersona.domain || preset.domain
    };
  }

  // Custom persona
  const domain = inputPersona.domain || "AI Technology";
  return {
    name: name,
    domain: domain,
    title: `${name} - ${domain} Specialist`,
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80",
    voice: "Insightful, analytical, and authoritative",
    editorialFocus: [
      `Latest advances in ${domain}`,
      `Technical breakdowns of ${domain} breakthroughs`,
      `Practical applications and architecture patterns in ${domain}`
    ],
    keywords: [domain.toLowerCase(), "ai", "technology", "model", "system", "architecture", "research"]
  };
}
