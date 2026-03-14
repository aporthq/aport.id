import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { onRequestGet } = await import("../functions/api/passport/[id]");

function createContext(
  agentId: string,
  query = "",
  env?: Partial<Record<string, unknown>>,
) {
  const mockKV = {
    get: vi.fn(() => Promise.resolve(null)),
    put: vi.fn(() => Promise.resolve()),
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
    request: new Request(
      `https://aport.id/api/passport/${agentId}${query}`,
      {
        method: "GET",
        headers: { Origin: "https://aport.id" },
      },
    ),
    params: { id: agentId },
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(),
    data: {},
    functionPath: "",
  } as unknown as Parameters<typeof onRequestGet>[0];
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("Email obfuscation in GET /api/passport/:id", () => {
  it("obfuscates contact email in response", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          agent_id: "ap_test123",
          name: "TestBot",
          contact: "uchi.uchibeke@gmail.com",
          status: "active",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.contact).not.toContain("uchi.uchibeke");
    expect(body.contact).toMatch(/^u\*+@gmail\.com$/);
  });

  it("obfuscates pending_owner.email", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          agent_id: "ap_test123",
          name: "TestBot",
          pending_owner: {
            email: "alice@example.com",
            display_name: "Alice",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, any>;

    expect(body.pending_owner.email).not.toContain("alice");
    expect(body.pending_owner.email).toMatch(/^a\*+@example\.com$/);
    // display_name should be untouched
    expect(body.pending_owner.display_name).toBe("Alice");
  });

  it("obfuscates owner.email", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          agent_id: "ap_test123",
          owner: { email: "bob@corp.io" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, any>;

    expect(body.owner.email).not.toContain("bob");
    expect(body.owner.email).toMatch(/^b\*+@corp\.io$/);
  });

  it("obfuscates emails in nested passport.data objects", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            agent_id: "ap_test123",
            contact: "deep@nested.com",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, any>;

    expect(body.data.contact).toMatch(/^d\*+@nested\.com$/);
  });

  it("handles passport with no email fields gracefully", async () => {
    const passportData = {
      agent_id: "ap_test123",
      name: "NoEmailBot",
      role: "agent",
      status: "active",
    };

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(passportData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.name).toBe("NoEmailBot");
  });

  it("preserves non-email fields unchanged", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          agent_id: "ap_test123",
          name: "TestBot",
          description: "A test bot",
          contact: "test@example.com",
          role: "agent",
          regions: ["us", "eu"],
          capabilities: [{ id: "web.fetch" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, any>;

    expect(body.name).toBe("TestBot");
    expect(body.description).toBe("A test bot");
    expect(body.role).toBe("agent");
    expect(body.regions).toEqual(["us", "eu"]);
    expect(body.capabilities).toEqual([{ id: "web.fetch" }]);
  });

  it("handles single-char local part", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          agent_id: "ap_test123",
          contact: "a@x.com",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    const body = (await res.json()) as Record<string, any>;

    // Single char local: "a" + at least 2 stars
    expect(body.contact).toMatch(/^a\*{2,}@x\.com$/);
  });
});
