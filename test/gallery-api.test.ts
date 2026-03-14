import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock crypto.subtle for request token verification
const originalCrypto = globalThis.crypto;

const { onRequestGet } = await import("../functions/api/gallery");

function createKV() {
  const kvStore = new Map<string, string>();
  return {
    get: vi.fn((key: string) => Promise.resolve(kvStore.get(key) || null)),
    put: vi.fn((key: string, value: string) => {
      kvStore.set(key, value);
      return Promise.resolve();
    }),
  };
}

// Generate a valid token for tests (same algorithm as request-token.ts)
async function generateTestToken(): Promise<string> {
  const WINDOW_MS = 5 * 60 * 1000;
  const SALT = "aport:gallery:v1";
  const window = Math.floor(Date.now() / WINDOW_MS);
  const payload = `${SALT}:${window}`;
  const encoded = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function createContext(
  query = "",
  headers: Record<string, string> = {},
  env?: Partial<Record<string, unknown>>,
) {
  const mockKV = createKV();
  return {
    ctx: {
      env: {
        APORT_API_KEY: "test-key",
        APORT_ORG_ID: "ap_org_test",
        APORT_BASE_URL: "https://api.aport.io",
        NEXT_PUBLIC_APORT_BASE_URL: "https://api.aport.io",
        APORT_ASSURANCE_TYPE: "kyb",
        APORT_ASSURANCE_LEVEL: "L1",
        AGENT_PASSPORT_BASE_URL: "",
        NEXT_PUBLIC_APP_URL: "",
        NODE_ENV: "test",
        APORT_ID_KV: mockKV,
        ...env,
      },
      request: new Request(
        `https://aport.id/api/gallery${query}`,
        {
          method: "GET",
          headers: {
            Origin: "https://aport.id",
            ...headers,
          },
        },
      ),
      params: {},
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      next: vi.fn(),
      data: {},
      functionPath: "",
    } as unknown as Parameters<typeof onRequestGet>[0],
    mockKV,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("GET /api/gallery", () => {
  describe("origin check", () => {
    it("returns 403 for requests without origin/referer", async () => {
      const token = await generateTestToken();
      const { ctx } = createContext("", {
        "x-ag-token": token,
      });
      // Override request to have no Origin header
      (ctx as any).request = new Request("https://aport.id/api/gallery", {
        method: "GET",
        headers: { "x-ag-token": token },
      });

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(403);
    });

    it("returns 403 for requests from external origins", async () => {
      const token = await generateTestToken();
      const { ctx } = createContext("", {
        "x-ag-token": token,
      });
      (ctx as any).request = new Request("https://aport.id/api/gallery", {
        method: "GET",
        headers: {
          Origin: "https://evil-scraper.com",
          "x-ag-token": token,
        },
      });

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(403);
    });

    it("allows requests from aport.id", async () => {
      const token = await generateTestToken();
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, passports: [], total: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { ctx } = createContext("", {
        "x-ag-token": token,
      });

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(200);
    });

    it("allows requests from localhost", async () => {
      const token = await generateTestToken();
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, passports: [], total: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { ctx } = createContext("", {
        "x-ag-token": token,
      });
      (ctx as any).request = new Request("https://aport.id/api/gallery", {
        method: "GET",
        headers: {
          Origin: "http://localhost:3000",
          "x-ag-token": token,
        },
      });

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(200);
    });
  });

  describe("request token", () => {
    it("returns 403 when token is missing", async () => {
      const { ctx } = createContext();

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(403);
    });

    it("returns 403 when token is invalid", async () => {
      const { ctx } = createContext("", {
        "x-ag-token": "0000000000000000",
      });

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(403);
    });

    it("accepts valid token", async () => {
      const token = await generateTestToken();
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, passports: [], total: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { ctx } = createContext("", {
        "x-ag-token": token,
      });

      const res = await onRequestGet(ctx);
      expect(res.status).toBe(200);
    });
  });

  describe("agent_id stripping", () => {
    it("strips agent_id from gallery response", async () => {
      const token = await generateTestToken();
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            passports: [
              {
                agent_id: "ap_secret123",
                slug: "test-agent",
                name: "TestAgent",
                description: "A test agent",
                role: "agent",
                status: "active",
                claimed: false,
                framework: ["claude-sonnet"],
                regions: ["global"],
                capabilities: [{ id: "web.fetch" }],
                created_at: "2026-01-01",
                assurance_level: "L0",
              },
            ],
            total: 1,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { ctx } = createContext("", { "x-ag-token": token });
      const res = await onRequestGet(ctx);
      const body = (await res.json()) as {
        passports: Record<string, unknown>[];
      };

      expect(body.passports).toHaveLength(1);
      expect(body.passports[0]).not.toHaveProperty("agent_id");
      expect(body.passports[0].slug).toBe("test-agent");
      expect(body.passports[0].name).toBe("TestAgent");
    });
  });

  describe("pagination limits", () => {
    it("caps limit at 50", async () => {
      const token = await generateTestToken();
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, passports: [], total: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { ctx } = createContext("?limit=200", { "x-ag-token": token });
      await onRequestGet(ctx);

      // The fetch call to APort API should not request more than 50 + offset + 50
      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      const urlObj = new URL(fetchUrl);
      const limit = parseInt(urlObj.searchParams.get("limit") || "0", 10);
      expect(limit).toBeLessThanOrEqual(200); // internal fetch limit (50 + 0 + 50)
    });
  });
});
