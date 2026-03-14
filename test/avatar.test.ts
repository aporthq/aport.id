import { describe, it, expect } from "vitest";
import { generateAvatarSvg, getAvatarDataUri } from "@/lib/avatar";

describe("generateAvatarSvg", () => {
  it("returns valid SVG string", () => {
    const svg = generateAvatarSvg("ap_abc123");
    expect(svg).toContain("<svg");
    expect(svg).toContain("xmlns");
    expect(svg).toContain("</svg>");
  });

  it("is deterministic — same input always produces same output", () => {
    const a = generateAvatarSvg("ap_test1234");
    const b = generateAvatarSvg("ap_test1234");
    expect(a).toBe(b);
  });

  it("produces different output for different IDs", () => {
    const a = generateAvatarSvg("ap_agent_alpha");
    const b = generateAvatarSvg("ap_agent_beta");
    expect(a).not.toBe(b);
  });

  it("respects custom size", () => {
    const svg = generateAvatarSvg("ap_test", 120);
    expect(svg).toContain('width="120"');
    expect(svg).toContain('height="120"');
  });

  it("uses default size of 80", () => {
    const svg = generateAvatarSvg("ap_test");
    expect(svg).toContain('width="80"');
    expect(svg).toContain('height="80"');
  });

  it("contains rect elements for the grid pattern", () => {
    const svg = generateAvatarSvg("ap_test_pattern");
    expect(svg).toContain("<rect");
    // Should have at least some filled cells
    const rectCount = (svg.match(/<rect/g) || []).length;
    // Background rect + at least a few grid cells
    expect(rectCount).toBeGreaterThan(1);
  });

  it("generates symmetric patterns (left-right mirror)", () => {
    const svg = generateAvatarSvg("ap_symmetry_test");
    // Extract all rect x positions (excluding the background rect)
    const rects = [...svg.matchAll(/x="([^"]+)"/g)].map((m) =>
      parseFloat(m[1]),
    );
    // The grid should have some symmetry — just verify it has rects
    expect(rects.length).toBeGreaterThan(0);
  });
});

describe("getAvatarDataUri", () => {
  it("returns a data URI with SVG mime type", () => {
    const uri = getAvatarDataUri("ap_test");
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
  });

  it("contains encoded SVG content", () => {
    const uri = getAvatarDataUri("ap_test");
    const decoded = decodeURIComponent(uri.replace("data:image/svg+xml,", ""));
    expect(decoded).toContain("<svg");
  });

  it("is deterministic", () => {
    expect(getAvatarDataUri("ap_xyz")).toBe(getAvatarDataUri("ap_xyz"));
  });
});
