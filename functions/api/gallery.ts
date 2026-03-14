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
import { checkRateLimit, getClientIp } from "../lib/rate-limit";
import { verifyRequestToken } from "../lib/request-token";

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request } = context;
  const cors = getCorsHeaders(request);

  // Rate limit: 10 req/min per IP — normal browsing is ~2-3 req/min
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(env.APORT_ID_KV, ip, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    const retryAfterSecs = Math.ceil(
      Math.max(0, rateLimit.resetAt - Date.now()) / 1000,
    );
    return errorResponse("Too many requests. Please try again later.", 429, {
      ...cors,
      "Retry-After": String(retryAfterSecs),
    });
  }

  // Layer 1: Origin check — blocks cross-origin browser requests
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const allowedHosts = ["aport.id", "localhost", "127.0.0.1"];
  const originAllowed = allowedHosts.some(
    (host) => origin.includes(host) || referer.includes(host),
  );
  if (!originAllowed) {
    return errorResponse("Forbidden", 403, cors);
  }

  // Layer 2: Time-rotating token — blocks replayed/scripted requests
  const token = request.headers.get("x-ag-token") || "";
  const tokenValid = await verifyRequestToken(token);
  if (!tokenValid) {
    return errorResponse("Forbidden", 403, cors);
  }

  if (!env.APORT_API_KEY || !env.APORT_ORG_ID) {
    return errorResponse("Server misconfigured", 500, cors);
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);
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

    // Strip agent_id from gallery listing — use slug for navigation
    const safePassports = result.passports.map(({ agent_id, ...rest }) => rest);

    return jsonResponse(
      {
        ok: true,
        passports: safePassports,
        total: result.total,
        hasMore: result.hasMore,
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
