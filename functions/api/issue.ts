/**
 * Passport issuance proxy
 * POST /api/issue
 *
 * Accepts form fields from the creation form, maps to APort API schema,
 * and proxies via APortService. Keeps APORT_API_KEY server-side.
 *
 * See PRD E3: Pages Function: Issue Proxy
 */
import type { AppEnv } from "../lib/types";
import { getCorsHeaders, handleCorsPreflightRequest } from "../lib/cors";
import { jsonResponse, errorResponse } from "../lib/response";
import { createAPortService } from "../lib/services/aport";
import { DEFAULT_CAPABILITIES, DEFAULT_LIMITS } from "../lib/default-capabilities";
import { slugify } from "../lib/slug";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";

interface DeliverableConfig {
  require_summary?: boolean;
  min_summary_words?: number;
  require_tests_passing?: boolean;
  require_different_reviewer?: boolean;
  scan_output?: boolean;
  blocked_patterns?: string[];
  acceptance_criteria?: string[];
}

interface IssueRequest {
  name: string;
  slug?: string;
  description: string;
  role: "agent" | "assistant" | "tool" | "service";
  email: string;
  framework?: string[];
  regions?: string[];
  links?: {
    homepage?: string;
    repo?: string;
    docs?: string;
  };
  showInGallery?: boolean;
  deliverable?: DeliverableConfig;
}

export const onRequestOptions: PagesFunction<AppEnv> = async (context) => {
  const res = handleCorsPreflightRequest(context.request);
  return res || new Response(null, { status: 204 });
};

export const onRequestPost: PagesFunction<AppEnv> = async (context) => {
  const { env, request } = context;
  const cors = getCorsHeaders(request);

  // Rate limit: 10 requests/hour per IP (PRD E3)
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(env.APORT_ID_KV, ip);
  if (!rateLimit.allowed) {
    const retryAfterSecs = Math.ceil(
      Math.max(0, rateLimit.resetAt - Date.now()) / 1000,
    );
    return errorResponse("Too many requests. Please try again later.", 429, {
      ...cors,
      "Retry-After": String(retryAfterSecs),
    });
  }

  // Validate env
  if (!env.APORT_API_KEY || !env.APORT_ORG_ID) {
    return errorResponse(
      "Server misconfigured: missing APort credentials",
      500,
      cors,
    );
  }

  // Parse body
  let body: IssueRequest;
  try {
    body = (await request.json()) as IssueRequest;
  } catch {
    return errorResponse("Invalid JSON body", 400, cors);
  }

  // Validate required fields
  if (!body.name || body.name.length < 1 || body.name.length > 100) {
    return errorResponse(
      "Agent name is required (1-100 characters)",
      400,
      cors,
    );
  }
  if (
    !body.description ||
    body.description.length < 10 ||
    body.description.length > 1000
  ) {
    return errorResponse(
      "Description is required (10-1000 characters)",
      400,
      cors,
    );
  }
  if (!body.email || !body.email.includes("@")) {
    return errorResponse("Valid email is required", 400, cors);
  }

  const role = body.role || "agent";
  const regions = body.regions?.length ? body.regions : ["global"];
  const slug = body.slug || slugify(body.name);
  const aport = createAPortService(env);

  // Build capabilities and limits, optionally including deliverable enforcement
  const capabilities = [...DEFAULT_CAPABILITIES];
  const limits: Record<string, any> = { ...DEFAULT_LIMITS };

  if (body.deliverable) {
    const d = body.deliverable;
    const deliverableParams: Record<string, any> = {
      require_summary: d.require_summary ?? false,
      min_summary_words: d.min_summary_words ?? 20,
      require_tests_passing: d.require_tests_passing ?? false,
      require_different_reviewer: d.require_different_reviewer ?? false,
      scan_output: d.scan_output ?? false,
      blocked_patterns: d.scan_output ? (d.blocked_patterns ?? []) : [],
      acceptance_criteria: (d.acceptance_criteria ?? []).map(
        (text: string) => ({
          id: slugify(text),
          description: text,
        }),
      ),
    };

    capabilities.push({
      id: "deliverable.task.complete",
      params: deliverableParams,
    });

    limits["deliverable.task.complete"] = deliverableParams;
  }

  try {
    const result = await aport.createBuilderPassport({
      builderId: `aportid_${Date.now()}`,
      email: body.email,
      displayName: body.name,
      kycCompleted: false,
      verificationProof: {
        verification_id: `ver_aportid_${Date.now()}`,
        verified_at: new Date().toISOString(),
      },
      metadata: {
        provider: "aport-id",
        role,
        framework: body.framework || [],
        links: body.links || {},
        description: body.description,
        regions,
      },
      regions,
      sendClaimEmail: true,
      capabilities,
      limits,
      slug,
    });

    if (!result.success || !result.data) {
      const status = result.error?.status;
      const mappedStatus = status === 409 ? 409 : status === 429 ? 429 : 502;
      return errorResponse(
        result.error?.message || "Failed to issue passport",
        mappedStatus,
        cors,
      );
    }

    const agentId = result.data.passportId;
    const passportSlug = result.data.slug || slug;

    if (!agentId) {
      return errorResponse("No passport ID returned from APort", 502, cors);
    }

    // Store in gallery KV if opted in
    if (body.showInGallery !== false && env.APORT_ID_KV) {
      try {
        const galleryEntry = JSON.stringify({
          agent_id: agentId,
          slug: passportSlug,
          name: body.name,
          role,
          framework: body.framework || [],
          regions,
          created_at: new Date().toISOString(),
        });
        await env.APORT_ID_KV.put(`gallery:${agentId}`, galleryEntry);

        // Update gallery index (prepend to list)
        const indexRaw = await env.APORT_ID_KV.get("gallery:index");
        const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
        index.unshift(agentId);
        await env.APORT_ID_KV.put("gallery:index", JSON.stringify(index.slice(0, 1000)));

        // Increment count
        const countRaw = await env.APORT_ID_KV.get("stats:count");
        const count = countRaw ? parseInt(countRaw, 10) + 1 : 1;
        await env.APORT_ID_KV.put("stats:count", String(count));
      } catch {
        // Gallery storage is best-effort
      }
    }

    return jsonResponse(
      {
        ok: true,
        agent_id: agentId,
        slug: passportSlug,
        claimed: result.data.claimed ?? false,
        passport_url: `https://aport.id/passport/${passportSlug}`,
        claim_email_sent: true,
      },
      201,
      cors,
    );
  } catch (error) {
    console.error("[issue] APort API error:", error);
    return errorResponse("Failed to reach APort API", 502, cors);
  }
};
