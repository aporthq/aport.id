/**
 * Breed detail page OG meta injection middleware
 *
 * Matches /breed/:breedSlug/:modelId — same pattern as passport middleware.
 * Serves the SPA page at /breed/ and injects per-breed OG meta tags
 * via HTMLRewriter so crawlers see the correct title and structured data.
 */
import type { AppEnv } from "../../../lib/types";
import { BREEDS } from "../../../lib/breeds";

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const breedSlug = params.breedSlug as string;
  const modelId = params.modelId as string;
  if (!breedSlug || !modelId) return context.next();

  // Serve the SPA page (/breed/index.html) via ASSETS binding
  const spaUrl = new URL(request.url);
  spaUrl.pathname = "/breed/";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assets = (env as any).ASSETS as { fetch: typeof fetch } | undefined;
  const response = assets
    ? await assets.fetch(
        new Request(spaUrl.toString(), { headers: request.headers }),
      )
    : await context.next();

  // Only rewrite HTML responses
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // Get breed name from model ID, fall back to title-cased slug
  const breedName =
    BREEDS[modelId] ||
    breedSlug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const modelName = modelId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const title = `${breedName} — ${modelName} | AI Model Breed`;
  const desc = `${modelName} is a ${breedName}. Every AI model has a personality — discover yours at aport.id`;
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://aport.id";
  const pageUrl = `${baseUrl}/breed/${breedSlug}/${modelId}`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    name: title,
    url: pageUrl,
    description: desc,
  });

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
        el.setAttribute("content", desc);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute("content", pageUrl);
      },
    })
    .on('meta[property="og:type"]', {
      element(el) {
        el.setAttribute("content", "article");
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute("content", title);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute("content", desc);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute("content", desc);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute("href", pageUrl);
      },
    })
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
