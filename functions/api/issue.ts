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
import {
  DEFAULT_CAPABILITIES,
  DEFAULT_LIMITS,
} from "../lib/default-capabilities";
import { slugify } from "../lib/slug";
import {
  resolveCapabilities,
  resolveLimits,
  upsertCapability,
  type Capability,
} from "../lib/oap";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";

/**
 * The capability the `deliverable` block configures. Named once, because both
 * the capability entry and its limits key must stay the same string and the
 * passport page looks it up by that string.
 */
const DELIVERABLE_CAPABILITY = "deliverable.task.complete";

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
  name?: string;
  slug?: string;
  description?: string;
  role?: string;
  email: string;
  framework?: string[];
  regions?: string[];
  links?: {
    homepage?: string;
    repo?: string;
    docs?: string;
    x?: string;
  };
  showInGallery?: boolean;
  deliverable?: DeliverableConfig;
  /**
   * Optional customization, applied over the framework preset.
   *
   * Omit both and nothing changes: the preset is what makes a passport useful
   * on day one, and that remains the default path.
   *
   * `capabilities` selects the set to grant, so a caller can narrow ("read but
   * never write") as well as widen. Each entry keeps the preset's params, with
   * the caller's deep-merged over them.
   *
   * `limits` deep-merges over the preset's, so changing
   * `payments.charge.currency_limits.USD.max_per_tx` leaves the daily cap, the
   * other currencies and every other limit exactly as the preset set them.
   *
   * Semantics live in functions/lib/oap.ts, which is driven by the policy packs
   * in spec/aport-policies. Nothing about either shape is defined here.
   */
  capabilities?: Capability[];
  limits?: Record<string, any>;
}

/**
 * There is no framework allowlist here, deliberately.
 *
 * There was one, and it was a hardcoded copy of the key set of
 * `/api/public/framework-passport-presets` — the endpoint this handler already
 * calls, two lines below the gate. A local cache of a remote list, checked
 * immediately before asking the remote. It drifted, as that shape always does,
 * and started refusing `github`, `langgraph`, `vercel-ai-sdk`, `autogen` and
 * `Custom`: five presets that exist and work, silently downgraded to generic
 * defaults because a constant in this file had not been updated.
 *
 * The lookup is the authority. A framework with a preset gets it; one without
 * falls through to the defaults, which is the same outcome the allowlist
 * produced for an unknown value, minus the maintenance and minus the drift.
 *
 * What still guards the value: `sanitizeFrameworks` bounds its length, charset
 * and count, and the narrower `/^[A-Za-z0-9-]+$/` below runs before it is put
 * in a URL path. Those are the checks that matter — the allowlist was never
 * what made this safe.
 */
const MAX_FRAMEWORKS = 8;
const MAX_FRAMEWORK_ID_LEN = 64;
const FRAMEWORK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

/**
 * Validate the caller-supplied `links` before it is minted into passport
 * metadata and rendered on a public passport page.
 *
 * `x` carries an X handle. It is stored as a bare handle, never as a URL, so a
 * caller cannot point it at an arbitrary destination. Web links must be http(s)
 * and are length-bounded; anything else is dropped rather than rejected, so one
 * malformed field does not fail an otherwise valid mint.
 */
const MAX_LINK_LEN = 300;

function sanitizeWebLink(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LINK_LEN) return undefined;
  try {
    const url = new URL(trimmed);
    // Blocks javascript:, data: and every other scheme.
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function sanitizeXHandle(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  // Accept "@name", "name", or a profile URL, and store the bare handle.
  const raw = value
    .trim()
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
  const handle = raw.replace(/^@/, "").split(/[/?#]/)[0];
  // X handles are 1-15 characters of [A-Za-z0-9_].
  return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? handle : undefined;
}

export function sanitizeLinks(
  links: IssueRequest["links"],
): NonNullable<IssueRequest["links"]> {
  if (!links || typeof links !== "object") return {};
  const out: NonNullable<IssueRequest["links"]> = {};
  const homepage = sanitizeWebLink(links.homepage);
  const repo = sanitizeWebLink(links.repo);
  const docs = sanitizeWebLink(links.docs);
  const x = sanitizeXHandle(links.x);
  if (homepage) out.homepage = homepage;
  if (repo) out.repo = repo;
  if (docs) out.docs = docs;
  if (x) out.x = x;
  return out;
}

function sanitizeFrameworks(frameworks: unknown): string[] {
  if (!Array.isArray(frameworks)) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  for (const framework of frameworks) {
    if (typeof framework !== "string") continue;
    const trimmed = framework.trim();
    if (
      !trimmed ||
      trimmed.length > MAX_FRAMEWORK_ID_LEN ||
      !FRAMEWORK_ID_PATTERN.test(trimmed) ||
      seen.has(trimmed)
    ) {
      continue;
    }

    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= MAX_FRAMEWORKS) break;
  }

  return out;
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

  const aport = createAPortService(env);
  const requestedFrameworks = sanitizeFrameworks(body.framework);
  const requestedFramework = requestedFrameworks[0];
  let frameworkPreset = null as
    Awaited<ReturnType<typeof aport.getFrameworkPassportPreset>>["data"] | null;

  if (requestedFramework && /^[A-Za-z0-9-]+$/.test(requestedFramework)) {
    const presetResult =
      await aport.getFrameworkPassportPreset(requestedFramework);
    if (presetResult.success && presetResult.data) {
      frameworkPreset = presetResult.data;
    } else {
      console.warn("[issue] Framework preset unavailable; using defaults", {
        framework: requestedFramework,
        status: presetResult.error?.status,
        message: presetResult.error?.message,
      });
    }
  }

  const name = (body.name || frameworkPreset?.name || "").trim();
  const description = (
    body.description ||
    frameworkPreset?.description ||
    ""
  ).trim();

  // Validate required fields after framework defaults are applied.
  if (!name || name.length < 1 || name.length > 100) {
    return errorResponse(
      "Agent name is required (1-100 characters)",
      400,
      cors,
    );
  }
  if (!description || description.length < 10 || description.length > 1000) {
    return errorResponse(
      "Description is required (10-1000 characters)",
      400,
      cors,
    );
  }
  if (!body.email || !body.email.includes("@")) {
    return errorResponse("Valid email is required", 400, cors);
  }

  const role = (body.role || frameworkPreset?.role || "agent").trim();
  const framework = requestedFrameworks.length
    ? requestedFrameworks
    : frameworkPreset?.framework || [];
  const regions = body.regions?.length
    ? body.regions
    : frameworkPreset?.regions?.length
      ? frameworkPreset.regions
      : ["global"];
  const requestedSlug =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : undefined;

  const links = sanitizeLinks(body.links);

  // Build capabilities and limits, optionally including deliverable enforcement
  const presetCapabilities: Capability[] = frameworkPreset?.capabilities?.length
    ? frameworkPreset.capabilities.map((capability) => ({
        ...capability,
        params: capability.params ? { ...capability.params } : undefined,
      }))
    : [...DEFAULT_CAPABILITIES];
  const presetLimits: Record<string, any> = frameworkPreset
    ? { ...frameworkPreset.limits }
    : { ...DEFAULT_LIMITS };

  // Caller customization over the preset. Applied BEFORE the deliverable block
  // below, which owns its own capability and its own limits key and stays
  // authoritative over both.
  let capabilities = resolveCapabilities(presetCapabilities, body.capabilities);
  const limits: Record<string, any> = resolveLimits(presetLimits, body.limits);

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

    // Replace, never append. A request carrying BOTH `deliverable` and its
    // capability in `capabilities` produced two entries with the same id: the
    // caller's, kept by the resolver, and this one. The passport page reads it
    // back with `.find`, so the card rendered the caller's parameters while the
    // policy evaluated these — a passport that shows one thing and enforces
    // another. The deliverable block owns this capability outright.
    capabilities = upsertCapability(capabilities, {
      id: DELIVERABLE_CAPABILITY,
      params: deliverableParams,
    });

    limits[DELIVERABLE_CAPABILITY] = deliverableParams;
  }

  try {
    const result = await aport.createBuilderPassport({
      builderId: `aportid_${Date.now()}`,
      email: body.email,
      displayName: name,
      kycCompleted: false,
      verificationProof: {
        verification_id: `ver_aportid_${Date.now()}`,
        verified_at: new Date().toISOString(),
      },
      metadata: {
        provider: "aport-id",
        role,
        framework,
        links,
        description,
        regions,
        preset_id: frameworkPreset?.id,
      },
      regions,
      sendClaimEmail: true,
      capabilities,
      limits,
      slug: requestedSlug,
    });

    if (!result.success || !result.data) {
      const status = result.error?.status;
      const mappedStatus = status === 409 ? 409 : status === 429 ? 429 : 502;
      console.error("[issue] APort upstream error:", {
        status,
        mappedStatus,
        message: result.error?.message,
        details: result.error?.details,
      });
      return errorResponse(
        result.error?.message || "Failed to issue passport",
        mappedStatus,
        cors,
      );
    }

    const agentId = result.data.passportId;
    const passportSlug = result.data.slug || requestedSlug || slugify(name);
    const setupKey = result.data.setup_key;

    if (!agentId) {
      return errorResponse("No passport ID returned from APort", 502, cors);
    }

    // Store in gallery KV if opted in
    if (body.showInGallery !== false && env.APORT_ID_KV) {
      try {
        const galleryEntry = JSON.stringify({
          agent_id: agentId,
          slug: passportSlug,
          name,
          role,
          framework,
          regions,
          created_at: new Date().toISOString(),
        });
        await env.APORT_ID_KV.put(`gallery:${agentId}`, galleryEntry);

        // Update gallery index (prepend to list)
        const indexRaw = await env.APORT_ID_KV.get("gallery:index");
        const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
        index.unshift(agentId);
        await env.APORT_ID_KV.put(
          "gallery:index",
          JSON.stringify(index.slice(0, 1000)),
        );

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
        ...(setupKey?.key && {
          api_key: setupKey.key,
          api_key_id: setupKey.key_id,
          api_key_scopes: setupKey.scopes,
        }),
      },
      201,
      cors,
    );
  } catch (error) {
    console.error("[issue] APort API error:", error);
    return errorResponse("Failed to reach APort API", 502, cors);
  }
};
