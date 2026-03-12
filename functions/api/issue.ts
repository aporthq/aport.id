/**
 * Passport issuance proxy
 * POST /api/issue
 *
 * Accepts form fields from the creation form, maps to APort API schema,
 * and proxies the request. Keeps APORT_API_KEY server-side.
 *
 * See PRD E3: Pages Function: Issue Proxy
 */
import type { AppEnv } from '../lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from '../lib/cors';
import { jsonResponse, errorResponse } from '../lib/response';

interface IssueRequest {
  name: string;
  description: string;
  role: 'agent' | 'assistant' | 'tool' | 'service';
  email: string;
  framework?: string[];
  regions?: string[];
  links?: {
    homepage?: string;
    repo?: string;
    docs?: string;
  };
  showInGallery?: boolean;
}

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestPost: PagesFunction<AppEnv> = async (context) => {
  const { env, request } = context;
  const cors = getCorsHeaders(request);

  // Validate env
  if (!env.APORT_API_KEY || !env.APORT_ORG_ID) {
    return errorResponse('Server misconfigured: missing APort credentials', 500, cors);
  }

  // Parse body
  let body: IssueRequest;
  try {
    body = await request.json() as IssueRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400, cors);
  }

  // Validate required fields
  if (!body.name || body.name.length < 1 || body.name.length > 100) {
    return errorResponse('Agent name is required (1-100 characters)', 400, cors);
  }
  if (!body.description || body.description.length < 10 || body.description.length > 1000) {
    return errorResponse('Description is required (10-1000 characters)', 400, cors);
  }
  if (!body.email || !body.email.includes('@')) {
    return errorResponse('Valid email is required', 400, cors);
  }

  const role = body.role || 'agent';
  const regions = body.regions?.length ? body.regions : ['global'];

  // Map to APort API schema
  const passportData = {
    name: body.name,
    role,
    description: body.description,
    regions,
    framework: body.framework || [],
    links: body.links || {},
    contact: body.email,
    pending_owner: {
      email: body.email,
      display_name: body.name,
    },
    send_claim_email: true,
    assurance: {
      type: env.APORT_ASSURANCE_TYPE || 'kyc',
      assurance_level: env.APORT_ASSURANCE_LEVEL || 'L0',
      proof: {
        verification_id: `ver_aportid_${Date.now()}`,
        verified_at: new Date().toISOString(),
      },
    },
    capabilities: [
      { id: 'web.fetch' },
      { id: 'data.file.read' },
      { id: 'data.file.write' },
      { id: 'messaging.send' },
      { id: 'mcp.tool.execute' },
    ],
    limits: {},
    status: 'active',
    metadata: {
      provider: 'aport-id',
      created_at: new Date().toISOString(),
      framework: body.framework || [],
    },
  };

  try {
    const baseUrl = env.APORT_BASE_URL || 'https://api.aport.io';
    const response = await fetch(`${baseUrl}/api/orgs/${env.APORT_ORG_ID}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.APORT_API_KEY}`,
      },
      body: JSON.stringify(passportData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
      return errorResponse(
        errorData.message || `APort API returned ${response.status}`,
        response.status === 409 ? 409 : response.status === 429 ? 429 : 502,
        cors,
      );
    }

    const result = await response.json() as Record<string, unknown>;
    const responseData = (result.data ?? result) as Record<string, unknown>;
    const passport = (responseData.data ?? responseData) as Record<string, unknown>;

    const agentId = String(
      passport.agent_id ||
      responseData.agent_id ||
      passport.id ||
      passport.passport_id ||
      ''
    );

    if (!agentId) {
      return errorResponse('No passport ID returned from APort', 502, cors);
    }

    // Store in gallery KV if opted in
    if (body.showInGallery !== false && env.KV) {
      try {
        const galleryEntry = JSON.stringify({
          agent_id: agentId,
          name: body.name,
          role,
          framework: body.framework || [],
          regions,
          created_at: new Date().toISOString(),
        });
        await env.KV.put(`gallery:${agentId}`, galleryEntry);

        // Update gallery index (prepend to list)
        const indexRaw = await env.KV.get('gallery:index');
        const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
        index.unshift(agentId);
        await env.KV.put('gallery:index', JSON.stringify(index.slice(0, 1000)));

        // Increment count
        const countRaw = await env.KV.get('stats:count');
        const count = countRaw ? parseInt(countRaw, 10) + 1 : 1;
        await env.KV.put('stats:count', String(count));
      } catch {
        // Gallery storage is best-effort
      }
    }

    return jsonResponse({
      ok: true,
      agent_id: agentId,
      claimed: false,
      passport_url: `https://aport.id/passport/${agentId}`,
      claim_email_sent: true,
    }, 201, cors);
  } catch (error) {
    console.error('[issue] APort API error:', error);
    return errorResponse('Failed to reach APort API', 502, cors);
  }
};
