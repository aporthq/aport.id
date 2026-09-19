import { describe, it, expect } from "vitest";
import { resolveCapabilities, resolveLimits, deepMerge } from "../functions/lib/oap";

/**
 * A framework preset shaped like the real ones: capabilities with params, and
 * limits namespaced per capability, nesting four deep at
 * `payments.charge.currency_limits.USD.max_per_tx`.
 */
const PRESET_CAPS = [
  { id: "data.file.read", params: { allowed_paths: ["/workspace/**"] } },
  { id: "data.file.write", params: { allowed_paths: ["/workspace/out/**"] } },
  { id: "web.fetch" },
];

const PRESET_LIMITS = {
  "payments.charge": {
    currency_limits: {
      USD: { max_per_tx: 20000, daily_cap: 100000 },
      EUR: { max_per_tx: 18000, daily_cap: 90000 },
    },
    allowed_countries: ["US", "CA", "DE"],
    blocked_categories: ["weapons"],
    idempotency_required: true,
  },
  "data.file.read": { allowed_paths: ["/workspace/**"] },
  max_actions_per_min: 300,
};

describe("the default path is untouched", () => {
  it("mints the preset capabilities when the caller sends none", () => {
    expect(resolveCapabilities(PRESET_CAPS, undefined)).toEqual(PRESET_CAPS);
  });

  it("mints the preset limits when the caller sends none", () => {
    expect(resolveLimits(PRESET_LIMITS, undefined)).toEqual(PRESET_LIMITS);
  });

  it("treats empty input as no opinion, not as 'grant nothing'", () => {
    expect(resolveCapabilities(PRESET_CAPS, [])).toEqual(PRESET_CAPS);
    expect(resolveLimits(PRESET_LIMITS, {})).toEqual(PRESET_LIMITS);
  });

  it("ignores a non-object limits value rather than minting from it", () => {
    for (const bad of ["x", [1], null, 7]) {
      expect(resolveLimits(PRESET_LIMITS, bad as never)).toEqual(PRESET_LIMITS);
    }
  });
});

describe("changing one deeply nested limit keeps every sibling", () => {
  // The case the whole design turns on.
  const out = resolveLimits(PRESET_LIMITS, {
    "payments.charge": { currency_limits: { USD: { max_per_tx: 500 } } },
  });

  it("applies the change", () => {
    expect(out["payments.charge"].currency_limits.USD.max_per_tx).toBe(500);
  });

  it("keeps the sibling key in the same object", () => {
    expect(out["payments.charge"].currency_limits.USD.daily_cap).toBe(100000);
  });

  it("keeps the other currency untouched", () => {
    expect(out["payments.charge"].currency_limits.EUR).toEqual({
      max_per_tx: 18000,
      daily_cap: 90000,
    });
  });

  it("keeps the rest of that capability's limits", () => {
    expect(out["payments.charge"].allowed_countries).toEqual(["US", "CA", "DE"]);
    expect(out["payments.charge"].blocked_categories).toEqual(["weapons"]);
    expect(out["payments.charge"].idempotency_required).toBe(true);
  });

  it("keeps limits belonging to other capabilities", () => {
    expect(out["data.file.read"]).toEqual({ allowed_paths: ["/workspace/**"] });
    expect(out.max_actions_per_min).toBe(300);
  });

  it("does not mutate the preset", () => {
    expect(PRESET_LIMITS["payments.charge"].currency_limits.USD.max_per_tx).toBe(20000);
  });
});

describe("a default added to the preset later still reaches a customized mint", () => {
  it("carries a new top-level default", () => {
    const withNew = { ...PRESET_LIMITS, require_human_review: true };
    const out = resolveLimits(withNew, { max_actions_per_min: 10 });
    expect(out.require_human_review).toBe(true);
  });

  it("carries a new nested default", () => {
    const withNew = {
      ...PRESET_LIMITS,
      "payments.charge": { ...PRESET_LIMITS["payments.charge"], approval_required: true },
    };
    const out = resolveLimits(withNew, {
      "payments.charge": { currency_limits: { USD: { max_per_tx: 500 } } },
    });
    expect(out["payments.charge"].approval_required).toBe(true);
  });
});

describe("arrays replace rather than concatenate", () => {
  it("narrows an allowlist to exactly what the caller asked for", () => {
    // Concatenating would widen the very thing being restricted.
    const out = resolveLimits(PRESET_LIMITS, {
      "payments.charge": { allowed_countries: ["US"] },
    });
    expect(out["payments.charge"].allowed_countries).toEqual(["US"]);
  });
});

describe("capabilities select, and keep their preset params", () => {
  it("narrows to read only, dropping write", () => {
    const out = resolveCapabilities(PRESET_CAPS, [{ id: "data.file.read" }]);
    expect(out.map((c) => c.id)).toEqual(["data.file.read"]);
  });

  it("keeps the preset params of a capability named without any", () => {
    const out = resolveCapabilities(PRESET_CAPS, [{ id: "data.file.read" }]);
    expect(out[0].params).toEqual({ allowed_paths: ["/workspace/**"] });
  });

  it("deep-merges caller params over the preset's", () => {
    const preset = [{ id: "web.fetch", params: { allowed_domains: ["*"], timeout_ms: 5000 } }];
    const out = resolveCapabilities(preset, [
      { id: "web.fetch", params: { allowed_domains: ["example.com"] } },
    ]);
    expect(out[0].params).toEqual({ allowed_domains: ["example.com"], timeout_ms: 5000 });
  });

  it("can widen past the preset", () => {
    const out = resolveCapabilities(PRESET_CAPS, [{ id: "payments.charge" }]);
    expect(out.map((c) => c.id)).toEqual(["payments.charge"]);
  });

  it("drops a malformed id and keeps the preset when nothing valid remains", () => {
    expect(resolveCapabilities(PRESET_CAPS, [{ id: "Bad.Id" }])).toEqual(PRESET_CAPS);
  });

  it("drops non-object params rather than minting an invalid passport", () => {
    const out = resolveCapabilities(PRESET_CAPS, [
      { id: "web.fetch", params: "pwned" as never },
    ]);
    expect(out[0].params).toBeUndefined();
  });

  it("collapses duplicates and leaves the preset unmutated", () => {
    const out = resolveCapabilities(PRESET_CAPS, [{ id: "web.fetch" }, { id: "web.fetch" }]);
    expect(out).toHaveLength(1);
    expect(PRESET_CAPS.map((c) => c.id)).toEqual([
      "data.file.read",
      "data.file.write",
      "web.fetch",
    ]);
  });
});

describe("deepMerge itself", () => {
  it("recurses into objects and replaces everything else", () => {
    expect(deepMerge({ a: { b: 1, c: 2 } }, { a: { b: 9 } })).toEqual({ a: { b: 9, c: 2 } });
    expect(deepMerge({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] });
    expect(deepMerge({ a: 1 }, { a: null })).toEqual({ a: null });
  });

  it("adds keys the base never had", () => {
    expect(deepMerge({ a: 1 }, { b: { c: 2 } })).toEqual({ a: 1, b: { c: 2 } });
  });

  it("does not alias nested objects back to the override", () => {
    const override = { a: { b: 1 } };
    const out = deepMerge({} as Record<string, any>, override);
    out.a.b = 99;
    expect(override.a.b).toBe(1);
  });
});
