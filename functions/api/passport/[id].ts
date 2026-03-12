/**
 * Passport retrieval proxy
 * GET /api/passport/:id
 *
 * Fetches passport data from APort API by agent_id.
 * Proxied so the API key stays server-side.
 */
import type { AppEnv } from '../../lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from '../../lib/cors';
import { jsonResponse, errorResponse } from '../../lib/response';

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const cors = getCorsHeaders(request);
  const agentId = params.id as string;

  if (!agentId) {
    return errorResponse('Passport ID is required', 400, cors);
  }

  try {
    const baseUrl = env.APORT_BASE_URL || 'https://api.aport.io';
    const response = await fetch(`${baseUrl}/api/passports/${agentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(env.APORT_API_KEY && { 'Authorization': `Bearer ${env.APORT_API_KEY}` }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return errorResponse('Passport not found', 404, cors);
      }
      return errorResponse(`APort API returned ${response.status}`, 502, cors);
    }

    const data = await response.json();
    return jsonResponse(data, 200, {
      ...cors,
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    });
  } catch (error) {
    console.error('[passport] APort API error:', error);
    return errorResponse('Failed to reach APort API', 502, cors);
  }
};
