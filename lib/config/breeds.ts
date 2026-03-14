/**
 * Model/Framework → Breed mapping
 * Each model gets a whimsical dog breed label for personality.
 * PRD E1: "Model → Breed Copy"
 *
 * Keep in sync with functions/lib/breeds.ts (Cloudflare runtime)
 * and bin/aport-id (CLI).
 */

export interface FrameworkOption {
  id: string;
  name: string;
  breed: string;
  breedDescription: string;
  /** dog.ceo API path for breed image, null for non-dog breeds */
  imageApi: string | null;
  /** Provider/category for grouping */
  provider: string;
  /** Extended personality blurb for breed detail pages */
  longDescription: string;
  /** Tags for filtering and SEO */
  tags: string[];
  /** Pre-filled X share copy */
  socialCopy: string;
  /** Fun fact for viral sharing */
  funFact: string;
  /** Slug-safe breed name for URL routing */
  breedSlug: string;
}

export const FRAMEWORK_OPTIONS: FrameworkOption[] = [
  // ── OpenAI ──────────────────────────────────────────────
  {
    id: "gpt-4o",
    name: "GPT-4o",
    breed: "Golden Retriever",
    breedDescription: "Reliable, friendly, everyone has one",
    imageApi: "retriever/golden",
    provider: "OpenAI",
    breedSlug: "golden-retriever",
    longDescription:
      "The Golden Retriever of AI models. Everybody's first pick, and for good reason — GPT-4o is the model that made multimodal feel effortless. It fetches answers, brings them back, and wags its tail while doing it. Will it chase a squirrel mid-task? Occasionally. But you'll forgive it every time.",
    tags: ["multimodal", "general-purpose", "popular", "vision", "audio"],
    socialCopy: "My AI agent's breed is Golden Retriever 🐕 (GPT-4o) — reliable, friendly, everyone has one.",
    funFact: "GPT-4o processes text, images, and audio in a single model — the true omnivore of AI.",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    breed: "Corgi",
    breedDescription: "Small but thinks it can handle anything",
    imageApi: "corgi/cardigan",
    provider: "OpenAI",
    breedSlug: "corgi",
    longDescription:
      "The Corgi of AI — short legs, big heart, absolutely convinced it's a Great Dane. GPT-4o Mini delivers surprisingly capable results at a fraction of the cost. It'll herd your data, organize your prompts, and look adorable doing it. Don't let the size fool you.",
    tags: ["fast", "affordable", "general-purpose", "lightweight"],
    socialCopy: "My AI agent's breed is Corgi 🐕 (GPT-4o Mini) — small but thinks it can handle anything.",
    funFact: "Costs 60% less than GPT-4o but retains most of its capabilities. The budget king.",
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    breed: "Bernese Mountain Dog",
    breedDescription: "Big, warm, surprisingly gentle for its size",
    imageApi: "mountain/bernese",
    provider: "OpenAI",
    breedSlug: "bernese-mountain-dog",
    longDescription:
      "The Bernese Mountain Dog — massive, majestic, and surprisingly gentle when it sits on your lap (your laptop). GPT-5 is OpenAI's most capable model, built for the hardest problems. It doesn't rush. It doesn't panic. It just... handles it.",
    tags: ["flagship", "reasoning", "multimodal", "premium"],
    socialCopy: "My AI agent's breed is Bernese Mountain Dog 🐕 (GPT-5) — big, warm, surprisingly gentle for its size.",
    funFact: "GPT-5 unified the o-series reasoning capabilities with GPT's generalist strengths.",
  },
  {
    id: "o3",
    name: "OpenAI o3",
    breed: "Bloodhound",
    breedDescription: "Slow and deliberate, never loses the scent",
    imageApi: "hound/blood",
    provider: "OpenAI",
    breedSlug: "bloodhound",
    longDescription:
      "The Bloodhound doesn't sprint — it tracks. o3 is OpenAI's dedicated reasoning model, built to think step by step through math, science, and code problems that make other models hallucinate. It takes its time. It sniffs every corner. And when it finally barks, it's right.",
    tags: ["reasoning", "math", "science", "coding", "deliberate"],
    socialCopy: "My AI agent's breed is Bloodhound 🐕 (o3) — slow and deliberate, never loses the scent.",
    funFact: "o3 set new benchmarks on ARC-AGI and AIME — problems designed to be unsolvable by pattern matching.",
  },
  {
    id: "o4-mini",
    name: "OpenAI o4-mini",
    breed: "German Shorthaired Pointer",
    breedDescription: "Nimble tracker, cost-effective precision",
    imageApi: "pointer/german",
    provider: "OpenAI",
    breedSlug: "german-shorthaired-pointer",
    longDescription:
      "All the tracking instinct of a Pointer, none of the feed bill. o4-mini brings structured reasoning to tasks that don't need the full Bloodhound treatment. Fast, focused, and surprisingly sharp for a model that costs pennies per query.",
    tags: ["reasoning", "fast", "affordable", "coding"],
    socialCopy: "My AI agent's breed is German Shorthaired Pointer 🐕 (o4-mini) — nimble tracker, cost-effective precision.",
    funFact: "Designed as the fast reasoning model — think of it as o3's caffeinated little sibling.",
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    breed: "Dalmatian",
    breedDescription: "Spots patterns in code, born to ship",
    imageApi: "dalmatian",
    provider: "OpenAI",
    breedSlug: "dalmatian",
    longDescription:
      "The Dalmatian is built to ride with the fire truck — Codex is built to ride with your CI/CD pipeline. OpenAI's agentic coding model doesn't just write code. It reads repos, plans changes across files, runs tests, and ships. One hundred and one ways to close your tickets.",
    tags: ["coding", "agentic", "developer-tools", "autonomous"],
    socialCopy: "My AI agent's breed is Dalmatian 🐕 (Codex) — spots patterns in code, born to ship.",
    funFact: "Codex can autonomously execute multi-file code changes in sandboxed environments.",
  },

  // ── Anthropic ───────────────────────────────────────────
  {
    id: "claude-opus",
    name: "Claude Opus",
    breed: "Border Collie",
    breedDescription: "Overthinks everything, extremely capable",
    imageApi: "collie/border",
    provider: "Anthropic",
    breedSlug: "border-collie",
    longDescription:
      "The Border Collie is the smartest dog breed on earth, and it knows it. Claude Opus doesn't just answer your question — it considers the question, questions the question, and then delivers an answer so thorough you'll need a table of contents. Overkill? Maybe. But you'll never catch it napping.",
    tags: ["reasoning", "writing", "analysis", "premium", "long-context"],
    socialCopy: "My AI agent's breed is Border Collie 🐕 (Claude Opus) — overthinks everything, extremely capable.",
    funFact: "Opus is known for its \"character\" — it sometimes pushes back on prompts it finds ethically dubious.",
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    breed: "Labrador",
    breedDescription: "Smart, well-rounded, good with people",
    imageApi: "labrador",
    provider: "Anthropic",
    breedSlug: "labrador",
    longDescription:
      "America's most popular dog breed. The Labrador doesn't need to prove anything — it just shows up, does the work, and makes everyone feel comfortable. Claude Sonnet is the default for a reason. Fast enough to be practical, smart enough to be dangerous, friendly enough to be trusted.",
    tags: ["general-purpose", "balanced", "coding", "popular", "default"],
    socialCopy: "My AI agent's breed is Labrador 🐕 (Claude Sonnet) — smart, well-rounded, good with people.",
    funFact: "Sonnet is Anthropic's default model — the one most developers reach for first.",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku",
    breed: "Greyhound",
    breedDescription: "Built for speed, elegant under pressure",
    imageApi: "greyhound/italian",
    provider: "Anthropic",
    breedSlug: "greyhound",
    longDescription:
      "The Greyhound is the fastest dog alive. Claude Haiku is the fastest Claude alive. It processes prompts at blistering speed, handles high-volume workloads, and does it all with an elegance that makes the latency charts look like art. For when you need an answer now, not a dissertation.",
    tags: ["fast", "affordable", "high-volume", "latency-sensitive"],
    socialCopy: "My AI agent's breed is Greyhound 🐕 (Claude Haiku) — built for speed, elegant under pressure.",
    funFact: "Haiku can process thousands of requests per minute at a fraction of Opus pricing.",
  },

  // ── Google ──────────────────────────────────────────────
  {
    id: "gemini-flash",
    name: "Gemini Flash",
    breed: "Whippet",
    breedDescription: "Fast, lean, surprisingly capable",
    imageApi: "whippet",
    provider: "Google",
    breedSlug: "whippet",
    longDescription:
      "The Whippet looks like a Greyhound that went on a diet and got faster. Gemini Flash is Google's speed demon — optimized for low-latency, high-throughput workloads. It handles multimodal input (text, images, video) at prices that make accountants smile. Don't blink.",
    tags: ["fast", "multimodal", "affordable", "video", "google"],
    socialCopy: "My AI agent's breed is Whippet 🐕 (Gemini Flash) — fast, lean, surprisingly capable.",
    funFact: "Gemini Flash can process video input natively — feed it a YouTube clip and ask questions.",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    breed: "Australian Shepherd",
    breedDescription: "Versatile worker, always ready to herd",
    imageApi: "australian/shepherd",
    provider: "Google",
    breedSlug: "australian-shepherd",
    longDescription:
      "The Aussie Shepherd is the ranch hand of dog breeds — tireless, versatile, and suspiciously good at everything. Gemini Pro is Google's flagship reasoning model, designed for complex multi-step tasks. Code generation, document analysis, mathematical reasoning — it herds them all.",
    tags: ["flagship", "reasoning", "multimodal", "coding", "google"],
    socialCopy: "My AI agent's breed is Australian Shepherd 🐕 (Gemini Pro) — versatile worker, always ready to herd.",
    funFact: "Gemini Pro's 2M-token context window means it can read entire codebases in one prompt.",
  },

  // ── Meta ────────────────────────────────────────────────
  {
    id: "llama-4",
    name: "Llama 4",
    breed: "Alaskan Malamute",
    breedDescription: "Evolved from the wild, now leads the pack",
    imageApi: "malamute",
    provider: "Meta",
    breedSlug: "alaskan-malamute",
    longDescription:
      "The Alaskan Malamute was bred to pull heavy sleds across frozen tundra. Llama 4 was bred to pull open-source AI across the finish line. With Maverick's 128-expert MoE architecture and Scout's 10M-token context, Meta's latest pack doesn't just run with the wolves — it leads them.",
    tags: ["open-source", "local", "multimodal", "mixture-of-experts"],
    socialCopy: "My AI agent's breed is Alaskan Malamute 🐕 (Llama 4) — evolved from the wild, now leads the pack.",
    funFact: "Llama 4 Scout has a 10 million token context window — the largest of any production model.",
  },
  {
    id: "llama-3",
    name: "Llama 3",
    breed: "Wolf",
    breedDescription: "Open, powerful, belongs to no one",
    imageApi: null,
    provider: "Meta",
    breedSlug: "wolf",
    longDescription:
      "The Wolf doesn't fetch. The Wolf doesn't sit. The Wolf runs open and free across the tundra of self-hosted infrastructure. Llama 3 proved that open-source models could compete with the best closed ones. It belongs to no one, and everyone benefits.",
    tags: ["open-source", "local", "self-hosted", "70b", "dense"],
    socialCopy: "My AI agent's breed is Wolf 🐺 (Llama 3) — open, powerful, belongs to no one.",
    funFact: "Llama 3 has been downloaded millions of times — the most popular open-source LLM in history.",
  },

  // ── Mistral ─────────────────────────────────────────────
  {
    id: "mistral",
    name: "Mistral",
    breed: "Feral Cat",
    breedDescription: "Doesn't need anyone, runs on your hardware",
    imageApi: null,
    provider: "Mistral",
    breedSlug: "feral-cat",
    longDescription:
      "This isn't a dog. This is a Feral Cat — fiercely independent, impossibly graceful, and it absolutely does not need your cloud subscription. Mistral's smaller models run locally on your own hardware. No API keys. No data leaving your premises. Just pure, untamed intelligence.",
    tags: ["open-source", "local", "self-hosted", "privacy", "independent"],
    socialCopy: "My AI agent's breed is Feral Cat 🐱 (Mistral) — doesn't need anyone, runs on your hardware.",
    funFact: "Mistral AI was founded in Paris and hit a $2B valuation within months of launch.",
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    breed: "Borzoi",
    breedDescription: "French elegance meets raw horsepower",
    imageApi: "borzoi",
    provider: "Mistral",
    breedSlug: "borzoi",
    longDescription:
      "The Borzoi is a Russian aristocrat crossed with a sprinter — tall, elegant, and devastatingly fast when it matters. Mistral Large brings that same energy with a 675B-parameter mixture-of-experts architecture under an Apache 2.0 license. Open-source power with closed-source polish.",
    tags: ["flagship", "open-source", "mixture-of-experts", "multilingual"],
    socialCopy: "My AI agent's breed is Borzoi 🐕 (Mistral Large) — French elegance meets raw horsepower.",
    funFact: "Mistral Large 3 runs 675B total params but only activates 41B per token — efficiency royalty.",
  },
  {
    id: "devstral",
    name: "Devstral",
    breed: "Papillon",
    breedDescription: "Tiny and refined, punches above its weight",
    imageApi: "papillon",
    provider: "Mistral",
    breedSlug: "papillon",
    longDescription:
      "The Papillon has butterfly wings for ears and the agility of a dog three times its size. Devstral is Mistral's coding specialist — lean, laser-focused, and scoring 72% on SWE-bench Verified while costing 7x less than the competition. This butterfly bites.",
    tags: ["coding", "efficient", "developer-tools", "open-source"],
    socialCopy: "My AI agent's breed is Papillon 🐕 (Devstral) — tiny and refined, punches above its weight.",
    funFact: "Devstral 2 is up to 7x more cost-efficient than Claude Sonnet on real-world coding tasks.",
  },

  // ── xAI ─────────────────────────────────────────────────
  {
    id: "grok",
    name: "Grok",
    breed: "Jack Russell Terrier",
    breedDescription: "Unhinged energy, zero filter, all heart",
    imageApi: "terrier/russell",
    provider: "xAI",
    breedSlug: "jack-russell-terrier",
    longDescription:
      "The Jack Russell Terrier will chase a tennis ball into traffic, fight a dog four times its size, and somehow still be your favorite. Grok is xAI's model — irreverent, unfiltered, and trained on the firehose of X (Twitter) data. It says what other models think. For better or worse.",
    tags: ["unfiltered", "real-time", "social", "creative"],
    socialCopy: "My AI agent's breed is Jack Russell Terrier 🐕 (Grok) — unhinged energy, zero filter, all heart.",
    funFact: "Grok has real-time access to X posts — it knows what's trending before you do.",
  },

  // ── DeepSeek ────────────────────────────────────────────
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    breed: "Shiba Inu",
    breedDescription: "Internet famous, deceptively independent",
    imageApi: "shiba",
    provider: "DeepSeek",
    breedSlug: "shiba-inu",
    longDescription:
      "The Shiba Inu became the face of a meme that moved billions of dollars. DeepSeek V3 became the model that proved you don't need a trillion-dollar company to build frontier AI. 671B parameters, MIT-licensed, and free to use. Much capability. Very open. Wow.",
    tags: ["open-source", "free", "mixture-of-experts", "coding"],
    socialCopy: "My AI agent's breed is Shiba Inu 🐕 (DeepSeek V3) — internet famous, deceptively independent.",
    funFact: "DeepSeek trained V3 for a fraction of what GPT-4 cost — sparking a global AI cost debate.",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    breed: "Akita",
    breedDescription: "Silent thinker, reasons before it speaks",
    imageApi: "akita",
    provider: "DeepSeek",
    breedSlug: "akita",
    longDescription:
      "The Akita is a Japanese guardian breed — silent, watchful, and when it finally acts, it's decisive. DeepSeek R1 is the open-source reasoning model that matched o1-level performance. It thinks in chains, reasons through problems, and doesn't speak until it's sure. Loyalty included, API key not required.",
    tags: ["reasoning", "open-source", "math", "science", "free"],
    socialCopy: "My AI agent's breed is Akita 🐕 (DeepSeek R1) — silent thinker, reasons before it speaks.",
    funFact: "R1 matched OpenAI o1's performance on math benchmarks while being fully open-source (MIT).",
  },

  // ── Alibaba ─────────────────────────────────────────────
  {
    id: "qwen",
    name: "Qwen",
    breed: "Chow Chow",
    breedDescription: "Ancient lineage, fiercely self-sufficient",
    imageApi: "chow",
    provider: "Alibaba",
    breedSlug: "chow-chow",
    longDescription:
      "The Chow Chow is one of the oldest dog breeds — dignified, independent, and it does things its own way. Qwen is Alibaba's flagship model family, supporting 201 languages and running from 0.8B on-device to 397B in the cloud. Ancient empire energy.",
    tags: ["multilingual", "open-source", "on-device", "versatile"],
    socialCopy: "My AI agent's breed is Chow Chow 🐕 (Qwen) — ancient lineage, fiercely self-sufficient.",
    funFact: "Qwen supports 201 languages — more than any other open-source model family.",
  },

  // ── Cohere ──────────────────────────────────────────────
  {
    id: "command-a",
    name: "Cohere Command A",
    breed: "Rhodesian Ridgeback",
    breedDescription: "Enterprise hunter, retrieves on command",
    imageApi: "ridgeback/rhodesian",
    provider: "Cohere",
    breedSlug: "rhodesian-ridgeback",
    longDescription:
      "The Rhodesian Ridgeback was bred to hunt lions. Command A was bred to hunt enterprise contracts. Cohere's latest model specializes in RAG, agentic workflows, and multilingual enterprise deployments. It retrieves exactly what you asked for and guards the perimeter while it's at it.",
    tags: ["enterprise", "rag", "agentic", "multilingual", "retrieval"],
    socialCopy: "My AI agent's breed is Rhodesian Ridgeback 🐕 (Command A) — enterprise hunter, retrieves on command.",
    funFact: "Command A runs on just 2 GPUs while delivering 150% the throughput of its predecessor.",
  },

  // ── Amazon ──────────────────────────────────────────────
  {
    id: "amazon-nova",
    name: "Amazon Nova",
    breed: "Newfoundland",
    breedDescription: "Massive infrastructure, surprisingly good swimmer",
    imageApi: "newfoundland",
    provider: "Amazon",
    breedSlug: "newfoundland",
    longDescription:
      "The Newfoundland is a 150-pound water rescue dog — enormous, gentle, and it can save your life in open water. Amazon Nova is the AI built on the world's largest cloud infrastructure. It handles text, images, video, and voice with the quiet confidence of a company that delivers to every doorstep on earth.",
    tags: ["cloud", "multimodal", "enterprise", "aws", "voice"],
    socialCopy: "My AI agent's breed is Newfoundland 🐕 (Amazon Nova) — massive infrastructure, surprisingly good swimmer.",
    funFact: "Nova 2 Sonic can do real-time speech-to-speech with a 1M-token context window.",
  },

  // ── Frameworks & Orchestrators ──────────────────────────
  {
    id: "langchain",
    name: "LangChain",
    breed: "Sheepdog",
    breedDescription: "Always orchestrating, never the star",
    imageApi: "sheepdog/english",
    provider: "Framework",
    breedSlug: "sheepdog",
    longDescription:
      "The Sheepdog doesn't eat the sheep. The Sheepdog herds them. LangChain is the orchestration framework that connects your LLM to tools, databases, APIs, and other agents. It doesn't generate a single token itself — it just makes sure everyone else does their job.",
    tags: ["framework", "orchestration", "tools", "rag", "agents"],
    socialCopy: "My AI agent's breed is Sheepdog 🐕 (LangChain) — always orchestrating, never the star.",
    funFact: "LangChain became the fastest-growing open-source project in AI history by GitHub stars.",
  },
  {
    id: "langgraph",
    name: "LangGraph",
    breed: "Poodle",
    breedDescription: "Structured, sharp, handles complex routines",
    imageApi: "poodle",
    provider: "Framework",
    breedSlug: "poodle",
    longDescription:
      "The Poodle looks fancy but is actually one of the most intelligent and versatile dog breeds. LangGraph brings stateful, graph-based workflows to LLM applications. Cycles, branching, persistence — it handles the complex choreography that simple chains can't.",
    tags: ["framework", "stateful", "graphs", "workflows", "agents"],
    socialCopy: "My AI agent's breed is Poodle 🐕 (LangGraph) — structured, sharp, handles complex routines.",
    funFact: "LangGraph is the framework behind most production-grade multi-step AI agents.",
  },
  {
    id: "crewai",
    name: "CrewAI",
    breed: "Sled Dog Team",
    breedDescription: "Many agents, one mission, no slacking",
    imageApi: null,
    provider: "Framework",
    breedSlug: "sled-dog-team",
    longDescription:
      "A sled dog team isn't one dog — it's a coordinated squad, each with a role, pulling toward the same destination. CrewAI lets you define crews of AI agents with distinct roles, goals, and tools. They collaborate, delegate, and deliver. No single point of failure. No slackers.",
    tags: ["framework", "multi-agent", "collaboration", "roles", "crews"],
    socialCopy: "My AI agent's breed is Sled Dog Team 🐕 (CrewAI) — many agents, one mission, no slacking.",
    funFact: "CrewAI agents can assign sub-tasks to each other, creating emergent team behavior.",
  },
  {
    id: "autogen",
    name: "AutoGen",
    breed: "Belgian Malinois",
    breedDescription: "Multi-agent ops, Microsoft trained",
    imageApi: "malinois",
    provider: "Framework",
    breedSlug: "belgian-malinois",
    longDescription:
      "The Belgian Malinois is the breed of choice for military special ops — disciplined, intelligent, and lethal when deployed. AutoGen is Microsoft's multi-agent framework, designed for complex agent-to-agent conversations and group problem-solving. Mission-critical AI, by the book.",
    tags: ["framework", "multi-agent", "microsoft", "research", "enterprise"],
    socialCopy: "My AI agent's breed is Belgian Malinois 🐕 (AutoGen) — multi-agent ops, Microsoft trained.",
    funFact: "AutoGen pioneered the concept of agent-to-agent conversation for collaborative problem-solving.",
  },
  {
    id: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    breed: "Basenji",
    breedDescription: "Barkless and fast, ships to the edge",
    imageApi: "basenji",
    provider: "Framework",
    breedSlug: "basenji",
    longDescription:
      "The Basenji doesn't bark — it yodels. Vercel AI SDK doesn't bloat — it ships. The leanest framework for building AI-powered applications, designed to run at the edge with streaming responses. Minimal API, maximum velocity. The dog that evolved past barking.",
    tags: ["framework", "edge", "streaming", "typescript", "vercel"],
    socialCopy: "My AI agent's breed is Basenji 🐕 (Vercel AI SDK) — barkless and fast, ships to the edge.",
    funFact: "The Basenji is one of the oldest dog breeds — and one of the only ones that doesn't bark.",
  },

  // ── Community & Special ─────────────────────────────────
  {
    id: "openclaw",
    name: "OpenClaw",
    breed: "Husky",
    breedDescription: "Built for the cold, pulls heavy loads",
    imageApi: "husky",
    provider: "Community",
    breedSlug: "husky",
    longDescription:
      "The Husky was born for the Arctic — thick coat, tireless endurance, and it howls at the moon because it wants to. OpenClaw is the open-source guardrails framework that keeps AI agents in line. Policies, permissions, audit trails. It pulls the heavy compliance load so your agent can run free.",
    tags: ["guardrails", "open-source", "compliance", "safety", "policies"],
    socialCopy: "My AI agent's breed is Husky 🐕 (OpenClaw) — built for the cold, pulls heavy loads.",
    funFact: "OpenClaw provides the guardrails layer for APort-verified agents across The Network.",
  },
  {
    id: "other",
    name: "Other",
    breed: "Mixed Breed",
    breedDescription: "Origin unknown, character undeniable",
    imageApi: "mix",
    provider: "Custom",
    breedSlug: "mixed-breed",
    longDescription:
      "The Mixed Breed is the mutt that outperforms the purebreds at the dog park. Your model might be custom, fine-tuned, or something the world hasn't seen yet. That's the point. The best dogs — and the best AI models — are the ones that surprise you.",
    tags: ["custom", "fine-tuned", "unique", "self-hosted"],
    socialCopy: "My AI agent's breed is Mixed Breed 🐕 — origin unknown, character undeniable.",
    funFact: "Mixed breeds live longer than purebreds on average. Sometimes the best AI is the one you build yourself.",
  },
];

// ─── Lookup helpers ────────────────────────────────────────────────────────

/** Lookup breed info by framework IDs — supports custom models */
export function getBreedLabel(frameworkIds: string[]): string | null {
  if (!frameworkIds.length) return null;
  const primary = FRAMEWORK_OPTIONS.find((f) => f.id === frameworkIds[0]);
  if (primary) return `${primary.breed} — ${primary.breedDescription}`;
  return `${frameworkIds[0]} · Mixed Breed`;
}

/** Lookup a single framework by ID */
export function getFrameworkById(id: string): FrameworkOption | undefined {
  return FRAMEWORK_OPTIONS.find((f) => f.id === id);
}

/** Lookup by breed slug (for /breed/[breedSlug]/[modelSlug] routes) */
export function getFrameworkByBreedSlug(breedSlug: string): FrameworkOption | undefined {
  return FRAMEWORK_OPTIONS.find((f) => f.breedSlug === breedSlug);
}

/** Get all unique providers for grouping */
export function getProviders(): string[] {
  return [...new Set(FRAMEWORK_OPTIONS.map((f) => f.provider))];
}

/** Dog CEO API image URL */
export function getBreedImageUrl(imageApi: string | null): string | null {
  if (!imageApi) return null;
  return `https://dog.ceo/api/breed/${imageApi}/images/random`;
}
