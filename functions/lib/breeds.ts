/**
 * Breed mapping for Cloudflare Functions
 *
 * Single source of truth for the functions runtime (middleware, OG image).
 * Keep in sync with lib/config/breeds.ts (Next.js app) and bin/aport-id (CLI).
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

/** Get breed name from a framework ID. Returns null for unknown IDs. */
export function getBreed(frameworks: string[]): string | null {
  if (!frameworks?.length) return null;
  return BREEDS[frameworks[0]] || null;
}
