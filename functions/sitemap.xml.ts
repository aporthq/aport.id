/**
 * Dynamic sitemap.xml
 * GET /sitemap.xml
 *
 * Generates a sitemap that includes all static pages plus
 * every passport page from the gallery API. This ensures
 * search engines discover and index individual agent pages.
 *
 * Overrides the static public/sitemap.xml via Cloudflare Functions
 * routing priority (functions > static assets).
 */
import type { AppEnv } from "./lib/types";
import { fetchGalleryPassports } from "./lib/gallery";
import { BREEDS } from "./lib/breeds";

const SITE = "https://aport.id";

// Breed slug mapping for sitemap (model ID → breed slug)
const BREED_SLUGS: Record<string, string> = {
  "gpt-4o": "golden-retriever", "gpt-4o-mini": "corgi", "gpt-5": "bernese-mountain-dog",
  "o3": "bloodhound", "o4-mini": "german-shorthaired-pointer", "codex": "dalmatian",
  "claude-opus": "border-collie", "claude-sonnet": "labrador", "claude-haiku": "greyhound",
  "gemini-flash": "whippet", "gemini-pro": "australian-shepherd",
  "llama-4": "alaskan-malamute", "llama-3": "wolf",
  "mistral": "feral-cat", "mistral-large": "borzoi", "devstral": "papillon",
  "grok": "jack-russell-terrier",
  "deepseek-v3": "shiba-inu", "deepseek-r1": "akita",
  "qwen": "chow-chow", "command-a": "rhodesian-ridgeback", "amazon-nova": "newfoundland",
  "langchain": "sheepdog", "langgraph": "poodle", "crewai": "sled-dog-team",
  "autogen": "belgian-malinois", "vercel-ai-sdk": "basenji",
  "openclaw": "husky", "other": "mixed-breed",
};

const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/create/", changefreq: "weekly", priority: "0.9" },
  { loc: "/gallery/", changefreq: "daily", priority: "0.8" },
  { loc: "/what-breed-is-my-ai/", changefreq: "weekly", priority: "0.8" },
  { loc: "/manage/", changefreq: "monthly", priority: "0.7" },
  { loc: "/skill", changefreq: "monthly", priority: "0.6" },
  { loc: "/agents.txt", changefreq: "monthly", priority: "0.5" },
];

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toUrlEntry(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) entry += `    <lastmod>${lastmod}</lastmod>\n`;
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  entry += `  </url>`;
  return entry;
}

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request } = context;

  // Edge cache: 1 hour
  const isDev = new URL(request.url).hostname === "localhost";
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
  if (!isDev) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  // Static pages
  const urls: string[] = STATIC_PAGES.map((p) =>
    toUrlEntry(`${SITE}${p.loc}`, p.changefreq, p.priority),
  );

  // Fetch all gallery passports for dynamic passport URLs.
  // fetchGalleryPassports does client-side pagination from a single API call,
  // so we request a large limit to get everything in one shot.
  try {
    const result = await fetchGalleryPassports(env, {
      limit: 1000,
      offset: 0,
      status: "active",
    });

    for (const p of result.passports) {
      const slug = p.slug || p.agent_id;
      const lastmod = p.created_at ? p.created_at.split("T")[0] : undefined;
      urls.push(
        toUrlEntry(
          `${SITE}/passport/${slug}/`,
          "monthly",
          "0.7",
          lastmod,
        ),
      );
    }
  } catch (err) {
    console.error("[sitemap] Gallery fetch error:", err);
    // Continue with static pages only
  }

  // Breed detail pages — one per model
  for (const [modelId, breedSlug] of Object.entries(BREED_SLUGS)) {
    urls.push(
      toUrlEntry(
        `${SITE}/breed/${breedSlug}/${modelId}`,
        "monthly",
        "0.6",
      ),
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  const response = new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });

  if (!isDev) {
    context.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
};
