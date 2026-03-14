/**
 * Passport retrieval proxy
 * GET /api/passport/:id
 *
 * Fetches passport data from APort API via APortService.
 * Supports ?format=json|vc|vp query param.
 */
import type { AppEnv } from '../../lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from '../../lib/cors';
import { jsonResponse, errorResponse } from '../../lib/response';
import { createAPortService } from '../../lib/services/aport';

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const cors = getCorsHeaders(request);
  const idOrSlug = params.id as string;

  if (!idOrSlug) {
    return errorResponse('Passport ID or slug is required', 400, cors);
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'json') as 'json' | 'vc' | 'vp';

  const aport = createAPortService(env);

  try {
    const result = await aport.resolvePassport(idOrSlug, format);

    if (!result.success) {
      const status = result.error?.status || 502;
      return errorResponse(
        result.error?.message || 'Failed to fetch passport',
        status,
        cors,
      );
    }

    return jsonResponse(result.data, 200, {
      ...cors,
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    });
  } catch (error) {
    console.error('[passport] APort API error:', error);
    return errorResponse('Failed to reach APort API', 502, cors);
  }
};
