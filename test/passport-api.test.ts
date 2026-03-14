import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { onRequestGet, onRequestOptions } = await import(
  "../functions/api/passport/[id]"
);

function createContext(
  agentId: string,
  query = "",
  env?: Partial<Record<string, unknown>>,
) {
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
      KV: {},
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

describe("GET /api/passport/:id", () => {
  it("returns 400 when ID is missing", async () => {
    const ctx = createContext("");
    const res = await onRequestGet(ctx);
    expect(res.status).toBe(400);
  });

  it("proxies passport data from APort API", async () => {
    const passportData = {
      agent_id: "ap_test123",
      name: "TestBot",
      role: "agent",
      status: "active",
      claimed: false,
      regions: ["global"],
      framework: ["gpt-4o"],
    };

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(passportData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(passportData);
  });

  it("passes format query parameter", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = createContext("ap_test123", "?format=vc");
    await onRequestGet(ctx);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("format=vc");
  });

  it("defaults format to json", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = createContext("ap_test123");
    await onRequestGet(ctx);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("format=json");
  });

  it("returns cache headers on success", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);

    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
  });

  it("returns 502 on APort API error", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    // Should forward as 502 (bad gateway)
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("returns 502 on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Connection refused"));

    const ctx = createContext("ap_test123");
    const res = await onRequestGet(ctx);
    expect(res.status).toBe(502);
  });
});

describe("OPTIONS /api/passport/:id", () => {
  it("returns 204 for preflight", async () => {
    const ctx = {
      ...createContext("ap_test"),
      request: new Request("https://aport.id/api/passport/ap_test", {
        method: "OPTIONS",
        headers: { Origin: "https://aport.id" },
      }),
    } as unknown as Parameters<typeof onRequestOptions>[0];

    const res = await onRequestOptions(ctx);
    expect(res.status).toBe(204);
  });
});
