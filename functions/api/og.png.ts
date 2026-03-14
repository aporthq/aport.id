/**
 * Generic OG Image Generator
 * GET /api/og.png?page=home|gallery|create|manage
 *
 * Renders branded 1200×628 OG images for non-passport pages.
 * Passport pages use their own /api/passport/[id]/og.png endpoint.
 * Cached for 7 days on edge.
 */
import type { AppEnv } from "../lib/types";
import { getCorsHeaders } from "../lib/cors";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";

// ─── Font ──────────────────────────────────────────────────────────────────

let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff";
const FONT_BOLD_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff";

async function loadFonts(): Promise<void> {
  if (fontRegular && fontBold) return;
  const [reg, bold] = await Promise.all([
    fetch(FONT_URL).then((r) => r.arrayBuffer()),
    fetch(FONT_BOLD_URL).then((r) => r.arrayBuffer()),
  ]);
  fontRegular = reg;
  fontBold = bold;
}

// ─── Satori element builder ───────────────────────────────────────────────

type El = { type: string; props: Record<string, unknown> };

function h(
  type: string,
  style: Record<string, unknown>,
  ...children: (El | string)[]
): El {
  if (children.length === 0) return { type, props: { style } };
  if (children.length === 1)
    return { type, props: { style, children: children[0] } };
  if (!style.display) style = { display: "flex", ...style };
  return { type, props: { style, children } };
}

// ─── Page configs ─────────────────────────────────────────────────────────

interface PageConfig {
  title: string;
  subtitle: string;
  accent: string;
}

const PAGES: Record<string, PageConfig> = {
  home: {
    title: "Give your agent an identity.",
    subtitle:
      "A name, an origin, and a portable credential — issued in 60 seconds.",
    accent: "Verifiable DID credentials for AI agents",
  },
  gallery: {
    title: "Discover AI agents",
    subtitle:
      "Browse verified agents with APort passports. Every agent has a real, portable identity.",
    accent: "AI Agent Gallery",
  },
  create: {
    title: "Create your agent's passport.",
    subtitle:
      "Register your AI agent and get a verifiable DID credential in 60 seconds. No account required.",
    accent: "AI Agent Registration",
  },
  manage: {
    title: "Manage your agent's identity.",
    subtitle:
      "Update capabilities, deliverable contracts, and identity details for your AI agent.",
    accent: "Passport Management",
  },
};

// ─── Build card ───────────────────────────────────────────────────────────

function buildImage(config: PageConfig): El {
  return h(
    "div",
    {
      width: "1200px",
      height: "628px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      background: "#06090f",
      padding: "64px 72px",
      fontFamily: "Inter",
      color: "#e8ecf1",
      position: "relative",
      overflow: "hidden",
    },
    // Ambient glow — top right
    h("div", {
      position: "absolute",
      top: "-120px",
      right: "-80px",
      width: "500px",
      height: "500px",
      borderRadius: "50%",
      background: "rgba(6,182,212,0.1)",
    }),
    // Ambient glow — bottom left
    h("div", {
      position: "absolute",
      bottom: "-100px",
      left: "-60px",
      width: "400px",
      height: "400px",
      borderRadius: "50%",
      background: "rgba(6,182,212,0.05)",
    }),
    // Content
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1,
      },
      // Top line — accent label
      h(
        "div",
        {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "32px",
        },
        // Shield icon (simplified)
        h(
          "div",
          {
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(6,182,212,0.15)",
            border: "1px solid rgba(6,182,212,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            color: "#22d3ee",
            fontWeight: 700,
          },
          "◆",
        ),
        h(
          "div",
          {
            fontSize: "14px",
            fontWeight: 600,
            color: "#22d3ee",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          },
          config.accent,
        ),
      ),
      // Title
      h(
        "div",
        {
          fontSize: "56px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "20px",
          maxWidth: "900px",
        },
        config.title,
      ),
      // Subtitle
      h(
        "div",
        {
          fontSize: "22px",
          color: "rgba(122,139,163,0.8)",
          lineHeight: 1.5,
          maxWidth: "700px",
        },
        config.subtitle,
      ),
    ),
    // Bottom bar
    h(
      "div",
      {
        position: "absolute",
        bottom: "48px",
        left: "72px",
        right: "72px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
      // Logo
      h(
        "div",
        {
          fontSize: "18px",
          fontWeight: 700,
          color: "rgba(232,236,241,0.6)",
          letterSpacing: "-0.01em",
        },
        "aport.id",
      ),
      // URL
      h(
        "div",
        { fontSize: "15px", color: "rgba(122,139,163,0.4)" },
        "aport.id",
      ),
    ),
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { request } = context;
  const cors = getCorsHeaders(request);
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "home";
  const config = PAGES[page] || PAGES.home;

  // Edge cache
  const isDev = url.hostname === "localhost";
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  if (!isDev) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  await loadFonts();

  try {
    const tree = buildImage(config);
    const imgResponse = new ImageResponse(
      tree as unknown as React.ReactElement,
      {
        width: 1200,
        height: 628,
        fonts: [
          {
            name: "Inter",
            data: fontRegular!,
            weight: 400,
            style: "normal" as const,
          },
          {
            name: "Inter",
            data: fontBold!,
            weight: 700,
            style: "normal" as const,
          },
        ],
      },
    );

    const body = await imgResponse.arrayBuffer();
    const response = new Response(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, s-maxage=604800",
        ...cors,
      },
    });

    if (!isDev) {
      context.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`OG generation failed: ${msg}`, { status: 500 });
  }
};
