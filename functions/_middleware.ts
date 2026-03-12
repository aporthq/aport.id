/**
 * Global middleware for all Cloudflare Pages Functions
 * Applies security headers to all API responses
 *
 * NOTE: CORS is handled by individual endpoints, not here.
 * Each endpoint uses cors() or publicCors() from lib/cors.ts
 */

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();

  // Apply security headers only (NOT CORS - that's per-endpoint)
  const headers = new Headers(response.headers);

  // Only set security headers if they're not already set
  // Use .set() with caution - it overwrites existing headers
  if (!headers.has("permissions-policy")) {
    headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  }

  // DO NOT set CORS headers here - they're handled by individual endpoints
  // This prevents conflicts with endpoint-specific CORS configurations

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
