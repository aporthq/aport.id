import { describe, it, expect, vi, beforeEach } from "vitest";
import { APortService, createAPortService } from "../functions/lib/services/aport";
import type { AppEnv } from "../functions/lib/types";

const mockEnv: AppEnv = {
  APORT_BASE_URL: "https://api.aport.io",
  APORT_API_KEY: "test-key",
  APORT_ORG_ID: "ap_org_test",
  APORT_ASSURANCE_TYPE: "kyb",
  APORT_ASSURANCE_LEVEL: "L1",
  AGENT_PASSPORT_BASE_URL: "https://agent-passport-api.aport.io",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NODE_ENV: "test",
  KV: {} as KVNamespace,
};

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("createAPortService", () => {
  it("returns an APortService instance", () => {
    const service = createAPortService(mockEnv);
    expect(service).toBeInstanceOf(APortService);
  });
});

describe("APortService.getPassport", () => {
  it("fetches passport with json format by default", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          agent_id: "ap_123",
          name: "TestBot",
          role: "agent",
          status: "active",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const service = createAPortService(mockEnv);
    const result = await service.getPassport("ap_123");

    expect(result.success).toBe(true);
    expect(result.data.agent_id).toBe("ap_123");
    expect(result.data.name).toBe("TestBot");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/passports/ap_123");
    expect(url).toContain("format=json");
  });

  it("passes format parameter", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const service = createAPortService(mockEnv);
    await service.getPassport("ap_123", "vc");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("format=vc");
  });

  it("returns error for missing passport ID", async () => {
    const service = createAPortService(mockEnv);
    const result = await service.getPassport("");
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("required");
  });

  it("handles 404", async () => {
    mockFetch.mockResolvedValue(new Response("", { status: 404 }));

    const service = createAPortService(mockEnv);
    const result = await service.getPassport("ap_notfound");
    expect(result.success).toBe(false);
    expect(result.error?.status).toBe(404);
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const service = createAPortService(mockEnv);
    const result = await service.getPassport("ap_123");
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Network failure");
  });

  it("includes auth header when API key is set", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const service = createAPortService(mockEnv);
    await service.getPassport("ap_123");

    const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
  });
});

describe("APortService.createBuilderPassport", () => {
  it("sends correct payload to org issuance endpoint", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { agent_id: "ap_new123", did: "did:aport:123", claimed: false },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const service = createAPortService(mockEnv);
    const result = await service.createBuilderPassport({
      builderId: "builder_1",
      email: "test@example.com",
      displayName: "TestAgent",
      kycCompleted: false,
      sendClaimEmail: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.passportId).toBe("ap_new123");

    // Check correct endpoint
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain(`/api/orgs/${mockEnv.APORT_ORG_ID}/issue`);

    // Check body
    const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
    expect(body.pending_owner.email).toBe("test@example.com");
    expect(body.send_claim_email).toBe(true);
    expect(body.role).toBe("agent");
  });

  it("fails when org ID is missing", async () => {
    const envNoOrg = { ...mockEnv, APORT_ORG_ID: "" };
    const service = createAPortService(envNoOrg);
    const result = await service.createBuilderPassport({
      builderId: "b1",
      email: "test@example.com",
      kycCompleted: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("APORT_ORG_ID");
  });

  it("handles 409 conflict", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Name already taken" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );

    const service = createAPortService(mockEnv);
    const result = await service.createBuilderPassport({
      builderId: "b1",
      email: "test@example.com",
      kycCompleted: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.status).toBe(409);
  });
});
