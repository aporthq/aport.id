/**
 * Gallery service — fetches passports from APort API
 *
 * Retrieves passports issued by the aport.id org using the
 * issued_by filter. Designed to be extended with curation,
 * featuring, and custom lists later.
 */

import type { AppEnv } from "./types";

export interface GalleryPassport {
  agent_id: string;
  slug: string;
  name: string;
  description: string;
  role: string;
  status: string;
  claimed: boolean;
  framework: string[];
  regions: string[];
  capabilities: { id: string }[];
  created_at: string;
  assurance_level: string;
}

export interface GalleryQuery {
  limit?: number;
  offset?: number;
  role?: string;
  region?: string;
  search?: string;
  status?: string;
}

export interface GalleryResult {
  passports: GalleryPassport[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch gallery passports from APort API.
 *
 * Calls GET /api/passports/list?issued_by={orgId} to get all
 * passports issued by the aport.id organization, regardless of
 * current owner. Applies role/region/search filters client-side.
 *
 * This is the single source for gallery data — extend here
 * to add curation, featuring, or custom lists.
 */
export async function fetchGalleryPassports(
  env: AppEnv,
  query: GalleryQuery = {},
): Promise<GalleryResult> {
  const {
    limit = 20,
    offset = 0,
    role,
    region,
    search,
    status = "active",
  } = query;

  const orgId = env.APORT_ORG_ID;

  // Fetch a larger batch to allow for client-side role/region/search filtering
  const fetchLimit = Math.min(limit + offset + 50, 200);

  const baseUrl = env.NEXT_PUBLIC_APORT_BASE_URL || "https://api.aport.io";
  const params = new URLSearchParams({
    issued_by: orgId,
    limit: String(fetchLimit),
    offset: "0",
    status,
  });

  const response = await fetch(`${baseUrl}/api/passports/list?${params}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.APORT_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(
      "[gallery] APort API error:",
      response.status,
      await response.text().catch(() => ""),
    );
    return { passports: [], total: 0, hasMore: false };
  }

  const data = (await response.json()) as {
    success?: boolean;
    passports?: any[];
    total?: number;
  };

  let filtered: any[] = data.passports || [];

  // Apply role filter
  if (role && role !== "all") {
    filtered = filtered.filter((p: any) => p.role === role);
  }

  // Apply region filter
  if (region && region !== "all") {
    filtered = filtered.filter((p: any) => {
      const regions: string[] = p.regions || [];
      return regions.some(
        (r) => r.toLowerCase() === region.toLowerCase() || r === "global",
      );
    });
  }

  // Apply search filter (name or description)
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p: any) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.slug || "").toLowerCase().includes(q),
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  const passports: GalleryPassport[] = paginated.map((p: any) => ({
    agent_id: p.agent_id || "",
    slug: p.slug || "",
    name: p.name || "",
    description: p.description || "",
    role: p.role || "agent",
    status: p.status || "active",
    claimed: p.claimed ?? false,
    framework: p.framework || [],
    regions: p.regions || [],
    capabilities: p.capabilities || [],
    created_at: p.created_at || "",
    assurance_level: p.assurance_level || "L0",
  }));

  return {
    passports,
    total,
    hasMore: offset + limit < total,
  };
}
