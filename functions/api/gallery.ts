/**
 * Gallery API endpoint
 * GET /api/gallery
 *
 * Returns gallery-eligible passports from APort API.
 * Supports pagination, role/region/search filtering.
 *
 * See PRD E6: Public Gallery
 */
import type { AppEnv } from "../lib/types";
import { getCorsHeaders, handleCorsPreflightRequest } from "../lib/cors";
import { jsonResponse, errorResponse } from "../lib/response";
import { fetchGalleryPassports } from "../lib/gallery";

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request } = context;
  const cors = getCorsHeaders(request);

  if (!env.APORT_API_KEY || !env.APORT_ORG_ID) {
    return errorResponse("Server misconfigured", 500, cors);
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const role = url.searchParams.get("role") || undefined;
  const region = url.searchParams.get("region") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || "active";

  try {
    const result = await fetchGalleryPassports(env, {
      limit,
      offset,
      role,
      region,
      search,
      status,
    });

    return jsonResponse(
      {
        ok: true,
        ...result,
      },
      200,
      {
        ...cors,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    );
  } catch (error) {
    console.error("[gallery] Error:", error);
    return errorResponse("Failed to fetch gallery", 502, cors);
  }
};
