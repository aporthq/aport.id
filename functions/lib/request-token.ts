/**
 * Time-rotating request token for same-app verification.
 *
 * Not a secret — the algorithm is in open source. But it rotates every
 * 5 minutes, so a token copied from DevTools expires quickly, and
 * reproducing it requires reading and reimplementing the code.
 *
 * This is one layer in a stack: origin check + rate limit + rotating token.
 */

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const SALT = "aport:gallery:v1";

function getWindow(now: number): number {
  return Math.floor(now / WINDOW_MS);
}

/**
 * Generate a token for the current time window.
 * Uses Web Crypto API (available in Cloudflare Workers and browsers).
 */
export async function generateRequestToken(): Promise<string> {
  const window = getWindow(Date.now());
  const payload = `${SALT}:${window}`;
  const encoded = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a token is valid for the current or previous time window.
 * Accepts previous window to handle requests near the boundary.
 */
export async function verifyRequestToken(token: string): Promise<boolean> {
  if (!token || token.length !== 16) return false;

  const now = Date.now();
  const currentWindow = getWindow(now);

  // Check current and previous window
  for (const w of [currentWindow, currentWindow - 1]) {
    const payload = `${SALT}:${w}`;
    const encoded = new TextEncoder().encode(payload);
    const hash = await crypto.subtle.digest("SHA-256", encoded);
    const bytes = new Uint8Array(hash);
    const expected = Array.from(bytes.slice(0, 8))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (token === expected) return true;
  }

  return false;
}
