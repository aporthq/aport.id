/**
 * OG Image Generator — PRD E4
 * GET /api/passport/:id/og.png
 *
 * Renders a 1200×628 passport card as PNG via @cloudflare/pages-plugin-vercel-og.
 * Uses satori element objects (no JSX needed).
 * Cached for 24 hours on Cloudflare edge.
 */
import type { AppEnv } from "../../../lib/types";
import { getCorsHeaders } from "../../../lib/cors";
import { createAPortService } from "../../../lib/services/aport";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";

import { BREEDS } from "../../../lib/breeds";

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function truncId(id: string): string {
  return id.length <= 16 ? id : `${id.slice(0, 8)}...${id.slice(-6)}`;
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
  // Satori requires display:flex for multiple children
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

// ─── Build card tree ────────────────────────────────────────────────────────

function buildCard(p: {
  name: string;
  role: string;
  desc: string;
  breed: string | null;
  status: string;
  claimed: boolean;
  agentId: string;
  slug: string;
  regions: string[];
  createdAt: string;
}): El {
  const CELL = 14;
  const PAD = CELL;
  const AV = CELL * 5 + PAD * 2;
  const rects = avatarRects(p.agentId);

  // Avatar cells
  const avCells: El[] = [];
  for (let i = 0; i < 25; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const rect = rects.find((r) => r.x === col && r.y === row);
    avCells.push(
      h("div", {
        width: `${CELL}px`,
        height: `${CELL}px`,
        borderRadius: "2px",
        background: rect ? rect.color : "transparent",
      }),
    );
  }

  const statusBadge = h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      borderRadius: "99px",
      padding: "6px 14px",
      fontSize: "14px",
      background: p.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
      color: p.status === "active" ? "#34d399" : "#f87171",
      border: `1px solid ${p.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
    },
    p.status,
  );

  const claimBadge = h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      borderRadius: "99px",
      padding: "6px 14px",
      fontSize: "14px",
      background: p.claimed ? "rgba(34,211,238,0.1)" : "rgba(245,158,11,0.1)",
      color: p.claimed ? "#22d3ee" : "#fbbf24",
      border: `1px solid ${p.claimed ? "rgba(34,211,238,0.15)" : "rgba(245,158,11,0.15)"}`,
    },
    p.claimed ? "Claimed" : "Unclaimed",
  );

  const nameEl = h(
    "div",
    { fontSize: "42px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 },
    p.name.length > 24 ? p.name.slice(0, 22) + "..." : p.name,
  );

  const nameBreedChildren: (El | string)[] = [nameEl];
  if (p.breed) {
    nameBreedChildren.push(
      h("div", { fontSize: "18px", color: "#22d3ee", marginTop: "4px" }, p.breed),
    );
  }

  // Field column helper
  const field = (label: string, value: string) =>
    h(
      "div",
      { display: "flex", flexDirection: "column", gap: "4px" },
      h("div", { fontSize: "11px", color: "rgba(122,139,163,0.5)", letterSpacing: "0.08em" }, label),
      h("div", { fontSize: "15px", color: "#e8ecf1" }, value),
    );

  return h(
    "div",
    {
      width: "1200px",
      height: "628px",
      display: "flex",
      flexDirection: "column",
      background: "#06090f",
      padding: "48px 56px",
      fontFamily: "Inter",
      color: "#e8ecf1",
      position: "relative",
    },
    // Ambient glow
    h("div", {
      position: "absolute",
      top: "-100px",
      right: "0px",
      width: "400px",
      height: "400px",
      borderRadius: "50%",
      background: "rgba(6,182,212,0.08)",
    }),
    // Card
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        background: "rgba(255,255,255,0.03)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "40px 48px",
        position: "relative",
        overflow: "hidden",
      },
      // Top edge highlight
      h("div", {
        position: "absolute",
        top: "0",
        left: "100px",
        width: "880px",
        height: "1px",
        background: "rgba(255,255,255,0.1)",
      }),
      // Header row
      h(
        "div",
        { display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "16px" },
        // Avatar
        h(
          "div",
          {
            width: `${AV}px`,
            height: `${AV}px`,
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            flexWrap: "wrap",
            alignContent: "flex-start",
            padding: `${PAD}px`,
            gap: "0px",
            flexShrink: 0,
          },
          ...avCells,
        ),
        // Name + breed
        h(
          "div",
          { display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 },
          ...nameBreedChildren,
        ),
        // Badges
        h("div", { display: "flex", gap: "8px", flexShrink: 0 }, statusBadge, claimBadge),
      ),
      // Role + description
      h(
        "div",
        { display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "24px" },
        h(
          "div",
          {
            fontSize: "13px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "6px",
            padding: "3px 10px",
            color: "#7a8ba3",
            flexShrink: 0,
          },
          p.role.charAt(0).toUpperCase() + p.role.slice(1),
        ),
        h(
          "div",
          { fontSize: "15px", color: "#7a8ba3", lineHeight: 1.5 },
          p.desc.length > 120 ? p.desc.slice(0, 117) + "..." : p.desc,
        ),
      ),
      // Divider
      h("div", { height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "24px" }),
      // Fields
      h(
        "div",
        { display: "flex", gap: "40px", flexGrow: 1 },
        field("BORN", p.createdAt ? fmtDate(p.createdAt) : "—"),
        field("REGIONS", p.regions.length ? p.regions.map((r) => r.toUpperCase()).join(", ") : "Global"),
        field("AGENT ID", truncId(p.agentId)),
      ),
      // Footer
      h(
        "div",
        {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "auto",
          paddingTop: "20px",
        },
        // APort Verified stamp
        h(
          "div",
          {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "10px",
            border: "1px solid rgba(34,211,238,0.2)",
            background: "rgba(34,211,238,0.06)",
            padding: "8px 16px",
          },
          h(
            "div",
            { fontSize: "13px", fontWeight: 700, color: "#22d3ee", letterSpacing: "0.05em" },
            "APORT VERIFIED",
          ),
        ),
        // URL
        h(
          "div",
          { fontSize: "14px", color: "rgba(122,139,163,0.5)" },
          `aport.id/passport/${p.slug}`,
        ),
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

  try {
    const tree = buildCard({
      name, role, desc, breed, status, claimed,
      agentId: agId, slug, regions, createdAt,
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
