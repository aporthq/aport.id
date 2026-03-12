/**
 * Health check endpoint
 * GET /api/health
 */
import type { AppEnv } from '../../lib/types';
import { jsonResponse } from '../../lib/response';

export const onRequestGet: PagesFunction<AppEnv> = async () => {
  return jsonResponse({
    ok: true,
    service: 'aport-id',
    timestamp: new Date().toISOString(),
  });
};
