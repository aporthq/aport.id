/**
 * Client-side gallery service
 *
 * Fetches gallery data from /api/gallery endpoint.
 * Used by the gallery page components.
 */

import { apiConfig } from "@/lib/config/api";

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
}

export interface GalleryResponse {
  ok: boolean;
  passports: GalleryPassport[];
  total: number;
  hasMore: boolean;
}

export async function fetchGallery(
  query: GalleryQuery = {},
): Promise<GalleryResponse> {
  const params = new URLSearchParams();

  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  if (query.role && query.role !== "all") params.set("role", query.role);
  if (query.region && query.region !== "all") params.set("region", query.region);
  if (query.search) params.set("search", query.search);

  const qs = params.toString();
  const url = `${apiConfig.endpoints.gallery}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url);

  if (!res.ok) {
    return { ok: false, passports: [], total: 0, hasMore: false };
  }

  return res.json() as Promise<GalleryResponse>;
}
