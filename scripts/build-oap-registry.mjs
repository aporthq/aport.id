#!/usr/bin/env node
/**
 * Compile the OAP registry into one artifact this app can read at runtime.
 *
 * Why generate rather than read the packs directly: this runs on Cloudflare
 * Pages Functions, which has no filesystem to walk at request time. Why
 * generate rather than hand-maintain a list: the packs are the spec, they move
 * on their own release cycle, and a hand-copied capability list is wrong the
 * day someone adds the twenty-second one.
 *
 * Source of truth is the two submodules under spec/, pinned by commit, so a
 * build is reproducible and an upgrade is a deliberate submodule bump that
 * shows up in a diff.
 *
 * Run:
 *   node scripts/build-oap-registry.mjs
 *   node scripts/build-oap-registry.mjs --check   # fail if the artifact is stale
 *
 * Nothing here knows the name of a single capability. Add
 * `foo.bar.baz.v1/policy.json` upstream, bump the submodule, re-run, and it is
 * supported.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POLICIES_DIR = join(ROOT, "spec", "aport-policies");
const SPEC_DIR = join(ROOT, "spec", "aport-spec");
const OUT = join(ROOT, "functions", "lib", "generated", "oap-registry.json");

function fail(msg) {
  console.error(`build-oap-registry: ${msg}`);
  process.exit(1);
}

if (!existsSync(POLICIES_DIR) || !existsSync(SPEC_DIR)) {
  fail(
    "spec submodules missing. Run `git submodule update --init --recursive`.\n" +
      "They are the source of truth; this script refuses to guess without them.",
  );
}

/** Every policy pack directory, by convention `<id>.v<n>/policy.json`. */
function readPacks() {
  const packs = [];
  for (const entry of readdirSync(POLICIES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(POLICIES_DIR, entry.name, "policy.json");
    if (!existsSync(file)) continue;
    let pack;
    try {
      pack = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      fail(`${entry.name}/policy.json is not valid JSON: ${err.message}`);
    }
    packs.push({ dir: entry.name, pack });
  }
  if (packs.length === 0) fail("no policy packs found; the submodule is present but empty");
  return packs.sort((a, b) => a.dir.localeCompare(b.dir));
}

/**
 * The passport schema's own constraint on a capability id. Read from the
 * schema rather than restated, so a change to the spec's pattern reaches this
 * app without anyone editing a regex here.
 */
function capabilityIdPattern() {
  const schemaPath = join(SPEC_DIR, "oap", "passport-schema.json");
  if (!existsSync(schemaPath)) fail(`passport-schema.json not found at ${schemaPath}`);
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const pattern = schema?.properties?.capabilities?.items?.properties?.id?.pattern;
  if (typeof pattern !== "string") {
    fail("passport-schema.json no longer declares capabilities[].id.pattern; refusing to invent one");
  }
  return pattern;
}

const packs = readPacks();
const capabilities = {};
const conflicts = [];

for (const { dir, pack } of packs) {
  // Only packs that are actually in force. A deprecated or draft pack must not
  // silently license a capability.
  if (pack.status && pack.status !== "active") continue;
  const required = Array.isArray(pack.requires_capabilities) ? pack.requires_capabilities : [];
  for (const id of required) {
    if (typeof id !== "string" || !id) continue;
    const entry = {
      policy_id: pack.id ?? dir,
      policy_version: pack.version ?? null,
      min_assurance: pack.min_assurance ?? "L0",
      limits_required: Array.isArray(pack.limits_required) ? [...pack.limits_required] : [],
    };
    const existing = capabilities[id];
    if (existing && JSON.stringify(existing) !== JSON.stringify(entry)) {
      // Two active packs claiming one capability with different rules is a
      // spec-level conflict. Surfaced, not silently last-one-wins.
      conflicts.push({ id, a: existing.policy_id, b: entry.policy_id });
    }
    capabilities[id] = entry;
  }
}

if (conflicts.length) {
  for (const c of conflicts) {
    console.error(`  conflict: ${c.id} claimed by both ${c.a} and ${c.b} with different rules`);
  }
  fail(`${conflicts.length} capability conflict(s) in the policy packs`);
}

const registry = {
  // Provenance, so a passport minted by this build can be traced to a spec
  // version rather than to "whatever main was that day".
  generated_by: "scripts/build-oap-registry.mjs",
  policies_commit: process.env.APORT_POLICIES_COMMIT ?? null,
  spec_commit: process.env.APORT_SPEC_COMMIT ?? null,
  capability_id_pattern: capabilityIdPattern(),
  /** Assurance ladder, lowest first. Order is what makes a comparison possible. */
  assurance_order: ["L0", "L1", "L2", "L3", "L4"],
  capabilities,
};

const serialized = `${JSON.stringify(registry, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  // The provenance fields move with the environment, so compare the part that
  // actually describes behaviour.
  const strip = (s) => {
    try {
      const { policies_commit, spec_commit, ...rest } = JSON.parse(s);
      return JSON.stringify(rest);
    } catch {
      return s;
    }
  };
  if (strip(current) !== strip(serialized)) {
    fail("generated registry is stale. Run `node scripts/build-oap-registry.mjs` and commit the result.");
  }
  console.log(`oap-registry is current: ${Object.keys(capabilities).length} capabilities`);
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, serialized);
console.log(
  `wrote ${OUT.replace(`${ROOT}/`, "")}: ` +
    `${Object.keys(capabilities).length} capabilities from ${packs.length} packs`,
);
