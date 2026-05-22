import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the issue proxy API endpoint (E3)
 *
 * Tests validation, field mapping, error handling, and gallery KV storage.
 * We import the handler and call it directly with mock contexts.
 */

// Mock fetch globally before importing the handler
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Dynamic import after mocks are in place
const { onRequestPost } = await import("../functions/api/issue");

function createContext(
  body: Record<string, unknown>,
  env?: Partial<Record<string, unknown>>,
) {
  const kvStore = new Map<string, string>();
  const mockKV = {
    get: vi.fn((key: string) => Promise.resolve(kvStore.get(key) || null)),
    put: vi.fn((key: string, value: string) => {
      kvStore.set(key, value);
      return Promise.resolve();
    }),
  };

  return {
    env: {
      APORT_API_KEY: "test-key",
      APORT_ORG_ID: "ap_org_test",
      APORT_BASE_URL: "https://api.aport.io",
      APORT_ASSURANCE_TYPE: "kyb",
      APORT_ASSURANCE_LEVEL: "L1",
      AGENT_PASSPORT_BASE_URL: "",
      NEXT_PUBLIC_APP_URL: "",
      NODE_ENV: "test",
      APORT_ID_KV: mockKV,
      ...env,
    },
    request: new Request("https://aport.id/api/issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://aport.id",
      },
      body: JSON.stringify(body),
    }),
    params: {},
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(),
    data: {},
    functionPath: "",
  } as unknown as Parameters<typeof onRequestPost>[0];
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("POST /api/issue", () => {
  it("returns 400 for missing name", async () => {
    const ctx = createContext({
      description: "A test agent",
      email: "a@b.com",
    });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("name");
  });

  it("returns 400 for short description", async () => {
    const ctx = createContext({
      name: "Bot",
      description: "Short",
      email: "a@b.com",
    });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Description");
  });

  it("returns 400 for missing email", async () => {
    const ctx = createContext({
      name: "Bot",
      description: "A valid description for the bot",
      email: "",
    });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const ctx = createContext({
      name: "Bot",
      description: "A valid description for the bot",
      email: "notanemail",
    });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(400);
  });

  it("returns 500 when APORT_API_KEY is missing", async () => {
    const ctx = createContext(
      { name: "Bot", description: "A valid description", email: "a@b.com" },
      { APORT_API_KEY: "" },
    );
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(500);
  });

  it("returns 201 on successful issuance", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("/api/passports/ap_new123/setup-key")) {
        return new Response(
          JSON.stringify({
            data: {
              key_id: "key_setup_123",
              key: "apk_secret_setup_key",
              scopes: ["read"],
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          data: { agent_id: "ap_new123", did: "did:aport:123", claimed: false },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    const ctx = createContext({
      name: "ARIA",
      description: "A research assistant that browses the web",
      role: "agent",
      email: "dev@example.com",
      framework: ["gpt-4o"],
      regions: ["us", "eu"],
      links: { homepage: "https://example.com" },
      showInGallery: true,
    });

    const res = await onRequestPost(ctx);
    expect(res.status).toBe(201);

    const body = (await res.json()) as {
      ok: boolean;
      agent_id: string;
      claim_email_sent: boolean;
      api_key?: string;
      api_key_id?: string;
      api_key_scopes?: string[];
    };
    expect(body.ok).toBe(true);
    expect(body.agent_id).toBe("ap_new123");
    expect(body.claim_email_sent).toBe(true);
    expect(body.api_key).toBe("apk_secret_setup_key");
    expect(body.api_key_id).toBe("key_setup_123");
    expect(body.api_key_scopes).toEqual(["read"]);
  });

  it("uses framework presets for quick hosted issuance", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("/api/public/framework-passport-presets/claude-code")) {
        return new Response(
          JSON.stringify({
            id: "claude-code",
            name: "Claude Code Agent",
            role: "Claude Code agent",
            description: "General-purpose Claude Code agent with permissive defaults.",
            framework: ["claude-code"],
            capabilities: [
              { id: "system.command.execute", params: {} },
              { id: "data.file.read", params: {} },
            ],
            limits: { allowed_commands: ["*"], allowed_paths: ["*"] },
            regions: ["US", "CA", "EU"],
            status: "draft",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/passports/ap_quick/setup-key")) {
        return new Response(
          JSON.stringify({
            data: {
              key_id: "key_quick",
              key: "apk_quick_secret",
              scopes: ["read"],
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ data: { agent_id: "ap_quick", claimed: false } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    const ctx = createContext({
      email: "dev@example.com",
      framework: ["claude-code"],
      showInGallery: false,
    });

    const res = await onRequestPost(ctx);
    const body = (await res.json()) as { agent_id: string; api_key?: string };

    expect(res.status).toBe(201);
    expect(body.agent_id).toBe("ap_quick");
    expect(body.api_key).toBe("apk_quick_secret");

    const issueCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes("/api/orgs/ap_org_test/issue"),
    );
    const issueBody = JSON.parse(issueCall?.[1]?.body as string);
    expect(issueBody.name).toBe("Claude Code Agent");
    expect(issueBody.role).toBe("Claude Code agent");
    expect(issueBody.description).toContain("Claude Code");
    expect(issueBody.framework).toEqual(["claude-code"]);
    expect(issueBody.regions).toEqual(["US", "CA", "EU"]);
    expect(issueBody.capabilities.map((capability: any) => capability.id)).toEqual(
      ["system.command.execute", "data.file.read"],
    );
    expect(issueBody.limits.allowed_commands).toEqual(["*"]);
  });

  it("stores gallery entry in KV when showInGallery is true", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { agent_id: "ap_gallery1", claimed: false },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext({
      name: "GalleryBot",
      description: "A bot that should appear in the gallery",
      email: "dev@example.com",
      showInGallery: true,
    }) as any;

    await onRequestPost(ctx);

    const kv = ctx.env.APORT_ID_KV as unknown as {
      put: ReturnType<typeof vi.fn>;
    };
    // Should have stored gallery entry and updated index + count
    expect(kv.put).toHaveBeenCalled();
  });

  it("does not fail browser issuance when setup-key creation is unavailable", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("/api/passports/ap_without_key/setup-key")) {
        return new Response(JSON.stringify({ message: "setup unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ data: { agent_id: "ap_without_key", claimed: false } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    const ctx = createContext({
      name: "BrowserBot",
      description: "A browser-created passport still succeeds without setup key",
      email: "dev@example.com",
      showInGallery: false,
    });

    const res = await onRequestPost(ctx);
    const body = (await res.json()) as { agent_id: string; api_key?: string };

    expect(res.status).toBe(201);
    expect(body.agent_id).toBe("ap_without_key");
    expect(body.api_key).toBeUndefined();
  });

  it("defaults role to agent and regions to global", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { agent_id: "ap_def", claimed: false } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext({
      name: "DefaultBot",
      description: "Testing default values for role and regions",
      email: "test@test.com",
    });

    await onRequestPost(ctx);

    // Check the body sent to APort API
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
    expect(fetchBody.metadata.role).toBe("agent");
    expect(fetchBody.regions).toEqual(["global"]);
  });
});
