/**
 * OG Image Generator — Passport Card
 * GET /api/passport/:id/og.png
 *
 * Renders a 1200×628 passport card as PNG via @cloudflare/pages-plugin-vercel-og.
 *
 * Design principles (research-backed):
 * - Fitt's Law: large touch targets → name & avatar dominate
 * - Von Restorff Effect: one bold accent element (breed name) pops
 * - Miller's Law: max 4 information chunks (name, breed, role+desc, verified)
 * - F-Pattern: key info top-left, secondary top-right, scan left-to-right
 * - Picture Superiority: avatar is 5× larger → remembered 6× better than text
 * - Serial Position: strong first item (name) + strong last item (verified badge)
 * - Contrast: 15:1 ratio on primary text, gradient accents for depth
 *
 * Cached 24 hours on Cloudflare edge.
 */
import type { AppEnv } from "../../../lib/types";
import { getCorsHeaders } from "../../../lib/cors";
import { createAPortService } from "../../../lib/services/aport";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";
import { BREEDS, BREED_TAGLINES } from "../../../lib/breeds";

// ─── Avatar ─────────────────────────────────────────────────────────────────

function hashStr(s: string): number[] {
  const b: number[] = [];
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    b.push(Math.abs(h % 256));
  }
  while (b.length < 32) {
    h = ((h << 5) - h + b.length) | 0;
    b.push(Math.abs(h % 256));
  }
  return b;
}

const PALETTES = [
  ["#22d3ee", "#06b6d4", "#0891b2"],
  ["#818cf8", "#6366f1", "#4f46e5"],
  ["#a78bfa", "#8b5cf6", "#7c3aed"],
  ["#34d399", "#10b981", "#059669"],
  ["#f472b6", "#ec4899", "#db2777"],
  ["#fb923c", "#f97316", "#ea580c"],
  ["#38bdf8", "#0ea5e9", "#0284c7"],
  ["#a3e635", "#84cc16", "#65a30d"],
];

function avatarRects(id: string): { x: number; y: number; color: string }[] {
  const b = hashStr(id);
  const c = PALETTES[b[0] % PALETTES.length];
  const grid: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    const r: boolean[] = [];
    for (let col = 0; col < 3; col++)
      r.push(b[(row * 3 + col + 1) % b.length] % 2 === 0);
    grid.push([r[0], r[1], r[2], r[1], r[0]]);
  }
  const rects: { x: number; y: number; color: string }[] = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 5; col++)
      if (grid[row][col])
        rects.push({ x: col, y: row, color: c[b[(row + col + 2) % b.length] % c.length] });
  return rects;
}

function getPaletteForId(id: string): string[] {
  const b = hashStr(id);
  return PALETTES[b[0] % PALETTES.length];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Satori element builder ─────────────────────────────────────────────────

type El = { type: string; props: Record<string, unknown> };

function h(
  type: string,
  style: Record<string, unknown>,
  ...children: (El | string)[]
): El {
  if (children.length === 0) return { type, props: { style } };
  if (children.length === 1) return { type, props: { style, children: children[0] } };
  if (!style.display) style = { display: "flex", ...style };
  return { type, props: { style, children } };
}

// ─── Font caching ───────────────────────────────────────────────────────────

let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

const FONT_REGULAR_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff";
const FONT_BOLD_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff";

async function loadFonts(): Promise<void> {
  if (fontRegular && fontBold) return;
  const [reg, bold] = await Promise.all([
    fetch(FONT_REGULAR_URL).then((r) => {
      if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`);
      return r.arrayBuffer();
    }),
    fetch(FONT_BOLD_URL).then((r) => {
      if (!r.ok) throw new Error(`Bold font fetch failed: ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);
  fontRegular = reg;
  fontBold = bold;
}

// ─── Build card ─────────────────────────────────────────────────────────────

function buildCard(p: {
  name: string;
  role: string;
  desc: string;
  breed: string | null;
  breedTagline: string | null;
  framework: string | null;
  status: string;
  claimed: boolean;
  agentId: string;
  slug: string;
  regions: string[];
  createdAt: string;
  capabilityCount: number;
}): El {
  const palette = getPaletteForId(p.agentId);
  const accentPrimary = palette[0];
  const accentDark = palette[2];
  const CELL = 28;
  const GAP = 3;
  const AV_SIZE = CELL * 5 + GAP * 4;
  const rects = avatarRects(p.agentId);

  // Build avatar cells — 5×5 grid, much larger
  const avCells: El[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const rect = rects.find((r) => r.x === col && r.y === row);
      avCells.push(
        h("div", {
          position: "absolute",
          left: `${col * (CELL + GAP)}px`,
          top: `${row * (CELL + GAP)}px`,
          width: `${CELL}px`,
          height: `${CELL}px`,
          borderRadius: "6px",
          background: rect ? rect.color : "rgba(255,255,255,0.04)",
        }),
      );
    }
  }

  // Respect the user's chosen casing — "coolBeans" stays "coolBeans"
  const displayName = p.name.length > 20 ? p.name.slice(0, 18) + "…" : p.name;

  // Truncate description — one strong line
  const displayDesc = p.desc.length > 90 ? p.desc.slice(0, 87) + "…" : p.desc;

  // Role label — capitalize
  const roleLabel = p.role.charAt(0).toUpperCase() + p.role.slice(1);

  // Apple layout: single column, everything flows from one anchor point.
  // Top row: avatar + name on same baseline. Content cascades down.
  // No split vertical alignment — everything shares the same visual gravity.

  return h(
    "div",
    {
      width: "1200px",
      height: "628px",
      display: "flex",
      flexDirection: "column",
      background: "#06090f",
      fontFamily: "Inter",
      color: "#f0f4f8",
      position: "relative",
      overflow: "hidden",
      padding: "56px 64px",
    },

    // ── Background: gradient orbs (palette-matched, subtle) ──
    h("div", {
      position: "absolute",
      top: "-200px",
      right: "-150px",
      width: "700px",
      height: "700px",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${accentPrimary}18 0%, ${accentDark}08 50%, transparent 70%)`,
    }),
    h("div", {
      position: "absolute",
      bottom: "-120px",
      left: "-80px",
      width: "400px",
      height: "400px",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${accentPrimary}0c 0%, transparent 60%)`,
    }),

    // ── Row 1: Avatar + Name + Status (shared baseline — Apple style) ──
    h(
      "div",
      {
        display: "flex",
        alignItems: "center",
        gap: "28px",
        position: "relative",
        zIndex: 1,
      },
      // Avatar with glow
      h(
        "div",
        {
          position: "relative",
          width: `${AV_SIZE + 24}px`,
          height: `${AV_SIZE + 24}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        // Glow
        h("div", {
          position: "absolute",
          width: `${AV_SIZE + 40}px`,
          height: `${AV_SIZE + 40}px`,
          borderRadius: "28px",
          background: `${accentPrimary}12`,
        }),
        // Avatar grid
        h(
          "div",
          {
            position: "relative",
            width: `${AV_SIZE}px`,
            height: `${AV_SIZE}px`,
            borderRadius: "20px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${accentPrimary}25`,
          },
          ...avCells,
        ),
      ),
      // Name + breed stack (vertically centered to avatar)
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flexGrow: 1,
        },
        // Name — hero text
        h(
          "div",
          {
            fontSize: "56px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          },
          displayName,
        ),
        // Breed + framework inline
        ...(p.breed
          ? [
              h(
                "div",
                {
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "2px",
                },
                h(
                  "div",
                  {
                    fontSize: "22px",
                    fontWeight: 700,
                    color: accentPrimary,
                  },
                  p.breed,
                ),
                ...(p.framework
                  ? [
                      h(
                        "div",
                        {
                          fontSize: "15px",
                          color: "rgba(122,139,163,0.45)",
                          padding: "0 0 0 10px",
                          borderLeft: "1px solid rgba(122,139,163,0.15)",
                        },
                        p.framework,
                      ),
                    ]
                  : []),
              ),
            ]
          : []),
        // Breed tagline
        ...(p.breedTagline
          ? [
              h(
                "div",
                {
                  fontSize: "15px",
                  color: "rgba(180,195,215,0.4)",
                  fontStyle: "italic",
                },
                p.breedTagline,
              ),
            ]
          : []),
      ),
      // Status pill — aligned right on same row as name
      h(
        "div",
        {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 20px",
          borderRadius: "99px",
          background: p.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${p.status === "active" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          flexShrink: 0,
        },
        h("div", {
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: p.status === "active" ? "#34d399" : "#f87171",
        }),
        h(
          "div",
          {
            fontSize: "14px",
            fontWeight: 600,
            color: p.status === "active" ? "#34d399" : "#f87171",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
          p.status === "active" ? "Active" : p.status,
        ),
      ),
    ),

    // ── Row 2: Description ──
    h(
      "div",
      {
        fontSize: "22px",
        color: "rgba(180,195,215,0.65)",
        lineHeight: 1.5,
        marginTop: "28px",
        maxWidth: "900px",
        position: "relative",
        zIndex: 1,
      },
      displayDesc,
    ),

    // ── Row 3: Metadata — pushes down with flex, anchored to bottom ──
    h(
      "div",
      {
        display: "flex",
        gap: "48px",
        alignItems: "flex-end",
        marginTop: "auto",
        position: "relative",
        zIndex: 1,
      },
      // Role
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        },
        h(
          "div",
          {
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(122,139,163,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          },
          "Role",
        ),
        h(
          "div",
          { fontSize: "18px", fontWeight: 600, color: "#e0e7ef" },
          roleLabel,
        ),
      ),
      // Region
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        },
        h(
          "div",
          {
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(122,139,163,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          },
          "Region",
        ),
        h(
          "div",
          { fontSize: "18px", fontWeight: 600, color: "#e0e7ef" },
          p.regions.length ? p.regions.map((r) => r.toUpperCase()).join(", ") : "GLOBAL",
        ),
      ),
      // Created
      ...(p.createdAt
        ? [
            h(
              "div",
              {
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              },
              h(
                "div",
                {
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(122,139,163,0.4)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                },
                "Created",
              ),
              h(
                "div",
                { fontSize: "18px", fontWeight: 600, color: "#e0e7ef" },
                fmtDate(p.createdAt),
              ),
            ),
          ]
        : []),
      // Capability count pill
      ...(p.capabilityCount > 0
        ? [
            h(
              "div",
              {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 16px",
                borderRadius: "99px",
                background: `${accentPrimary}12`,
                border: `1px solid ${accentPrimary}20`,
              },
              h(
                "div",
                {
                  fontSize: "18px",
                  fontWeight: 700,
                  color: accentPrimary,
                },
                String(p.capabilityCount),
              ),
              h(
                "div",
                {
                  fontSize: "14px",
                  fontWeight: 600,
                  color: `${accentPrimary}99`,
                },
                p.capabilityCount === 1 ? "capability" : "capabilities",
              ),
            ),
          ]
        : []),
      // APORT VERIFIED — right-aligned
      h(
        "div",
        {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginLeft: "auto",
        },
        h(
          "div",
          {
            fontSize: "15px",
            fontWeight: 700,
            color: accentPrimary,
            letterSpacing: "0.04em",
          },
          "◆  APORT VERIFIED",
        ),
      ),
    ),

    // ── Row 4: Passport URL — bottom right, subtle ──
    h(
      "div",
      {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "16px",
        position: "relative",
        zIndex: 1,
      },
      h(
        "div",
        {
          fontSize: "14px",
          color: "rgba(122,139,163,0.35)",
        },
        `aport.id/passport/${p.slug}`,
      ),
    ),
  );
}

// ─── Handler ────────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const cors = getCorsHeaders(request);
  const idOrSlug = params.id as string;
  if (!idOrSlug) return new Response("Not found", { status: 404 });

  // Edge cache (production only)
  const isDev = new URL(request.url).hostname === "localhost";
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });
  if (!isDev) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  // Fetch passport (resolves slug or agent_id)
  const aport = createAPortService(env);
  let p: Record<string, unknown>;
  try {
    const r = await aport.resolvePassport(idOrSlug, "json");
    if (!r.success || !r.data) return new Response("Not found", { status: 404 });
    p = r.data as Record<string, unknown>;
  } catch {
    return new Response("API error", { status: 502 });
  }

  await loadFonts();

  const name = (p.name as string) || "Agent";
  const role = (p.role as string) || "agent";
  const desc = (p.description as string) || "";
  const frameworks = (p.framework as string[]) || [];
  const regions = (p.regions as string[]) || [];
  const createdAt = (p.created_at as string) || "";
  const status = (p.status as string) || "active";
  const claimed = (p.claimed as boolean) || false;
  const agId = (p.agent_id as string) || idOrSlug;
  const slug = (p.slug as string) || idOrSlug;
  const breed = frameworks[0] ? BREEDS[frameworks[0]] || null : null;
  const breedTagline = breed ? (BREED_TAGLINES[breed] || null) : null;
  const capabilities = (p.capabilities as unknown[]) || [];

  try {
    const tree = buildCard({
      name, role, desc, breed, breedTagline,
      framework: frameworks[0] || null,
      status, claimed,
      agentId: agId, slug, regions, createdAt,
      capabilityCount: capabilities.length,
    });

    const imgResponse = new ImageResponse(tree as unknown as React.ReactElement, {
      width: 1200,
      height: 628,
      fonts: [
        { name: "Inter", data: fontRegular!, weight: 400, style: "normal" as const },
        { name: "Inter", data: fontBold!, weight: 700, style: "normal" as const },
      ],
    });

    const body = await imgResponse.arrayBuffer();
    const contentType = imgResponse.headers.get("content-type") || "image/png";

    const response = new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...cors,
      },
    });

    if (!isDev) {
      context.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[og] render error:", msg);
    return new Response(`Failed to generate image: ${msg}`, { status: 500 });
  }
};
