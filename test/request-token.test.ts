import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { generateRequestToken, verifyRequestToken } = await import(
  "../functions/lib/request-token"
);

describe("request-token", () => {
  describe("generateRequestToken", () => {
    it("returns a 16-char hex string", async () => {
      const token = await generateRequestToken();
      expect(token).toMatch(/^[0-9a-f]{16}$/);
    });

    it("returns the same token within the same 5-min window", async () => {
      const t1 = await generateRequestToken();
      const t2 = await generateRequestToken();
      expect(t1).toBe(t2);
    });

    it("returns a different token in a different window", async () => {
      const t1 = await generateRequestToken();

      // Advance time by 6 minutes
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 6 * 60 * 1000);

      const t2 = await generateRequestToken();
      expect(t2).not.toBe(t1);

      vi.useRealTimers();
    });
  });

  describe("verifyRequestToken", () => {
    it("accepts a valid token for current window", async () => {
      const token = await generateRequestToken();
      const valid = await verifyRequestToken(token);
      expect(valid).toBe(true);
    });

    it("rejects an empty token", async () => {
      expect(await verifyRequestToken("")).toBe(false);
    });

    it("rejects a wrong-length token", async () => {
      expect(await verifyRequestToken("abc")).toBe(false);
    });

    it("rejects a random 16-char string", async () => {
      expect(await verifyRequestToken("0000000000000000")).toBe(false);
    });

    it("accepts token from previous window (boundary handling)", async () => {
      const token = await generateRequestToken();

      // Advance time by 5 minutes (into next window)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 5 * 60 * 1000);

      const valid = await verifyRequestToken(token);
      expect(valid).toBe(true);

      vi.useRealTimers();
    });

    it("rejects token from two windows ago", async () => {
      const token = await generateRequestToken();

      // Advance time by 11 minutes (two windows ahead)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 11 * 60 * 1000);

      const valid = await verifyRequestToken(token);
      expect(valid).toBe(false);

      vi.useRealTimers();
    });
  });
});
