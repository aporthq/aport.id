/**
 * Slug generation for passport URLs
 *
 * Generates URL-safe slugs from agent names for shareable passport URLs.
 * e.g. "ARIA" → "aria", "Contract Bot 3000" → "contract-bot-3000"
 */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-") // spaces/underscores → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}
