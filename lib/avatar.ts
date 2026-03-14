/**
 * Deterministic geometric avatar generator
 *
 * Generates a unique SVG avatar from an agent_id hash.
 * Same ID always produces the same visual — like a fingerprint.
 */

/** Simple hash to get deterministic bytes from a string */
function hashString(str: string): number[] {
  const bytes: number[] = [];
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    bytes.push(Math.abs(h % 256));
  }
  // Pad to at least 32 bytes
  while (bytes.length < 32) {
    h = ((h << 5) - h + bytes.length) | 0;
    bytes.push(Math.abs(h % 256));
  }
  return bytes;
}

const PALETTE = [
  ["#22d3ee", "#06b6d4", "#0891b2"], // cyan
  ["#818cf8", "#6366f1", "#4f46e5"], // indigo
  ["#a78bfa", "#8b5cf6", "#7c3aed"], // violet
  ["#34d399", "#10b981", "#059669"], // emerald
  ["#f472b6", "#ec4899", "#db2777"], // pink
  ["#fb923c", "#f97316", "#ea580c"], // orange
  ["#38bdf8", "#0ea5e9", "#0284c7"], // sky
  ["#a3e635", "#84cc16", "#65a30d"], // lime
];

export function generateAvatarSvg(
  agentId: string,
  size: number = 80,
): string {
  const bytes = hashString(agentId);

  // Pick palette
  const paletteIndex = bytes[0] % PALETTE.length;
  const colors = PALETTE[paletteIndex];

  // Grid: 5x5 with left-right symmetry (only need 3 columns)
  const grid: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    const r: boolean[] = [];
    for (let col = 0; col < 3; col++) {
      r.push(bytes[(row * 3 + col + 1) % bytes.length] % 2 === 0);
    }
    // Mirror: col 3 = col 1, col 4 = col 0
    grid.push([r[0], r[1], r[2], r[1], r[0]]);
  }

  const cellSize = size / 7; // padding included
  const offset = cellSize; // 1 cell padding

  let rects = "";
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (grid[row][col]) {
        const colorIdx = (bytes[(row + col + 2) % bytes.length]) % colors.length;
        rects += `<rect x="${offset + col * cellSize}" y="${offset + row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${colors[colorIdx]}" rx="${cellSize * 0.15}"/>`;
      }
    }
  }

  // Background shape from hash
  const bgOpacity = 0.08 + (bytes[3] % 8) * 0.01;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="rgba(255,255,255,${bgOpacity})"/>
    ${rects}
  </svg>`;
}

/** Returns a data URI for use in <img> tags */
export function getAvatarDataUri(agentId: string, size?: number): string {
  const svg = generateAvatarSvg(agentId, size);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
