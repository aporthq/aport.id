/**
 * /skill.md → /skill redirect
 */
import type { AppEnv } from './lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from './lib/cors';

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const cors = getCorsHeaders(context.request);
  const url = new URL(context.request.url);
  url.pathname = '/skill';

  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString(),
      ...cors,
    },
  });
};
