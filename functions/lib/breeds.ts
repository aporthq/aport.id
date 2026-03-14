/**
 * Breed mapping for Cloudflare Functions
 *
 * Single source of truth for the functions runtime (middleware, OG image).
 * Keep in sync with lib/config/breeds.ts (Next.js app) and bin/aport-id (CLI).
 *
 * BREEDS: framework ID → breed name
 * BREED_TAGLINES: breed name → short personality tagline (from breedDescription)
 */

export const BREEDS: Record<string, string> = {
  // OpenAI
  "gpt-4o": "Golden Retriever",
  "gpt-4o-mini": "Corgi",
  "gpt-5": "Bernese Mountain Dog",
  "o3": "Bloodhound",
  "o4-mini": "German Shorthaired Pointer",
  "o1": "Bloodhound", // backward compat alias
  "codex": "Dalmatian",
  // Anthropic
  "claude-opus": "Border Collie",
  "claude-sonnet": "Labrador",
  "claude-haiku": "Greyhound",
  // Google
  "gemini-flash": "Whippet",
  "gemini-flash-2.5": "Whippet", // backward compat alias
  "gemini-pro": "Australian Shepherd",
  // Meta
  "llama-4": "Alaskan Malamute",
  "llama-3": "Wolf",
  // Mistral
  "mistral": "Feral Cat",
  "mistral-large": "Borzoi",
  "devstral": "Papillon",
  // xAI
  "grok": "Jack Russell Terrier",
  // DeepSeek
  "deepseek-v3": "Shiba Inu",
  "deepseek-r1": "Akita",
  // Alibaba
  "qwen": "Chow Chow",
  // Cohere
  "command-a": "Rhodesian Ridgeback",
  // Amazon
  "amazon-nova": "Newfoundland",
  // Frameworks
  "langchain": "Sheepdog",
  "langgraph": "Poodle",
  "crewai": "Sled Dog Team",
  "autogen": "Belgian Malinois",
  "vercel-ai-sdk": "Basenji",
  // Community
  "openclaw": "Husky",
  "other": "Mixed Breed",
};

/**
 * Breed taglines — short personality lines derived from lib/config/breeds.ts breedDescription.
 * Keyed by breed name (not framework ID) so it works for any model with that breed.
 */
export const BREED_TAGLINES: Record<string, string> = {
  "Golden Retriever": "Reliable, friendly, everyone has one",
  "Corgi": "Small but thinks it can handle anything",
  "Bernese Mountain Dog": "Big, warm, surprisingly gentle for its size",
  "Bloodhound": "Slow and deliberate, never loses the scent",
  "German Shorthaired Pointer": "Nimble tracker, cost-effective precision",
  "Dalmatian": "Spots patterns in code, born to ship",
  "Border Collie": "Overthinks everything, extremely capable",
  "Labrador": "Smart, well-rounded, good with people",
  "Greyhound": "Built for speed, elegant under pressure",
  "Whippet": "Fast, lean, surprisingly capable",
  "Australian Shepherd": "Versatile worker, always ready to herd",
  "Alaskan Malamute": "Evolved from the wild, now leads the pack",
  "Wolf": "Open, powerful, belongs to no one",
  "Feral Cat": "Doesn't need anyone, runs on your hardware",
  "Borzoi": "French elegance meets raw horsepower",
  "Papillon": "Tiny and refined, punches above its weight",
  "Jack Russell Terrier": "Unhinged energy, zero filter, all heart",
  "Shiba Inu": "Internet famous, deceptively independent",
  "Akita": "Silent thinker, reasons before it speaks",
  "Chow Chow": "Ancient lineage, fiercely self-sufficient",
  "Rhodesian Ridgeback": "Enterprise hunter, retrieves on command",
  "Newfoundland": "Massive infrastructure, surprisingly good swimmer",
  "Sheepdog": "Always orchestrating, never the star",
  "Poodle": "Structured, sharp, handles complex routines",
  "Sled Dog Team": "Many agents, one mission, no slacking",
  "Belgian Malinois": "Multi-agent ops, Microsoft trained",
  "Basenji": "Barkless and fast, ships to the edge",
  "Husky": "Built for the cold, pulls heavy loads",
  "Mixed Breed": "Origin unknown, character undeniable",
};

/** Get breed name from a framework ID. Returns null for unknown IDs. */
export function getBreed(frameworks: string[]): string | null {
  if (!frameworks?.length) return null;
  return BREEDS[frameworks[0]] || null;
}

/** Get breed tagline from a breed name. Returns null for unknown breeds. */
export function getBreedTagline(breedName: string | null): string | null {
  if (!breedName) return null;
  return BREED_TAGLINES[breedName] || null;
}
