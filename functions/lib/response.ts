/**
 * Standardized JSON response helpers
 */

export function jsonResponse(data: any, status: number = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function errorResponse(message: string, status: number = 400, headers: Record<string, string> = {}): Response {
  return jsonResponse({ ok: false, error: message }, status, headers);
}

export function successResponse(data: any, headers: Record<string, string> = {}): Response {
  return jsonResponse({ ok: true, ...data }, 200, headers);
}
