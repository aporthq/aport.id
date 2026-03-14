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
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { agent_id: "ap_new123", did: "did:aport:123", claimed: false },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

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
    };
    expect(body.ok).toBe(true);
    expect(body.agent_id).toBe("ap_new123");
    expect(body.claim_email_sent).toBe(true);
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
