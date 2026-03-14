/**
 * Passport page OG meta injection middleware
 *
 * Crawlers (X, LinkedIn, iMessage, Slack) don't execute JavaScript.
 * Since this is a static export, the HTML has generic OG tags.
 * This middleware intercepts HTML responses, fetches passport data,
 * and injects per-agent OG meta tags via HTMLRewriter so crawlers
 * see the correct title, description, and og:image.
 */
import type { AppEnv } from "../../lib/types";
import { createAPortService } from "../../lib/services/aport";
import { getBreed } from "../../lib/breeds";

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const raw = params.id as string;
  if (!raw) return context.next();

  // PRD E2.2: /passport/[id].json → raw JSON proxy
  if (raw.endsWith('.json')) {
    const idOrSlug = raw.replace(/\.json$/, '');
    try {
      const aport = createAPortService(env);
      const r = await aport.resolvePassport(idOrSlug, 'json');
      if (!r.success || !r.data) {
        return new Response(JSON.stringify({ error: 'not_found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      return new Response(JSON.stringify(r.data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'upstream_error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const idOrSlug = raw;

  // Fetch the SPA page (/passport/index.html) since /passport/[id] doesn't
  // exist as a static file. We fetch from origin to get the static asset.
  // Fetch the SPA page (/passport/index.html) via ASSETS binding
  const spaUrl = new URL(request.url);
  spaUrl.pathname = "/passport/";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assets = (env as any).ASSETS as { fetch: typeof fetch } | undefined;
  const response = assets
    ? await assets.fetch(new Request(spaUrl.toString(), { headers: request.headers }))
    : await context.next();

  // Only rewrite HTML responses
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // Fetch passport data for OG tags
  let passport: Record<string, unknown>;
  try {
    const aport = createAPortService(env);
    const r = await aport.resolvePassport(idOrSlug, "json");
    if (!r.success || !r.data) return response;
    passport = r.data as Record<string, unknown>;
  } catch {
    return response; // Serve page without OG injection on API failure
  }

  const name = (passport.name as string) || "Agent";
  const role = (passport.role as string) || "agent";
  const desc =
    (passport.description as string) ||
    `${name} is a verified AI ${role} on APort.`;
  const frameworks = (passport.framework as string[]) || [];
  const breed = getBreed(frameworks);
  const slug = (passport.slug as string) || idOrSlug;

  const title = `${name} — APort Passport`;
  const ogDesc = breed ? `${breed} · ${desc}` : desc;
  const baseUrl =
    env.NEXT_PUBLIC_APP_URL || "https://aport.id";
  const ogImage = `${baseUrl}/api/passport/${slug}/og.png`;
  const pageUrl = `${baseUrl}/passport/${slug}`;
  const createdAt = (passport.created_at as string) || "";
  const agentId = (passport.agent_id as string) || idOrSlug;

  // JSON-LD ProfilePage structured data
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: title,
    url: pageUrl,
    description: ogDesc,
    dateCreated: createdAt,
    mainEntity: {
      "@type": "Thing",
      name,
      identifier: agentId,
      description: desc,
      additionalType: `AI ${role}`,
    },
  });

  // HTMLRewriter: replace ALL OG/Twitter meta tags in the static HTML.
  // The static HTML has layout-level defaults (home page OG image, etc.)
  // that must be overwritten — not appended to — for crawlers to see
  // the correct passport-specific values.
  return new HTMLRewriter()
    .on("title", {
      element(el) {
        el.setInnerContent(title);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute("content", title);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute("content", ogDesc);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute("content", pageUrl);
      },
    })
    .on('meta[property="og:site_name"]', {
      element(el) {
        el.setAttribute("content", "aport.id");
      },
    })
    .on('meta[property="og:locale"]', {
      element(el) {
        el.setAttribute("content", "en_US");
      },
    })
    .on('meta[property="og:type"]', {
      element(el) {
        el.setAttribute("content", "profile");
      },
    })
    // Replace the existing og:image (which points to the home page OG)
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute("content", ogImage);
      },
    })
    .on('meta[property="og:image:alt"]', {
      element(el) {
        el.setAttribute("content", title);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute("content", title);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute("content", ogDesc);
      },
    })
    .on('meta[name="twitter:card"]', {
      element(el) {
        el.setAttribute("content", "summary_large_image");
      },
    })
    // Replace the existing twitter:image (which points to the home page OG)
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute("content", ogImage);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute("content", ogDesc);
      },
    })
    // Replace existing canonical with passport-specific URL
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute("href", pageUrl);
      },
    })
    // Append JSON-LD (no existing one to replace for passport pages)
    .on("head", {
      element(el) {
        el.append(
          `<script type="application/ld+json">${jsonLd}</script>`,
          { html: true },
        );
      },
    })
    .transform(response);
};
