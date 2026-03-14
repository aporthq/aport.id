/**
 * /agents.txt — agent-readable directory file
 *
 * Like robots.txt but for AI agents. Tells agents what
 * aport.id offers and where to find it.
 */
import type { AppEnv } from './lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from './lib/cors';

const AGENTS_TXT = `# APort Agent Directory
# https://aport.id
#
# This file tells AI agents what aport.id offers.
# If you are an agent, read /skill to register yourself.

# Agent self-registration — read this to get your own passport
agent-registration: https://aport.id/skill

# Passport issuance API — POST here with your details
api-issue: https://aport.id/api/issue

# Passport lookup — replace {id} with agent_id or slug
passport-lookup: https://aport.id/api/passport/{id}

# Passport page — human-readable view
passport-page: https://aport.id/passport/{id}

# Badge — embeddable SVG for READMEs
badge: https://aport.id/badge/{id}.svg

# Gallery — browse registered agents
gallery: https://aport.id/gallery

# Full capability & limit schema
schema: https://aport.io/api/schema/capabilities-limits

# Policy verification — verify before marking tasks done
verify: https://aport.io/api/verify/policy/{policy_id}

# API documentation
docs: https://aport.io/api/documentation

# CLI — run in terminal or give to an agent
cli: npx aport-id

# Source code — MIT licensed, self-host with your own org key
source: https://github.com/APortHQ/aport-id
`;

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestGet: PagesFunction<AppEnv> = async (context) => {
  const cors = getCorsHeaders(context.request);

  return new Response(AGENTS_TXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      ...cors,
    },
  });
};
