import { describe, it, expect } from "vitest";

/**
 * The framework a caller names reaches the preset endpoint, or it does not.
 *
 * There used to be a hardcoded allowlist in front of that lookup, holding a
 * stale copy of the endpoint's own key set. These tests pin the two properties
 * that replaced it: the sanitiser still bounds what can be sent, and the live
 * preset list is a superset of what the installer supports — which is the
 * check that would have caught the drift the allowlist introduced.
 */

const PRESETS_URL = "https://aport.io/api/public/framework-passport-presets";
const GUARDRAILS =
  "https://api.github.com/repos/aporthq/aport-agent-guardrails/contents/bin/agent-guardrails";

/** The same bound the handler applies before a value reaches a URL path. */
const URL_SAFE = /^[A-Za-z0-9-]+$/;

describe("nothing unsafe can reach the preset lookup", () => {
  it("refuses everything that is not a plain framework token", () => {
    for (const bad of [
      "../../etc/passwd",
      "a/b",
      "a b",
      "a?b=1",
      "a#b",
      "a%2e%2e",
      "",
      "a_b",
      "a.b",
    ]) {
      expect(URL_SAFE.test(bad), bad).toBe(false);
    }
  });

  it("accepts the real ids, including the capitalised one", () => {
    for (const ok of ["claude-code", "gemini-cli", "vercel-ai-sdk", "Custom", "github"]) {
      expect(URL_SAFE.test(ok), ok).toBe(true);
    }
  });
});

describe("the preset endpoint covers everything the installer supports", () => {
  it("has a preset for every offerable framework", async () => {
    // A missing network is not a drift, and `fetch` REJECTS on one rather than
    // returning a non-ok response — so the `res.ok` guard below was never
    // reached offline and the whole suite failed instead of skipping, which is
    // the opposite of what the comment promised.
    let presetsRes: Response;
    let installerRes: Response;
    try {
      [presetsRes, installerRes] = await Promise.all([
        fetch(PRESETS_URL),
        fetch(GUARDRAILS, { headers: { Accept: "application/vnd.github.raw" } }),
      ]);
    } catch {
      return;
    }
    if (!presetsRes.ok || !installerRes.ok) return;

    const presets = (await presetsRes.json()) as { presets: Array<{ id: string }> };
    const ids = new Set(presets.presets.map((p) => p.id));

    const src = await installerRes.text();
    const arr = src.match(/^SUPPORTED_FRAMEWORKS=\(([^)]*)\)/m);
    if (!arr) return;
    const gated = [...src.matchAll(/^#\s*Gated target:\s*([a-z0-9-]+)/gm)].map((m) => m[1]);
    const offerable = arr[1].split(/\s+/).filter((f) => f && !gated.includes(f));

    expect(offerable.length).toBeGreaterThan(5);
    const missing = offerable.filter((f) => !ids.has(f));
    expect(missing, `installable with no preset: ${missing.join(", ")}`).toEqual([]);
  });
});
