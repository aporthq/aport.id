/**
 * OAP compliance, driven by the spec rather than by this file.
 *
 * Everything here reads `generated/oap-registry.json`, which is compiled from
 * the `spec/aport-policies` and `spec/aport-spec` submodules by
 * `scripts/build-oap-registry.mjs`. No capability name, assurance level or
 * limit key appears in this module. Supporting a new capability is a submodule
 * bump and a regenerate, never an edit here.
 *
 * What the registry gives us per capability, straight from its policy pack:
 *
 *   min_assurance     the floor a passport must reach to be granted it
 *   limits_required   the limit keys the policy will evaluate against
 *   policy_id         which pack governs it, for provenance in an error
 *
 * Two layers, deliberately separated.
 *
 * `resolveCapabilities` / `resolveLimits` are the MINT path. They decide what a
 * passport carries, and they are permissive by design: aport.io validates
 * assurance and policy on the way in, and the framework presets themselves ship
 * capability ids this build's registry does not carry (`repo.push`,
 * `web.search`). Refusing those here would break working mints to enforce a
 * rule that is already enforced downstream, so an unrecognised id is logged and
 * passed through. Only a malformed id or non-object params is dropped, because
 * those produce a passport that fails the OAP schema itself.
 *
 * `validateGrant` is the STRICT path, for a caller that wants to know whether a
 * grant is complete before sending it: unknown capability, assurance floor,
 * missing required limits. Nothing in the mint path calls it; it exists so the
 * vault can check its own inference before minting, rather than discovering a
 * problem from a rejected passport.
 */

import registry from "./generated/oap-registry.json";

export interface Capability {
  id: string;
  params?: Record<string, any>;
}

export interface CapabilityRule {
  policy_id: string;
  policy_version: string | null;
  min_assurance: string;
  limits_required: string[];
}

export interface Violation {
  /** Machine-readable, so a caller can branch without parsing prose. */
  code:
    | "unknown_capability"
    | "assurance_too_low"
    | "missing_required_limits"
    | "malformed_capability_id"
    | "malformed_params"
    | "malformed_limits";
  capability?: string;
  message: string;
  /** Present when the registry has something useful to say about the fix. */
  detail?: Record<string, unknown>;
}

const CAPABILITY_ID_RE = new RegExp(registry.capability_id_pattern);
const RULES = registry.capabilities as Record<string, CapabilityRule>;
const ORDER: string[] = registry.assurance_order;

/** Every capability this build can grant. Derived, never typed out. */
export function knownCapabilities(): string[] {
  return Object.keys(RULES).sort();
}

export function capabilityRule(id: string): CapabilityRule | undefined {
  return RULES[id];
}

/** Which spec commits this build was compiled from. */
export function registryProvenance(): Record<string, unknown> {
  return {
    policies_commit: registry.policies_commit,
    spec_commit: registry.spec_commit,
    capabilities: Object.keys(RULES).length,
  };
}

/**
 * Is `have` at least `need` on the assurance ladder?
 *
 * An unrecognised level is treated as insufficient rather than as zero: a
 * passport carrying a level this build has never heard of is not evidence of
 * anything, and guessing its position would be the permissive guess.
 */
export function meetsAssurance(have: string | undefined, need: string): boolean {
  const haveAt = ORDER.indexOf(String(have));
  const needAt = ORDER.indexOf(need);
  if (haveAt < 0 || needAt < 0) return false;
  return haveAt >= needAt;
}

/** `params` is `type: object` in the passport schema. Anything else is dropped. */
export function asParams(value: unknown): Record<string, any> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return { ...(value as Record<string, any>) };
}

/**
 * Check a capability set and its limits against the registry.
 *
 * Returns every violation rather than the first, because a caller fixing a
 * request wants the whole list, and because a partial report invites a
 * fix-one-resubmit loop against an endpoint that mints real passports.
 *
 * `limits` is read as the OAP shape: keys are capability ids, values are that
 * capability's limit object. A capability's required keys are looked for inside
 * its own namespace, falling back to the top level so a flat legacy limits
 * object is still evaluated rather than rejected outright.
 */
export function validateGrant(input: {
  capabilities: Capability[];
  limits: Record<string, any>;
  assuranceLevel: string | undefined;
}): Violation[] {
  const { capabilities, limits, assuranceLevel } = input;
  const violations: Violation[] = [];

  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    violations.push({
      code: "malformed_limits",
      message: "limits must be an object keyed by capability id",
    });
    return violations;
  }

  for (const cap of capabilities) {
    if (!cap || typeof cap.id !== "string" || !CAPABILITY_ID_RE.test(cap.id)) {
      violations.push({
        code: "malformed_capability_id",
        capability: String(cap?.id ?? ""),
        message: `capability id must match ${registry.capability_id_pattern}`,
      });
      continue;
    }

    if (cap.params !== undefined && asParams(cap.params) === undefined) {
      violations.push({
        code: "malformed_params",
        capability: cap.id,
        message: "capability params must be an object",
      });
    }

    const rule = RULES[cap.id];
    if (!rule) {
      violations.push({
        code: "unknown_capability",
        capability: cap.id,
        message: `no active policy pack grants ${cap.id}`,
        detail: { known: knownCapabilities().length },
      });
      continue;
    }

    if (!meetsAssurance(assuranceLevel, rule.min_assurance)) {
      violations.push({
        code: "assurance_too_low",
        capability: cap.id,
        message:
          `${cap.id} requires ${rule.min_assurance} ` +
          `(${rule.policy_id}); this passport is ${assuranceLevel ?? "unset"}`,
        detail: { required: rule.min_assurance, actual: assuranceLevel ?? null, policy_id: rule.policy_id },
      });
    }

    const scoped = limits[cap.id];
    const namespace = scoped && typeof scoped === "object" && !Array.isArray(scoped) ? scoped : limits;
    const missing = rule.limits_required.filter((key) => namespace[key] === undefined);
    if (missing.length > 0) {
      violations.push({
        code: "missing_required_limits",
        capability: cap.id,
        message: `${cap.id} requires limits: ${missing.join(", ")}`,
        detail: { missing, policy_id: rule.policy_id },
      });
    }
  }

  return violations;
}

/** A plain JSON object: mergeable. Arrays and scalars are values, not shapes. */
function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Merge `override` into `base`, recursing into nested objects.
 *
 * Limits nest four deep in practice — `payments.charge.currency_limits.USD.
 * max_per_tx` — so a shallow merge is not a smaller version of this, it is a
 * silent data loss: changing one currency's per-transaction cap would drop the
 * other currencies and that currency's daily cap along with them.
 *
 * Arrays REPLACE rather than concatenate, and that asymmetry is deliberate. A
 * limit like `allowed_countries: ["US"]` is a narrowing statement; appending to
 * the preset's list would widen the very thing the caller was restricting, and
 * a merge rule that fails open on the security-relevant case is the wrong rule.
 * The same goes for scalars.
 *
 * Neither input is mutated.
 */
export function deepMerge<T extends Record<string, any>>(base: T, override: Record<string, any>): T {
  const out: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    // An explicit null means "unset this", and is kept as given rather than
    // treated as an absent key.
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = isPlainObject(value) ? { ...value } : value;
    }
  }
  return out as T;
}

/**
 * The capability set to mint, given the preset's and the caller's.
 *
 * A supplied list SELECTS: it names the capabilities to grant, so a caller can
 * narrow as well as widen. Merging could add or replace an entry but never drop
 * one, which would make "read but never write" inexpressible.
 *
 * Each selected entry is still hydrated from the preset, and its params are
 * deep-merged over the preset's rather than replacing them, so naming a
 * capability to change one parameter does not discard its other defaults.
 *
 * A wholly invalid request keeps the preset: minting a capability-less agent
 * because the input was garbled is worse than ignoring the input.
 */
export function resolveCapabilities(
  preset: Capability[],
  requested?: Capability[],
): Capability[] {
  if (!Array.isArray(requested) || requested.length === 0) return preset;
  const chosen: Capability[] = [];
  const seen = new Set<string>();
  for (const cap of requested) {
    if (!cap || typeof cap.id !== "string" || !CAPABILITY_ID_RE.test(cap.id)) {
      console.warn("[oap] ignoring malformed capability id", { id: cap?.id });
      continue;
    }
    if (seen.has(cap.id)) continue;
    seen.add(cap.id);
    if (!RULES[cap.id]) {
      // Not fatal: aport.io validates on the way in, and the framework presets
      // themselves ship ids this build's registry does not carry. Surfaced so a
      // genuine typo is visible in logs rather than minted in silence.
      console.warn("[oap] capability not in the compiled registry", { id: cap.id });
    }
    const fromPreset = preset.find((c) => c.id === cap.id);
    const presetParams = asParams(fromPreset?.params);
    const callerParams = asParams(cap.params);
    const params =
      presetParams && callerParams
        ? deepMerge(presetParams, callerParams)
        : (callerParams ?? presetParams);
    chosen.push(params ? { id: cap.id, params } : { id: cap.id });
  }
  return chosen.length > 0 ? chosen : preset;
}

/**
 * The limits to mint, given the preset's and the caller's.
 *
 * A deep MERGE over the preset, never a replacement. This endpoint owns the
 * floor: the preset is what makes a passport useful and bounded on day one, and
 * a caller adjusts it rather than restating it. Two things follow, and both are
 * the point:
 *
 *  - A default added here later reaches every passport, including ones minted
 *    by callers that have never heard of it. A replacement would mean every
 *    integration silently opted out of every future default.
 *  - Changing one nested value cannot drop its siblings.
 */
export function resolveLimits(
  preset: Record<string, any>,
  requested?: Record<string, any>,
): Record<string, any> {
  if (!isPlainObject(requested)) return preset;
  return deepMerge(preset, requested);
}

/**
 * The capabilities from `requested` that this passport may actually be granted.
 *
 * Used where dropping is the right answer rather than refusing: a mint that
 * asked for one thing out of reach should still produce the rest, and the
 * caller is told what was dropped.
 */
export function grantable(
  requested: Capability[],
  limits: Record<string, any>,
  assuranceLevel: string | undefined,
): { granted: Capability[]; rejected: Violation[] } {
  const rejected: Violation[] = [];
  const granted: Capability[] = [];
  for (const cap of requested) {
    const problems = validateGrant({ capabilities: [cap], limits, assuranceLevel });
    if (problems.length === 0) granted.push(cap);
    else rejected.push(...problems);
  }
  return { granted, rejected };
}
