import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  validateGrant,
  grantable,
  knownCapabilities,
  capabilityRule,
  meetsAssurance,
  asParams,
} from "../functions/lib/oap";
import registry from "../functions/lib/generated/oap-registry.json";

/**
 * These tests name no capability they did not read from the policy packs.
 *
 * A test that hardcodes "data.file.read" passes for as long as that pack
 * exists and stops testing anything the day it is renamed. Every fixture below
 * is picked BY PROPERTY — the first L0 capability, the first one needing
 * limits — so the suite follows the spec instead of pinning a snapshot of it.
 */
const POLICIES = join(__dirname, "..", "spec", "aport-policies");

function packCapabilities() {
  const out: Array<{ id: string; min_assurance: string; limits_required: string[] }> = [];
  for (const dir of readdirSync(POLICIES)) {
    const file = join(POLICIES, dir, "policy.json");
    if (!existsSync(file)) continue;
    const pack = JSON.parse(readFileSync(file, "utf8"));
    if (pack.status && pack.status !== "active") continue;
    for (const id of pack.requires_capabilities ?? []) {
      out.push({
        id,
        min_assurance: pack.min_assurance ?? "L0",
        limits_required: pack.limits_required ?? [],
      });
    }
  }
  return out;
}

/**
 * The top of the ladder, read from the schema's own enum.
 *
 * This was "L4", which the passport schema does not permit — its values are
 * L0..L3, L4KYC and L4FIN. Hardcoding it here meant these tests asserted
 * against a level no passport can carry, and passed only because the
 * implementation had the same wrong list.
 */
const TOP_ASSURANCE: string =
  registry.assurance_order[registry.assurance_order.length - 1];

const FROM_PACKS = packCapabilities();
const L0_NO_LIMITS = FROM_PACKS.find((c) => c.min_assurance === "L0" && c.limits_required.length === 0);
const L0_WITH_LIMITS = FROM_PACKS.find((c) => c.min_assurance === "L0" && c.limits_required.length > 0);
const HIGH_ASSURANCE = FROM_PACKS.find((c) => c.min_assurance === "L3");

/** Satisfy a capability's required limits without knowing what they are. */
function limitsFor(cap: { id: string; limits_required: string[] }) {
  const inner: Record<string, unknown> = {};
  for (const key of cap.limits_required) inner[key] = "set-by-test";
  return { [cap.id]: inner };
}

describe("the registry is derived, not typed out", () => {
  it("knows every capability the active packs declare", () => {
    const fromPacks = new Set(FROM_PACKS.map((c) => c.id));
    expect(new Set(knownCapabilities())).toEqual(fromPacks);
  });

  it("carries each capability's own assurance floor and required limits", () => {
    for (const cap of FROM_PACKS) {
      const rule = capabilityRule(cap.id);
      expect(rule, `no rule for ${cap.id}`).toBeDefined();
      expect(rule!.min_assurance).toBe(cap.min_assurance);
      expect(rule!.limits_required).toEqual(cap.limits_required);
    }
  });

  it("covers more than a handful, so the generator really walked the packs", () => {
    expect(knownCapabilities().length).toBeGreaterThan(10);
  });
});

describe("a capability outside the spec is not grantable", () => {
  it("rejects an id that matches the pattern but no pack", () => {
    const v = validateGrant({
      capabilities: [{ id: "acme.invented.capability" }],
      limits: {},
      assuranceLevel: TOP_ASSURANCE,
    });
    expect(v.map((x) => x.code)).toContain("unknown_capability");
  });

  it("rejects an id the passport schema's own pattern forbids", () => {
    for (const bad of ["Data.File.Read", "x; rm -rf /", "../../etc/passwd", "trailing."]) {
      const v = validateGrant({ capabilities: [{ id: bad }], limits: {}, assuranceLevel: TOP_ASSURANCE });
      expect(v.map((x) => x.code), bad).toContain("malformed_capability_id");
    }
  });

  it("rejects params that are not an object", () => {
    const cap = L0_NO_LIMITS ?? FROM_PACKS[0];
    for (const params of ["x", 42, [1], true]) {
      const v = validateGrant({
        capabilities: [{ id: cap.id, params: params as never }],
        limits: limitsFor(cap),
        assuranceLevel: TOP_ASSURANCE,
      });
      expect(v.map((x) => x.code)).toContain("malformed_params");
    }
    expect(asParams({ a: 1 })).toEqual({ a: 1 });
    expect(asParams([1])).toBeUndefined();
  });
});

describe("assurance is a floor, taken from the pack", () => {
  it("refuses a capability above the passport's level", () => {
    if (!HIGH_ASSURANCE) return;
    const v = validateGrant({
      capabilities: [{ id: HIGH_ASSURANCE.id }],
      limits: limitsFor(HIGH_ASSURANCE),
      assuranceLevel: "L0",
    });
    const hit = v.find((x) => x.code === "assurance_too_low");
    expect(hit, `${HIGH_ASSURANCE.id} should need ${HIGH_ASSURANCE.min_assurance}`).toBeDefined();
    expect(hit!.detail!.required).toBe(HIGH_ASSURANCE.min_assurance);
  });

  it("allows it once the level is reached", () => {
    if (!HIGH_ASSURANCE) return;
    const v = validateGrant({
      capabilities: [{ id: HIGH_ASSURANCE.id }],
      limits: limitsFor(HIGH_ASSURANCE),
      assuranceLevel: HIGH_ASSURANCE.min_assurance,
    });
    expect(v.filter((x) => x.code === "assurance_too_low")).toHaveLength(0);
  });

  it("treats an unknown level as insufficient rather than as zero", () => {
    expect(meetsAssurance("L9", "L0")).toBe(false);
    expect(meetsAssurance(undefined, "L0")).toBe(false);
    expect(meetsAssurance("L2", "L1")).toBe(true);
  });
});

describe("required limits make a grant complete", () => {
  it("rejects a capability granted without the limits its policy evaluates", () => {
    if (!L0_WITH_LIMITS) return;
    const v = validateGrant({
      capabilities: [{ id: L0_WITH_LIMITS.id }],
      limits: {},
      assuranceLevel: TOP_ASSURANCE,
    });
    const hit = v.find((x) => x.code === "missing_required_limits");
    expect(hit).toBeDefined();
    expect(hit!.detail!.missing).toEqual(L0_WITH_LIMITS.limits_required);
  });

  it("accepts them namespaced under the capability id, as OAP writes them", () => {
    if (!L0_WITH_LIMITS) return;
    const v = validateGrant({
      capabilities: [{ id: L0_WITH_LIMITS.id }],
      limits: limitsFor(L0_WITH_LIMITS),
      assuranceLevel: TOP_ASSURANCE,
    });
    expect(v).toHaveLength(0);
  });

  it("still evaluates a flat legacy limits object rather than rejecting it", () => {
    if (!L0_WITH_LIMITS) return;
    const flat: Record<string, unknown> = {};
    for (const key of L0_WITH_LIMITS.limits_required) flat[key] = 1;
    const v = validateGrant({
      capabilities: [{ id: L0_WITH_LIMITS.id }],
      limits: flat,
      assuranceLevel: TOP_ASSURANCE,
    });
    expect(v).toHaveLength(0);
  });

  it("reports a non-object limits value rather than reading through it", () => {
    const v = validateGrant({
      capabilities: [{ id: FROM_PACKS[0].id }],
      limits: [] as never,
      assuranceLevel: TOP_ASSURANCE,
    });
    expect(v.map((x) => x.code)).toEqual(["malformed_limits"]);
  });
});

describe("every violation is reported, not just the first", () => {
  it("lists one per failing capability", () => {
    const v = validateGrant({
      capabilities: [{ id: "acme.not.real" }, { id: "Bad.Id" }],
      limits: {},
      assuranceLevel: "L0",
    });
    expect(v.length).toBeGreaterThanOrEqual(2);
  });
});

describe("grantable drops what it must and keeps the rest", () => {
  it("keeps a capability the passport qualifies for and drops one it does not", () => {
    if (!L0_NO_LIMITS || !HIGH_ASSURANCE) return;
    const { granted, rejected } = grantable(
      [{ id: L0_NO_LIMITS.id }, { id: HIGH_ASSURANCE.id }],
      limitsFor(HIGH_ASSURANCE),
      "L0",
    );
    expect(granted.map((c) => c.id)).toEqual([L0_NO_LIMITS.id]);
    expect(rejected.some((r) => r.capability === HIGH_ASSURANCE.id)).toBe(true);
  });
});
