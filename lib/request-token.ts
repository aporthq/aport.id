/**
 * Client-side request token generator.
 * Matches the server-side verification in functions/lib/request-token.ts.
 */

const WINDOW_MS = 5 * 60 * 1000;
const SALT = "aport:gallery:v1";

export async function generateRequestToken(): Promise<string> {
  const window = Math.floor(Date.now() / WINDOW_MS);
  const payload = `${SALT}:${window}`;
  const encoded = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
