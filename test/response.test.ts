import { describe, it, expect } from "vitest";
import {
  jsonResponse,
  errorResponse,
  successResponse,
} from "../functions/lib/response";

describe("jsonResponse", () => {
  it("returns JSON content type", () => {
    const res = jsonResponse({ test: true });
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("serializes data as JSON body", async () => {
    const res = jsonResponse({ name: "test", value: 42 });
    const body = await res.json();
    expect(body).toEqual({ name: "test", value: 42 });
  });

  it("defaults to 200 status", () => {
    expect(jsonResponse({}).status).toBe(200);
  });

  it("accepts custom status", () => {
    expect(jsonResponse({}, 201).status).toBe(201);
  });

  it("merges custom headers", () => {
    const res = jsonResponse({}, 200, { "Cache-Control": "no-store" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("errorResponse", () => {
  it("returns ok: false with error message", async () => {
    const res = errorResponse("Something failed", 400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Something failed");
  });

  it("uses provided status code", () => {
    expect(errorResponse("not found", 404).status).toBe(404);
    expect(errorResponse("conflict", 409).status).toBe(409);
    expect(errorResponse("rate limited", 429).status).toBe(429);
  });
});

describe("successResponse", () => {
  it("returns ok: true merged with data", async () => {
    const res = successResponse({ agent_id: "ap_123" });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.agent_id).toBe("ap_123");
  });

  it("returns 200 status", () => {
    expect(successResponse({}).status).toBe(200);
  });
});
