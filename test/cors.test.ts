import { describe, it, expect } from "vitest";
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
} from "../functions/lib/cors";

function makeRequest(origin: string, method = "GET"): Request {
  return new Request("https://aport.id/api/test", {
    method,
    headers: { Origin: origin },
  });
}

describe("getCorsHeaders", () => {
  it("allows localhost:3000", () => {
    const headers = getCorsHeaders(makeRequest("http://localhost:3000"));
    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("allows localhost:8789", () => {
    const headers = getCorsHeaders(makeRequest("http://localhost:8789"));
    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:8789",
    );
  });

  it("allows aport.id", () => {
    const headers = getCorsHeaders(makeRequest("https://aport.id"));
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://aport.id");
  });

  it("allows subdomains of aport.id", () => {
    const headers = getCorsHeaders(makeRequest("https://staging.aport.id"));
    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://staging.aport.id",
    );
  });

  it("falls back to default for unknown origins", () => {
    const headers = getCorsHeaders(makeRequest("https://evil.com"));
    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("includes required CORS headers", () => {
    const headers = getCorsHeaders(makeRequest("https://aport.id"));
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(headers["Access-Control-Max-Age"]).toBe("86400");
  });
});

describe("handleCorsPreflightRequest", () => {
  it("returns 204 Response for OPTIONS", () => {
    const res = handleCorsPreflightRequest(
      makeRequest("https://aport.id", "OPTIONS"),
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(204);
  });

  it("returns null for non-OPTIONS", () => {
    expect(
      handleCorsPreflightRequest(makeRequest("https://aport.id", "GET")),
    ).toBeNull();
    expect(
      handleCorsPreflightRequest(makeRequest("https://aport.id", "POST")),
    ).toBeNull();
  });
});
