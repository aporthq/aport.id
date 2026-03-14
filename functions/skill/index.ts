/**
 * /skill — serves the canonical SKILL.md from GitHub
 */
import type { AppEnv } from '../lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from '../lib/cors';

const SKILL_SOURCE_URL =
  'https://raw.githubusercontent.com/aporthq/aport-skills/main/aport-id/SKILL.md';

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const cors = getCorsHeaders(context.request);

  const res = await fetch(SKILL_SOURCE_URL, {
    headers: { 'User-Agent': 'aport-id/1.0' },
    cf: { cacheTtl: 3600, cacheEverything: true } as RequestInitCfProperties,
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      ...cors,
    },
  });
};
