/**
 * README Badge endpoint — PRD E8
 * GET /badge/:id.svg
 *
 * Returns a branded SVG badge: "APort Verified · [Agent Name]"
 * Color reflects status (active = accent cyan, claimed = green tint).
 * Links to the passport page on aport.id.
 */
import type { AppEnv } from '../lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from '../lib/cors';
import { createAPortService } from '../lib/services/aport';

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const cors = getCorsHeaders(request);

  // Strip .svg extension if present
  const raw = params.id as string;
  const idOrSlug = raw?.replace(/\.svg$/, '');

  if (!idOrSlug) {
    return new Response(
      JSON.stringify({ error: 'Badge ID or slug is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }

  const aport = createAPortService(env);

  try {
    const result = await aport.resolvePassport(idOrSlug);

    if (!result.success || !result.data) {
      return new Response(generateNotFoundBadge(), {
        status: 200, // Still return 200 so img tags render
        headers: svgHeaders(cors),
      });
    }

    const passport = result.data;
    const svg = generateBadge(passport);

    return new Response(svg, {
      status: 200,
      headers: {
        ...svgHeaders(cors),
        'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[badge] Error:', error);
    return new Response(generateNotFoundBadge(), {
      status: 200,
      headers: svgHeaders(cors),
    });
  }
};

function svgHeaders(cors: Record<string, string>) {
  return {
    'Content-Type': 'image/svg+xml',
    ...cors,
  };
}

// ─── Badge generator ─────────────────────────────────────────────────────────

interface BadgePassport {
  agent_id: string;
  name: string;
  status: string;
  claimed: boolean;
  slug?: string;
}

function generateBadge(passport: BadgePassport): string {
  const isActive = passport.status === 'active';
  const slugOrId = passport.slug || passport.agent_id;
  const passportUrl = `https://aport.id/passport/${slugOrId}`;

  // Vibrant brand colors
  const labelBg = isActive ? '#06b6d4' : '#6b7280';
  const valueBg = isActive ? '#0e7490' : '#4b5563';

  const labelText = 'APort';
  const valueText = truncate(passport.name, 24);

  const iconSpace = 18;
  const pad = 10;
  const fontSize = 11;
  const height = 22;
  const radius = 4;
  const textY = height / 2 + 4; // baseline alignment for 11px font

  const labelTextWidth = measureText(labelText);
  const valueTextWidth = measureText(valueText);
  const labelWidth = iconSpace + labelTextWidth + pad * 2;
  const valueWidth = valueTextWidth + pad * 2;
  const totalWidth = labelWidth + valueWidth;

  const iconX = pad;
  const labelTextX = iconSpace + pad + labelTextWidth / 2;
  const valueTextX = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="APort Passport: ${escapeXml(passport.name)}">
  <title>APort Passport: ${escapeXml(passport.name)}</title>
  <defs>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".15"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalWidth}" height="${height}" rx="${radius}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="${labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueBg}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${fontSize}">
    <!-- Shield icon -->
    <g transform="translate(${iconX}, ${(height - 12) / 2})">
      <path d="M5.5 0.5L0.5 2.8V5.8C0.5 8.7 2.6 11.3 5.5 12C8.4 11.3 10.5 8.7 10.5 5.8V2.8L5.5 0.5Z" fill="rgba(255,255,255,0.25)" stroke="#fff" stroke-width="0.8"/>
      <path d="M3.5 6L5 7.5L7.5 4.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <!-- Label text -->
    <text x="${labelTextX}" y="${textY}" text-anchor="middle" font-weight="700" letter-spacing="0.3">${escapeXml(labelText)}</text>
    <!-- Value text -->
    <text x="${valueTextX}" y="${textY}" text-anchor="middle" font-weight="400">${escapeXml(valueText)}</text>
  </g>
  <a href="${escapeXml(passportUrl)}" target="_blank">
    <rect width="${totalWidth}" height="${height}" fill="transparent" cursor="pointer"/>
  </a>
</svg>`;
}

function generateNotFoundBadge(): string {
  const labelText = 'APort';
  const valueText = 'not found';

  const iconSpace = 18;
  const pad = 10;
  const fontSize = 11;
  const height = 22;
  const radius = 4;
  const textY = height / 2 + 4;

  const labelTextWidth = measureText(labelText);
  const valueTextWidth = measureText(valueText);
  const labelWidth = iconSpace + labelTextWidth + pad * 2;
  const valueWidth = valueTextWidth + pad * 2;
  const totalWidth = labelWidth + valueWidth;

  const labelTextX = iconSpace + pad + labelTextWidth / 2;
  const valueTextX = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="APort Passport: not found">
  <defs>
    <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#6b7280"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="#4b5563"/>
  </g>
  <g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${fontSize}">
    <text x="${labelTextX}" y="${textY}" text-anchor="middle" font-weight="700" letter-spacing="0.3">${labelText}</text>
    <text x="${valueTextX}" y="${textY}" text-anchor="middle" font-weight="400">${valueText}</text>
  </g>
</svg>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function measureText(text: string): number {
  // Approximate character width for the system font at 11px
  return Math.ceil(text.length * 6.6) + 10;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '\u2026';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
