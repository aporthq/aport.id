import { describe, it, expect } from "vitest";
import {
  FRAMEWORK_OPTIONS,
  getBreedLabel,
  getFrameworkById,
  getFrameworkByBreedSlug,
  getProviders,
} from "@/lib/config/breeds";

describe("FRAMEWORK_OPTIONS", () => {
  it("has all models with unique IDs, breeds, and slugs", () => {
    expect(FRAMEWORK_OPTIONS.length).toBeGreaterThanOrEqual(20);
    const ids = FRAMEWORK_OPTIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    const breeds = FRAMEWORK_OPTIONS.map((o) => o.breed);
    expect(new Set(breeds).size).toBe(breeds.length);
    const slugs = FRAMEWORK_OPTIONS.map((o) => o.breedSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("each option has all required fields", () => {
    for (const opt of FRAMEWORK_OPTIONS) {
      expect(opt.id).toBeTruthy();
      expect(opt.name).toBeTruthy();
      expect(opt.breed).toBeTruthy();
      expect(opt.breedDescription).toBeTruthy();
      expect(opt.provider).toBeTruthy();
      expect(opt.breedSlug).toBeTruthy();
      expect(opt.longDescription.length).toBeGreaterThan(50);
      expect(opt.tags.length).toBeGreaterThan(0);
      expect(opt.socialCopy).toBeTruthy();
      expect(opt.funFact).toBeTruthy();
    }
  });

  it("includes all PRD-required models", () => {
    const ids = FRAMEWORK_OPTIONS.map((o) => o.id);
    expect(ids).toContain("gpt-4o");
    expect(ids).toContain("claude-opus");
    expect(ids).toContain("claude-sonnet");
    expect(ids).toContain("claude-haiku");
    expect(ids).toContain("gemini-flash");
    expect(ids).toContain("mistral");
    expect(ids).toContain("llama-3");
    expect(ids).toContain("langchain");
    expect(ids).toContain("openclaw");
    expect(ids).toContain("other");
  });

  it("includes current-gen flagship models", () => {
    const ids = FRAMEWORK_OPTIONS.map((o) => o.id);
    expect(ids).toContain("gpt-5");
    expect(ids).toContain("o3");
    expect(ids).toContain("llama-4");
    expect(ids).toContain("grok");
    expect(ids).toContain("deepseek-r1");
    expect(ids).toContain("qwen");
  });

  it("maps correct breeds per PRD", () => {
    const byId = Object.fromEntries(FRAMEWORK_OPTIONS.map((o) => [o.id, o]));
    expect(byId["gpt-4o"].breed).toBe("Golden Retriever");
    expect(byId["claude-opus"].breed).toBe("Border Collie");
    expect(byId["mistral"].breed).toBe("Feral Cat");
    expect(byId["llama-3"].breed).toBe("Wolf");
    expect(byId["other"].breed).toBe("Mixed Breed");
  });

  it("'other' is always the last entry", () => {
    const last = FRAMEWORK_OPTIONS[FRAMEWORK_OPTIONS.length - 1];
    expect(last.id).toBe("other");
  });

  it("breed slugs are URL-safe", () => {
    for (const opt of FRAMEWORK_OPTIONS) {
      expect(opt.breedSlug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("getBreedLabel", () => {
  it("returns breed label for known framework", () => {
    const label = getBreedLabel(["gpt-4o"]);
    expect(label).toBe("Golden Retriever — Reliable, friendly, everyone has one");
  });

  it("uses the first framework ID for multi-select", () => {
    const label = getBreedLabel(["claude-opus", "langchain"]);
    expect(label).toContain("Border Collie");
  });

  it("returns null for empty array", () => {
    expect(getBreedLabel([])).toBeNull();
  });

  it("returns fallback for unknown framework", () => {
    const label = getBreedLabel(["nonexistent-model"]);
    expect(label).toBe("nonexistent-model · Mixed Breed");
  });
});

describe("getFrameworkById", () => {
  it("finds framework by ID", () => {
    const fw = getFrameworkById("claude-sonnet");
    expect(fw).toBeDefined();
    expect(fw!.name).toBe("Claude Sonnet");
    expect(fw!.breed).toBe("Labrador");
  });

  it("returns undefined for unknown ID", () => {
    expect(getFrameworkById("unknown")).toBeUndefined();
  });
});

describe("getFrameworkByBreedSlug", () => {
  it("finds framework by breed slug", () => {
    const fw = getFrameworkByBreedSlug("golden-retriever");
    expect(fw).toBeDefined();
    expect(fw!.id).toBe("gpt-4o");
  });

  it("returns undefined for unknown slug", () => {
    expect(getFrameworkByBreedSlug("unknown-slug")).toBeUndefined();
  });
});

describe("getProviders", () => {
  it("returns unique provider list", () => {
    const providers = getProviders();
    expect(providers.length).toBeGreaterThan(5);
    expect(new Set(providers).size).toBe(providers.length);
    expect(providers).toContain("OpenAI");
    expect(providers).toContain("Anthropic");
    expect(providers).toContain("Google");
  });
});
