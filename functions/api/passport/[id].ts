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
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';

/**
 * Obfuscate an email address: "uchi.uchibeke@gmail.com" → "u*************@gmail.com"
 */
function obfuscateEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

/**
 * Strip or obfuscate sensitive fields from passport data before returning to client.
 * Walks the response recursively to catch nested email fields.
 */
function sanitizePassportData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizePassportData);
  }

  const sanitized = { ...data };

  // Obfuscate known email fields
  if (typeof sanitized.contact === 'string' && sanitized.contact.includes('@')) {
    sanitized.contact = obfuscateEmail(sanitized.contact);
  }

  // Obfuscate pending_owner email
  if (sanitized.pending_owner && typeof sanitized.pending_owner === 'object') {
    sanitized.pending_owner = { ...sanitized.pending_owner };
    if (typeof sanitized.pending_owner.email === 'string') {
      sanitized.pending_owner.email = obfuscateEmail(sanitized.pending_owner.email);
    }
  }

  // Obfuscate owner email if present
  if (sanitized.owner && typeof sanitized.owner === 'object') {
    sanitized.owner = { ...sanitized.owner };
    if (typeof sanitized.owner.email === 'string') {
      sanitized.owner.email = obfuscateEmail(sanitized.owner.email);
    }
  }

  // Recurse into nested passport/data objects
  if (sanitized.passport && typeof sanitized.passport === 'object') {
    sanitized.passport = sanitizePassportData(sanitized.passport);
  }
  if (sanitized.data && typeof sanitized.data === 'object') {
    sanitized.data = sanitizePassportData(sanitized.data);
  }

  return sanitized;
}

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const { env, request, params } = context;
  const cors = getCorsHeaders(request);

  // Rate limit: 20 req/min per IP — normal browsing is a few passports/min
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(env.APORT_ID_KV, ip, {
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    const retryAfterSecs = Math.ceil(
      Math.max(0, rateLimit.resetAt - Date.now()) / 1000,
    );
    return errorResponse('Too many requests. Please try again later.', 429, {
      ...cors,
      'Retry-After': String(retryAfterSecs),
    });
  }

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

    const sanitized = sanitizePassportData(result.data);

    return jsonResponse(sanitized, 200, {
      ...cors,
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    });
  } catch (error) {
    console.error('[passport] APort API error:', error);
    return errorResponse('Failed to reach APort API', 502, cors);
  }
};
